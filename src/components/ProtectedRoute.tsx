import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LgpdConsentDialog from "@/components/LgpdConsentDialog";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [lgpdAccepted, setLgpdAccepted] = useState<boolean | null>(null);
  const [checkingLgpd, setCheckingLgpd] = useState(true);

  useEffect(() => {
    if (!user) { setCheckingLgpd(false); return; }
    supabase.from("profiles").select("lgpd_accepted_at").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setLgpdAccepted(!!(data as any)?.lgpd_accepted_at);
        setCheckingLgpd(false);
      });
  }, [user]);

  if (isLoading || checkingLgpd) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <Crown className="h-8 w-8 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (lgpdAccepted === false) {
    return (
      <>
        {children}
        <LgpdConsentDialog open={true} userId={user.id} onAccepted={() => setLgpdAccepted(true)} />
      </>
    );
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <Crown className="h-8 w-8 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/client" replace />;
  return <>{children}</>;
}
