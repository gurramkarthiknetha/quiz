import { createContext, useContext, useState, ReactNode } from "react";
import { Question, QuizSettings, defaultSettings } from "@/types/quiz";

interface QuizContextType {
  inputText: string;
  setInputText: (text: string) => void;
  settings: QuizSettings;
  updateSettings: (settings: Partial<QuizSettings>) => void;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  topics: string[];
  setTopics: (topics: string[]) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

export const useQuiz = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
};

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [inputText, setInputText] = useState("");
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateSettings = (partial: Partial<QuizSettings>) =>
    setSettings((prev) => ({ ...prev, ...partial }));

  return (
    <QuizContext.Provider
      value={{
        inputText, setInputText,
        settings, updateSettings,
        questions, setQuestions,
        topics, setTopics,
        isGenerating, setIsGenerating,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
