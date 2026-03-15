import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, TrendingUp, Users, Search, Download, Loader2 } from "lucide-react";
import { useState } from "react";

const PLAN_COLORS: Record<string, string> = {
  Starter:    "bg-blue-100 text-blue-700",
  Pro:        "bg-purple-100 text-purple-700",
  Enterprise: "bg-yellow-100 text-yellow-800",
};

export default function SubscriptionAdmin() {
  const [search, setSearch] = useState("");
  const { data: subs, isLoading, refetch } = trpc.admin.listSubscriptions.useQuery();
  const updateStatus = trpc.admin.updateSubscriptionStatus.useMutation({
    onSuccess: () => { toast.success("Abonnement mis à jour"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const subList = (subs as any[]) ?? [];
  const filtered = subList.filter((s: any) =>
    (s.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.user?.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter((s: any) => s.status === "active");
  const total  = active.reduce((acc: number, s: any) => acc + (s.amount ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-red-600" /> Abonnements
          </h1>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Abonnés actifs",   value: active.length,           icon: Users,      color: "text-green-600" },
            { label: "CA mensuel (DT)",  value: total.toLocaleString(),  icon: TrendingUp, color: "text-blue-600"  },
            { label: "Plans Pro+",       value: filtered.filter((s: any) => s.planId !== "starter").length, icon: CreditCard, color: "text-purple-600" },
            { label: "Suspendus",        value: filtered.filter((s: any) => s.status === "suspended").length, icon: Users, color: "text-red-600" },
          ].map(st => (
            <Card key={st.label}>
              <CardContent className="pt-3 pb-3">
                <st.icon className={`h-5 w-5 mb-1 ${st.color}`} />
                <p className="text-2xl font-bold">{st.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{st.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Tous les abonnements</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input className="pl-8 h-8 w-52 text-sm" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" /></div>}
            {!isLoading && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 border-b">
                      <th className="text-left pb-2 font-medium">Annonceur</th>
                      <th className="text-left pb-2 font-medium">Plan</th>
                      <th className="text-left pb-2 font-medium">Montant</th>
                      <th className="text-left pb-2 font-medium">Statut</th>
                      <th className="text-left pb-2 font-medium">Prochain paiement</th>
                      <th className="text-left pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-2.5">
                          <p className="font-medium">{sub.user?.name ?? "—"}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{sub.user?.email}</p>
                        </td>
                        <td className="py-2.5">
                          <Badge className={`text-xs ${PLAN_COLORS[sub.planName] ?? "bg-gray-100 text-gray-700"}`}>
                            {sub.planName}
                          </Badge>
                        </td>
                        <td className="py-2.5 font-semibold">{sub.amount} DT</td>
                        <td className="py-2.5">
                          <Badge className={`text-xs ${
                            sub.status === "active"    ? "bg-green-100 text-green-700" :
                            sub.status === "suspended" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {sub.status === "active" ? "Actif" : sub.status === "suspended" ? "Suspendu" : "Annulé"}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(sub.nextBillingDate).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-2.5">
                          <Select
                            value={sub.status}
                            onValueChange={v => updateStatus.mutate({ id: sub.id, status: v as any })}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="suspended">Suspendu</SelectItem>
                              <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                          Aucun abonnement trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
