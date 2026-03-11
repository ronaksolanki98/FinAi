import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGmail } from "@/hooks/use-gmail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";

export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useGmail();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/upload");
      return;
    }

    if (code) {
      handleAuthCallback(code).then((success) => {
        if (success) {
          setTimeout(() => navigate("/upload"), 1500);
        } else {
          navigate("/upload");
        }
      });
    }
  }, [searchParams, navigate, handleAuthCallback]);

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connecting to Gmail...</CardTitle>
          <CardDescription>Please wait while we authenticate your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Authenticating with Google</p>
        </CardContent>
      </Card>
    </div>
  );
}
