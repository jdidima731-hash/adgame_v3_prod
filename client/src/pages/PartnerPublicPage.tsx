import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  MapPin, Phone, Globe, Clock, Gamepad2, Tag, MessageSquare,
  Calendar, Star, Navigation, ChevronRight, Loader2, ExternalLink
} from "lucide-react";

const DAYS: [string, string][] = [["lun","Lun"],["mar","Mar"],["mer","Mer"],["jeu","Jeu"],["ven","Ven"],["sam","Sam"],["dim","Dim"]];

export default function PartnerPublicPage() {
  const [, params] = useRoute("/partner/:userId");
  const userId = Number(params?.userId);
  const [, setLocation] = useLocation();
  const [imgError, setImgError] = useState(false);

  const { data: profile, isLoading } = trpc.advertiserProfile.getPublic.useQuery({ userId }, { enabled: !!userId });
  const p = profile as any;

  let parsedHours: Record<string, string> = {};
  try { parsedHours = JSON.parse(p?.openingHours ?? "{}"); } catch {}

  const now = new Date();
  const dayKey = ["dim","lun","mar","mer","jeu","ven","sam"][now.getDay()];
  const todayHours = parsedHours[dayKey] || "—";
  const isOpen = todayHours !== "Fermé" && todayHours !== "—";

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" /></div>
    </DashboardLayout>
  );

  if (!p) return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <p className="text-gray-400 dark:text-gray-500">Ce partenaire n'est pas disponible.</p>
        <Button variant="outline" onClick={() => setLocation("/partners")}>Voir tous les partenaires</Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Cover */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 h-44">
          {p.coverPhoto && !imgError && (
            <img src={p.coverPhoto} alt={p.businessName} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 p-5 text-white">
            <h1 className="text-2xl font-black">{p.businessName ?? p.displayName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30">{p.businessType}</Badge>
              {p.priceRange && <Badge className="bg-white/20 text-white border-white/30">{p.priceRange}</Badge>}
              <Badge className={`${isOpen ? "bg-green-500" : "bg-red-500"} text-white border-0`}>
                {isOpen ? "● Ouvert" : "● Fermé"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Rating + quick info */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /><span className="font-semibold">4.8</span><span className="text-gray-400 dark:text-gray-500">(124 avis)</span></div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Clock className="h-4 w-4" />{todayHours}</div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><MapPin className="h-4 w-4" />{p.city}</div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/messages")}>
            <MessageSquare className="h-4 w-4" /> Message
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setLocation("/reservations/new")}>
            <Calendar className="h-4 w-4" /> Réserver
          </Button>
          {p.address && (
            <Button variant="outline" className="gap-2" onClick={() => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(p.address)}`)}>
              <Navigation className="h-4 w-4" /> Itinéraire
            </Button>
          )}
          {p.phone && (
            <Button variant="outline" className="gap-2" onClick={() => window.open(`tel:${p.phone}`)}>
              <Phone className="h-4 w-4" /> Appeler
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            {/* Description */}
            {p.description && (
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm leading-relaxed text-gray-700">{p.description}</p>
                  <div className="mt-3 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {p.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{p.phone}</div>}
                    {p.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{p.address}</div>}
                    {p.website && <div className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline" onClick={() => window.open(p.website)}><Globe className="h-3.5 w-3.5" />{p.website}</div>}
                  </div>
                  {/* Social links */}
                  <div className="flex gap-2 mt-3">
                    {p.instagram && <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => window.open(`https://instagram.com/${p.instagram.replace("@","")}`)}><ExternalLink className="h-3 w-3" />Instagram</Button>}
                    {p.facebook && <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => window.open(`https://facebook.com/${p.facebook}`)}><ExternalLink className="h-3 w-3" />Facebook</Button>}
                    {p.tiktok && <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => window.open(`https://tiktok.com/${p.tiktok}`)}><ExternalLink className="h-3 w-3" />TikTok</Button>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active games */}
            {p.games?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-blue-600" />Jeux actifs</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {p.games.map((game: any) => (
                    <div key={game.id} className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100" onClick={() => setLocation(`/wheel/${game.id}`)}>
                      <Gamepad2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <div className="flex-1"><p className="text-sm font-semibold">{game.title}</p><p className="text-xs text-gray-500 dark:text-gray-400">{game.totalParticipations} participants</p></div>
                      <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700">Participer</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Offers */}
            {p.offers?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-purple-600" />Offres en cours</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {p.offers.map((offer: any) => (
                    <div key={offer.id} className="flex items-center gap-3 p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                      <Tag className="h-4 w-4 text-purple-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{offer.title}</p>
                        {offer.conditions && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{offer.conditions}</p>}
                        <p className="text-xs text-purple-700 font-mono font-bold mt-0.5">{offer.promoCode}</p>
                      </div>
                      {offer.badgeText && <Badge className="bg-purple-600 text-white">{offer.badgeText}</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Map */}
            <MapView center={[p.lat ?? 36.8190, p.lng ?? 10.1658]} zoom={15} className="h-48"
              markers={[{ lat: p.lat ?? 36.8190, lng: p.lng ?? 10.1658, label: p.businessName, type: "partner" }]} />
          </div>

          {/* Hours */}
          <div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Horaires</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {DAYS.map(([k, label]) => (
                  <div key={k} className={`flex justify-between text-xs py-1 border-b last:border-0 ${k === dayKey ? "font-bold" : ""}`}>
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className={parsedHours[k] === "Fermé" ? "text-red-500" : "text-green-600"}>{parsedHours[k] || "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
