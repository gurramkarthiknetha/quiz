import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizApi } from "@/services/api";
import { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Play,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { ExamSecurityOverlay } from "@/components/ExamSecurityOverlay";

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  timeLimit?: number;
  questions: Question[];
  creator?: {
    name: string;
    email: string;
  };
}

const QuizAttempt = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // Ref to track whether auto-submit has already fired
  const autoSubmitFiredRef = useRef(false);

  // Exam security hook
  const examSecurity = useExamSecurity({
    enabled: started && !finished,
    maxViolations: 3,
    onMaxViolationsReached: () => {
      if (!autoSubmitFiredRef.current) {
        autoSubmitFiredRef.current = true;
        setAutoSubmitting(true);
        toast.error("Maximum violations reached. Your quiz is being auto-submitted.");
        handleAutoSubmit();
      }
    },
  });

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        setError("Quiz ID is required");
        setLoading(false);
        return;
      }

      try {
        const res = await quizApi.getQuiz(quizId);
        const quizData = res.data.data as QuizData;
        
        if (!quizData) {
          setError("Quiz not found");
        } else {
          setQuiz(quizData);
        }
      } catch (err: any) {
        console.error("Error fetching quiz:", err);
        if (err.response?.status === 404) {
          setError("Quiz not found");
        } else if (err.response?.status === 403) {
          setError("You don't have access to this quiz");
        } else {
          setError("Failed to load quiz");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (!started || finished) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [started, finished]);

  // Time limit check
  useEffect(() => {
    if (!started || finished || !quiz?.timeLimit) return;
    
    const timeLimitSeconds = quiz.timeLimit * 60;
    if (timer >= timeLimitSeconds) {
      handleFinish(true, "time_limit");
      toast.warning("Time's up! Quiz submitted automatically.");
    }
  }, [timer, quiz?.timeLimit, started, finished]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleStartQuiz = async () => {
    setStarted(true);
    // Enter fullscreen when quiz starts
    try {
      await examSecurity.enterFullscreen();
    } catch {
      // Fullscreen might be blocked by browser; quiz still starts
      toast.info("Fullscreen mode could not be enabled. The quiz will continue.");
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (!showResult) {
      setSelected(answer);
    }
  };

  const handleCheckAnswer = () => {
    if (selected) {
      setShowResult(true);
    }
  };

  const handleNext = useCallback(() => {
    if (!quiz) return;
    
    const question = quiz.questions[current];
    const questionId = question.id || question._id || String(current);
    if (selected) {
      setAnswers((prev) => [
        ...prev.filter((a) => a.questionId !== questionId),
        { questionId, selectedAnswer: selected },
      ]);
    }

    if (current + 1 < quiz.questions.length) {
      setCurrent(current + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      handleFinish();
    }
  }, [current, selected, quiz]);

  const handleFinish = async (isAutoSubmit = false, autoSubmitReason?: string) => {
    if (!quiz || !quizId) return;
    
    setFinished(true);
    setSubmitting(true);

    // Exit fullscreen when quiz finishes
    await examSecurity.exitFullscreen();

    // Add last answer if not already added
    const question = quiz.questions[current];
    const questionId = question.id || question._id || String(current);
    const finalAnswers = selected
      ? [
          ...answers.filter((a) => a.questionId !== questionId),
          { questionId, selectedAnswer: selected },
        ]
      : answers;

    try {
      const res = await quizApi.submitAttempt(quizId, {
        answers: finalAnswers,
        timeTaken: timer,
        securityViolations: examSecurity.violations,
        fullscreenEnforced: true,
        autoSubmitted: isAutoSubmit,
        autoSubmitReason: autoSubmitReason || null,
      });

      const attemptData = res.data.data as { score: number };
      setFinalScore(attemptData?.score ?? calculateLocalScore(finalAnswers));
      toast.success("Quiz submitted successfully!");
    } catch (err) {
      console.error("Error submitting quiz:", err);
      // Calculate score locally if submission fails
      setFinalScore(calculateLocalScore(finalAnswers));
      toast.error("Failed to submit quiz to server, but your score has been calculated.");
    } finally {
      setSubmitting(false);
      setAutoSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    handleFinish(true, "max_violations");
  };

  const calculateLocalScore = (finalAnswers: { questionId: string; selectedAnswer: string }[]) => {
    if (!quiz) return 0;
    let correct = 0;
    finalAnswers.forEach((answer) => {
      const question = quiz.questions.find(
        (q) => q.id === answer.questionId || (q as any)._id === answer.questionId
      );
      if (question && question.correctAnswer === answer.selectedAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <AlertTriangle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error || "Quiz not found"}</h2>
        <p className="text-muted-foreground mb-4">
          The quiz you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate("/student/quizzes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Browse Quizzes
        </Button>
      </div>
    );
  }

  // Quiz start screen
  if (!started) {
    return (
      <div className="max-w-xl mx-auto p-6 animate-fade-in">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription className="text-base">{quiz.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span>{quiz.questions.length} Questions</span>
              </div>
              {quiz.timeLimit && quiz.timeLimit > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{quiz.timeLimit} minutes</span>
                </div>
              )}
              {quiz.topic && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{quiz.topic}</span>
                </div>
              )}
              {quiz.difficulty && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${
                      quiz.difficulty === "easy"
                        ? "border-green-500 text-green-600"
                        : quiz.difficulty === "hard"
                        ? "border-red-500 text-red-600"
                        : "border-yellow-500 text-yellow-600"
                    }`}
                  >
                    {quiz.difficulty}
                  </Badge>
                </div>
              )}
            </div>

            {quiz.creator && (
              <p className="text-sm text-muted-foreground text-center">
                Created by {quiz.creator.name}
              </p>
            )}

            {/* Fullscreen security notice */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm">
                <Shield className="h-4 w-4" />
                Exam Security Mode
              </div>
              <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-1 ml-6 list-disc">
                <li>This quiz will launch in <strong>fullscreen mode</strong></li>
                <li>Exiting fullscreen or switching tabs will be recorded as violations</li>
                <li>After <strong>3 violations</strong>, the quiz will be auto-submitted</li>
                <li>Right-click, copy, and developer tools are disabled</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button className="flex-1" onClick={handleStartQuiz}>
                <Play className="mr-2 h-4 w-4" />
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz finished screen
  if (finished) {
    const score = finalScore ?? 0;
    return (
      <Card className="max-w-lg mx-auto animate-fade-in">
        <CardContent className="p-8 text-center space-y-4">
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
              <h2 className="text-xl font-semibold">Submitting your quiz...</h2>
            </>
          ) : (
            <>
              <Trophy
                className={`mx-auto h-16 w-16 ${
                  score >= 60 ? "text-yellow-500" : "text-muted-foreground"
                }`}
              />
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
              <div
                className={`text-4xl font-bold ${
                  score >= 60 ? "text-green-500" : "text-red-500"
                }`}
              >
                {score}%
              </div>
              <p className="text-muted-foreground">
                Completed in {formatTime(timer)}
              </p>
              <Progress value={score} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {score >= 60 ? "Great job! You passed!" : "Keep practicing to improve your score."}
              </p>
              {examSecurity.violationCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Shield className="h-3.5 w-3.5" />
                    {examSecurity.violationCount} security violation(s) recorded
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/student/quizzes")}>
                  Browse More
                </Button>
                <Button className="flex-1" onClick={() => navigate("/student/results")}>
                  View Results
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz in progress
  const q = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;
  const timeRemaining = quiz.timeLimit ? quiz.timeLimit * 60 - timer : null;

  return (
    <>
      {/* Exam security overlay – shown on violations */}
      <ExamSecurityOverlay
        visible={examSecurity.showWarning}
        message={examSecurity.warningMessage}
        violationCount={examSecurity.violationCount}
        maxViolations={examSecurity.maxViolations}
        isAutoSubmitting={autoSubmitting}
        onDismiss={examSecurity.dismissWarning}
      />

      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {current + 1} of {quiz.questions.length}
          </span>
          <div className="flex items-center gap-3">
            {/* Security indicator */}
            <Badge
              variant={examSecurity.violationCount > 0 ? "destructive" : "outline"}
              className="flex items-center gap-1 text-xs"
            >
              <Shield className="h-3 w-3" />
              {examSecurity.violationCount}/{examSecurity.maxViolations}
            </Badge>
            {timeRemaining !== null && timeRemaining > 0 && (
              <Badge
                variant={timeRemaining < 60 ? "destructive" : "outline"}
                className="flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(timer)}
            </div>
          </div>
        </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2 mb-3">
            <Badge variant="outline">{q.type}</Badge>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                {
                  Easy: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
                  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
                  Hard: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
                }[q.difficulty] || ""
              }`}
            >
              {q.difficulty}
            </span>
          </div>

          <p className="text-lg font-medium mb-4">{q.question}</p>

          {q.type === "MCQ" && q.options ? (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = showResult && opt === q.correctAnswer;
                const isWrong = showResult && isSelected && opt !== q.correctAnswer;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={showResult}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                      isCorrect
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : isWrong
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isCorrect && <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-500" />}
                    {isWrong && <XCircle className="inline ml-2 h-4 w-4 text-red-500" />}
                  </button>
                );
              })}
            </div>
          ) : q.type === "TrueFalse" ? (
            <div className="flex gap-3">
              {["True", "False"].map((opt) => {
                const isSelected = selected === opt;
                const isCorrect = showResult && opt === q.correctAnswer;
                const isWrong = showResult && isSelected && opt !== q.correctAnswer;
                return (
                  <Button
                    key={opt}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={showResult}
                    className={`flex-1 ${
                      isCorrect
                        ? "border-green-500 bg-green-500 text-white"
                        : isWrong
                        ? "border-red-500 bg-red-500 text-white"
                        : ""
                    }`}
                  >
                    {opt}
                  </Button>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              value={selected || ""}
              onChange={(e) => setSelected(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-2 border rounded-lg bg-background border-input"
              disabled={showResult}
            />
          )}

          {showResult && q.explanation && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Correct: {q.correctAnswer}</p>
              {q.explanation}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {!showResult ? (
          <Button onClick={handleCheckAnswer} disabled={!selected}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {current + 1 < quiz.questions.length ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
    </>
  );
};

export default QuizAttempt;
