# AbarVa · Product Map

**Purpose:** Canonical nav structure, page-by-page overview, sub-routes, role visibility. Single source of truth for product structure.
**Date:** April 19, 2026
**Status:** Final structure. Pack F cleanup pending to land this nav on prod.

---

## Top nav · 5 items

```
Home   ·   Engagements ★   ·   Intelligence ★   ·   Control Tower ★   ·   Platform
```

**★ = branded product** (primary visual weight, pitch-deck feature)

Three products at peer level. One daily entry point (Home). One operational hub (Platform).

### Current state vs target

| Live today | Target | Action |
|---|---|---|
| Dashboard | **Home** | Rename |
| Engagements | Engagements | No change |
| Data setup | — | **Fold into Platform → /platform/data** |
| User setup | — | **Fold into Platform → /platform/users** |
| Intelligence | Intelligence | No change to slot (content changes via Pack E) |
| Control Tower | Control Tower | No change |
| Admin | **Platform** | Rename + absorb Data + Users |

---

## The three products · structural logic

Mental model — and how to explain it in the Shail pitch:

**Engagements** is where *transformation happens* — workspace where Nexus and the Maestro work through an engagement turn by turn.

**Control Tower** is where *situation is lived* — the client's portfolio view, their day-to-day dashboard across AI initiatives, transformation programs, tech stack health.

**Intelligence** is where *knowledge compounds* — the cross-client learning layer, what AbarVa knows across every engagement it has ever touched.

These three are independent but interconnected. A Maestro moves between them during a workday. The client primarily lives in Control Tower. Intelligence is primarily a Maestro surface with controlled client exposure.

**Home** is the entry point. **Platform** is the machinery.

---

## Page-by-page

### 1 · Home (`/` → `/home`)

**Purpose.** Daily entry point. *"What needs my attention today?"*

**Audience.** Every logged-in user. Content varies by role.

**Content (Maestro view):**
- Active engagements — 4-8 cards with phase, status, next action
- Alerts needing attention — contradictions, pattern triggers, data gaps
- Recent insights — 2-3 from Insight Detector, last 48h
- Pinned Library entries
- Your queue — deliverables to review, turns awaiting input

**Content (client_viewer view):**
- Tower summary as hero card
- Engagement status (theirs only)
- 2-3 most recent Tower alerts

**Agents on page.** None directly. Reads from Nexus state, Insight Detector output, engagement metadata.

**Sub-routes.** None. Home is flat.

**Current state.** Exists as `/dashboard`. Needs rename + content redesign per this spec.

---

### 2 · Engagements ★ (`/engagements`)

**Purpose.** The transformation workspace. Where Nexus lives. Where consultative work happens turn by turn.

**Audience.** Primarily Maestro. Client_viewer sees only engagements they're explicitly included in.

**Sub-routes:**

| Route | What it is |
|---|---|
| `/engagements` | List view — all engagements accessible to current user |
| `/engagements/[id]` | **Engagement console** — hero workspace, Nexus turn-by-turn |
| `/engagements/[id]/deliverables` | Deliverable browser + version history |
| `/engagements/[id]/topics` | Assigned topic playbooks + diagnostic questions progress |
| `/engagements/[id]/patterns` | Active Genome patterns + evidence |
| `/engagements/[id]/contradictions` | Live contradiction log |
| `/engagements/[id]/turns` | Turn history with search |
| `/engagements/[id]/charter` | Engagement charter + sponsors + timeline |
| `/engagements/[id]/settings` | Access, topic assignment, archive |

**Engagement console layout** (the `/engagements/[id]` page):
- Left rail: engagement meta (phase, sponsors, topics, stats)
- Center: Nexus conversation (turns flowing top-to-bottom)
- Right rail: active patterns + recent contradictions + anticipation chips

**Agents on page.** Nexus (primary). Anticipation Worker (chips). Deliverable Engine + Quality Reviewer (on-demand).

**Current state.** Shipped. Console works. Sub-routes (deliverables, contradictions) arrive as Packs H + L + L land.

---

### 3 · Intelligence ★ (`/intelligence`)

**Purpose.** Platform knowledge layer. What AbarVa knows across engagements — browsable, queryable, cited.

**Audience.** Maestro (primary). Client_viewer access controlled — they may see a subset filtered to their industry.

**Sub-routes:**

| Route | What it is |
|---|---|
| `/intelligence` | Redirects to `/intelligence/library` |
| `/intelligence/library` | **Catalog** — topics, patterns, vendors, regulations, frameworks, benchmarks, research, news |
| `/intelligence/insights` | Auto-detected meta-patterns from Insight Detector |
| `/intelligence/live` | Operational pulse — real-time ingestion, pattern triggers, system activity |
| `/intelligence/ask?q=...` | Ask Intelligence query surface with shareable URLs |

**Top of page on all three tabs:** Ask Intelligence input bar (stateless, non-personalized, librarian posture). See `abarva-ask-intelligence-spec.md` for implementation.

**Agents on page.** Ask Intelligence (primary). Intent Router + Follow-up Generator (internal to Ask). Insight Detector writes to /insights nightly.

**Current state.** Route exists but content is placeholder. Full build via Pack E + Ask Intelligence spec (~3-5 days after Pack B+C data populated).

---

### 4 · Control Tower ★ (`/tower`)

**Purpose.** Client's situational dashboard. *"What's happening across our AI portfolio, transformation programs, tech stack — right now?"* The primary surface for the client's day-to-day.

**Audience.** Client_viewer lives here. Maestro uses for portfolio-level view. Observer has read-only access.

**Sub-routes:**

| Route | What it is |
|---|---|
| `/tower` | Overview — portfolio hero view |
| `/tower/ai-portfolio` | All AI use cases — production, pilot, stalled, shadow |
| `/tower/programs` | Active transformation programs (engagement outcomes in-flight) |
| `/tower/stack` | Tech stack — infra, apps, data platforms, costs, overlap flags |
| `/tower/alerts` | Live contradictions, pattern triggers, data gaps |
| `/tower/domains/[domain]` | Per-domain deep dive (e.g., RCM, fraud, supply chain) |

**Hero overview blocks:**
- AI portfolio health — count by status, monthly spend trend, coverage gaps
- Active transformation programs — in-flight engagement outcomes with % complete
- Tech stack hotspots — vendor overlap, cost anomalies, risk flags
- Alerts feed — most recent contradictions, pattern triggers
- KPIs per industry — RCM for healthcare, fraud for FS, supply chain for retail

**Single-client chrome principle (Pack H):** client_viewer sees *only their* Tower. No client selector, no portfolio navigation hinting at other clients. URLs scoped. Maestro sees a selector at top-right to switch clients.

**Agents on page.** None actively generating. Reads from client data, Insight Detector output, contradiction detection pipeline.

**Current state.** Route exists (`/tower`). Deep content requires Pack H + I + J data to populate. Roadmap in `abarva-control-tower-roadmap.md`.

---

### 5 · Platform (`/platform`)

**Purpose.** The operational hub. Data management, user management, integrations, observability, billing, settings. Everything that makes AbarVa run but isn't a product surface.

**Audience.** Maestro has full access. Client admin sees a scoped subset. Client_viewer never sees this nav item at all.

**Sub-routes:**

| Route | What it is |
|---|---|
| `/platform` | Overview — platform health snapshot |
| `/platform/data` | Data overview — ingestion health, source counts, recent activity |
| `/platform/data/sources` | All data sources inventory (tech stack, cost centers, use cases, workflows) |
| `/platform/data/onboard` | Onboarding wizard — new data source upload flow |
| `/platform/data/onboard/[dimension]` | Dimension-specific onboarding (infra, apps, data, ai, cost, eng, vertical domains) |
| `/platform/data/health` | Integration status, last-sync times, data quality flags |
| `/platform/data/templates` | Downloadable CSV + Excel bundles per industry |
| `/platform/data/demo` | Demo data generator (Maestro-only) |
| `/platform/users` | All users list |
| `/platform/users/new` | Invite user |
| `/platform/users/roles` | Role assignments |
| `/platform/users/permissions` | Per-resource access controls |
| `/platform/integrations` | SSO, Slack, email, API keys, third-party connectors |
| `/platform/observability/agents` | Agent traces — cost, latency, tokens per agent (Agent Atlas materialized) |
| `/platform/observability/graph` | Knowledge graph admin (viz endpoint from Pack C Phase E) |
| `/platform/observability/logs` | System logs |
| `/platform/billing` | Subscription, usage (hidden from client_viewer) |
| `/platform/settings` | General platform settings |

**`/platform` overview content:**
- **Data coverage** — "62% of your data domains populated" with CTA to onboarding
- **Users** — "34 active · 8 pending invites"
- **Integrations** — "8 connected · 1 syncing · 0 failing"
- **Platform health** — "99.2% uptime last 7 days · 4 agents active"
- **Data dimension heat map** — which of the 20 domains are fed, which are empty

Data doesn't lose visibility — it just sits under the right parent. Overview page surfaces coverage + health signals the way Data top-nav would have.

**Agents on these pages.** Onboarding Companion (on `/platform/data/onboard`). Upload Classifier (invisible). No user-facing agents elsewhere.

**Current state.** Partially shipped as scattered routes (`/data`, `/users/new`, `/admin`). Consolidation + rename via Pack F. Observability sub-pages arrive with Pack C Phase E + Agent Atlas implementation.

---

## Role-based nav visibility

What each role sees in the top nav:

| Role | Home | Engagements | Intelligence | Control Tower | Platform |
|---|---|---|---|---|---|
| **Maestro** | ✓ | ✓ | ✓ | ✓ (with client selector) | ✓ (full) |
| **Client admin** | ✓ | ✓ (theirs only) | ✓ (filtered to industry) | ✓ | ✓ (data + users only) |
| **Client viewer** | ✓ | ✓ (if explicitly included) | — | ✓ | — |
| **Observer** | ✓ | — | — | ✓ (read-only) | — |

Key privacy principles:
- Client_viewer never sees Platform. Their data is managed on their behalf by client admins or Maestros.
- Client_viewer sees no client selector on Tower — they see *only their* Tower. Single-client chrome (Pack H).
- Intelligence for client admins shows industry-filtered Library (e.g., Healthcare client sees healthcare topics + shared cross-industry, not FinServ-specific entries).
- Observer is a rare role — auditors, investors in a demo, board observers. Read-only, Tower + Home only.

---

## What this locks

1. **Five nav items. Never six. Never seven.** Anything that could tempt a seventh slot goes into Platform.
2. **Three branded products** at primary visual weight — Engagements, Intelligence, Control Tower. Home and Platform get equal but visually quieter nav treatment.
3. **Platform is the only admin-style item.** If something administrative comes up later (audit logs, SSO config, new integration type), it goes under `/platform/*`.
4. **Data stays visible on `/platform` overview.** Coverage and health surface as hero cards despite the section no longer being top-nav.
5. **Intelligence is for the platform's knowledge, Control Tower is for the client's situation.** Never let these blur.
6. **Engagement console is inside `/engagements/[id]`.** Not its own top-nav item, not a separate product.

---

## What Pack F needs to do

1. Rename top nav:
   - `Dashboard` → `Home`
   - `Data setup` → removed from top nav
   - `User setup` → removed from top nav
   - `Admin` → `Platform`
2. Move `/data/*` routes under `/platform/data/*` (301 redirects from old paths)
3. Move `/users/*` routes under `/platform/users/*` (301 redirects)
4. Move `/admin/*` routes under `/platform/*` (301 redirects)
5. Build the `/platform` overview page with the hero cards specified above
6. Update role-based rendering on nav component per the visibility matrix

Roughly 1-1.5 days of Claude Code work. Add this as Pack F Part 5 (the four parts of Pack F — menu restructure, rename, dead code cleanup, forbidden-name guard hardening — are already specified; this becomes part 5 or replaces part 1 entirely since the nav target changed).

---

## Pitch-slide summary

> *"AbarVa is five surfaces. Three are products:*
> *— **Engagements** is where we transform.*
> *— **Intelligence** is where we learn.*
> *— **Control Tower** is where the client lives.*
> *The other two are Home (daily entry) and Platform (everything else). No tabs. No sub-products. No feature sprawl. This is the shape of the product — forever."*

That line + the five-item nav image lands in one slide. Shail sees the product structure in three seconds.
