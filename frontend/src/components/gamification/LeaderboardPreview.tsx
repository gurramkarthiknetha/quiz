import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Medal, Trophy } from "lucide-react";
import { leaderboardApi } from "@/services/api";

interface LeaderboardEntry {
  rank: number;
  _id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  totalQuizzes: number;
  averageScore: number;
  badgeCount: number;
}

interface LeaderboardPreviewProps {
  /** How many entries to show (default 5) */
  limit?: number;
  /** Current user's ID to highlight */
  currentUserId?: string;
}

export default function LeaderboardPreview({ limit = 5, currentUserId }: LeaderboardPreviewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await leaderboardApi.getLeaderboard();
        setEntries((res.data.data as LeaderboardEntry[]) || []);
      } catch {
        // Silently fail - leaderboard is not critical
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No students on the leaderboard yet.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, limit).map((entry) => {
              const isCurrentUser = entry._id === currentUserId;
              return (
                <div
                  key={entry._id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCurrentUser
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>

                  {/* Avatar */}
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.avatar} alt={entry.name} />
                    <AvatarFallback className="text-xs">
                      {entry.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + Level */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.name}
                      {isCurrentUser && (
                        <span className="text-xs text-primary ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {entry.level} • {entry.totalQuizzes} quizzes
                    </p>
                  </div>

                  {/* XP */}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entry.xp} XP
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
