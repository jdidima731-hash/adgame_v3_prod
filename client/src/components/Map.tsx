/**
 * MapView — OpenStreetMap via Leaflet
 * Uses leaflet from package.json (no CDN script injection needed).
 */
import { useEffect, useRef } from "react";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type?: "partner" | "game" | "user";
  onClick?: () => void;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
}

const ICON_HTML: Record<string, string> = {
  partner: '<div style="background:#7c3aed;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white">🏪</div>',
  game:    '<div style="background:#2563eb;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white">🎮</div>',
  user:    '<div style="background:#16a34a;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white">📍</div>',
};

function ensureLeafletCSS() {
  if (document.querySelector('link[data-leaflet]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.setAttribute("data-leaflet", "1");
  document.head.appendChild(link);
}

async function loadLeaflet() {
  ensureLeafletCSS();
  if ((window as any).L) return (window as any).L;
  return new Promise<any>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve((window as any).L);
    document.head.appendChild(s);
  });
}

export function MapView({ center = [36.8190, 10.1658], zoom = 13, markers = [], className = "" }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    markers.forEach(m => {
      const icon = L.divIcon({
        className: "",
        html: ICON_HTML[m.type ?? "partner"] ?? ICON_HTML.partner,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      marker.bindPopup(`<strong>${m.label}</strong>`);
      if (m.onClick) marker.on("click", m.onClick);
      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ minHeight: 260 }}
    />
  );
}

export default MapView;
