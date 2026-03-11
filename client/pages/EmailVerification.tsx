import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEmailAuth } from "@/hooks/use-email-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const { user, verifyEmail, resendVerificationEmail, isLoading } = useEmailAuth();
  const [code, setCode] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const email = localStorage.getItem("pending_verification_email");

  useEffect(() => {
    const storedDemoCode = localStorage.getItem("demo_verification_code");
    if (storedDemoCode) {
      setDemoCode(storedDemoCode);
    }
  }, []);

  useEffect(() => {
    if (!user || !email) {
      navigate("/login");
      return;
    }

    if (user.verified) {
      navigate("/dashboard");
    }
  }, [user, email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await verifyEmail(email, code);
      navigate("/dashboard");
    } catch (error) {
      // Error already shown in toast
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      setResendCooldown(60);
    } catch (error) {
      // Error already shown in toast
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6" />
              Verify Email
            </CardTitle>
            <CardDescription>
              We sent a verification code to <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isLoading}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>

            {demoCode && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-2">Demo Mode - Use this code:</p>
                <div className="flex items-center gap-2 bg-white dark:bg-amber-900 p-2 rounded font-mono text-lg font-bold tracking-widest">
                  <span>{demoCode}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(demoCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-amber-800 rounded"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Email Sending:</p>
              <p>If you don't receive an email, check spam folder or use the demo code above.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
