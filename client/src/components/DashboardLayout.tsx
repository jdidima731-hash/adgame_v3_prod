import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, LogOut, PanelLeft, Gamepad2, Tv, Bot, Tag, MessageSquare, Bell,
  QrCode, MapPin, History, User, Shield, Users, CheckSquare2, Radio, CreditCard,
  Settings, BarChart2, Store, Calendar, FileText, ChevronRight, Moon, Sun
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { MiniPlayer } from "./MiniPlayer";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type MenuItem = { icon: any; label: string; path: string; badge?: string | number };

const USER_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: "Accueil",        path: "/dashboard" },
  { icon: MapPin,          label: "Carte",           path: "/partners" },
  { icon: Gamepad2,        label: "Jeux",            path: "/wheel" },
  { icon: Tag,             label: "Promotions",      path: "/promotions" },
  { icon: QrCode,          label: "Scanner QR",      path: "/qr-scan" },
  { icon: History,         label: "Historique",      path: "/history" },
  { icon: MessageSquare,   label: "Messages",        path: "/messages" },
  { icon: Bell,            label: "Notifications",   path: "/notifications" },
  { icon: User,            label: "Mon profil",      path: "/profile" },
];

const ADVERTISER_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/advertiser/dashboard" },
  { icon: Store,           label: "Mon profil",       path: "/advertiser/profile" },
  { icon: Gamepad2,        label: "Mes jeux",         path: "/advertiser/games/new" },
  { icon: Tv,              label: "Studio pub",        path: "/ads" },
  { icon: Bot,             label: "Social Manager",    path: "/advertiser/social" },
  { icon: Tag,             label: "Offres & couverture",path: "/advertiser/coverage" },
  { icon: FileText,        label: "Contrats",          path: "/advertiser/contracts" },
  { icon: CreditCard,      label: "Abonnement",        path: "/advertiser/subscriptions" },
  { icon: MessageSquare,   label: "Messages",          path: "/messages" },
  { icon: Bell,            label: "Notifications",     path: "/notifications" },
];

const PARTNER_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: "Mon commerce",   path: "/partner/dashboard" },
  { icon: Calendar,        label: "Réservations",   path: "/reservations" },
  { icon: Radio,           label: "Diffusion",      path: "/broadcast" },
  { icon: MessageSquare,   label: "Messages",       path: "/messages" },
  { icon: Bell,            label: "Notifications",  path: "/notifications" },
  { icon: User,            label: "Mon profil",     path: "/profile" },
];

const ADMIN_MENU: MenuItem[] = [
  { icon: Shield,    label: "Dashboard Admin",  path: "/admin" },
  { icon: CheckSquare2, label: "Validations",   path: "/admin" },
  { icon: Radio,     label: "Diffusion",       path: "/admin/broadcast" },
  { icon: Users,     label: "Utilisateurs",    path: "/admin" },
  { icon: Store,     label: "Partenaires",     path: "/partners" },
  { icon: CreditCard,label: "Abonnements",     path: "/admin/subscriptions" },
  { icon: BarChart2, label: "Rapports",        path: "/admin" },
];

function getMenuByRole(role?: string): MenuItem[] {
  if (role === "admin") return ADMIN_MENU;
  if (role === "advertiser") return ADVERTISER_MENU;
  if (role === "partner") return PARTNER_MENU;
  return USER_MENU;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "text-red-600", advertiser: "text-purple-600", partner: "text-green-600", user: "text-blue-600",
};
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur", advertiser: "Annonceur", partner: "Partenaire", user: "Utilisateur",
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 380;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-800/40">
        <div className="flex flex-col items-center gap-5 p-8 max-w-sm w-full text-center">
          <div className="p-4 bg-blue-50 rounded-full">
            <Gamepad2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Connexion requise</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Accédez à votre espace AdGame en vous connectant.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const menuItems = getMenuByRole(user?.role);

  // Live badges — hooks always called unconditionally (Rules of Hooks)
  const { data: unreadMsgs } = trpc.messages.unreadCount.useQuery(undefined, { refetchInterval: 30000 });
  const { data: unreadNotifs } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 30000 });
  const { data: pendingStats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
    refetchInterval: 60000,
  });

  // Dynamically add badges to menu items
  const menuWithBadges = menuItems.map(item => {
    if (item.path === "/messages" && unreadMsgs) return { ...item, badge: unreadMsgs };
    if (item.path === "/notifications" && unreadNotifs) return { ...item, badge: unreadNotifs };
    if (item.label === "Validations" && (pendingStats as any)?.pendingAds) return { ...item, badge: (pendingStats as any).pendingAds + ((pendingStats as any).pendingGames ?? 0) };
    return item;
  });

  const activeItem = menuWithBadges.find(item =>
    location === item.path || (item.path.length > 1 && location.startsWith(item.path))
  ) ?? menuWithBadges[0];

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-14 justify-center border-b bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2.5 px-2 w-full">
              <button onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
                aria-label="Toggle navigation">
                <PanelLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <Gamepad2 className={`h-5 w-5 shrink-0 ${ROLE_COLORS[user?.role ?? "user"]}`} />
                  <span className="font-bold text-gray-900 truncate">AdGame</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent className="gap-0 py-2 bg-white dark:bg-gray-900">
            <SidebarMenu className="px-2 space-y-0.5">
              {menuWithBadges.map(item => {
                const isActive = location === item.path ||
                  (item.path.length > 1 && location.startsWith(item.path) && item.path !== "/dashboard" && item.path !== "/admin");
                return (
                  <SidebarMenuItem key={item.path + item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                      <span className={isActive ? "text-blue-700 font-medium" : ""}>{item.label}</span>
                      {item.badge && Number(item.badge) > 0 && !isCollapsed && (
                        <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 h-4 rounded-full">
                          {item.badge}
                        </Badge>
                      )}
                      {item.badge && Number(item.badge) > 0 && isCollapsed && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer user */}
          <SidebarFooter className="p-3 border-t bg-white dark:bg-gray-900">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className={`text-xs font-bold bg-gray-100 ${ROLE_COLORS[user?.role ?? "user"]}`}>
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{user?.name ?? "-"}</p>
                      <p className={`text-xs font-medium ${ROLE_COLORS[user?.role ?? "user"]}`}>
                        {ROLE_LABELS[user?.role ?? "user"]}
                      </p>
                    </div>
                  )}
                  {!isCollapsed && <ChevronRight className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer gap-2">
                  <User className="h-4 w-4" /> Mon profil
                </DropdownMenuItem>
                {toggleTheme && (
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                    {theme === "dark"
                      ? <><Sun className="h-4 w-4 text-yellow-500" /> Mode clair</>
                      : <><Moon className="h-4 w-4 text-indigo-500" /> Mode sombre</>
                    }
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 gap-2">
                  <LogOut className="h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gray-50 dark:bg-gray-800/40">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex border-b h-13 items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2.5 sticky top-0 z-40 shadow-sm">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <Gamepad2 className={`h-5 w-5 ${ROLE_COLORS[user?.role ?? "user"]}`} />
            <span className="font-semibold text-sm flex-1">{activeItem?.label ?? "AdGame"}</span>
            <button onClick={() => setLocation("/notifications")} className="relative p-1">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {Number(unreadNotifs) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadNotifs}
                </span>
              )}
            </button>
          </div>
        )}
        <main className={`flex-1 p-4 md:p-6 ${user?.role === "user" ? "pb-28" : ""}`}>{children}</main>
        {user?.role === "user" && <MiniPlayer />}
      </SidebarInset>
    </>
  );
}
