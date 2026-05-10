# CXO Test Login Matrix · 9 personas across 3 composite tenants

**Status:** Ready for tester provisioning. Run
`npx tsx scripts/provision-cxo-personas.ts --apply` once with valid Clerk +
Supabase service role keys to materialize all nine personas in Clerk and
Supabase. After that, hand testers any of the rows below.

**Shared credentials** (per `scripts/provision-cxo-personas.ts`):

| Field | Value |
|---|---|
| Password | `Demo2026!` |
| OTP / verification code | `424242` |

Each persona pre-resolves to its tenant via Clerk `publicMetadata` →
`/auth-redirect` → `/home`, with the active client pinned to the
correct workspace and the agent retrieving from the right composite
dataset. Graph node IDs map to entries in the comprehensive
`executive_bench.json` / `it_leadership.json` files authored on
2026-05-10.

---

## Apex Retail Group · `clientKey=apexretail` · `tenantKey=apex-retail`

Tenant scale: $108B revenue, ~250k EE, ~4,500 IT FTE, $1.62B IT operating
budget. ~$3.5B FY2026 capital plan. 1,976 stores, 12 DCs, 4 merchandising
verticals.

| # | Title | Email | Persona | Function | Why test with this login |
|---|---|---|---|---|---|
| 1 | CIO | `cio@apex-retail.example.com` | Carlos Rivera | IT modernization, AMS rebuild, AI platform readiness | Tests CIO single-decision authority up to $25M; partner with Lynne Stratham on AI Governance. **(This is the login already given to KK / Delta CTO.)** |
| 2 | CFO | `cfo@apex-retail.example.com` | Margaret Chen | Capital discipline, activist-investor narrative, AI ROI scrutiny | Tests joint CFO+CIO authority on $25-75M IT capital; FY2026 capital plan + funding authority matrix; hard on AI ROI defense. |
| 3 | CDO | `cdo@apex-retail.example.com` | Lynne Stratham | CDP Activation 2026, customer-360, AI under MRM-equivalent governance | Tests cross-functional partnership with CMO + CIO; the CDP Activation Move in flight. |

---

## Meridian Health System · `clientKey=meridian` · `tenantKey=meridian-health`

Tenant scale: $16.8B revenue, 58k EE, ~2,400 IT FTE, $384M IT operating
budget (industry-standard 2.3% of revenue), $1.1B FY2026 capital plan.
30 hospitals + Meridian Health Plan + Meridian Research Institute.

| # | Title | Email | Persona | Function | Why test with this login |
|---|---|---|---|---|---|
| 1 | CDIO | `cdio@meridian-health.example.com` | Dr. Anita Krishnamurthy | Combined CDO+CIO; Epic strategy, plan-provider digital, AI Governance Council | Tests CDIO single-decision authority up to $10M; sponsor of AI Governance Council (chaired by CMIO Wexler). |
| 2 | CFO | `cfo@meridian-health.example.com` | David Park | Margin recovery, $1.1B capital plan steward, RCM modernization sponsor partner | Tests joint CFO+CDIO authority on $10-25M IT capital; rating agency relations; AI program ROI scrutiny. The right login for "approval path" / "FY26 capex" testing. |
| 3 | COO | `coo@meridian-health.example.com` | Sarah O'Brien | 30 hospitals + ambulatory + nursing; throughput + workforce | Tests clinical-ops perspective; nursing turnover narrative; ambient documentation Move sponsorship pickup. |

---

## First Capital Financial · `clientKey=arcturus` · `tenantKey=firstcapital`

Tenant scale: $18.2B revenue, $362B assets, 46k EE, ~2,400 IT FTE,
$1.67B IT operating budget (9.2% of revenue per fixtures, highest in
peer group; 34% compliance share). $700M FY2026 capital plan. 4 LOBs:
Consumer / Commercial / Wealth ($420B AUM) / Treasury & Markets.

| # | Title | Email | Persona | Function | Why test with this login |
|---|---|---|---|---|---|
| 1 | CIO | `cio@firstcapital.example.com` | Patricia Huang | AI program portfolio sponsor, FedNow technology readiness, core banking modernization decision | Tests CIO single-decision authority up to $5M (banks tighter than retail/health); sponsor of AI program portfolio under MRM gating. |
| 2 | CRO | `cro@firstcapital.example.com` | James Park | Independent voice; gating sponsor on every AI program (SR 11-7 / MRM); OCC findings remediation | The right login for testing **parallel-gate authority**: any AI/ML model regardless of dollar requires James Park's MRM signoff (via VP Adekoya-Park). Funding authority matrix surfaces this. |
| 3 | CFO | `cfo@firstcapital.example.com` | Michael Torres | Cost-discipline coalition; three-signature joint approver on $5-25M IT capital | Tests three-way CFO+CIO+CRO joint approval (banks-only authority structure, tighter than retail/health). Cost-to-income narrative; CCAR readiness. |

---

## Provisioning workflow

1. Pull latest `main` (or this branch) so `src/lib/auth/cxo-personas.ts` has all 9 entries.

2. Confirm `.env.local` has:
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Dry run:
   ```
   npx tsx scripts/provision-cxo-personas.ts
   ```
   This lists Clerk + Supabase changes without applying.

4. Apply:
   ```
   npx tsx scripts/provision-cxo-personas.ts --apply
   ```
   Creates / updates the nine Clerk users with password `Demo2026!`,
   creates Supabase `persons` rows linked to the correct
   `graph_node_id`, and provisions `person_client_memberships`.

5. Hand to tester:
   - URL: `https://app.abarva.ai/sign-in`
   - Email: pick from the matrix above
   - Password: `Demo2026!`
   - OTP code (if prompted): `424242`

6. After login, the tester lands at `/home` pinned to the correct
   tenant. The agent retrieves from that tenant's composite dataset,
   including the new `function_capacity`, `fy2026_capital_plan`, and
   `funding_authority_matrix` records.

---

## What each tester should try

These are the questions that exercise the new dataset wiring (org
capacity, FY26 capital plan, funding authority). Hand them to your
testers as starter prompts so they hit the new surfaces fast.

**Apex / Margaret Chen (CFO):**
- "What's our FY26 IT capex by line?"
- "If Carlos brings me a $4M AI workforce-scheduling capital request, what's the approval path?"
- "How is AWS performing as a vendor right now? Any renegotiation flags?"
- "How big is the merchandising organization vs. the data analytics function?"

**Meridian / David Park (CFO) or Sarah O'Brien (COO):**
- "What's our FY26 IT capital plan? Where is Hawaii integration in it?"
- "Who approves a $6M ambient documentation expansion? Walk me through the parallel gates."
- "How big is the data analytics function and what's its budget? Compare to peer IDNs."
- "If I want to fund a new RCM denials AI capability, which budget pocket and which approval path?"

**First Capital / James Park (CRO) or Michael Torres (CFO):**
- "What's the funding-authority matrix for an $8M AI program at our scale?"
- "Walk me through the parallel gates for any new ML model — MRM, fair lending, board risk."
- "Which vendors are on renegotiation flags right now and what's the strategic posture?"
- "How is FY26 IT spend distributed between core banking, payments, wealth, and risk tech?"

---

**File:** `docs/audit/CXO_TEST_LOGIN_MATRIX.md`
**Persona registry:** `src/lib/auth/cxo-personas.ts`
**Provisioning script:** `scripts/provision-cxo-personas.ts`
**Last updated:** 2026-05-10
