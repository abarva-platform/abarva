# AbarVa · First-Pilot Deployment Runbook

> Living doc. Owner: founder. Last updated 2026-05-14. Target time-to-first-CXO-login: ≤ 2 weeks from signed SOW.
>
> **Audience.** Internal: founder today, founder + SRE/PM hire tomorrow. Not a customer artifact. The customer-facing companion is `docs/security/INFOSEC-ACCELERATOR.md` (CAIQ pre-fill, control matrix, posture). This runbook is the operating sequence behind that doc.
>
> **Companion artifacts.** `docs/pilot/TENANT_SETUP_RUNBOOK.md` (tactical tenant provisioning), `docs/deployment/AZURE_PRIVATE_DATA_PLANE_LAB_RUNBOOK.md` (lab-grade Azure topology), `docs/BACKLOG-2026-05-14.md` (live status of dependencies A2c, B4, B5a-c).

---

## 0. Pre-conditions before kickoff

Do not start the 14-day clock until every box below is checked. Slippage on these is the single biggest predictor of a missed go-live date.

- [ ] **SOW signed** (countersigned, not just verbally agreed). Includes pilot duration (default 90 days), seat count, and a success-criteria addendum.
- [ ] **MSA + DPA executed** (or pilot-specific short-form DPA — see §1a).
- [ ] **Primary customer contact named** with email, mobile, and time zone. Single throat-to-choke. Backup contact recommended.
- [ ] **CXO sponsor identified** (the human who will actually log in and ask Sentinel a question on day 14). If there is no CXO at the table, you are running a demo, not a pilot — stop and rescope.
- [ ] **Deployment option chosen** — SaaS managed (default, in AbarVa Azure tenancy) **or** in-VPC (B4, into customer subscription). The choice is locked here; flipping mid-pilot is not supported.
- [ ] **Tier chosen** per D2: **Pilot** (capped seats, capped data volume, 90-day default), **Production**, or **Enterprise** (in-VPC + Tier-3 connectors). Pilot is the default.
- [ ] **Industry vertical confirmed** — retail / health / financial-services / public-sector / other. Drives which industry corpus we surface and which sensitive-data classes the guard treats as immediate-quarantine.
- [ ] **Data classification scope agreed** — written confirmation, in the SOW or DPA addendum, that the customer will **not** ship PHI, PII, full PAN, or other regulated personal identifiers. The product enforces this in code (`src/lib/security/sensitive-upload-guard.ts`); the SOW confirms it on paper.
- [ ] **Infosec accelerator delivered** — `docs/security/INFOSEC-ACCELERATOR.md` shared with customer CISO/security architect at least 5 business days before kickoff.
- [ ] **Customer success metrics drafted** — at least three quantitative measures the customer will use to grade the pilot. See §3 and §5.

If any box is empty on T+0 morning, push the clock right. Don't burn the runbook on a soft start.

---

## 1. Three parallel swimlanes

The 14-day window only works if Legal, Technical, and Customer-facing run in parallel. Serial execution puts the pilot at week three minimum.

### 1a. Legal swimlane

| Step | Owner | ETA (relative to T+0) | Artifact |
|---|---|---|---|
| Execute MSA (or pilot short-form) | Both | T-7 → T+1 | Template stored in founder's Google Drive `legal/` (TBD: move to source-controlled template) |
| Execute DPA / data sharing addendum | Both | T+0 → T+3 | DPA template — short-form for pilot; full DPA for Production tier |
| Disclose sub-processors | AbarVa | T+0 | Sub-processor list in `INFOSEC-ACCELERATOR.md` §8 (Anthropic, OpenAI, Vercel, Supabase, Pinecone, Neo4j, Clerk, Resend, PostHog) |
| Customer signs off on data classification boundary | Customer | T+1 → T+3 | "No PHI/PII/full-PAN" attestation. Reference `evaluateSensitiveUpload` code path and the 5-class taxonomy in `INFOSEC-ACCELERATOR.md` §6 |
| Retention + deletion policy agreed | Both | T+1 → T+3 | Default: 90-day pilot retention; customer-triggered hard delete within 30 days of request. Documented in DPA addendum |
| Customer sign-off on accelerator doc | Customer CISO | T+3 → T+5 | Email or ticket from CISO referencing `INFOSEC-ACCELERATOR.md` version |
| E&O / cyber insurance evidence (if requested) | AbarVa | as requested | Certificate from carrier. Currently TBD — see D4 in backlog |

**Risk flag.** If the customer's third-party-risk process requires a SIG-Lite or CAIQ Lite questionnaire, the pre-filled CAIQ in the accelerator doc cuts ~3-5 business days off the cycle. Lead with it. Do not wait for the customer to ask.

### 1b. Technical swimlane

This is the choose-your-own path. Pick the deployment option at T+0; do not branch later.

#### Option A — SaaS managed (default for Pilot tier)

| Step | Owner | ETA | Artifact / Script |
|---|---|---|---|
| Reserve tenant key + slug | AbarVa | T+1 | Decision logged in `docs/pilot/` per-tenant subfolder. Convention: lowercase, no dash unless legacy. App ClientKey and broker key must match (see Apex precedent in memory) |
| Create Postgres tenant row | AbarVa | T+1 | `INSERT INTO tenants ...` per `docs/pilot/TENANT_SETUP_RUNBOOK.md` §1 |
| Create Clerk org + roles | AbarVa | T+1 → T+2 | Clerk dashboard. Roles: `client` (CXO), `advisor`, `admin`. Tied to tenant via `tenant_clerk_orgs` |
| Pin Clerk JWT template / `tenant_key` claim | AbarVa | T+2 | Clerk dashboard JWT templates. Verify `org_role` and `tenant_key` claims present. Already-shipped per audit cycle |
| Run migrations | AbarVa | T+2 | `npm run db:migrate` (dry-run first: `npm run db:migrate:dry`) |
| Seed tenant data substrate | AbarVa | T+3 → T+6 | **Today:** assemble 14-segment seed pack from `docs/enterprise-context/` template, load via `src/scripts/seed/`-flavored runner. **Soon (A2c, backlog):** `npm run tenant:bootstrap <key>` — TBD, not yet built. Until A2c lands, use the per-tenant script pattern proven by `seed:apex-intelligence` |
| Ingest Tier-1 (UI upload) docs | Customer + AbarVa | T+4 → T+7 | Customer uploads policy docs, org chart, exec narratives via `/data/upload`, `/tower/upload`, `/admin/upload-dataset`, etc. All 7 routes run `evaluateSensitiveUpload` after #1941 |
| Provision Tier-2 (Azure landing zone) | AbarVa | T+5 → T+8 | Per-tenant Azure Blob container with private endpoint + customer SAS. **TBD: Bicep module for the landing zone is backlog A2b — not yet shipped.** Pilot can run on Tier-1 alone for the first 14 days |
| Rebuild broker / cache | AbarVa | T+7 | Trigger broker substrate rebuild. Capture verification report |
| Verify 15 coverage tiles + 6 enterprise-context cards render | AbarVa | T+7 | Manual smoke + automated probes (A1). `/intelligence#enterprise-context` shows full set for the tenant; cross-tenant access returns 403 |
| Run cross-tenant 403 probe suite | AbarVa | T+8 | 8 SEC-P0 probes from #1923 B-agent run as a curl-based regression. Failure here is a stop-the-line |
| Configure tenant-specific feature gates | AbarVa | T+8 | Per A3 contract — what ships to all tenants vs pinned to this one |

#### Option B — In-VPC (B4, Enterprise tier)

| Step | Owner | ETA | Artifact / Script |
|---|---|---|---|
| Customer provisions Azure subscription + RG | Customer | T+1 → T+3 | Per customer's landing-zone policy |
| Customer creates federated service principal for AbarVa deploy | Customer | T+3 → T+5 | OIDC federation preferred over secrets |
| Deploy Bicep stack into customer subscription | AbarVa | T+5 → T+8 | **TBD: production Bicep modules are backlog B4 — not yet shipped.** Today: hand-port from `docs/deployment/AZURE_PRIVATE_DATA_PLANE_LAB_RUNBOOK.md` (AZLAB5) + #1938 (Container Apps) + #1940 (private Postgres Flexible Server, eastus2) |
| Resources deployed: Postgres Flexible Server, Key Vault, Blob landing zone, Container Apps, Log Analytics, Application Insights, private endpoints, customer-controlled keys | AbarVa | T+5 → T+8 | All resources in customer subscription; AbarVa holds only deploy-time service principal |
| Run migrations against customer Postgres | AbarVa | T+8 | `DATABASE_URL` points to customer Flexible Server; `npm run db:migrate` |
| Same seed → broker → verify path as Option A from T+3 onward | Both | T+8 → T+12 | Compressed window — Option B usually slips to T+18; do not promise 14 days |
| Customer-side smoke test (their network, their auth, their endpoints) | Customer | T+12 | Customer signs off that data plane is healthy |

**Honest note on Option B.** B4 Bicep modules are not yet productized. Today, an in-VPC deployment is an artisanal port of the AZLAB5 lab plus the two real production PRs (#1938, #1940). Plan for that until B4 closes. If a customer demands in-VPC for the pilot, push hard for SaaS managed for the pilot and in-VPC for the production conversion — it's a more honest pitch and a faster path to a real CXO using the product.

### 1c. Customer-facing swimlane

| Step | Owner | ETA | Notes |
|---|---|---|---|
| Identify CXO + supporting roster | Customer | T+0 → T+2 | At minimum: 1 CXO sponsor + 2 lieutenants (the people who'll prep questions for the CXO). Map to AbarVa roles: `client` for CXO, `advisor` for lieutenants |
| Kickoff call (60 min) | Both | T+1 | Agenda: walk the 4 surfaces (Intelligence / Moves / Source / Tower), name the agent-readiness expectations (Sentinel L2, Atlas L3, Steward L1), confirm success criteria |
| Data-prep session with customer ops/strategy team | Both | T+2 → T+4 | What's getting uploaded, in which tier, by whom, by when. Owner on customer side identified |
| Pilot-period success criteria signed off | Both | T+3 | Written, in the SOW addendum. See §3 acceptance criteria |
| Training session 1 — orientation (30 min) | AbarVa | T+9 | Walk the 4 surfaces with tenant data live. Show the Ask-Anything bottom toolbar; emphasize that Sentinel answers from tenant-grounded data |
| Training session 2 — CXO 1:1 (45 min) | AbarVa | T+11 | Founder + CXO. Have the CXO ask 3 real questions live. This is the moment that decides whether the pilot survives |
| Office hours (30 min, twice in first 2 weeks) | AbarVa | T+12, T+13 | Ad-hoc Q&A. Catch the "I don't know what to ask" objection early |
| Go-live | Customer | T+14 | CXO logs in unsupervised and asks Sentinel a real question. Logged, captured, debriefed |

Agent-readiness expectations to set explicitly during training:

- **Sentinel** (Source / Intelligence front agent) — L2. Reasons over tenant context + industry corpus. Cites sources. Will sometimes disagree with the user.
- **Atlas** (Tower) — L3. Asset-graph aware. More structured, less conversational.
- **Steward** (Setup / admin) — L1. Configuration helper. Not for CXO use.
- **Nexus** (Moves) — workflow agent. CXO sees it in flow, not as a chat target initially.

---

## 2. Day-by-day timeline (T+0 → T+14)

| Day | Milestone | Critical path | Slip indicator |
|---|---|---|---|
| **T+0** | SOW signed; runbook clock starts | All pre-conditions in §0 green | Any §0 box empty |
| **T+1** | Kickoff call held; tenant row created in Postgres; Clerk org created | Legal + Technical lanes both moving | Customer hasn't named CXO |
| **T+2** | DPA executed; Clerk JWT pinned; migrations applied | Customer CISO has received accelerator doc | DPA in legal review with no ETA |
| **T+3** | Data-prep session held; retention policy agreed; success criteria signed | Seed segments inventoried with customer | Customer ops team unreachable |
| **T+4** | First Tier-1 uploads begin; seed assembly in progress | `evaluateSensitiveUpload` log clean | Sensitive-data quarantine hit — escalate, do not bypass |
| **T+5** | Seed assembly ~50% complete; (Option B) Bicep deploy starting | Broker dry-run shows partial substrate | Customer can't get docs to us |
| **T+6** | Seed assembly complete; broker rebuild kicked off | All 14 segments loaded; broker process logging clean | Broker rebuild errors — investigate, do not retry blindly |
| **T+7** | All 15 coverage tiles + 6 enterprise-context cards rendering for the tenant | Manual smoke green | Tiles render empty — substrate gap |
| **T+8** | 8 SEC-P0 cross-tenant probes pass; feature gates configured; (Option B) customer-side resources up | Regression suite green | Any 403 probe fails — STOP, do not proceed |
| **T+9** | Training session 1 (orientation); dry-run with internal user playing CXO | Recording captured for re-use on customer #2 | Dry-run reveals a UX gap — fix before T+11 |
| **T+10** | Internal CXO-simulation; fix anything that surfaces | Agent answers are tenant-grounded, cite-able, defensible | Sentinel hallucinates or pulls cross-tenant — STOP |
| **T+11** | CXO 1:1 training | CXO asks 3 real questions; we observe and debrief | CXO confused by primary nav — workflow-anchor confusion |
| **T+12** | Office hours #1; address polish | Punch-list closed | Substantive blocker found |
| **T+13** | Office hours #2; readiness review | Go-live checklist green | Customer escalation un-handled |
| **T+14** | **Go-live.** CXO logs in unsupervised, asks at least one real, tenant-grounded question. Founder watches the session (with consent) | Acceptance criteria in §3 all green | Anything in §3 not green = pilot kickoff slipped, not failed; reset to T+15 with explicit re-baseline |

---

## 3. Acceptance criteria — "pilot is kicked off"

All of the following must be true on T+14 to declare kickoff complete:

- [ ] Tenant data substrate populated — 14 seed segments loaded, broker rebuild completed without errors.
- [ ] `/intelligence#enterprise-context` renders all 15 coverage-by-domain tiles **and** all 6 synthesized cards for the tenant.
- [ ] 8 SEC-P0 cross-tenant probes return 403 (or equivalent reject) from a non-tenant session. Curl transcript filed in the per-tenant pilot folder.
- [ ] All 7 upload routes verified to call `evaluateSensitiveUpload` (regression — should already be green from #1941).
- [ ] At least one CXO (role: `client`) has logged in via real Clerk auth, navigated to Intelligence, and asked Sentinel at least one question that pulls from the tenant's substrate (not the shared corpus).
- [ ] Sentinel's answer to that question was tenant-grounded, defensible, and either correct or surfaced an honest "I don't have that" rather than a hallucination.
- [ ] Success metrics (3+ measures) signed off by both AbarVa and customer.
- [ ] Pilot end-date + production-conversion criteria documented in writing.
- [ ] Incident contact + escalation path documented and shared with the customer.

If any box is unchecked, the pilot is **provisioned but not kicked off**. Do not claim kickoff in a board update or LinkedIn post until every box is green.

---

## 4. Risks + mitigations

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| **1** | Customer infosec review takes > 14 days | High | Lead with `INFOSEC-ACCELERATOR.md` at SOW signature, not at kickoff. Pre-filled CAIQ + posture doc shortens cycle. Offer a 30-min call with the CISO before T+0 if needed |
| **2** | Customer data substrate incomplete or low-quality at T+6 | High | Tier-1 UI upload path is the day-of escape valve — `evaluateSensitiveUpload` runs on every upload, so even rushed customer-side delivery is safe. Have the founder personally walk the customer through the upload UI in the data-prep session at T+3 |
| **3** | Azure quota / region issues (per #1940 eastus2 lesson — Flexible Server SKU quota varies by region) | Medium | Pre-flight check on the target subscription before T+5. For Option B, confirm customer subscription has Flexible Server quota in their chosen region before promising a date |
| **4** | Clerk JWT misconfig — tenant claim missing or wrong role | Medium | Verification step at T+2: log in as a test user and decode the JWT. Confirm `tenant_key` and `org_role` claims. Already-shipped fix from audit cycle prevents the worst case (locked-role rebinding) at the resolver |
| **5** | Broker substrate rebuild fails or hangs | Medium | Always run on a non-production-pinned tenant first. If it fails, do not retry blindly — read the error, fix the seed gap, rerun. Capture verification report so customer #2 inherits the fix |
| **6** | In-VPC (Option B) deploy slips because B4 Bicep modules don't exist yet | High (for Option B only) | Push SaaS managed for pilot, in-VPC for production conversion. If customer insists on in-VPC for pilot, set T+21 as the realistic date |
| **7** | CXO doesn't show up to training | Medium | Tied to §0 pre-condition: if the CXO isn't named and committed before T+0, you don't have a pilot |
| **8** | Sentinel hallucinates or pulls cross-tenant | Low (post-audit) | Caught by T+10 dry-run. The 8 SEC-P0 probes + tenant-grounding in the broker contract make this unlikely but not impossible. STOP-the-line if observed |

---

## 5. What "done" looks like

The runbook's job is kickoff. "Pilot success" is the next bar, measured at T+90:

- **Usage.** CXO has logged in and used AbarVa at least **3 times per week** in 8 of the 12 pilot weeks. Use PostHog to verify, not self-report.
- **Question quality.** At least **10 tenant-grounded questions** asked of Sentinel across the pilot, with at least one quote-worthy answer the CXO would use in front of their board.
- **Move outcome.** At least one strategic move evaluated, sequenced, or governed through AbarVa that wouldn't have happened (or would have happened later or worse) without the product.
- **Renewal signal.** Customer has signed either a production-conversion contract **or** an extended pilot SOW. A non-renewal that comes with detailed feedback is a worse-than-renewal outcome but better than silence.
- **Reference-ability.** Customer is willing to take a 30-min call with one named prospect at the founder's request. Logged in writing.

If 3 of 5 are green at T+90, this is a successful pilot. If 1 or 0 are green, debrief honestly, write the lessons into this runbook, and don't carry the customer past the SOW end date for ego reasons.

---

## 6. Repeatability checklist

Customer #2 must onboard faster than customer #1. The runbook is only as good as the artifacts it points at. Each step below names the artifact responsible for the step being reproducible.

| Step | Today's artifact | Future artifact / gap |
|---|---|---|
| Tenant Postgres row | `docs/pilot/TENANT_SETUP_RUNBOOK.md` §1 | Wrap into `tenant:bootstrap` (A2c, TBD) |
| Clerk org + JWT | Clerk dashboard, manual | Scripted via Clerk API in `tenant:bootstrap` (A2c, TBD) |
| Migrations | `npm run db:migrate` | (shipped) |
| Seed pack assembly | `docs/enterprise-context/` template + per-tenant `src/scripts/seed/` runner (Apex precedent) | Generic `tenant:bootstrap <key>` covering the 14-segment load (A2c, TBD) |
| Broker rebuild | manual trigger | Wrapped in `tenant:refresh` (A2c, TBD) |
| Tier-1 upload | `/data/upload`, `/tower/upload`, `/admin/upload-dataset`, `/programs/[id]/attachments/upload`, `/v1/source/[eventId]/artifacts/upload`, `/programs/workspace/[moveId]/upload`, `/v1/nexus/upload` (all 7 covered post-#1941) | (shipped) |
| Tier-2 Azure landing zone | none — Tier-1 only for pilot | Bicep module + scheduled pickup job (A2b, TBD) |
| Cross-tenant 403 probes | curl scripts from PR #1923 B-agent | Promote to permanent regression in `npm run test:e2e` (A1, in flight) |
| Sensitive-data scan | `src/lib/security/sensitive-upload-guard.ts` | + Purview integration (B5b, TBD) and quarantine dashboard (B5c, TBD) |
| In-VPC deploy | hand-port from AZLAB5 lab + #1938 + #1940 | Productized Bicep modules per customer (B4, TBD) |
| Infosec review | `docs/security/INFOSEC-ACCELERATOR.md` (shipped #1943) | (shipped) |
| Training session 1 | live; founder-delivered | Recorded; reusable for customer #2 (record at T+9 of customer #1) |
| CXO 1:1 | live; founder-delivered | Stays live — this is the high-touch moment, intentionally not automated |
| Acceptance verification | manual checklist in §3 | Scripted via `tenant:verify` (extension of A2c, TBD) |

**Backlog gaps to close before customer #3.** A2b (Azure landing zone), A2c (bootstrap/refresh scripts), B4 (in-VPC Bicep), B5b (Purview), B5c (quarantine dashboard). Each is open in `docs/BACKLOG-2026-05-14.md`. The runbook will be revised when each lands.

---

*Revise after every pilot. Date-stamp each revision. The single hardest thing in a pre-seed company is making the second customer easier than the first; this doc is the receipt for whether we're doing that.*
