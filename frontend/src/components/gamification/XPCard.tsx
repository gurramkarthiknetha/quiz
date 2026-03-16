import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Star } from "lucide-react";

interface XpProgress {
  currentXp: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  xpToNextLevel: number;
}

interface XPCardProps {
  xp: number;
  level: number;
  xpProgress?: XpProgress;
}

export default function XPCard({ xp, level, xpProgress }: XPCardProps) {
  const progress = xpProgress?.progressPercent ?? 0;
  const xpToNext = xpProgress?.xpToNextLevel ?? 0;

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">XP & Level</CardTitle>
        <Star className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Level badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-lg shadow-md">
            {level}
          </div>
          <div>
            <p className="text-2xl font-bold">{xp} XP</p>
            <p className="text-xs text-muted-foreground">Level {level}</p>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              Progress to Level {level + 1}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {xpToNext} XP to next level
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
