import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Gamepad2, Zap, TrendingUp, Users } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">AdGame</div>
          <div className="space-x-4">
            {user ? (
              <>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  variant="outline"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => setLocation("/ads")}
                  variant="default"
                >
                  Voir les pubs
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                >
                  Se connecter
                </Button>
                <Button
                  onClick={() => setLocation("/register")}
                  variant="default"
                >
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Gagnez de l'argent en regardant des publicités
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Découvrez AdGame, la plateforme où vous pouvez regarder des publicités intéressantes,
          jouer à des jeux amusants et gagner des récompenses réelles.
        </p>
        {!user && (
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="text-lg"
            >
              Commencer maintenant
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              size="lg"
              variant="outline"
              className="text-lg"
            >
              Se connecter
            </Button>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Pourquoi AdGame ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle>Facile et rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Regardez des publicités en quelques minutes et gagnez des récompenses instantanément.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Gamepad2 className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle>Jeux amusants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Participez à des jeux interactifs comme la roue de la fortune et des quiz.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle>Gains réels</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Gagnez de l'argent réel en accomplissant des tâches simples et amusantes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Communauté</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Rejoignez une communauté de milliers d'utilisateurs qui gagnent chaque jour.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Prêt à commencer ?</h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez AdGame dès maintenant et commencez à gagner des récompenses.
          </p>
          {!user && (
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-lg"
            >
              S'inscrire gratuitement
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 dark:text-gray-500 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2026 AdGame. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
