import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notesApi } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  FileText,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

interface NoteData {
  _id: string;
  title: string;
  description: string;
  content: string;
  subject: string;
  topic: string;
  tags: string[];
  isPublished: boolean;
  attachment?: {
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

const CreateEditNote = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(noteId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<NoteData["attachment"] | null>(
    null
  );

  useEffect(() => {
    if (isEdit && noteId) {
      const fetchNote = async () => {
        try {
          const res = await notesApi.getNote(noteId);
          const note = res.data.data as NoteData;
          setTitle(note.title);
          setDescription(note.description || "");
          setContent(note.content || "");
          setSubject(note.subject);
          setTopic(note.topic || "");
          setTags(note.tags || []);
          setIsPublished(note.isPublished);
          if (note.attachment?.fileName) {
            setExistingAttachment(note.attachment);
          }
        } catch (error) {
          console.error("Error fetching note:", error);
          toast.error("Failed to load note");
          navigate("/faculty/notes");
        } finally {
          setLoading(false);
        }
      };
      fetchNote();
    }
  }, [noteId, isEdit, navigate]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (publish: boolean = isPublished) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!content.trim() && !file && !existingAttachment) {
      toast.error("Please add content or upload a file");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("content", content.trim());
      formData.append("subject", subject.trim());
      formData.append("topic", topic.trim());
      formData.append("isPublished", String(publish));
      tags.forEach((tag) => formData.append("tags[]", tag));

      if (file) {
        formData.append("file", file);
      }

      if (isEdit && noteId) {
        await notesApi.updateNote(noteId, formData);
        toast.success("Note updated successfully");
      } else {
        await notesApi.createNote(formData);
        toast.success(publish ? "Note published successfully" : "Note saved as draft");
      }

      navigate("/faculty/notes");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/faculty/notes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Edit Note" : "Create Note"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Update your note content and settings"
              : "Create a new note to share with students"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Note Content</CardTitle>
              <CardDescription>Write or paste your note content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to Data Structures"
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this note..."
                  rows={2}
                  maxLength={1000}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or paste your notes here..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                File Attachment
              </CardTitle>
              <CardDescription>
                Optionally attach a PDF, TXT, or DOC file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingAttachment && !file && (
                <div className="flex items-center gap-3 p-3 border rounded-lg mb-4 bg-muted/50">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {existingAttachment.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">Current attachment</p>
                  </div>
                  <a
                    href={existingAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </a>
                </div>
              )}

              {file && (
                <div className="flex items-center gap-3 p-3 border rounded-lg mb-4 bg-muted/50">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("note-file-input")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file || existingAttachment ? "Replace File" : "Upload File"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  PDF, TXT, DOC, DOCX (max 10 MB)
                </span>
              </div>
              <input
                id="note-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 10 * 1024 * 1024) {
                      toast.error("File size must be under 10 MB");
                      return;
                    }
                    setFile(f);
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Computer Science"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Binary Trees"
                  maxLength={100}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="published">Publish immediately</Label>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                className="w-full"
                onClick={() => handleSubmit(true)}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save & Publish"}
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save as Draft"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEditNote;
