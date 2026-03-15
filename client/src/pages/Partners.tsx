import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { MapPin, Search, Gamepad2, Tag, Star, Phone, MessageSquare, Navigation, Clock, ExternalLink } from "lucide-react";

const FILTERS = ["Tous", "Jeux", "Promos", "Réservable"];

const DEMO_PARTNERS = [
  { id: 1, businessName: "Coiffure Linda", address: "15 Av. Bourguiba, Tunis", city: "Tunis", category: "Coiffeur", rating: 4.8, reviewCount: 124, lat: 36.8190, lng: 10.1658, activeGames: 2, activeOffers: 1, distance: "500m", isOpen: true, services: ["Coupe homme", "Coupe femme", "Coloration"] },
  { id: 2, businessName: "Restaurant Délice", address: "71 Av. Bourguiba, Tunis", city: "Tunis", category: "Restaurant", rating: 4.5, reviewCount: 89, lat: 36.8008, lng: 10.1800, activeGames: 1, activeOffers: 2, distance: "300m", isOpen: true, services: [] },
  { id: 3, businessName: "Clinique Santé", address: "12 Rue de la Liberté, Tunis", city: "Tunis", category: "Santé", rating: 4.7, reviewCount: 56, lat: 36.8050, lng: 10.1750, activeGames: 1, activeOffers: 1, distance: "800m", isOpen: false, services: ["Consultation", "Analyses"] },
  { id: 4, businessName: "Garage Hamza", address: "8 Rue Industrie, Tunis", city: "Tunis", category: "Automobile", rating: 4.2, reviewCount: 33, lat: 36.7990, lng: 10.1820, activeGames: 0, activeOffers: 0, distance: "1.2km", isOpen: true, services: [] },
];

const CATEGORIES: Record<string, string> = {
  "Coiffeur": "✂️", "Restaurant": "🍽️", "Santé": "🏥", "Automobile": "🔧",
};

export default function Partners() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  const { data: partners } = trpc.partners.list.useQuery({ lat: 36.819, lng: 10.165 });
  const partnerList: any[] = (partners as any[]) ?? DEMO_PARTNERS;

  const filtered = partnerList.filter(p => {
    const matchSearch = p.businessName.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Tous" || (filter === "Jeux" && p.activeGames > 0) || (filter === "Promos" && p.activeOffers > 0) || (filter === "Réservable" && p.services?.length > 0);
    return matchSearch && matchFilter;
  });

  const selectedPartner = filtered.find(p => p.id === selected);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-blue-600" />Commerces partenaires</h1>
          <div className="flex gap-2">
            <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>Liste</Button>
            <Button size="sm" variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}>Carte</Button>
          </div>
        </div>

        {/* Barre de recherche + filtres */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input className="pl-9" placeholder="Rechercher un commerce..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="text-xs" onClick={() => setFilter(f)}>{f}</Button>
            ))}
          </div>
        </div>

        {/* Vue carte */}
        {view === "map" && (
          <div className="space-y-3">
            <MapView
              center={[36.8190, 10.1658]}
              zoom={14}
              className="h-80"
              markers={filtered.map(p => ({
                lat: p.lat, lng: p.lng,
                label: p.businessName,
                type: p.activeGames > 0 ? "game" : "partner",
                onClick: () => setSelected(p.id),
              }))}
            />
            {/* Detail carte popup */}
            {selectedPartner && (
              <Card className="border-blue-200">
                <CardContent className="py-3 flex items-center gap-3">
                  <span className="text-2xl">{CATEGORIES[selectedPartner.category] ?? "🏪"}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedPartner.businessName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPartner.address} · {selectedPartner.distance}</p>
                  </div>
                  <Button size="sm" onClick={() => setView("list")}>Détails</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Vue liste */}
        {view === "list" && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-gray-400 dark:text-gray-500">Aucun partenaire trouvé</CardContent></Card>
            ) : filtered.map(partner => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/partner/${partner.userId ?? partner.id}`)}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {CATEGORIES[partner.category] ?? "🏪"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold">{partner.businessName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />{partner.address} · <span className="font-medium text-blue-600">{partner.distance}</span>
                          </p>
                        </div>
                        <Badge className={`text-xs shrink-0 ${partner.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {partner.isOpen ? "● Ouvert" : "Fermé"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold">{partner.rating}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">({partner.reviewCount} avis)</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {partner.activeGames > 0 && (
                          <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <Gamepad2 className="h-3 w-3 mr-1" />{partner.activeGames} jeu(x)
                          </Badge>
                        )}
                        {partner.activeOffers > 0 && (
                          <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Tag className="h-3 w-3 mr-1" />{partner.activeOffers} offre(s)
                          </Badge>
                        )}
                        {partner.services?.length > 0 && (
                          <Badge className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Clock className="h-3 w-3 mr-1" />Réservable
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        {partner.activeGames > 0 && (
                          <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => setLocation(`/wheel`)}>
                            <Gamepad2 className="h-3 w-3" />Jouer
                          </Button>
                        )}
                        {partner.services?.length > 0 && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setLocation("/reservations")}>
                            <Clock className="h-3 w-3" />Réserver
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setLocation("/messages")}>
                          <MessageSquare className="h-3 w-3" />Message
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); setView("map"); }}>
                          <Navigation className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-purple-600 border-purple-200" onClick={e => { e.stopPropagation(); setLocation(`/partner/${partner.userId ?? partner.id}`); }}>
                          <ExternalLink className="h-3 w-3" />Fiche
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
