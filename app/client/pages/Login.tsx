import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGmailOtpAuth } from "@/hooks/use-gmail-otp-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const {
    requestOtp,
    verifyOtp,
    pendingEmail,
    demoCode,
    isLoading,
    clearPendingSession,
  } = useGmailOtpAuth();
  const [email, setEmail] = useState(pendingEmail ?? "");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"request" | "verify">(pendingEmail ? "verify" : "request");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (pendingEmail) {
      setMode("verify");
      setEmail(pendingEmail);
    }
  }, [pendingEmail]);

  const handleBack = () => {
    clearPendingSession();
    setMode("request");
    setCode("");
    setCooldown(0);
    setEmail("");
    navigate("/");
  };

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await requestOtp(email);
      setCode("");
      setMode("verify");
      setCooldown(60);
    } catch {
      // error already shown inside hook
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetEmail = pendingEmail || email;
    if (!targetEmail) {
      toast.error("Please provide your Gmail address");
      return;
    }
    try {
      await verifyOtp(targetEmail, code);
      navigate("/dashboard");
    } catch {
      // handshake handled via hook
    }
  };

  const handleResend = async () => {
    const targetEmail = pendingEmail || email;
    if (!targetEmail) {
      toast.error("Provide your Gmail address first");
      return;
    }
    try {
      await requestOtp(targetEmail);
      setCooldown(60);
    } catch {
      // error handled above
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 px-0">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">Login with Gmail</span>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6" />
              Secure Sign In
            </CardTitle>
            <CardDescription>
              We send a one-time code to your Gmail inbox for each login.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={mode === "request" ? handleSendOtp : handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Gmail address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === "verify" || isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">Only Gmail accounts are supported for now.</p>
              </div>

              {mode === "verify" && (
                <div className="space-y-2">
                  <Label htmlFor="code">One-time code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.3em] font-mono"
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Code expires in 5 minutes. Didn&apos;t receive it? Use the resend button below.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {mode === "request" ? (
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Send OTP via Gmail"
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={code.length !== 6 || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Continue"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={handleResend}
                      disabled={cooldown > 0 || isLoading}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </Button>
                  </>
                )}
              </div>
            </form>

            {pendingEmail && (
              <p className="text-xs text-muted-foreground mt-4">
                Last OTP sent to <span className="font-medium">{pendingEmail}</span>
              </p>
            )}

            {demoCode && (
              <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">Demo Mode Code</p>
                <p className="font-mono text-lg tracking-[0.3em]">{demoCode}</p>
                <p className="text-xs text-amber-700">Use this code if email delivery fails.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
