import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface GmailInvoice {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  date: string;
  fileName: string;
  filePath: string;
  amount?: number;
  category?: string;
}

interface GmailAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
}

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "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";
const REDIRECT_URI = `${window.location.origin}/auth/gmail/callback`;

export function useGmail() {
  const [authState, setAuthState] = useState<GmailAuthState>(() => {
    const stored = localStorage.getItem("gmail_auth");
    return stored ? JSON.parse(stored) : { isAuthenticated: false, accessToken: null, userEmail: null };
  });

  const [invoices, setInvoices] = useState<GmailInvoice[]>(() => {
    const stored = localStorage.getItem("gmail_invoices");
    return stored ? JSON.parse(stored) : [];
  });

  const [isLoading, setIsLoading] = useState(false);

  const initiateLogin = useCallback(() => {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", GMAIL_SCOPES.join(" "));
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");

    window.location.href = authUrl.toString();
  }, []);

  const handleAuthCallback = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/gmail/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
      });

      if (!response.ok) throw new Error("Authentication failed");

      const data = await response.json();
      const newAuthState = {
        isAuthenticated: true,
        accessToken: data.accessToken,
        userEmail: data.userEmail,
      };

      setAuthState(newAuthState);
      localStorage.setItem("gmail_auth", JSON.stringify(newAuthState));
      toast.success("Gmail connected successfully!");
      return true;
    } catch (error) {
      toast.error("Failed to authenticate with Gmail", {
        description: String(error),
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    if (!authState.accessToken) {
      toast.error("Not authenticated with Gmail");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/gmail/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: authState.accessToken }),
      });

      if (!response.ok) throw new Error("Failed to fetch invoices");

      const data = await response.json();
      setInvoices(data.invoices);
      localStorage.setItem("gmail_invoices", JSON.stringify(data.invoices));

      toast.success(`Found ${data.invoices.length} invoice(s)`);
      return data.invoices;
    } catch (error) {
      toast.error("Failed to fetch invoices", {
        description: String(error),
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [authState.accessToken]);

  const logout = useCallback(() => {
    setAuthState({ isAuthenticated: false, accessToken: null, userEmail: null });
    setInvoices([]);
    localStorage.removeItem("gmail_auth");
    localStorage.removeItem("gmail_invoices");
    toast.success("Gmail disconnected");
  }, []);

  const downloadInvoice = useCallback(async (invoice: GmailInvoice) => {
    try {
      const response = await fetch(`/api/gmail/download/${invoice.messageId}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` },
      });

      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoice.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Invoice downloaded");
    } catch (error) {
      toast.error("Failed to download invoice", {
        description: String(error),
      });
    }
  }, [authState.accessToken]);

  return {
    authState,
    invoices,
    isLoading,
    initiateLogin,
    handleAuthCallback,
    fetchInvoices,
    logout,
    downloadInvoice,
  };
}
