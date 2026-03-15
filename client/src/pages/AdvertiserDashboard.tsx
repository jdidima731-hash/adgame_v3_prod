import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, Gamepad2, Tv, Bot, Tag, MessageSquare, Plus, TrendingUp, Users, Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: myGames, isLoading: loadingGames } = trpc.games.listByAdvertiser.useQuery();
  const { data: myAds } = trpc.ads.listMine.useQuery();
  const { data: myOffers } = trpc.offers.listMine.useQuery();
  const { data: unreadMsgs } = trpc.messages.unreadCount.useQuery();

  const games = (myGames as any[]) ?? [];
  const ads = (myAds as any[]) ?? [];
  const offers = (myOffers as any[]) ?? [];

  const activeGames  = games.filter(g => g.status === "active");
  const pendingGames = games.filter(g => g.status === "pending");
  const approvedAds  = ads.filter(a => a.status === "approved");
  const activeOffers = offers.filter(o => o.isActive);
  const totalParticipations = games.reduce((acc, g) => acc + (g.totalParticipations ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Bonjour, {user?.name?.split(" ")[0]} 👋</h1>
              <p className="text-purple-200 text-sm mt-1">Gérez vos campagnes et jeux publicitaires</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 gap-2 shrink-0"
              onClick={() => setLocation("/advertiser/games/new")}
            >
              <Plus className="h-4 w-4" /> Créer un jeu
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Jeux actifs",     value: activeGames.length },
              { label: "Participations",  value: totalParticipations.toLocaleString() },
              { label: "Pubs validées",   value: approvedAds.length },
              { label: "Offres actives",  value: activeOffers.length },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-purple-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        {pendingGames.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 flex-1">
              <span className="font-semibold">{pendingGames.length} jeu(x)</span> en attente de validation par l'admin
            </p>
            <Badge className="bg-yellow-100 text-yellow-700 text-xs">{pendingGames.length} en attente</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Mes jeux ── */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-purple-600" /> Mes jeux
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setLocation("/advertiser/games/new")} className="h-7 text-xs gap-1 text-purple-600">
                <Plus className="h-3 w-3" /> Nouveau
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingGames && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" /></div>}
              {!loadingGames && games.length === 0 && (
                <div className="py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucun jeu créé.{" "}
                  <button onClick={() => setLocation("/advertiser/games/new")} className="text-purple-600 underline">Créer le premier</button>
                </div>
              )}
              {games.slice(0, 5).map((game: any) => {
                const pct = Math.min(100, Math.round(((game.totalParticipations ?? 0) / (game.maxParticipations ?? 1)) * 100));
                const daysLeft = Math.max(0, Math.ceil((new Date(game.endDate).getTime() - Date.now()) / 86400000));
                const statusCfg = {
                  active:  { label: "Actif",      color: "text-green-700 bg-green-50 border-green-200" },
                  pending: { label: "En attente", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
                  draft:   { label: "Brouillon",  color: "text-gray-500 bg-gray-50 border-gray-200" },
                  ended:   { label: "Terminé",    color: "text-gray-400 bg-gray-50 border-gray-200" },
                };
                const sc = statusCfg[game.status as keyof typeof statusCfg] ?? statusCfg.draft;
                return (
                  <div key={game.id} className="p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all cursor-pointer"
                    onClick={() => setLocation(`/wheel/${game.id}`)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">{game.title}</p>
                      <Badge className={`text-xs shrink-0 ${sc.color}`}>{sc.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(game.totalParticipations ?? 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysLeft}j restants</span>
                      <span className="ml-auto">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1 mt-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* ── Actions rapides ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 px-1">Actions rapides</p>
            {[
              { icon: Tv,           label: "Studio pub",        desc: "Créer une publicité vidéo",     path: "/ads",                   color: "bg-blue-500",   iconBg: "bg-blue-50 text-blue-600" },
              { icon: Bot,          label: "Social Manager",    desc: "Gérer vos réseaux sociaux",     path: "/advertiser/social",     color: "bg-pink-500",   iconBg: "bg-pink-50 text-pink-600" },
              { icon: Tag,          label: "Offres & couverture",desc: "Zones et promotions",          path: "/advertiser/coverage",   color: "bg-orange-500", iconBg: "bg-orange-50 text-orange-600" },
              { icon: MessageSquare,label: "Messages",           desc: `${unreadMsgs ?? 0} non lu(s)`, path: "/messages",              color: "bg-green-500",  iconBg: "bg-green-50 text-green-600" },
            ].map(item => (
              <Card key={item.path} className="cursor-pointer hover:shadow-md transition-all border-gray-100 hover:border-gray-200"
                onClick={() => setLocation(item.path)}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Mes pubs ── */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tv className="h-4 w-4 text-blue-600" /> Mes publicités récentes
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setLocation("/ads")} className="h-7 text-xs gap-1 text-blue-600">
              <Plus className="h-3 w-3" /> Créer
            </Button>
          </CardHeader>
          <CardContent>
            {ads.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Aucune pub créée</p>
            ) : (
              <div className="space-y-2">
                {ads.slice(0, 4).map((ad: any) => {
                  const statusCfg = {
                    approved: { label: "Validée ✓", color: "bg-green-100 text-green-700" },
                    pending:  { label: "En attente",color: "bg-yellow-100 text-yellow-700" },
                    rejected: { label: "Rejetée",   color: "bg-red-100 text-red-700" },
                    draft:    { label: "Brouillon", color: "bg-gray-100 text-gray-500" },
                  };
                  const sc = statusCfg[ad.status as keyof typeof statusCfg] ?? statusCfg.draft;
                  return (
                    <div key={ad.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <Tv className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ad.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{ad.duration}s · {ad.type}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${sc.color}`}>{sc.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Activité récente ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeGames.slice(0, 3).map((g: any) => (
              <div key={g.id} className="flex items-center gap-3 py-1.5">
                <Gamepad2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="text-sm flex-1">{g.totalParticipations} participants sur «{g.title}»</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">Aujourd'hui</span>
              </div>
            ))}
            {activeGames.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2 text-center">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
