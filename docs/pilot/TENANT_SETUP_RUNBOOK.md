# AbarVa — Pilot Tenant Setup Runbook

**Document type:** Operational runbook for onboarding a new enterprise pilot tenant  
**Audience:** AbarVa founding team (internal ops); not distributed to clients  
**Version:** 1.0 — 2026-04-26  
**Goal:** Set up a new enterprise pilot tenant in 5 business days

---

## Overview

This runbook covers the end-to-end steps to provision a new enterprise pilot tenant in the AbarVa SaaS platform. It assumes:

- The client has signed or verbally approved a pilot data sharing agreement
- The client has provided at least one programme name and a point of contact
- The AbarVa founding team has administrative access to Vercel, Neon Postgres, and Clerk

**Estimated time:** 2–4 hours of active setup + 4 days of data preparation / client coordination

---

## Pre-Flight Checklist (Day 0 — Before Starting)

| # | Item | Owner | Done? |
|---|---|---|---|
| 1 | Confirm pilot data sharing agreement is in place (L0–L4 data tier) | Founder | ☐ |
| 2 | Obtain client contact name, email, and role | Founder | ☐ |
| 3 | Obtain at least one programme name from client for seed data | Founder | ☐ |
| 4 | Confirm client data residency requirement (US SaaS or Azure private data plane) | Founder | ☐ |
| 5 | Confirm Tier: T1 (SaaS shared), T2 (SaaS dedicated), or T3 (Azure private data plane) | Founder | ☐ |
| 6 | Confirm Vercel, Neon, and Clerk admin access is active | Founder | ☐ |

> **Data Sharing Tiers:**
> - **L0:** No client data — demo seed data only
> - **L1:** Client-approved public data (press releases, published contracts)
> - **L2:** Client-provided anonymised programme data
> - **L3:** Client-provided identified programme and procurement data
> - **L4:** Full data integration (requires Azure private data plane for most Fortune 500 clients)

---

## Step 1 — Create Tenant Record in Postgres (Day 1)

### 1.1 Add tenant to the `tenants` table

Connect to the Neon Postgres database:

```bash
# Get connection string from Vercel env
vercel env pull .env.local --environment=production

# Connect to Neon
psql $DATABASE_URL
```

Insert the new tenant:

```sql
-- Replace values with client-specific data
INSERT INTO tenants (
  id,
  slug,
  name,
  display_name,
  tier,
  data_sharing_level,
  created_at,
  status
) VALUES (
  gen_random_uuid(),
  'client-slug',           -- e.g. 'northstar-retail'
  'Client Full Name',      -- e.g. 'Northstar Retail Group'
  'Northstar Retail',      -- display name for UI
  'T1',                    -- T1 / T2 / T3
  'L2',                    -- L0 / L1 / L2 / L3 / L4
  NOW(),
  'pilot'
);
```

> **Important:** Use a URL-safe slug (lowercase, hyphens only). This slug becomes the tenant route prefix: `/tenant/<slug>/`.

### 1.2 Verify tenant record

```sql
SELECT id, slug, name, tier, status FROM tenants WHERE slug = 'client-slug';
```

Expected: one row returned with the correct values.

---

## Step 2 — Configure Clerk Org and User Roles (Day 1–2)

### 2.1 Create Clerk organisation

1. Log in to the Clerk Dashboard at https://dashboard.clerk.com
2. Navigate to **Organizations → Create organization**
3. Set the organisation name to match the tenant `display_name`
4. Note the Clerk organisation ID (`org_xxx`) — you will need this

### 2.2 Create user accounts

For each pilot user (minimum: 1 advisor, 1 executive):

1. Navigate to **Users → Create user**
2. Set email address (use client-provided email)
3. Enable **OTP login** (test accounts can use OTP 424242 in development; production accounts use real OTP)
4. Assign the user to the client's Clerk organisation
5. Set the role:
   - Advisor contacts → `advisor`
   - Executive sponsor → `client`
   - AbarVa admin access for this tenant → `admin`

### 2.3 Wire Clerk org to tenant slug

In the Postgres database:

```sql
-- After creating the Clerk org, record the mapping
INSERT INTO tenant_clerk_orgs (
  tenant_id,
  clerk_org_id,
  created_at
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'client-slug'),
  'org_xxxxxxxxxx',   -- Clerk org ID from Step 2.1
  NOW()
);
```

> If a `tenant_clerk_orgs` table does not yet exist, create it in the migration log and flag to founding team for Wave 27 migration inclusion.

---

## Step 3 — Seed Initial Programme Data (Day 2–3)

### 3.1 Gather programme information from client

Before seeding, you need from the client:

| Data item | Required? | Source |
|---|---|---|
| Programme name(s) | Required | Client |
| Programme phase (Discovery / Design / Build / Synthesis / etc.) | Required | Client |
| Business outcome / objective | Required | Client |
| Sponsor name and role | Optional | Client |
| Active risks (high-level) | Optional | Client |
| Key milestones | Optional | Client |
| Linked sourcing event (if any) | Optional | Client |

If the client cannot provide data, use L0 seed data (demo seed pattern) and notify the client that the pilot will show illustrative data until they provide real information.

### 3.2 Create programme records

Use the seed script pattern (never run `db:seed` in production context — do this via a targeted insert script):

```typescript
// scripts/seed/new-tenant-programs.ts (create this script for each new client)
// Review: src/db/schema/ for current table structure before running

const programs = [
  {
    tenantSlug: 'client-slug',
    name: 'Programme Name',
    slug: 'programme-slug',
    phase: 'synthesis',
    status: 'active',
    // ... other fields per schema
  }
];
```

> **Important:** Confirm the schema is current before writing insert scripts. Run `npm run db:migrate` dry-run first.

### 3.3 Verify seed data

After inserting:

```bash
# Run the route smoke test for the new tenant
curl -s -o /dev/null -w "%{http_code}" \
  "https://nexus-vert-kappa.vercel.app/tenant/client-slug/programs"
```

Expected: `200`

---

## Step 4 — Configure Azure Private Data Plane (Tier 3 Clients Only)

> Skip this step for T1 and T2 clients.

For Tier 3 clients requiring data sovereignty:

1. Engage the client's Azure infrastructure team
2. Share `docs/architecture/azure/AZLAB7-private-data-plane-design.md`
3. Follow the provisioning runbook in that document
4. Verify boundary policy enforcement before handing over credentials

**Estimated additional time:** 3–5 business days for Azure provisioning coordination.

---

## Step 5 — Route Verification (Day 4)

Verify all 16 active routes return 200 for the new tenant. Run the smoke test:

```bash
# Edit scripts/smoke-test.sh to add the new tenant slug, then:
TENANT_SLUG=client-slug bash scripts/smoke-test.sh
```

**Required routes to verify:**

| Route | Expected |
|---|---|
| `/tenant/<slug>/programs` | 200 |
| `/tenant/<slug>/programs/<programme-slug>` | 200 |
| `/tenant/<slug>/intelligence` | 200 |
| `/tenant/<slug>/tower` | 200 |
| `/home` | 200 (authenticated) |
| `/admin` | 200 (admin role only) |

If any route returns non-200:

1. Check Vercel deployment logs for server errors
2. Check that the tenant slug matches the `tenants` table exactly
3. Check that Clerk org is mapped correctly
4. Escalate to founding team if not resolved within 30 minutes

---

## Step 6 — Send Login Credentials Securely (Day 4–5)

### 6.1 Prepare credentials

For each pilot user:

- Platform URL: `https://nexus-vert-kappa.vercel.app`
- Email address (as configured in Clerk)
- OTP login enabled — they will receive a one-time code to their email on first login
- Role: Advisor / Executive (as configured)

### 6.2 Send via secure channel

- Use Signal, Tresorit, or a password manager share link — not email plaintext
- Never send OTP codes via email alongside the email address
- If the client prefers email, send URL and role in one email; send the initial OTP guidance in a separate email

### 6.3 Credential handover email template

```
Subject: AbarVa Pilot Access — [Client Name]

Hi [Name],

Your AbarVa pilot access is ready. Here are your login details:

Platform: https://nexus-vert-kappa.vercel.app
Email: [their email]
Login method: One-time passcode to your email

To log in: visit the platform URL, enter your email, and enter the 6-digit code sent to your inbox.

Please contact [your email] if you have any difficulty accessing the platform.

We look forward to the onboarding call on [date].

Best,
[Founder name]
AbarVa
```

---

## Step 7 — Schedule Onboarding Call (Day 5)

Send a calendar invitation for the onboarding call within 3 business days of credentials delivery.

Onboarding call agenda (30 minutes):

1. [5 min] Introductions and pilot objectives
2. [15 min] Platform walkthrough (use `docs/pilot/ADVISOR_QUICK_START.md` as guide)
3. [5 min] Data sharing status — confirm what data they will provide and timeline
4. [5 min] Q&A and next steps

Send the `docs/pilot/ONBOARDING_GUIDE.md` and the relevant quick-start guide to the client at least 24 hours before the call.

---

## Checklist Summary

| Step | Owner | Day | Done? |
|---|---|---|---|
| Pre-flight checklist | Founder | Day 0 | ☐ |
| Create tenant in Postgres | Founder | Day 1 | ☐ |
| Create Clerk org and users | Founder | Day 1–2 | ☐ |
| Wire Clerk org to tenant slug | Founder | Day 2 | ☐ |
| Seed programme data (or confirm L0) | Founder | Day 2–3 | ☐ |
| Azure PDP setup (T3 only) | Founder + Client Azure team | Day 2–5 | ☐ |
| Route verification (16 routes pass) | Founder | Day 4 | ☐ |
| Send credentials securely | Founder | Day 4–5 | ☐ |
| Send onboarding materials | Founder | Day 4–5 | ☐ |
| Schedule onboarding call | Founder | Day 5 | ☐ |

---

## Known Gaps in This Runbook

| Gap | Impact | Remediation |
|---|---|---|
| No `tenant_clerk_orgs` table confirmed in schema | Medium — manual mapping required | Confirm schema in Wave 27 |
| `db:seed` / targeted insert script pattern not fully automated | Medium — manual SQL required | Tenant provisioning CLI in Wave 28 |
| Smoke test script hardcodes Apex Retail slug | Low | Update script to accept `TENANT_SLUG` env var |
| Clerk org → tenant mapping not enforced at RLS layer | High | Confirm RLS uses Clerk org in Wave 27 |

---

_Document owner: AbarVa founding team_  
_Next review: After first real pilot tenant onboarding_
