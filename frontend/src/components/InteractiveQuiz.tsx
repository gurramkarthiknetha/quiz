import { useState, useEffect, useCallback } from "react";
import { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, XCircle, Trophy } from "lucide-react";

interface Props {
  questions: Question[];
  onFinish: () => void;
}

export function InteractiveQuiz({ questions, onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(questions.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [finished]);

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const handleNext = useCallback(() => {
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  }, [current, selected, answers, questions.length]);

  const score = answers.filter((a, i) => a === questions[i]?.correctAnswer).length;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="max-w-lg mx-auto animate-fade-in">
        <CardContent className="p-8 text-center space-y-4">
          <Trophy className="mx-auto h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <div className="text-4xl font-bold text-primary">{pct}%</div>
          <p className="text-muted-foreground">
            {score} / {questions.length} correct in {formatTime(timer)}
          </p>
          <Progress value={pct} className="h-3" />
          <Button onClick={onFinish} className="mt-4">
            Back to Preview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {formatTime(timer)}
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
                  Easy: "bg-success/10 text-success",
                  Medium: "bg-warning/10 text-warning",
                  Hard: "bg-destructive/10 text-destructive",
                }[q.difficulty]
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
                    onClick={() => !showResult && setSelected(opt)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                      isCorrect
                        ? "border-success bg-success/5"
                        : isWrong
                        ? "border-destructive bg-destructive/5"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isCorrect && <CheckCircle2 className="inline ml-2 h-4 w-4 text-success" />}
                    {isWrong && <XCircle className="inline ml-2 h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
          ) : q.type === "TrueFalse" ? (
            <div className="flex gap-3">
              {["True", "False"].map((opt) => (
                <Button
                  key={opt}
                  variant={selected === opt ? "default" : "outline"}
                  onClick={() => !showResult && setSelected(opt)}
                  className="flex-1"
                >
                  {opt}
                </Button>
              ))}
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

          {showResult && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Correct: {q.correctAnswer}</p>
              {q.explanation}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {!showResult ? (
          <Button onClick={() => setShowResult(true)} disabled={!selected}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {current + 1 < questions.length ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
