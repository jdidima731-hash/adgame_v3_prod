import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const txId = Number(params.get("txId"));
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [planName, setPlanName] = useState("");

  const verify = trpc.payment.verifyAfterRedirect.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPlanName((data as any).plan?.name || "");
        setStatus("success");
      } else {
        setStatus("failed");
      }
    },
    onError: () => setStatus("failed"),
  });

  useEffect(() => {
    if (txId) verify.mutate({ transactionId: txId });
    else setStatus("failed");
  }, [txId]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
            <p className="text-lg font-medium">Vérification du paiement en cours…</p>
            <p className="text-sm text-gray-500">Merci de patienter, ne fermez pas cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4 border-green-200">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-700">Paiement confirmé !</h1>
            {planName && (
              <p className="text-gray-600">Votre abonnement <strong>{planName}</strong> est maintenant actif.</p>
            )}
            <p className="text-sm text-gray-500">Un email de confirmation vous a été envoyé.</p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 mt-4"
              onClick={() => navigate("/advertiser/dashboard")}
            >
              Accéder à mon tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4 border-red-200">
        <CardContent className="py-12 text-center space-y-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-red-700">Paiement non abouti</h1>
          <p className="text-gray-600">Le paiement n'a pas pu être confirmé. Vous n'avez pas été débité.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/advertiser/subscription")}>
              Réessayer
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/advertiser/dashboard")}>
              Tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
