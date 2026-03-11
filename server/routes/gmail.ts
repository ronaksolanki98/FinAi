import { Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";

const GMAIL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GMAIL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "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";

const invoiceStorePath = path.join(process.cwd(), ".invoices");

// Ensure invoices directory exists
if (!fs.existsSync(invoiceStorePath)) {
  fs.mkdirSync(invoiceStorePath, { recursive: true });
}

const AuthRequestSchema = z.object({
  code: z.string(),
  redirectUri: z.string(),
});

const InvoiceFetchSchema = z.object({
  accessToken: z.string(),
});

// Exchange authorization code for access token
export async function handleGmailAuth(req: Request, res: Response) {
  try {
    const { code, redirectUri } = AuthRequestSchema.parse(req.body);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return res.status(401).json({ error: "Failed to exchange authorization code" });
    }

    const tokenData = await tokenResponse.json();

    // Get user email
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: "Failed to fetch user info" });
    }

    const userData = await userResponse.json();

    res.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      userEmail: userData.email,
    });
  } catch (error) {
    console.error("Gmail auth error:", error);
    res.status(400).json({ error: String(error) });
  }
}

// Fetch invoices from Gmail
export async function handleGmailInvoices(req: Request, res: Response) {
  try {
    const { accessToken } = InvoiceFetchSchema.parse(req.body);

    const query = 'filename:pdf (subject:"invoice" OR subject:"bill" OR subject:"receipt" OR from:"invoice")';

    const messagesResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error("Messages fetch failed:", error);
      return res.status(401).json({ error: "Failed to fetch emails" });
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.messages || [];

    const invoices = [];

    for (const message of messages.slice(0, 10)) {
      try {
        const fullMessage = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then((r) => r.json());

        const headers = fullMessage.payload.headers;
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "Unknown";
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
        const dateStr = headers.find((h: any) => h.name === "Date")?.value || new Date().toISOString();

        // Find PDF attachments
        const attachments = fullMessage.payload.parts?.filter((part: any) => part.filename && part.filename.endsWith(".pdf")) || [];

        for (const attachment of attachments) {
          const fileId = attachment.body.attachmentId;
          const fileName = attachment.filename;

          // Download attachment
          const attachmentResponse = await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}/attachments/${fileId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then((r) => r.json());

          if (attachmentResponse.data) {
            const base64Data = attachmentResponse.data.replace(/-/g, "+").replace(/_/g, "/");
            const binaryData = Buffer.from(base64Data, "base64");
            const storagePath = path.join(invoiceStorePath, `${Date.now()}_${fileName}`);
            fs.writeFileSync(storagePath, binaryData);

            invoices.push({
              id: `${message.id}_${fileId}`,
              messageId: message.id,
              from,
              subject,
              date: new Date(dateStr).toISOString().split("T")[0],
              fileName,
              filePath: storagePath,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    res.json({ invoices });
  } catch (error) {
    console.error("Gmail invoices error:", error);
    res.status(400).json({ error: String(error) });
  }
}

// Download invoice
export async function handleDownloadInvoice(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const invoicesFile = path.join(invoiceStorePath, "invoices.json");
    const invoices = fs.existsSync(invoicesFile) ? JSON.parse(fs.readFileSync(invoicesFile, "utf-8")) : [];
    const invoice = invoices.find((inv: any) => inv.messageId === messageId);

    if (!invoice || !fs.existsSync(invoice.filePath)) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const fileBuffer = fs.readFileSync(invoice.filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Download error:", error);
    res.status(400).json({ error: String(error) });
  }
}
