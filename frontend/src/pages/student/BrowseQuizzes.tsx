import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { quizApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Play,
  Clock,
  BookOpen,
  HelpCircle,
  Filter,
  RefreshCw,
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
  creator?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

const BrowseQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  // Get unique topics from quizzes
  const topics = [...new Set(quizzes.map((q) => q.topic).filter(Boolean))];

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = quizzes;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    // Topic filter
    if (topicFilter !== "all") {
      filtered = filtered.filter((q) => q.topic === topicFilter);
    }

    setFilteredQuizzes(filtered);
  }, [searchQuery, difficultyFilter, topicFilter, quizzes]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Fetch only published public quizzes for students
      const res = await quizApi.getQuizzes({ isPublic: true, isPublished: true });
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

  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setTopicFilter("all");
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
            <BookOpen className="h-8 w-8" />
            Browse Quizzes
          </h1>
          <p className="text-muted-foreground">
            Explore and attempt quizzes created by faculty
          </p>
        </div>
        <Button variant="outline" onClick={fetchQuizzes}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        {topics.length > 0 && (
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic} value={topic!}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(searchQuery || difficultyFilter !== "all" || topicFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {filteredQuizzes.length} of {quizzes.length} quizzes
        </span>
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz._id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                  {quiz.difficulty && (
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  )}
                </div>
                {quiz.topic && (
                  <Badge variant="outline" className="w-fit">
                    {quiz.topic}
                  </Badge>
                )}
                {quiz.description && (
                  <CardDescription className="line-clamp-2">
                    {quiz.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>{quiz.questionCount || "?"} questions</span>
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.timeLimit} minutes</span>
                    </div>
                  )}
                  {quiz.creator && (
                    <div className="flex items-center gap-2">
                      <span>By: {quiz.creator.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/quiz/${quiz._id}`} className="w-full">
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No quizzes found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || difficultyFilter !== "all" || topicFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Check back later for new quizzes"}
                </p>
              </div>
              {(searchQuery || difficultyFilter !== "all" || topicFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrowseQuizzes;
