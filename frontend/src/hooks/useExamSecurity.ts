import { useState, useEffect, useCallback, useRef } from "react";

export interface SecurityViolation {
  type:
    | "fullscreen_exit"
    | "tab_switch"
    | "window_blur"
    | "right_click"
    | "copy_attempt"
    | "screenshot_attempt"
    | "devtools_open"
    | "other";
  timestamp: string;
  description: string;
}

interface UseExamSecurityOptions {
  /** Whether exam security is active */
  enabled: boolean;
  /** Maximum violations before auto-submit (default: 3) */
  maxViolations?: number;
  /** Callback when max violations reached – triggers auto-submit */
  onMaxViolationsReached?: () => void;
  /** Callback whenever a violation occurs */
  onViolation?: (violation: SecurityViolation) => void;
}

interface UseExamSecurityReturn {
  /** Whether browser is currently in fullscreen */
  isFullscreen: boolean;
  /** List of recorded violations */
  violations: SecurityViolation[];
  /** Total violation count */
  violationCount: number;
  /** Whether a warning overlay should be shown */
  showWarning: boolean;
  /** Current warning message */
  warningMessage: string;
  /** Enter fullscreen mode */
  enterFullscreen: () => Promise<void>;
  /** Exit fullscreen mode (only call on quiz completion) */
  exitFullscreen: () => Promise<void>;
  /** Dismiss the warning overlay and re-enter fullscreen */
  dismissWarning: () => void;
  /** Max violations allowed */
  maxViolations: number;
}

export function useExamSecurity({
  enabled,
  maxViolations = 3,
  onMaxViolationsReached,
  onViolation,
}: UseExamSecurityOptions): UseExamSecurityReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Use refs for callbacks to avoid stale closures
  const onMaxViolationsRef = useRef(onMaxViolationsReached);
  const onViolationRef = useRef(onViolation);
  const violationsRef = useRef(violations);
  const enabledRef = useRef(enabled);
  // Track whether we intentionally exited fullscreen (quiz finished)
  const intentionalExitRef = useRef(false);

  useEffect(() => {
    onMaxViolationsRef.current = onMaxViolationsReached;
  }, [onMaxViolationsReached]);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const addViolation = useCallback(
    (type: SecurityViolation["type"], description: string) => {
      if (!enabledRef.current) return;

      const violation: SecurityViolation = {
        type,
        timestamp: new Date().toISOString(),
        description,
      };

      setViolations((prev) => {
        const updated = [...prev, violation];

        // Check max violations
        if (updated.length >= maxViolations) {
          setWarningMessage(
            `You have reached the maximum number of security violations (${maxViolations}). Your quiz will be auto-submitted.`
          );
          setShowWarning(true);
          // Defer the callback to avoid state update during render
          setTimeout(() => {
            onMaxViolationsRef.current?.();
          }, 1500);
        } else {
          setWarningMessage(
            `Security violation detected: ${description}. You have ${
              maxViolations - updated.length
            } warning(s) remaining before auto-submission.`
          );
          setShowWarning(true);
        }

        return updated;
      });

      onViolationRef.current?.(violation);
    },
    [maxViolations]
  );

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      intentionalExitRef.current = false;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Failed to enter fullscreen:", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    intentionalExitRef.current = true;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.warn("Failed to exit fullscreen:", err);
    }
  }, []);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    setWarningMessage("");
    // Re-enter fullscreen after dismissing warning
    if (enabledRef.current && violationsRef.current.length < maxViolations) {
      enterFullscreen();
    }
  }, [enterFullscreen, maxViolations]);

  // Track fullscreen changes
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);

      // If fullscreen was exited and it wasn't intentional, record violation
      if (!isFS && !intentionalExitRef.current && enabledRef.current) {
        addViolation("fullscreen_exit", "Exited fullscreen mode during exam");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [enabled, addViolation]);

  // Track tab/window visibility
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && enabledRef.current) {
        addViolation("tab_switch", "Switched to another tab or window");
      }
    };

    const handleWindowBlur = () => {
      if (enabledRef.current) {
        addViolation("window_blur", "Window lost focus");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Note: we don't add window blur separately to avoid double-counting with visibilitychange
    // window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, addViolation]);

  // Block right-click, copy, and common shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("right_click", "Attempted to open context menu");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copy_attempt", "Attempted to copy content");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common escape/cheat shortcuts
      const blocked = [
        // Prevent Escape from exiting fullscreen (we handle it ourselves)
        e.key === "Escape",
        // Ctrl/Cmd + C (copy)
        (e.ctrlKey || e.metaKey) && e.key === "c",
        // Ctrl/Cmd + V (paste)
        (e.ctrlKey || e.metaKey) && e.key === "v",
        // Ctrl/Cmd + A (select all)
        (e.ctrlKey || e.metaKey) && e.key === "a",
        // Ctrl/Cmd + P (print)
        (e.ctrlKey || e.metaKey) && e.key === "p",
        // Ctrl/Cmd + S (save)
        (e.ctrlKey || e.metaKey) && e.key === "s",
        // PrintScreen
        e.key === "PrintScreen",
        // F12 (devtools)
        e.key === "F12",
        // Ctrl/Cmd + Shift + I (devtools)
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I",
        // Ctrl/Cmd + Shift + J (console)
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J",
        // Ctrl/Cmd + U (view source)
        (e.ctrlKey || e.metaKey) && e.key === "u",
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "PrintScreen") {
          addViolation("screenshot_attempt", "Attempted to take a screenshot");
        } else if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J"))) {
          addViolation("devtools_open", "Attempted to open developer tools");
        }
        // Don't add violations for every blocked key – only significant ones
      }
    };

    // Disable text selection during exam
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [enabled, addViolation]);

  // Prevent page navigation during exam
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You are in the middle of an exam. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  return {
    isFullscreen,
    violations,
    violationCount: violations.length,
    showWarning,
    warningMessage,
    enterFullscreen,
    exitFullscreen,
    dismissWarning,
    maxViolations,
  };
}
