import { AlertTriangle, Shield, ShieldAlert, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ExamSecurityOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Warning message to display */
  message: string;
  /** Current violation count */
  violationCount: number;
  /** Maximum violations allowed */
  maxViolations: number;
  /** Whether max violations have been reached (auto-submit triggered) */
  isAutoSubmitting: boolean;
  /** Dismiss warning and re-enter fullscreen */
  onDismiss: () => void;
}

export function ExamSecurityOverlay({
  visible,
  message,
  violationCount,
  maxViolations,
  isAutoSubmitting,
  onDismiss,
}: ExamSecurityOverlayProps) {
  if (!visible) return null;

  const violationPercentage = (violationCount / maxViolations) * 100;
  const isMaxReached = violationCount >= maxViolations;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-md w-full border-destructive/50 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
              isMaxReached
                ? "bg-destructive/20 text-destructive"
                : "bg-yellow-500/20 text-yellow-500"
            }`}
          >
            {isMaxReached ? (
              <ShieldAlert className="h-10 w-10" />
            ) : (
              <AlertTriangle className="h-10 w-10" />
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold mb-2">
              {isMaxReached ? "Exam Auto-Submitted" : "Security Warning"}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Violation Counter */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Violations</span>
              <span
                className={`font-semibold ${
                  isMaxReached
                    ? "text-destructive"
                    : violationCount >= maxViolations - 1
                    ? "text-yellow-500"
                    : "text-foreground"
                }`}
              >
                {violationCount} / {maxViolations}
              </span>
            </div>
            <Progress
              value={violationPercentage}
              className={`h-2 ${
                isMaxReached ? "[&>div]:bg-destructive" : "[&>div]:bg-yellow-500"
              }`}
            />
          </div>

          {/* Warning List */}
          <div className="bg-muted/50 rounded-lg p-4 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Do not exit fullscreen mode</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Do not switch tabs or windows</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Right-click and copy are disabled</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>DevTools and screenshots are blocked</span>
            </div>
          </div>

          {/* Action Button */}
          {isAutoSubmitting ? (
            <div className="flex items-center justify-center gap-2 text-destructive">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-destructive" />
              <span className="text-sm font-medium">Submitting your exam...</span>
            </div>
          ) : (
            <Button onClick={onDismiss} className="w-full" size="lg">
              <Maximize className="mr-2 h-4 w-4" />
              Return to Fullscreen & Continue
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
