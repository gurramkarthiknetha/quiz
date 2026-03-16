import { useState } from "react";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { QuizCard } from "@/components/QuizCard";
import { quizApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, FileText, Save, Globe, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const QuizPreview = () => {
  const { questions, setQuestions, topics, settings } = useQuiz();
  const { isFaculty, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quiz metadata form
  const [title, setTitle] = useState(topics.length > 0 ? `${topics[0]} Quiz` : "");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState(topics[0] || "");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [isPublic, setIsPublic] = useState(true);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Quiz Generated Yet</h2>
        <p className="text-muted-foreground mb-4">Upload your notes and generate a quiz first.</p>
        <Button onClick={() => navigate("/")}>Go to Upload</Button>
      </div>
    );
  }

  const handleUpdate = (index: number, q: typeof questions[0]) => {
    const updated = [...questions];
    updated[index] = q;
    setQuestions(updated);
  };

  const handleDelete = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveAndPublish = async () => {
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
        isPublished: true, // Always publish when using "Save & Publish"
        questions,
        settings,
        topics,
      };

      await quizApi.createQuiz(quizData);
      
      toast.success("Quiz published successfully! Students can now access it.");
      setShowSaveDialog(false);
      
      // Navigate to appropriate dashboard
      if (isFaculty()) {
        navigate("/faculty/quizzes");
      } else if (isAdmin()) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const canPublish = isFaculty() || isAdmin();

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Quiz Preview</h2>
          <p className="text-sm text-muted-foreground">{questions.length} questions generated</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/quiz")}>
            <Play className="mr-2 h-4 w-4" /> Test Quiz
          </Button>
          {canPublish && (
            <Button onClick={() => setShowSaveDialog(true)}>
              <Globe className="mr-2 h-4 w-4" /> Save & Publish
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner for Faculty/Admin */}
      {canPublish && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="py-3">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Click <strong>"Save & Publish"</strong> to make this quiz available to students.
              Use <strong>"Test Quiz"</strong> to preview it yourself first.
            </p>
          </CardContent>
        </Card>
      )}

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuizCard
            key={q.id}
            question={q}
            index={i}
            onUpdate={(updated) => handleUpdate(i, updated)}
            onDelete={() => handleDelete(i)}
          />
        ))}
      </div>

      {/* Save & Publish Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save & Publish Quiz</DialogTitle>
            <DialogDescription>
              Fill in the quiz details. Published quizzes will be immediately visible to students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Quiz Title *</Label>
              <Input
                id="quiz-title"
                placeholder="Enter quiz title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-description">Description</Label>
              <Textarea
                id="quiz-description"
                placeholder="Brief description of the quiz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-topic">Topic</Label>
                <Input
                  id="quiz-topic"
                  placeholder="e.g., Mathematics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-difficulty">Difficulty</Label>
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
                <Label htmlFor="quiz-time">Time Limit (minutes)</Label>
                <Input
                  id="quiz-time"
                  type="number"
                  min={1}
                  placeholder="30"
                  value={timeLimit || ""}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="quiz-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="quiz-public" className="flex items-center gap-2 cursor-pointer">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveAndPublish} disabled={isSaving || !title.trim()}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Publishing..." : "Save & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizPreview;
