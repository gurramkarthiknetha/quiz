import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { resultsApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Trophy,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  AlertTriangle,
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
    questions: Array<{
      _id: string;
      question: string;
      type: string;
      options?: string[];
      correctAnswer: string;
      difficulty: string;
      explanation?: string;
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
  fullscreenEnforced?: boolean;
  autoSubmitted?: boolean;
  autoSubmitReason?: string;
}

const AttemptDetail = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      if (!attemptId) return;
      try {
        const res = await resultsApi.getResultDetail(attemptId);
        setAttempt(res.data.data as AttemptDetail);
      } catch (error: any) {
        console.error("Error fetching attempt detail:", error);
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
    fetchAttempt();
  }, [attemptId]);

  const formatTime = (seconds: number) => {
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
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
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
          The result you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const percentage = attempt.percentage ?? (attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0);
  const passed = percentage >= 60;

  // Map answers to questions for the detail table
  const questionDetails = attempt.quiz?.questions?.map((q) => {
    const answer = attempt.answers.find(
      (a) => a.questionId === q._id || a.questionId === q._id?.toString()
    );
    return {
      ...q,
      selectedAnswer: answer?.selectedAnswer || "Not answered",
      isCorrect: answer?.isCorrect || false,
    };
  }) || [];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Attempt Details</h1>
          <p className="text-muted-foreground">{attempt.quiz?.title || "Quiz"}</p>
        </div>
      </div>

      {/* Student Info & Score Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={attempt.user?.avatar} />
                <AvatarFallback>
                  {attempt.user?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{attempt.user?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{attempt.user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className={`h-4 w-4 ${passed ? "text-yellow-500" : "text-muted-foreground"}`} />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`text-4xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {percentage}%
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {attempt.score} / {attempt.totalQuestions} correct
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Time Taken
            </div>
            <div className="text-xl font-bold">{formatTime(attempt.totalTimeTaken || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Completed
            </div>
            <div className="text-sm font-semibold">{formatDate(attempt.completedAt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              Status
            </div>
            <Badge variant={attempt.status === "completed" ? "default" : "secondary"}>
              {attempt.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              {attempt.autoSubmitted ? (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Security
            </div>
            <div className="text-sm font-semibold">
              {attempt.violationCount != null && attempt.violationCount > 0 ? (
                <span className="text-destructive">{attempt.violationCount} violation(s)</span>
              ) : (
                <span className="text-green-600">No violations</span>
              )}
            </div>
            {attempt.autoSubmitted && (
              <p className="text-xs text-destructive mt-1">Auto-submitted ({attempt.autoSubmitReason})</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Violations Detail */}
      {attempt.securityViolations && attempt.securityViolations.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" />
              Security Violations
            </CardTitle>
            <CardDescription>Recorded during the exam attempt</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempt.securityViolations.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {v.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{v.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Question-by-Question Breakdown */}
      {questionDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
            <CardDescription>
              Detailed view of each question and the student's response
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Q{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">{q.type}</Badge>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            q.difficulty === "Easy"
                              ? "bg-green-100 text-green-700"
                              : q.difficulty === "Hard"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="font-medium">{q.question}</p>

                      {/* Options display for MCQ */}
                      {q.options && q.options.length > 0 && (
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

                      {/* For non-MCQ */}
                      {(!q.options || q.options.length === 0) && (
                        <div className="text-sm space-y-1 ml-2">
                          <p>
                            <span className="text-muted-foreground">Student's answer:</span>{" "}
                            <span className={q.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {q.selectedAnswer}
                            </span>
                          </p>
                          {!q.isCorrect && (
                            <p>
                              <span className="text-muted-foreground">Correct answer:</span>{" "}
                              <span className="text-green-600 font-medium">{q.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="text-sm bg-muted/50 rounded p-2 mt-2 text-muted-foreground">
                          <span className="font-medium text-foreground">Explanation:</span> {q.explanation}
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

export default AttemptDetail;
