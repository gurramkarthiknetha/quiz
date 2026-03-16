import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

// User role types
export type UserRole = "student" | "faculty" | "admin";

// User interface matching backend
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  authProvider: "local" | "google";
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Registration result type
interface RegisterResult {
  pendingApproval: boolean;
  email?: string;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  loginWithGoogle: (role?: UserRole) => void;
  handleGoogleCallback: (token: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isFaculty: () => boolean;
  isStudent: () => boolean;
  isAdmin: () => boolean;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const serverUri = import.meta.env.VITE_SERVER_URI;

  // Helper to make API calls
  const apiCall = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${serverUri}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "An error occurred");
    }

    return data;
  }, [serverUri]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const data = await apiCall("/api/auth/me");
        setState({
          user: data.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem("token");
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, [apiCall]);

  // Login with email and password
  const login = async (email: string, password: string) => {
    const data = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { token, ...user } = data.data;
    localStorage.setItem("token", token);
    
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  // Register new user
  const register = async (
    name: string,
    email: string,
    password: string,
    role?: UserRole
  ) => {
    const data = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });

    // If pending approval (faculty), don't set authenticated state
    if (data.data.pendingApproval) {
      return { pendingApproval: true, email };
    }

    const { token, ...user } = data.data;
    localStorage.setItem("token", token);
    
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    return { pendingApproval: false };
  };

  // Logout
  const logout = async () => {
    try {
      await apiCall("/api/auth/logout", { method: "POST" });
    } catch (error) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem("token");
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // Initiate Google OAuth login with optional role
  const loginWithGoogle = (role?: UserRole) => {
    const url = role 
      ? `${serverUri}/api/auth/google?role=${role}`
      : `${serverUri}/api/auth/google`;
    window.location.href = url;
  };

  // Handle Google OAuth callback
  const handleGoogleCallback = async (token: string) => {
    localStorage.setItem("token", token);
    
    try {
      const data = await apiCall("/api/auth/me");
      setState({
        user: data.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem("token");
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    const response = await apiCall("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    setState(prev => ({
      ...prev,
      user: { ...prev.user!, ...response.data },
    }));
  };

  // Refresh user data
  const refreshUser = async () => {
    const data = await apiCall("/api/auth/me");
    setState(prev => ({
      ...prev,
      user: data.data,
    }));
  };

  // Check if user has a specific role
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(state.user.role);
    }
    
    return state.user.role === role;
  };

  // Convenience methods for role checking
  const isFaculty = () => hasRole(["faculty", "admin"]);
  const isStudent = () => hasRole("student");
  const isAdmin = () => hasRole("admin");

  // Get dashboard path based on role
  const getDashboardPath = (): string => {
    if (!state.user) return "/login";
    switch (state.user.role) {
      case "admin":
        return "/admin/dashboard";
      case "faculty":
        return "/faculty/dashboard";
      case "student":
      default:
        return "/student/dashboard";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        loginWithGoogle,
        handleGoogleCallback,
        updateProfile,
        refreshUser,
        hasRole,
        isFaculty,
        isStudent,
        isAdmin,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
