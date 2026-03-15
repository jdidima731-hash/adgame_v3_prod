import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Trophy, Tag, Star, Edit3, Save, X,
  Lock, Phone, Mail, Calendar, ChevronRight, Loader2,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  advertiser: "bg-purple-100 text-purple-700",
  partner: "bg-green-100 text-green-700",
  user: "bg-blue-100 text-blue-700",
};
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur", advertiser: "Annonceur", partner: "Partenaire", user: "Utilisateur",
};

export default function Profile() {
  const { user, refresh } = useAuth();
  const utils = trpc.useUtils();

  const [editingInfo, setEditingInfo] = useState(false);
  const [editingPwd, setEditingPwd] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const { data: participations } = trpc.games.myParticipations.useQuery();
  const { data: offers } = trpc.offers.listActive.useQuery({ cityId: undefined });

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.success("Profil mis à jour !");
      utils.auth.me.setData(undefined, (old: any) => old ? { ...old, name: data.name, phone: data.phone } : old);
      refresh();
      setEditingInfo(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Mot de passe modifié !");
      setEditingPwd(false);
      setPwd({ current: "", next: "", confirm: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const myWins = (participations as any[])?.filter((p: any) => p.status === "won") ?? [];
  const totalParts = (participations as any[])?.length ?? 0;

  const handleSaveInfo = () => {
    if (!name.trim()) return toast.error("Le nom ne peut pas être vide");
    updateProfile.mutate({ name: name.trim(), phone: phone.trim() || undefined });
  };

  const handleSavePwd = () => {
    if (!pwd.current || !pwd.next) return toast.error("Remplissez tous les champs");
    if (pwd.next.length < 8) return toast.error("Minimum 8 caractères");
    if (pwd.next !== pwd.confirm) return toast.error("Les mots de passe ne correspondent pas");
    changePassword.mutate({ currentPassword: pwd.current, newPassword: pwd.next });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" /> Mon profil
        </h1>

        {/* ── Carte identité ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-16 w-16 border-2 border-blue-200 shadow">
                  <AvatarFallback className={`text-xl font-black ${ROLE_COLORS[user?.role ?? "user"]}`}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                {editingInfo ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Nom complet</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 h-9" autoFocus />
                    </div>
                    <div>
                      <Label className="text-xs">Téléphone</Label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 99 000 000" className="mt-1 h-9" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveInfo} disabled={updateProfile.isPending} className="gap-1.5">
                        {updateProfile.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingInfo(false); setName(user?.name ?? ""); setPhone(user?.phone ?? ""); }}>
                        <X className="h-3 w-3 mr-1" />Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold">{user?.name}</h2>
                      <Badge className={`capitalize text-xs ${ROLE_COLORS[user?.role ?? "user"]}`}>
                        {ROLE_LABELS[user?.role ?? "user"]}
                      </Badge>
                    </div>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" /> {user?.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        {user?.phone || <span className="italic text-gray-400 dark:text-gray-500">Non renseigné</span>}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="ghost"
                      className="mt-3 h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => { setEditingInfo(true); setName(user?.name ?? ""); setPhone(user?.phone ?? ""); }}
                    >
                      <Edit3 className="h-3 w-3 mr-1" /> Modifier mes informations
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Participations", value: totalParts, icon: Trophy, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Jeux gagnés",    value: myWins.length, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Offres dispo",   value: (offers as any[])?.length ?? 0, icon: Tag, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Membre depuis",  value: "Mars 2026", icon: Calendar, color: "text-green-600", bg: "bg-green-50", small: true },
          ].map(s => (
            <Card key={s.label} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 pb-3 text-center">
                <div className={`inline-flex p-2 rounded-xl mb-2 ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className={`font-black ${s.small ? "text-sm" : "text-2xl"}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Mes gains ── */}
        {myWins.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Mes gains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myWins.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <span className="text-xl">🏆</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.lotWon ?? "Lot gagné"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.game?.title} · {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">Réclamable</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Sécurité ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600 dark:text-gray-300" /> Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!editingPwd ? (
              <Button
                variant="outline" size="sm"
                className="gap-2"
                onClick={() => setEditingPwd(true)}
              >
                <Lock className="h-4 w-4" /> Changer le mot de passe
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              </Button>
            ) : (
              <div className="space-y-3 max-w-sm">
                <div>
                  <Label className="text-xs">Mot de passe actuel</Label>
                  <Input
                    type="password" placeholder="••••••••"
                    value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                    className="mt-1 h-9"
                  />
                </div>
                <Separator />
                <div>
                  <Label className="text-xs">Nouveau mot de passe</Label>
                  <Input
                    type="password" placeholder="8 caractères minimum"
                    value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Confirmer le nouveau mot de passe</Label>
                  <Input
                    type="password" placeholder="Répéter le nouveau mot de passe"
                    value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                    className="mt-1 h-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSavePwd} disabled={changePassword.isPending} className="gap-1.5">
                    {changePassword.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingPwd(false); setPwd({ current: "", next: "", confirm: "" }); }}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
