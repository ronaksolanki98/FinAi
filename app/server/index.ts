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
  handleRequestOtp,
  handleVerifyOtp,
  handleLogout,
} from "./routes/otp-auth";

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

  // OTP authentication
  app.post("/api/auth/request-otp", handleRequestOtp);
  app.post("/api/auth/verify-otp", handleVerifyOtp);
  app.post("/api/auth/logout", handleLogout);

  return app;
}
