/**
 * MiniPlayer — lecteur vidéo persistant en bas de l'interface utilisateur.
 * Diffuse le flux HLS assigné à la ville de l'utilisateur.
 * Toujours visible, peut être réduit/agrandi.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Play, Pause, VolumeX, Volume2, ChevronUp, ChevronDown,
  Radio, QrCode, X,
} from "lucide-react";
import { useLocation } from "wouter";

// Fallback playlist when no flux is configured
const FALLBACK_ITEMS = [
  { id: "f1", type: "ad",   title: "AdGame — Jouez et gagnez !",  subtitle: "Participez aux jeux de nos partenaires",  bg: "from-blue-600 to-indigo-700" },
  { id: "f2", type: "game", title: "🎲 iPhone 15 à gagner",        subtitle: "Scannez le QR code pour participer",      bg: "from-purple-600 to-pink-600", gameId: 1 },
  { id: "f3", type: "ad",   title: "🍽️ Restaurant Délice",         subtitle: "-20% sur plats à emporter",              bg: "from-orange-500 to-red-600" },
];

export function MiniPlayer() {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Get active games and ads for the playlist
  const { data: games } = trpc.games.listActive.useQuery({ limit: 3 });
  const { data: offers } = trpc.offers.listActive.useQuery({ cityId: undefined });

  // Build playlist from real data
  const playlist = useMemo(() => {
    const items: any[] = [];
    (games as any[])?.forEach(g => items.push({
      id: `game-${g.id}`, type: "game",
      title: `🎲 ${g.title}`,
      subtitle: `${g.totalParticipations} participants · Participez maintenant !`,
      bg: "from-blue-600 to-indigo-700",
      gameId: g.id,
      duration: 12,
    }));
    (offers as any[])?.slice(0, 2).forEach(o => items.push({
      id: `offer-${o.id}`, type: "ad",
      title: `🏷️ ${o.title}`,
      subtitle: `Code : ${o.promoCode}`,
      bg: "from-purple-600 to-pink-600",
      duration: 8,
    }));
    return items.length > 0 ? items : FALLBACK_ITEMS;
  }, [games, offers]);

  const current = playlist[idx % playlist.length];

  // Auto-advance
  useEffect(() => {
    if (!playing) return;
    const duration = current?.duration ?? 10;
    const tick = 150;
    const inc = 100 / (duration * (1000 / tick));
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setIdx(i => (i + 1) % playlist.length);
          setProgress(0);
          setShowQr(false);
          return 0;
        }
        if (p >= 65 && current?.type === "game") setShowQr(true);
        return p + inc;
      });
    }, tick);
    return () => clearInterval(timer);
  }, [playing, current, playlist.length]);

  if (!visible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${collapsed ? "h-10" : "h-24 md:h-20"}`}
      style={{ boxShadow: "0 -2px 20px rgba(0,0,0,0.15)" }}>

      {/* Collapsed bar */}
      {collapsed ? (
        <div className={`h-full bg-gradient-to-r ${current.bg} flex items-center px-4 gap-3 cursor-pointer`}
          onClick={() => setCollapsed(false)}>
          <Radio className="h-4 w-4 text-white animate-pulse shrink-0" />
          <span className="text-white text-sm font-semibold flex-1 truncate">{current.title}</span>
          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); setPlaying(!playing); }} className="text-white/80 hover:text-white">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <ChevronUp className="h-4 w-4 text-white/80" />
          </div>
        </div>
      ) : (
        /* Expanded player */
        <div className={`h-full bg-gradient-to-r ${current.bg} flex items-center gap-3 px-4 relative overflow-hidden`}>
          {/* Background subtle animation */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-10 w-20 h-20 bg-white dark:bg-gray-900 rounded-full blur-2xl" />
            <div className="absolute bottom-2 right-20 w-16 h-16 bg-white dark:bg-gray-900 rounded-full blur-2xl" />
          </div>

          {/* Live badge */}
          <div className="absolute top-2 left-4 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Live</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 mt-3 md:mt-0 relative z-10">
            <p className="text-white font-bold text-sm md:text-base truncate">{current.title}</p>
            <p className="text-white/80 text-xs truncate">{current.subtitle}</p>
          </div>

          {/* QR code (shows for games) */}
          {showQr && current.type === "game" && (
            <div
              className="bg-white dark:bg-gray-900 rounded-xl p-2 cursor-pointer hover:scale-105 transition-transform shrink-0 relative z-10"
              onClick={() => current.gameId && setLocation(`/wheel/${current.gameId}`)}
            >
              <div className="w-12 h-12 grid grid-cols-6 gap-0.5">
                {Array.from({ length: 36 }, (_, i) => {
                  const corners = new Set([0,1,6,7, 4,5,10,11, 24,25,30,31]);
                  return <div key={i} className={`rounded-[1px] ${corners.has(i) || (i % 3 === 0 && i % 5 !== 0) ? "bg-black" : "bg-white"}`} />;
                })}
              </div>
              <p className="text-[8px] text-center text-gray-600 dark:text-gray-300 mt-0.5 font-bold">SCANNER</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0 relative z-10">
            <button onClick={() => setPlaying(!playing)} className="text-white/90 hover:text-white hover:scale-110 transition-all">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={() => setMuted(!muted)} className="text-white/70 hover:text-white transition-colors">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={() => setCollapsed(true)} className="text-white/70 hover:text-white transition-colors ml-1">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button onClick={() => setVisible(false)} className="text-white/50 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div className="h-full bg-white dark:bg-gray-900/60 transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default MiniPlayer;
