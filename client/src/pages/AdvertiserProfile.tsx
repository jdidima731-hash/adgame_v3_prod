import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Store, MapPin, Phone, Globe, Clock, Camera, Eye, Loader2,
  Save, Link2, Camera, Key, Star, Edit3, CheckCircle2, AlertCircle,
} from "lucide-react";

const BUSINESS_TYPES = ["Restaurant", "Coiffeur", "Clinique", "École", "Pharmacie", "Automobile", "Boutique", "Café", "Autre"];
const PRICE_RANGES = [{ v: "€", l: "€ — Économique" }, { v: "€€", l: "€€ — Moyen" }, { v: "€€€", l: "€€€ — Haut de gamme" }];

const DEFAULT_HOURS = { lun: "09h-18h", mar: "09h-18h", mer: "09h-18h", jeu: "09h-18h", ven: "09h-18h", sam: "Fermé", dim: "Fermé" };
const DAYS: [string, string][] = [["lun","Lundi"],["mar","Mardi"],["mer","Mercredi"],["jeu","Jeudi"],["ven","Vendredi"],["sam","Samedi"],["dim","Dimanche"]];

export default function AdvertiserProfile() {
  const [tab, setTab] = useState("info");
  const [previewMode, setPreviewMode] = useState(false);
  const { data: profile, refetch } = trpc.advertiserProfile.get.useQuery();
  const { data: cities } = trpc.cities.list.useQuery();

  const p = profile as any;
  const [form, setForm] = useState({
    businessName: "", businessType: "Restaurant", address: "", city: "Tunis",
    phone: "", website: "", facebook: "", instagram: "", tiktok: "",
    openingHours: JSON.stringify(DEFAULT_HOURS), priceRange: "€€",
    description: "", coverPhoto: "", openaiKey: "",
  });
  const [hours, setHours] = useState<Record<string, string>>(DEFAULT_HOURS);

  useEffect(() => {
    if (!p) return;
    setForm({
      businessName: p.businessName ?? "",
      businessType: p.businessType ?? "Restaurant",
      address: p.address ?? "",
      city: p.city ?? "Tunis",
      phone: p.phone ?? "",
      website: p.website ?? "",
      facebook: p.facebook ?? "",
      instagram: p.instagram ?? "",
      tiktok: p.tiktok ?? "",
      openingHours: p.openingHours ?? JSON.stringify(DEFAULT_HOURS),
      priceRange: p.priceRange ?? "€€",
      description: p.description ?? "",
      coverPhoto: p.coverPhoto ?? "",
      openaiKey: p.openaiKey ?? "",
    });
    try { setHours(JSON.parse(p.openingHours ?? "{}")); } catch {}
  }, [p?.businessName]);

  const save = trpc.advertiserProfile.save.useMutation({
    onSuccess: () => { toast.success("Profil sauvegardé ! En attente de validation admin."); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    save.mutate({ ...form, openingHours: JSON.stringify(hours) });
  };

  const validationBadge = p?.validationStatus === "approved"
    ? <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="h-3 w-3" />Validé</Badge>
    : p?.validationStatus === "pending"
    ? <Badge className="bg-yellow-100 text-yellow-700 gap-1"><AlertCircle className="h-3 w-3" />En attente</Badge>
    : p?.validationStatus === "rejected"
    ? <Badge className="bg-red-100 text-red-700 gap-1"><AlertCircle className="h-3 w-3" />Rejeté</Badge>
    : <Badge className="bg-gray-100 text-gray-500 dark:text-gray-400">Non soumis</Badge>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="h-6 w-6 text-purple-600" />Mon profil annonceur</h1>
            <div className="flex items-center gap-2 mt-1">{validationBadge}<span className="text-xs text-gray-400 dark:text-gray-500">Ce profil sera visible par les utilisateurs une fois validé par l'admin</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="gap-1.5">
              <Eye className="h-4 w-4" />{previewMode ? "Éditer" : "Aperçu"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={save.isPending} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Sauvegarder
            </Button>
          </div>
        </div>

        {/* PREVIEW MODE */}
        {previewMode ? (
          <div className="space-y-4">
            {/* Cover */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl h-40 flex items-end p-5">
              <div>
                <h2 className="text-2xl font-black text-white">{form.businessName || "Nom de votre commerce"}</h2>
                <p className="text-purple-200 text-sm">{form.businessType} · {form.priceRange} · {form.city}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <Card>
                  <CardContent className="py-4 space-y-2">
                    <p className="text-sm leading-relaxed text-gray-700">{form.description || "Aucune description."}</p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-2"><Phone className="h-4 w-4" />{form.phone}</div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><MapPin className="h-4 w-4" />{form.address}</div>
                    {form.website && <div className="flex items-center gap-1.5 text-sm text-blue-600"><Globe className="h-4 w-4" />{form.website}</div>}
                  </CardContent>
                </Card>
                {/* Mini map */}
                <MapView center={[36.8190, 10.1658]} zoom={14} className="h-40"
                  markers={[{ lat: 36.8190, lng: 10.1658, label: form.businessName, type: "partner" }]} />
              </div>
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Horaires</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    {DAYS.map(([k, label]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 capitalize">{label}</span>
                        <span className={hours[k] === "Fermé" ? "text-red-500" : "text-green-600"}>{hours[k] || "—"}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">💬 Message</Button>
                  <Button size="sm" variant="outline" className="flex-1">📅 Réserver</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="hours">Horaires</TabsTrigger>
              <TabsTrigger value="social">Réseaux sociaux</TabsTrigger>
              <TabsTrigger value="ia">Clé IA</TabsTrigger>
            </TabsList>

            {/* INFO */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nom du commerce *</Label><Input className="mt-1" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} /></div>
                <div>
                  <Label>Type de commerce</Label>
                  <Select value={form.businessType} onValueChange={v => setForm(f => ({ ...f, businessType: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Adresse *</Label><Input className="mt-1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                <div>
                  <Label>Ville</Label>
                  <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{(cities as any[])?.filter((c:any)=>!c.isForeignCity).map((c:any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Téléphone *</Label><Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 71 000 000" /></div>
                <div><Label>Site web</Label><Input className="mt-1" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" /></div>
                <div>
                  <Label>Fourchette de prix</Label>
                  <Select value={form.priceRange} onValueChange={v => setForm(f => ({ ...f, priceRange: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRICE_RANGES.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description (visible par les clients)</Label>
                <Textarea className="mt-1" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez votre commerce, vos spécialités, votre ambiance…" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Camera className="h-4 w-4" />Photo de couverture (URL)</Label>
                <Input className="mt-1" value={form.coverPhoto} onChange={e => setForm(f => ({ ...f, coverPhoto: e.target.value }))} placeholder="https://…" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Maximum 5 photos. Pour upload, intégrer avec Cloudinary.</p>
              </div>
            </TabsContent>

            {/* HOURS */}
            <TabsContent value="hours" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Horaires d'ouverture</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {DAYS.map(([k, label]) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-gray-600 dark:text-gray-300 shrink-0">{label}</span>
                      <Input value={hours[k] || ""} onChange={e => setHours(h => ({ ...h, [k]: e.target.value }))} className="flex-1 h-8 text-sm" placeholder="09h-18h ou Fermé" />
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-gray-400 dark:text-gray-500" onClick={() => setHours(h => ({ ...h, [k]: "Fermé" }))}>Fermé</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SOCIAL */}
            <TabsContent value="social" className="space-y-3 mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Réseaux sociaux</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { k: "facebook", label: "Facebook", icon: Link2, placeholder: "nomdevotrevpage" },
                    { k: "instagram", label: "Instagram", icon: Camera, placeholder: "@nomdecompte" },
                    { k: "tiktok", label: "TikTok", icon: Star, placeholder: "@votrecompte" },
                  ].map(({ k, label, icon: Icon, placeholder }) => (
                    <div key={k} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400 shrink-0" />
                      <div className="flex-1">
                        <Label className="text-xs">{label}</Label>
                        <Input className="mt-1 h-8" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={placeholder} />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 dark:text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-2">
                    💡 Ces comptes seront utilisés par le Social Manager IA pour publier automatiquement vos contenus.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* IA KEY */}
            <TabsContent value="ia" className="space-y-3 mt-4">
              <Card className="border-yellow-200">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-yellow-600" />Clé API OpenAI (BYOK)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Intégrez votre propre clé OpenAI pour activer le Social Manager IA et la génération de contenu automatique.</p>
                  <div>
                    <Label>Clé OpenAI (sk-…)</Label>
                    <Input type="password" className="mt-1 font-mono text-sm" value={form.openaiKey} onChange={e => setForm(f => ({ ...f, openaiKey: e.target.value }))} placeholder="sk-xxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 space-y-1">
                    <p className="font-semibold">Comment obtenir une clé OpenAI :</p>
                    <p>1. Créez un compte sur platform.openai.com</p>
                    <p>2. Allez dans API Keys → Create new secret key</p>
                    <p>3. Copiez-collez la clé ici</p>
                    <p className="text-yellow-600 mt-1">⚠️ Votre clé est stockée de façon chiffrée. Ne la partagez jamais.</p>
                  </div>
                  <Button onClick={handleSave} disabled={save.isPending} className="gap-2">
                    {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Sauvegarder la clé
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
