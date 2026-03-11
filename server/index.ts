import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleOCR } from "./routes/ocr";
import { handleInsights } from "./routes/insights";
import {
  handleGmailAuth,
  handleGmailInvoices,
  handleDownloadInvoice,
} from "./routes/gmail";
import {
  handleSignup,
  handleLogin,
  handleVerifyEmail,
  handleResendVerification,
} from "./routes/email-auth";

export function createServer() {
  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/ocr", handleOCR);
  app.post("/api/insights", handleInsights);

  // Gmail routes
  app.post("/api/gmail/auth", handleGmailAuth);
  app.post("/api/gmail/invoices", handleGmailInvoices);
  app.get("/api/gmail/download/:messageId", handleDownloadInvoice);

  // Email auth routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/verify", handleVerifyEmail);
  app.post("/api/auth/resend-verification", handleResendVerification);

  return app;
}
