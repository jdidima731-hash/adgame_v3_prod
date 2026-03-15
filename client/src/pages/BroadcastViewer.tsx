import { useState, useEffect, useMemo } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Play, Pause, Volume2, VolumeX, Radio, QrCode, ChevronRight, ChevronLeft, Wifi, Loader2 } from "lucide-react";

function buildPlaylist(games: any[], ads: any[]) {
  const items: any[] = [];
  games.forEach(g => items.push({
    id: `game-${g.id}`, type: "game",
    title: `🎲 ${g.title}`,
    subtitle: `${g.totalParticipations} participants · Tirage le ${new Date(g.endDate).toLocaleDateString("fr-FR")}`,
    sponsor: "AdGame",
    duration: 15,
    bg: "from-blue-600 to-indigo-700",
    gameId: g.id,
    streamUrl: g.videoUrl,
  }));
  ads.forEach(a => items.push({
    id: `ad-${a.id}`, type: "ad",
    title: `📺 ${a.title}`,
    subtitle: a.description,
    sponsor: "Annonceur",
    duration: a.duration ?? 30,
    bg: "from-orange-500 to-red-600",
    streamUrl: a.videoUrl,
  }));
  // Interleave: game, ad, game, ad...
  const result: any[] = [];
  const maxLen = Math.max(games.length, ads.length);
  for (let i = 0; i < maxLen; i++) {
    if (items[i]) result.push(items[i]);
    if (items[games.length + i]) result.push(items[games.length + i]);
  }
  return result.length > 0 ? result : FALLBACK_PLAYLIST;
}

const FALLBACK_PLAYLIST = [
  { id: "f1", type: "game", title: "🎲 iPhone 15 à gagner", subtitle: "Scannez le QR code pour participer", sponsor: "Restaurant Délice", duration: 15, bg: "from-blue-600 to-indigo-700", gameId: 1 },
  { id: "f2", type: "ad",   title: "🍽️ Restaurant Délice",  subtitle: "-20% sur plats à emporter · Jusqu'au 30 avril", sponsor: "Restaurant Délice", duration: 30, bg: "from-orange-500 to-red-600" },
  { id: "f3", type: "game", title: "🎁 Bons d'achat 100 DT", subtitle: "847 participants · Encore 5 jours !", sponsor: "Coiffure Linda", duration: 15, bg: "from-purple-600 to-pink-600", gameId: 2 },
  { id: "f4", type: "ad",   title: "✂️ Coiffure Linda",     subtitle: "1 coupe offerte pour 2 achetées", sponsor: "Coiffure Linda", duration: 30, bg: "from-green-500 to-teal-600" },
];

export default function BroadcastViewer() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Stable QR pattern — generated once, never re-randomised on re-render
  const qrPattern = useMemo(() => {
    const corners = new Set([0,1,7,8, 5,6,12,13, 35,36,42,43]);
    return Array.from({ length: 49 }, (_, i) => corners.has(i) || Math.random() > 0.55);
  }, []);
  const { data: games } = trpc.games.listActive.useQuery({ limit: 5 });
  const { data: ads } = trpc.ads.list.useQuery({ limit: 5, offset: 0 });

  const playlist = buildPlaylist((games as any[]) ?? [], (ads as any[]) ?? []);
  const current = playlist[currentIdx % playlist.length];

  useEffect(() => {
    if (!playing || !current) return;
    const tick = 100;
    const increment = 100 / (current.duration * (1000 / tick));
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setCurrentIdx(i => (i + 1) % playlist.length);
          setProgress(0);
          setShowQr(false);
          return 0;
        }
        if (p >= 70 && current.type === "game") setShowQr(true);
        return p + increment;
      });
    }, tick);
    return () => clearInterval(interval);
  }, [playing, current?.id, current?.duration, current?.type, playlist.length]);

  const prev = () => { setCurrentIdx(i => (i - 1 + playlist.length) % playlist.length); setProgress(0); setShowQr(false); };
  const next = () => { setCurrentIdx(i => (i + 1) % playlist.length); setProgress(0); setShowQr(false); };

  if (!current) return (
    <DashboardLayout>
      <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Radio className="h-5 w-5 text-blue-600" /> Lecteur de diffusion
          </h1>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
              EN DIRECT
            </Badge>
            <Badge variant="outline" className="text-xs">
              {playlist.length} éléments
            </Badge>
          </div>
        </div>

        {/* Player */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "16/9" }}>
          {/* Real video player if stream URL exists, else animated card */}
          {current.streamUrl ? (
            <VideoPlayer
              src={current.streamUrl}
              autoPlay={playing}
              muted={muted}
              loop={false}
              className="w-full h-full"
              controls={false}
              onEnded={next}
            />
          ) : null}
          {/* Overlay content (always shown, semi-transparent if video) */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-gradient-to-br ${current.bg} ${current.streamUrl ? "bg-opacity-60" : "bg-opacity-100"}`}>
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              {current.type === "game" ? "🎮 JEU INTERACTIF" : "📺 PUBLICITÉ"}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-lg mb-3">
              {current.title}
            </h2>
            <p className="text-base md:text-lg text-white/85 max-w-md drop-shadow">
              {current.subtitle}
            </p>
            <div className="mt-4">
              <Badge className="bg-white/15 text-white border-white/20 text-sm px-4 py-1.5">
                {current.sponsor}
              </Badge>
            </div>
          </div>

          {/* QR code overlay for games */}
          {showQr && current.type === "game" && (
            <div className="absolute bottom-4 right-4 bg-white rounded-2xl p-3 shadow-xl">
              <div className="w-20 h-20 grid grid-cols-7 gap-0.5">
                {qrPattern.map((filled, i) => (
                  <div key={i} className={`rounded-[1px] ${filled ? "bg-black" : "bg-white"}`} />
                ))}
              </div>
              <p className="text-[10px] text-center text-gray-600 dark:text-gray-300 mt-1.5 font-semibold">SCANNER</p>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-black/30 text-white border-0 text-xs">
              {current.duration}s
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={prev} className="h-9 w-9 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setPlaying(!playing)} className={`flex-1 gap-2 h-9 ${playing ? "bg-gray-800 hover:bg-gray-900" : "bg-blue-600 hover:bg-blue-700"}`}>
            {playing ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Lire</>}
          </Button>
          <Button size="sm" variant="outline" onClick={next} className="h-9 w-9 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMuted(!muted)} className="h-9 w-9 p-0">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Playlist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600" />
                Playlist en cours
              </span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                {currentIdx % playlist.length + 1} / {playlist.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-72 overflow-y-auto">
            {playlist.map((item, i) => {
              const realIdx = currentIdx % playlist.length;
              const isActive = i === realIdx;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentIdx(i); setProgress(0); setShowQr(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-blue-50 border-2 border-blue-200 shadow-sm"
                      : "hover:bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center text-white text-xs font-black shrink-0 shadow`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : ""}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.sponsor} · {item.duration}s</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[10px] px-1.5 ${
                      item.type === "game" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {item.type === "game" ? "Jeu" : "Pub"}
                    </Badge>
                    {isActive && playing && (
                      <span className="flex gap-0.5">
                        {[1,2,3].map(b => (
                          <span key={b} className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: `${8 + b * 4}px`, animationDelay: `${b * 0.15}s` }} />
                        ))}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
