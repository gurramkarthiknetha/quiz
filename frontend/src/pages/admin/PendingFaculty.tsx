import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";

interface PendingFaculty {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

const PendingFaculty = () => {
  const [pendingFaculty, setPendingFaculty] = useState<PendingFaculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<PendingFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingUser, setRejectingUser] = useState<PendingFaculty | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingFaculty();
  }, []);

  useEffect(() => {
    // Filter faculty based on search query
    const filtered = pendingFaculty.filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFaculty(filtered);
  }, [searchQuery, pendingFaculty]);

  const fetchPendingFaculty = async () => {
    try {
      const res = await adminApi.getPendingFaculty();
      setPendingFaculty(res.data.data as PendingFaculty[]);
      setFilteredFaculty(res.data.data as PendingFaculty[]);
    } catch (error) {
      console.error("Error fetching pending faculty:", error);
      toast.error("Failed to load pending faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFaculty = async (userId: string) => {
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await adminApi.approveFaculty(userId);
      setPendingFaculty((prev) => prev.filter((f) => f._id !== userId));
      toast.success("Faculty approved successfully");
    } catch (error) {
      toast.error("Failed to approve faculty");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const openRejectDialog = (faculty: PendingFaculty) => {
    setRejectingUser(faculty);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectFaculty = async () => {
    if (!rejectingUser) return;
    
    const userId = rejectingUser._id;
    setProcessingIds((prev) => new Set(prev).add(userId));
    setRejectDialogOpen(false);
    
    try {
      await adminApi.rejectFaculty(userId, rejectReason || "Application rejected by administrator");
      setPendingFaculty((prev) => prev.filter((f) => f._id !== userId));
      toast.success("Faculty application rejected");
    } catch (error) {
      toast.error("Failed to reject faculty");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setRejectingUser(null);
    }
  };

  const handleApproveAll = async () => {
    if (filteredFaculty.length === 0) return;
    
    const confirmApprove = window.confirm(
      `Are you sure you want to approve all ${filteredFaculty.length} pending faculty applications?`
    );
    
    if (!confirmApprove) return;
    
    for (const faculty of filteredFaculty) {
      await handleApproveFaculty(faculty._id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8 text-amber-600" />
              Pending Faculty Approvals
            </h1>
            <p className="text-muted-foreground">
              Review and approve faculty registration requests
            </p>
          </div>
        </div>
        {filteredFaculty.length > 1 && (
          <Button onClick={handleApproveAll} className="bg-green-600 hover:bg-green-700">
            <UserCheck className="mr-2 h-4 w-4" />
            Approve All ({filteredFaculty.length})
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-3xl font-bold">{pendingFaculty.length}</p>
              </div>
            </div>
            {searchQuery && filteredFaculty.length !== pendingFaculty.length && (
              <Badge variant="secondary">
                Showing {filteredFaculty.length} of {pendingFaculty.length}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Faculty List */}
      {filteredFaculty.length > 0 ? (
        <div className="space-y-4">
          {filteredFaculty.map((faculty) => (
            <Card key={faculty._id} className="border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={faculty.avatar} />
                      <AvatarFallback className="text-lg">
                        {faculty.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{faculty.name}</p>
                      <p className="text-muted-foreground">{faculty.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Registered {new Date(faculty.createdAt).toLocaleDateString()} at{" "}
                        {new Date(faculty.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => handleApproveFaculty(faculty._id)}
                      disabled={processingIds.has(faculty._id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => openRejectDialog(faculty)}
                      disabled={processingIds.has(faculty._id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">All caught up!</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No pending faculty match your search"
                    : "No pending faculty approvals at this time"}
                </p>
              </div>
              <Link to="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Reject Faculty Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the faculty application for{" "}
              <strong>{rejectingUser?.name}</strong> ({rejectingUser?.email})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectFaculty}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingFaculty;
