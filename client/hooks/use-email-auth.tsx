import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EmailAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("email_auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load user from storage:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      const newUser: User = {
        id: data.userId,
        email,
        verified: false,
      };
      setUser(newUser);
      localStorage.setItem("email_auth_user", JSON.stringify(newUser));
      localStorage.setItem("pending_verification_email", email);

      if (data.demoMode && data.demoCode) {
        localStorage.setItem("demo_verification_code", data.demoCode);
        toast.success("Demo mode: Check the verification page for code");
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error(String(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.verified) {
        const newUser: User = {
          id: data.userId,
          email,
          verified: false,
        };
        setUser(newUser);
        localStorage.setItem("email_auth_user", JSON.stringify(newUser));
        localStorage.setItem("pending_verification_email", email);
        toast.info("Please verify your email first");
        throw new Error("Email not verified");
      }

      const newUser: User = {
        id: data.userId,
        email,
        verified: true,
      };
      setUser(newUser);
      localStorage.setItem("email_auth_user", JSON.stringify(newUser));
      localStorage.removeItem("pending_verification_email");
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error(String(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      if (!code || code.length !== 6) {
        throw new Error("Verification code must be 6 digits");
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      const newUser: User = {
        id: data.userId,
        email,
        verified: true,
      };
      setUser(newUser);
      localStorage.setItem("email_auth_user", JSON.stringify(newUser));
      localStorage.removeItem("pending_verification_email");
      toast.success("Email verified successfully!");
    } catch (error) {
      toast.error(String(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification email");
      }

      if (data.demoMode && data.demoCode) {
        localStorage.setItem("demo_verification_code", data.demoCode);
        toast.success("Demo mode: Check the page for code");
      } else {
        toast.success("Verification email sent!");
      }
    } catch (error) {
      toast.error(String(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("email_auth_user");
    localStorage.removeItem("pending_verification_email");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, verifyEmail, logout, isLoading, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useEmailAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useEmailAuth must be used within EmailAuthProvider");
  }
  return context;
}
