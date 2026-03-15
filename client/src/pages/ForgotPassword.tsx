import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Gamepad2, Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => toast.error(e.message),
  });

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Email envoyé !</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Si un compte existe pour <span className="font-semibold">{email}</span>, vous recevrez
              un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Vérifiez vos spams si vous ne trouvez pas l'email.</p>
            <Button className="w-full" onClick={() => setLocation("/login")}>
              Retour à la connexion
            </Button>
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
            <span className="text-2xl font-bold text-gray-900">AdGame</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9"
                  onKeyDown={e => e.key === "Enter" && forgotMutation.mutate({ email })}
                  disabled={forgotMutation.isPending}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => forgotMutation.mutate({ email })}
              disabled={!email.trim() || forgotMutation.isPending}
            >
              {forgotMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours...</>
                : "Envoyer le lien de réinitialisation"
              }
            </Button>

            <button
              onClick={() => setLocation("/login")}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
