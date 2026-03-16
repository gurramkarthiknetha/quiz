import { useQuiz } from "@/context/QuizContext";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";

const QuizMode = () => {
  const { questions } = useQuiz();
  const navigate = useNavigate();

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <Play className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Quiz Available</h2>
        <p className="text-muted-foreground mb-4">Generate a quiz first to start quiz mode.</p>
        <Button onClick={() => navigate("/")}>Go to Upload</Button>
      </div>
    );
  }

  return <InteractiveQuiz questions={questions} onFinish={() => navigate("/preview")} />;
};

export default QuizMode;
