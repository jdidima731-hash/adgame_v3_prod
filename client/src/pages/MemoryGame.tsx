import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { BrainCircuit, RefreshCw, Trophy, Clock, Star } from "lucide-react";

const EMOJIS = ["🎮","🏆","🎁","🌟","🎯","💎","🎪","🍕"];
function makeCards() {
  const cards = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export default function MemoryGame() {
  const [, setLocation] = useLocation();
  const [cards, setCards] = useState(makeCards);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (!running || won) return;
    const t = setInterval(() => setTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, won]);

  const matched = cards.filter(c => c.matched).length / 2;

  useEffect(() => {
    if (matched === EMOJIS.length && running) setWon(true);
  }, [matched, running]);

  const flip = useCallback((id: number) => {
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || flipped.length === 2) return;
    if (!running) setRunning(true);

    const newFlipped = [...flipped, id];
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped.map(fid => cards.find(c => c.id === fid)!);
      if (a.emoji === b.emoji) {
        setCards(cs => cs.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
        setFlipped([]);
      } else {
        setTimeout(() => {
          setCards(cs => cs.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 900);
      }
    }
  }, [cards, flipped, running]);

  const reset = () => {
    setCards(makeCards());
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
  };

  const stars = moves <= 12 ? 3 : moves <= 20 ? 2 : 1;

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-purple-600" />Memory Game</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Clock className="h-4 w-4" />{time}s</span>
            <Badge variant="outline">{moves} coups</Badge>
            <Badge className="bg-purple-100 text-purple-700">{matched}/{EMOJIS.length} paires</Badge>
          </div>
        </div>

        {won ? (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6 text-center space-y-3">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
              <h2 className="text-xl font-bold">Bravo ! Partie terminée !</h2>
              <div className="flex justify-center gap-1">
                {[1,2,3].map(s => <Star key={s} className={`h-8 w-8 ${s <= stars ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{moves} coups · {time} secondes</p>
              <Badge className="bg-green-100 text-green-800 text-sm">🎁 Récompense débloquée !</Badge>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>Accueil</Button>
                <Button onClick={reset} className="gap-2"><RefreshCw className="h-4 w-4" />Rejouer</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {cards.map(card => (
                <button key={card.id} onClick={() => flip(card.id)}
                  className={`aspect-square rounded-xl text-2xl flex items-center justify-center font-bold transition-all duration-300 select-none
                    ${card.matched ? "bg-green-100 border-2 border-green-400 scale-95" :
                      card.flipped ? "bg-blue-100 border-2 border-blue-400 scale-105" :
                      "bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 hover:scale-105 shadow-md"}`}>
                  {(card.flipped || card.matched) ? card.emoji : "❓"}
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={reset}>
              <RefreshCw className="h-4 w-4" />Nouvelle partie
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
