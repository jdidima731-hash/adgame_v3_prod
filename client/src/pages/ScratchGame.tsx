import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoute, useLocation } from "wouter";
import { Gift, RefreshCw, Trophy, ChevronRight } from "lucide-react";

const PRIZES = ["🎁 -20% chez Délice", "😔 Perdu", "🎉 Bon 50 DT", "😔 Perdu", "🏆 iPhone 15 !", "😔 Perdu"];

export default function ScratchGame() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratched, setScratched] = useState(false);
  const [prize] = useState(() => PRIZES[Math.floor(Math.random() * PRIZES.length)]);
  const [scratchPct, setScratchPct] = useState(0);
  const isDrawing = useRef(false);

  const won = !prize.includes("Perdu");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.fillText("Grattez ici !", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "13px Arial";
    ctx.fillText("🪙 🪙 🪙", canvas.width / 2, canvas.height / 2 + 16);
  }, []);

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || scratched) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x: number, y: number;
    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Check scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    const pct = Math.round((cleared / (canvas.width * canvas.height)) * 100);
    setScratchPct(pct);
    if (pct > 60) setScratched(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-sm mx-auto space-y-6 pt-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 justify-center"><Gift className="h-6 w-6 text-purple-600" />Carte à gratter</h1>

        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {/* Prize reveal under scratch */}
            <div className="relative rounded-xl overflow-hidden" style={{ height: 180 }}>
              <div className={`absolute inset-0 flex items-center justify-center rounded-xl transition-all ${won ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300" : "bg-gray-50"}`}>
                <div className="text-center">
                  <p className="text-2xl font-black">{prize}</p>
                  {won && <Badge className="mt-2 bg-yellow-100 text-yellow-800">🎊 Vous avez gagné !</Badge>}
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={320}
                height={180}
                className={`absolute inset-0 w-full h-full cursor-pointer touch-none transition-opacity ${scratched ? "opacity-0 pointer-events-none" : ""}`}
                onMouseDown={() => { isDrawing.current = true; }}
                onMouseUp={() => { isDrawing.current = false; }}
                onMouseMove={e => { if (isDrawing.current) scratch(e); }}
                onTouchStart={scratch}
                onTouchMove={scratch}
              />
            </div>

            {!scratched && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Grattez la carte pour découvrir votre lot</p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${scratchPct}%` }} />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{scratchPct}% gratté</p>
              </div>
            )}

            {scratched && (
              <div className={`text-center p-3 rounded-lg ${won ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}>
                <Trophy className={`h-6 w-6 mx-auto mb-1 ${won ? "text-yellow-500" : "text-gray-400"}`} />
                <p className="font-bold text-sm">{won ? "Récupérez votre lot !" : "Pas de chance cette fois !"}</p>
                {won && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Montrez ce message en caisse</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => setLocation("/dashboard")}>
            <ChevronRight className="h-4 w-4" />Accueil
          </Button>
          <Button className="flex-1 gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />Nouvelle carte
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
