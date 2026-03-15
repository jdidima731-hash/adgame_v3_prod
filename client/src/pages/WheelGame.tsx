import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { getGameQrUrl } from "@/lib/qrcode";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import { Gamepad2, Trophy, Clock, Users, CheckCircle2, Loader2, QrCode, MapPin } from "lucide-react";

export default function WheelGame() {
  const [, params] = useRoute("/wheel/:gameId");
  const gameId = params?.gameId ? Number(params.gameId) : undefined;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "", acceptOffers: true, acceptTerms: false });
  const [submitted, setSubmitted] = useState(false);
  const [participationNum, setParticipationNum] = useState("");

  const { data: games, isLoading: loadingGames } = trpc.games.listActive.useQuery({ limit: 10 });
  const { data: game } = trpc.games.getById.useQuery({ id: gameId! }, { enabled: !!gameId });
  const displayGame = game ?? (games as any[])?.[0];

  const participateMutation = trpc.games.participate.useMutation({
    onSuccess: (data: any) => {
      setParticipationNum(data?.participationNumber ?? "ADG-????");
      setSubmitted(true);
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur lors de la participation"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error("Remplissez les champs obligatoires");
    if (!form.acceptTerms) return toast.error("Acceptez les conditions du jeu");
    if (!displayGame) return toast.error("Aucun jeu sélectionné");
    participateMutation.mutate({ gameId: displayGame.id, name: form.name, email: form.email, phone: form.phone || undefined });
  };

  const daysLeft = displayGame?.endDate
    ? Math.max(0, Math.ceil((new Date(displayGame.endDate).getTime() - Date.now()) / 86400000))
    : null;

  /* ─── Écran confirmation ─── */
  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center space-y-6 pt-6">
          <div className="text-7xl animate-bounce">🎉</div>
          <Card className="border-green-200 bg-gradient-to-b from-green-50 to-white">
            <CardContent className="pt-6 space-y-4">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold text-green-800">Participation enregistrée !</h2>
              <div className="bg-white border border-green-200 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Numéro</span>
                  <span className="font-mono font-bold text-green-700">#{participationNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Jeu</span>
                  <span className="font-medium">{displayGame?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Date</span>
                  <span>{new Date().toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tirage</span>
                  <span className="font-medium text-blue-700">
                    {displayGame?.endDate ? new Date(displayGame.endDate).toLocaleDateString("fr-FR") : "À venir"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Les gagnants sont notifiés par email</p>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setLocation("/history")}>
              <Clock className="h-4 w-4 mr-1" /> Mes participations
            </Button>
            <Button className="flex-1" onClick={() => { setSubmitted(false); }}>
              Autre jeu
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-blue-600" /> Jeux disponibles
        </h1>

        {loadingGames && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {!loadingGames && !displayGame && (
          <Card>
            <CardContent className="py-12 text-center">
              <Gamepad2 className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 dark:text-gray-500">Aucun jeu actif pour le moment</p>
            </CardContent>
          </Card>
        )}

        {/* Onglets jeux */}
        {(games as any[])?.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(games as any[]).map((g: any) => (
              <button key={g.id}
                onClick={() => setLocation(`/wheel/${g.id}`)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-all
                  ${displayGame?.id === g.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                {g.title}
              </button>
            ))}
          </div>
        )}

        {displayGame && (
          <Card>
            {/* Bannière */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-t-xl p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs mb-2">
                    🎮 {displayGame.type?.replace("_", " ").toUpperCase()}
                  </Badge>
                  <h2 className="text-xl font-bold">{displayGame.title}</h2>
                  <p className="text-blue-100 text-sm mt-1">{displayGame.description}</p>
                </div>
                <div className="shrink-0 cursor-pointer" title="QR Code du jeu">
            <img
              src={getGameQrUrl(displayGame.id)}
              alt="QR Code"
              className="w-14 h-14 rounded-lg bg-white p-1"
              loading="lazy"
            />
          </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-blue-100">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {Number(displayGame.totalParticipations ?? 0).toLocaleString()} participants
                </span>
                {daysLeft !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {daysLeft === 0 ? "Dernier jour !" : `${daysLeft} jour(s) restants`}
                  </span>
                )}
              </div>
              {/* Progress */}
              <div className="mt-3 bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((displayGame.totalParticipations ?? 0) / (displayGame.maxParticipations ?? 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-blue-200 mt-1">
                {displayGame.totalParticipations ?? 0} / {displayGame.maxParticipations ?? "?"} places
              </p>
            </div>

            <CardContent className="pt-4 space-y-4">
              {/* Lots */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" /> Lots à gagner
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayGame.lots?.map((lot: any, i: number) => (
                    <Badge key={i} className="bg-yellow-50 text-yellow-800 border border-yellow-200 font-medium">
                      {lot.quantity}× {lot.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
                <p className="text-sm font-semibold">Vos informations</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nom complet *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ahmed Ben Salem" className="mt-1 h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="votre@email.com" className="mt-1 h-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Téléphone (optionnel)</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 99 000 000" className="mt-1 h-9" />
                </div>
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox checked={form.acceptOffers} onCheckedChange={v => setForm(f => ({ ...f, acceptOffers: !!v }))} className="mt-0.5" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">J'accepte de recevoir des offres des commerces partenaires AdGame</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox checked={form.acceptTerms} onCheckedChange={v => setForm(f => ({ ...f, acceptTerms: !!v }))} className="mt-0.5" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">J'ai lu et j'accepte les <span className="text-blue-600 underline">conditions du jeu</span> *</span>
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-semibold gap-2"
                  disabled={participateMutation.isPending}
                >
                  {participateMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</>
                    : <><Gamepad2 className="h-4 w-4" /> Participer maintenant</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
