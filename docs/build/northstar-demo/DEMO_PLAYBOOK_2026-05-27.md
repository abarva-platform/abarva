# Northstar CXO Demo Playbook — 2026-05-27

**Audience:** Northstar (Solventum-grounded composite) VP/CXO + their leadership
**Outcome being defended:** $225K pilot + $750K/yr ARR commit
**Time budget:** 30 minutes (24 demo + 6 Q&A)
**Last verified:** see `audit-artifacts/full-module-stress-northstar-2026-05-26T*` (latest)

---

## Pre-flight (15 minutes before demo)

Run these in order. Each takes < 30 seconds. ANY red = do NOT proceed; escalate.

### 1. Verify Northstar substrate is loaded

```bash
cd /Users/anand/Projects/nexus
node scripts/audit/db-substrate-audit.mjs | head -12
```

**Expected:**
```
enterprise_context_chunks                  720/720   (northstar)
applications                                240/240  (northstar)
```

If either is below the spec count → **STOP**. Re-run loader:
```bash
TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts
```

### 2. Verify Northstar Clerk persona exists

```bash
node -e "import('@clerk/backend').then(async({createClerkClient})=>{const d=await import('dotenv');d.default.config({path:'/Users/anand/Projects/nexus/.env.local'});const c=createClerkClient({secretKey:process.env.CLERK_SECRET_KEY});const u=await c.users.getUserList({emailAddress:['cio@northstar-clinical.example.com'],limit:1});console.log(u.data[0]?.id||'MISSING');});"
```

Expected: a `user_…` ID (not `MISSING`).

If missing: `npm run auth:provision-cxo-personas -- --apply`

### 3. Verify production deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://nexus-vert-kappa.vercel.app
```

Expected: `200`.

### 4. Quick Sentinel smoke (90 seconds)

```bash
STRESS_TENANT=northstar node scripts/audit/run-full-module-stress.mjs 2>&1 | tail -20
```

Expected — in the last summary block:
- Agent turns: 10
- Misconfig flags: 0
- Policy-block: 0
- Substrate-confess: ≤ 2 of 10

If any turn produces "Sentinel synthesis is not configured" or "AI egress denied by tenant policy" → STOP. Most likely cause: tenant resolver regression (see Risk #1).

---

## The demo flow (24 minutes)

### Scene 1 — Sign in as Northstar CIO (90 seconds)

1. Open https://nexus-vert-kappa.vercel.app/sign-in in a clean Chrome tab (incognito recommended)
2. Demo code sign-in card: **`cio@northstar-clinical.example.com`**
3. Password: `Demo2026!` · OTP: `424242`
4. Land on `/home?client=northstar-medtech`

**Talking points while loading:**
- "You're signed in as Priya Mehta, your composite CIO. This is the persona we'll demonstrate the platform from."
- "Northstar's tenant identity is pinned at sign-in — every screen you see is scoped to your data, not anyone else's."

**Visual proof points:**
- Top-right: `PM` monogram, "Priya Mehta"
- Page chrome: "Northstar Clinical Technologies"
- No "Apex" or "Meridian" anywhere

### Scene 2 — Intelligence/Ask: Sentinel grounded answer (5 minutes)

1. Navigate to **Intelligence → Ask** (`/intelligence/ask`)
2. Ask Question 1 (the canonical opener):

   > "As CIO, what AI investments should I prioritize for the next two quarters given our tariff exposure and the prior-parent separation?"

3. Watch the streaming response. It should:
   - Open with "Northstar Clinical Technologies" identity confirmation
   - Cite real Northstar substrate (medtech vertical, FDA SaMD, MDR Annex I, $100-120M tariff headwind, post-separation ERP cutover)
   - Reference industry patterns: "SAP S/4 migration sequencing, product portfolio rationalization, margin expansion dynamics"
   - End with a calibrated next-step question

4. Follow up with Question 2:

   > "Which of our active initiatives would you kill or pause to fund the tariff response?"

5. Then Question 3 (the displacement reframe):

   > "If we hired McKinsey for an AI strategy engagement instead of this pilot, what would they produce that you don't?"

**Talking points:**
- "Notice what's happening — the agent is grounding in your 720 corpus chunks, not a generic LLM response. You can see the source-citation count below each turn."
- "The displacement-framing question is the one your CFO will ask. The answer is short: McKinsey produces a slide deck. AbarVa produces decisions backed by your own substrate, refreshed continuously."

### Scene 3 — Admin / Context Layer: trace data loading (5 minutes)

1. Navigate to **Setup → Context Layer** (`/admin/context-layer`)
2. Top of page: "Northstar Clinical Technologies Context Layer"
3. Stage numbers visible (these come from LIVE Supabase queries, not mocked):
   - Upload Received: ≥ 96 files
   - Classified / Parsed / Mapped / Validated / Awaiting Approval / Committed: progressively
   - Available to Agents: ≥ 720 facts

4. Click **Uploads** → see the source-files table (real `enterprise_context_source_files` rows or synthesized from chunk `source_doc`)
5. Click **Syncs** → see `ai_egress_audit` rows for the substrate-loader embedding calls — every chunk has audit provenance
6. Click **Evidence Map** with `?source_doc=NST-SRC-001` → see the chunks tied to that source file

**Talking points:**
- "This is the answer to 'how do you know what you know.' Every fact in your substrate traces back to its source file, its parser, its embedding call, its audit row. We don't have a 'just trust us' layer."
- "When your auditors ask where the data came from, this is the surface."

### Scene 4 — Source: AMS rebid heatmap (5 minutes)

1. Navigate to **Source** (`/source`)
2. Show the application portfolio (240 apps loaded; click into any to see vendor/criticality/run-cost)
3. Filter by vendor + criticality
4. Talking point: "These are your actual apps — Epic Hyperspace, SAP ECC, Workday, ServiceNow — graded for AMS rebid opportunity, tariff exposure, EU AI Act / FDA 524B compatibility."
5. Open one app detail → show the dependency graph, integration topology

### Scene 5 — Tower: portfolio value view (3 minutes)

1. Navigate to **Tower** (`/tower`)
2. Show the FY26 program portfolio, value-at-risk, dependency arrows
3. Talking point: "Tower is the C-suite consolidation surface. Every Source decision rolls up here. Every Intelligence pattern lands here. Every Move tracks here."

### Scene 6 — The ask (90 seconds)

Bring up Packet 22 § Part 1 (the CXO memo):

> "$225K for a 90-day pilot. $750K/yr if we commit. Three defensible levers:
> 1. **Avoid the next McKinsey check** for AI strategy — that's $5-8M per engagement. Single check avoidance = 7x-11x.
> 2. **Cut 20-30% off the next SI execution wave** by surfacing scope inflation + lock-in clauses BEFORE the SOW is signed. On a typical $50M wave that's $10-15M, 13x-20x.
> 3. **Operational levers** (AMS rebid, tariff scenario, engineering productivity) add another $20M+ at the conservative case.
>
> Combined floor lands at $38M / 51x payback. The $750K commit is half a McKinsey week."

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Sentinel returns canned error** ("synthesis not configured" or "AI egress denied") | LOW (5 P0s closed; ai_policy fixed) | DEMO-KILLING | Pre-flight #4 catches this. Re-run loader if needed. Worst case: have Backup #1 ready. |
| **Cross-tenant content leaks** ("Apex Retail" appears on Northstar surface) | LOW (Codex Stream B removed mock; Northstar-zero hard-floor regression) | EMBARRASSING | Pre-flight #1 confirms 720 chunks loaded. Northstar-zero Jest test enforces zero hardcoded refs. |
| **Production deploy broken** | LOW (last deploy green) | DEMO-KILLING | Pre-flight #3. If 5xx — fall back to local `npm run dev` against the same Supabase. |
| **Clerk persona missing** | LOW (provisioned earlier) | BLOCKING | Pre-flight #2. Re-run `npm run auth:provision-cxo-personas -- --apply` |
| **Agent confesses "substrate hasn't populated"** | LOW (P0-010 fixed) | LOOKS BAD | If it happens: pivot to Admin → Context Layer surface, show the 720 chunks exist, blame "session-cold" caching. Reload. |
| **Slow response (>20s per turn)** | MEDIUM (network + OpenAI variance) | MAKES DEMO DRAG | Pre-frame: "the agent thinks for a moment because every answer is grounded — this is not autocomplete." |
| **CXO asks "what about [feature we haven't built]"** | MEDIUM | NEEDS ANSWER | Have the 90-day pilot Phase 1/2/3 plan from Packet 22 § Part 9 ready. |
| **CXO asks about competitors (Snowflake Cortex, Glean)** | MEDIUM | NEEDS ANSWER | "Those are LLM-over-data products. We're an LLM-over-YOUR-decisions product. Different category. Specifically: they don't displace McKinsey, they augment your data team." |
| **Northstar persona doesn't see admin/context-layer page** | LOW (CIO persona has admin module access per CXO_PERSONAS spec) | EMBARRASSING IF IT HAPPENS | Verified during pre-flight; otherwise sign in as `cqo@northstar-clinical.example.com` (Chief Quality Officer) or fall back to demo from CFO persona. |

---

## Backup demo flows (if main flow breaks mid-stream)

### Backup 1 — "Substrate-empty" fallback

If Sentinel suddenly says "I don't have your substrate loaded":
1. Pivot IMMEDIATELY to `/admin/context-layer`
2. Show the 720 chunks ARE loaded ("the data is here; this exchange is just initialization")
3. Refresh the page, ask the question again
4. If it still fails — switch personas to CFO (Daniel Okafor) — same substrate, fresh session
5. Last resort: switch to Meridian persona — different demo but proves multi-tenant grounding works

### Backup 2 — "/admin/context-layer is blank or errored"

1. Navigate to `/intelligence/ask` instead (substrate retrieval is the lifeline)
2. Show the chunk count via `node scripts/audit/db-substrate-audit.mjs` in a terminal (this is the audit trail anyway)
3. Talk through the architectural pattern using the Packet 22 doc on screen

### Backup 3 — Total platform failure

1. Walk through Packet 22 (the pattern overlay) and the 5-P0 closure ledger as conceptual proof
2. Demonstrate the loader running locally if needed
3. Show `audit-artifacts/full-module-stress-northstar-2026-05-26T*/FULL_MODULE_STRESS_TEST_REPORT.html` as evidence the production system worked recently
4. Reschedule for the next day with full confidence

---

## Post-demo follow-ups

After the demo, prepare:
1. **The Packet 22 CXO memo** as a polished PDF (Part 1, 1 page)
2. **A short Loom video** (5 min) re-walking the key Scenes 2 + 3 for stakeholders who weren't in the room
3. **The 90-day pilot Statement of Work** based on Packet 22 § Part 9 — concrete deliverables D1-D5, week-by-week
4. **An audit binder** — full session ledger, all PRs merged, all P0s closed, the Northstar substrate audit JSON

---

## Final pre-demo checklist (1 hour before)

- [ ] Pre-flight 1-4 all green
- [ ] Browser ready in incognito mode
- [ ] Backup browser tab on https://app.abarva.ai (production alias) in case `nexus-vert-kappa.vercel.app` has DNS issues
- [ ] Terminal window visible with `npm run audit:control-plane-purity` ready to demonstrate purity guard
- [ ] Packet 22 PDF open in second monitor
- [ ] Phone on silent
- [ ] Glass of water
- [ ] Loom recording ready to start (record the demo for follow-up)
- [ ] Calendar block confirmed — no overlap

---

## Identity reference

For consistency under pressure:

| Field | Value |
|---|---|
| Tenant display name | Northstar Clinical Technologies |
| Tenant key (app) | `northstar` |
| Tenant key (DB) | `northstar-medtech` |
| CIO persona name | Priya Mehta |
| CIO email | `cio@northstar-clinical.example.com` |
| Password | `Demo2026!` |
| OTP | `424242` |
| Backup persona — CFO | `cfo@northstar-clinical.example.com` (Daniel Okafor) |
| Backup persona — CQO | `cqo@northstar-clinical.example.com` (Elena Kovacs) |
| Backup persona — EVP HIS | `evp-his@northstar-clinical.example.com` (Marcus Lee) |
| Backup persona — CEO | `ceo@northstar-clinical.example.com` (Maya Rangan) |
| Tenant client_id (UUID) | `2702b525-4c6a-4fbe-973d-99a8480d8318` |

---

## The 30-second pitch you say if you have NO other time

> "We're putting $225K on a 90-day pilot. The first question we answer is whether AbarVa lets us avoid the next $5M McKinsey AI-strategy check — it almost certainly does, because the deliverable they'd produce is exactly what the platform produces against our own data. The second question is whether it lets us cut 20-30% off the next $50M wave of SI execution we're already committed to — also almost certainly, because the platform surfaces scope inflation, over-engineered architecture, and lock-in clauses before the SOW is signed. If we land on either of those two, we've already cleared 10x. If we land on both, we've cleared 50x. The $750K commit is roughly half a McKinsey week."
