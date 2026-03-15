import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Tag, Search, Copy, CheckCircle2, Clock, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Promotions() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: offers, isLoading } = trpc.offers.listActive.useQuery({ cityId: undefined });

  const offerList = (offers as any[]) ?? [];
  const filtered = offerList.filter((o: any) =>
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.promoCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    toast.success(`Code "${code}" copié !`);
    setTimeout(() => setCopied(null), 2000);
  };

  const TYPE_LABELS: Record<string, string> = {
    percentage:       "Réduction %",
    fixed:            "Montant fixe",
    buy_one_get_one:  "1 acheté = 1 offert",
    gift:             "Cadeau",
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-600" /> Offres & Promotions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Codes promo exclusifs des commerces partenaires</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Rechercher une offre ou un code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Tag className="h-12 w-12 mx-auto text-gray-200" />
              <p className="text-gray-400 dark:text-gray-500">Aucune offre disponible pour le moment</p>
              <Button variant="outline" onClick={() => setLocation("/partners")}>
                Voir les partenaires
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offers list */}
        <div className="space-y-3">
          {filtered.map((offer: any) => {
            const isCopied = copied === offer.promoCode;
            const isExpiringSoon = offer.endDate &&
              (new Date(offer.endDate).getTime() - Date.now()) < 7 * 86400000;

            return (
              <Card key={offer.id} className="border-purple-100 hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="p-2.5 bg-purple-50 rounded-xl shrink-0">
                      <Tag className="h-4 w-4 text-purple-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{offer.title}</p>
                        {isExpiringSoon && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            ⚡ Expire bientôt
                          </Badge>
                        )}
                      </div>

                      {/* Type */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {TYPE_LABELS[offer.type] ?? offer.type}
                        {offer.discount > 0 && ` · ${offer.discount}${offer.type === "percentage" ? "%" : " DT"}`}
                      </p>

                      {/* Dates */}
                      {offer.endDate && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Valable jusqu'au {new Date(offer.endDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}

                      {/* Usage count */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {offer.usageCount} utilisation(s)
                      </p>

                      {/* Promo code */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 rounded-lg px-3 py-1.5">
                          <span className="font-mono font-bold text-purple-700 text-sm tracking-wider">
                            {offer.promoCode}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={isCopied ? "default" : "outline"}
                          className={`shrink-0 gap-1.5 transition-all ${
                            isCopied ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""
                          }`}
                          onClick={() => handleCopy(offer.promoCode)}
                        >
                          {isCopied
                            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Copié</>
                            : <><Copy className="h-3.5 w-3.5" /> Copier</>
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        {!isLoading && offerList.length > 0 && (
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="py-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm text-purple-800">Participez aux jeux pour gagner plus de codes !</p>
                <p className="text-xs text-purple-600 mt-0.5">Chaque participation peut débloquer un bon d'achat exclusif</p>
              </div>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 shrink-0 gap-1.5"
                onClick={() => setLocation("/wheel")}
              >
                Jouer <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
