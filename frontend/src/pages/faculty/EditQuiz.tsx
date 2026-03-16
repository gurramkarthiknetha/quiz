import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizApi } from "@/services/api";
import { Question } from "@/types/quiz";
import { QuizCard } from "@/components/QuizCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Save,
  ArrowLeft,
  Globe,
  Lock,
  Edit,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  timeLimit?: number;
  isPublic: boolean;
  isPublished: boolean;
  questions: Question[];
  settings?: unknown;
  topics?: string[];
}

const EditQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState<number | undefined>(30);
  const [isPublic, setIsPublic] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!quizId) {
      setError("Quiz ID is required");
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const res = await quizApi.getQuiz(quizId);
        const quiz = res.data.data as QuizData;

        if (!quiz) {
          setError("Quiz not found");
          return;
        }

        // Populate form fields
        setTitle(quiz.title || "");
        setDescription(quiz.description || "");
        setTopic(quiz.topic || "");
        setDifficulty(quiz.difficulty || "medium");
        setTimeLimit(quiz.timeLimit);
        setIsPublic(quiz.isPublic ?? true);
        setIsPublished(quiz.isPublished ?? false);
        setQuestions(quiz.questions || []);
      } catch (err: unknown) {
        console.error("Error fetching quiz:", err);
        const error = err as { response?: { status: number } };
        if (error.response?.status === 404) {
          setError("Quiz not found");
        } else if (error.response?.status === 403) {
          setError("You don't have permission to edit this quiz");
        } else {
          setError("Failed to load quiz");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleUpdateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const confirmDeleteQuestion = (index: number) => {
    setQuestionToDelete(index);
    setShowDeleteDialog(true);
  };

  const handleDeleteQuestion = () => {
    if (questionToDelete !== null) {
      const newQuestions = questions.filter((_, i) => i !== questionToDelete);
      setQuestions(newQuestions);
      toast.success("Question deleted");
    }
    setShowDeleteDialog(false);
    setQuestionToDelete(null);
  };

  const handleSave = async (publish?: boolean) => {
    if (!quizId) return;

    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    if (questions.length === 0) {
      toast.error("Quiz must have at least one question");
      return;
    }

    setIsSaving(true);
    try {
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        topic: topic.trim(),
        difficulty,
        timeLimit,
        isPublic,
        isPublished: publish !== undefined ? publish : isPublished,
        questions,
      };

      await quizApi.updateQuiz(quizId, quizData);
      
      if (publish !== undefined) {
        setIsPublished(publish);
      }
      
      toast.success(
        publish !== undefined
          ? publish
            ? "Quiz published successfully!"
            : "Quiz unpublished"
          : "Quiz saved successfully!"
      );
    } catch (err) {
      console.error("Error saving quiz:", err);
      toast.error("Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <AlertTriangle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error}</h2>
        <p className="text-muted-foreground mb-4">
          Unable to load the quiz for editing.
        </p>
        <Button onClick={() => navigate("/faculty/quizzes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/faculty/quizzes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Quiz
          </h1>
          <p className="text-muted-foreground">
            Update quiz details and manage questions
          </p>
        </div>
        <div className="flex gap-2">
          {isPublished ? (
            <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
              <Lock className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}>
              <Globe className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Quiz Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>
                Update your quiz settings and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Mathematics"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={1}
                    placeholder="30"
                    value={timeLimit || ""}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public" className="flex items-center gap-2">
                      {isPublic ? (
                        <>
                          <Globe className="h-4 w-4" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" /> Private
                        </>
                      )}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Questions ({questions.length})</span>
              </CardTitle>
              <CardDescription>
                Edit or remove questions from your quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <QuizCard
                        key={q.id || index}
                        question={q}
                        index={index}
                        onUpdate={(updated) => handleUpdateQuestion(index, updated)}
                        onDelete={() => confirmDeleteQuestion(index)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions in this quiz.</p>
                  <p className="text-sm mt-2">
                    Go back to create quiz to generate new questions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Status</span>
                {isPublished ? (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Published
                  </span>
                ) : (
                  <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Draft
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Visibility</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  {isPublic ? (
                    <>
                      <Globe className="h-3 w-3" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" /> Private
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Questions</span>
                <span className="text-sm font-medium">{questions.length}</span>
              </div>

              {timeLimit && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Time Limit</span>
                  <span className="text-sm font-medium">{timeLimit} min</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Save Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleSave()}
                disabled={isSaving || !title.trim()}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>

              {!isPublished && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !title.trim() || questions.length === 0}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Save & Publish
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {isPublished
                  ? "Published quizzes are visible to students"
                  : "Publish to make the quiz available to students"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Question Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditQuiz;
