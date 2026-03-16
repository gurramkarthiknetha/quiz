import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { quizApi, analyticsApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  BookOpen,
  Users,
  Trophy,
  BarChart3,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  timeLimit?: number;
  isPublic: boolean;
  isPublished: boolean;
  questions: unknown[];
  createdAt: string;
  settings?: { examMode?: string };
}

interface ClassAnalytics {
  overview: {
    totalQuizzes: number;
    totalStudents: number;
    totalAttempts: number;
    averageScore: string;
  };
  quizSummary: Array<{
    quizId: string;
    title: string;
    totalAttempts: number;
    averageScore: string;
    passRate: number;
  }>;
  topPerformers: Array<{
    student: { name: string; email: string; avatar?: string };
    averageScore: string;
    quizzesTaken: number;
  }>;
}

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [quizzesRes, analyticsRes] = await Promise.all([
          quizApi.getMyQuizzes({ limit: 10 }),
          analyticsApi.getClassAnalytics(),
        ]);

        setQuizzes(quizzesRes.data.data as Quiz[]);
        setAnalytics(analyticsRes.data.data as ClassAnalytics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDeleteQuiz = async () => {
    if (!deleteQuizId) return;

    try {
      await quizApi.deleteQuiz(deleteQuizId);
      setQuizzes((prev) => prev.filter((q) => q._id !== deleteQuizId));
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    } finally {
      setDeleteQuizId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Link to="/">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.totalQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground">Quizzes created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Unique participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.totalAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">Quiz submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>
      </div>

      {/* Ongoing Quizzes - Published quizzes visible to students */}
      {quizzes.some(q => q.isPublished) && (
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <BookOpen className="h-5 w-5" />
              Ongoing Quizzes
            </CardTitle>
            <CardDescription>Published quizzes currently available to students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.filter(q => q.isPublished).map((quiz) => (
                <div key={quiz._id} className="p-4 border rounded-lg bg-white dark:bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="bg-green-600">Live</Badge>
                    <Badge variant={quiz.isPublic ? "outline" : "secondary"}>
                      {quiz.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <h4 className="font-medium truncate mb-2">{quiz.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {quiz.questions?.length || 0} questions
                    {quiz.timeLimit && ` • ${quiz.timeLimit} min`}
                  </p>
                  <div className="flex gap-2">
                    <Link to={`/quiz/${quiz._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </Button>
                    </Link>
                    <Link to={`/faculty/edit-quiz/${quiz._id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Quizzes
            </CardTitle>
            <CardDescription>Manage your created quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{quiz.title}</h4>
                          <Badge variant={quiz.isPublic ? "default" : "secondary"}>
                            {quiz.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quiz.questions?.length || 0} questions •{" "}
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/faculty/quiz/${quiz._id}/analytics`)}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/faculty/quiz/${quiz._id}/results`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Results
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/faculty/edit-quiz/${quiz._id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteQuizId(quiz._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No quizzes created yet</p>
                    <Link to="/">
                      <Button>Create Your First Quiz</Button>
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Best performing students across your quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {analytics?.topPerformers && analytics.topPerformers.length > 0 ? (
                  analytics.topPerformers.map((performer, index) => (
                    <div
                      key={performer.student.email}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{performer.student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {performer.quizzesTaken} quizzes taken
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">{performer.averageScore}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No student data available yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Performance Summary */}
      {analytics?.quizSummary && analytics.quizSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quiz Performance Summary
            </CardTitle>
            <CardDescription>Overview of all your quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analytics.quizSummary.map((quiz) => (
                <div key={quiz.quizId} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 truncate">{quiz.title}</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Attempts</p>
                      <p className="font-bold">{quiz.totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Score</p>
                      <p className="font-bold">{quiz.averageScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pass Rate</p>
                      <p className="font-bold">{quiz.passRate.toFixed(0)}%</p>
                    </div>
                  </div>
                  <Link
                    to={`/faculty/quiz/${quiz.quizId}/analytics`}
                    className="mt-3 block"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz
              and all associated data including student attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FacultyDashboard;
