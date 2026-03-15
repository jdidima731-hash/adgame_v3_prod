import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Gamepad2, Tag, MapPin, Trophy, Clock, Loader2, QrCode, Star, ChevronRight, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: games, isLoading: loadingGames } = trpc.games.listActive.useQuery({ limit: 4 });
  const { data: offers } = trpc.offers.listActive.useQuery({ cityId: undefined });
  const { data: participations } = trpc.games.myParticipations.useQuery();
  const { data: partners } = trpc.partners.list.useQuery({ lat: 36.819, lng: 10.165 });

  const myGains = (participations as any[])?.filter((p: any) => p.status === "won") ?? [];
  const activeGames = (games as any[]) ?? [];
  const nearbyPartners = (partners as any[])?.slice(0, 3) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Bonjour, {user?.name?.split(" ")[0]} 👋</h1>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Tunis Centre · Bienvenue sur AdGame !
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 gap-2 shrink-0"
              onClick={() => setLocation("/qr-scan")}
            >
              <QrCode className="h-4 w-4" /> Scanner
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: "Participations",    value: (participations as any[])?.length ?? 0,        color: "bg-white/10" },
              { label: "Jeux gagnés",       value: myGains.length,                                 color: "bg-white/10" },
              { label: "Codes promo",       value: (offers as any[])?.length ?? 0,                 color: "bg-white/10" },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center backdrop-blur`}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-blue-100 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Jeux proches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-blue-600" /> Jeux disponibles
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/wheel")} className="text-blue-600 gap-1 text-xs">
              Voir tout <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loadingGames && (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" /></div>
          )}

          <div className="space-y-2">
            {activeGames.map((game: any) => {
              const pct = Math.min(100, Math.round(((game.totalParticipations ?? 0) / (game.maxParticipations ?? 1)) * 100));
              const daysLeft = Math.max(0, Math.ceil((new Date(game.endDate).getTime() - Date.now()) / 86400000));
              return (
                <Card key={game.id} className="hover:shadow-md transition-all cursor-pointer border-gray-100"
                  onClick={() => setLocation(`/wheel/${game.id}`)}>
                  <CardContent className="py-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-xl">🎲</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{game.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(game.totalParticipations ?? 0).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysLeft}j restants</span>
                      </div>
                      <div className="mt-1.5 bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                        <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Button size="sm" className="shrink-0 h-8 text-xs bg-blue-600 hover:bg-blue-700">Jouer</Button>
                  </CardContent>
                </Card>
              );
            })}
            {!loadingGames && activeGames.length === 0 && (
              <Card><CardContent className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucun jeu disponible pour le moment</CardContent></Card>
            )}
          </div>
        </div>

        {/* Mes gains */}
        {myGains.length > 0 && (
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-500" /> Mes gains
            </h2>
            <div className="space-y-2">
              {myGains.slice(0, 3).map((p: any) => (
                <Card key={p.id} className="border-yellow-200 bg-yellow-50">
                  <CardContent className="py-3 flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.lotWon ?? "Lot gagné"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.game?.title} · {new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Gagné !</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Offres promo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-600" /> Offres du moment
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/ads")} className="text-purple-600 gap-1 text-xs">
              Voir tout <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {((offers as any[]) ?? []).slice(0, 4).map((offer: any) => (
              <Card key={offer.id} className="border-purple-100 bg-purple-50 hover:shadow-sm transition-shadow">
                <CardContent className="py-3 flex items-center gap-2.5">
                  <Tag className="h-4 w-4 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{offer.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Code : <span className="font-mono font-bold text-purple-700">{offer.promoCode}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Commerces proches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" /> Près de vous
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/partners")} className="text-green-600 gap-1 text-xs">
              Carte <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {nearbyPartners.map((p: any) => (
              <Card key={p.id} className="hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setLocation("/partners")}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-lg shrink-0">
                    {p.category === "Coiffeur" ? "✂️" : p.category === "Restaurant" ? "🍽️" : p.category === "Santé" ? "🏥" : "🏪"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.businessName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{p.rating}</span>
                      {p.activeGames > 0 && <span className="text-blue-600">{p.activeGames} jeu(x)</span>}
                      {p.activeOffers > 0 && <span className="text-purple-600">{p.activeOffers} offre(s)</span>}
                    </div>
                  </div>
                  <Badge className={`text-xs shrink-0 ${p.isOpen ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500"}`}>
                    {p.isOpen ? "Ouvert" : "Fermé"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
