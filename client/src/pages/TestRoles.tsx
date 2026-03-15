import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

// Guard: this page is for development only
if (import.meta.env.PROD) {
  throw new Error("TestRoles is not available in production.");
}
import { toast } from "sonner";
import { Gamepad2, Shield, Megaphone, User, Store, Loader2 } from "lucide-react";

const ACCOUNTS = [
  { role: "admin", email: "admin@adgame.com", password: "Admin123!", label: "Admin", icon: Shield, color: "bg-red-50 border-red-300 hover:bg-red-100", badge: "bg-red-100 text-red-700", target: "/admin" },
  { role: "advertiser", email: "advertiser@adgame.com", password: "Advertiser123!", label: "Annonceur", icon: Megaphone, color: "bg-purple-50 border-purple-300 hover:bg-purple-100", badge: "bg-purple-100 text-purple-700", target: "/advertiser/dashboard" },
  { role: "partner", email: "partner@adgame.com", password: "Partner123!", label: "Partenaire", icon: Store, color: "bg-green-50 border-green-300 hover:bg-green-100", badge: "bg-green-100 text-green-700", target: "/dashboard" },
  { role: "user", email: "user@adgame.com", password: "User123!", label: "Utilisateur", icon: User, color: "bg-blue-50 border-blue-300 hover:bg-blue-100", badge: "bg-blue-100 text-blue-700", target: "/dashboard" },
];

export default function TestRoles() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      utils.auth.me.invalidate();
      toast.success(`Connecté en tant que ${data.user?.role}`);
      const acc = ACCOUNTS.find(a => a.role === data.user?.role);
      setLocation(acc?.target ?? "/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Gamepad2 className="h-10 w-10 text-blue-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Test des rôles</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cliquez pour tester chaque interface</p>
        </div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 dark:text-gray-300">Comptes de démo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ACCOUNTS.map(acc => {
              const Icon = acc.icon;
              const loading = login.isPending && login.variables?.email === acc.email;
              return (
                <button key={acc.role} onClick={() => login.mutate({ email: acc.email, password: acc.password })} disabled={login.isPending}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${acc.color} disabled:opacity-50`}>
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{acc.label}</span>
                      <Badge className={`text-xs ${acc.badge}`}>{acc.role}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{acc.email}</p>
                  </div>
                  {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                </button>
              );
            })}
          </CardContent>
        </Card>
        <Button variant="outline" className="w-full" onClick={() => setLocation("/login")}>← Page de connexion normale</Button>
      </div>
    </div>
  );
}
