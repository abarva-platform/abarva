# Packet 31 — Architectural Constitution & Operating Model

**Author:** AbarVa Founder
**Status:** Standing brief — referenced by every subsequent packet
**Created:** 2026-05-28
**Review cadence:** Quarterly, or whenever the company onboards a new customer tier

---

## Why this packet exists

Packet 30 fixes today's bleeding. **Packet 31 is the durable framework that prevents it from coming back.**

It answers four interlocked questions:

1. **Architectural integrity** — what invariants must hold across every layer, and how do we enforce them?
2. **Deployment topology** — when a customer needs a dedicated data plane (PHS-style), how do we branch without forking the product?
3. **Pilot enhancements** — when PHS asks for feature X, does it go into the product or into their fork? Who decides?
4. **AI-augmented engineering operating model** — how do Codex and Claude Code do most of the implementation while humans stay in charge?

This is a founder document. It will get richer as the company grows from founder + agents to founder + agents + small team. It is intentionally written for the current scale — not the 50-person engineering org that comes later.

---

## PART 1 — The Architectural Constitution

### 1.1 The four layers

Every part of AbarVa belongs to exactly one of these layers. **Calls go down, not up. Calls do not cross layers.**

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION (Next.js App Router pages + components)   │
│  - Server Components for data display                   │
│  - Client Components for interactivity                  │
│  - NEVER touches DB / vector store / model APIs         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ORCHESTRATION (src/app/api/**/route.ts + actions)      │
│  - HTTP entry points and Server Actions                 │
│  - Auth, tenant resolution, request validation          │
│  - Composes domain services; does not implement them    │
│  - NEVER contains business logic                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  DOMAIN (src/lib/{agents,knowledge,programs,...})       │
│  - Sentinel, retrieval, classifier, coverage, scoring   │
│  - Pure business logic; no HTTP, no auth                │
│  - Takes CanonicalTenant; never strings                 │
│  - NEVER calls model APIs directly — uses ModelClient   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  DATA (src/lib/data-plane/, src/lib/model-clients/)    │
│  - One Azure read adapter, one Anthropic client, etc.   │
│  - Connection pooling, retries, telemetry               │
│  - NEVER contains business logic or tenant resolution   │
└─────────────────────────────────────────────────────────┘
```

**CI enforcement:** `eslint-plugin-import` with custom restricted-paths rules that fail the build if:
- `src/app/**/page.tsx` imports from `src/lib/data-plane/`
- `src/lib/agents/` imports from `src/app/api/`
- `src/lib/data-plane/` imports from `src/lib/agents/`
- Any `src/app/api/**/route.ts` contains more than 50 lines of business logic (forces extraction to `src/lib/`)

### 1.2 The Nine Architectural Invariants

These are non-negotiable. Violation = automatic CI failure. **Period.**

| # | Invariant | CI guard |
|---|---|---|
| **I1** | Tenant resolution has exactly ONE entry point: `resolveTenant()` | `grep -r "TENANT_ALIASES\|TENANT_KEY_ALIASES" src/ --exclude=lib/tenant/aliases.ts` returns empty |
| **I2** | All data plane reads go through ONE adapter per substrate type | `grep -r "@supabase/\|directly connect to azure" src/app src/lib --exclude=lib/data-plane` returns empty |
| **I3** | All model API calls go through ONE client per provider (AnthropicClient, VoyageClient) | `grep -r "import.*@anthropic-ai/sdk\|import.*voyageai" src/ --exclude=lib/model-clients` returns empty |
| **I4** | Every retrieval call returns a `CoverageReport` | Type-system enforced; `retrieve*()` function signatures must return `{ sources, coverage }` |
| **I5** | Every tenant boundary is enforced at the DB query layer (RLS or explicit `WHERE client_id = ?`) | Migration tests verify RLS policies exist on all multi-tenant tables |
| **I6** | Every AI egress call writes to `ai_egress_audit` with tenant context | Lint rule: ModelClient.call() must have audit context parameter |
| **I7** | Every Tier-1 question category maps to required substrate segments (coverage contract) | `coverage.test.ts` asserts every category has ≥3 required segments |
| **I8** | Every public-facing change has a release record with `## Audit Evidence` section | Release-control gate (already implemented) |
| **I9** | Pattern retrieval is industry-isolated: tenants may retrieve only their allowed industry overlays plus `cross_industry` | `retrievePattern` tenant matrix test covers five query classes across Apex, Meridian, Northstar, First Capital, and SkyHarbor; ESLint blocks new Ask callsites that bypass the scoped retriever |

### 1.3 The Six Tenant-as-First-Class-Citizen Rules

Multi-tenancy is the hardest thing to retrofit and the easiest thing to break. Rules:

1. **Tenant ID is a parameter, never a global.** Code that reads "the current tenant" from a hidden context (cookies, env, global state) is broken by design.
2. **Tenant ID flows from auth → request → resolver → domain → data.** Each layer either passes it explicitly or refuses to compile.
3. **Tenant boundaries are enforced at three layers:** middleware (auth), service (`resolveTenant()`), and database (RLS). Defense in depth.
4. **Tenant-scoped resources have tenant ID in the primary key OR a composite uniqueness constraint.** No exceptions.
5. **Cross-tenant queries require explicit `crossTenant: true` opt-in.** Default behavior is single-tenant.
6. **Every test that touches multi-tenant data must include at least one cross-tenant isolation assertion.** Caught by lint rule `require-cross-tenant-assertion`.

### 1.4 The Five Single-Source-of-Truth Declarations

For each, there is exactly ONE module in the codebase that owns it:

| Domain | Module | Owns |
|---|---|---|
| Tenant resolution | `src/lib/tenant/` | resolver, aliases, types, fallback policy |
| Data plane reads | `src/lib/data-plane/azureRead.ts` | connection, retries, query construction |
| Model clients | `src/lib/model-clients/` | Anthropic, Voyage, OpenAI (if added) |
| Coverage contract | `src/lib/knowledge/coverage.ts` | question categories → required segments |
| Audit logging | `src/lib/audit/` | egress audit, action audit, error audit |

If a second module of any of these appears, **the CI guard catches it and fails the build.** No exceptions, no `// eslint-disable`.

### 1.5 The Anti-Patterns Catalog

Things we've already burned hours on. Named so we don't repeat them.

| Anti-pattern | Symptom | Detection |
|---|---|---|
| **Spaghetti tenant key** | 5 different fields holding the same tenant ID with subtle format differences | CI grep: only `canonicalKey` and `clientId` may appear in domain code |
| **Try-catch loses fallback** | Fallback assignment inside try-block, lost on catch | ESLint custom rule: fallback values must be assigned outside try-blocks |
| **Stale dual-store assumption** | Code reads from store A while data lives in store B | I2 invariant + CI guard |
| **Silent retrieval refusal** | "Data unavailable" admitted when ≥1 source matched | Partial-evidence test suite + `unavailableAdmissionRate` metric |
| **Browser-fetch verifier** | Quality gate dies on transient browser failures | Verifier is Node-fetch only (Phase 4 of Packet 30) |
| **Single tabId across batch** | Session memory pollutes batch verification | Verifier per-question UUID tabId |
| **Worktree drift** | Local main predates squash merges, dirty diffs leak in | Phase-per-worktree policy in §3.5 |
| **GitHub auth token poisoning** | `GH_TOKEN` env var blocks otherwise-healthy keychain auth | Documented workaround: `env -u GH_TOKEN gh ...`; long-term fix in tooling brief |
| **Pattern-only answer scored as grounded** | Sentinel cites overlay but no tenant facts | Verifier rubric caps pattern-only answers at 3/5 |
| **Hot-classifier keyword drift** | Question routing breaks when new tenant uses domain-specific vocabulary | Coverage contract routes by category, not keyword |

When you find a new anti-pattern, **add it to this list and ship the detection.** The catalog is alive.

---

## PART 2 — Deployment Topology: Shared vs Private Data Plane

This is the question PHS will force you to answer commercially within 60 days.

### 2.1 The Four Deployment Tiers

| Tier | Name | Data plane | Compute | Customer use case | Commercial pricing |
|---|---|---|---|---|---|
| **T1** | Shared MT (demo) | Shared Azure DB, RLS-isolated | Shared Vercel | Demos, pre-pilots, trials | Free / $5K trial |
| **T2** | Shared MT (production) | Shared Azure DB, RLS-isolated | Shared Vercel | Small pilots, SMB customers | $50K–$200K/yr |
| **T3** | Dedicated tenant | Dedicated Azure DB per customer | Shared Vercel runtime, dedicated DB | Mid-market, light compliance | $300K–$750K/yr |
| **T4** | Customer-cloud BYOC | Customer's Azure / AWS / GCP | Customer-cloud compute | Regulated industries (PHS, banks, govt) | $750K+/yr |

### 2.2 Critical principle: ONE codebase, ALL tiers

> *"The same `git main` branch deploys to every tier. The differences live in configuration, not code."*

If T3 needs different code than T2, the abstraction is wrong and must be fixed at I1–I9 invariant level.

**The deployment matrix:**

```
                 SHARED MT (T1+T2)    DEDICATED (T3)       BYOC (T4)
                 ───────────────────  ───────────────────  ───────────────────
Source           main                 main                 main
Vercel project   nexus-shared         nexus-dedicated-<c>  customer-managed
DB URL           AZURE_DATABASE_URL   ${CUSTOMER}_DB_URL   customer-provided
Clerk            clerk-shared-prod    clerk-dedicated-<c>  customer-SSO bridge
Model gateway    AbarVa Anthropic key Customer's BAA key   Customer's account
Egress audit     Shared audit table   Customer audit table Customer-owned bucket
Domain           app.abarva.ai        <customer>.abarva.ai customer-provided
```

### 2.3 The promotion path

A customer typically moves T1 → T2 → T3 → T4 over their lifecycle. **The path must be one-way and seamless.**

| Promotion | What changes | What stays |
|---|---|---|
| T1 → T2 | Customer ID in shared DB, billing toggles | Everything else |
| T2 → T3 | Dedicated DB provisioned, substrate migrated, dedicated Clerk org | Codebase, runtime |
| T3 → T4 | Code-cloned to customer infra, secrets handed off, BAA executed | Codebase release tracking back to main |

The migration scripts for each promotion live in `scripts/promotion/` and are tested before any customer migration.

### 2.4 Per-tenant configuration as code

Every tenant has a config record. **No tenant config lives in environment variables.**

```ts
// src/config/tenants/skyharbor-air.ts
import { defineTenantConfig } from '../tenant-config';

export default defineTenantConfig({
  canonicalKey: 'skyharbor-air',
  displayName: 'SkyHarbor Air',
  tier: 'T1', // demo
  deployment: {
    sharedDatabase: true,
    clerkOrg: 'org_skyharbor_shared',
  },
  modules: {
    intelligence: { enabled: true },
    moves: { enabled: true },
    source: { enabled: true },
    tower: { enabled: true },
  },
  patternOverlays: ['airline-industry-v1'],
  branding: {
    primaryColor: '#1B365D',
    logoUrl: '/assets/skyharbor-logo.svg',
  },
  // ...
});
```

For T3/T4, the same config shape applies but `deployment.sharedDatabase` is `false` and dedicated infrastructure references are provided.

**This is testable.** A tenant onboarding test validates the config shape, exercises the resolver against it, and confirms isolation.

### 2.5 The dedicated-tenant Terraform / Bicep module

For T3 customers (PHS-style), spinning up dedicated infrastructure should be a one-command operation:

```bash
npm run provision:dedicated-tenant -- \
  --customer phs \
  --display-name "Presbyterian Healthcare Services" \
  --region eastus2 \
  --tier T3
```

This runs Terraform/Bicep that:
1. Provisions Azure Postgres Flexible Server (HA, pgvector enabled)
2. Provisions Azure Key Vault with customer-managed key
3. Provisions Azure Front Door + WAF with the customer subdomain
4. Sets up Private Link to AbarVa Vercel runtime
5. Creates Clerk org + initial admin user
6. Loads baseline substrate (if customer has one) or seeds empty
7. Registers the tenant config in `src/config/tenants/`
8. Triggers a Vercel deploy that picks up the new config
9. Returns the customer's signed welcome packet with credentials

**Target: 4 hours from "we have a signed SOW" to "customer can sign in to their dedicated environment."**

If it takes longer than 4 hours, the provisioning automation is the bug, not the customer.

### 2.6 BYOC (Tier 4) — when the customer hosts

For regulated industries (PHS final-state, big banks, govt), the customer hosts the runtime in their own cloud. AbarVa ships:

1. **A Helm chart** (or Terraform module if customer doesn't use K8s) that deploys the AbarVa runtime
2. **A versioned bundle**: `abarva-runtime-vX.Y.Z.tgz` with everything needed (container image refs, schema migrations, config templates)
3. **A connector to AbarVa's central registry** for: substrate updates, pattern overlay updates, security patches
4. **A customer-side audit collector** that lets the customer's InfoSec see every AI egress call

The customer's IT runs the runtime. AbarVa provides:
- Automated update notifications (you have v2.1; v2.2 is available)
- White-glove migration support for major versions
- Continuous pattern overlay refreshes via the registry
- 24×7 support per SLA

**Why this matters:** This is what unblocks PHS at Day-90 and unblocks the next 5 regulated-industry customers. Building it correctly once means BYOC is a price-up sale, not a six-month engineering project per customer.

---

## PART 3 — Pilot Enhancement Decision Framework

The question: PHS asks for feature X during their pilot. Does it go into the product or into their fork?

### 3.1 The Productize-or-Fork decision tree

```
Customer asks for feature X
        │
        ▼
Is X generalizable to other customers? ──── No ──── Configuration / theming?
        │                                                  │
       Yes                                                Yes ──── Add to tenant config schema (Part 2.4)
        │                                                  │
        ▼                                                  No  ──── Quarantine (3.4 below)
Is X aligned with AbarVa's product strategy?
        │
        ├─── Yes ─── Is X compliant with current architecture?
        │                  │
        │                  ├─── Yes ─── Build as product feature (3.2)
        │                  │
        │                  └─── No ──── ADR required (3.3)
        │
        └─── No ──── Decline, offer services bundle, or escalate to founder
```

### 3.2 Product feature build

When X is generalizable AND strategy-aligned AND architecture-compatible:

- Build in `main` branch
- Behind feature flag (`features.X.enabled`) defaulted OFF for other tenants
- Enable for requesting customer
- After 30 days of stable usage by ≥2 customers, flip default to ON
- Document in product changelog
- **Customer does not pay extra for this** — it's product investment

### 3.3 ADR (Architectural Decision Record) process

When X requires architecture changes (new invariants, new layers, new tiers):

1. Founder or Codex drafts ADR in `docs/architecture/adr/NNNN-<slug>.md`
2. ADR template:
   - Title, status (proposed | accepted | superseded)
   - Context (what triggered this)
   - Decision (the choice being made)
   - Consequences (what this enables, what this constrains)
   - Alternatives considered
   - Implementation impact (what code changes are required)
3. Founder approves explicitly (or, if author is founder, sleeps on it overnight)
4. If accepted: implementation goes into main; invariants list (1.2) is updated if applicable
5. If rejected: closed with explanation
6. ADRs are never deleted, only superseded

**The point:** Big architectural changes get thought about before they happen, not after.

### 3.4 Quarantine: bespoke customer features

When X is genuinely customer-specific (custom integration, branded workflow, regulatory-driven UI):

- Build in a customer-specific directory: `src/customers/<customer>/`
- Loaded via the tenant config: `customerExtensions: ['phs-epic-bridge']`
- Has its own test suite that runs only when the extension is enabled
- Marked deprecated after 18 months unless renewed
- **Customer pays Professional Services hours for this work** at T1–T5 rate card

The quarantine directory enforces a clean boundary: the rest of the codebase doesn't know `src/customers/phs/` exists unless the customer's tenant config enables it.

### 3.5 Backporting policy

Sometimes a fix made for one customer benefits everyone.

- Any bug fix that touches `src/lib/` is automatically applied to all tenants on next deploy
- Any product feature in `main` propagates to T2/T3/T4 customers per their release track
- T4 (BYOC) customers receive update notifications but apply on their schedule; AbarVa supports current + 2 previous major versions
- Security patches are mandatory across all tiers within 30 days

### 3.6 Per-customer release tracks

| Track | Update cadence | Customer types |
|---|---|---|
| **Bleeding edge** | Continuous deploy on merge to main | Internal, demo tenants |
| **Stable** | Weekly Tuesday deploy | T1, T2 customers |
| **Enterprise** | Monthly with 7-day RC window | T3 customers |
| **LTS** | Quarterly with 30-day RC window | T4 customers (BYOC) |

Track is set in tenant config. Promotion between tracks requires customer approval.

---

## PART 4 — AI-Augmented Engineering Operating Model

This is how Codex and Claude Code do most of the implementation while you and (eventually) your team stay in charge.

### 4.1 The roles

| Role | Human or AI | Responsibility |
|---|---|---|
| **Strategy** | Human (founder) | Product direction, customer commitments, architecture review, escalation calls |
| **Architecture** | Human + Claude (advisory) | Constitutional decisions, ADRs, invariant changes |
| **Implementation** | Codex / Claude Code (executor) | Code changes, tests, deploys within authority boundaries |
| **Code review** | Codex (initial) + Human (final on high-risk) | PR review |
| **QA** | Automated test suites + Codex (analysis) | Quality gates |
| **Ops** | Codex + Human (on-call) | Production monitoring, incident response |
| **Customer success** | Human + Claude (advisory) | Customer relationships, demos, account growth |
| **Security review** | Human + automated guards | Security posture decisions |

**Key principle:** AI executes within explicit authority. Humans make decisions that bind the company.

### 4.2 The trust tiers for AI changes

Every change has a risk classification. Authority depends on classification.

| Class | Examples | AI Authority | Human review required |
|---|---|---|---|
| **A — Cosmetic** | Typos, comments, README updates | Auto-merge after CI green | No |
| **B — Routine refactor** | Extract function, rename within scope, add test | Auto-merge after CI + lint + typecheck green | No |
| **C — Bug fix (single file)** | Fix identified bug, contained change, has regression test | Auto-merge after CI green + release record | No |
| **D — Feature (within architecture)** | New feature respecting invariants, behind flag | PR open, human reviews within 24h before merge | Yes |
| **E — Architecture-affecting** | Touches I1–I9 invariants, new module in `src/lib/`, new connector | ADR required, human approval before code starts | Yes |
| **F — Cross-tenant impacting** | Changes to RLS, tenant resolution, isolation guards | ADR + threat model + human approval + on-call notification | Yes |
| **G — Production impact** | Database migration, schema change, public API change | Maintenance window + rollback rehearsal + human approval | Yes |

Codex/Claude Code classifies its own changes when opening the PR. The classifier is itself a class-D feature.

### 4.3 The authority matrix

What Codex can do without asking:

✅ **Always allowed:**
- Open branches, commits, draft PRs
- Run tests, linters, typechecker
- Read any file in the repo
- Query DB schema (read-only)
- Deploy to preview environments
- Class A, B, C changes after CI green
- Update its own status in tracking issues

✅ **Allowed with explicit packet authorization (per Packet 30 §2 model):**
- Class D changes
- Merge PRs to main
- Deploy to production
- Refactor across multiple files within a phase
- Delete code as part of consolidation
- Add CI guards

⚠️ **Requires explicit human approval per change:**
- Class E, F, G changes
- Production data mutations from runtime app
- New external service dependencies
- Disabling or relaxing existing guards
- Public API breaking changes
- Customer data access from outside production

❌ **Never allowed:**
- Force-push to main
- `--no-verify` bypass of hooks
- Force-merge with red CI
- Modifying release records after merge
- Taking down production tenants
- Accessing customer secrets directly

### 4.4 Quality gates with AI in the loop

Standard PR flow:

```
1. Codex opens PR
2. Auto-classify change class (A-G)
3. Run CI:
   - ESLint
   - Typecheck (broad)
   - Focused tests
   - Architecture invariant guards (I1-I9)
   - Coverage check (no decrease)
   - Bundle size check
   - Release record gate
   - Vercel preview build
4. Codex self-review:
   - Posts summary of change
   - Posts test plan executed
   - Posts risk assessment
   - Posts rollback plan
5. AI code review (Vercel Agent or Codex review pass):
   - Comments on potential issues
   - Suggests improvements
6. If class A/B/C and all gates green → auto-merge
7. If class D and gates green → flag for human review with 24h SLA
8. If class E/F/G → block merge until human approval
```

Industry-class or tenant-class bugs must be verified across all tenants in the affected class before merge. The tenant that exposed the bug is the smoke test; the other tenants are the verification matrix.

### 4.5 Documentation discipline

For every meaningful change, three artifacts must exist:

1. **Code comments** — for *why*, not *what* (the code shows what)
2. **Release record** — for *what shipped and why it matters*
3. **ADR (if applicable)** — for *architectural decisions*

Plus auto-generated artifacts:
- API reference from TypeScript types (TypeDoc)
- DB schema docs from migrations
- Tenant config schema from Zod
- Test reports from Jest/Playwright
- Coverage reports from Codecov

**Documentation generation is in CI, not manual.** If docs are stale, that's a tooling bug.

### 4.6 Defect logging and tracking

Every defect — from CI failure to customer-reported bug — flows through one queue:

```
Defect detected
    │
    ▼
Create issue in tracking system (GitHub Issues) with:
- Title (one-line)
- Severity (P0 / P1 / P2 / P3)
- Customer impact (Y/N, which customers)
- Detection method (CI / verifier / user report / monitoring)
- Repro steps
- Root cause analysis (filled in by fixer)
    │
    ▼
Codex triages:
- P0 → wakes human on-call
- P1 → next business day
- P2 → next sprint
- P3 → backlog
    │
    ▼
Codex implements fix (or escalates if class E+)
    │
    ▼
PR open with link back to issue
    │
    ▼
Post-fix: 5-Whys root cause in issue
    │
    ▼
If anti-pattern: add to §1.5 catalog with detection
```

### 4.7 Audit discipline

For every meaningful operation, an audit record exists:

| Operation | Audit table | Retention |
|---|---|---|
| AI model egress | `ai_egress_audit` | 7 years |
| Cross-tenant query attempts | `tenant_boundary_audit` | 7 years |
| Authentication events | `auth_audit` | 2 years |
| Configuration changes | `config_audit` | 7 years |
| Customer data access by AbarVa staff | `support_access_audit` | 7 years |
| Substrate load / refresh | `substrate_audit` | indefinitely |
| Production deploys | Git + Vercel logs | indefinitely |

**Auditability is a feature, not overhead.** It's also the foundation for InfoSec reviews at PHS, Delta, and any future regulated customer.

### 4.8 The on-call rotation

Until headcount allows a real rotation:

- Founder is on-call 24×7 for P0 (production down, cross-tenant bleed, data loss)
- Codex monitors and pages via SMS + email for P0
- Codex auto-handles P1 during business hours; pages for after-hours P1
- P2/P3 wait

When you hire the first engineer, this becomes a 2-person rotation. When you hire the second, it becomes a follow-the-sun rotation.

### 4.9 Productivity discipline for AI-augmented work

Two practices that prevent the 8-hour spiral pattern:

1. **Three-attempt rule** — if a fix doesn't land after 3 honest attempts, stop and write a status report. (Already in Packet 30 §2 R8.)
2. **Time-boxed exploration** — for any new investigation, set a soft limit (typically 90 minutes for diagnosis, 4 hours for prototype). If exceeded, stop and re-plan. AI agents do not have hunger or fatigue cues; you must give them artificial ones.

### 4.10 Trust calibration over time

This operating model gets more autonomous as evidence accumulates:

- **Today:** Class A/B auto, C with light review, D human-review-then-merge, E+ blocks
- **Q+1 (after 10 successful packets):** Class C auto, D auto with post-merge review, E packets pre-authorized
- **Q+2 (after 20 successful packets and zero incidents):** Class D auto-merge during business hours, full self-driving for narrow categories

You move the line based on **incident-free runtime**, not on calendar time. Every P0 caused by AI-introduced code resets the trust ladder one tier.

---

## PART 5 — Updates Needed Elsewhere

Adopting this packet requires updating other artifacts. None of these are blockers; they're follow-ups Codex can sequence after Packet 30.

### 5.1 CLAUDE.md / memory updates

Append to project CLAUDE.md:

```
## Architectural authority
This codebase operates under PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md.
Before making architectural changes, read Sections 1.1–1.5 (the invariants).
For pilot-customer enhancement decisions, apply Section 3.1 decision tree.
For change authority, refer to Section 4.3 trust tiers.

## Standing invariants (must hold)
- I1: One resolveTenant()
- I2: One Azure read adapter (no Supabase in src/app or src/lib)
- I3: One model client per provider
- I4: Every retriever returns CoverageReport
- I5: RLS at DB layer
- I6: All AI egress audited
- I7: Coverage contract for all Tier-1 categories
- I8: Release record with Audit Evidence
- I9: Pattern retrieval returns only tenant industry + cross_industry overlays
```

Add to user memory:
- New memory: "Architectural constitution lives in PACKET_31. Reference for all architecture decisions."

### 5.2 Packet 30 update

Add to Packet 30 §6 acceptance gates:

```
- [ ] All Packet 31 invariants I1-I9 enforced by CI guards
- [ ] Packet 31 §3.1 decision tree referenced in PR review for any new customer features
```

### 5.3 Repo hygiene additions

New files to create (Codex can ship these as a class-B PR):

- `docs/architecture/adr/0001-template.md` — ADR template
- `docs/architecture/INVARIANTS.md` — extracted §1.2 for quick reference
- `docs/architecture/DEPLOYMENT_TIERS.md` — extracted §2.1 for sales/procurement reference
- `docs/architecture/CUSTOMER_ENHANCEMENT_DECISION_TREE.md` — extracted §3.1 as a quick reference
- `docs/operations/INCIDENT_RESPONSE.md` — runbook based on §4.6 + §4.8
- `docs/onboarding/TENANT_PROVISIONING_PLAYBOOK.md` — the 4-hour playbook from §2.5
- `eslint.config.mjs` updates — invariant guards I1–I7
- `scripts/promotion/T1-to-T2.mjs`, `T2-to-T3.mjs`, `T3-to-T4.mjs` — promotion automation stubs

### 5.4 Customer-facing artifact updates

The deployment tier framework affects sales materials:

- **PHS pricing structure** — already discussed; should explicitly call out which tier they're in (T3 → T4 at production)
- **Delta SOW (when it materializes)** — should specify tier
- **AbarVa pricing page** — should reflect the 4-tier model
- **Year-1 contract templates** — should include tier-specific SLA addenda

### 5.5 New customer onboarding playbook

Every new customer that signs an SOW triggers this playbook:

```
Day 0 (signature):
- Founder approves tier assignment per §2.1
- Codex provisions infrastructure per §2.5 (T1/T2: 30 min, T3: 4 hours, T4: 1 week)
- Codex creates tenant config record per §2.4
- Codex schedules onboarding kickoff

Day 1-7 (substrate prep):
- Substrate loaded per Packet 28 pattern
- Customer-specific overlays generated if applicable
- Verifier baseline established per Packet 29 pattern
- Customer sign-in walkthrough delivered

Day 7-30 (pilot active):
- Per Section 4 operating model
- Weekly customer-success cadence
- Issues tracked per §4.6

Day 30+ (steady state):
- Move to relevant release track per §3.6
- Substrate refresh cadence per customer agreement
- Renewal preparation begins at Day 60
```

---

## PART 6 — How to use this packet

### 6.1 For Anand (founder)

- Read it once end-to-end so you know what you've committed to
- Re-read Part 1 invariants before approving any architectural ADR
- Re-read Part 3 decision tree before approving any customer feature request
- Re-read Part 4 authority before extending Codex/Claude permissions

### 6.2 For Codex / Claude Code

- Reference Section 4.3 to know what you may do without asking
- Reference Section 1.2 invariants to know what you must not violate
- Reference Section 3 to know whether a customer ask is a product feature or a quarantine candidate
- File ADRs per §3.3 for architecturally-significant changes

### 6.3 For Claude (architecture advisory)

- When asked "should we...?", filter the answer through the invariants
- When proposing solutions, name which tier they apply to (T1–T4)
- When reviewing PRs, flag invariant violations explicitly

### 6.4 For future engineers / customer success people

- Onboarding to AbarVa = reading this packet first
- Onboarding to a new tenant = following the Tenant Provisioning Playbook (§2.5 + §5.5)
- Onboarding to incident response = reading the Incident Response runbook (§4.8)

---

## PART 7 — When to update this packet

Trigger conditions for revision:

- New deployment tier added (e.g., T5 for sovereign-cloud customers)
- New architectural layer added (e.g., a streaming layer)
- New invariant promoted from anti-pattern catalog
- New regulated industry requires new audit fields
- After every customer-impacting P0 incident (post-mortem may add to anti-pattern catalog)
- When AI authority is extended per §4.10 trust calibration
- Quarterly review regardless

Version this packet like product code. Major version bumps require an ADR.

---

## PART 8 — Recommended execution sequence (combined with Packet 30)

Now that you have Packet 30 (tactical) + Packet 31 (strategic), here's how to sequence:

```
1. Hand Codex Packet 30 § Section 8 instructions → starts Phase 0 audit
2. While Codex audits, you (founder) read Packet 31 end to end
3. Optional: ask Claude to spot-check anything in Packet 31 you want refined
4. As Codex completes Phase 0 audit, Codex also reads Packet 31 and confirms
5. Codex's Phase 1 implementation now bakes in the invariants
6. Codex's Phase 2 enforces I2 (data plane consolidation)
7. By end of Packet 30, every invariant has a CI guard
8. Open follow-up packet: "Implement Section 5 — repo hygiene additions and customer onboarding playbook"
9. Hand off the deployment-tier framework to whoever's writing the PHS SOW v3 (probably you + Claude)
10. Quarterly review of Packet 31 invariants and operating model
```

---

## Document control

- **Version:** Packet 31 v1
- **Date:** 2026-05-28
- **Author:** AbarVa Founder + Claude (drafting)
- **Status:** Standing brief
- **Companion documents:**
  - `PACKET_28_SKYHARBOR_SUBSTRATE.md` — substrate generator
  - `PACKET_29_DEMO_CAPTURE.md` — demo flow
  - `PACKET_30_ARCHITECTURAL_CONSOLIDATION.md` — tactical fix
  - `AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md` — pattern library

**Successor packets** (to be authored as scope demands):
- Packet 32 — Customer Onboarding Playbook (extracted from §5.5)
- Packet 33 — BYOC Deployment Bundle for T4 customers (extracted from §2.6)
- Packet 34 — AI Engineering Operating Model Maturity Path (extracted from §4.10)

---

*End of Packet 31. Standing brief. Reference, don't replace.*
