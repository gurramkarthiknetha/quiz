import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { analyticsApi, quizApi, resultsApi, profileApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  TrendingUp,
  Trophy,
  Clock,
  Target,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Play,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import XPCard from "@/components/gamification/XPCard";
import LeaderboardPreview from "@/components/gamification/LeaderboardPreview";

interface AnalyticsData {
  overview: {
    totalQuizzesTaken: number;
    averageScore: string;
    highestScore: number;
    totalTimeTaken: number;
    passRate: number;
  };
  topicAnalytics: Array<{
    topic: string;
    averageScore: string;
    attempts: number;
  }>;
  performanceTrend: Array<{
    date: string;
    score: number;
    quizTitle: string;
  }>;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  timeLimit?: number;
  questionCount?: number;
  isPublic?: boolean;
  isPublished?: boolean;
  settings?: { examMode?: string };
  creator?: { name: string };
}

interface Result {
  _id: string;
  quiz: { title: string };
  score: number;
  completedAt: string;
  timeTaken: number;
}

interface WeakTopic {
  topic: string;
  averageScore: number;
  attemptCount: number;
}

interface GamificationData {
  xp: number;
  level: number;
  xpProgress: {
    currentXp: number;
    currentLevel: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progressPercent: number;
    xpToNextLevel: number;
  };
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, quizzesRes, resultsRes, weakTopicsRes, profileRes] = await Promise.all([
          analyticsApi.getMyAnalytics().catch(() => ({ data: { data: null } })),
          quizApi.getQuizzes({ limit: 6, isPublic: true, isPublished: true }).catch(() => ({ data: { data: [] } })),
          resultsApi.getMyResults({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          analyticsApi.getWeakTopics().catch(() => ({ data: { data: [] } })),
          profileApi.getMyProfile().catch(() => ({ data: { data: null } })),
        ]);

        setAnalytics(analyticsRes.data?.data as AnalyticsData || null);
        setQuizzes((quizzesRes.data?.data as Quiz[]) || []);
        setRecentResults((resultsRes.data?.data as Result[]) || []);
        setWeakTopics((weakTopicsRes.data?.data as WeakTopic[]) || []);
        if (profileRes.data?.data) {
          const p = profileRes.data.data as any;
          setGamification({ xp: p.xp, level: p.level, xpProgress: p.xpProgress });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Track your learning progress and take quizzes</p>
        </div>
        <Link to="/student/quizzes">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Browse All Quizzes
          </Button>
        </Link>
      </div>

      {/* Gamification Row */}
      {gamification && (
        <div className="grid gap-4 md:grid-cols-2">
          <XPCard
            xp={gamification.xp}
            level={gamification.level}
            xpProgress={gamification.xpProgress}
          />
          <LeaderboardPreview limit={5} currentUserId={user?._id} />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.totalQuizzesTaken || 0}</div>
            <p className="text-xs text-muted-foreground">Total completed quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.averageScore || 0}%</div>
            <Progress value={parseFloat(analytics?.overview.averageScore || "0")} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.highestScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.passRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Quizzes passed (≥60%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ongoing Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Ongoing Quizzes
            </CardTitle>
            <CardDescription>Published quizzes available for you to attempt</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {quizzes && quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{quiz.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {quiz.description || quiz.topic || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {quiz.difficulty && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                quiz.difficulty === 'easy' ? 'border-green-500 text-green-600' :
                                quiz.difficulty === 'hard' ? 'border-red-500 text-red-600' :
                                'border-yellow-500 text-yellow-600'
                              }`}
                            >
                              {quiz.difficulty}
                            </Badge>
                          )}
                          {quiz.questionCount && (
                            <span className="text-xs text-muted-foreground">
                              {quiz.questionCount} questions
                            </span>
                          )}
                          {quiz.timeLimit && quiz.timeLimit > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {quiz.timeLimit} min
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to={`/quiz/${quiz._id}`}>
                        <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No quizzes available yet. Check back soon!
                  </p>
                )}
              </div>
            </ScrollArea>
            <Link to="/student/quizzes" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Browse All Quizzes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Results
            </CardTitle>
            <CardDescription>Your latest quiz attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentResults && recentResults.length > 0 ? (
                  recentResults.map((result) => (
                    <div
                      key={result._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{result.quiz?.title || "Quiz"}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(result.timeTaken)}
                          <span>•</span>
                          {new Date(result.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={result.score >= 60 ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {result.score}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No quiz attempts yet. Start learning!
                  </p>
                )}
              </div>
            </ScrollArea>
            <Link to="/student/results" className="mt-4 block">
              <Button variant="outline" className="w-full">
                View All Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Weak Topics */}
      {weakTopics && weakTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Topics to Improve
            </CardTitle>
            <CardDescription>Focus on these areas to boost your scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weakTopics.slice(0, 6).map((topic) => (
                <div key={topic.topic} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{topic.topic}</h4>
                    <Badge variant="outline">{topic.attemptCount} attempts</Badge>
                  </div>
                  <Progress value={topic.averageScore} className="mb-1" />
                  <p className="text-sm text-muted-foreground">
                    Average: {topic.averageScore.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Performance */}
      {analytics?.topicAnalytics && analytics.topicAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance by Topic
            </CardTitle>
            <CardDescription>How you're doing across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topicAnalytics.slice(0, 8).map((topic) => (
                <div key={topic.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{topic.topic}</span>
                    <span className="text-muted-foreground">
                      {topic.averageScore}% ({topic.attempts} quizzes)
                    </span>
                  </div>
                  <Progress value={parseFloat(topic.averageScore)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;
