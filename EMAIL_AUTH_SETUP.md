# Gmail OTP Authentication Setup

## Overview
FinAi now uses Gmail addresses plus one-time passcodes (OTP) for login and logout. Each sign-in request sends a short-lived code directly to the requested Gmail inbox, minimizing the attack surface and eliminating passwords entirely.

## User Flow

1. **Request OTP** (`POST /api/auth/request-otp`)
   - User enters their Gmail address on the login page.
   - Server emits a 6-digit code to the inbox (via Resend) and keeps it (hashed) for verification.
   - UI transitions to the “verify code” step and optionally surfaces a demo code when email delivery is unavailable.

2. **Verify OTP** (`POST /api/auth/verify-otp`)
   - User submits the 6-digit code received from Gmail.
   - Server checks the latest OTP record, guards against reuse/rate limits, upserts the user record, and returns a session token plus user payload.
   - Frontend stores the session token locally and unlocks the dashboard.

3. **Logout** (`POST /api/auth/logout`)
   - Client calls the logout endpoint with the bearer token.
   - Server removes the session row so the same token cannot be reused.
   - Client clears the user/token from local storage and navigates to the marketing site.

## Technical Details

### Backend Routes

```
POST /api/auth/request-otp
- Body: { email }
- Response: { message, email, demoMode?: boolean, demoCode?: string }

POST /api/auth/verify-otp
- Body: { email, code }
- Response: { token, expiresAt, user: { id, email } }

POST /api/auth/logout
- Headers: Authorization: Bearer <token>
- Response: { message }
```

### Database Tables

1. `users` – stores Gmail addresses and metadata (`provider`, `is_active`, timestamps).
2. `otp_codes` – stores hashed OTPs, attempt counters, expiry timestamps, and a `used` flag.
3. `auth_sessions` – keeps bearer token hashes per user with expiration.

`initializeDatabase` seeds/adjusts the schema at startup, and helper migrations drop the deprecated verification tables.

### Client Integration

- `GmailOtpAuthProvider` wraps the app and exposes `useGmailOtpAuth`.
- Call `requestOtp(email)` to trigger the email.
- Use `verifyOtp(email, code)` to complete login and capture the token.
- `logout()` clears state and informs the backend.
- The `/login` route now renders `client/pages/Login.tsx`, which owns the Gmail + OTP UX.

### Testing

1. Start the app (`pnpm dev`).
2. Navigate to `/login`, input a Gmail address, and send the OTP.
3. Check your inbox or use the demo code shown on the page.
4. Enter the 6-digit code to land on `/dashboard`.
5. Click Logout to confirm the session is invalidated.

If Resend is not configured, the server returns `demoCode` so you can progress without email delivery.

## Notes

- Only Gmail accounts (`@gmail.com` or `@googlemail.com`) are accepted right now.
- OTPs expire after 5 minutes and are limited to 5 verification attempts per code plus a short resend cooldown.
- Sessions live for 24 hours and are revoked on logout by deleting the matching `auth_sessions` row.
