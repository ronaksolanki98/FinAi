import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useGmailOtpAuth } from "@/hooks/use-gmail-otp-auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useGmailOtpAuth();

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

  return children;
}
