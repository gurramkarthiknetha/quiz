import { useState } from "react";
import { Question } from "@/types/quiz";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Pencil, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface QuizCardProps {
  question: Question;
  index: number;
  onUpdate: (q: Question) => void;
  onDelete: () => void;
}

export function QuizCard({ question, index, onUpdate, onDelete }: QuizCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(question);

  const difficultyColor = {
    Easy: "bg-success/10 text-success",
    Medium: "bg-warning/10 text-warning",
    Hard: "bg-destructive/10 text-destructive",
  }[question.difficulty];

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
            <Badge variant="outline" className="text-xs">{question.type}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>
              {question.difficulty}
            </span>
            <Badge variant="secondary" className="text-xs">{question.tag}</Badge>
            {question.bloomLevel && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {question.bloomLevel}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editData.question}
              onChange={(e) => setEditData({ ...editData, question: e.target.value })}
            />
            {editData.options?.map((opt, i) => (
              <Input
                key={i}
                value={opt}
                onChange={(e) => {
                  const opts = [...(editData.options || [])];
                  opts[i] = e.target.value;
                  setEditData({ ...editData, options: opts });
                }}
              />
            ))}
            <Input
              value={editData.correctAnswer}
              onChange={(e) => setEditData({ ...editData, correctAnswer: e.target.value })}
              placeholder="Correct answer"
            />
            <Button size="sm" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
        ) : (
          <>
            <p className="font-medium mb-2">{question.question}</p>
            {question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`text-sm px-3 py-1.5 rounded-md border ${
                      opt === question.correctAnswer
                        ? "border-primary/50 bg-primary/5 font-medium"
                        : "border-border"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
            )}
            {question.type !== "MCQ" && (
              <p className="text-sm text-primary font-medium">Answer: {question.correctAnswer}</p>
            )}
          </>
        )}

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
        >
          {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Explanation
        </button>
        {showExplanation && (
          <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
            {question.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
