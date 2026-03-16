import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * AuthCallback - Handles OAuth redirect from Google
 * Extracts token from URL and updates auth state
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback, getDashboardPath, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const processCallback = async () => {
      const success = searchParams.get("success");
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      // Handle error case
      if (error) {
        setStatus("error");
        setMessage(decodeURIComponent(error));
        toast.error(`Authentication failed: ${decodeURIComponent(error)}`);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      // Handle success case
      if (success === "true" && token) {
        try {
          await handleGoogleCallback(token);
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          toast.success("Welcome! You're now signed in.");
          // Redirect to role-based dashboard
          setTimeout(() => navigate("/dashboard"), 1500);
        } catch (err) {
          setStatus("error");
          setMessage(err instanceof Error ? err.message : "Failed to complete authentication");
          toast.error("Authentication failed. Please try again.");
          setTimeout(() => navigate("/login"), 3000);
        }
      } else {
        // No valid params, redirect to login
        setStatus("error");
        setMessage("Invalid callback. Please try again.");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Processing...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-green-600">Success!</h2>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
          </>
        )}

        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
