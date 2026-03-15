import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Shield, Users, Gamepad2, Tv, CheckCircle2, XCircle, Radio, AlertCircle,
  Loader2, BarChart2, TrendingUp, Eye, Plus, Trash2, Send, Wifi, WifiOff,
  Settings, Lock, Unlock, CreditCard, MessageSquare, Upload, Monitor
} from "lucide-react";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("dashboard");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all"|"advertiser"|"user"|"partner">("all");
  const [rejectReason, setRejectReason] = useState("");
  const [newBox, setNewBox] = useState({ name: "", ipAddress: "", cityId: 1, notes: "" });
  const [newFlux, setNewFlux] = useState({ name: "", description: "", cityIds: [1], streamUrl: "" });
  const [boxMsg, setBoxMsg] = useState<{[id:number]: string}>({});

  // Queries
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: activity } = trpc.admin.getRecentActivity.useQuery();
  const { data: pendingAds, refetch: refetchAds } = trpc.admin.listPendingAds.useQuery();
  const { data: pendingGames, refetch: refetchGames } = trpc.admin.listPendingGames.useQuery();
  const { data: pendingAdvertisers, refetch: refetchAdv } = trpc.admin.listPendingAdvertisers.useQuery();
  const { data: allUsers, refetch: refetchUsers } = trpc.admin.listUsers.useQuery({});
  const { data: boxes, refetch: refetchBoxes } = trpc.admin.listBoxes.useQuery();
  const { data: fluxes, refetch: refetchFluxes } = trpc.admin.listFluxes.useQuery();
  const { data: subs, refetch: refetchSubs } = trpc.admin.listSubscriptions.useQuery();
  const { data: cities } = trpc.cities.list.useQuery();

  // Mutations
  const approveAd   = trpc.admin.approveAd.useMutation({ onSuccess: () => { toast.success("Pub approuvée"); refetchAds(); } });
  const rejectAd    = trpc.admin.rejectAd.useMutation({ onSuccess: () => { toast.success("Pub rejetée"); refetchAds(); setRejectReason(""); } });
  const approveGame = trpc.admin.approveGame.useMutation({ onSuccess: () => { toast.success("Jeu approuvé"); refetchGames(); } });
  const rejectGame  = trpc.admin.rejectGame.useMutation({ onSuccess: () => { toast.success("Jeu rejeté"); refetchGames(); setRejectReason(""); } });
  const validateAdv = trpc.admin.validateAdvertiser.useMutation({ onSuccess: () => { toast.success("Décision enregistrée"); refetchAdv(); refetchUsers(); } });
  const blockUser   = trpc.admin.blockUser.useMutation({ onSuccess: () => { toast.success("Statut mis à jour"); refetchUsers(); } });
  const deleteUser  = trpc.admin.deleteUser.useMutation({ onSuccess: () => { toast.success("Compte supprimé"); refetchUsers(); } });
  const blockBox    = trpc.admin.blockBox.useMutation({ onSuccess: () => { toast.success("Box mise à jour"); refetchBoxes(); } });
  const addBox      = trpc.admin.addBox.useMutation({ onSuccess: () => { toast.success("Box ajoutée !"); refetchBoxes(); setNewBox({ name: "", ipAddress: "", cityId: 1, notes: "" }); } });
  const updateBox   = trpc.admin.updateBox.useMutation({ onSuccess: () => { toast.success("Box mise à jour"); refetchBoxes(); } });
  const sendBoxMsg  = trpc.admin.sendMessageToBox.useMutation({ onSuccess: () => { toast.success("Message envoyé à la box"); } });
  const createFlux  = trpc.admin.createFlux.useMutation({ onSuccess: () => { toast.success("Flux créé !"); refetchFluxes(); setNewFlux({ name: "", description: "", cityIds: [1], streamUrl: "" }); } });
  const updateFlux  = trpc.admin.updateFlux.useMutation({ onSuccess: () => { toast.success("Flux mis à jour"); refetchFluxes(); } });
  const deleteFlux  = trpc.admin.deleteFlux.useMutation({ onSuccess: () => { toast.success("Flux supprimé"); refetchFluxes(); } });
  const broadcast   = trpc.admin.sendBroadcastMessage.useMutation({ onSuccess: (d) => { toast.success(`Message envoyé à ${d.sent} utilisateur(s)`); setBroadcastMsg(""); } });
  const updateSub   = trpc.admin.updateSubscriptionStatus.useMutation({ onSuccess: () => { toast.success("Abonnement mis à jour"); refetchSubs(); } });

  const s = stats as any;
  const totalPending = (s?.pendingAds ?? 0) + (s?.pendingGames ?? 0) + (s?.pendingAdvertisers ?? 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 dark:text-gray-100">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl"><Shield className="h-6 w-6 text-red-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Administration AdGame</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Contrôle total de la plateforme · Accès sécurisé</p>
          </div>
          {totalPending > 0 && <Badge className="bg-red-500 text-white ml-auto">{totalPending} en attente</Badge>}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="validations" className="relative">
              Validations
              {totalPending > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{totalPending}</span>}
            </TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="boxes">Boxes</TabsTrigger>
            <TabsTrigger value="fluxes">Flux diffusion</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* ── DASHBOARD ── */}
          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Annonceurs",  value: s?.advertisers ?? 0,       icon: Tv,         color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Partenaires", value: s?.partners ?? 0,          icon: Users,      color: "text-green-600",  bg: "bg-green-50" },
                { label: "Jeux actifs", value: s?.activeGames ?? 0,       icon: Gamepad2,   color: "text-blue-600",   bg: "bg-blue-50" },
                { label: "CA mensuel",  value: `${(s?.monthlyRevenue ?? 0).toLocaleString()} DT`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map(st => (
                <Card key={st.label}>
                  <CardContent className="pt-4 pb-3">
                    <div className={`inline-flex p-2 rounded-lg mb-2 ${st.bg}`}><st.icon className={`h-4 w-4 ${st.color}`} /></div>
                    <p className="text-2xl font-black">{st.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{st.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card className="border-green-100"><CardContent className="py-3 text-center"><p className="text-2xl font-black text-green-700">{s?.onlineBoxes ?? 0}</p><p className="text-xs text-green-600">Boxes en ligne</p></CardContent></Card>
              <Card className="border-red-100"><CardContent className="py-3 text-center"><p className="text-2xl font-black text-red-700">{(s?.totalBoxes ?? 0) - (s?.onlineBoxes ?? 0)}</p><p className="text-xs text-red-600">Boxes hors ligne</p></CardContent></Card>
              <Card className="border-yellow-100"><CardContent className="py-3 text-center"><p className="text-2xl font-black text-yellow-700">{totalPending}</p><p className="text-xs text-yellow-600">En attente validation</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="h-4 w-4" />Activité récente</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {((activity as any[]) ?? []).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${a.type === "game" ? "bg-blue-500" : a.type === "ad" ? "bg-purple-500" : a.type === "user" ? "bg-green-500" : "bg-orange-500"}`} />
                    <span className="text-sm flex-1">{a.message}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{new Date(a.time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── VALIDATIONS ── */}
          <TabsContent value="validations" className="space-y-4 mt-4">
            {/* Advertiser registrations */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-green-600" />Comptes annonceurs à valider</CardTitle>
                {(pendingAdvertisers as any[])?.length > 0 && <Badge className="bg-red-500 text-white text-xs">{(pendingAdvertisers as any[]).length}</Badge>}
              </CardHeader>
              <CardContent className="space-y-2">
                {!(pendingAdvertisers as any[])?.length && <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Aucun compte en attente</p>}
                {(pendingAdvertisers as any[])?.map((adv: any) => (
                  <div key={adv.userId} className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm">{adv.businessName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{adv.businessType} · {adv.city} · {adv.user?.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">📞 {adv.phone}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300" onClick={() => validateAdv.mutate({ userId: adv.userId, approve: false, reason: "Informations insuffisantes" })}>
                          <XCircle className="h-3 w-3 mr-1" />Rejeter
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => validateAdv.mutate({ userId: adv.userId, approve: true })}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />Valider
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Games */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-blue-600" />Jeux à valider</CardTitle>
                {(pendingGames as any[])?.length > 0 && <Badge className="bg-red-500 text-white text-xs">{(pendingGames as any[]).length}</Badge>}
              </CardHeader>
              <CardContent className="space-y-2">
                {!(pendingGames as any[])?.length && <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Aucun jeu en attente</p>}
                {(pendingGames as any[])?.map((game: any) => (
                  <div key={game.id} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{game.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{game.advertiser?.name} · {game.lots?.length} lot(s) · {game.type}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300" onClick={() => rejectGame.mutate({ id: game.id })}>Rejeter</Button>
                      <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => approveGame.mutate({ id: game.id })}>Valider</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Ads */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2"><Tv className="h-4 w-4 text-purple-600" />Publicités à valider</CardTitle>
                {(pendingAds as any[])?.length > 0 && <Badge className="bg-red-500 text-white text-xs">{(pendingAds as any[]).length}</Badge>}
              </CardHeader>
              <CardContent className="space-y-2">
                {!(pendingAds as any[])?.length && <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Aucune pub en attente</p>}
                {(pendingAds as any[])?.map((ad: any) => {
                  const isSuspect = ad.aiScore && ad.aiScore < 70;
                  return (
                    <div key={ad.id} className={`flex items-start gap-3 p-3 rounded-xl border ${isSuspect ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                      {isSuspect ? <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{ad.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{ad.advertiser?.name} · {ad.duration}s</span>
                          {ad.aiScore && <Badge className={`text-xs ${ad.aiScore >= 70 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>IA: {ad.aiScore}%{isSuspect ? " ⚠" : " ✓"}</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300" onClick={() => rejectAd.mutate({ id: ad.id })}>Rejeter</Button>
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => approveAd.mutate({ id: ad.id })}>Valider</Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── USERS ── */}
          <TabsContent value="users" className="space-y-3 mt-4">
            {["advertiser","user","partner"].map(role => (
              <Card key={role}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{role === "advertiser" ? "Annonceurs" : role === "user" ? "Utilisateurs" : "Partenaires"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {(allUsers as any[])?.filter((u: any) => u.role === role).map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                      </div>
                      {u.isBlocked && <Badge className="bg-red-100 text-red-700 text-xs">Bloqué</Badge>}
                      {!u.isValidated && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Non validé</Badge>}
                      {u.profile?.validationStatus === "pending" && <Badge className="bg-orange-100 text-orange-700 text-xs">Profil en attente</Badge>}
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${u.isBlocked ? "text-green-600" : "text-orange-600"}`} title={u.isBlocked ? "Débloquer" : "Bloquer"} onClick={() => blockUser.mutate({ userId: u.id, blocked: !u.isBlocked })}>
                          {u.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" title="Supprimer" onClick={() => { if (confirm(`Supprimer ${u.name} ?`)) deleteUser.mutate({ userId: u.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── BOXES ── */}
          <TabsContent value="boxes" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4 text-blue-600" />Boxes Android</CardTitle>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm" className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" />Ajouter</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Ajouter une box</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                      <div><Label>Nom</Label><Input className="mt-1" value={newBox.name} onChange={e => setNewBox(b => ({ ...b, name: e.target.value }))} placeholder="Box Tunis 01" /></div>
                      <div><Label>Adresse IP</Label><Input className="mt-1" value={newBox.ipAddress} onChange={e => setNewBox(b => ({ ...b, ipAddress: e.target.value }))} placeholder="192.168.1.100" /></div>
                      <div>
                        <Label>Ville</Label>
                        <Select value={String(newBox.cityId)} onValueChange={v => setNewBox(b => ({ ...b, cityId: Number(v) }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{(cities as any[])?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Notes</Label><Input className="mt-1" value={newBox.notes} onChange={e => setNewBox(b => ({ ...b, notes: e.target.value }))} placeholder="Optionnel" /></div>
                      <Button className="w-full" onClick={() => addBox.mutate(newBox)} disabled={!newBox.name || !newBox.ipAddress}>Ajouter la box</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-2">
                {(boxes as any[])?.map((box: any) => (
                  <div key={box.id} className={`p-3 rounded-xl border ${box.isOnline ? "border-green-200 bg-green-50" : box.status === "blocked" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {box.isOnline ? <Wifi className="h-4 w-4 text-green-600 shrink-0" /> : <WifiOff className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{box.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{box.ipAddress}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{box.city?.name} · {box.partner?.businessName ?? "Non assigné"}</p>
                          {box.flux && <p className="text-xs text-blue-600 mt-0.5">📺 {box.flux.name}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        <Badge className={`text-xs ${box.isOnline ? "bg-green-100 text-green-700" : box.status === "blocked" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          {box.isOnline ? "En ligne" : box.status}
                        </Badge>
                        {/* Assign flux */}
                        <Select
                          value={box.assignedFluxId ? String(box.assignedFluxId) : "none"}
                          onValueChange={v => updateBox.mutate({ id: box.id, assignedFluxId: v === "none" ? null : Number(v) })}
                        >
                          <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Flux…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun flux</SelectItem>
                            {(fluxes as any[])?.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${box.status === "blocked" ? "text-green-600" : "text-red-500"}`} onClick={() => blockBox.mutate({ id: box.id, blocked: box.status !== "blocked" })}>
                          {box.status === "blocked" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </Button>
                        {/* Send message to box */}
                        <Dialog>
                          <DialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-500"><Send className="h-3.5 w-3.5" /></Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Message → {box.name}</DialogTitle></DialogHeader>
                            <div className="space-y-3 mt-2">
                              <Textarea placeholder="Message à envoyer à cette box…" value={boxMsg[box.id] ?? ""} onChange={e => setBoxMsg(m => ({ ...m, [box.id]: e.target.value }))} rows={3} />
                              <Button className="w-full" onClick={() => { sendBoxMsg.mutate({ boxId: box.id, content: boxMsg[box.id] ?? "" }); setBoxMsg(m => ({ ...m, [box.id]: "" })); }}>Envoyer</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    {box.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 border-t pt-2">📝 {box.notes}</p>}
                    <p className="text-xs text-gray-300 mt-1">Dernier ping : {new Date(box.lastSeen).toLocaleString("fr-FR")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FLUX ── */}
          <TabsContent value="fluxes" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Radio className="h-4 w-4 text-purple-600" />Flux de diffusion</CardTitle>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm" className="gap-1 h-7 text-xs bg-purple-600 hover:bg-purple-700"><Plus className="h-3 w-3" />Créer</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Créer un flux</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                      <div><Label>Nom du flux</Label><Input className="mt-1" value={newFlux.name} onChange={e => setNewFlux(f => ({ ...f, name: e.target.value }))} placeholder="Flux Tunis Centre" /></div>
                      <div><Label>Description</Label><Input className="mt-1" value={newFlux.description} onChange={e => setNewFlux(f => ({ ...f, description: e.target.value }))} /></div>
                      <div><Label>URL de stream HLS (optionnel)</Label><Input className="mt-1" value={newFlux.streamUrl} onChange={e => setNewFlux(f => ({ ...f, streamUrl: e.target.value }))} placeholder="https://stream.adgame.tn/tunis/playlist.m3u8" /></div>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => createFlux.mutate(newFlux)} disabled={!newFlux.name}>Créer le flux</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {(fluxes as any[])?.map((flux: any) => (
                  <div key={flux.id} className={`p-4 rounded-xl border ${flux.isActive ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{flux.name}</p>
                          <Badge className={flux.isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}>{flux.isActive ? "Actif" : "Inactif"}</Badge>
                        </div>
                        {flux.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{flux.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {flux.cities?.map((c: any) => <Badge key={c?.id} variant="outline" className="text-xs">{c?.name}</Badge>)}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{flux.adIds?.length ?? 0} pub(s)</span>
                          <span>{flux.gameIds?.length ?? 0} jeu(x)</span>
                          <span>{flux.boxCount ?? 0} box(es)</span>
                        </div>
                        {flux.streamUrl && (
                          <div className="mt-2 flex items-center gap-2 bg-gray-900 text-green-400 rounded-lg px-3 py-1.5 font-mono text-xs">
                            <Radio className="h-3 w-3 shrink-0" />
                            <span className="truncate">{flux.streamUrl}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateFlux.mutate({ id: flux.id, isActive: !flux.isActive })}>
                          {flux.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => { if (confirm("Supprimer ce flux ?")) deleteFlux.mutate({ id: flux.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SUBSCRIPTIONS ── */}
          <TabsContent value="subscriptions" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-600" />Gestion des abonnements</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500 dark:text-gray-400 border-b">
                    <th className="text-left pb-2">Annonceur</th>
                    <th className="text-left pb-2">Plan</th>
                    <th className="text-left pb-2">Montant</th>
                    <th className="text-left pb-2">Statut</th>
                    <th className="text-left pb-2">Prochain paiement</th>
                    <th className="text-left pb-2">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(subs as any[])?.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2 font-medium">{sub.user?.name}</td>
                        <td className="py-2"><Badge className="text-xs bg-purple-100 text-purple-700">{sub.planName}</Badge></td>
                        <td className="py-2 font-semibold">{sub.amount} DT</td>
                        <td className="py-2"><Badge className={`text-xs ${sub.status === "active" ? "bg-green-100 text-green-700" : sub.status === "suspended" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{sub.status === "active" ? "Actif" : sub.status === "suspended" ? "Suspendu" : "Annulé"}</Badge></td>
                        <td className="py-2 text-gray-500 dark:text-gray-400 text-xs">{new Date(sub.nextBillingDate).toLocaleDateString("fr-FR")}</td>
                        <td className="py-2">
                          <Select value={sub.status} onValueChange={v => updateSub.mutate({ id: sub.id, status: v as any })}>
                            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="suspended">Suspendu</SelectItem>
                              <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MESSAGES ── */}
          <TabsContent value="messages" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-600" />Message diffusé à tous</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Destinataires</Label>
                  <Select value={broadcastTarget} onValueChange={v => setBroadcastTarget(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="advertiser">Annonceurs seulement</SelectItem>
                      <SelectItem value="user">Utilisateurs seulement</SelectItem>
                      <SelectItem value="partner">Partenaires seulement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea className="mt-1" placeholder="Votre message…" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={4} />
                </div>
                <Button className="gap-2" onClick={() => broadcast.mutate({ content: broadcastMsg, targetRole: broadcastTarget })} disabled={!broadcastMsg.trim() || broadcast.isPending}>
                  {broadcast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer à tous
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
