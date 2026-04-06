import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { query } from "../db";

const OTP_CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT = 5; // max requests per 5 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.AUTH_FROM_EMAIL || "noreply@finai.com";

const RequestOtpSchema = z.object({
  email: z.string().email(),
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isGmailAddress = (email: string) =>
  email.endsWith("@gmail.com") || email.endsWith("@googlemail.com");

const hashValue = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = () => crypto.randomBytes(32).toString("hex");

async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  console.log(`[OTP] Sending code ${code} to ${email}`);

  if (!RESEND_API_KEY) {
    console.warn("[OTP] RESEND_API_KEY not configured, skipping SMTP call");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Your FinAi login code",
        html: `
          <h2>Your FinAi login code</h2>
          <p>Use the code below to complete sign in:</p>
          <h1 style="font-size: 32px; font-weight: bold;">${code}</h1>
          <p>This code expires in 5 minutes.</p>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[OTP] Resend error:", body);
      return false;
    }

    console.log("[OTP] Email queued successfully");
    return true;
  } catch (error) {
    console.error("[OTP] Failed to send email:", error);
    return false;
  }
}

export async function handleRequestOtp(req: Request, res: Response) {
  try {
    const { email } = RequestOtpSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    if (!isGmailAddress(normalizedEmail)) {
      return res.status(400).json({ message: "Only Gmail addresses can sign in for now." });
    }

    const recent = await query(
      `
        SELECT COUNT(*) AS count
        FROM otp_codes
        WHERE email = $1
        AND created_at > NOW() - INTERVAL '5 minutes'
      `,
      [normalizedEmail]
    );

    if (Number(recent.rows[0]?.count || 0) >= OTP_RATE_LIMIT) {
      return res.status(429).json({ message: "Too many OTP requests. Please wait a few minutes." });
    }

    const code = generateOtpCode();
    const hashed = hashValue(code);
    const expiresAt = Date.now() + OTP_CODE_EXPIRY_MS;

    await query(
      `
        INSERT INTO otp_codes (email, code_hash, expires_at, attempts, used)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [normalizedEmail, hashed, expiresAt, 0, false]
    );

    const emailSent = await sendOtpEmail(normalizedEmail, code);
    const payload: Record<string, unknown> = { message: "OTP issued", email: normalizedEmail };
    if (!emailSent) {
      payload.demoMode = true;
      payload.demoCode = code;
    }

    res.json(payload);
  } catch (error) {
    console.error("[OTP] Request error:", error);
    res.status(400).json({ message: String(error) });
  }
}

export async function handleVerifyOtp(req: Request, res: Response) {
  try {
    const { email, code } = VerifyOtpSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    const result = await query(
      `
        SELECT id, code_hash, expires_at, attempts, used
        FROM otp_codes
        WHERE email = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No OTP found for that email." });
    }

    const otpEntry = result.rows[0];

    if (otpEntry.used) {
      return res.status(400).json({ message: "OTP already consumed. Request a new code." });
    }

    if (otpEntry.expires_at < Date.now()) {
      await query("UPDATE otp_codes SET used = TRUE WHERE id = $1", [otpEntry.id]);
      return res.status(400).json({ message: "OTP expired. Request another one." });
    }

    if (otpEntry.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many failed attempts. Try again later." });
    }

    const hashedCode = hashValue(code);
    if (hashedCode !== otpEntry.code_hash) {
      await query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1", [otpEntry.id]);
      return res.status(401).json({ message: "Invalid code. Please try again." });
    }

    await query("UPDATE otp_codes SET used = TRUE WHERE id = $1", [otpEntry.id]);

    const existingUser = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    let userId: string;
    if (existingUser.rows.length === 0) {
      userId = crypto.randomBytes(16).toString("hex");
      await query(
        "INSERT INTO users (id, email, provider, is_active) VALUES ($1, $2, 'gmail-otp', TRUE)",
        [userId, normalizedEmail]
      );
    } else {
      userId = existingUser.rows[0].id;
      await query(
        "UPDATE users SET updated_at = CURRENT_TIMESTAMP, is_active = TRUE WHERE id = $1",
        [userId]
      );
    }

    const token = generateToken();
    const tokenHash = hashValue(token);
    const expiresAt = Date.now() + SESSION_TTL_MS;

    await query(
      `
        INSERT INTO auth_sessions (token_hash, user_id, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (token_hash)
        DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at
      `,
      [tokenHash, userId, expiresAt]
    );

    res.json({
      token,
      expiresAt,
      user: {
        id: userId,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("[OTP] Verify error:", error);
    res.status(400).json({ message: String(error) });
  }
}

export async function handleLogout(req: Request, res: Response) {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const token = tokenHeader.replace("Bearer", "").trim();
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const tokenHash = hashValue(token);
    await query("DELETE FROM auth_sessions WHERE token_hash = $1", [tokenHash]);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[OTP] Logout error:", error);
    res.status(400).json({ message: String(error) });
  }
}
