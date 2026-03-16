import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";
import { QuizSettingsPanel } from "@/components/QuizSettingsPanel";
import { useQuiz } from "@/context/QuizContext";
import { quizApi } from "@/services/api";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  Loader2,
  Save,
  ArrowLeft,
  Eye,
  Globe,
  Lock,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

const CreateQuiz = () => {
  const { inputText, settings, questions, setQuestions, setTopics, isGenerating, setIsGenerating } = useQuiz();
  const navigate = useNavigate();
  
  // Quiz metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState<number | undefined>(30);
  const [isPublic, setIsPublic] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Please upload or paste your study notes first.");
      return;
    }
    if (inputText.trim().length < 100) {
      toast.error("Please provide more text (at least 100 characters) for better quiz generation.");
      return;
    }

    setIsGenerating(true);
    try {
      const serverUri = import.meta.env.VITE_SERVER_URI;
      if (!serverUri) {
        toast.error("Backend not configured. Please set VITE_SERVER_URI.");
        setIsGenerating(false);
        return;
      }

      const token = localStorage.getItem("token");
      const resp = await fetch(`${serverUri}/api/generate/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText, settings }),
      });

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add credits to your workspace.");
        return;
      }
      if (!resp.ok) throw new Error("Failed to generate quiz");

      const response = await resp.json();
      const generatedQuestions = response.data?.questions || [];
      const generatedTopics = response.data?.topics || [];
      
      setQuestions(generatedQuestions);
      setTopics(generatedTopics);
      
      // Auto-set topic if generated
      if (generatedTopics.length > 0 && !topic) {
        setTopic(generatedTopics[0]);
      }
      
      toast.success(`Generated ${generatedQuestions.length} questions!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    if (questions.length === 0) {
      toast.error("Please generate questions first");
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
        isPublished: publish,
        questions,
        settings,
      };

      const res = await quizApi.createQuiz(quizData);
      
      toast.success(publish ? "Quiz published successfully!" : "Quiz saved as draft");
      navigate("/faculty/quizzes");
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/faculty/quizzes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Upload className="h-8 w-8" />
            Create Quiz
          </h1>
          <p className="text-muted-foreground">
            Upload study material and generate an AI-powered quiz
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Quiz Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>
                Configure your quiz settings and metadata
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

          {/* Upload Content Card */}
          <Card>
            <CardHeader>
              <CardTitle>Study Material</CardTitle>
              <CardDescription>
                Upload or paste your notes to generate questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload />
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !inputText.trim()}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Questions Preview */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated Questions ({questions.length})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/preview")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview & Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {questions.slice(0, 5).map((q, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">
                        {idx + 1}. {q.question}
                      </p>
                    </div>
                  ))}
                  {questions.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {questions.length - 5} more questions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <QuizSettingsPanel />

          {/* Save Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Save Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSaveQuiz(false)}
                disabled={isSaving || questions.length === 0 || !title.trim()}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              
              <Button
                className="w-full"
                onClick={() => handleSaveQuiz(true)}
                disabled={isSaving || questions.length === 0 || !title.trim()}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Save & Publish
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Published quizzes will be visible to students immediately
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
