import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Store, Calendar, MessageSquare, Radio, CheckCircle2, Clock,
  Bell, ChevronRight, Loader2, Star, QrCode, Users, TrendingUp,
  XCircle, MapPin,
} from "lucide-react";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: reservations, isLoading: loadingRes } = trpc.reservations.list.useQuery();
  const { data: unreadMsgs } = trpc.messages.unreadCount.useQuery();
  const { data: unreadNotifs } = trpc.notifications.unreadCount.useQuery();
  const { data: partnerProfile } = trpc.partners.getMyProfile.useQuery();

  const resList = (reservations as any[]) ?? [];
  const now = new Date();

  const todayRes = resList.filter((r: any) => {
    const d = new Date(r.date);
    return d.toDateString() === now.toDateString() && r.status !== "cancelled";
  });
  const pendingRes = resList.filter((r: any) => r.status === "pending");
  const upcomingRes = resList
    .filter((r: any) => new Date(r.date) >= now && r.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const partner = partnerProfile as any;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Hero */}
        <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">
                {partner?.businessName ?? user?.name} 👋
              </h1>
              <p className="text-green-100 text-sm mt-1 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                {partner?.category ?? "Commerce partenaire"} ·{" "}
                {partner?.city ?? "Tunis"}
              </p>
              {partner && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                  <span className="font-semibold text-sm">{partner.rating}</span>
                  <span className="text-green-200 text-xs">({partner.reviewCount} avis)</span>
                </div>
              )}
            </div>
            <Badge className="bg-green-500 text-white border-0 text-sm px-3">
              ● Actif
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Réservations",  value: resList.length },
              { label: "Aujourd'hui",   value: todayRes.length },
              { label: "En attente",    value: pendingRes.length },
              { label: "Messages",      value: unreadMsgs ?? 0 },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-green-100 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {Number(unreadMsgs) > 0 && (
          <div
            className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => setLocation("/messages")}
          >
            <MessageSquare className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800 flex-1">
              <span className="font-semibold">{unreadMsgs} message(s)</span> non lu(s) de vos clients
            </p>
            <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
          </div>
        )}

        {pendingRes.length > 0 && (
          <div
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-yellow-100 transition-colors"
            onClick={() => setLocation("/reservations")}
          >
            <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 flex-1">
              <span className="font-semibold">{pendingRes.length} réservation(s)</span> en attente de confirmation
            </p>
            <ChevronRight className="h-4 w-4 text-yellow-400 shrink-0" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Réservations du jour */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Agenda du jour
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-green-600" onClick={() => setLocation("/reservations")}>
                Voir tout <ChevronRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingRes && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" /></div>}
              {!loadingRes && todayRes.length === 0 && (
                <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucune réservation aujourd'hui
                </div>
              )}
              <div className="space-y-2">
                {todayRes.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-12 text-center">
                      <p className="text-sm font-bold text-green-800">
                        {new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{r.user?.name ?? "Client"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.service} · {r.duration} min · {r.price} DT</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${r.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.status === "confirmed" ? "Confirmé" : "En attente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-1">Actions rapides</p>
            {[
              { icon: Calendar,      label: "Réservations",    desc: `${resList.length} au total`, path: "/reservations",  color: "bg-green-50 text-green-600" },
              { icon: Radio,         label: "Diffusion",       desc: "Flux actif sur mes écrans",  path: "/broadcast",     color: "bg-purple-50 text-purple-600" },
              { icon: MessageSquare, label: "Messages",        desc: `${unreadMsgs ?? 0} non lu(s)`, path: "/messages",   color: "bg-blue-50 text-blue-600" },
              { icon: Bell,          label: "Notifications",   desc: `${unreadNotifs ?? 0} nouvelle(s)`, path: "/notifications", color: "bg-orange-50 text-orange-600" },
            ].map(item => (
              <Card key={item.path} className="cursor-pointer hover:shadow-md transition-all border-gray-100 hover:border-green-200" onClick={() => setLocation(item.path)}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming reservations */}
        {upcomingRes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Prochaines réservations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {upcomingRes.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">
                    {new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} à{" "}
                    {new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.user?.name ?? "Client"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{r.service}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{r.price} DT</span>
                    <Badge className={`text-xs ${r.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.status === "confirmed" ? "✓" : "⏳"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
