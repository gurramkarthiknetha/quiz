import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics?: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalAttempts: number;
    passRate: number;
    averageTime: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 - Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith("/login") && 
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login?error=Session expired. Please login again.";
      }
    }

    // Handle 403 - Forbidden (role mismatch)
    if (error.response?.status === 403) {
      // Redirect to unauthorized page
      if (!window.location.pathname.startsWith("/unauthorized")) {
        window.location.href = "/unauthorized";
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse>("/api/auth/login", { email, password }),

  register: (name: string, email: string, password: string, role?: string) =>
    api.post<ApiResponse>("/api/auth/register", { name, email, password, role }),

  logout: () => api.post<ApiResponse>("/api/auth/logout"),

  getMe: () => api.get<ApiResponse>("/api/auth/me"),

  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    api.put<ApiResponse>("/api/auth/profile", data),

  updatePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse>("/api/auth/password", { currentPassword, newPassword }),

  getRole: () => api.get<ApiResponse>("/api/auth/role"),
};

// ==================== ADMIN API ====================
export const adminApi = {
  // Get all users with pagination and filters
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get<ApiResponse>("/api/auth/users", { params }),

  // Update user role
  updateUserRole: (userId: string, role: string) =>
    api.put<ApiResponse>(`/api/auth/users/${userId}/role`, { role }),

  // Deactivate user
  deactivateUser: (userId: string) =>
    api.put<ApiResponse>(`/api/auth/users/${userId}/deactivate`),

  // Activate user
  activateUser: (userId: string) =>
    api.put<ApiResponse>(`/api/auth/users/${userId}/activate`),

  // Delete user
  deleteUser: (userId: string) =>
    api.delete<ApiResponse>(`/api/admin/users/${userId}`),

  // Get system analytics
  getSystemAnalytics: () => api.get<ApiResponse>("/api/admin/analytics"),

  // Get admin dashboard
  getDashboard: () => api.get<ApiResponse>("/api/admin/dashboard"),

  // Get pending faculty registrations
  getPendingFaculty: () => api.get<ApiResponse>("/api/admin/pending-faculty"),

  // Approve faculty registration
  approveFaculty: (userId: string, note?: string) =>
    api.put<ApiResponse>(`/api/admin/faculty/${userId}/approve`, { note }),

  // Reject faculty registration
  rejectFaculty: (userId: string, reason: string) =>
    api.put<ApiResponse>(`/api/admin/faculty/${userId}/reject`, { reason }),
};

// ==================== QUIZ API ====================
export const quizApi = {
  // Get all quizzes (public + user's own)
  getQuizzes: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    tags?: string; 
    examMode?: string;
    difficulty?: string;
    topic?: string;
    isPublic?: boolean;
    isPublished?: boolean;
  }) => api.get<ApiResponse>("/api/quizzes", { params }),

  // Get user's created quizzes (faculty)
  getMyQuizzes: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>("/api/quizzes/my", { params }),

  // Get single quiz
  getQuiz: (id: string) => api.get<ApiResponse>(`/api/quizzes/${id}`),

  // Create quiz (faculty only)
  createQuiz: (data: {
    title: string;
    description?: string;
    sourceText?: string;
    questions: unknown[];
    settings?: unknown;
    topics?: string[];
    topic?: string;
    difficulty?: string;
    timeLimit?: number;
    isPublic?: boolean;
    isPublished?: boolean;
    tags?: string[];
  }) => api.post<ApiResponse>("/api/quizzes", data),

  // Update quiz (faculty - own quiz only)
  updateQuiz: (id: string, data: Partial<{
    title: string;
    description: string;
    questions: unknown[];
    settings: unknown;
    topics: string[];
    topic: string;
    difficulty: string;
    timeLimit: number;
    isPublic: boolean;
    isPublished: boolean;
    tags: string[];
  }>) => api.put<ApiResponse>(`/api/quizzes/${id}`, data),

  // Delete quiz (faculty - own quiz only)
  deleteQuiz: (id: string) => api.delete<ApiResponse>(`/api/quizzes/${id}`),

  // Submit quiz attempt (student)
  submitAttempt: (quizId: string, data: {
    answers: { questionId: string; selectedAnswer: string | string[] }[];
    timeTaken: number;
    securityViolations?: { type: string; timestamp: string; description: string }[];
    fullscreenEnforced?: boolean;
    autoSubmitted?: boolean;
    autoSubmitReason?: string | null;
  }) => api.post<ApiResponse>(`/api/quizzes/${quizId}/attempt`, data),

  // Get quiz attempts (faculty - for their quiz)
  getQuizAttempts: (quizId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/api/quizzes/${quizId}/attempts`, { params }),

  // Get user's attempt history
  getMyAttempts: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>("/api/quizzes/attempts/history", { params }),
};

// ==================== RESULTS API ====================
export const resultsApi = {
  // Get user's own results (student)
  getMyResults: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>("/api/results/me", { params }),

  // Get single result detail
  getResultDetail: (attemptId: string) =>
    api.get<ApiResponse>(`/api/results/${attemptId}`),

  // Get results for a specific quiz (faculty)
  getQuizResults: (quizId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/api/results/quiz/${quizId}`, { params }),

  // Get student results (faculty view)
  getStudentResults: (studentId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/api/results/student/${studentId}`, { params }),
};

// ==================== ANALYTICS API ====================
export const analyticsApi = {
  // Get user's own analytics (student)
  getMyAnalytics: () => api.get<ApiResponse>("/api/analytics/me"),

  // Get quiz analytics (faculty - for their quiz)
  getQuizAnalytics: (quizId: string) =>
    api.get<ApiResponse>(`/api/analytics/quiz/${quizId}`),

  // Get class/overall analytics (faculty)
  getClassAnalytics: (params?: { quizId?: string }) =>
    api.get<ApiResponse>("/api/analytics/class", { params }),

  // Get weak topics (student)
  getWeakTopics: () => api.get<ApiResponse>("/api/analytics/weak-topics"),

  // Get performance history (student)
  getPerformanceHistory: (params?: { period?: string }) =>
    api.get<ApiResponse>("/api/analytics/performance-history", { params }),
};

// ==================== UPLOAD API ====================
export const uploadApi = {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<ApiResponse>("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

// ==================== PROFILE API ====================
export const profileApi = {
  // Get current user's full profile with gamification
  getMyProfile: () => api.get<ApiResponse>("/api/users/me"),

  // Update profile (name, avatar, password)
  updateMyProfile: (data: {
    name?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => api.put<ApiResponse>("/api/users/me", data),

  // Get gamification stats only
  getMyGamification: () => api.get<ApiResponse>("/api/users/me/gamification"),
};

// ==================== LEADERBOARD API ====================
export const leaderboardApi = {
  getLeaderboard: () => api.get<ApiResponse>("/api/leaderboard"),
};

// ==================== GENERATE API ====================
export const generateApi = {
  generateQuiz: (text: string, settings: unknown) =>
    api.post<ApiResponse>("/api/generate/quiz", { text, settings }),
};

// ==================== NOTES API ====================
export const notesApi = {
  // Get published notes (student browse)
  getPublishedNotes: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    subject?: string;
    topic?: string;
  }) => api.get<ApiResponse>("/api/notes", { params }),

  // Get subjects for filter
  getSubjects: () => api.get<ApiResponse>("/api/notes/subjects"),

  // Get faculty's own notes
  getMyNotes: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ApiResponse>("/api/notes/my", { params }),

  // Get single note
  getNote: (id: string) => api.get<ApiResponse>(`/api/notes/${id}`),

  // Create note (with optional file)
  createNote: (data: FormData) =>
    api.post<ApiResponse>("/api/notes", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Update note (with optional file)
  updateNote: (id: string, data: FormData) =>
    api.put<ApiResponse>(`/api/notes/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Delete note
  deleteNote: (id: string) => api.delete<ApiResponse>(`/api/notes/${id}`),

  // Toggle publish
  togglePublish: (id: string) =>
    api.patch<ApiResponse>(`/api/notes/${id}/publish`),
};

// Export default instance for custom requests
export default api;
