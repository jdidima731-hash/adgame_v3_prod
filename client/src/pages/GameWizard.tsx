import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getGameQrUrl } from "@/lib/qrcode";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Gamepad2, QrCode, HelpCircle, Shuffle, Map, Calendar, Plus, Trash2, Check } from "lucide-react";

const GAME_TYPES = [
  { value: "qr_code", label: "QR Code Challenge", desc: "Les utilisateurs scannent pour participer", icon: QrCode },
  { value: "quiz", label: "Quiz Interactif", desc: "Répondre aux questions pour gagner", icon: HelpCircle },
  { value: "lucky_draw", label: "Lucky Draw", desc: "Tirage au sort automatique", icon: Shuffle },
  { value: "wheel", label: "Roue de la Fortune", desc: "Faire tourner la roue", icon: Gamepad2 },
  { value: "scratch", label: "Carte à gratter", desc: "Gratter pour révéler le lot", icon: Gamepad2 },
];

const STEPS = ["Modèle", "Conditions", "Lots", "Pub", "Diffusion"];

const CITIES = [
  { id: 1, name: "Tunis Centre" }, { id: 2, name: "Sfax" }, { id: 3, name: "Sousse" }, { id: 4, name: "Bizerte" }
];

export default function GameWizard() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    type: "qr_code",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    participationFrequency: "once" as "once" | "daily" | "unlimited",
    winCondition: "random" as "random" | "first" | "score",
    maxParticipations: 1000,
    lots: [{ name: "", quantity: 1, description: "" }],
    associatedAdId: undefined as number | undefined,
    cities: [1],
    displayFrequency: "10min",
  });

  const { data: myAds } = trpc.ads.list.useQuery({ limit: 20, offset: 0 });
  const createGame = trpc.games.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Jeu créé et envoyé pour validation !");
      if (data?.id) {
        const qrUrl = getGameQrUrl(data.id);
        toast.success(`QR Code généré ! URL: /wheel/${data.id}`);
      }
      setLocation("/advertiser/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.title || !form.startDate || !form.endDate) return toast.error("Remplissez tous les champs obligatoires");
    createGame.mutate({
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      lots: form.lots.filter(l => l.name),
      displayFrequency: form.displayFrequency,
    });
  };

  const addLot = () => setForm(f => ({ ...f, lots: [...f.lots, { name: "", quantity: 1, description: "" }] }));
  const removeLot = (i: number) => setForm(f => ({ ...f, lots: f.lots.filter((_, idx) => idx !== i) }));
  const updateLot = (i: number, key: string, val: any) => setForm(f => ({ ...f, lots: f.lots.map((l, idx) => idx === i ? { ...l, [key]: val } : l) }));
  const toggleCity = (id: number) => setForm(f => ({ ...f, cities: f.cities.includes(id) ? f.cities.filter(c => c !== id) : [...f.cities, id] }));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(s => s - 1) : setLocation("/advertiser/dashboard")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Créer un jeu</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Étape {step + 1}/{STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-purple-600" : "bg-gray-200"}`} />
          ))}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Step 0: Type de jeu */}
            {step === 0 && (
              <div className="space-y-3">
                <p className="font-semibold">Choisissez un modèle de jeu</p>
                {GAME_TYPES.map((gt) => (
                  <button key={gt.value} onClick={() => setForm(f => ({ ...f, type: gt.value }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${form.type === gt.value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <gt.icon className={`h-5 w-5 ${form.type === gt.value ? "text-purple-600" : "text-gray-500"}`} />
                    <div>
                      <p className="font-medium text-sm">{gt.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{gt.desc}</p>
                    </div>
                    {form.type === gt.value && <Check className="h-4 w-4 text-purple-600 ml-auto" />}
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Conditions */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Nom du jeu *</Label>
                  <Input placeholder="iPhone 15 - Tirage au sort" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Décrivez votre jeu..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Date de début *</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Date de fin *</Label>
                    <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Participations max</Label>
                  <Input type="number" value={form.maxParticipations} onChange={e => setForm(f => ({ ...f, maxParticipations: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label>Fréquence de participation</Label>
                  <div className="flex gap-2 mt-1">
                    {(["once", "daily", "unlimited"] as const).map(freq => (
                      <button key={freq} onClick={() => setForm(f => ({ ...f, participationFrequency: freq }))}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.participationFrequency === freq ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 hover:bg-gray-50"}`}>
                        {freq === "once" ? "1 fois" : freq === "daily" ? "1 fois/jour" : "Illimitée"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Lots */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="font-semibold">Définissez les lots à gagner</p>
                {form.lots.map((lot, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Lot #{i + 1}</Badge>
                      {form.lots.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeLot(i)} className="text-red-500 h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                    <Input placeholder="Nom du lot (ex: iPhone 15)" value={lot.name} onChange={e => updateLot(i, "name", e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input type="number" placeholder="Quantité" value={lot.quantity} onChange={e => updateLot(i, "quantity", Number(e.target.value))} min={1} />
                      <Input placeholder="Description" value={lot.description} onChange={e => updateLot(i, "description", e.target.value)} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addLot} className="w-full gap-2"><Plus className="h-4 w-4" />Ajouter un lot</Button>
              </div>
            )}

            {/* Step 3: Pub */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="font-semibold">Associer une publicité</p>
                <button onClick={() => setForm(f => ({ ...f, associatedAdId: undefined }))}
                  className={`w-full p-3 rounded-lg border-2 text-left text-sm ${!form.associatedAdId ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}>
                  Pas de pub (jeu seul)
                </button>
                {(myAds as any[])?.filter((a: any) => a.status === "approved").map((ad: any) => (
                  <button key={ad.id} onClick={() => setForm(f => ({ ...f, associatedAdId: ad.id }))}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${form.associatedAdId === ad.id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <p className="text-sm font-medium">{ad.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ad.duration}s · Validée</p>
                  </button>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setLocation("/advertiser/ads/new")}>+ Créer une nouvelle pub</Button>
              </div>
            )}

            {/* Step 4: Diffusion */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Zones de diffusion</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CITIES.map(city => (
                      <div key={city.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer" onClick={() => toggleCity(city.id)}>
                        <Checkbox checked={form.cities.includes(city.id)} onCheckedChange={() => toggleCity(city.id)} />
                        <Label className="cursor-pointer text-sm">{city.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">Fréquence d'affichage</p>
                  <div className="flex gap-2">
                    {["10min", "30min", "1h"].map(freq => (
                      <button key={freq} onClick={() => setForm(f => ({ ...f, displayFrequency: freq }))}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.displayFrequency === freq ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 hover:bg-gray-50"}`}>
                        {freq === "10min" ? "Toutes les 10 min" : freq === "30min" ? "Toutes les 30 min" : "1 fois/heure"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-sm font-medium text-purple-800">Récapitulatif</p>
                  <ul className="text-xs text-purple-700 mt-1 space-y-1">
                    <li>• Jeu : {form.title || "Non renseigné"}</li>
                    <li>• Type : {GAME_TYPES.find(g => g.value === form.type)?.label}</li>
                    <li>• Lots : {form.lots.filter(l => l.name).length} lot(s)</li>
                    <li>• Villes : {form.cities.length} zone(s)</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : setLocation("/advertiser/dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-1" />{step === 0 ? "Annuler" : "Retour"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="bg-purple-600 hover:bg-purple-700">
              Suivant <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={createGame.isPending} className="bg-green-600 hover:bg-green-700">
              {createGame.isPending ? "Création..." : "Créer le jeu ✓"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
