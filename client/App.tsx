import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmailAuthProvider } from "./hooks/use-email-auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EmailLogin from "./pages/EmailLogin";
import EmailSignup from "./pages/EmailSignup";
import EmailVerification from "./pages/EmailVerification";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Insights from "./pages/Insights";
import Reminders from "./pages/Reminders";
import Budgets from "./pages/Budgets";
import CalendarPage from "./pages/Calendar";
import ExportPage from "./pages/Export";
import GmailCallback from "./pages/GmailCallback";
import GmailInvoices from "./pages/GmailInvoices";
import MainLayout from "@/components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <EmailAuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<EmailLogin />} />
            <Route path="/signup" element={<EmailSignup />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
            <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
            <Route path="/auth/gmail/callback" element={<GmailCallback />} />
            <Route path="/gmail-invoices" element={<ProtectedRoute><GmailInvoices /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </EmailAuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
