import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

interface RoleBasedRouteProps extends ProtectedRouteProps {
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

/**
 * Loading spinner component shown while checking authentication
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Access denied component shown when user lacks required role
 */
const AccessDenied = ({ requiredRole }: { requiredRole?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
    <p className="text-muted-foreground mb-4">
      {requiredRole
        ? `You need ${requiredRole} access to view this page.`
        : "You don't have permission to view this page."}
    </p>
    <a href="/" className="text-primary hover:underline">
      Return to Home
    </a>
  </div>
);

/**
 * ProtectedRoute - Requires user to be authenticated
 * Redirects to login if not authenticated
 */
export const ProtectedRoute = ({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * RoleBasedRoute - Requires user to have specific role(s)
 * Redirects to login if not authenticated, shows access denied if wrong role
 */
export const RoleBasedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/login",
  fallbackPath = "/",
}: RoleBasedRouteProps) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has one of the allowed roles
  if (!hasRole(allowedRoles)) {
    // Option 1: Show access denied
    return <AccessDenied requiredRole={allowedRoles.join(" or ")} />;
    
    // Option 2: Redirect to fallback path (uncomment if preferred)
    // return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

/**
 * FacultyRoute - Only accessible by faculty and admin
 */
export const FacultyRoute = ({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) => (
  <RoleBasedRoute
    allowedRoles={["faculty", "admin"]}
    redirectTo={redirectTo}
    fallbackPath="/"
  >
    {children}
  </RoleBasedRoute>
);

/**
 * StudentRoute - Only accessible by students and admin
 */
export const StudentRoute = ({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) => (
  <RoleBasedRoute
    allowedRoles={["student", "admin"]}
    redirectTo={redirectTo}
    fallbackPath="/"
  >
    {children}
  </RoleBasedRoute>
);

/**
 * AdminRoute - Only accessible by admins
 */
export const AdminRoute = ({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) => (
  <RoleBasedRoute
    allowedRoles={["admin"]}
    redirectTo={redirectTo}
    fallbackPath="/"
  >
    {children}
  </RoleBasedRoute>
);

/**
 * GuestRoute - Only accessible by non-authenticated users
 * Redirects to home if already authenticated
 */
export const GuestRoute = ({
  children,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // If user was redirected here, go back to where they came from
    const from = (location.state as { from?: Location })?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

/**
 * ConditionalRender - Renders different content based on role
 * Useful for showing/hiding UI elements based on user role
 */
interface ConditionalRenderProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalRender = ({
  roles,
  children,
  fallback = null,
}: ConditionalRenderProps) => {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * FacultyOnly - Only renders for faculty and admin
 */
export const FacultyOnly = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <ConditionalRender roles={["faculty", "admin"]} fallback={fallback}>
    {children}
  </ConditionalRender>
);

/**
 * StudentOnly - Only renders for students
 */
export const StudentOnly = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <ConditionalRender roles={["student"]} fallback={fallback}>
    {children}
  </ConditionalRender>
);

/**
 * AdminOnly - Only renders for admins
 */
export const AdminOnly = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <ConditionalRender roles={["admin"]} fallback={fallback}>
    {children}
  </ConditionalRender>
);

export default ProtectedRoute;
