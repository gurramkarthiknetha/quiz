import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

interface BadgeItem {
  badgeId: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

interface BadgeSectionProps {
  badges: BadgeItem[];
}

export default function BadgeSection({ badges }: BadgeSectionProps) {
  // All possible badges for display
  const allBadges = [
    { id: "first_step", name: "First Step", icon: "🎯", description: "Complete your first quiz" },
    { id: "quiz_master", name: "Quiz Master", icon: "🥇", description: "Score 90%+ on a quiz" },
    { id: "perfect_score", name: "Perfect Score", icon: "💯", description: "Achieve 100% on a quiz" },
    { id: "consistent_learner", name: "Consistent Learner", icon: "🔥", description: "Complete 5 quizzes" },
    { id: "high_achiever", name: "High Achiever", icon: "🏆", description: "Score 80%+ on 3 quizzes" },
  ];

  const earnedIds = new Set(badges.map((b) => b.badgeId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-500" />
          My Badges
          <Badge variant="secondary" className="ml-auto">
            {badges.length} / {allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No badges earned yet. Complete quizzes to unlock badges!
          </p>
        ) : null}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {allBadges.map((badge) => {
            const earned = earnedIds.has(badge.id);
            const earnedBadge = badges.find((b) => b.badgeId === badge.id);

            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${
                  earned
                    ? "bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/30 dark:to-background border-purple-200 dark:border-purple-800 shadow-sm"
                    : "opacity-40 grayscale border-dashed"
                }`}
                title={
                  earned
                    ? `Earned on ${new Date(earnedBadge!.earnedAt).toLocaleDateString()}`
                    : badge.description
                }
              >
                <span className="text-3xl mb-1">{badge.icon}</span>
                <span className="text-xs font-medium leading-tight">{badge.name}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {badge.description}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
