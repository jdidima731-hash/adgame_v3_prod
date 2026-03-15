import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CheckSquare2, CheckCircle2, BarChart2, Users } from "lucide-react";

const POLLS = [
  {
    id: 1,
    question: "Quel est votre plat préféré chez Restaurant Délice ?",
    sponsor: "Restaurant Délice",
    options: [
      { id: 1, label: "Couscous traditionnel", votes: 234 },
      { id: 2, label: "Tajine agneau", votes: 187 },
      { id: 3, label: "Brik à l'œuf", votes: 312 },
      { id: 4, label: "Maklouba", votes: 145 },
    ],
    reward: "Code -15% offert à tous les votants",
    totalVotes: 878,
  },
  {
    id: 2,
    question: "Quelle coupe souhaitez-vous voir chez Coiffure Linda ?",
    sponsor: "Coiffure Linda",
    options: [
      { id: 1, label: "Dégradé américain", votes: 156 },
      { id: 2, label: "Coupe classique", votes: 203 },
      { id: 3, label: "Undercut moderne", votes: 178 },
    ],
    reward: "Bon d'achat 20 DT tiré au sort",
    totalVotes: 537,
  },
];

export default function VoteGame() {
  const [, setLocation] = useLocation();
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleVote = (pollId: number, optionId: number) => {
    if (submitted[pollId]) return;
    setVotes(v => ({ ...v, [pollId]: optionId }));
  };

  const handleSubmit = (pollId: number) => {
    if (!votes[pollId]) return toast.error("Choisissez une option !");
    setSubmitted(s => ({ ...s, [pollId]: true }));
    toast.success("Vote enregistré ! 🎉");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare2 className="h-6 w-6 text-blue-600" />Votes & Sondages</h1>

        {POLLS.map(poll => {
          const myVote = votes[poll.id];
          const done = submitted[poll.id];
          const maxVotes = Math.max(...poll.options.map(o => o.votes));

          return (
            <Card key={poll.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base leading-snug">{poll.question}</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />{poll.totalVotes.toLocaleString()} votes · {poll.sponsor}
                    </p>
                  </div>
                  {done && <Badge className="bg-green-100 text-green-700 shrink-0">Voté ✓</Badge>}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-1">
                  <p className="text-xs text-blue-700">🎁 {poll.reward}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {poll.options.map(opt => {
                  const pct = Math.round((opt.votes / poll.totalVotes) * 100);
                  const isSelected = myVote === opt.id;
                  const isWinner = opt.votes === maxVotes;
                  return (
                    <button key={opt.id} onClick={() => handleVote(poll.id, opt.id)} disabled={done}
                      className={`w-full text-left rounded-lg border-2 p-3 transition-all ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"} ${done ? "cursor-default" : "cursor-pointer"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-400"}`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-sm font-medium">{opt.label}</span>
                          {done && isWinner && <Badge className="text-xs bg-yellow-100 text-yellow-700">En tête</Badge>}
                        </div>
                        {done && <span className="text-sm font-bold">{pct}%</span>}
                      </div>
                      {done && <Progress value={pct} className="h-1.5" />}
                    </button>
                  );
                })}
                {!done && (
                  <Button className="w-full mt-2" onClick={() => handleSubmit(poll.id)} disabled={!myVote}>
                    Voter <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {done && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />Votre vote a bien été enregistré
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
