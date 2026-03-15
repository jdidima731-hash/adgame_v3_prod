import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Gamepad2, Lock, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => { toast.success("Mot de passe réinitialisé !"); setDone(true); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Minimum 8 caractères");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    if (!token) return toast.error("Lien invalide ou expiré");
    resetMutation.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-red-600 font-semibold">Lien invalide</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ce lien de réinitialisation est invalide ou a expiré.</p>
            <Button onClick={() => setLocation("/forgot-password")}>Demander un nouveau lien</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Mot de passe modifié !</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <Button className="w-full" onClick={() => setLocation("/login")}>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Gamepad2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">AdGame</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nouveau mot de passe</CardTitle>
            <CardDescription>Choisissez un mot de passe sécurisé (8 caractères minimum)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nouveau mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="8 caractères minimum"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    disabled={resetMutation.isPending}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Confirmer le mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Répéter le mot de passe"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="pl-9"
                    disabled={resetMutation.isPending}
                  />
                </div>
              </div>
              {/* Password strength */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? i <= 2 ? "bg-red-400" : i === 3 ? "bg-yellow-400" : "bg-green-500"
                          : "bg-gray-200"
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {password.length < 6 ? "Trop court" : password.length < 10 ? "Correct" : password.length < 14 ? "Bon" : "Excellent"}
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                {resetMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Modification...</>
                  : "Modifier le mot de passe"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
