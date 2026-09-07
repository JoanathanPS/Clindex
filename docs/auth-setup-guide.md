# Clindex Authentication & SMTP Setup Guide

This guide walks you through configuring **Google OAuth** and **Resend Custom SMTP** for Supabase Auth in Clindex.

---

## 1. Google Cloud OAuth Setup

### Step 1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select an existing project or create a new project (e.g., `Clindex-Auth`).

### Step 2: Configure the OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required fields:
   - **App name**: `Clindex`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and ensure the standard scopes are selected:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue** through the remaining screens. If your app status is in "Testing", add your personal test Google account to the **Test users** list.

### Step 3: Create Web Application OAuth Client ID
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. Select Application type: **Web application**.
4. Name: `Clindex Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - Your production frontend domain (e.g., `https://your-domain.com`), if deployed.
6. Under **Authorized redirect URIs**, add your Supabase project's callback URI:
   ```text
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
   *(Replace `<project-ref>` with your actual Supabase project reference ID).*
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

---

## 2. Supabase Auth Configuration

### Step 1: Enable Google Provider
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your Clindex project.
2. Go to **Authentication** > **Providers** (under Configuration).
3. Select **Google** from the provider list:
   - Toggle **Enable Google provider** to **ON**.
   - Paste your **Client ID**.
   - Paste your **Client Secret**.
   - Click **Save**.

### Step 2: Configure Redirect URLs in Supabase
1. In the Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. Set **Site URL** to:
   - `http://localhost:3000` (for local development) or your production domain.
3. Under **Redirect URLs**, click **Add URL** and add:
   ```text
   http://localhost:3000/auth/callback
   ```
   *(Also add your production callback URL `https://your-domain.com/auth/callback` if deploying).*
4. Click **Save**.

---

## 3. Resend Custom SMTP Setup

To send transactional authentication emails (such as magic sign-in links) through Resend instead of Supabase's default rate-limited mailer:

### Step 1: Get Resend API Key & Domain
1. Log in to your [Resend Dashboard](https://resend.com/).
2. Go to **API Keys** and click **Create API Key**:
   - Name: `Clindex Supabase Auth`
   - Permission: **Full access** (or sending access)
   - Copy the API key starting with `re_...`.
3. Go to **Domains**:
   - For production, ensure your custom domain is added and DNS records (DKIM, SPF) are verified.
   - For initial testing, Resend provides the sandbox sender `onboarding@resend.dev` (note: emails from `onboarding@resend.dev` can only be delivered to the email address registered with your Resend account).

### Step 2: Configure Custom SMTP in Supabase
1. In your Supabase Dashboard, navigate to **Project Settings** > **Authentication** > **SMTP Settings** (or **Authentication** > **Email Templates** > **SMTP Settings**).
2. Toggle **Enable Custom SMTP** to **ON**.
3. Fill in the configuration details:
   - **Sender email**: `auth@yourdomain.com` (must match your verified domain in Resend) or `onboarding@resend.dev` (for testing).
   - **Sender name**: `Clindex`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL)
   - **Minimum interval between emails**: `60` (or your preferred rate limit in seconds)
   - **Username**: `resend`
   - **Password**: `<Your Resend API Key, e.g. re_123456789...>`
4. Click **Save**.
5. *(Optional)* Click **Send Test Email** to verify deliverability through Resend.

---

## 4. Local Testing Workflow

1. Start your local environment:
   ```powershell
   cd web
   npm run dev
   ```
2. Navigate to `http://localhost:3000/login`.
3. You will see:
   - **Continue with Google**: Authenticates via Google OAuth, redirects to Supabase, exchanges the session at `/auth/callback`, and lands on `/patients`.
   - **Sign in with Magic Link**: Enter your email address to receive an instant sign-in link delivered via Resend SMTP.
   - **Demo Clinician (Quick Sign-in)**: One-click local test login using `dev.clinician@clindex.dev` (or `dev.clinician@rxguard.dev`) without needing external email or Google setup.
   - **Password Sign-in Drawer**: Traditional email and password sign-in / account creation.
