import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, Check, Zap, Star, Award, ExternalLink, Clock } from "lucide-react";
import { useState } from "react";

const PLANS = [
  {
    id: "starter", name: "Starter", price: 350, icon: Zap, color: "blue",
    included: ["3 villes tunisiennes", "1 jeu actif", "5 pubs/mois", "Dashboard de base", "Support email"],
    notIncluded: ["Social Manager", "Villes étrangères", "Analytics avancés"],
  },
  {
    id: "pro", name: "Pro", price: 600, icon: Star, color: "purple", popular: true,
    included: ["6 villes tunisiennes", "5 jeux actifs", "20 pubs/mois", "Analytics complets", "Support prioritaire", "Social Manager (+50 DT)"],
    notIncluded: ["Villes étrangères"],
  },
  {
    id: "enterprise", name: "Enterprise", price: 1200, icon: Award, color: "gold",
    included: ["Villes illimitées", "Jeux illimités", "Pubs illimitées", "Analytics temps réel", "Account manager dédié", "Social Manager inclus", "API access"],
    notIncluded: [],
  },
];

export default function SubscriptionManager() {
  const { data: current, refetch } = trpc.payment.getMyCurrent.useQuery();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  // Initiate Flouci payment — redirects user to checkout page
  const initiate = trpc.payment.initiate.useMutation({
    onSuccess: (data: any) => {
      // Open Flouci checkout in same tab (or new tab)
      window.location.href = data.payUrl;
    },
    onError: (e: any) => {
      toast.error(e.message || "Impossible d'initier le paiement. Réessayez.");
      setPendingPlanId(null);
    },
  });

  const handleSelectPlan = (planId: string) => {
    setPendingPlanId(planId);
    initiate.mutate({ planId });
  };

  const currentPlan = (current as any);
  const nextBilling = currentPlan?.nextBillingDate
    ? new Date(currentPlan.nextBillingDate).toLocaleDateString("fr-TN")
    : null;

  const COLOR = {
    blue:   "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800",
    purple: "border-purple-400 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700 shadow-lg shadow-purple-100 dark:shadow-purple-900/20",
    gold:   "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700",
  };
  const BTN = {
    blue:   "bg-blue-600 hover:bg-blue-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
    gold:   "bg-yellow-500 hover:bg-yellow-600 text-black",
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-purple-600" />
            Mon abonnement
          </h1>
          {currentPlan && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-sm px-3 py-1">
              ✓ Plan actuel : {currentPlan.planName}
            </Badge>
          )}
        </div>

        {/* Plan actuel */}
        {currentPlan ? (
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-800">
            <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-lg">Plan {currentPlan.planName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {currentPlan.amount} DT/mois
                  {nextBilling && ` · Renouvellement le ${nextBilling}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardContent className="py-4">
              <p className="text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ Aucun abonnement actif — choisissez un plan ci-dessous pour commencer.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Powered by Flouci */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>💳 Paiement sécurisé via</span>
          <a href="https://flouci.com" target="_blank" rel="noopener noreferrer"
             className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
            Flouci <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <span>· Cartes bancaires tunisiennes acceptées</span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = currentPlan?.planId === plan.id;
            const isLoading = pendingPlanId === plan.id && initiate.isPending;

            return (
              <Card key={plan.id} className={`relative border-2 ${COLOR[plan.color as keyof typeof COLOR] ?? COLOR.blue}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white shadow">⭐ Populaire</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${
                      plan.color === "gold"   ? "text-yellow-600" :
                      plan.color === "purple" ? "text-purple-600" : "text-blue-600"
                    }`} />
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                  </div>
                  <p className="text-2xl font-black">
                    {plan.price}{" "}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">DT/mois</span>
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    {plan.included.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="w-3.5 text-center shrink-0">✗</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full text-sm ${
                      isCurrent
                        ? "bg-gray-200 text-gray-600 hover:bg-gray-200 cursor-default dark:bg-gray-700 dark:text-gray-400"
                        : BTN[plan.color as keyof typeof BTN] ?? BTN.blue
                    }`}
                    disabled={isCurrent || initiate.isPending}
                    onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                  >
                    {isCurrent
                      ? "✓ Plan actuel"
                      : isLoading
                      ? "Redirection vers Flouci…"
                      : `Payer ${plan.price} DT via Flouci`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Transaction history */}
        <TransactionHistory />
      </div>
    </DashboardLayout>
  );
}

function TransactionHistory() {
  const { data: txs } = trpc.payment.myTransactions.useQuery();
  if (!txs || (txs as any[]).length === 0) return null;

  const statusColor: Record<string, string> = {
    paid:     "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    failed:   "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  const statusLabel: Record<string, string> = {
    paid: "Payé", pending: "En attente", failed: "Échoué", refunded: "Remboursé",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historique des paiements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(txs as any[]).map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <p className="font-medium">{tx.planId} — {tx.amount} DT</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(tx.createdAt).toLocaleDateString("fr-TN")}
                  {tx.flouciReceiptId && (
                    <span className="ml-2 font-mono text-[10px] text-gray-400">#{tx.flouciReceiptId}</span>
                  )}
                </p>
              </div>
              <Badge className={`text-xs ${statusColor[tx.status] || statusColor.pending}`}>
                {statusLabel[tx.status] || tx.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


