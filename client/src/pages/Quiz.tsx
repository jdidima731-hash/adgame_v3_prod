import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { HelpCircle, CheckCircle2, XCircle, Trophy, Clock, Star, ChevronRight, Loader2 } from "lucide-react";

// Questions générées dynamiquement selon l'annonceur
const QUESTION_BANKS: Record<string, any[]> = {
  default: [
    { id: 1, question: "Quelle est la capitale de la Tunisie ?",                    options: ["Sfax", "Tunis", "Sousse", "Bizerte"],      correct: 1, points: 10 },
    { id: 2, question: "En quelle année a été fondé AdGame ?",                       options: ["2022", "2024", "2026", "2020"],             correct: 2, points: 10 },
    { id: 3, question: "Combien de dinars tunisiens valent approximativement 1 € ?", options: ["2 DT", "3 DT", "4 DT", "5 DT"],            correct: 1, points: 10 },
    { id: 4, question: "Quel est le plat national tunisien ?",                       options: ["Tajine", "Couscous", "Harissa", "Brik"],    correct: 1, points: 10 },
    { id: 5, question: "Quelle ville tunisienne est surnommée la «ville de l'olivier» ?", options: ["Tunis", "Sfax", "Monastir", "Djerba"], correct: 1, points: 15 },
  ],
};

export default function Quiz() {
  const [, params] = useRoute("/quiz/:gameId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);

  const questions = QUESTION_BANKS.default;
  const q = questions[currentQ];
  const totalPoints = questions.reduce((acc, q) => acc + q.points, 0);

  // Countdown timer
  useEffect(() => {
    if (selected !== null || finished) return;
    if (timeLeft <= 0) {
      handleAnswer(-1); // auto-skip on timeout
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, finished]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.correct;
    const pts = correct ? q.points : 0;
    if (correct) setScore(s => s + pts);

    setTimeout(() => {
      const newAnswers = [...answers, correct];
      if (currentQ < questions.length - 1) {
        setAnswers(newAnswers);
        setCurrentQ(c => c + 1);
        setSelected(null);
        setTimeLeft(30);
      } else {
        setAnswers(newAnswers);
        setFinished(true);
      }
    }, 1200);
  };

  const correctCount = answers.filter(Boolean).length;
  const pct = Math.round((score / totalPoints) * 100);
  const won = pct >= 70;
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;

  const reset = () => {
    setCurrentQ(0); setAnswers([]); setSelected(null);
    setFinished(false); setTimeLeft(30); setScore(0);
  };

  // ── Results screen ──
  if (finished) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto pt-6 space-y-5 text-center">
          <div className="text-6xl">{won ? "🏆" : "😔"}</div>

          <Card className={won ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-white" : "border-gray-200"}>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-black">{won ? "Félicitations !" : "Dommage !"}</h2>

              <div className="flex justify-center gap-1.5">
                {[1,2,3].map(s => (
                  <Star key={s} className={`h-8 w-8 transition-all ${s <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Score</span>
                  <span className="font-black text-lg">{score} / {totalPoints} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Bonnes réponses</span>
                  <span className="font-bold text-green-600">{correctCount} / {questions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Résultat</span>
                  <span className={`font-bold ${won ? "text-green-600" : "text-red-500"}`}>{pct}%</span>
                </div>
              </div>

              {won && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-green-800">🎁 Récompense débloquée !</p>
                  <p className="text-xs text-green-600 mt-1">Code promo: <span className="font-mono font-bold">QUIZ{score}</span></p>
                </div>
              )}
              {!won && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Il faut 70% pour gagner une récompense. Réessayez !</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setLocation("/dashboard")}>
              Accueil
            </Button>
            <Button className="flex-1 gap-2" onClick={reset}>
              <ChevronRight className="h-4 w-4" /> Rejouer
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Quiz screen ──
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" /> Quiz
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" /> {score} pts
            </Badge>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold transition-colors ${
              timeLeft <= 10 ? "bg-red-50 border-red-300 text-red-600 animate-pulse" :
              timeLeft <= 20 ? "bg-yellow-50 border-yellow-300 text-yellow-700" :
              "bg-green-50 border-green-300 text-green-700"
            }`}>
              <Clock className="h-3.5 w-3.5" /> {timeLeft}s
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Question {currentQ + 1} sur {questions.length}</span>
            <span>{correctCount} bonne(s) réponse(s)</span>
          </div>
          <Progress value={((currentQ) / questions.length) * 100} className="h-2" />
        </div>

        {/* Question */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">
                {currentQ + 1}
              </div>
              <CardTitle className="text-base leading-snug font-semibold">{q.question}</CardTitle>
            </div>
            <Badge variant="outline" className="w-fit text-xs ml-11">+{q.points} pts</Badge>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {q.options.map((opt: string, idx: number) => {
              let style = "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
              let icon = null;
              if (selected !== null) {
                if (idx === q.correct) { style = "border-green-500 bg-green-50"; icon = <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />; }
                else if (idx === selected) { style = "border-red-400 bg-red-50"; icon = <XCircle className="h-4 w-4 text-red-500 ml-auto shrink-0" />; }
                else { style = "border-gray-100 opacity-50 cursor-default"; }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selected !== null}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${style}`}
                >
                  <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                    selected !== null && idx === q.correct ? "bg-green-500 border-green-500 text-white" :
                    selected !== null && idx === selected && selected !== q.correct ? "bg-red-400 border-red-400 text-white" :
                    "border-current"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium flex-1">{opt}</span>
                  {icon}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Timer bar */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${timeLeft <= 10 ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
