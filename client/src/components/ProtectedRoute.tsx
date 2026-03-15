/**
 * Composant de protection des routes par rôle.
 * Redirige vers /login si non authentifié, ou vers /dashboard si rôle insuffisant.
 */
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Rôles autorisés à accéder à cette route. Si vide, tout utilisateur connecté est autorisé. */
  allowedRoles?: Array<"user" | "advertiser" | "admin" | "partner">;
  /** URL de redirection si non authentifié (défaut : /login) */
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!user) {
    return <Redirect to={redirectTo} />;
  }

  // Vérifier le rôle si des rôles sont spécifiés
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role as string;
    if (!allowedRoles.includes(userRole as any)) {
      // Rediriger vers le dashboard approprié selon le rôle
      if (userRole === "admin") return <Redirect to="/admin" />;
      if (userRole === "advertiser") return <Redirect to="/advertiser/dashboard" />;
      return <Redirect to="/dashboard" />;
    }
  }

  return <>{children}</>;
}
