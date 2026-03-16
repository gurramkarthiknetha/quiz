import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuiz } from "@/context/QuizContext";
import { toast } from "sonner";

const SERVER_URI = import.meta.env.VITE_SERVER_URI || "http://localhost:6221";

export function FileUpload() {
  const { inputText, setInputText } = useQuiz();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      
      if (!["txt", "pdf"].includes(extension || "")) {
        toast.error("Please upload a .txt or .pdf file");
        return;
      }

      setIsProcessing(true);

      try {
        // Upload to backend for processing
        const formData = new FormData();
        formData.append("file", file);

        toast.info("Uploading and processing file...");

        const response = await fetch(`${SERVER_URI}/api/upload/pdf`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to process file");
        }

        const extractedText = result.data.text;

        if (extractedText.length < 50) {
          toast.error("The file doesn't contain enough text. Please upload a file with more content.");
          return;
        }

        setInputText(extractedText);
        setFileName(file.name);
        toast.success(`Loaded: ${file.name} (${result.data.characterCount} characters)`);
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error(error instanceof Error ? error.message : "Failed to process file. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [setInputText]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50"
        } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-primary mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Drag & drop a file or{" "}
              <span className="text-primary font-medium">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF and TXT files</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-2 text-sm bg-accent/50 rounded-md px-3 py-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="flex-1">{fileName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFileName(null);
              setInputText("");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="relative">
        <Textarea
          placeholder="Or paste your study notes here..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setFileName(null);
          }}
          className="min-h-[200px] resize-y"
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
          {inputText.length} chars
        </span>
      </div>
    </div>
  );
}
