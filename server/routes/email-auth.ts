import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { query } from "../db";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = "noreply@resend.dev";

interface StoredUser {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  console.log(`[Email Auth] Attempting to send verification code to ${email}`);
  console.log(`[Email Auth] Verification code: ${code}`);

  if (!RESEND_API_KEY) {
    console.error("[Email Auth] RESEND_API_KEY not set!");
    return false;
  }

  try {
    console.log("[Email Auth] Sending email via Resend API...");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Verify Your Email - FinAi",
        html: `
          <h2>Verify Your Email</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; font-weight: bold; color: #000;">${code}</h1>
          <p>This code expires in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Email Auth] Resend API error response:", errorText);
      console.error("[Email Auth] API response status:", response.status);

      if (response.status === 403) {
        console.log("[Email Auth] FALLBACK MODE: Domain not verified in Resend");
        console.log(`[Email Auth] Demo Mode - Use this code for testing: ${code}`);
        return true;
      }
      return false;
    }

    const result = await response.json();
    console.log("[Email Auth] Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("[Email Auth] Failed to send verification email:", error);
    return false;
  }
}

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const VerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const ResendSchema = z.object({
  email: z.string().email(),
});

export async function handleSignup(req: Request, res: Response) {
  try {
    const { email, password } = SignupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const userId = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password);
    const code = generateVerificationCode();

    // Insert user into database
    await query(
      "INSERT INTO users (id, email, password_hash, verified, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
      [userId, email, passwordHash, false]
    );

    // Insert verification code
    await query(
      "INSERT INTO verification_codes (email, code, expires_at, attempts) VALUES ($1, $2, $3, $4)",
      [email, code, Date.now() + 15 * 60 * 1000, 0]
    );

    const emailSent = await sendVerificationEmail(email, code);

    const response: any = {
      userId,
      message: emailSent
        ? "Signup successful. Verification email sent."
        : "Signup successful. Email sending failed - use demo mode code below.",
    };

    if (!emailSent) {
      response.demoCode = code;
      response.demoMode = true;
    }

    res.json(response);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ message: String(error) });
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const result = await query("SELECT id, email, password_hash, verified FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordHash = hashPassword(password);

    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      userId: user.id,
      email: user.email,
      verified: user.verified,
      message: user.verified ? "Login successful" : "Email not verified",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: String(error) });
  }
}

export async function handleVerifyEmail(req: Request, res: Response) {
  try {
    const { email, code } = VerifySchema.parse(req.body);

    // Get verification code from database
    const result = await query(
      "SELECT id, code, expires_at, attempts FROM verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No verification code found for this email" });
    }

    const verification = result.rows[0];

    if (verification.expires_at < Date.now()) {
      // Delete expired code
      await query("DELETE FROM verification_codes WHERE id = $1", [verification.id]);
      return res.status(400).json({ message: "Verification code expired" });
    }

    if (verification.attempts >= 5) {
      return res.status(429).json({ message: "Too many failed attempts. Request a new code." });
    }

    if (verification.code !== code) {
      // Increment attempts
      await query("UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1", [verification.id]);
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Check if user exists
    const userResult = await query("SELECT id FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Mark user as verified
    await query("UPDATE users SET verified = true, updated_at = NOW() WHERE id = $1", [user.id]);

    // Delete used verification code
    await query("DELETE FROM verification_codes WHERE id = $1", [verification.id]);

    res.json({ userId: user.id, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(400).json({ message: String(error) });
  }
}

export async function handleResendVerification(req: Request, res: Response) {
  try {
    const { email } = ResendSchema.parse(req.body);

    // Check if user exists
    const userResult = await query("SELECT id, verified FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const code = generateVerificationCode();

    // Delete old verification codes for this email
    await query("DELETE FROM verification_codes WHERE email = $1", [email]);

    // Insert new verification code
    await query(
      "INSERT INTO verification_codes (email, code, expires_at, attempts) VALUES ($1, $2, $3, $4)",
      [email, code, Date.now() + 15 * 60 * 1000, 0]
    );

    const emailSent = await sendVerificationEmail(email, code);

    const response: any = {
      message: emailSent ? "Verification email resent" : "Resend failed - use demo mode code",
    };

    if (!emailSent) {
      response.demoCode = code;
      response.demoMode = true;
    }

    res.json(response);
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(400).json({ message: String(error) });
  }
}
