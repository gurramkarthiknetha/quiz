import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { quizApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Globe,
  Lock,
  Clock,
  HelpCircle,
  BarChart3,
  Copy,
  RefreshCw,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  timeLimit?: number;
  isPublic: boolean;
  isPublished: boolean;
  attemptCount?: number;
  createdAt: string;
  updatedAt: string;
}

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    let filtered = quizzes;

    if (searchQuery) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showPublishedOnly) {
      filtered = filtered.filter((q) => q.isPublished);
    }

    setFilteredQuizzes(filtered);
  }, [searchQuery, showPublishedOnly, quizzes]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Fetch quizzes created by the current faculty
      const res = await quizApi.getMyQuizzes();
      const data = (res.data.data || []) as Quiz[];
      setQuizzes(data);
      setFilteredQuizzes(data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (quiz: Quiz) => {
    try {
      await quizApi.updateQuiz(quiz._id, { isPublished: !quiz.isPublished });
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quiz._id ? { ...q, isPublished: !q.isPublished } : q
        )
      );
      toast.success(
        quiz.isPublished ? "Quiz unpublished" : "Quiz published successfully"
      );
    } catch (error) {
      toast.error("Failed to update quiz");
    }
  };

  const handleVisibilityToggle = async (quiz: Quiz) => {
    try {
      await quizApi.updateQuiz(quiz._id, { isPublic: !quiz.isPublic });
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quiz._id ? { ...q, isPublic: !q.isPublic } : q
        )
      );
      toast.success(
        quiz.isPublic ? "Quiz is now private" : "Quiz is now public"
      );
    } catch (error) {
      toast.error("Failed to update quiz");
    }
  };

  const confirmDelete = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!quizToDelete) return;

    try {
      await quizApi.deleteQuiz(quizToDelete._id);
      setQuizzes((prev) => prev.filter((q) => q._id !== quizToDelete._id));
      toast.success("Quiz deleted successfully");
    } catch (error) {
      toast.error("Failed to delete quiz");
    } finally {
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    }
  };

  const copyQuizLink = (quizId: string) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    toast.success("Quiz link copied to clipboard");
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListChecks className="h-8 w-8" />
            My Quizzes
          </h1>
          <p className="text-muted-foreground">
            Manage and publish your quizzes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchQuizzes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/faculty/create-quiz">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="published-filter"
            checked={showPublishedOnly}
            onCheckedChange={setShowPublishedOnly}
          />
          <Label htmlFor="published-filter">Published only</Label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <p className="text-sm text-muted-foreground">Total Quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {quizzes.filter((q) => q.isPublished).length}
            </div>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {quizzes.filter((q) => !q.isPublished).length}
            </div>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {quizzes.reduce((acc, q) => acc + (q.attemptCount || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card
              key={quiz._id}
              className={`flex flex-col ${
                !quiz.isPublished ? "border-dashed border-orange-300" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {quiz.isPublished ? (
                        <Badge variant="default" className="bg-green-600">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {quiz.isPublic ? (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" /> Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" /> Private
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/quiz/${quiz._id}`}>
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/faculty/edit-quiz/${quiz._id}`}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyQuizLink(quiz._id)}>
                        <Copy className="h-4 w-4 mr-2" /> Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/faculty/quiz-results/${quiz._id}`}>
                          <BarChart3 className="h-4 w-4 mr-2" /> View Results
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handlePublishToggle(quiz)}
                      >
                        {quiz.isPublished ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" /> Unpublish
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" /> Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleVisibilityToggle(quiz)}
                      >
                        {quiz.isPublic ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" /> Make Private
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" /> Make Public
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => confirmDelete(quiz)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {quiz.topic && (
                  <Badge variant="outline" className="w-fit mt-2">
                    {quiz.topic}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>{quiz.questionCount || 0} questions</span>
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.timeLimit} minutes</span>
                    </div>
                  )}
                  {quiz.difficulty && (
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>{quiz.attemptCount || 0} attempts</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Link to={`/quiz/${quiz._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </Link>
                <Button
                  variant={quiz.isPublished ? "secondary" : "default"}
                  onClick={() => handlePublishToggle(quiz)}
                >
                  {quiz.isPublished ? "Unpublish" : "Publish"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ListChecks className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No quizzes yet</h3>
                <p className="text-muted-foreground">
                  Create your first quiz to get started
                </p>
              </div>
              <Link to="/faculty/create-quiz">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quizToDelete?.title}"? This
              action cannot be undone and will remove all associated quiz
              attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyQuizzes;
