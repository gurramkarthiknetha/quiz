import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resultsApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Trophy,
  CheckCircle2,
  XCircle,
  BookOpen,
  AlertTriangle,
  Tag,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

interface AttemptDetail {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  quiz: {
    _id: string;
    title: string;
    description?: string;
    topic?: string;
    topics?: string[];
    difficulty?: string;
    questions: Array<{
      _id: string;
      question: string;
      type: string;
      options?: string[];
      correctAnswer: string;
      difficulty: string;
      tag?: string;
      explanation?: string;
      bloomLevel?: string;
    }>;
  };
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
  score: number;
  totalQuestions: number;
  percentage: number;
  totalTimeTaken: number;
  status: string;
  startedAt: string;
  completedAt: string;
  securityViolations?: Array<{
    type: string;
    timestamp: string;
    description: string;
  }>;
  violationCount?: number;
  autoSubmitted?: boolean;
  autoSubmitReason?: string;
}

const StudentResultDetail = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!attemptId) return;
      try {
        const res = await resultsApi.getResultDetail(attemptId);
        setAttempt(res.data.data as AttemptDetail);
      } catch (error: any) {
        console.error("Error fetching result detail:", error);
        if (error.response?.status === 404) {
          toast.error("Result not found");
        } else if (error.response?.status === 403) {
          toast.error("Not authorized to view this result");
        } else {
          toast.error("Failed to load result details");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [attemptId]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0m 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <AlertTriangle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Result Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The result you're looking for doesn't exist or you don't have access.
        </p>
        <Button onClick={() => navigate("/student/results")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </div>
    );
  }

  const percentage =
    attempt.percentage ??
    (attempt.totalQuestions > 0
      ? Math.round((attempt.score / attempt.totalQuestions) * 100)
      : 0);
  const passed = percentage >= 60;

  // Build question details with answer mapping
  const questionDetails = (attempt.quiz?.questions ?? []).map((q) => {
    const answer = attempt.answers.find(
      (a) => a.questionId === q._id || a.questionId === q._id?.toString()
    );
    return {
      ...q,
      selectedAnswer: answer?.selectedAnswer || "Not answered",
      isCorrect: answer?.isCorrect || false,
    };
  });

  // Group questions by topic/tag for "weekly topics" view
  const topicGroups: Record<string, typeof questionDetails> = {};
  questionDetails.forEach((q) => {
    const topic = q.tag || "General";
    if (!topicGroups[topic]) topicGroups[topic] = [];
    topicGroups[topic].push(q);
  });

  // Topic performance stats
  const topicStats = Object.entries(topicGroups).map(([topic, questions]) => {
    const correct = questions.filter((q) => q.isCorrect).length;
    return {
      topic,
      total: questions.length,
      correct,
      percentage: Math.round((correct / questions.length) * 100),
    };
  });

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student/results")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{attempt.quiz?.title || "Quiz"}</h1>
          {attempt.quiz?.description && (
            <p className="text-muted-foreground">{attempt.quiz.description}</p>
          )}
        </div>
      </div>

      {/* Score Hero Card */}
      <Card className={passed ? "border-green-200" : "border-red-200"}>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Trophy
              className={`mx-auto h-14 w-14 ${
                passed ? "text-yellow-500" : "text-muted-foreground"
              }`}
            />
            <div
              className={`text-5xl font-bold ${
                passed ? "text-green-600" : "text-red-600"
              }`}
            >
              {percentage}%
            </div>
            <p className="text-muted-foreground">
              {attempt.score} / {attempt.totalQuestions} correct
            </p>
            <Progress value={percentage} className="h-3 max-w-sm mx-auto" />
            <p className="text-sm font-medium">
              {passed ? "Great job! You passed!" : "Keep practicing to improve."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Time Taken</p>
            <p className="text-lg font-bold">{formatTime(attempt.totalTimeTaken || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-sm font-semibold">{formatDate(attempt.completedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <Badge
              variant="outline"
              className={`mt-1 ${
                attempt.quiz?.difficulty === "easy"
                  ? "border-green-500 text-green-600"
                  : attempt.quiz?.difficulty === "hard"
                  ? "border-red-500 text-red-600"
                  : "border-yellow-500 text-yellow-600"
              }`}
            >
              {attempt.quiz?.difficulty || "N/A"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            {(attempt.violationCount ?? 0) > 0 ? (
              <ShieldAlert className="h-5 w-5 mx-auto text-destructive mb-2" />
            ) : (
              <Shield className="h-5 w-5 mx-auto text-green-600 mb-2" />
            )}
            <p className="text-xs text-muted-foreground">Security</p>
            <p className="text-sm font-semibold">
              {(attempt.violationCount ?? 0) > 0 ? (
                <span className="text-destructive">
                  {attempt.violationCount} violation(s)
                </span>
              ) : (
                <span className="text-green-600">Clean</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Topic-wise Performance */}
      {topicStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Topic-wise Performance
            </CardTitle>
            <CardDescription>
              Your performance broken down by topic
              {attempt.quiz?.topics && attempt.quiz.topics.length > 0 && (
                <span className="ml-1">
                  — Covers: {attempt.quiz.topics.join(", ")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topicStats.map((stat) => (
                <div
                  key={stat.topic}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate">{stat.topic}</h4>
                    <span
                      className={`text-sm font-bold ${
                        stat.percentage >= 80
                          ? "text-green-600"
                          : stat.percentage >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={stat.percentage}
                    className={`h-2 ${
                      stat.percentage >= 80
                        ? "[&>div]:bg-green-500"
                        : stat.percentage >= 60
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-red-500"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {stat.correct} / {stat.total} correct
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Breakdown */}
      {questionDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
            <CardDescription>
              Review each question and your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questionDetails.map((q, index) => (
                <div
                  key={q._id || index}
                  className={`p-4 rounded-lg border ${
                    q.isCorrect
                      ? "border-green-200 bg-green-50/50 dark:bg-green-950/10"
                      : "border-red-200 bg-red-50/50 dark:bg-red-950/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {q.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">
                          Q{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {q.type}
                        </Badge>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            q.difficulty === "Easy"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : q.difficulty === "Hard"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        {q.tag && (
                          <Badge variant="secondary" className="text-xs">
                            {q.tag}
                          </Badge>
                        )}
                      </div>

                      <p className="font-medium">{q.question}</p>

                      {/* MCQ options */}
                      {q.type === "MCQ" && q.options && q.options.length > 0 && (
                        <div className="space-y-1 ml-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = q.selectedAnswer === opt;
                            const isCorrectOpt = q.correctAnswer === opt;
                            return (
                              <div
                                key={optIdx}
                                className={`text-sm px-3 py-1.5 rounded ${
                                  isCorrectOpt
                                    ? "bg-green-100 dark:bg-green-900/30 font-medium"
                                    : isSelected && !isCorrectOpt
                                    ? "bg-red-100 dark:bg-red-900/30"
                                    : ""
                                }`}
                              >
                                <span className="font-medium mr-2">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                {opt}
                                {isCorrectOpt && (
                                  <CheckCircle2 className="inline ml-2 h-3.5 w-3.5 text-green-600" />
                                )}
                                {isSelected && !isCorrectOpt && (
                                  <XCircle className="inline ml-2 h-3.5 w-3.5 text-red-600" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* True/False & Short Answer */}
                      {q.type !== "MCQ" && (
                        <div className="text-sm space-y-1 ml-2">
                          <p>
                            <span className="text-muted-foreground">Your answer:</span>{" "}
                            <span
                              className={
                                q.isCorrect
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {q.selectedAnswer}
                            </span>
                          </p>
                          {!q.isCorrect && (
                            <p>
                              <span className="text-muted-foreground">
                                Correct answer:
                              </span>{" "}
                              <span className="text-green-600 font-medium">
                                {q.correctAnswer}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="text-sm bg-muted/50 rounded p-3 mt-2 text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Explanation:
                          </span>{" "}
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentResultDetail;
