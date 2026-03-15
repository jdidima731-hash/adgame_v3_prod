import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CoverageSelector as CoverageSelectorComponent } from "@/components/CoverageSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MapPin, Tag, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function CoverageSelectorPage() {
  const [, setLocation] = useLocation();
  const [selectedCities, setSelectedCities] = useState<{ id: number; isForeignCity: boolean }[]>([]);
  const [price, setPrice] = useState(350);
  const { data: cities } = trpc.cities.list.useQuery();
  const { data: myOffers } = trpc.offers.listMine.useQuery();

  const cityList = (cities as any[]) ?? [
    { id: 1, name: "Tunis", country: "TN", isForeignCity: false },
    { id: 2, name: "Sfax", country: "TN", isForeignCity: false },
    { id: 3, name: "Sousse", country: "TN", isForeignCity: false },
    { id: 4, name: "Bizerte", country: "TN", isForeignCity: false },
    { id: 5, name: "Gabès", country: "TN", isForeignCity: false },
    { id: 6, name: "Paris", country: "FR", isForeignCity: true },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-orange-600" />Offres & Couverture</h1>

        {/* Mes offres */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4 text-orange-500" />Mes offres actives</CardTitle>
            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" />Créer</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {((myOffers as any[]) ?? [
              { id: 1, title: "-20% sur plats à emporter", promoCode: "DELICE20", usageCount: 124, isActive: true, endDate: new Date("2026-04-30") },
              { id: 2, title: "1 coupe offerte pour 2 achetées", promoCode: "COUPE2", usageCount: 87, isActive: true, endDate: new Date("2026-05-15") },
            ]).map((offer: any) => (
              <div key={offer.id} className="flex items-center gap-3 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                <Tag className="h-4 w-4 text-orange-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{offer.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Code : <span className="font-mono font-bold text-orange-700">{offer.promoCode}</span> · {offer.usageCount} utilisations</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">Exp. {new Date(offer.endDate).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sélecteur de couverture */}
        <CoverageSelectorComponent
          cities={cityList}
          onCitiesChange={setSelectedCities}
          onPriceChange={setPrice}
        />

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-purple-800">{price} DT / mois</p>
              <p className="text-xs text-purple-600">{selectedCities.length} ville(s) sélectionnée(s)</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { toast.success("Couverture mise à jour !"); }}>
              Confirmer
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
