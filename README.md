# NexGen — Analytics Platform

Multi-platform analytics dashboard: Google Search Console, GA4, GHL Voice AI & Gravity Forms.

## Features

- 🔐 **Google OAuth login** — sign in with your Google account
- 🌐 **Multi-website management** — add unlimited websites
- 👥 **Team collaboration** — invite teammates with role-based access (admin/editor/viewer)
- 🔍 **Real GSC data** — live clicks, impressions, CTR, keywords from Google Search Console API
- 📈 **Real GA4 data** — live sessions, users, conversions, devices from GA4 API
- 🤖 **GHL Voice AI** — call analytics and lead pipeline
- 📋 **Gravity Forms** — form submission tracking
- 📊 **Presentation builder** — generate PDF reports per website
- 🌓 **Dark / Light theme** toggle

## Setup

### 1. Clone and install

```bash
git clone https://github.com/SyedAsim-web/siteiq.git
cd siteiq
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Copy your **Project URL** and **API keys** from Settings → API

### 3. Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → Library** and enable:
   - **Google Search Console API**
   - **Google Analytics Data API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

### 4. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run: openssl rand -base64 32

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables
4. Update Google OAuth redirect URI to your production domain
5. Deploy

## Connecting your data

After signing in:

1. Click **Add Website** and enter your domain
2. Go to the site → **Integrations** tab
3. For **GSC**: enter your property URL from Search Console
4. For **GA4**: enter your Property ID (numbers only) and Measurement ID (G-XXXXX)
5. Click **Connect** — NexGen uses your signed-in Google account to fetch real data

## Tech Stack

- **Next.js 15** (App Router)
- **NextAuth v5** (Google OAuth)
- **Supabase** (database + row-level security)
- **TypeScript**
- **Tailwind CSS**
- Google Search Console API
- Google Analytics Data API
