import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { Tv, Upload, Bot, LayoutGrid, Play, Plus, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

const STYLES = ["Professionnel", "Fun", "Chic", "Coloré"];
const DURATIONS = [15, 30, 45, 60];

export default function Ads() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [method, setMethod] = useState<"ai" | "template" | "upload">("ai");
  const [form, setForm] = useState({ title: "", description: "", style: "Professionnel", duration: 30 });

  const { data: myAds, refetch } = trpc.ads.listMine.useQuery();
  const createAd = trpc.ads.create.useMutation({
    onSuccess: () => { toast.success("Pub créée, en attente de validation !"); setMode("list"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const STATUS_CONFIG = {
    draft: { label: "Brouillon", icon: Clock, color: "text-gray-500", bg: "bg-gray-50" },
    pending: { label: "En attente", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    approved: { label: "Validée ✓", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    rejected: { label: "Rejetée", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  };

  const demoAds = [
    { id: 1, title: "Promo Ramadan", description: "Restaurant Le Délice, -20% sur plats", status: "approved", duration: 30, type: "ai", createdAt: new Date("2026-02-20") },
    { id: 2, title: "Menu soir", description: "Découvrez notre menu du soir", status: "approved", duration: 30, type: "template", createdAt: new Date("2026-03-05") },
    { id: 3, title: "Consultation offerte", description: "1ère consultation offerte", status: "pending", duration: 45, type: "upload", createdAt: new Date("2026-03-13") },
  ];

  const ads = (myAds as any[]) ?? demoAds;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tv className="h-6 w-6 text-blue-600" />Studio Pub</h1>
          <Button onClick={() => setMode(mode === "list" ? "create" : "list")} className="gap-2 bg-purple-600 hover:bg-purple-700">
            {mode === "list" ? <><Plus className="h-4 w-4" />Créer une pub</> : "← Mes pubs"}
          </Button>
        </div>

        {mode === "list" ? (
          <div className="space-y-3">
            {ads.map((ad: any) => {
              const s = STATUS_CONFIG[ad.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
              return (
                <Card key={ad.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${s.bg}`}><Tv className={`h-4 w-4 ${s.color}`} /></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{ad.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{ad.description} · {ad.duration}s · {ad.type === "ai" ? "IA" : ad.type === "template" ? "Template" : "Upload"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${s.color} ${s.bg} border-0`}>{s.label}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Play className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {ads.length === 0 && <Card><CardContent className="py-8 text-center text-gray-400 dark:text-gray-500">Aucune pub créée</CardContent></Card>}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Method selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "ai", label: "IA Générative", icon: Bot, desc: "Texte → Vidéo auto" },
                { key: "template", label: "Template", icon: LayoutGrid, desc: "Choisir un modèle" },
                { key: "upload", label: "Upload Manuel", icon: Upload, desc: "MP4 max 100MB" },
              ].map((m) => (
                <button key={m.key} onClick={() => setMethod(m.key as any)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${method === m.key ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <m.icon className={`h-5 w-5 mx-auto mb-1 ${method === m.key ? "text-purple-600" : "text-gray-500"}`} />
                  <p className="text-xs font-semibold">{m.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{m.desc}</p>
                </button>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Informations de la pub</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titre *</Label>
                  <Input placeholder="Promo Ramadan" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
                </div>

                {method === "ai" && (
                  <>
                    <div>
                      <Label>Description de votre offre *</Label>
                      <Textarea placeholder="Restaurant Le Délice, spécialité couscous, -20% sur plats à emporter, 71 Av Bourguiba..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} />
                    </div>
                    <div>
                      <Label>Style</Label>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {STYLES.map(s => (
                          <button key={s} onClick={() => setForm(f => ({ ...f, style: s }))}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.style === s ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 hover:bg-gray-50"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {method === "template" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Classique", "Moderne", "Festif", "Professionnel"].map(t => (
                      <div key={t} className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity border-2 border-transparent hover:border-purple-400">
                        <span className="text-white font-bold text-sm">{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {method === "upload" && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm font-medium">Glissez votre fichier MP4 ici</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Maximum 100 MB</p>
                    <Button size="sm" variant="outline" className="mt-3">Parcourir les fichiers</Button>
                  </div>
                )}

                <div>
                  <Label>Durée</Label>
                  <div className="flex gap-2 mt-1">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, duration: d }))}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.duration === d ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 hover:bg-gray-50"}`}>{d}s</button>
                    ))}
                  </div>
                </div>

                {/* Aperçu */}
                {method === "ai" && form.description && (
                  <div className="bg-gray-900 rounded-xl p-4 text-white">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1"><Play className="h-3 w-3" />Aperçu</p>
                    <p className="font-bold text-lg">{form.title || "Votre titre ici"}</p>
                    <p className="text-sm text-gray-300 mt-1">{form.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{form.style} · {form.duration}s</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setMode("list")}>Annuler</Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={createAd.isPending || !form.title}
                    onClick={() => createAd.mutate({ title: form.title, description: form.description, type: method, duration: form.duration, style: form.style })}>
                    {createAd.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Envoi...</> : "Valider la pub"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
