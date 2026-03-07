# Supabase Edge Functions — SwipeIT Email Notifications

## Overview

| Function | Trigger | Purpose |
|----------|---------|---------|
| `send-welcome-email` | Called from client after signup | Welcome email to new users |
| `notify-candidate` | DB Webhook on `applications` table | Status change email (shortlisted/rejected) |
| `notify-match` | DB Webhook on `applications` table | Match email to both candidate + recruiter |

---

## Step 1: Add Resend API Key as Supabase Secret

In **Supabase Dashboard → Project Settings → Edge Functions → Secrets**, add:

```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxx   ← your Resend key
FROM_EMAIL     = SwipeIT <noreply@yourdomain.com>
```

> **Note**: You must verify your domain in Resend first, or use their test domain.

---

## Step 2: Install Supabase CLI

```powershell
npm install -g supabase
```

Login and link your project:
```powershell
supabase login
supabase link --project-ref guzggqrlaexecpzyesxm
```

---

## Step 3: Deploy Edge Functions

Run from the project root (`SwipeIT-2-main/`):

```powershell
supabase functions deploy send-welcome-email
supabase functions deploy notify-candidate
supabase functions deploy notify-match
```

---

## Step 4: Set Up Database Webhooks

In **Supabase Dashboard → Database → Webhooks**, create two webhooks:

### Webhook 1: Application Status Change
- **Name**: `notify-candidate-on-status-change`
- **Table**: `applications`
- **Events**: `UPDATE`
- **Condition**: `NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('shortlisted', 'rejected')`
- **HTTP URL**: `https://guzggqrlaexecpzyesxm.supabase.co/functions/v1/notify-candidate`
- **Headers**: `{ "Authorization": "Bearer <service_role_key>" }`

### Webhook 2: Match (shortlisted)
- **Name**: `notify-match-on-shortlist`
- **Table**: `applications`
- **Events**: `UPDATE`
- **Condition**: `NEW.status = 'shortlisted' AND OLD.status != 'shortlisted'`
- **HTTP URL**: `https://guzggqrlaexecpzyesxm.supabase.co/functions/v1/notify-match`
- **Headers**: `{ "Authorization": "Bearer <service_role_key>" }`

---

## Step 5: Enable Email OTP in Supabase

Go to **Supabase Dashboard → Authentication → Providers → Email**:
- Enable **"Enable Email OTP"** / Magic Link
- Set OTP expiry to **600 seconds** (10 min)
