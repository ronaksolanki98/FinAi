import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  pendingEmail: string | null;
  demoCode: string | null;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearPendingSession: () => void;
}

const STORAGE_USER = "gmail_otp_user";
const STORAGE_TOKEN = "gmail_otp_token";
const STORAGE_PENDING_EMAIL = "gmail_otp_pending_email";
const STORAGE_DEMO_CODE = "gmail_otp_demo_code";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function GmailOtpAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_USER);
    const storedToken = localStorage.getItem(STORAGE_TOKEN);
    const storedPending = localStorage.getItem(STORAGE_PENDING_EMAIL);
    const storedDemo = localStorage.getItem(STORAGE_DEMO_CODE);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Unable to parse stored user:", error);
      }
    }
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedPending) {
      setPendingEmail(storedPending);
    }
    if (storedDemo) {
      setDemoCode(storedDemo);
    }
    setIsLoading(false);
  }, []);

  const persistPendingEmail = (email: string | null) => {
    if (email) {
      localStorage.setItem(STORAGE_PENDING_EMAIL, email);
    } else {
      localStorage.removeItem(STORAGE_PENDING_EMAIL);
    }
    setPendingEmail(email);
  };

  const persistDemoCode = (code: string | null) => {
    if (code) {
      localStorage.setItem(STORAGE_DEMO_CODE, code);
    } else {
      localStorage.removeItem(STORAGE_DEMO_CODE);
    }
    setDemoCode(code);
  };

  const clearPendingSession = () => {
    persistPendingEmail(null);
    persistDemoCode(null);
  };

  const requestOtp = async (email: string) => {
    setIsLoading(true);
    try {
      if (!email) {
        throw new Error("Please enter your Gmail address");
      }

      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to request OTP");
      }

      const normalizedEmail = (data.email as string) || email.trim().toLowerCase();
      persistPendingEmail(normalizedEmail);
      persistDemoCode((data as any).demoCode || null);

      toast.success("OTP sent! Check your Gmail inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP request failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      if (!email || !code) {
        throw new Error("Provide both your email and the 6-digit code");
      }

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      const nextUser: AuthUser = data.user;
      setUser(nextUser);
      setToken(data.token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
      localStorage.setItem(STORAGE_TOKEN, data.token);
      persistPendingEmail(null);
      persistDemoCode(null);

      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_TOKEN);
      persistPendingEmail(null);
      persistDemoCode(null);
      toast.success("Logged out");
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        pendingEmail,
        demoCode,
      requestOtp,
      verifyOtp,
      logout,
      clearPendingSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useGmailOtpAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useGmailOtpAuth must be used within GmailOtpAuthProvider");
  }
  return context;
}
