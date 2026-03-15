import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Calendar, Clock, CheckCircle2, XCircle, Plus, Loader2, MapPin, ChevronRight } from "lucide-react";

const SERVICES = [
  { id: 1, name: "Coupe homme",  duration: 30, price: 35 },
  { id: 2, name: "Coupe femme",  duration: 45, price: 45 },
  { id: 3, name: "Coloration",   duration: 90, price: 80 },
  { id: 4, name: "Soin cheveux", duration: 60, price: 60 },
];

const TIME_SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","17:00","18:00"];
const SLOT_STATUS = ["available","available","available","partial","available","available","partial","available"];

const STATUS_CFG = {
  confirmed: { label: "Confirmé",    color: "text-green-700", bg: "bg-green-50",  border: "border-green-200", icon: CheckCircle2 },
  pending:   { label: "En attente",  color: "text-yellow-700",bg: "bg-yellow-50", border: "border-yellow-200",icon: Clock },
  cancelled: { label: "Annulé",      color: "text-red-600",   bg: "bg-red-50",    border: "border-red-200",   icon: XCircle },
};

export default function Reservations() {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "new">("list");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: reservations, isLoading, refetch } = trpc.reservations.list.useQuery();
  const createReservation = trpc.reservations.create.useMutation({
    onSuccess: () => { toast.success("Réservation enregistrée !"); refetch(); setView("list"); setSelectedService(null); setSelectedDate(""); setSelectedSlot(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateStatus = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => { toast.success("Statut mis à jour"); refetch(); },
  });

  const resList = (reservations as any[]) ?? [];
  const service = SERVICES.find(s => s.id === selectedService);

  const handleBook = () => {
    if (!service || !selectedDate || !selectedSlot) return toast.error("Remplissez tous les champs");
    const [hours, minutes] = selectedSlot.split(":").map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);
    createReservation.mutate({ partnerId: 1, service: service.name, price: service.price, duration: service.duration, date });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-green-600" /> Réservations
          </h1>
          <Button size="sm" onClick={() => setView(v => v === "new" ? "list" : "new")} className={view === "new" ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-green-600 hover:bg-green-700"}>
            {view === "new" ? "← Retour" : <><Plus className="h-4 w-4 mr-1" />Réserver</>}
          </Button>
        </div>

        {/* Formulaire nouvelle réservation */}
        {view === "new" && (
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" /> Coiffure Linda — Nouvelle réservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service */}
              <div>
                <p className="text-sm font-medium mb-2">Service</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICES.map(s => (
                    <button key={s.id} onClick={() => setSelectedService(s.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${selectedService === s.id ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-200 hover:bg-gray-50"}`}>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.duration} min · {s.price} DT</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-sm font-medium mb-2">Date</p>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Créneaux */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-medium mb-2">Créneau horaire</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot, i) => {
                      const status = SLOT_STATUS[i];
                      const isAvailable = status !== "full";
                      return (
                        <button key={slot} onClick={() => isAvailable && setSelectedSlot(slot)} disabled={!isAvailable}
                          className={`py-2 rounded-lg border-2 text-sm font-medium transition-all
                            ${selectedSlot === slot ? "border-green-500 bg-green-100 text-green-800" :
                              !isAvailable ? "border-red-200 bg-red-50 text-red-400 cursor-not-allowed" :
                              status === "partial" ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:border-yellow-500" :
                              "border-gray-200 hover:border-green-300 hover:bg-green-50"}`}>
                          {slot}
                          {status === "partial" && <span className="block text-[10px] text-yellow-600">1 place</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Résumé */}
              {service && selectedDate && selectedSlot && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-semibold text-green-800">Résumé</p>
                  <p className="text-xs text-green-700">📋 {service.name} — {service.duration} min</p>
                  <p className="text-xs text-green-700">📅 {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {selectedSlot}</p>
                  <p className="text-xs text-green-700 font-bold">💰 {service.price} DT</p>
                </div>
              )}

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleBook}
                disabled={!service || !selectedDate || !selectedSlot || createReservation.isPending}
              >
                {createReservation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />En cours...</> : "Confirmer la réservation"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Liste des réservations */}
        {view === "list" && (
          <>
            {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" /></div>}

            {!isLoading && resList.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center space-y-3">
                  <Calendar className="h-12 w-12 mx-auto text-gray-200" />
                  <p className="text-gray-400 dark:text-gray-500">Aucune réservation</p>
                  <Button onClick={() => setView("new")} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-1" /> Prendre un rendez-vous
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {resList.map((r: any) => {
                const s = STATUS_CFG[r.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
                return (
                  <Card key={r.id} className={`border ${s.border}`}>
                    <CardContent className="py-3.5 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{r.service}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {r.partner?.businessName ?? "Coiffure Linda"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} à {new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="font-medium text-gray-700">{r.price} DT · {r.duration} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-xs ${s.color} ${s.bg} border ${s.border}`}>{s.label}</Badge>
                        {r.status === "pending" && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                            onClick={() => updateStatus.mutate({ id: r.id, status: "cancelled" })}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
