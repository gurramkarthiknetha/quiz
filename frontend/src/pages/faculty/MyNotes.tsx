import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Search,
  FileText,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

interface Note {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  attachment?: {
    url: string;
    fileName: string;
    fileSize: number;
  };
  createdAt: string;
  updatedAt: string;
}

const MyNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filtered, setFiltered] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(notes);
    } else {
      const q = searchQuery.toLowerCase();
      setFiltered(
        notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.subject.toLowerCase().includes(q) ||
            (n.topic && n.topic.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, notes]);

  const fetchNotes = async () => {
    try {
      const res = await notesApi.getMyNotes({ limit: 100 });
      setNotes((res.data.data as Note[]) || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (note: Note) => {
    try {
      const res = await notesApi.togglePublish(note._id);
      const updated = res.data.data as Note;
      setNotes((prev) =>
        prev.map((n) => (n._id === note._id ? { ...n, isPublished: updated.isPublished } : n))
      );
      toast.success(updated.isPublished ? "Note published" : "Note unpublished");
    } catch (error) {
      toast.error("Failed to update publish status");
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    try {
      await notesApi.deleteNote(noteToDelete._id);
      setNotes((prev) => prev.filter((n) => n._id !== noteToDelete._id));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="text-muted-foreground">
            Create and manage your study notes for students
          </p>
        </div>
        <Link to="/faculty/create-note">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Note
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Notes ({filtered.length})</CardTitle>
          <CardDescription>Manage your uploaded notes and publish them for students</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((note) => (
                  <TableRow key={note._id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">{note.title}</p>
                        {note.topic && (
                          <p className="text-xs text-muted-foreground">{note.topic}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{note.subject}</Badge>
                    </TableCell>
                    <TableCell>
                      {note.attachment?.fileName ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {note.attachment.fileName}
                          </span>
                          <span>({formatSize(note.attachment.fileSize)})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Text only</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {note.isPublished ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{note.viewCount}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(note.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={note.isPublished ? "Unpublish" : "Publish"}
                          onClick={() => handleTogglePublish(note)}
                        >
                          {note.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Link to={`/faculty/edit-note/${note._id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setNoteToDelete(note);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first note to share with students
              </p>
              <Link to="/faculty/create-note">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Note
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{noteToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyNotes;
