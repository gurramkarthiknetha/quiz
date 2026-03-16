import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QuizProvider } from "@/context/QuizContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import {
  ProtectedRoute,
  FacultyRoute,
  StudentRoute,
  AdminRoute,
  GuestRoute,
} from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import PendingApproval from "./pages/PendingApproval";

// Shared protected pages
import QuizPreview from "./pages/QuizPreview";
import QuizMode from "./pages/QuizMode";
import QuizAttempt from "./pages/QuizAttempt";

// Role-specific dashboards
import StudentDashboard from "./pages/student/Dashboard";
import StudentResults from "./pages/student/Results";
import StudentBrowseQuizzes from "./pages/student/BrowseQuizzes";
import StudentMyProfile from "./pages/student/MyProfile";
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyQuizResults from "./pages/faculty/QuizResults";
import FacultyMyQuizzes from "./pages/faculty/MyQuizzes";
import FacultyCreateQuiz from "./pages/faculty/CreateQuiz";
import FacultyEditQuiz from "./pages/faculty/EditQuiz";
import FacultyMyNotes from "./pages/faculty/MyNotes";
import FacultyCreateEditNote from "./pages/faculty/CreateEditNote";
import FacultyAttemptDetail from "./pages/faculty/AttemptDetail";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPendingFaculty from "./pages/admin/PendingFaculty";
import StudentBrowseNotes from "./pages/student/BrowseNotes";
import StudentResultDetail from "./pages/student/ResultDetail";

const queryClient = new QueryClient();

/**
 * Redirects authenticated users to their role-specific dashboard
 */
const DashboardRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "faculty":
      return <Navigate to="/faculty/dashboard" replace />;
    case "student":
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <QuizProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Auth routes (guest only) */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestRoute>
                      <Register />
                    </GuestRoute>
                  }
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                
                {/* Dashboard redirect - goes to role-specific dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardRedirect />
                    </ProtectedRoute>
                  }
                />
                
                {/* Student routes */}
                <Route
                  path="/student/dashboard"
                  element={
                    <StudentRoute>
                      <StudentDashboard />
                    </StudentRoute>
                  }
                />
                <Route
                  path="/student/results"
                  element={
                    <StudentRoute>
                      <StudentResults />
                    </StudentRoute>
                  }
                />
                <Route
                  path="/student/quizzes"
                  element={
                    <StudentRoute>
                      <StudentBrowseQuizzes />
                    </StudentRoute>
                  }
                />
                <Route
                  path="/student/profile"
                  element={
                    <StudentRoute>
                      <StudentMyProfile />
                    </StudentRoute>
                  }
                />
                <Route
                  path="/student/notes"
                  element={
                    <StudentRoute>
                      <StudentBrowseNotes />
                    </StudentRoute>
                  }
                />
                <Route
                  path="/student/results/:attemptId"
                  element={
                    <StudentRoute>
                      <StudentResultDetail />
                    </StudentRoute>
                  }
                />
                
                {/* Faculty routes */}
                <Route
                  path="/faculty/dashboard"
                  element={
                    <FacultyRoute>
                      <FacultyDashboard />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/quiz-results"
                  element={
                    <FacultyRoute>
                      <FacultyQuizResults />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/quiz-results/:quizId"
                  element={
                    <FacultyRoute>
                      <FacultyQuizResults />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/quizzes"
                  element={
                    <FacultyRoute>
                      <FacultyMyQuizzes />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/create-quiz"
                  element={
                    <FacultyRoute>
                      <FacultyCreateQuiz />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/edit-quiz/:quizId"
                  element={
                    <FacultyRoute>
                      <FacultyEditQuiz />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/notes"
                  element={
                    <FacultyRoute>
                      <FacultyMyNotes />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/create-note"
                  element={
                    <FacultyRoute>
                      <FacultyCreateEditNote />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/edit-note/:noteId"
                  element={
                    <FacultyRoute>
                      <FacultyCreateEditNote />
                    </FacultyRoute>
                  }
                />
                <Route
                  path="/faculty/results/:attemptId"
                  element={
                    <FacultyRoute>
                      <FacultyAttemptDetail />
                    </FacultyRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/pending-faculty"
                  element={
                    <AdminRoute>
                      <AdminPendingFaculty />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                
                {/* Shared protected routes (any authenticated user) */}
                <Route
                  path="/preview"
                  element={
                    <ProtectedRoute>
                      <QuizPreview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz"
                  element={
                    <ProtectedRoute>
                      <QuizMode />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz/:quizId"
                  element={
                    <ProtectedRoute>
                      <QuizAttempt />
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
