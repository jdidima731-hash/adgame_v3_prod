import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { History as HistoryIcon, Gamepad2, Trophy, XCircle, Clock, Loader2, ChevronRight } from "lucide-react";

const STATUS_CFG = {
  pending: { label: "En attente", icon: Clock,    color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-200" },
  won:     { label: "GAGNÉ 🎉",   icon: Trophy,   color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  lost:    { label: "Perdu",      icon: XCircle,  color: "text-gray-500",   bg: "bg-gray-50",    border: "border-gray-200" },
};

export default function History() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.games.myParticipations.useQuery();
  const participations = (data as any[]) ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" /> Mes participations
          </h1>
          <Badge variant="outline">{participations.length} participation(s)</Badge>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {!isLoading && participations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Gamepad2 className="h-12 w-12 mx-auto text-gray-200" />
              <p className="text-gray-400 dark:text-gray-500">Vous n'avez pas encore participé à un jeu</p>
              <Button onClick={() => setLocation("/wheel")} className="gap-2">
                <Gamepad2 className="h-4 w-4" /> Découvrir les jeux
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {participations.map((p: any) => {
            const s = STATUS_CFG[p.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
            return (
              <Card key={p.id} className={`border ${s.border} hover:shadow-sm transition-shadow`}>
                <CardContent className="py-3.5 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.game?.title ?? "Jeu"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">#{p.participationNumber}</span>
                    </div>
                    {p.lotWon && (
                      <p className="text-xs text-green-700 font-medium mt-0.5 flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> Lot gagné : {p.lotWon}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs ${s.color} ${s.bg} border ${s.border}`}>{s.label}</Badge>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => p.game?.id && setLocation(`/wheel/${p.game.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
