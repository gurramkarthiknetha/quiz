import { useQuiz } from "@/context/QuizContext";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { QuestionType, ExamMode } from "@/types/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: "MCQ", label: "Multiple Choice" },
  { value: "TrueFalse", label: "True / False" },
  { value: "ShortAnswer", label: "Short Answer" },
  { value: "FillBlank", label: "Fill in the Blanks" },
];

const examModes: ExamMode[] = ["General", "UPSC", "JEE", "College", "School"];

export function QuizSettingsPanel() {
  const { settings, updateSettings } = useQuiz();

  const toggleType = (type: QuestionType) => {
    const types = settings.questionTypes.includes(type)
      ? settings.questionTypes.filter((t) => t !== type)
      : [...settings.questionTypes, type];
    if (types.length > 0) updateSettings({ questionTypes: types });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiz Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Total Questions: {settings.totalQuestions}</Label>
          <Slider
            value={[settings.totalQuestions]}
            onValueChange={([v]) => updateSettings({ totalQuestions: v })}
            min={5}
            max={50}
            step={5}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="mb-2 block">Question Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {questionTypes.map((qt) => (
              <label
                key={qt.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={settings.questionTypes.includes(qt.value)}
                  onCheckedChange={() => toggleType(qt.value)}
                />
                {qt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Exam Mode</Label>
          <Select
            value={settings.examMode}
            onValueChange={(v) => updateSettings({ examMode: v as ExamMode })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {examModes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Bloom's Taxonomy Mode</Label>
          <Switch
            checked={settings.bloomsMode}
            onCheckedChange={(v) => updateSettings({ bloomsMode: v })}
          />
        </div>

        <div>
          <Label className="mb-2 block">Difficulty Distribution</Label>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-16 text-success">Easy</span>
              <Slider
                value={[settings.difficultyDistribution.easy]}
                onValueChange={([v]) =>
                  updateSettings({
                    difficultyDistribution: { ...settings.difficultyDistribution, easy: v },
                  })
                }
                min={0}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="w-8 text-right">{settings.difficultyDistribution.easy}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-warning">Medium</span>
              <Slider
                value={[settings.difficultyDistribution.medium]}
                onValueChange={([v]) =>
                  updateSettings({
                    difficultyDistribution: { ...settings.difficultyDistribution, medium: v },
                  })
                }
                min={0}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="w-8 text-right">{settings.difficultyDistribution.medium}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-destructive">Hard</span>
              <Slider
                value={[settings.difficultyDistribution.hard]}
                onValueChange={([v]) =>
                  updateSettings({
                    difficultyDistribution: { ...settings.difficultyDistribution, hard: v },
                  })
                }
                min={0}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="w-8 text-right">{settings.difficultyDistribution.hard}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
