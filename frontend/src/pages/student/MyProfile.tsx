import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Shield,
  Star,
  Trophy,
  BookOpen,
  TrendingUp,
  Award,
  Edit2,
  Save,
  X,
  Lock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import BadgeSection from "@/components/gamification/BadgeSection";

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  authProvider: string;
  xp: number;
  level: number;
  badges: Array<{
    badgeId: string;
    name: string;
    icon: string;
    description: string;
    earnedAt: string;
  }>;
  totalQuizzes: number;
  averageScore: number;
  highScoreCount: number;
  streakCount: number;
  createdAt: string;
  xpProgress: {
    currentXp: number;
    currentLevel: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progressPercent: number;
    xpToNextLevel: number;
  };
  badgeCount: number;
}

const MyProfile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileApi.getMyProfile();
        const data = res.data.data as ProfileData;
        setProfile(data);
        setEditName(data.name);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await profileApi.updateMyProfile({ name: editName.trim() });
      setProfile(res.data.data as ProfileData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await profileApi.updateMyProfile({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-1" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load profile. Please try again.
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 p-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your stats</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Name (editable) */}
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-center"
                    maxLength={50}
                  />
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile.name);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {profile.email}
              </div>

              {/* Role */}
              <Badge variant="secondary" className="capitalize">
                <Shield className="h-3 w-3 mr-1" />
                {profile.role}
              </Badge>

              <Separator />

              {/* Quick Stats */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Level
                  </span>
                  <span className="font-bold">{profile.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Total XP
                  </span>
                  <span className="font-bold">{profile.xp}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Total Quizzes
                  </span>
                  <span className="font-bold">{profile.totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Avg Score
                  </span>
                  <span className="font-bold">{profile.averageScore}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4 text-purple-500" />
                    Badges
                  </span>
                  <span className="font-bold">{profile.badgeCount}</span>
                </div>
              </div>

              <Separator />

              {/* XP Progress */}
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level {profile.xpProgress.currentLevel}</span>
                  <span>Level {profile.xpProgress.currentLevel + 1}</span>
                </div>
                <Progress value={profile.xpProgress.progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {profile.xpProgress.xpToNextLevel} XP to next level
                </p>
              </div>

              {/* Change Password (local auth only) */}
              {profile.authProvider === "local" && (
                <>
                  <Separator />
                  {!showPasswordChange ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowPasswordChange(true)}
                    >
                      <Lock className="h-3 w-3 mr-2" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="w-full space-y-3">
                      <div>
                        <Label className="text-xs">Current Password</Label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Confirm Password</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleChangePassword} disabled={saving}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <p className="text-xs text-muted-foreground">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Badges */}
        <div className="lg:col-span-2 space-y-6">
          <BadgeSection badges={profile.badges} />

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Score Quizzes</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.highScoreCount}</div>
                <p className="text-xs text-muted-foreground">Quizzes with score ≥ 80%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak</CardTitle>
                <span className="text-lg">🔥</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.streakCount} days</div>
                <p className="text-xs text-muted-foreground">Current activity streak</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
