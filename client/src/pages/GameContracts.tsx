import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Eye, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const DEMO_CONTRACTS = [
  { id: 1, game: "iPhone 15 à gagner", type: "QR Code Challenge", startDate: "01/03/2026", endDate: "30/04/2026", status: "active", lots: "1x iPhone 15, 5x Bon 100 DT", cities: "Tunis, Sfax" },
  { id: 2, game: "Bons d'achat 100 DT", type: "Lucky Draw", startDate: "10/03/2026", endDate: "20/03/2026", status: "ended", lots: "10x Bon 100 DT", cities: "Tunis" },
  { id: 3, game: "Réduction 20%", type: "QR Code", startDate: "01/04/2026", endDate: "15/04/2026", status: "pending", lots: "50x Réduction 20%", cities: "Tunis" },
];

const STATUS_CONFIG = {
  active: { label: "Actif", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  ended: { label: "Terminé", icon: Clock, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
  pending: { label: "En attente", icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
};

export default function GameContracts() {
  const { data: games } = trpc.games.listByAdvertiser.useQuery();
  const contracts = (games as any[]) ?? DEMO_CONTRACTS;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-purple-600" />Mes contrats & jeux</h1>
          <Badge variant="outline">{contracts.length} contrat(s)</Badge>
        </div>

        <div className="space-y-3">
          {contracts.map((c: any, idx: number) => {
            const status = (c.status in STATUS_CONFIG ? c.status : "pending") as keyof typeof STATUS_CONFIG;
            const cfg = STATUS_CONFIG[status];
            return (
              <Card key={c.id ?? idx} className={`border ${cfg.bg}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <cfg.icon className={`h-5 w-5 mt-0.5 ${cfg.color} shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold">{c.title ?? c.game}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {c.type ?? "—"} · {(c.startDate || c.createdAt) ? new Date(c.startDate ?? c.createdAt).toLocaleDateString("fr-FR") : "—"} → {c.endDate ? new Date(c.endDate).toLocaleDateString("fr-FR") : "—"}
                          </p>
                        </div>
                        <Badge className={`text-xs ${cfg.color} border ${cfg.bg} shrink-0`}>{cfg.label}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div><span className="font-medium">Lots :</span> {Array.isArray(c.lots) ? c.lots.map((l: any) => `${l.quantity}x ${l.name}`).join(", ") : (c.lots ?? "—")}</div>
                        <div><span className="font-medium">Zones :</span> {Array.isArray(c.cities) ? `${c.cities.length} ville(s)` : (c.cities ?? "—")}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Conditions générales */}
        <Card className="bg-gray-50 dark:bg-gray-800/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 dark:text-gray-300">Conditions générales</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Tout jeu doit être validé par l'équipe AdGame avant diffusion (délai : 24-48h ouvrées).</p>
            <p>• Les lots déclarés doivent être remis aux gagnants dans un délai de 30 jours après le tirage.</p>
            <p>• En cas de litige, AdGame assure la médiation entre l'annonceur et les participants.</p>
            <p>• L'annonceur est responsable de la véracité des lots annoncés.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
