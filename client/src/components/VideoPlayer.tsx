/**
 * VideoPlayer — lecteur HLS réel via hls.js (chargé depuis CDN)
 * Supporte: HLS (.m3u8), MP4 direct, fallback poster
 */
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onEnded?: () => void;
  controls?: boolean;
  title?: string;
}

function loadHls(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).Hls) return resolve((window as any).Hls);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js";
    script.onload = () => resolve((window as any).Hls);
    document.head.appendChild(script);
  });
}

export function VideoPlayer({
  src, poster, autoPlay = false, muted = true, loop = false,
  className = "", onEnded, controls = true, title,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [vol, setVol] = useState(muted ? 0 : 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;
    setLoading(true);
    setError(false);

    const setup = async () => {
      if (src.includes(".m3u8")) {
        const Hls = await loadHls();
        if (Hls.isSupported()) {
          if (hlsRef.current) hlsRef.current.destroy();
          const hls = new Hls({ enableWorker: false });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            if (autoPlay) video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) setError(true);
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          video.src = src;
          video.addEventListener("loadedmetadata", () => setLoading(false));
        }
      } else {
        // Direct MP4/webm
        video.src = src;
        video.oncanplay = () => setLoading(false);
        video.onerror = () => setError(true);
        if (autoPlay) video.play().catch(() => {});
      }
    };

    setup();
    return () => { hlsRef.current?.destroy(); };
  }, [src, autoPlay]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = vol > 0 ? 0 : 1;
    v.volume = next;
    v.muted = next === 0;
    setVol(next);
  };

  const goFullscreen = () => videoRef.current?.requestFullscreen?.();

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden group ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={vol === 0}
        loop={loop}
        playsInline
        poster={poster}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      />

      {/* Loading spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
          <p className="text-sm">Flux indisponible</p>
          {src && <p className="text-xs opacity-50 font-mono px-4 text-center truncate max-w-full">{src}</p>}
        </div>
      )}

      {/* No source — placeholder */}
      {!src && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white gap-2">
          <Play className="h-10 w-10 opacity-30" />
          <p className="text-sm opacity-50">Aucun flux configuré</p>
        </div>
      )}

      {/* Controls overlay */}
      {controls && src && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {title && <span className="text-white text-xs font-medium flex-1 truncate">{title}</span>}
          <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform">
            {vol === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={goFullscreen} className="text-white hover:scale-110 transition-transform">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
