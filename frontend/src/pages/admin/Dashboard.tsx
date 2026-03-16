import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  FileQuestion,
  TrendingUp,
  UserPlus,
  Activity,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  counts: {
    users: number;
    quizzes: number;
    attempts: number;
  };
  roleDistribution: Record<string, number>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    avatar?: string;
  }>;
  recentQuizzes: Array<{
    _id: string;
    title: string;
    createdAt: string;
    isPublic: boolean;
    creator?: { name: string; email: string };
  }>;
}

interface SystemAnalytics {
  users: {
    total: number;
    byRole: Record<string, number>;
    activeLastMonth: number;
    recentSignups: number;
  };
  quizzes: {
    total: number;
    public: number;
    private: number;
  };
  attempts: {
    total: number;
    averageScore: string;
    recentWeek: number;
  };
  activityTrend: Array<{ _id: string; count: number }>;
}

interface PendingFaculty {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [pendingFaculty, setPendingFaculty] = useState<PendingFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, analyticsRes, pendingRes] = await Promise.all([
          adminApi.getUsers({ limit: 1 }).then(() =>
            // Fetch dashboard summary (we'll create a custom call)
            fetch(`${import.meta.env.VITE_SERVER_URI}/api/admin/dashboard`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }).then((r) => r.json())
          ),
          adminApi.getSystemAnalytics(),
          adminApi.getPendingFaculty(),
        ]);

        setDashboard(dashboardRes.data as DashboardData);
        setAnalytics(analyticsRes.data.data as SystemAnalytics);
        setPendingFaculty(pendingRes.data.data as PendingFaculty[]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApproveFaculty = async (userId: string) => {
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await adminApi.approveFaculty(userId);
      setPendingFaculty((prev) => prev.filter((f) => f._id !== userId));
      toast.success("Faculty approved successfully");
    } catch (error) {
      toast.error("Failed to approve faculty");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRejectFaculty = async (userId: string) => {
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await adminApi.rejectFaculty(userId, "Application rejected by administrator");
      setPendingFaculty((prev) => prev.filter((f) => f._id !== userId));
      toast.success("Faculty rejected");
    } catch (error) {
      toast.error("Failed to reject faculty");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "faculty":
        return "default";
      case "student":
      default:
        return "secondary";
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Link to="/admin/users">
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.users.recentSignups || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.quizzes.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.quizzes.public || 0} public, {analytics?.quizzes.private || 0} private
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.attempts.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.attempts.recentWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.attempts.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Faculty Approvals */}
      {pendingFaculty.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Faculty Approvals
              <Badge variant="secondary" className="ml-2">
                {pendingFaculty.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Faculty registrations awaiting your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingFaculty.map((faculty) => (
                <div
                  key={faculty._id}
                  className="flex items-center justify-between p-4 bg-background border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={faculty.avatar} />
                      <AvatarFallback>
                        {faculty.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{faculty.name}</p>
                      <p className="text-sm text-muted-foreground">{faculty.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Registered {new Date(faculty.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApproveFaculty(faculty._id)}
                      disabled={processingIds.has(faculty._id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRejectFaculty(faculty._id)}
                      disabled={processingIds.has(faculty._id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Distribution by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(analytics?.users.byRole || {}).map(([role, count]) => (
              <div
                key={role}
                className="p-4 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{role}s</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <Badge variant={getRoleBadgeVariant(role)} className="h-8 px-3">
                  {role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Recent Users
            </CardTitle>
            <CardDescription>Newly registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {dashboard?.recentUsers && dashboard.recentUsers.length > 0 ? (
                  dashboard.recentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent users
                  </p>
                )}
              </div>
            </ScrollArea>
            <Link to="/admin/users" className="mt-4 block">
              <Button variant="outline" className="w-full">
                View All Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Quizzes
            </CardTitle>
            <CardDescription>Latest created quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {dashboard?.recentQuizzes && dashboard.recentQuizzes.length > 0 ? (
                  dashboard.recentQuizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {quiz.creator?.name || "Unknown"}
                        </p>
                      </div>
                      <Badge variant={quiz.isPublic ? "default" : "secondary"}>
                        {quiz.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent quizzes
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Activity Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Platform statistics and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Active Users (30 days)</p>
              <p className="text-2xl font-bold">{analytics?.users.activeLastMonth || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Quiz Attempts (7 days)</p>
              <p className="text-2xl font-bold">{analytics?.attempts.recentWeek || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">New Signups (7 days)</p>
              <p className="text-2xl font-bold">{analytics?.users.recentSignups || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
