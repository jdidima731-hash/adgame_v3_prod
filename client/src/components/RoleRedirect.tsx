import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function RoleRedirect() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (user.role === "admin")      return <Redirect to="/admin" />;
  if (user.role === "advertiser") return <Redirect to="/advertiser/dashboard" />;
  if (user.role === "partner")    return <Redirect to="/partner/dashboard" />;
  return <Redirect to="/dashboard" />;
}
