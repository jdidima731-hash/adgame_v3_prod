import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Gamepad2, User, Megaphone, Store, Eye, EyeOff, ChevronRight, CheckCircle2 } from "lucide-react";

const ROLES = [
  {
    value: "user",
    label: "Utilisateur",
    icon: User,
    color: "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900",
    activeColor: "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950",
    desc: "Participer aux jeux et profiter des offres",
  },
  {
    value: "advertiser",
    label: "Annonceur",
    icon: Megaphone,
    color: "border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900",
    activeColor: "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950",
    desc: "Créer des campagnes · Validation admin requise",
  },
  {
    value: "partner",
    label: "Partenaire",
    icon: Store,
    color: "border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900",
    activeColor: "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-950",
    desc: "Héberger des écrans et accueillir des jeux",
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "", phone: "",
    role: "user" as "user" | "advertiser" | "partner",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [success, setSuccess] = useState(false);
  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.user?.role === "advertiser") { setSuccess(true); return; }
      utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: (e) => toast.error(e.message || "Erreur lors de l'inscription"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Remplissez tous les champs obligatoires");
    if (form.password.length < 8) return toast.error("Mot de passe trop court (8 caractères min)");
    if (form.password !== form.confirm) return toast.error("Les mots de passe ne correspondent pas");
    registerMutation.mutate({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone || undefined });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-950 dark:to-purple-950 p-4">
        <Card className="w-full max-w-md border-purple-200 dark:bg-gray-900 dark:border-purple-800">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold dark:text-white">Demande enregistrée !</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Votre demande de compte annonceur a été transmise à notre équipe.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-sm text-yellow-800 dark:text-yellow-300">
              ⏱️ Délai de validation : <span className="font-semibold">24 à 48h ouvrées</span>
            </div>
            <Button className="w-full" onClick={() => setLocation("/login")}>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white">AdGame</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Créez votre compte gratuitement</p>
        </div>

        <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl dark:text-white">Inscription</CardTitle>
            <CardDescription className="dark:text-gray-400">Choisissez votre rôle et remplissez le formulaire</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role selector */}
            <div className="mb-4 space-y-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isActive = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value as any }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isActive ? r.activeColor : r.color}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white dark:bg-gray-800 shadow-sm" : "bg-white/60 dark:bg-gray-800/60"}`}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>{r.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{r.desc}</p>
                    </div>
                    {isActive && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Nom complet *</label>
                <Input placeholder="Ahmed Ben Salem" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 dark:bg-gray-800 dark:border-gray-600" disabled={registerMutation.isPending} />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Email *</label>
                <Input type="email" placeholder="votre@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 dark:bg-gray-800 dark:border-gray-600" disabled={registerMutation.isPending} />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Téléphone</label>
                <Input placeholder="+216 99 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 dark:bg-gray-800 dark:border-gray-600" disabled={registerMutation.isPending} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Mot de passe *</label>
                  <div className="relative mt-1">
                    <Input type={showPwd ? "text" : "password"} placeholder="8 caractères min" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="pr-9 dark:bg-gray-800 dark:border-gray-600" disabled={registerMutation.isPending} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Confirmer *</label>
                  <Input type={showPwd ? "text" : "password"} placeholder="Répéter" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} className="mt-1 dark:bg-gray-800 dark:border-gray-600" disabled={registerMutation.isPending} />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md mt-1" disabled={registerMutation.isPending}>
                {registerMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</>
                  : <>Créer mon compte <ChevronRight className="ml-1 h-4 w-4" /></>
                }
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Déjà un compte ? </span>
              <button onClick={() => setLocation("/login")} className="text-blue-600 hover:underline font-semibold dark:text-blue-400">Se connecter</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
