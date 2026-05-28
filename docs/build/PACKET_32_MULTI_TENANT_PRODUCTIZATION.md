# Packet 32 — Multi-Tenant Productization Roadmap

**Author:** AbarVa Founder
**Created:** 2026-05-28
**Status:** Standing roadmap — execute in tiers, refresh quarterly
**Companion to:** Packets 28 (substrate), 29 (demo), 30 (architectural fix), 31 (constitution + operating model)

---

## 0. Why this packet exists

Packet 30 fixes today's bleeding (consolidation).
Packet 31 prevents tomorrow's bleeding (invariants + operating model).
**Packet 32 is everything else** — the full set of gaps that stand between "Delta CTO demo works" and "AbarVa is a real multi-tenant SaaS company with 25 customers."

It is comprehensive on purpose. Read it once to know the full territory. Then execute by tier — P0 blocks today's customers, P4 is quality-of-life.

This packet is **not a single-pass execution brief like Packet 30.** It's a standing roadmap. Items move from "queued" to "in progress" as customer commitments demand. Items get added as the company learns.

---

## 1. The 13 Gap Categories (comprehensive enumeration)

Every gap that exists between current state and "scalable multi-tenant SaaS" falls into one of these:

| # | Category | Why it matters |
|---|---|---|
| **C1** | **Per-tenant substrate state** | Different tenants are in different Azure-load states; new coverage contract reveals gaps |
| **C2** | **Industry pattern overlay library** | Only airline exists; healthcare/retail/financial-services overlays don't |
| **C3** | **Tenant lifecycle management** | T1→T2→T3→T4 promotion, decommissioning, demo-tenant cleanup |
| **C4** | **Customer-facing admin capabilities** | T3/T4 customers need their own admin UI, audit access, user management |
| **C5** | **Connector library (real data ingestion)** | Demo substrate is synthetic; production customers provide real ServiceNow/Workday/SharePoint data |
| **C6** | **Operational maturity** | Per-tenant monitoring, cost tracking, alerting, SLA reporting |
| **C7** | **Engineering maturity** | Prompt/model versioning, A/B testing, agent observability, continuous learning |
| **C8** | **UI / UX completeness** | 404 routes, missing screens, mobile/accessibility |
| **C9** | **Compliance per tenant** | HIPAA / SOX / BAA / DPA / audit retention per regulated tenant |
| **C10** | **Sales engineering enablement** | Demo personas, ROI calculator, value tracking, customer-shape templates |
| **C11** | **Documentation generation** | API docs, schema docs, tenant catalog, architecture diagrams |
| **C12** | **Customer success infrastructure** | Adoption scorecards, health metrics, renewal tracking, in-app feedback |
| **C13** | **Security & DR per tier** | Backup, DR, key management, vulnerability scanning, pen-test cadence |

Sections 2–14 detail each category, scope it, prioritize it, and sequence it.

---

## 2. Category C1 — Per-Tenant Substrate State

### What's broken

Every tenant currently has unknown substrate completeness against the new architecture (Packet 30 coverage contract):

| Tenant | Origin | Current Azure state | Risk |
|---|---|---|---|
| SkyHarbor Air | Codex (Packet 28) | ✅ Fully loaded, 3,240 chunks, 100% embedded | None |
| Apex Retail | Original (pre-Azure migration) | ⚠️ Multi-tenant load attempted; state unverified | Phase 6 verifier may fail |
| Meridian Health | Original (pre-Azure migration) | ⚠️ Same | Phase 6 verifier may fail |
| First Capital | Original (pre-Azure migration) | ⚠️ Same | Phase 6 verifier may fail; not in Phase 6 gate |
| Northstar Clinical | Original (Packet 24-era) | ⚠️ Same; has Northstar pattern overlay | Phase 6 verifier may fail; not in Phase 6 gate |

### The work

**Phase A — Audit (read-only, kick off in parallel with Packet 30 Phase 0):**
1. Query each tenant's row count per segment in Azure
2. Query each tenant's embedding completeness (vectors per chunk)
3. Sample 10 chunks per tenant, verify fact-fingerprint integrity
4. Verify each tenant's RLS isolation (cross-tenant query returns 0)
5. Produce `verification/MULTI_TENANT_STATE_AUDIT.md` with per-tenant scorecard

**Phase B — Substrate-segment-to-coverage-contract alignment:**
1. For each tenant, map existing segments to the Packet 30 coverage contract
2. Identify which Tier-1 question categories the tenant supports vs doesn't
3. Decide per tenant: refresh, augment, or accept partial coverage
4. Document tenant-specific question taxonomies (e.g., Apex doesn't need IBM_DEPENDENCY)

**Phase C — Refresh execution (per tenant, in priority order):**
1. Re-author missing segments using Packet 28 pattern
2. Run Azure private load per `AZURE_PRIVATE_LOAD_RUNBOOK.md`
3. Verify with the rebuilt Packet 30 Phase 4 verifier
4. Update tenant config record (Packet 31 §2.4)

### Priority tier: **P0 for SkyHarbor (done), P1 for tenants in active sales conversations, P2 for legacy demo tenants**

### Acceptance gates

- [ ] `MULTI_TENANT_STATE_AUDIT.md` exists and reviewed
- [ ] Each "active sales" tenant scores ≥18/25 on Tier-1 verifier (matching Packet 30 Phase 6 bar)
- [ ] Each tenant has explicit "tier assignment" (T1 demo / T2 pilot / T3 dedicated / T4 BYOC) per Packet 31 §2.1
- [ ] Legacy tenants without active sales path are explicitly marked "deprecated" or "frozen"

---

## 3. Category C2 — Industry Pattern Overlay Library

### What's broken

Only the airline overlay exists (Packet 31's 184 packs / 2,760 patterns for SkyHarbor). Every other industry tenant runs without domain-grounded reasoning, meaning Sentinel sounds generic for their use cases.

### The work — what overlays we need

| Industry | Existing tenants | Customer prospects | Overlay status |
|---|---|---|---|
| **Airline** | SkyHarbor | Delta | ✅ Built (Packet 31) |
| **Healthcare provider** | Meridian, Northstar | PHS | ❌ Not built; PHS-critical |
| **Healthcare payer** | (none) | (PHS PHP business) | ❌ Not built; PHS-critical |
| **Retail / e-commerce** | Apex | (none active) | ❌ Not built; defer |
| **Financial services — banking** | First Capital | (none active) | ❌ Not built; defer |
| **Financial services — insurance** | (none) | (none active) | ❌ Not built; defer |
| **Manufacturing** | (none) | (potential) | ❌ Not built; defer |
| **Energy / utilities** | (none) | (potential) | ❌ Not built; defer |
| **Government / public sector** | (none) | (potential) | ❌ Not built; defer |
| **Education / higher ed** | (none) | (potential) | ❌ Not built; defer |
| **Cross-industry** (workforce, finance, ESG, sourcing, cyber) | All | All | ✅ Partially in airline overlay; needs extraction |

### Architecture for the overlay library

```
src/lib/pattern-overlays/
├── core/                          # Cross-industry packs
│   ├── workforce/                 # HR, talent, GCC, productivity
│   ├── finance/                   # Treasury, P&L, ROI, capex
│   ├── sourcing/                  # Vendor mgmt, RFP, negotiation
│   ├── cybersecurity/             # Threat landscape, frameworks
│   ├── compliance/                # SOX, GDPR, common regulations
│   └── sustainability/            # ESG, net zero, reporting
├── industries/
│   ├── airline/                   # SkyHarbor-style (Packet 31)
│   ├── healthcare-provider/       # PHS-style (TO BUILD)
│   ├── healthcare-payer/          # PHP-style (TO BUILD)
│   ├── retail/                    # Apex-style (TO BUILD)
│   ├── banking/                   # First Capital-style (TO BUILD)
│   └── ...
└── overlay-loader.ts              # Loads packs into tenant context
```

Tenant config (Packet 31 §2.4) declares which overlays apply:
```ts
patternOverlays: ['core', 'industries/healthcare-provider', 'industries/healthcare-payer']
```

### Healthcare-provider overlay — scope for PHS-readiness

Modeled on Packet 31's 184-pack structure. Target ~150 packs / ~2,250 patterns across:

- **A. Patient care delivery** (clinical operations, care pathways, quality metrics)
- **B. Revenue cycle management** (claims, reimbursement, denials)
- **C. Population health** (risk stratification, care management, social determinants)
- **D. Provider operations** (physician productivity, scheduling, staffing)
- **E. Pharmacy & supply chain**
- **F. Imaging & diagnostics**
- **G. Inpatient operations** (length of stay, throughput, readmissions)
- **H. Outpatient & ambulatory operations**
- **I. Emergency department operations**
- **J. Health IT estate** (Epic / Cerner / Meditech / Allscripts patterns)
- **K. Interoperability** (FHIR, HL7, CommonWell, Carequality)
- **L. AI in healthcare** (clinical AI, ambient documentation, admin AI)
- **M. Cybersecurity for healthcare** (HIPAA, ransomware patterns)
- **N. Regulatory** (HIPAA, HITECH, MACRA, CMS rules, state regulations)
- **O. Value-based care** (ACO, capitation, bundled payments)
- **P. Workforce** (nursing shortage, provider burnout)
- **Q. Patient experience**
- **R. Finance** (margins, charity care, 340B)
- **S. Strategy** (M&A in healthcare, vertical integration, payvider models)
- **T. Emerging** (Hospital-at-home, AI scribes, virtual care)

### Priority tier: **P0 for healthcare-provider overlay (PHS), P3 for retail/banking (no active sales)**

### Acceptance gates

- [ ] Overlay library architecture in place (`src/lib/pattern-overlays/`)
- [ ] Core cross-industry packs extracted from airline overlay
- [ ] Healthcare-provider overlay ≥120 packs / ≥1,800 patterns authored
- [ ] Healthcare-payer overlay scaffolded (40+ packs) for PHS's PHP business
- [ ] Tenant config schema accepts `patternOverlays: string[]`
- [ ] Coverage contract (Packet 30 Phase 3) extended for healthcare question categories

---

## 4. Category C3 — Tenant Lifecycle Management

### What's broken

There's no formal lifecycle. Demo tenants accumulate, paying-customer tenants need explicit promotion, decommissioning is ad-hoc.

### The work

**Tenant states (formalized):**

```
[Created]
   ↓
[Demo — T1]            (active sales, not paying)
   ↓
[Pilot — T2]           (paying, shared infra, time-boxed)
   ↓
[Production — T3]      (paying, dedicated infra, multi-year contract)
   ↓
[BYOC — T4]            (customer-cloud)

— OR —

[Frozen]               (no active sales, preserve for reference)
   ↓
[Deprecated]           (scheduled deletion)
   ↓
[Deleted]              (data purged per retention policy)
```

**Each state transition needs:**

1. **Demo → Pilot:** SOW signed, billing setup, tenant config updated, Stripe customer linked, kickoff scheduled
2. **Pilot → Production:** Renewal contract signed, T3 infrastructure provisioned per Packet 31 §2.5, substrate migrated, customer admin UI provisioned
3. **Production → BYOC:** Customer infra accepts our Helm/Terraform bundle per Packet 31 §2.6, secrets handed off, runtime cut over
4. **Any → Frozen:** Customer churn or sales pause; tenant data preserved, no AI egress allowed, no users active
5. **Frozen → Deprecated:** 12+ months frozen, no renewal expected; queue for deletion
6. **Deprecated → Deleted:** Retention period expired; hard delete with audit trail

**Tooling needed:**

- `scripts/tenant-lifecycle/promote.mjs` — handles each transition
- `scripts/tenant-lifecycle/freeze.mjs`
- `scripts/tenant-lifecycle/deprecate.mjs`
- `scripts/tenant-lifecycle/delete.mjs` (with explicit founder confirmation)
- Admin dashboard view of all tenants by state
- Quarterly lifecycle review (which T1 demos should freeze; which frozen should deprecate)

### Priority tier: **P1 (needed before first paying customer signs)**

### Acceptance gates

- [ ] Tenant state field added to tenant config schema
- [ ] Promotion scripts working for at least T1→T2 (Packet 31 §2.5 referenced)
- [ ] Admin view shows all tenants by state
- [ ] Existing tenants classified (SkyHarbor=Demo, Apex/Meridian/First Capital/Northstar=Demo or Frozen, PHS=Demo→Pilot)

---

## 5. Category C4 — Customer-Facing Admin Capabilities

### What's broken

Right now AbarVa staff (you) can see and configure everything. T3/T4 customers can't:
- See their own audit log
- Manage their own users
- Configure their own modules / overlays
- Export their own data
- Manage their own integrations
- Set their own notification preferences

This is a blocker for PHS (T3/T4) — InfoSec will require it.

### The work — customer admin scope

**Phase 1 — Read-only customer admin UI:**
- `/admin/customer` route — only accessible to users with `customer-admin` role
- Audit log view (filtered to their tenant)
- User list (their tenant's users only)
- AI egress audit (their tenant only)
- Cost / usage dashboard (their tenant only)
- Substrate inventory (what segments are loaded, what overlays are active)
- Module enablement view (read-only)

**Phase 2 — Customer self-service:**
- Invite users (provision Clerk users into their tenant)
- Configure user roles (customer-admin, user, viewer)
- Enable/disable modules
- Configure notification preferences
- Export audit log (CSV)
- Request data export (their tenant data, GDPR/HIPAA aligned)
- Request data deletion (with confirmation flow)

**Phase 3 — Customer-managed integrations:**
- Connect their data sources (per C5 connector library)
- View ingestion status
- Schedule refresh cadence
- Manage API keys (for their own programmatic access)

### Architecture

```
src/app/customer-admin/
├── layout.tsx                     # Customer admin shell, gates by role
├── audit/page.tsx
├── users/page.tsx
├── usage/page.tsx
├── modules/page.tsx
├── integrations/page.tsx
├── data-export/page.tsx
└── settings/page.tsx
```

Distinct from `/admin` (AbarVa staff superadmin).

### Priority tier: **P0 for Phase 1 read-only (PHS pilot will require it). P1 for Phase 2 self-service. P2 for Phase 3 integrations.**

### Acceptance gates

- [ ] Customer admin role exists in Clerk + RBAC
- [ ] Phase 1 read-only routes functional
- [ ] Cross-tenant isolation verified for every customer admin route
- [ ] PHS pilot can demo "show me my audit log"

---

## 6. Category C5 — Connector Library (Real Data Ingestion)

### What's broken

Current substrate workflow: AbarVa engineers (Codex) author synthetic data per Packet 28. **This doesn't scale to real customers.** PHS, Delta, and any production customer will provide their own data.

### The work — connector library

**Source systems to support (prioritized):**

| Source | Customer urgency | Connector approach |
|---|---|---|
| **CSV / Excel upload** | All customers (lowest-bar) | File upload UI, schema mapper, batch loader |
| **ServiceNow CMDB** | Delta, PHS, most enterprises | REST API connector, scheduled sync |
| **Workday HCM** | All enterprises | REST API connector |
| **Microsoft SharePoint / OneDrive** | All enterprises | MS Graph API connector |
| **Google Drive** | Mid-market | Google API connector |
| **Salesforce** | Sales-heavy customers | REST API connector |
| **Coupa / Oracle Procurement** | Finance-led use cases | REST or batch export |
| **Jira / Asana / Monday** | Tech-led use cases | REST API connector |
| **Confluence / Notion** | Documentation-heavy | REST API connector |
| **Slack / Teams** | Communication mining | OAuth + Graph API |
| **Email** (M365 / Gmail) | All customers | OAuth + IMAP/Graph |
| **Custom REST API** | Bespoke customer systems | Generic connector framework |
| **CDC from customer DB** | Production-grade integrations | Debezium / Azure DMS |

**Architecture:**

```
src/lib/connectors/
├── framework/
│   ├── BaseConnector.ts           # Abstract base
│   ├── ConnectorRegistry.ts       # Tenant → enabled connectors
│   ├── SyncOrchestrator.ts        # Schedules and runs syncs
│   └── SchemaMapper.ts            # Maps source → AbarVa substrate
├── implementations/
│   ├── csv-upload/
│   ├── servicenow-cmdb/
│   ├── workday-hcm/
│   ├── sharepoint/
│   └── ...
└── __tests__/
```

**Each connector provides:**
- OAuth or API key flow
- Schema discovery
- Mapping to AbarVa substrate segments
- Initial sync
- Incremental sync (CDC where supported, batch where not)
- Sync status reporting
- Error handling with retry
- Data quality validation
- Per-tenant audit log

### Priority tier: **P0 for CSV upload (PHS pilot will need it). P1 for ServiceNow CMDB + Workday (top enterprise asks). P2 for SharePoint + Salesforce. P3 for everything else.**

### Acceptance gates

- [ ] Connector framework in place with at least 2 reference implementations
- [ ] CSV upload working end-to-end (user uploads → schema maps → chunks generated → embedded → searchable)
- [ ] ServiceNow CMDB connector for at least one customer
- [ ] Sync orchestrator runs scheduled syncs
- [ ] Audit log captures every sync

---

## 7. Category C6 — Operational Maturity

### What's broken

There's currently no answer to:
- "Is customer X's tenant healthy right now?"
- "What's our P50/P95/P99 latency by tenant?"
- "How much AI cost is customer Y generating?"
- "Did we hit the SLA we promised customer Z this month?"
- "Why did the verifier regress last night?"

### The work — operational infrastructure

**Phase 1 — Observability foundation:**

- **Structured logging:** Every request log includes `tenantKey`, `userId`, `route`, `latencyMs`, `status`. Use Vercel logs + Azure Log Analytics.
- **Distributed tracing:** OpenTelemetry spans for `request → tenant resolve → retrieval → model call → response`. Vercel Functions support this natively.
- **Per-tenant dashboards:** Grafana or Datadog dashboards: request volume, latency, error rate, AI cost — segmented by tenant.
- **Alerts:**
  - P0: tenant-bleed attempt detected (immediate page)
  - P0: 5xx error rate >1% sustained for 2 min
  - P1: p95 latency >12s sustained for 5 min
  - P1: AI cost per tenant > daily budget × 1.5
  - P2: substrate sync failure

**Phase 2 — Cost tracking:**

- Per-tenant AI egress cost in `ai_egress_audit` (already exists per Packet 31 I6)
- Daily cost rollups by tenant in admin dashboard
- Cost alerts at customer-specific budget thresholds
- Cost reports for invoicing

**Phase 3 — SLA reporting:**

- Per-tenant SLA scorecard: uptime, p95 latency, incident response time, MTTR
- Monthly customer-facing SLA report (auto-generated)
- Service credit calculation if SLA missed (per Packet 29 SLO commitments)

**Phase 4 — Incident management:**

- `docs/operations/INCIDENT_RESPONSE.md` runbook (already in Packet 31 §5.3)
- PagerDuty or similar for on-call rotation
- Status page (status.abarva.ai) — public per-tenant or aggregate
- Post-mortem template + cadence

### Priority tier: **P0 for Phase 1 (alerts on tenant-bleed). P1 for Phase 2-3 cost + SLA. P2 for Phase 4 incident management.**

### Acceptance gates

- [ ] All requests log structured fields including tenant context
- [ ] Tenant-bleed alert is wired and tested (simulated cross-tenant query fires the alert)
- [ ] Per-tenant cost dashboard exists for AbarVa staff
- [ ] Monthly SLA report generated for PHS pilot

---

## 8. Category C7 — Engineering Maturity (AI-Specific)

### What's broken

We treat prompts, models, and agent behavior as code-with-magic-numbers. That doesn't scale. Specifically:

- System prompts are inline strings in code; no version control of the prompt content as a separate concept
- No way to A/B test prompt changes
- No regression test for "did my prompt change break Q5?"
- No model versioning strategy (what if Claude 5 lands and we want to test it for one tenant?)
- No agent reasoning observability (when Sentinel returns "data unavailable," why?)
- No continuous learning loop (failed retrievals don't feed back into improvement)

### The work — AI engineering infrastructure

**Phase 1 — Prompt versioning as code:**

- `src/lib/prompts/` directory
- One file per agent prompt with versioned name: `sentinel-system-v3.ts`
- Active version selected by config
- All prompt changes go through ADR if architectural (Packet 31 §3.3)
- Regression tests: each prompt version paired with a fixture suite of "this prompt should produce these citations"

**Phase 2 — Model versioning:**

- Model client interface (per Packet 31 I3) supports model selection per tenant
- Tenant config: `models: { sentinel: 'claude-sonnet-4-5', embedding: 'voyage-3-large' }`
- A/B test framework: run a question against two model versions, score, log
- Quarterly model review: should we move tenants to a newer model?

**Phase 3 — Agent observability:**

- Sentinel reasoning trace: capture every decision (which retriever, which sources, which patterns invoked, why)
- Internal admin view: "show me the reasoning for question X"
- Customer-facing: optional "show your work" toggle in Intelligence UI
- Helps with debugging, customer trust, and continuous improvement

**Phase 4 — Continuous learning loop:**

- Capture failed retrievals (CoverageReport.missing > 0)
- Capture customer feedback (thumbs up/down on answers)
- Capture verifier failures
- Aggregate weekly into "patterns to improve"
- Feed back to substrate / overlay / prompt improvements

**Phase 5 — Multi-agent coordination (Sentinel + Atlas + Steward per Packet 31):**

- Define agent boundaries
- Shared context bus
- Hand-off protocols
- Multi-agent traces

### Priority tier: **P1 for Phase 1 prompt versioning. P2 for Phase 2-3 model + observability. P3 for Phase 4-5 continuous learning + multi-agent.**

### Acceptance gates

- [ ] Prompts live in `src/lib/prompts/` with semantic versioning
- [ ] At least one prompt has a regression test
- [ ] Tenant config selects models explicitly
- [ ] Sentinel reasoning trace captured and viewable in admin

---

## 9. Category C8 — UI / UX Completeness

### What's broken (per residual Codex notes and prior memory entries)

- 404 routes scattered across Tower / Admin / various
- Some routes are stubs with no functionality
- Inconsistent design language across modules
- No mobile experience
- No accessibility audit
- Clerk prefetch CORS noise on `/architecture` and `/learn` (recently observed)
- Some modules feel "demoware" — not production-ready

### The work — UI sweep

**Phase 1 — Route inventory and remediation:**

- Crawl every route, classify: working / stub / 404 / inconsistent
- For each non-working route: either build it, delete it, or stub it cleanly
- No route returns 404 from a navigation flow in the product
- Stubs say "coming soon" with timeline, not a JavaScript error
- Documented in `docs/build/ROUTE_OWNERSHIP_MAP.md` (already exists; needs refresh)

**Phase 2 — Design system consolidation:**

- Per memory `design_system.md`: locked palette, typography, components
- Audit all pages for design consistency
- shadcn/ui consolidation per Vercel best practices

**Phase 3 — Mobile experience:**

- Audit responsive design
- Define "what works on mobile" — probably: read-only Intelligence answers, signing in, viewing audit log
- Defer interactive Moves/Source/Tower editing to desktop-only

**Phase 4 — Accessibility:**

- WCAG 2.1 AA target
- Screen reader audit
- Keyboard navigation audit
- Color contrast verification

**Phase 5 — Performance:**

- Per-page bundle size budget
- Core Web Vitals monitoring
- Lighthouse audit per major route

### Priority tier: **P1 for Phase 1 (404 remediation — affects every demo). P2 for Phase 2-5.**

### Acceptance gates

- [ ] Zero 404s in main demo flows for any tenant
- [ ] Design system enforced (per `design_system.md` lock)
- [ ] Phase 29 demo walkthrough completes without UI surprises

---

## 10. Category C9 — Compliance per Tenant

### What's broken

We have no per-tenant compliance scaffolding. PHS will ask Day 1.

### The work — compliance infrastructure

**Per-tenant compliance profile:**

```ts
// tenant config addition
compliance: {
  hipaa: { applicable: true, baaSignedDate: '...', baaExpiry: '...' },
  sox: { applicable: false },
  gdpr: { applicable: true, dpaSignedDate: '...' },
  pciDss: { applicable: false },
  retention: {
    auditLogs: '7y',
    operationalLogs: '30d',
    customerData: 'per-request',
  },
  dataResidency: 'us-east',
  encryptionKeyOwnership: 'customer-managed', // or 'abarva-managed'
}
```

**Compliance artifacts per regulated tenant:**

- BAA / DPA execution date and renewal tracking
- Compliance attestations (annual)
- Pen-test reports
- Vulnerability scan reports
- SOC 2 Type II attestation (when we get one)
- HIPAA risk assessment (per HHS template)

**Compliance reviews:**

- Quarterly InfoSec review per regulated tenant
- Annual third-party audit (path to SOC 2)
- Continuous monitoring via tools (already in C6)

**Customer-facing compliance views:**

- Customer admin can see their compliance profile
- Audit log filtered to compliance-relevant events (data access, exports, deletions)
- Annual compliance attestation downloadable

### Priority tier: **P0 for PHS pilot (HIPAA, BAA tracking). P1 for tenant compliance profile schema.**

### Acceptance gates

- [ ] Tenant config compliance schema in place
- [ ] PHS pilot has executed BAA tracked in tenant config
- [ ] Compliance audit events distinguished in `ai_egress_audit` and `support_access_audit`

---

## 11. Category C10 — Sales Engineering Enablement

### What's broken

Every new prospect requires custom demo prep. There's no library of demo personas, no ROI calculator, no scripts that can be handed to a sales-engineer to demo without founder presence.

### The work

**Demo persona library:**

- For each industry overlay, a canonical demo tenant (SkyHarbor for airline; new build for healthcare etc.)
- Each demo tenant has 5-8 personas (CTO, CIO, CFO, COO, CISO, business leader, admin)
- Each persona has a canonical 15-min demo flow
- Demo capture scripts (per Packet 29) for asynchronous send-ahead

**Value tracking tool:**

- For each customer in pilot: track value claimed, value realized, value disputed (per Packet 31 §3 IBM model)
- Pilot dashboards showing "value generated to date"
- Renewal conversations grounded in evidence

**ROI calculator:**

- Customer inputs: their estimated savings, their consulting spend, their internal cost
- Output: AbarVa Year-1 ROI projection
- Customer-shareable PDF output

**Customer-shape templates:**

- "Public-company healthcare provider, $5B+ revenue" template
- "Mid-market airline, single hub" template
- "Regional bank, $2B+ assets" template
- Each template pre-populates substrate scaffolding, pricing, demo flow

### Priority tier: **P1 (each new customer should take days to demo-ready, not weeks)**

### Acceptance gates

- [ ] At least 2 industry demo personas (airline + healthcare) fully working
- [ ] ROI calculator UI exists
- [ ] Customer-shape templates documented

---

## 12. Category C11 — Documentation Generation

### What's broken

Documentation is manually written, gets stale, and is inconsistent across packets.

### The work

**Auto-generated docs:**

- TypeScript → API reference (TypeDoc)
- DB migrations → schema docs
- Tenant config schema → readable docs
- Pattern overlays → pattern catalog browseable
- Coverage contract → question taxonomy docs
- ADRs → architecture decision log

**Manually maintained but enforced:**

- Each module has a README
- Each connector has a contract spec
- Each tenant has an onboarding doc
- Each customer has a runbook

**Documentation site:**

- `docs.abarva.ai` (or internal: `docs/`) browsable Markdown
- Search-enabled
- Versioned with releases
- Auto-published on merge to main

### Priority tier: **P2 (nice-to-have until 3+ engineers; then critical)**

### Acceptance gates

- [ ] At least API reference + DB schema auto-generated
- [ ] ADR log browseable
- [ ] Internal docs searchable

---

## 13. Category C12 — Customer Success Infrastructure

### What's broken

When you sign PHS, what tells you they're going to renew? Right now: gut feel + ad hoc conversations.

### The work

**Customer health scorecard:**

- Adoption metrics: WAU, MAU, # of Intelligence questions, # of Moves created, # of Source events
- Engagement depth: which personas are active, which modules are used
- Value realization: are the use cases they signed up for delivering measurable outcomes
- Sentiment: NPS, feedback responses, support ticket trend
- Risk signals: declining usage, executive turnover, late payment

**Quarterly Business Review (QBR) automation:**

- Auto-generate QBR deck from customer health data
- Customer success owner reviews, customizes, presents
- Outputs commitments and risks to renewal pipeline

**Renewal pipeline:**

- 90-day-out: renewal conversation starts
- 60-day-out: renewal terms drafted
- 30-day-out: renewal contract sent
- Day-of: renewal signed or churn-trigger

**In-app feedback:**

- Thumbs up/down on Sentinel answers
- "Was this helpful?" on Moves outputs
- "How can we improve?" in admin
- Feeds into continuous learning loop (C7 Phase 4)

### Priority tier: **P2 for full system; P0 for in-app thumbs-up/down on Sentinel answers (needed for continuous learning loop)**

### Acceptance gates

- [ ] Thumbs up/down on Sentinel answers wired
- [ ] Customer health scorecard for PHS pilot exists by Day 30 of pilot
- [ ] First QBR for PHS happens

---

## 14. Category C13 — Security & DR per Tier

### What's broken

Security posture is reasonable for demo but not battle-tested for enterprise. DR is not explicitly designed per tier.

### The work

**Security operations:**

- Defender for Cloud (already in PHS Azure spec)
- Vulnerability scanning (Snyk, Wiz, or similar)
- Annual penetration test (third-party)
- Bug bounty program (post-Series A)
- Security incident response playbook
- Secret rotation policy

**DR per tier:**

| Tier | RTO | RPO | DR strategy |
|---|---|---|---|
| T1 demo | 24h | 24h | Restore from backup, accept loss |
| T2 pilot | 4h | 1h | Standby region, restore from backup |
| T3 dedicated | 1h | 15m | Active-passive multi-region |
| T4 BYOC | Customer-defined | Customer-defined | Customer-managed |

**Backup policy:**

- Postgres point-in-time restore (default)
- Blob versioning (default)
- Configuration backups (git + Vercel)
- Cross-region backup for T3+
- Backup integrity testing (monthly)

**Key management:**

- T1-T2: AbarVa-managed
- T3+: Customer-managed key option (Azure CMK / AWS KMS)
- Key rotation policy
- Customer key revocation flow (data becomes inaccessible)

### Priority tier: **P0 for security baseline (Defender, vuln scanning). P1 for DR per tier. P2 for bug bounty.**

### Acceptance gates

- [ ] Defender for Cloud active in production
- [ ] Vulnerability scanning runs weekly
- [ ] DR plans documented per tier
- [ ] Monthly DR drill scheduled

---

## 15. The Priority Matrix — what to do when

| Priority | Definition | Trigger | Categories in scope |
|---|---|---|---|
| **P0** | Blocks active Delta or PHS work | Now | C1 (active tenants), C2 (healthcare overlay), C4 (read-only customer admin), C5 (CSV upload), C6 (alerts), C9 (PHS compliance), C12 (thumbs up/down), C13 (security baseline) |
| **P1** | Blocks first paying customer or next 2 prospects | After Delta demo lands | C1 (remaining tenants), C3 (tenant lifecycle), C4 (Phase 2 self-service), C5 (ServiceNow + Workday), C7 (prompt versioning), C8 (404 remediation), C10 (demo persona library), C13 (DR per tier) |
| **P2** | Blocks scaling to 3-10 customers | Post first 2 customers | C2 (additional overlays), C5 (additional connectors), C6 (incident management), C7 (model versioning + observability), C8 (design + mobile + accessibility), C11 (docs site), C12 (full health scorecard) |
| **P3** | Blocks scaling to 10-25 customers | When customer count grows | C2 (all remaining industries), C5 (CDC + advanced connectors), C7 (continuous learning + multi-agent), C8 (i18n), C13 (bug bounty) |
| **P4** | Quality-of-life / engineering maturity | Ongoing | Refactoring, performance budgets, internal tooling, runbook expansion |

---

## 16. Resource Model — Who Does What

| Work category | Who executes | Why |
|---|---|---|
| Architectural decisions (ADRs, invariant changes) | Founder + Claude advisory | Judgment + strategy |
| Substrate authoring (industry overlays) | Founder + Claude (drafting) + Codex (loader) | Long-form writing → Claude; mechanical loading → Codex |
| Code implementation (connectors, admin UI, infra) | Codex | Long-running, well-spec'd |
| Customer-facing docs | Founder + Claude | Tone, framing |
| Sales engineering enablement | Founder + Claude (initially), eventually sales engineer | Customer-facing judgment |
| Compliance documentation | Founder + Claude + external counsel | Legal + judgment |
| DR / security operations | Codex + external pen-test vendor | Mechanical + specialized |
| Customer success | Founder (initially), eventually CSM | Relationship-driven |
| Incident response | Founder (on-call) + Codex (analysis) | Judgment under pressure |
| QBR generation | Codex (data) + Founder (commentary) | Hybrid |

**When to hire:**
- First eng hire: when Packet 32 P0/P1 work backlog exceeds Codex's autonomous capacity (likely Q+1 if customers sign)
- First CSM: when 2+ paying customers exist
- First sales engineer: when 3+ active sales cycles exist
- First InfoSec/compliance lead: when T4 customer signs (PHS likely)

---

## 17. Risk Register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Apex/Meridian substrate refresh reveals breaking gaps; legacy demos break | Medium | Mark as Frozen if no active sales path; refresh only active tenants |
| R2 | Healthcare overlay scope balloons (target 150 packs is ambitious) | Medium | Tier the overlay: 80 P0 packs for PHS first 90 days, remaining 70 deferred |
| R3 | Customer admin UI surface area is large; ships with bugs | Medium | Scope tightly: Phase 1 read-only is procurement-friendly even if Phase 2 deferred |
| R4 | Connector library is a multi-quarter investment; tries to do all at once | High | Strict prioritization: CSV upload first, ServiceNow second, everything else queued |
| R5 | Cost tracking finds we're losing money on AI per tenant | High | Build the tracking first; if it surfaces, address pricing or efficiency |
| R6 | Compliance asks from PHS exceed what we can deliver in pilot timeline | High | Tier compliance: pilot operates under synthetic data with no real PHI per Packet 31 §2.1 T1/T2 |
| R7 | UI sweep finds more 404s than expected; delays demos | Medium | Phase 1 fixes only demo-critical routes; the rest queued |
| R8 | Prompt versioning + model versioning + agent observability + continuous learning becomes its own ML platform project | High | Start with prompt versioning only; defer rest until customer count justifies |
| R9 | Customer success scorecard requires data plumbing we don't have | Medium | Stand up with manual scorecard; auto-generate as data plumbing matures |
| R10 | DR/security testing creates pressure for SOC 2 audit before we can afford it | Medium | Plan for SOC 2 Type II at 6-customer milestone; not before |

---

## 18. Acceptance gates for the full packet

Packet 32 is "complete" when:

- [ ] Multi-tenant audit (C1) done; each tenant has a documented state
- [ ] Healthcare overlay (C2) ≥120 packs authored
- [ ] Tenant lifecycle (C3) tooling exists for T1→T2
- [ ] Customer admin Phase 1 read-only (C4) shipped
- [ ] CSV upload (C5) working end-to-end
- [ ] Observability foundation (C6 Phase 1) deployed with tenant-bleed alert
- [ ] Prompt versioning (C7 Phase 1) in place
- [ ] 404 remediation (C8 Phase 1) complete
- [ ] PHS compliance profile (C9) shipped
- [ ] In-app thumbs up/down (C12) wired
- [ ] Security baseline (C13) — Defender + vuln scanning active

That's the **P0 closure bar**. P1+ work continues as standing backlog.

---

## 19. Sequencing Recommendation

**Now (parallel with Packet 30 + 31 execution):**

1. **Codex worktree A (primary):** Execute Packet 30 + 31 per the prompt I gave you earlier
2. **Codex worktree B (audit only):** Execute Packet 32 Category C1 audit (read-only) — produces `MULTI_TENANT_STATE_AUDIT.md`
3. **You:** Read Packet 31 + 32 end to end; decide which P0s actually matter for PHS timing

**Once Packet 30 + 31 close:**

4. **Codex worktree A:** Pick up Packet 32 P0 work, starting with C2 healthcare overlay (highest-leverage for PHS)
5. **Codex worktree B:** Pick up C8 404 remediation (low-risk, demo-critical)
6. **You + Claude:** Author healthcare overlay packs (you can't outsource industry voice)

**Once first paying customer signs:**

7. Shift to P1 work focused on that customer's needs
8. Hire first engineer to scale execution

**Quarterly:**

9. Re-prioritize remaining backlog
10. Update Packet 32 with new categories as company learns
11. Promote items to higher priority tiers as customer pipeline demands

---

## 20. What this packet does NOT cover

To prevent scope creep, explicitly out of scope:

- **Marketing site** (`abarva.ai` content, blog, case studies) — separate concern
- **Pricing model evolution** (covered partially in Packet 31 §2.1, but commercial details out of scope)
- **Fundraising prep** — separate concern
- **Hiring playbook** — separate concern
- **Channel partnerships** (SI partners, AWS Marketplace, etc.) — separate concern
- **International expansion** (UK, EU, APAC GTM) — separate concern

These are real but belong in separate packets.

---

## 21. The "what else" worth flagging

Some questions Packet 32 raises that need founder-level decisions:

| Question | Decision needed |
|---|---|
| Do we deprecate Apex/First Capital demo tenants or refresh them? | Founder, by tenant priority |
| Do we build the healthcare overlay before or after Delta demo? | Founder, by Delta vs PHS timing |
| Do we commit to SOC 2 Type II this fiscal year? | Founder + investor input |
| Do we offer BYOC (T4) to PHS at Year-1 or wait until Year-2? | Founder + PHS conversation |
| Do we build a customer-facing API (programmatic AbarVa) before, during, or after admin UI? | Founder, by customer feedback |
| Do we hire eng-1 internal or extend Codex autonomy further? | Founder, by burn rate + ambition |
| Do we keep authoring synthetic substrate or move customers to real data ASAP? | Founder, by sales motion preference |
| Do we offer "AbarVa for partner SIs" (white-label) as a separate motion? | Founder, after first 3 customers |
| Do we charge for industry overlays separately or bundle? | Founder, by competitive dynamics |
| Do we build "Sentinel for sale" as embedded AI in customer apps? | Founder + product strategy |

These aren't blocking Packet 32 execution; they shape its emphasis. Worth thinking about over the next 30 days.

---

## 22. Companion to Packets 28-31

| Packet | Role | Relationship to Packet 32 |
|---|---|---|
| 28 — Substrate generator | Builds one tenant's substrate | Used by C1 (refresh) and C2 (overlay tenants) |
| 29 — Demo capture | Demos one tenant | Used by C10 (demo persona library) |
| 30 — Architectural fix | Fixes today's bleeding | Must close before Packet 32 P0 execution |
| 31 — Constitution + operating model | Standing rules | Packet 32 inherits all invariants and authorities |
| 32 — Productization roadmap | Standing backlog | This document |

---

## 23. Document control

- **Version:** Packet 32 v1
- **Date:** 2026-05-28
- **Author:** AbarVa Founder + Claude (drafting)
- **Status:** Standing roadmap
- **Companion documents:** Packets 28, 29, 30, 31 (as above)

**Successor packets** (to be authored as scope demands):

- Packet 33 — Healthcare Industry Overlay (extracted from §3 / C2)
- Packet 34 — Customer Admin UI Implementation (extracted from §5 / C4)
- Packet 35 — Connector Framework Implementation (extracted from §6 / C5)
- Packet 36 — Multi-Tenant Substrate Refresh (per-tenant execution playbooks extracted from §2 / C1)

---

*End of Packet 32. Standing roadmap. Reference, prioritize, execute by tier.*
