# ADM1 · Steward Setup/Admin · Apple-like Control Plane Contract

Slice ID: ADM1
Slice name: Steward Setup/Admin · Apple-like Control Plane Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)
Type: Specification / contract document only — no application code, no
runtime modification, no migrations, no model calls.

This contract governs all future Setup / Admin implementation slices
(ADM2 onward). It establishes the product principle, the experience
principle, the agent contract, the canonical surface zones, the
canonical modules, the dataset domains AbarVa needs to govern, the
loaded / available / usable evidence model, and the readiness matrix
the admin must be able to read at a glance.

---

## A. Purpose and scope

### Product principle
Admin / Setup is **not** "settings." It is the **Steward-led control
plane** for AbarVa. Its job is to make the operator confident that
the platform is configured, governed, and ready to produce
decision-grade guidance — and to surface, honestly, every place it is
not.

Admin is the surface where the operator answers:

- *Is this tenant ready?*
- *What is loaded, available, and usable?*
- *Who can see what?*
- *Which agents can be trusted right now and which must defer?*
- *What is the most leveraged thing I can fix next?*

### Scope of this contract
- Defines **what** the Setup / Admin surface must do.
- Defines **how** it must feel (Apple-like, calm, agent-led).
- Defines the **canonical zones, modules, dataset domains, evidence
  states, agent readiness matrix, and Steward Brief** that future
  ADM* slices implement.
- Does **not** implement Admin UI in this slice. Implementation lands
  in ADM2 → ADM10.

### Out of scope for this contract
- New backend infrastructure, RLS rewrites, connector sync engines,
  data-retention enforcement, SSO expansion, SOC2 export, evidence
  registry backend, live Steward runtime, new model-call paths, new
  Supabase migrations. (See section U.)

---

## B. Primary users

| User | Why they come to Admin |
|---|---|
| **Founder / platform operator** | Confirm the platform is configured to demo / sell / operate; spot blockers across all tenants. |
| **Tenant admin** | Onboard their organization: connectors, users, datasets, governance posture. |
| **Steward operator** | Drive setup, resolve readiness gaps, captured structured decisions, sign off on evidence usability. |
| **Security / governance reviewer** | Confirm tenant isolation, role policy, upload policy, audit posture, and risky permissions. |
| **Data owner** | Inspect the datasets they own; mark availability; approve evidence usability. |
| **Program operations lead** | Trace which datasets / connectors / users feed which programs; resolve "blocked" programs. |
| **Executive sponsor reviewing readiness** | Read the Steward Brief; understand "are we ready" without reading tables. |

The surface must remain legible to **all seven** of these users
without forcing each into a different mental model.

---

## C. Admin questions the surface must answer

The Setup / Admin surface exists to answer these nine questions, in
this order of priority:

1. *What has been configured?* — tenant, connectors, users, governance.
2. *What is missing?* — required setup steps not yet completed.
3. *What data has been loaded?* — raw upload / sync input.
4. *What data is available for retrieval?* — parsed, indexed, and in scope.
5. *What data is usable as evidence?* — quality-checked, citable, gate-defensible.
6. *Who can access this tenant?* — users, roles, program scope, last activity.
7. *What governance / security risks exist?* — tenant isolation, risky permissions, audit gaps.
8. *Which agents are ready to operate?* — Nexus, Sentinel, Atlas, Steward — ready / partial / blocked.
9. *What should I fix next?* — single most leveraged action surfaced by Steward.

Every Admin module must answer **at least one** of these questions
and link back to the others. No module exists for its own sake.

---

## D. Steward responsibilities

In Admin / Setup, Steward plays seven roles:

1. **Setup guide** — walks the operator through tenant configuration
   in the right order; never lets the operator skip a load-bearing
   step without acknowledging the consequence.
2. **Gatekeeper** — refuses to claim "ready" while load-bearing
   inputs are missing; escalates blockers honestly.
3. **Permission reviewer** — surfaces risky permissions, cross-tenant
   exposure, dormant accounts, and orphaned roles.
4. **Connector monitor** — names which connectors are healthy, stale,
   or failed; explains downstream impact ("Salesforce stale → CRM
   evidence is not usable").
5. **Evidence usability validator** — translates raw "data loaded" into
   the strict evidence chain (loaded → parsed → indexed → classified →
   scoped → cited → quality-checked → usable).
6. **Audit readiness reviewer** — names audit gaps, missing approvals,
   stale decisions, and missing decision-gate documentation.
7. **Agent readiness interpreter** — composes the Agent Readiness
   Matrix in plain language: "Atlas can summarize 4 programs but
   cannot defend dollar claims; Nexus is in pattern-only state for 2
   programs; Sentinel can detect governance gaps but recurrence
   tracking is not yet wired."

Steward speaks in a **utility-clerical, zero-hedging, no-small-talk**
voice (matching the existing rail contract). Decision verbs route to
real destinations.

---

## E. Apple-like experience principles

The Admin surface is the most likely place an operator will lose
faith in the platform if it feels like a CRUD console. The bar is
**Apple-like**: calm, visual, guided, drillable, agent-led.

| Principle | What it means in Admin |
|---|---|
| **Calm hierarchy** | One headline metric per zone. No competing call-outs. Negative space wins. |
| **Minimal cognitive load** | The operator should not have to remember sub-pages — the Steward Brief and zone hierarchy do the remembering. |
| **Progressive disclosure** | Surface the Brief first; then the readiness panels; then the explorer; then the inspector. Tables come last. |
| **Click-to-explore** | Every chip, status pill, count, and program name is a route into deeper context. No dead end is acceptable. |
| **Visual status before tables** | Operators read color, icon, and chip before they read rows. |
| **Fix-next guidance** | Every gap shows a recommended next action with a route to perform it. |
| **No noisy admin clutter** | Empty buckets are suppressed. Counts of zero do not occupy real estate; they collapse. |
| **Every surface has a Steward interpretation** | A panel without an interpretation caption is incomplete. |
| **Every issue has a recommended next action** | Even when the action is "wait — Steward is monitoring for X," the action is named. |

The visual system inherits from the canonical AbarVa palette: cream
surface, Georgia serif headlines, DM Sans body, JetBrains Mono
eyebrows / chips, teal accent for ready, amber for pressure, red for
critical, muted for low / informational.

---

## F. Canonical Admin zones

The Setup / Admin landing surface has **five canonical zones**. Every
implementation slice must respect them.

```
┌─────────────────────────────────────────────────────────────┐
│ A · Admin header / tenant health                            │
├─────────────────────────────────────────────────────────────┤
│ B · Steward Brief                                           │
├──────────────────┬──────────────────────────────────────────┤
│ C · Control      │ D · Drillable explorer rail              │
│   cards /        │   or action panel                        │
│   readiness      │                                          │
│   panels         │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ E · Detail drawer / object inspector (overlay or pane)      │
└─────────────────────────────────────────────────────────────┘
```

| Zone | Purpose |
|---|---|
| **A — Admin header / tenant health** | Tenant identity, current operator, environment marker, top-line health (ready / partial / blocked). One sentence, no tables. |
| **B — Steward Brief** | Top of fold. Composes tenant setup health, the top three admin gaps, evidence + user + connector + agent readiness, and the single recommended next action. |
| **C — Control cards / readiness panels** | Module-level readiness cards: Data, Users, Security, Connectors, Audit, Evidence, Agents, AI Control Tower, Pattern Governance. Each card is a portal. |
| **D — Drillable explorer rail or action panel** | Focused list pane: dataset list, user list, connector list, audit timeline. Scoped to the selected card. |
| **E — Detail drawer / object inspector** | Per-object state: dataset metadata, user permissions, connector sync history, audit row trace. Always closeable. |

Modules without all five zones are allowed (e.g., the Build Progress
page collapses to A + C + D). Modules with **fewer than three** zones
must justify the absence in their own slice doc.

---

## G. Canonical Admin modules

The following ten modules are canonical. Each has its own future
implementation slice (see section T).

| # | Module | Primary question answered |
|---|---|---|
| 1 | **Setup Home / Control Center** | Is this tenant ready? What is the next leveraged action? |
| 2 | **Data Explorer** | What data is loaded / available / usable, by source and by program? |
| 3 | **Users & Access** | Who can see what, and is any access risky? |
| 4 | **Security & Governance** | Are tenant isolation, role policy, upload policy, and audit policy intact? |
| 5 | **Connectors** | Which connectors are healthy, stale, or failed? What downstream evidence depends on them? |
| 6 | **Audit & Activity** | What happened, by whom, when, and is it defensible? |
| 7 | **Evidence Readiness** | Which programs have usable evidence today, and which do not? |
| 8 | **Agent Readiness Matrix** | Are Nexus, Sentinel, Atlas, and Steward each ready, partial, or blocked? |
| 9 | **Pattern / Content Governance** | Which authored patterns are live, draft, retired? Which need refresh? |
| 10 | **Build Progress / Founder Control Tower** | What is the founder build status across slices, cycles, and gates? (Already partially live.) |

Existing implementations in `src/app/(maestro)/platform/admin/`
(Maestros, Roles & Permissions, Security, Active Clients, Contract
Terms, Sensitive Data Approvals, Quality Ops, Access Logs, Pending
Requests, Audit Log, API Keys, Compliance, Build Progress) **map
forward** into these ten canonical modules without breaking. Future
ADM slices may rename, group, or rehome existing routes; they must
not delete them silently.

---

## H. Canonical Enterprise Dataset Domains

This is the **most load-bearing** part of the contract. AbarVa cannot
produce decision-grade guidance until these dataset domains are
inventoried. The Admin surface must let the operator see, for each
domain, what is loaded, what is available, what is usable, and which
agents and surfaces depend on it.

For each domain we define: example datasets, why it matters, which
agents use it, which surfaces consume it, readiness criteria, common
missing inputs, and example Steward guidance.

### 1. Enterprise Strategy & C-Suite Priorities
- **Example datasets**: mission / vision / goals / OKRs; annual and
  quarterly reports for public companies; investor decks; CEO and
  CXO priorities; multi-year strategic plan; functional strategies
  (supply chain, finance, HR, IT, operations).
- **Why it matters**: every program's "why it matters" must trace
  back to enterprise priority. Without this, Atlas cannot defend
  portfolio editorial; Nexus can only render pattern-only context.
- **Agents**: Atlas (composes editorial), Nexus (Context Bundle ·
  Business Context), Sentinel (detects misalignment patterns),
  Steward (validates capture).
- **Surfaces**: Programs (charter, gate G1), Tower (executive strip),
  Intelligence (operating-model patterns), Source (CXO interviews),
  Admin (Strategy panel).
- **Readiness criteria**: ≥1 mission/vision artifact captured; ≥3
  C-suite priorities captured; functional strategy attached for at
  least Finance, Tech, and Operations.
- **Common missing inputs**: no captured CEO priority list; no
  captured CXO interview; functional strategy not yet attached.
- **Steward guidance**: "Capture 3 C-suite priorities and one CXO
  interview before promoting any G1 charter."

### 2. Business KPI / Functional Performance
- **Example datasets**: enterprise scorecard; functional KPIs (DSO,
  inventory turns, cycle time, NPS, ARR, churn, time-to-hire);
  baselines; targets; trend history.
- **Why it matters**: programs that claim dollar value must tie to a
  baseline KPI; without it, value claims are not defensible at G3.
- **Agents**: Nexus (context), Atlas (executive editorial), Sentinel
  (value-ledger patterns), Steward (gate readiness).
- **Surfaces**: Programs (G3 / G4), Tower (value-not-ready signals),
  Intelligence (value-ledger pattern), Admin (Performance panel).
- **Readiness criteria**: baseline + target captured for ≥1 KPI per
  active program.
- **Common missing inputs**: no baseline; no target; no recent trend.
- **Steward guidance**: "Attach a baseline KPI to {program} before
  publishing dollar claims."

### 3. Enterprise Architecture & Tech Stack
- **Example datasets**: current-state tech stack inventory;
  architecture diagrams (logical, application, integration, data,
  network); reference architectures; future-state target;
  technology standards.
- **Why it matters**: AI delivery cannot be planned without
  understanding what exists; ROI depends on stack reality.
- **Agents**: Nexus (context), Sentinel (architecture-debt patterns),
  Steward (readiness validation).
- **Surfaces**: Programs (Diagnose phase), Tower (operating model),
  Source (artifact upload), Admin (Architecture panel).
- **Readiness criteria**: ≥1 current-state diagram + tech stack
  catalog captured.
- **Common missing inputs**: no diagrams; tech stack inventory only
  partial.
- **Steward guidance**: "Capture the current-state architecture and
  the top 25 production applications before enabling AI use case
  shortlisting."

### 4. Application Portfolio
- **Example datasets**: app catalog (ERP, CRM, ServiceNow, Workday,
  Epic, Salesforce, finance / HR / supply-chain / clinical apps);
  business owner; criticality; lifecycle stage; AI-readiness.
- **Why it matters**: every AI initiative is anchored to ≥1
  application. Without an app catalog the value chain is broken.
- **Agents**: Nexus, Sentinel (portfolio sparsity), Steward.
- **Surfaces**: Programs, Tower, Intelligence, Admin.
- **Readiness criteria**: ≥25 apps inventoried; business owner named
  on top-10.
- **Common missing inputs**: no owner per app; lifecycle blank.
- **Steward guidance**: "Assign business owners on the 10 most
  critical apps before scoping any AI initiative."

### 5. Infrastructure / Cloud / Data Center
- **Example datasets**: data center footprint; cloud account
  inventory (AWS / Azure / GCP); region distribution; cost-by-account;
  network architecture.
- **Why it matters**: AI cost and latency claims must trace to
  infrastructure reality.
- **Agents**: Nexus, Sentinel (infra-debt), Steward.
- **Surfaces**: Programs (Diagnose), Tower (cost lens), Admin.
- **Readiness criteria**: ≥1 cloud inventory + DC footprint captured.
- **Common missing inputs**: no consolidated cloud inventory;
  region map missing.
- **Steward guidance**: "Attach the consolidated cloud account
  inventory before claiming AI cost reduction value."

### 6. Vendor / Contract / Spend
- **Example datasets**: vendor list by category (IT, AI, BPO,
  staffing); contracts; license counts; renewal dates; IT run/change
  spend; CapEx / OpEx split.
- **Why it matters**: vendor consolidation, AI license rationalization,
  and spend-redirection programs all need this domain.
- **Agents**: Nexus, Atlas, Sentinel (spend-leakage), Steward.
- **Surfaces**: Programs (Charter / Diagnose), Tower (vendor
  portfolio), Admin.
- **Readiness criteria**: top-N vendor spend captured; renewal
  calendar visible.
- **Common missing inputs**: no consolidated spend; renewals not
  tracked; license counts unknown.
- **Steward guidance**: "Capture the top-25 vendors by spend before
  enabling vendor-rationalization programs."

### 7. AI Portfolio / Use Case Inventory
- **Example datasets**: AI use case inventory (proposed, piloted,
  in-flight, retired); business sponsor; pattern key; expected
  value; current phase; current gate.
- **Why it matters**: AbarVa's primary unit of work. Without this,
  Programs and Tower are empty.
- **Agents**: Nexus, Sentinel, Atlas, Steward.
- **Surfaces**: Programs, Tower, Intelligence.
- **Readiness criteria**: ≥3 active use cases per tenant with
  sponsor + phase + pattern key.
- **Common missing inputs**: no sponsor; pattern key missing; phase
  not classified.
- **Steward guidance**: "Assign sponsor + canonical pattern key on
  every active use case before publishing the portfolio brief."

### 8. AI Tool Adoption / Usage / Cost
- **Example datasets**: Copilot, Claude Code, Codex, Cursor,
  Cline / Aider, ServiceNow agents, Workday / ERP agents, Salesforce
  Einstein; seat count; active users; usage hours; tokens; cost.
- **Why it matters**: cost-vs-value reconciliation; productivity
  attribution; license rationalization.
- **Agents**: Nexus, Atlas, Sentinel (under/over-utilization),
  Steward.
- **Surfaces**: Programs (Verify), Tower (cost), Admin (AI Control
  Tower module).
- **Readiness criteria**: ≥1 month of seat / usage / cost captured
  per active AI tool.
- **Common missing inputs**: no usage telemetry; cost not
  attributable to outcome.
- **Steward guidance**: "Attach 30 days of Copilot usage telemetry
  before claiming a productivity-uplift value."

### 9. IT Operating Model / Productivity / DORA
- **Example datasets**: DORA metrics (deploy frequency, lead time,
  change-failure rate, MTTR); release velocity; defect rate;
  productivity impact; org-level engineering cost.
- **Why it matters**: productivity / velocity is the most common
  outcome class for AI delivery programs.
- **Agents**: Nexus, Sentinel (operating-model gap), Atlas, Steward.
- **Surfaces**: Programs (Verify), Tower (operating-model lens),
  Intelligence.
- **Readiness criteria**: DORA capture or equivalent for ≥1 quarter.
- **Common missing inputs**: no DORA; productivity claim
  un-baselined.
- **Steward guidance**: "Capture DORA baseline for {team} before
  enabling productivity claims at G3."

### 10. Risk / Compliance / Governance
- **Example datasets**: AI risk register; responsible AI reviews;
  privacy reviews; security reviews; regulatory framework alignment
  (EU AI Act, NIST AI RMF, ISO 42001); audit findings.
- **Why it matters**: every executive-grade brief must trace through
  governance posture.
- **Agents**: Steward (primary), Sentinel (governance gap), Atlas.
- **Surfaces**: Programs (gate G3 / G4), Tower (governance lens),
  Admin (Security & Governance, Audit).
- **Readiness criteria**: ≥1 responsible-AI review per active high-risk
  program; risk register has named owners.
- **Common missing inputs**: no risk register; no responsible-AI
  review.
- **Steward guidance**: "Run a responsible-AI review on {program}
  before approving G3."

### 11. Evidence / Reports / Artifacts
- **Example datasets**: deliverables (charters, designs, evaluations,
  steering decks, postmortems); artifact registry; evidence
  references (E-ids); citation chain.
- **Why it matters**: nothing the agents say is defensible without
  the citation chain.
- **Agents**: Nexus, Atlas, Sentinel, Steward.
- **Surfaces**: Programs (every phase), Tower, Intelligence, Source,
  Admin (Evidence Readiness module).
- **Readiness criteria**: per-program evidence registry has at least
  one E-id wired per required deliverable.
- **Common missing inputs**: deliverable at Stub tier; no E-id;
  citation chain not yet wired.
- **Steward guidance**: "Promote {deliverable} from Stub to Outline
  and attach an E-id before claiming gate readiness."

### 12. Org Structure / Users / Ownership
- **Example datasets**: org chart; named owners per domain; data
  owners; pattern owners; deliverable owners; on-call rotation.
- **Why it matters**: every gap has to be assignable to a real
  owner; without ownership, the operating model is fictional.
- **Agents**: Steward (primary), Sentinel.
- **Surfaces**: Admin (Users & Access; Security & Governance).
- **Readiness criteria**: every active dataset domain has a named
  owner; no orphan datasets.
- **Common missing inputs**: orphan datasets; pending invites that
  never resolved.
- **Steward guidance**: "Assign a data owner on {dataset} before
  marking it usable as evidence."

---

## I. Data Explorer contract

The Data Explorer surface (canonical module 2) is where the operator
drills from "we have data" to "we have usable evidence." Every
dataset row must expose:

| Field | Definition |
|---|---|
| **dataset name** | Human-readable label. |
| **file / source name** | Original artifact name (file, table, API endpoint). |
| **source type** | upload / connector / Source / authored / generated. |
| **owner** | Named user or team. Empty = orphan. |
| **tenant scope** | Which tenant key owns it. |
| **connector / source** | Which connector or upload session produced it. |
| **parse status** | unparsed / parsed / failed. |
| **freshness** | Timestamp + age bucket (today / this week / stale / unknown). |
| **record / chunk count** | When known; honest "unknown" when not. |
| **linked programs** | List of program codes that reference this dataset. |
| **linked patterns** | List of pattern keys this dataset feeds. |
| **linked tower signals** | List of S9e signals that depend on this dataset. |
| **evidence usability state** | One of the nine canonical states (section J). |
| **agents allowed to use it** | Subset of {Nexus, Atlas, Sentinel, Steward}. |
| **missing metadata** | Field-level gaps (no owner, no tenant scope, no parse). |
| **recommended Steward action** | Single sentence; routes to the action surface. |

The Data Explorer drawer (zone E) shows: lineage (source → parse →
index → cite), dependent objects (programs / patterns / signals),
historical activity, and the single recommended action.

---

## J. Loaded / Available / Usable Evidence model

This is the **single most important distinction** in the Admin
contract. "Loaded" data is not "available" data is not "usable
evidence." Confusing them is how a platform claims more than it can
defend.

### Canonical states

```
loaded → parsed → indexed → classified → scoped → cited → quality_checked → usable_as_evidence
                                                                         ↘ blocked
```

| State | Meaning |
|---|---|
| **loaded** | Bytes are present in object storage / staging table / connector cache. Not yet structured. |
| **parsed** | Bytes were successfully parsed into a structured representation (rows, chunks, fields). |
| **indexed** | Parsed content is searchable (vector index, keyword index, structured index). |
| **classified** | Content has been tagged: which dataset domain (section H), which sensitivity tier, which language, which file class. |
| **scoped** | Tenant + program scoping applied. Cross-tenant leak is blocked by RLS / metadata. |
| **cited** | At least one E-id citation exists referencing this content from a deliverable / signal / pattern. |
| **quality_checked** | Steward (or a future automated check) has approved that the content meets the quality bar (ownership, freshness, sensitivity, completeness). |
| **usable_as_evidence** | All seven prior states are true; the content can be cited in a G3 / G4 defense. |
| **blocked** | One or more states are explicitly broken (parse failed, classification failed, scope violation detected, quality check rejected). |

### Effect on each agent

| State | Nexus | Sentinel | Atlas | Steward |
|---|---|---|---|---|
| `loaded` only | refuses substantive answers | counts existence only | does not cite | "load is not parse" warning |
| `parsed` | retrieval allowed but flagged as low-trust | structural detection only | does not cite | "parsed but not indexed" warning |
| `indexed` | retrieval allowed | pattern detection allowed | summarizes only with hedge | "indexed but not classified" warning |
| `classified` | retrieval allowed | full pattern detection | hedged editorial | "classified but not scoped" warning |
| `scoped` | retrieval at usable_with_gaps | pattern detection respects scope | scoped editorial | "scoped but not cited" warning |
| `cited` | retrieval at complete | full detection | full editorial with citation | "cited but not quality-checked" warning |
| `quality_checked` | full retrieval | full detection | full editorial | green check |
| `usable_as_evidence` | gate-ready | gate-ready | gate-ready | green check; G3 / G4 enabled |
| `blocked` | refuses to use | suppresses dependent detections | refuses to cite | red flag with named cause |

This table is the contract every agent slice must respect when it
later subscribes to dataset state.

---

## K. Users & Access contract

The Users & Access module (canonical module 3) must surface:

- **Users** — display name, email, last activity, primary role,
  active session count.
- **Roles** — system roles (admin, maestro, client viewer, data
  owner, governance reviewer, executive sponsor) with policy
  summary.
- **Tenant / client access** — which tenants each user can see; cross-
  tenant exposure surfaced as a chip.
- **Program access** — which programs each user can see (defaults to
  tenant-wide; explicit per-program when narrowed).
- **Admin privileges** — who has admin write privileges; pinned to
  the email allowlist when applicable.
- **Pending invites** — invitations sent but not accepted; aging
  bucket.
- **Last activity** — most recent sign-in / write / read; dormant
  threshold (30 / 60 / 90 days).
- **Risky permissions** — flagged by Steward: cross-tenant admin,
  dormant high-privilege, overlapping roles.
- **Cross-tenant risk check** — explicit panel naming any user with
  multi-tenant write access; routes to the tenant-isolation probe.
- **Steward recommendations** — per row: "remove dormant," "demote
  cross-tenant," "approve invite," "rotate token."

No row may exist without an action verb.

---

## L. Security & Governance contract

The Security & Governance module (canonical module 4) must surface:

- **Tenant isolation** — current state of the tenant-isolation guard
  (last verified, last probe pass, any reported defect from the
  crawler).
- **Role policy** — which roles exist; what each can do; explicit
  deny rules.
- **Upload policy** — which sources / sensitivity tiers are allowed
  per role; current blockers.
- **Model-call policy** — which agents are allowed to make external
  model calls; current freeze list (today: all are frozen for v1).
- **Evidence / citation policy** — minimum citation requirements per
  deliverable tier; gate-readiness rule.
- **Audit policy** — what is logged, retention horizon, replay
  capability.
- **Data retention posture** — current commitment (today: best
  effort; future: configurable per tenant).
- **Decision-gate policy** — canonical four-gate (G1 charter, G2 CXO
  interview, G3 design + value, G4 CXO verification) with their
  hard-input rules.
- **Governance gaps** — list of known gaps with severity and
  recommended action.

Each row is a portal into the relevant detail page.

---

## M. Connector contract

The Connectors module (canonical module 5) must surface:

- **Connector status** — healthy / degraded / stale / failed /
  unconfigured.
- **Sync health** — last attempt, last success, attempt cadence.
- **Last successful sync** — timestamp + age.
- **Failed jobs** — count + last failure reason.
- **Objects discovered** — count by object type (account, contact,
  ticket, employee, contract, deliverable).
- **Data volume** — bytes / rows in current snapshot.
- **Evidence conversion readiness** — fraction of discovered objects
  that have flowed through to `quality_checked` (section J).
- **Agent usability** — per-agent flag: can Nexus / Atlas / Sentinel /
  Steward use this connector's data today.

Every connector row routes to a connector detail drawer (zone E).

---

## N. AI Control Tower dataset contract

The Setup / Admin surface must expose AI Control Tower dataset
readiness so the operator can answer: "are we ready to run the AI
program portfolio at scale?" This evolves prior AI Control Tower
thinking into the canonical seven-dimension shape.

### Seven dimensions

| # | Dimension | Required datasets | Example KPIs | Atlas | Steward | Sentinel | Nexus |
|---|---|---|---|---|---|---|---|
| 1 | **AI Portfolio Inventory** | use case inventory; sponsor; pattern key; phase; gate | active count; pipeline value; concentration risk | composes editorial | validates inventory completeness | detects portfolio sparsity | uses inventory in Programs |
| 2 | **Adoption & Usage** | seat count; active users; usage hours; tokens | adoption rate; tool-mix concentration | composes adoption editorial | validates telemetry capture | detects under-utilization | uses telemetry in value claims |
| 3 | **Business Value & Outcomes** | baseline KPIs; targets; realized value | value delivered; ROI | composes value editorial at G4 | validates value capture | detects value-ledger incompleteness | uses value chain in retrieval |
| 4 | **Risk, Compliance & Governance** | risk register; responsible-AI reviews; framework alignment | residual risk; review coverage | composes governance editorial | validates governance posture | detects governance gaps | uses governance in refusal logic |
| 5 | **Cost & Consumption** | tool cost; infra cost; license cost | $ / active user; cost vs. baseline | composes cost editorial | validates cost capture | detects cost-leakage | uses cost in ROI |
| 6 | **Operating Model / Productivity Impact** | DORA; release velocity; defect rate | productivity uplift; velocity delta | composes productivity editorial | validates DORA capture | detects operating-model gap | uses operating model in context |
| 7 | **Technology & Data Readiness** | tech stack; cloud inventory; data quality | data-readiness score; stack coverage | composes readiness editorial | validates data readiness | detects context sparsity | uses readiness in retrieval |

Each dimension has its own readiness panel that mirrors the canonical
five zones (header + brief + cards + explorer + drawer).

---

## O. Agent Readiness Matrix

The Agent Readiness Matrix (canonical module 8) must show, per
agent, the five-field readout below. The operator must be able to
read this in under three seconds.

| Agent | Status | Context it can use | Context that is missing | What it can safely answer | What it must refuse / defer | Next admin action |
|---|---|---|---|---|---|---|
| **Nexus** | ready / partial / blocked | which dataset domains in `usable_as_evidence` | which domains short of `cited` or below | structured retrieval, Context Bundle composition, deliverable citation | substantive answers when bundle is `insufficient` / `pattern_only` / `blocked` | "Move {dataset} from indexed to cited" |
| **Sentinel** | ready / partial / blocked | which S9e signal types are populated | which signal types still seed-only | pattern detection, evidence-trail composition (I1/I2/I3) | recurrence claims, live editorial | "Wait — Sentinel persistence is deferred" or "Capture {dataset} so {pattern} can lift to high confidence" |
| **Atlas** | ready / partial / blocked | which programs have value-ledger entries | which programs lack baseline / target | executive editorial, brief composition (S9g), portfolio editorial when meta-pattern reaches high | dollar claims, gate-defense, live retrieval | "Attach baseline KPI on {program}" |
| **Steward** | ready / partial / blocked | which setup steps are complete | which canonical zones lack ownership | setup guidance, gate readiness commentary, audit readout | promises about future runtime | "Assign a data owner on {dataset}" |

The matrix consumes the I1 / I2 / I3 read models for Sentinel; it
must consume forthcoming Atlas / Nexus / Steward readiness read
models when they land. Today, where a read model is absent, the
matrix shows a **deterministic seed-only** marker (mirrors the
existing pattern across S9g, I1, I2, I3).

---

## P. Steward Brief

A deterministic v1 Steward Brief that frames the entire Admin
surface above the cards. Same shape as the Atlas / Sentinel briefs
already shipped (S9g, I2): title, top observation, why it matters,
recommended next action, and three disabled "Ask Steward" follow-ups
until the live runtime lands.

### Required fields

| Field | Definition |
|---|---|
| **title** | "{tenant} · Steward setup brief" |
| **tenantSetupHealth** | ready / partial / blocked label with one-line rationale |
| **topThreeAdminGaps** | three gaps in priority order, each with route |
| **dataEvidenceReadiness** | x of y datasets usable; x of y programs have usable evidence |
| **userSecurityRisk** | one sentence naming any risky permission / dormant high-privilege / cross-tenant exposure; "no risks observed" when none |
| **connectorRisk** | x of y connectors healthy; x stale; x failed |
| **agentReadiness** | one sentence per agent ({Nexus, Sentinel, Atlas, Steward}) |
| **recommendedNextAction** | single most leveraged next action; routes to the action surface |
| **suggestedFollowUps** | three deterministic disabled chips, mirroring S9g / I2 form |
| **sourceLabel** | `deterministic_seed` or `setup_state_read_model` |
| **interpretationBasis** | one-line explanation of confidence / coverage |

### Example

> **Steward Brief:** Your tenant has 8 datasets loaded, 3 connectors
> configured, and 2 governance gaps. Program evidence is usable for
> 4 of 7 active programs, but value-ledger inputs are incomplete on
> the remaining 3. Recommended next action: assign data owners for
> Finance Baseline and Program Evidence before enabling decision-grade
> Nexus responses.

The brief never invents a dollar amount, never claims live retrieval,
and never marks confidence higher than `medium` from a seed-only
state — these constraints are inherited directly from S9g / I2 / I3.

---

## Q. UI states

Every Admin module must handle these states explicitly:

| State | What renders |
|---|---|
| **loading** | Skeleton with the same layout as the loaded shell; never a spinner-only screen. |
| **empty tenant** | Onboarding-style copy naming the absence and the next setup action; routes to setup home. |
| **no datasets** | Honest "no datasets loaded yet" with an upload / connector-add CTA. |
| **no users** | "Only platform admins have access today" + invite CTA. |
| **no connectors** | "No connectors configured" + add CTA. |
| **insufficient permissions** | Forbidden-style screen explaining the role gap; routes to role page. |
| **degraded setup** | Yellow banner naming the load-bearing gap (e.g., no data owner). |
| **evidence not usable** | Per-program inline banner explaining which evidence state is missing. |
| **connector stale** | Per-row chip + Steward guidance row. |
| **audit gap** | Per-row chip; routes to the audit-row inspector. |
| **error state** | Plain English error + correlation id; never a stack trace. |

No module may default to a blank screen.

---

## R. Actions

Every Admin surface must support a deterministic action set. Each
action has a route, a Steward-stated reason, a confirmation step
when destructive, and an audit row.

| Action | Where it lives | Notes |
|---|---|---|
| **invite user** | Users & Access | confirm role + tenant scope before submit. |
| **update role** | Users & Access | requires admin approval; emits audit row. |
| **add connector** | Connectors | wizard form; requires owner assignment. |
| **inspect dataset** | Data Explorer drawer | read-only. |
| **assign data owner** | Data Explorer | required to lift dataset to `quality_checked`. |
| **mark dataset unavailable** | Data Explorer | explicit; emits audit row. |
| **request parse / index** | Data Explorer | enqueues a future parse / index job. |
| **approve evidence usability** | Evidence Readiness | required to lift to `usable_as_evidence`. |
| **review audit trail** | Audit module | drilldown into a specific row. |
| **resolve governance gap** | Security & Governance | requires reviewer signoff. |
| **view agent readiness** | Agent Readiness Matrix | drill into per-agent panel. |
| **open affected program / pattern / tower signal** | every panel | route into existing surface. |

Every action is reversible or auditable. No silent destructive paths.

---

## S. Acceptance criteria

The contract is satisfied when every future ADM* slice can be tested
against the following criteria. Promotion of any ADM* slice to
`verified` requires:

1. **Three-second comprehension.** An admin can understand tenant
   setup health (ready / partial / blocked plus one-line rationale)
   in under three seconds.
2. **Brief above tables.** The Steward Brief is visible above the
   detailed tables on every Admin module that has tabular data.
3. **Loaded / available / usable distinction.** Admin can click into
   data and see the canonical evidence state (section J) per dataset.
4. **Dataset domains inspectable.** Admin can inspect each canonical
   dataset domain (section H) and see gaps with named owners.
5. **Agent readiness visible.** Admin can identify which agents are
   ready / partial / blocked and what would unblock each.
6. **User / access / security posture visible.** Admin can see all
   active users, risky permissions, and pending invites.
7. **Evidence + governance visible.** Admin can see which programs
   have usable evidence and which governance gaps exist.
8. **AI Control Tower readiness visible.** Admin can see seven-dimension
   readiness (section N) without leaving the Admin surface.
9. **No cross-tenant data leaks.** Tenant isolation guard intact;
   probe tests pass; no cross-tenant write / read surfaced.
10. **No model calls required for v1.** The entire Admin surface is
    deterministic seed-driven; no Claude / OpenAI / Pinecone runtime
    calls.
11. **Existing admin routes remain compatible.** Today's admin
    routes (Maestros, Roles & Permissions, Security, Active Clients,
    Contract Terms, Sensitive Data Approvals, Quality Ops, Access
    Logs, Pending Requests, Audit Log, API Keys, Compliance, Build
    Progress) keep rendering through the implementation slices.
12. **Build Progress page remains available.** No ADM* slice may
    silently remove or break `/platform/admin/build-progress`.

---

## T. Future implementation slices

The following slices are proposed in dependency order. Each lands in
its own slice doc with explicit allowed / forbidden files.

| Slice | Name | Depends on | One-line goal |
|---|---|---|---|
| **ADM2** | Steward Setup Home / Control Center | ADM1 | The five-zone landing surface with deterministic Steward Brief and readiness panels. |
| **ADM3** | Dataset Domain Inventory Read Model | ADM1 | Pure deterministic read model for the twelve canonical dataset domains (section H), seed-only. |
| **ADM4** | Dataset Explorer UI | ADM3 | Visual explorer rail + drawer per the section I contract; no upload backend. |
| **ADM5** | Users & Access Control Surface | ADM1 | Surface per section K; no permission-editor backend. |
| **ADM6** | Security & Governance Posture | ADM1, S7 | Surface per section L; consumes existing tenant-isolation probe. |
| **ADM7** | Agent Readiness Matrix | ADM1, I1, I2, I3 (and forthcoming Atlas / Nexus / Steward read models) | Read-model-driven matrix per section O. |
| **ADM8** | Steward Brief Metadata Binding | ADM1, ADM2, ADM3 | Wire the deterministic Steward Brief (section P) to the read models above. |
| **ADM9** | Audit / Evidence Usability Drilldown | ADM1, ADM3 | Per-program evidence usability drilldown per section J. |
| **ADM10** | AI Control Tower Dataset Readiness View | ADM1, ADM3 | Seven-dimension surface per section N. |

These ten slices together implement the complete Steward-led control
plane.

---

## U. Explicit defer list

The following capabilities are **explicitly deferred** beyond ADM1 →
ADM10 unless a future slice promotes them with founder approval:

- Production upload / parsing pipeline (deferred; section J states
  remain seed-driven until the upload pipeline lands).
- Connector sync jobs (deferred; section M shows seed-driven status).
- Row-level security rewrite (deferred; current
  `assertTenantAccess` guard remains the contract).
- Full permission editor (deferred; section K is read + recommend
  only).
- Live Steward runtime (deferred; the Steward Brief is deterministic,
  follow-up chips are disabled).
- Evidence registry backend (deferred; citation chain remains
  honest-but-not-yet-wired per I3).
- Data retention enforcement (deferred; today retention is "best
  effort").
- SOC2 export / compliance bundle export (deferred).
- SSO expansion (deferred; current Clerk flow remains the contract).
- New Supabase migrations (deferred; no ADM* slice may add a
  migration without explicit founder approval).

These deferrals are not a backlog of "things we forgot" — they are
the load-bearing list of capabilities that must remain honestly
absent from the surface until they are actually implemented. Steward
must surface their absence rather than hide it.

---

## Validation

- `npx tsc --noEmit --pretty false` — pass (no application code
  changed).
- `npm run build` — pass.
- This is a documentation-only slice; there are no Jest suites
  attached. ADM2 onward will introduce read-model and component
  tests.

## Status

Code complete. Pending founder review for promotion to `verified`.

## What `verified` requires

- Founder confirms the contract reflects the intended Setup / Admin
  vision before any ADM2+ slice begins implementation.
- Founder signs off on the canonical zones (section F), modules
  (section G), dataset domains (section H), evidence states
  (section J), and the Steward Brief shape (section P).
- Founder confirms the future-slice plan (section T) reflects the
  intended order.
