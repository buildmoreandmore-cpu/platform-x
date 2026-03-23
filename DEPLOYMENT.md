# Platform-X Deployment Guide

## Environment Variables

### Vercel Dashboard

| Name | Required | Scope | Description | Where to get it |
|------|----------|-------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Yes | Client | Supabase project URL | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Yes | Client | Supabase anon/public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Supabase service role key | Supabase → Settings → API (never prefix with VITE_) |
| `ANTHROPIC_API_KEY` | Yes | Server | Claude API key for AI vision extraction | https://console.anthropic.com/ |
| `SMTP_HOST` | Yes | Server | SMTP server hostname | Your email provider |
| `SMTP_PORT` | Yes | Server | SMTP port (usually 587 for STARTTLS) | Your email provider |
| `SMTP_USER` | Yes | Server | SMTP auth username/email | Your email provider |
| `SMTP_PASS` | Yes | Server | SMTP auth password or app password | Your email provider |
| `SMTP_FROM_NAME` | No | Server | Display name in email From header. Defaults to "Platform" | Choose any name |
| `SITE_URL` | Yes | Server | Public URL of the deployed app (used in email links) | Your Vercel domain, e.g. `https://platform-x.vercel.app` |
| `VITE_SUPER_ADMIN_KEY` | Yes | Client | Password for /super-admin panel access | Generate a strong random string. Change regularly |
| `VITE_MINIMAX_API_KEY` | No | Client | MiniMax API key for AI assistant panel | MiniMax dashboard (feature disabled if not set) |

### Supabase Secrets (for Edge Functions)

Set via CLI: `supabase secrets set KEY=VALUE`

| Name | Description |
|------|-------------|
| `SUPER_ADMIN_KEY` | Must match `VITE_SUPER_ADMIN_KEY` — used to authenticate admin-dashboard edge function requests |

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available to edge functions.

## Supabase Setup

Run these steps in order:

1. **Create a Supabase project** at https://supabase.com/dashboard
2. **Run migration 002** — paste `supabase/migrations/002_multi_tenant.sql` into the SQL Editor and execute. This creates the tenants table, tenant_users table, adds tenant_id to all existing tables, and sets up RLS policies.
3. **Run migration 003** — paste `supabase/migrations/003_tenant_logos_bucket.sql` into the SQL Editor. This creates the `tenant-logos` storage bucket with upload/read policies.
4. **Deploy the admin-dashboard edge function**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy admin-dashboard
   ```
5. **Set Supabase secrets**:
   ```bash
   supabase secrets set SUPER_ADMIN_KEY="your_super_admin_key_here"
   ```

## Vercel Deployment

1. Push the repo to GitHub (recommended name: `platform-x`)
2. Import the repo into Vercel at https://vercel.com/new
3. Framework preset: **Vite**
4. Build command: `npm run build` (auto-detected)
5. Output directory: `dist` (auto-detected)
6. Add all environment variables from the table above in the Vercel dashboard under Settings → Environment Variables
7. Deploy

## First-Run Checklist

After deployment completes:

1. Navigate to `https://your-domain.vercel.app/super-admin`
2. Enter the super admin key when prompted
3. Click **Create Tenant** — fill in company name, slug, plan, and owner email
4. The owner receives an invite email
5. The owner navigates to `/forgot-password` and enters their email to set their initial password
6. The owner logs in — they are redirected to `/onboarding`
7. The owner completes the 3-step onboarding: company name, logo upload, brand colors
8. The platform is now branded and ready for the owner to create projects and invite team members

## Ongoing Operations

### Adding a new tenant

1. Go to `/super-admin` and authenticate
2. Click **Create Tenant**
3. Fill in name, slug, plan, and owner email
4. Owner follows the same forgot-password → onboarding flow

### Updating the super admin key

When rotating the key, update it in two places:

1. **Vercel**: Settings → Environment Variables → update `VITE_SUPER_ADMIN_KEY` → redeploy
2. **Supabase**: `supabase secrets set SUPER_ADMIN_KEY="new_key_here"`

Both must match. The Vercel value is used by the client to authenticate; the Supabase secret is used by the edge function to verify requests.
