# Gmail Invoice Feature Setup Guide

## Overview

This feature allows you to automatically fetch PDF invoices from your Gmail account and store them locally for expense tracking.

## Setup Steps

### 1. Google Cloud Console Configuration

You've already provided the Client ID: `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`

Now you need to get the **Client Secret**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project "FinAI Invoice Fetcher"
3. Go to **Credentials** (left sidebar)
4. Find your OAuth 2.0 Client ID (the one you created)
5. Click on it to view details
6. Copy the **Client Secret** value

### 2. Create `.env.local` file

In your project root, create a `.env.local` file (this file is NOT committed to git for security):

```env
VITE_GOOGLE_CLIENT_ID=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
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CLIENT_ID=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
```

Replace `your_client_secret_here` with the Client Secret from Step 1.

### 3. Ensure Redirect URI is Configured

In Google Cloud Console, make sure these Redirect URIs are added to your OAuth credentials:

- `http://localhost:8080/auth/gmail/callback`
- `http://localhost:8080`

### 4. Run the Application

```bash
pnpm dev
```

### 5. Using Gmail Invoice Feature

1. Navigate to the **Upload** page
2. Click **"Fetch from Gmail"** button
3. You'll be redirected to Google's login page
4. Grant permission to read Gmail messages and attachments
5. You'll be redirected back and authenticated
6. Click **"Fetch from Gmail"** again to view your connected Gmail invoices

## How It Works

- **Security**: Uses OAuth 2.0 for secure authentication. Your password is never stored.
- **Data Storage**: Downloaded invoices are stored locally in `.invoices` folder
- **Scope**: Reads only your Gmail inbox, no write permissions
- **Privacy**: Only searches for emails with PDF attachments containing keywords: "invoice", "bill", "receipt"

## OTP Email Setup (Resend) (Recommended)

### What email will the OTP come from?

Users will receive OTP emails **from the address set in `OTP_FROM`**.
That address **must be verified in Resend** (it usually will NOT be a `@gmail.com` address).

Google OAuth “Web client” is for user sign-in / API access. It does **not** send OTP emails.

### 1) Add Environment Variables (Netlify)

Set in **Netlify → Site settings → Environment variables**:

```
RESEND_API_KEY=your_resend_api_key
OTP_FROM=your_verified_resend_sender
```

If you want to send _from_ `solankironak423@gmail.com`, use the **SMTP** provider (Gmail App Password) and set:

```
SMTP_USER=solankironak423@gmail.com
SMTP_PASS=your_app_password
OTP_FROM=FinAI <solankironak423@gmail.com>
```

### 2) Endpoint for OTP Delivery

The app uses the `/api/send-otp` endpoint to send OTPs via Resend.

## OTP Email (SMTP) Setup (Send from your Gmail)

To send OTP emails from `solankironak423@gmail.com`, you must use a **Gmail App Password** (not your normal password).

### Netlify Environment Variables (required)

Set in **Netlify → Site settings → Environment variables**:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=solankironak423@gmail.com
SMTP_PASS=your_app_password
OTP_FROM=FinAI <solankironak423@gmail.com>
```

### Steps to Configure

1. Enable 2-Step Verification on the sender Gmail account
2. Create an **App Password**: Google Account → Security → App passwords
3. Use that app password as `SMTP_PASS` (not your normal Gmail password)
4. Redeploy your app after setting the environment variables

### Test the Setup

Test the setup by sending a POST request to `/api/send-otp`.

## Troubleshooting

### "Client Secret not found"

- Make sure `.env.local` file has `GOOGLE_CLIENT_SECRET` variable set
- Restart the dev server after adding environment variables

### "Failed to fetch invoices"

- Check that your Gmail account has emails with PDF attachments
- Ensure the OAuth token is still valid
- Try disconnecting and reconnecting Gmail

### "Redirect URI mismatch"

- Make sure the callback URL in Google Cloud matches exactly
- For localhost: `http://localhost:8080/auth/gmail/callback`

## Invoices Storage

Downloaded invoices are stored in `.invoices/` directory in your project root.

## Notes

- The app searches emails for PDF attachments with specific keywords
- Only the last 10 emails matching the criteria are processed (to avoid rate limits)
- Gmail API has a free tier with 1000 requests per day
- Refresh tokens are stored in localStorage for future sessions
