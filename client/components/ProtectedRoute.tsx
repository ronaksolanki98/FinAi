import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useEmailAuth } from "@/hooks/use-email-auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useEmailAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.verified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}
