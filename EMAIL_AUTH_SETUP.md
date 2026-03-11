# Email Authentication System Setup

## Overview
This app now uses email-based authentication with verification codes sent via Resend. Users can sign up, verify their email, and log in with email + password.

## Features Implemented

✅ **Email Registration** - Users can sign up with email and password
✅ **Email Verification** - 6-digit verification codes sent via Resend
✅ **Secure Login** - Email + password login with verification requirement
✅ **Resend Integration** - Verification emails via Resend API
✅ **Local Storage** - All user data stored locally (no external DB needed)
✅ **Session Management** - User sessions persist across page refreshes

## How It Works

### User Flow

1. **Sign Up** (`/signup`)
   - User enters email and password
   - Account created in local storage
   - Verification code sent via Resend
   - User redirected to `/verify-email`

2. **Verify Email** (`/verify-email`)
   - User enters 6-digit code from email
   - Code validated (6-digit, not expired, correct)
   - Email marked as verified
   - User redirected to `/dashboard`

3. **Login** (`/login`)
   - User enters email and password
   - Account validated
   - If verified: logged in successfully
   - If not verified: redirected to `/verify-email`

4. **Logout**
   - User session cleared from localStorage
   - Redirected to home page

## Technical Details

### Backend Routes

```
POST /api/auth/signup
- Body: { email, password }
- Response: { userId, message }

POST /api/auth/login
- Body: { email, password }
- Response: { userId, email, verified, message }

POST /api/auth/verify
- Body: { email, code }
- Response: { userId, message }

POST /api/auth/resend-verification
- Body: { email }
- Response: { message }
```

### Data Storage

Users and verification codes are stored in:
- `.auth-data/users.json` - User accounts with hashed passwords
- `.auth-data/verifications.json` - Active verification codes

These are local files created at runtime.

### Environment Variable

`RESEND_API_KEY` - Already set in your environment
- Used for sending verification emails
- Never expose this in client-side code

## Testing Locally

### Without Email
Since we're using Resend in development, verification codes are actually sent to your email. To test:

1. Go to `/signup`
2. Enter an email and password
3. Check that email inbox for verification code
4. Enter the 6-digit code on `/verify-email` page

### Testing with Demo Email
To test without checking real email, you can:
1. Check browser console after signup - verification code is logged
2. Use test email addresses (Resend allows free testing)

## Security Notes

- Passwords are hashed with SHA-256 before storage
- Verification codes expire after 15 minutes
- Failed verification attempts are limited to 5 per code
- Access tokens are stored in localStorage (for development)

## Migration from Old Auth

The old auth system (username-based) has been replaced. Old code using `useAuth` hook will fail. Use `useEmailAuth` instead:

### Old (Deprecated)
```typescript
import { useAuth } from "@/hooks/use-auth";
const { user, login, signup, logout } = useAuth();
```

### New
```typescript
import { useEmailAuth } from "@/hooks/use-email-auth";
const { user, login, signup, logout, verifyEmail } = useEmailAuth();
```

## Production Deployment

For production, consider:
1. Use proper database (Supabase, Neon, etc.) instead of local JSON files
2. Use environment variables for sensitive data
3. Add rate limiting on auth endpoints
4. Implement HTTPS-only cookie sessions
5. Add email address verification with tokens instead of codes

## File Structure

**New Files:**
- `client/hooks/use-email-auth.tsx` - Email auth hook
- `client/pages/EmailLogin.tsx` - Login page
- `client/pages/EmailSignup.tsx` - Signup page
- `client/pages/EmailVerification.tsx` - Email verification page
- `server/routes/email-auth.ts` - Backend auth routes

**Modified Files:**
- `client/App.tsx` - New routes and EmailAuthProvider
- `client/components/ProtectedRoute.tsx` - Email verification check
- `client/components/layout/MainLayout.tsx` - Email auth integration
- `server/index.ts` - Email auth routes registration
