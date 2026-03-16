import { FileUpload } from "@/components/FileUpload";
import { QuizSettingsPanel } from "@/components/QuizSettingsPanel";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  BookOpen,
  Brain,
  Target,
  Users,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  FileText,
  BarChart3,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

// Landing page for unauthenticated users
const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description: "Advanced AI analyzes your notes and creates comprehensive quizzes automatically.",
    },
    {
      icon: Target,
      title: "Multiple Question Types",
      description: "MCQ, True/False, Short Answer, and Fill in the Blanks to test different skills.",
    },
    {
      icon: BarChart3,
      title: "Difficulty Distribution",
      description: "Customize the mix of Easy, Medium, and Hard questions for balanced assessment.",
    },
    {
      icon: GraduationCap,
      title: "Bloom's Taxonomy",
      description: "Generate questions aligned with cognitive learning levels for deeper understanding.",
    },
    {
      icon: FileText,
      title: "PDF & Text Support",
      description: "Upload PDFs or paste text directly - we handle all the processing for you.",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get immediate feedback with detailed explanations for every question.",
    },
  ];

  const benefits = [
    "Save hours of manual quiz creation",
    "Consistent question quality across all quizzes",
    "Support for multiple exam modes (UPSC, JEE, College, School)",
    "Track student performance with detailed analytics",
    "Role-based access for students, faculty, and admins",
  ];

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <Badge variant="secondary" className="px-4 py-1 text-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Powered Quiz Generation
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Transform Your Notes Into
          <span className="text-primary block mt-2">Interactive Quizzes</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Notes-to-Quiz AI automatically generates comprehensive quizzes from your study materials,
          helping educators save time and students learn more effectively.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" onClick={() => navigate("/register")} className="gap-2">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Powerful Features</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to create, manage, and deliver quizzes efficiently
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8 bg-muted/50 rounded-xl p-8 md:p-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to create your quiz</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold">Upload Your Content</h3>
            <p className="text-muted-foreground">
              Upload a PDF or paste your study notes directly into the platform
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold">Customize Settings</h3>
            <p className="text-muted-foreground">
              Choose question types, difficulty levels, and exam mode preferences
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold">Generate & Share</h3>
            <p className="text-muted-foreground">
              AI generates your quiz instantly - review, edit, and share with students
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Why Choose Notes-to-Quiz AI?</h2>
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Role-Based Access</p>
                <p className="text-2xl font-bold">Students • Faculty • Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Secure Authentication</p>
                <p className="text-2xl font-bold">Google OAuth & Local Login</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Quiz Management</p>
                <p className="text-2xl font-bold">Create • Publish • Analyze</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 bg-primary/5 rounded-xl">
        <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Join educators and students who are already using Notes-to-Quiz AI to enhance learning.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/register")}>
            Create Your Account
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
            Already have an account? Sign In
          </Button>
        </div>
      </section>
    </div>
  );
};

// Admin-only upload notes section
const AdminUploadSection = () => {
  const { inputText, settings, isGenerating, setIsGenerating, setQuestions, setTopics } = useQuiz();
  const navigate = useNavigate();

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
      const questions = response.data?.questions || [];
      const topics = response.data?.topics || [];
      setQuestions(questions);
      setTopics(topics);
      toast.success(`Generated ${questions.length} questions!`);
      navigate("/preview");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Admin: Upload Notes</h2>
        </div>
        <p className="text-muted-foreground">
          Paste or upload study material and let AI generate a comprehensive quiz.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <FileUpload />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate Quiz
              </>
            )}
          </Button>
        </div>
        <QuizSettingsPanel />
      </div>
    </div>
  );
};

const Index = () => {
  const { isAuthenticated, isAdmin, isFaculty, user } = useAuth();

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show upload section only for admin users
  if (isAdmin()) {
    return <AdminUploadSection />;
  }

  // For faculty users, show faculty-specific redirect
  if (isFaculty()) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12 animate-fade-in">
        <GraduationCap className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Welcome, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground text-lg">
          Create and manage quizzes for your students from the sidebar menu.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/faculty/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
          <Link to="/faculty/create-quiz">
            <Button>Create New Quiz</Button>
          </Link>
        </div>
      </div>
    );
  }

  // For students, show student-specific redirect
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-12 animate-fade-in">
      <BookOpen className="h-16 w-16 mx-auto text-primary" />
      <h1 className="text-3xl font-bold">Welcome, {user?.name?.split(" ")[0]}!</h1>
      <p className="text-muted-foreground text-lg">
        Browse available quizzes and track your progress from the sidebar menu.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link to="/student/dashboard">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
        <Link to="/student/quizzes">
          <Button>Browse Quizzes</Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
