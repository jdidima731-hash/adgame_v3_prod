import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, Gamepad2, Tag, MessageSquare, Settings, CheckCheck, Loader2 } from "lucide-react";

const ICON_MAP: Record<string, any> = { game: Gamepad2, offer: Tag, message: MessageSquare, system: Settings };
const COLOR_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  game:    { icon: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
  offer:   { icon: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  message: { icon: "text-green-600",  bg: "bg-green-50",  border: "border-green-100" },
  system:  { icon: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-100" },
};

export default function Notifications() {
  const { data, isLoading, refetch } = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: refetch });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: refetch });

  const notifs = (data as any[]) ?? [];
  const unread = notifs.filter((n: any) => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unread > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2">{unread}</Badge>
            )}
          </h1>
          {unread > 0 && (
            <Button
              size="sm" variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="gap-1.5 text-xs"
            >
              {markAllRead.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Tout marquer lu
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {!isLoading && notifs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 dark:text-gray-500">Aucune notification pour le moment</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {notifs.map((n: any) => {
            const Icon = ICON_MAP[n.type] ?? Bell;
            const c = COLOR_MAP[n.type] ?? COLOR_MAP.system;
            return (
              <Card
                key={n.id}
                className={`transition-all cursor-pointer hover:shadow-sm border ${n.isRead ? "opacity-75" : `${c.border} shadow-sm`}`}
                onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
              >
                <CardContent className="py-3 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${c.bg} shrink-0 mt-0.5`}>
                    <Icon className={`h-4 w-4 ${c.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      {new Date(n.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
