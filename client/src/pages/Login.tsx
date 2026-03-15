import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Gamepad2, Shield, Megaphone, User, Store, Eye, EyeOff, ChevronRight } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    email: "admin@adgame.com",
    password: "Admin123!",
    label: "Administrateur",
    icon: Shield,
    color: "border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:border-red-800 dark:hover:bg-red-900",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    description: "Panneau de contrôle global",
  },
  {
    role: "advertiser",
    email: "advertiser@adgame.com",
    password: "Advertiser123!",
    label: "Annonceur",
    icon: Megaphone,
    color: "border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:hover:bg-purple-900",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    description: "Créer jeux & publicités",
  },
  {
    role: "partner",
    email: "partner@adgame.com",
    password: "Partner123!",
    label: "Partenaire",
    icon: Store,
    color: "border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:border-green-800 dark:hover:bg-green-900",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    description: "Commerce & réservations",
  },
  {
    role: "user",
    email: "user@adgame.com",
    password: "User123!",
    label: "Utilisateur",
    icon: User,
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:hover:bg-blue-900",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    description: "Jouer et gagner",
  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      utils.auth.me.invalidate();
      const role = data.user?.role;
      if (role === "admin") setLocation("/admin");
      else if (role === "advertiser") setLocation("/advertiser/dashboard");
      else if (role === "partner") setLocation("/partner/dashboard");
      else setLocation("/dashboard");
    },
    onError: (e) => {
      toast.error(e.message || "Identifiants incorrects");
      setLoadingRole(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Remplissez tous les champs");
    setLoadingRole("manual");
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setLoadingRole(account.role);
    loginMutation.mutate({ email: account.email, password: account.password });
  };

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Plateforme de marketing interactif</p>
        </div>

        {/* Demo accounts — 2×2 grid on desktop */}
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm text-gray-500 dark:text-gray-400 font-medium text-center">Accès rapide démo</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                const isLoading = loadingRole === account.role;
                return (
                  <button
                    key={account.role}
                    onClick={() => handleDemoLogin(account)}
                    disabled={loginMutation.isPending}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${account.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4 flex-shrink-0 text-gray-600 dark:text-gray-300" />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{account.label}</span>
                      {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto flex-shrink-0 text-gray-500" />}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{account.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Login form */}
        <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl dark:text-white">Connexion</CardTitle>
            <CardDescription className="dark:text-gray-400">Ou connectez-vous avec votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Email</label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 dark:bg-gray-800 dark:border-gray-600"
                  disabled={loginMutation.isPending}
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium dark:text-gray-300">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => setLocation("/forgot-password")}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10 dark:bg-gray-800 dark:border-gray-600"
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && loadingRole === "manual"
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
                  : <>Se connecter <ChevronRight className="ml-1 h-4 w-4" /></>
                }
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Pas encore de compte ? </span>
              <button
                onClick={() => setLocation("/register")}
                className="text-blue-600 hover:underline font-semibold dark:text-blue-400"
              >
                S'inscrire
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
