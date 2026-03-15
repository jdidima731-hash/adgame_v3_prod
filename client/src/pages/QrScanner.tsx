import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { QrCode, Camera, Link } from "lucide-react";

export default function QrScanner() {
  const [manualCode, setManualCode] = useState("");
  const [, setLocation] = useLocation();

  const handleManual = () => {
    if (!manualCode.trim()) return toast.error("Entrez un code ou un lien");
    // Extract game ID from URL or code
    const urlMatch = manualCode.match(/\/wheel\/(\d+)/);
    const numMatch = manualCode.match(/(\d+)$/);
    const gameId = urlMatch?.[1] ?? numMatch?.[1] ?? "1";
    toast.success(`QR Code scanné → Jeu #${gameId}`);
    setLocation(`/wheel/${gameId}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><QrCode className="h-6 w-6" />Scanner un QR Code</h1>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4 text-blue-600" />Caméra</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              <div className="relative z-10 text-center text-white space-y-3">
                <QrCode className="h-16 w-16 mx-auto opacity-30" />
                <p className="text-sm opacity-70">Caméra non disponible en mode web</p>
                <p className="text-xs opacity-50">Utilisez l'entrée manuelle ci-dessous</p>
              </div>
              {/* Scanner frame animation */}
              <div className="absolute inset-8 border-2 border-blue-400 rounded-lg opacity-50">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Link className="h-4 w-4 text-purple-600" />Entrée manuelle</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Collez un lien ou entrez un code..." value={manualCode} onChange={e => setManualCode(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManual()} />
            <Button className="w-full" onClick={handleManual}>Accéder au jeu</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[{ id: 1, title: "iPhone 15 à gagner", place: "Restaurant Délice" }, { id: 2, title: "Bons d'achat 100 DT", place: "Coiffure Linda" }].map(g => (
            <Card key={g.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/wheel/${g.id}`)}>
              <CardContent className="py-3 text-center">
                <QrCode className="h-8 w-8 mx-auto mb-1 text-blue-600" />
                <p className="text-xs font-medium">{g.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{g.place}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
