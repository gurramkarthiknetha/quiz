import { useEffect, useState } from "react";
import { notesApi } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Download,
  Eye,
  BookOpen,
  User,
  Calendar,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

interface Note {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  subject: string;
  topic?: string;
  tags: string[];
  viewCount: number;
  attachment?: {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  creator?: {
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

const BrowseNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchSubjects();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await notesApi.getPublishedNotes({ limit: 50 });
      setNotes((res.data.data as Note[]) || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await notesApi.getSubjects();
      setSubjects((res.data.data as string[]) || []);
    } catch {
      // ignore
    }
  };

  const handleViewNote = async (note: Note) => {
    setViewLoading(true);
    setViewDialogOpen(true);
    try {
      const res = await notesApi.getNote(note._id);
      setSelectedNote(res.data.data as Note);
    } catch (error) {
      toast.error("Failed to load note");
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Client-side filtering
  const filtered = notes.filter((note) => {
    const matchesSearch =
      !searchQuery.trim() ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.topic && note.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject =
      subjectFilter === "all" || note.subject === subjectFilter;

    return matchesSearch && matchesSubject;
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          Study Notes
        </h1>
        <p className="text-muted-foreground">
          Browse notes published by your faculty
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Card
              key={note._id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleViewNote(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                      {note.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {note.description || "No description"}
                    </CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{note.subject}</Badge>
                  {note.topic && (
                    <Badge variant="secondary" className="text-xs">
                      {note.topic}
                    </Badge>
                  )}
                </div>

                {note.attachment?.fileName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate">{note.attachment.fileName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {note.creator?.name || "Faculty"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {note.viewCount} views
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No notes found</h3>
            <p className="text-muted-foreground">
              {searchQuery || subjectFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No notes have been published yet. Check back later!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Note Viewer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {viewLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-[300px]" />
            </div>
          ) : selectedNote ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedNote.title}</DialogTitle>
                <DialogDescription>
                  <span className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{selectedNote.subject}</Badge>
                    {selectedNote.topic && (
                      <Badge variant="secondary">{selectedNote.topic}</Badge>
                    )}
                    {selectedNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <span className="text-xs">
                      by {selectedNote.creator?.name || "Faculty"} •{" "}
                      {formatDate(selectedNote.createdAt)}
                    </span>
                  </span>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4 pr-4">
                  {selectedNote.description && (
                    <p className="text-sm text-muted-foreground italic">
                      {selectedNote.description}
                    </p>
                  )}

                  {selectedNote.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap border rounded-lg p-4 bg-muted/30">
                      {selectedNote.content}
                    </div>
                  )}

                  {selectedNote.attachment?.url && (
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                      <FileText className="h-10 w-10 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {selectedNote.attachment.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedNote.attachment.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <a
                        href={selectedNote.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseNotes;
