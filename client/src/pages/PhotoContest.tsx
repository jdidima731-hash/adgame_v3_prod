import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, Upload, Heart, Trophy, Image, Send } from "lucide-react";

const DEMO_PHOTOS = [
  { id: 1, user: "Ahmed B.", caption: "Mon plat préféré au Délice 😍", likes: 47, img: "🍕" },
  { id: 2, user: "Leïla M.", caption: "Nouvelle coupe chez Linda ✂️", likes: 89, img: "💇" },
  { id: 3, user: "Sami K.", caption: "Top ambiance ce soir !", likes: 34, img: "🎉" },
];

export default function PhotoContest() {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [caption, setCaption] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleLike = (id: number) => setLiked(l => { const n = new Set(l); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!caption.trim()) return toast.error("Ajoutez une légende !");
    if (!preview) return toast.error("Ajoutez une photo !");
    setSubmitted(true);
    toast.success("Photo soumise ! En attente de validation.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Camera className="h-6 w-6 text-pink-600" />Concours Photo</h1>
          <Badge className="bg-pink-100 text-pink-700">🏆 Prix : iPhone 15</Badge>
        </div>

        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-orange-50">
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-pink-800">📸 Thème du mois : "Ma meilleure expérience client"</p>
            <p className="text-xs text-pink-600 mt-1">Partagez votre photo dans un de nos commerces partenaires. Les 3 photos les plus likées gagnent des prix !</p>
          </CardContent>
        </Card>

        {/* Formulaire de soumission */}
        {!submitted ? (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Soumettre ma photo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors"
                onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-cover" />
                ) : (
                  <>
                    <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour choisir une photo</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG — Max 10MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <Textarea placeholder="Décrivez votre expérience..." value={caption} onChange={e => setCaption(e.target.value)} rows={2} />
              <Button className="w-full bg-pink-600 hover:bg-pink-700 gap-2" onClick={handleSubmit}>
                <Send className="h-4 w-4" />Soumettre ma photo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50 text-center">
            <CardContent className="py-6">
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-bold text-green-800">Photo soumise avec succès !</p>
              <p className="text-xs text-green-600 mt-1">En attente de validation. Partagez pour obtenir plus de likes !</p>
            </CardContent>
          </Card>
        )}

        {/* Galerie des photos */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" />Top photos du moment</h2>
          <div className="space-y-3">
            {DEMO_PHOTOS.map((photo, idx) => (
              <Card key={photo.id} className={idx === 0 ? "border-yellow-300" : ""}>
                <CardContent className="py-3 flex items-center gap-4">
                  {idx === 0 && <span className="text-2xl">🥇</span>}
                  {idx === 1 && <span className="text-2xl">🥈</span>}
                  {idx === 2 && <span className="text-2xl">🥉</span>}
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl shrink-0">{photo.img}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{photo.user}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{photo.caption}</p>
                  </div>
                  <button onClick={() => toggleLike(photo.id)} className="flex flex-col items-center gap-0.5">
                    <Heart className={`h-5 w-5 transition-colors ${liked.has(photo.id) ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
                    <span className="text-xs font-medium">{photo.likes + (liked.has(photo.id) ? 1 : 0)}</span>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
