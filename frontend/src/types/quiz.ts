export type QuestionType = "MCQ" | "TrueFalse" | "ShortAnswer" | "FillBlank";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";
export type ExamMode = "General" | "UPSC" | "JEE" | "College" | "School";

export interface Question {
  id: string;
  _id?: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  difficulty: Difficulty;
  tag: string;
  explanation: string;
  bloomLevel?: BloomLevel;
}

export interface QuizSettings {
  totalQuestions: number;
  questionTypes: QuestionType[];
  examMode: ExamMode;
  bloomsMode: boolean;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface Quiz {
  _id: string;
  id?: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  isPublic: boolean;
  isPublished: boolean;
  questions: Question[];
  questionCount?: number;
  settings?: QuizSettings;
  topics?: string[];
  tags?: string[];
  creator: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  timesPlayed: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string;
}

export const defaultSettings: QuizSettings = {
  totalQuestions: 20,
  questionTypes: ["MCQ", "TrueFalse", "ShortAnswer"],
  examMode: "General",
  bloomsMode: false,
  difficultyDistribution: { easy: 50, medium: 30, hard: 20 },
};
