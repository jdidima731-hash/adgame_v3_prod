import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4 border-red-200">
        <CardContent className="py-12 text-center space-y-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-red-700">Paiement annulé</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Vous avez annulé le paiement ou une erreur s'est produite. Vous n'avez pas été débité.
          </p>
          <div className="flex gap-3 mt-4">
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => navigate("/advertiser/subscription")}>
              Réessayer
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/advertiser/dashboard")}>
              Tableau de bord
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Besoin d'aide ? Contactez <a href="mailto:support@adgame.tn" className="underline">support@adgame.tn</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
