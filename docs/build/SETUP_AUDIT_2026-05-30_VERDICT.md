# Setup / Admin Surface Audit — 2026-05-30 · Verdict

**Author:** Architecture review (Plan agent, founder-commissioned)
**Status:** Read-only audit, no code changes.
**Scope:** `/setup` → `/admin` redirect; 20 sub-routes under `src/app/(maestro)/admin/**`; the parallel `/home/*` tree that re-exports admin pages; `AdminCanonShellV2`, `SetupChatRail`, `HomeOverviewV2`; `overview-composer`, `home-overview-v2`, `setup-acts-registry`, `setup-data-broker`, `overview-data`; spine docs and prior 2026-05-06 audit.
**Constraints honored:** locked design system, workflow-anchored IA, broker boundary, 4 product surfaces, 5 canonical tenants.

---

## § 1 — Verdict in one paragraph

Setup/Admin is the most *architecturally serious* surface in the product and the most *operationally confusing* one. The substrate plumbing (data broker, segments, capability constellation, readiness composer) is real, the editorial frame is genuinely distinctive — Georgia serif headlines, mono eyebrows, plain-language buckets, "what's loaded / what's missing / what unlocks next" is a register no peer SaaS admin owns. A CIO at day-1 would feel intellectual respect for the framing and immediate doubt about the plumbing: there are two parallel route trees (`/admin/*` and `/home/*`) for the same surfaces, the landing page's own "Setup panels" links to `/home/*` while the sticky left sidebar links to `/admin/*`, a third route group (`SetupTenantPage`'s SubNavStrip) introduces a *different* IA pattern (Connectors · Users · Audit · Policies · Tenant), and the page importing `getServerSupabase` directly (`src/lib/admin/overview-data.ts:11`) violates the broker boundary the spine doc declares load-bearing. The day-30 steward would survive — there are real, well-built panels here (Connectors 353 lines, Production Readiness with tabs and gate matrix, Users & Access with provision form) — but they would learn to ignore the landing page because every navigation choice feels arbitrary. The day-30 incident-response admin has no surface to triage from; there is no "what just leaked / what's degraded / what's stuck" spine. An investor watching over the shoulder would clock the typography and the substrate cards as credible — and clock the two-sidebar confusion in the first 30 seconds. **The bones are excellent, the IA is mid-migration, and the True North Star is one consolidation sprint away from being defensible at a pilot.**

---

## § 2 — Design audit

### Information architecture — the problem is real

Three navigation systems coexist on the same surface today:

1. **`AdminSidebar`** (`src/components/admin/AdminSidebar.tsx:10`) — driven by `ADMIN_SUB_SECTIONS` in `src/lib/admin/admin-shell-config.ts:19`. Items: Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness, Training. Training points at `/home/learn`. So the official admin sidebar already has one foot in `/home`.
2. **`HomeOverviewV2` Section 05 "Setup panels"** (`src/lib/admin/home-overview-v2.ts:136`) — 8 cards: Data Trust, AI Initiatives, Connectors, Users & Access, Agent Readiness, Production Readiness, Compliance, Activity Log. Six of them point at `/home/*`, two at `/admin/*` (`/admin/audit`, `#` for Compliance). The card stack on the landing page disagrees with the sidebar on the same page.
3. **`SetupTenantPage`'s `SUB_NAV_ITEMS`** (`src/components/setup/SetupTenantPage.tsx:9`) — Connectors · Users · Audit log · Policies · Tenant. This is the legacy 5-tab IA that survived under `/admin/tenant`, `/admin/users`, `/admin/audit`, `/admin/policies`. It does not appear in the AdminSidebar at all. So if you reach `/admin/tenant` via a deep link, you see a different nav than if you reach `/admin/data-trust`.

This is not a quibble. Three navs means there is no "the IA." An operator on day 1 cannot form a mental model. On day 30 they have memorized one path and treat the others as visual noise.

Add the platform-level ambiguity: `/strategic-moves` and `/moves` both exist as peer surfaces (`(maestro)/moves/page.tsx`, `(maestro)/strategic-moves/page.tsx`). The Setup landing readiness card points to `/strategic-moves` (`home-overview-v2.ts:129`) — but the design constraint says the four product surfaces are Intelligence · Moves · Source · Tower. Which one is the move surface? The product doesn't know yet.

### Density vs whitespace — better than Snowflake-grade-thin, not Snowflake-grade-dense

The landing page (`HomeOverviewV2.tsx`) padding is 36/64/28 in the masthead and 40/64/96 in the main content, with `maxWidth: 1280` (lines 133, 208). A 4-column module-readiness grid with 12px gap, an 8-card panel grid with 10px gap, and a Steward orientation block with 28px padding. This is *editorial-magazine density*, not operations density. A senior Snowflake admin who lives in 20-row tables would feel the breathing room is luxurious — beautifully so, but not weight-bearing.

The good news: the editorial register is consistent and deliberate. The bad news: the page is *4 vertical sections of mostly attention-getting decoration* (mono eyebrows, ◆ glyphs, Georgia serif at 38px, 30px, 22px). The actual *operator payload* per section is one block. A trader's terminal this is not.

### Evidence-first vs ornamental — mostly evidence

Pixels mostly earn their place. The orientation block is genuinely doing the "what's loaded / what's missing / next load" work the spine doc demands (`HomeOverviewV2.tsx:233-279`). The readiness cards show pct + note + next-action href (`home-overview-v2.ts:98-131`). The panel cards include a foot line with real counts. Two things are ornamental and cost trust:

- The `<Pill bg=brand.brandSoft fg=brand.bgColor>` industry-label tagline ("Omnichannel retail · 412 stores · $4.2B revenue", `HomeOverviewV2.tsx:74-78`) reads like a sales site, not an admin tool. The same data, surfaced as `industry · key facts` in mono eyebrow, would feel like an instrument.
- The "Substrate live" hard-coded pill (`HomeOverviewV2.tsx:193`) is unconditional. If Substrate isn't live, that pill is a lie. It should be tied to `liveSnapshotPresent` from the telemetry bridge.

### Hierarchy & scannability — 5-second test fails for incident response, passes for orientation

If the operator's question is "where do I start," the answer is in 5 seconds — the orientation block is at section 02. If the question is "what just broke" or "is there anything I need to approve," it's a 4-scroll journey to section 03 Action queue (gated to hide when empty). If the question is "who has access to what" or "did anyone leak data," there is no answer on the landing page at all.

### Consistency with peer surfaces

Tower, Source, Intelligence all share an editorial canvas pattern (eyebrow → title → lede → blocks). Setup's `HomeOverviewV2` uses a different one (masthead with avatar block + numbered sections). The sub-routes (Data Trust, Agent Readiness, Connectors) use `PageHead` (eyebrow / title / lede) and look more peer-like. So the **landing is a different page-grammar than the rest of the surface**. This is a smell. The landing should be the most-consistent page in the surface, not the most-different.

### What's elegant

- The Steward orientation prose composition in `overview-composer.ts:78-124`: deterministic template-fill from substrate. No LLM at runtime, no hallucination risk, plain-language buckets ("3 categories — including KPI dictionary — are empty"). This is the right shape for an admin surface.
- The action queue ranking by impact-score from `setup-vocab`, with severity-tinted index numbers and primary-action button on item #1 (`HomeOverviewV2.tsx:286-336`). Genuinely useful.
- The Capability Constellation matrix on `/admin/agent-readiness` is the single most differentiated screen in the whole product — 14 segments × 6 capability families is a credible answer to "what can your agents do today."
- The "live caveat" line in the sidebar footer (`AdminSidebar.tsx:130-148`). Tells admins they're looking at a deterministic read model. That posture is honest and rare.

### What's noise

- The 64×64 brand initials tile on the masthead (`HomeOverviewV2.tsx:138-156`). It's a logo that conveys nothing. Replace with an industry icon + KPI strip, or delete.
- The "HOME · WHERE YOU STAND AND WHAT TO DO NEXT" eyebrow (`HomeOverviewV2.tsx:170`). The page is /admin, the sidebar says "Setup · Admin," the eyebrow says HOME. Three labels for the same thing.
- The `<Rule>` separator (1px line at 36px vertical margin, `HomeOverviewV2.tsx:413`). A surface with this many visual dividers (section eyebrows + display-serif h2 + lede + rule + content) loses its primary hierarchy.

### What's missing

- **An incident lane.** No "what just happened" feed beyond the recent-activity block, which is a substrate audit tail, not a security/policy audit tail. Cross-tenant retrieval leaks (which the founder has been chasing in production — see task STRESS-P0-006) have no surface here.
- **A connector posture digest above the fold.** Connectors is panel 03 in a stack of 8. For a control plane, connector health belongs in the masthead.
- **A consistent right rail.** Some pages get `<SetupChatRail/>` (Steward dock), some get `<AgentRail/>` (static rail, hard-coded labels), some get no rail. Three rail variants in one surface is a tell.
- **A "for whom" affordance.** No way to switch tenant from inside Setup. Demo-driver and incident-driver both need this.

---

## § 3 — Features audit

### Sub-route enumeration

| Route | LOC | Tag | Why |
|---|---|---|---|
| `/admin` | 133 | **CORE** | The landing — composed orientation, action queue, readiness, panels. |
| `/admin/data-trust` | 88 | **CORE** | Substrate state + buckets + ladder. This is the page Setup must do supremely well. |
| `/admin/agent-readiness` | 90 | **CORE** | Capability Constellation lives here. The differentiated artifact. |
| `/admin/production-readiness` | 122 | **CORE** | Gate criteria matrix + blockers + history. Real pilot/prod posture surface. |
| `/admin/connectors` | 353 | **CORE** | Connector list + categories + drawer + requirements. Earned its weight. |
| `/admin/connectors/[connectorId]` | 21 | **CORE** | Thin route, delegates to component — OK. |
| `/admin/connectors/[connectorId]/reconnect` | 17 | **CORE** | Recovery flow — keep. |
| `/admin/users-access` | 300 | **CORE** | RBAC + invites + program-provision. Real. |
| `/admin/users-access/sso-configuration` | 180 | **CORE** | SSO setup — gates `invite`. Keep. |
| `/admin/programs/approvals` | 190 | **CORE** | Tenant-admin gate decisions. Steward's job. |
| `/admin/programs/approvals/[requestId]` | 260 | **CORE** | Drilldown. Keep. |
| `/admin/cross-program-signals` | 57 | **CORE** | Workflow-anchored Atlas surface (was `/admin/agents/atlas`). |
| `/admin/segments/[segmentId]` | 87 | **CORE** | Substrate detail — links from Data Trust. |
| `/admin/audit` | 7 | **WRONG ALTITUDE** | Routes to `SetupAuditPage` (276-line client component). Should be the spine of an Incident lane, not a tab inside Tenant nav. Currently rendered with the legacy `SUB_NAV_ITEMS` instead of `AdminSidebar` — IA mismatch. |
| `/admin/policies` | 7 | **WRONG ALTITUDE** | 642-line `SetupPoliciesPage` is real, but lives under the legacy SubNavStrip. Belongs grouped with Data Trust + Users & Access under one Governance group. |
| `/admin/tenant` | 7 | **REDUNDANT** | `SetupTenantPage` (365 LOC) duplicates what `/admin` already says (tenant masthead). Demote to a Tenant configuration sub-route under a single Tenant group. |
| `/admin/users` | 7 | **REDUNDANT** | `SetupUsersPage` (309 LOC) overlaps `/admin/users-access`. Pick one. The richer one (`/admin/users-access`, 300+component) wins; this is dead. |
| `/admin/invite` | 8 | **REDUNDANT** | `InviteCollaboratorPage` is 891 LOC. Should be a modal off Users & Access, not a top-level route. |
| `/admin/atlas/traces` | 316 | **WRONG ALTITUDE** | Agent-named, raw trace inspector. Belongs in an Engineering/Diagnostics surface, not in Setup. Or fold into `/admin/cross-program-signals` as a "traces" tab. |
| `/admin/agents/atlas` | 14 | **DEAD/ORPHANED** | Deprecated redirect to `/admin/cross-program-signals`. Keep the redirect; the directory should be deleted once analytics confirm no inbound links. |

Plus the parallel re-exports under `(maestro)/home/*`:
- `/home/data-trust`, `/home/connectors`, `/home/agent-readiness`, `/home/tenant-profile`, `/home/ai-initiatives` — all re-export the corresponding `/admin/*` pages. **The most damaging fact in this audit**: the landing-page panel hrefs go to `/home/*` while the sidebar goes to `/admin/*`. Same code, two URLs. Pick one canonical tree and 301 the other.

### Coverage matrix

| Module | Coverage % | What's missing | What's overbuilt |
|---|---|---|---|
| **Tower** | ~30 | No coupling from /admin into Tower portfolio config; readiness card derives `towerPct` from a hard-coded formula (`home-overview-v2.ts:84-87`), not Tower's own posture. No Tower onboarding or staff-aug config from Setup. | The two-tree (`/tower/*` + `/admin/programs/approvals`) split duplicates approval surfaces. |
| **Source** | ~55 (not 60) | Source readiness card uses raw event count + at-risk penalty (`home-overview-v2.ts:88-90`). No Source-specific configuration in /admin (sources, vendors, contract clause library). Connector + Source overlap is unmodelled. | None overbuilt here; this surface is just under-wired. |
| **Intelligence** | ~70 (not 75) | Capability Constellation is real and live, but per-agent grounding scores in panel 05 are hard-coded (`Sentinel L3 · others L2`). No grounding score per *capability family*. No Sentinel scorecard. | None. The Constellation is the right shape; just hook the L3/L2 to a real source. |
| **Moves/Nexus** | ~50 (not 70) | Programs/approvals is real and well built. But Moves overall (the strategic-moves surface) has zero Setup-side config: no initiative registry config, no portfolio capacity, no value-track posture. The readiness card uses `initiativesCount` with at-risk penalty — directional only. | The `/strategic-moves` vs `/moves` route duplication confuses the surface; that's not in /admin but it makes the Setup readiness card link ambiguous. |

The prior estimates were directionally right; today's substrate is thinner than they suggest.

---

## § 4 — Ease of use

### Persona A — First-time tenant admin (provisioned, opens /setup)

**Click 1 — /setup redirects to /admin (correct).** Top bar reads "Setup / Admin"; sidebar says "Setup · Admin · Steward · Control plane · tenant setup & readiness." Brand-tile masthead. 10-second scan: the orientation prose makes sense ("3 categories are loaded… 2 are empty… strengthen X to unlock Y"). They reach for the primary action queue item — "Open" button on item #1.

**Friction (high).** Click destinations are inconsistent. The first time they click a Section 05 panel card ("Data Trust"), the URL changes to `/home/data-trust`. The sidebar continues to show `/admin/data-trust` highlighted. They wonder if they've been kicked out of Setup. Returning via the sidebar takes them back to `/admin/data-trust`, identical content, different URL. *That is a credibility hit at minute 2.*

**Stuck point.** "Configure SSO to invite users" is the second action queue item. Clicking it takes them to `/admin/users-access/sso-configuration`. That page (180 LOC) is real but mostly form scaffolding. The first-time admin doesn't know what their IdP discovery URL is. The page does not offer Clerk-native provisioning shortcuts, vendor-specific guides, or a "test connection" affordance.

**Time-to-first-meaningful-action:** 8–12 minutes (open Setup → read orientation → click Data Trust → realize they need to upload something → realize Setup has no upload affordance from the landing → navigate to Data Trust → realize Data Trust is read-only blocks).

**Confidence at completion:** **Medium-low.** Orientation prose builds trust; nav inconsistency and the absence of an upload affordance from the landing erodes it.

### Persona B — Day-30 steward (returning, managing posture)

**Autopilot.** They go to `/admin` (or `/setup`), scan the action queue, click into Connectors (sidebar route). Connectors page works — well-built, 4-tab pattern, drawer, requirements matrix. They click into Users & Access — also real, with the program-provision form. They check Production Readiness — gate criteria matrix, blockers, history.

**Hard to find.** The audit trail. `/admin/audit` is buried (not in the AdminSidebar). The only path is to remember the route or click the Panel 08 card ("Activity Log") on the landing. The landing's "Recent activity" block is substrate-events only, not policy-events or auth-events.

**Forces them to leave Setup.** Anything ad-hoc: "did Mary's invite go through" (Clerk console), "did the connector pull last night" (Vercel logs / Supabase logs), "what did Sentinel respond to user X on date Y" (`ai_egress_audit` table — no UI). Three of these should live in Setup. Today, none do.

### Persona C — Incident-response admin

This is where the surface breaks down hardest.

**Cross-tenant leak scenario** (real: STRESS-P0-006 in the task list). Admin opens /admin. The landing shows tenant readiness and module health, none of which reflect a security incident. There is no "auth & isolation posture" block. The `ai_egress_audit` events that would expose a tenant-resolution failure have no UI. The admin cannot triage from /admin — they have to read Vercel logs and run SQL against Supabase.

**Connector failure scenario.** Admin opens /admin. The connector tile reads "Live state in panel · audit shows recent ingest" — copy is hard-coded (`home-overview-v2.ts:139`). They go to Connectors (sidebar). The page lists connectors with health states but does not show a "what's wrong right now" sticky banner. They click into the failing connector, get a detail drawer with auth tab, requirements tab. Decent but slow.

**Approval-gate stuck.** Easiest path: click "Review N HIGH cross-program signals" in the action queue or "Approve N program briefs." Both routes exist and are real. This is the one incident scenario the surface handles well today.

**What's missing for incident response:** A signal-driven landing pane (top-third), an audit trail that includes auth/policy/connector events not just substrate-imports, and a "switch tenant" affordance so the founder can investigate one tenant from another.

---

## § 5 — True North Star

### 5.1 — One-sentence positioning

> *Setup is the Trust Plane — the place where a senior tenant admin sees, in one view, whether AbarVa's agents are grounded, integrated, governed, and accountable for this tenant right now.*

### 5.2 — The 5 jobs Setup must do supremely well

1. **Make the data flywheel legible.** Show what substrate is loaded, what is missing, and what one more upload unlocks. *Success criterion:* an admin can name the next data load and its consequence within 30 seconds of landing.
2. **Make tenant isolation auditable.** Show RLS posture, recent tenant-resolution audit, and any cross-tenant anomalies. *Success criterion:* an admin can answer "did anything cross tenants in the last 24 hours" without leaving Setup.
3. **Make integrations honest.** Connector health with last-pull, scope, and failure mode in one row. *Success criterion:* a degraded connector shows on the landing before the admin clicks anything.
4. **Make governance acts deterministic.** Approval gates, policy changes, SSO state, and role grants are linked to outcomes and have a trail. *Success criterion:* every privileged action has a one-line entry in the audit feed within 5 seconds.
5. **Make agent capability declarative.** What each agent can confidently do today, per capability family, based on substrate. *Success criterion:* the Capability Constellation answers "what would Sentinel say about CDP vendor lock" with a depth state.

### 5.3 — The IA that falls out

**Top-level groups (4):**

1. **Overview** — landing, includes signals & action queue
2. **Substrate** — Data Trust, Segments, Agent Readiness (the constellation)
3. **Integrations** — Connectors, SSO, Identity (Clerk surface), Production Readiness
4. **Governance** — Users & Access, Policies, Approvals, Audit & Trust

**Default landing block stack** (top to bottom, no scroll past the fold for primary):

```
[Masthead]          tenant · industry · 3 KPI counters · refreshed N ago
[Trust strip]       4 chips: substrate ●, isolation ●, integrations ⚠, governance ●  (color-coded, click → group)
[Action queue]      max 5 items, ranked impact-first  (currently exists, move up the stack)
[Posture grid]      4 cards: Substrate readiness · Connector health · Auth/RLS posture · Approvals pending
[Audit ribbon]      last 6 governance events, mixed surfaces (substrate + auth + policy + connector)
```

The orientation prose block stays — but as the second screen, accessed by a "Steward's read" sticky pull-tab. It's beautiful copy and the right register, but it's not first-screen for an operator.

**Route → group mapping for the current 20 routes:**

| Current route | Group | Action |
|---|---|---|
| `/admin` | Overview | Keep; restructure blocks per §5.3. |
| `/admin/data-trust` | Substrate | Keep. |
| `/admin/segments/[segmentId]` | Substrate | Keep. |
| `/admin/agent-readiness` | Substrate | Keep. Rename surface header to "Capability constellation." |
| `/admin/connectors` + sub-routes | Integrations | Keep. |
| `/admin/users-access` + `/sso-configuration` | Governance + Integrations | Split: user roster + invites under Governance; SSO under Integrations. |
| `/admin/programs/approvals` + drilldown | Governance | Keep. |
| `/admin/cross-program-signals` | Overview | Promote: a high-severity signal is a landing-page citizen, not a sub-route. |
| `/admin/production-readiness` | Integrations | Keep. |
| `/admin/audit` | Governance | Promote: this is the Audit & Trust spine. Wire policy, connector, and auth events into it, not just substrate. |
| `/admin/policies` | Governance | Keep, under Governance. |
| `/admin/tenant` | Overview (config tab) | Demote: tenant config is a tab inside Overview, not a destination. |
| `/admin/users` | DELETE | Redundant with users-access. |
| `/admin/invite` | DELETE as route | Become a modal off users-access. |
| `/admin/atlas/traces` | Engineering | Move out of Setup, or fold as a "traces" tab inside cross-program-signals. |
| `/admin/agents/atlas` | Already deprecated | Delete after analytics window. |
| All `/home/*` re-exports | DELETE | Pick `/admin` as canonical; 301 `/home/*` → `/admin/*` (or vice versa) but not both. |

**Sub-nav pattern.** Snowflake-style secondary subnav per design memory: a single horizontal tab strip directly below the page header, never a second left rail. Today, `/admin/connectors` and `/admin/production-readiness` already do this well. The SetupTenantPage's separate `SubNavStrip` should die.

### 5.4 — The Data Trust backbone

Today Data Trust, Connectors, Users & Access, Audit, and Tenant config are 5 separate pages with 5 separate composers. They share data but never compose. The spine must be one read model:

```ts
TrustSpine = {
  substrate:  { segmentsTotal, mature, sparse, missing, lastIngest }
  isolation:  { rlsCovered, lastTenantResolutionEvents, anomaliesLast24h }
  integration:{ connectorsLive, degraded, lastPullByConnector, nextRenewal }
  governance: { ssoConfigured, openApprovals, policyDriftCount, openInvites }
  audit:      { last24hEvents: union(substrate, auth, policy, connector) }
}
```

The landing renders this spine as a 4-chip strip + 4-card grid + 6-row ribbon. Each chip is a click into its group. The agent-readiness page derives from `substrate`. Connectors derives from `integration`. Approvals + Users from `governance`. Audit reads the union ribbon. **One read model, five pages.**

This requires a real broker contract (`getTrustSpine(tenantKey): TrustSpine`) that satisfies the broker boundary. Today `src/lib/admin/overview-data.ts:11` imports `getServerSupabase` directly and queries `engagements` and `source_events` from the admin page. That needs to move behind `AgentContextBroker` or a Setup-equivalent broker.

### 5.5 — What gets deleted / merged / demoted

| Route / file | Action |
|---|---|
| `(maestro)/home/data-trust/page.tsx` and 5 sibling re-exports | DELETE. Make `/admin` the only tree. 301 `/home/*` → `/admin/*` in proxy/middleware. |
| `(maestro)/admin/users/page.tsx` + `SetupUsersPage.tsx` (309 LOC) | DELETE. Users-access is the canonical roster. |
| `(maestro)/admin/invite/page.tsx` + `InviteCollaboratorPage.tsx` (891 LOC) | DEMOTE to a modal/drawer launched from Users & Access. Keep the component as a controlled dialog. |
| `(maestro)/admin/tenant/page.tsx` + `SetupTenantPage.tsx` (365 LOC) | DEMOTE to a tab on `/admin` (Overview → Tenant config). Kill the legacy SubNavStrip. |
| `(maestro)/admin/policies/page.tsx` (links to `SetupPoliciesPage`, 642 LOC) | MOVE under Governance group; keep the page; rewrap in `AdminCanonShellV2`. |
| `(maestro)/admin/audit/page.tsx` + `SetupAuditPage.tsx` (276 LOC) | KEEP route, EXPAND content to be the Audit & Trust spine described in §5.4. Wire policy / auth / connector / substrate events. |
| `(maestro)/admin/atlas/traces/page.tsx` (316 LOC) | MOVE to `/engineering/traces` or fold as a tab under cross-program-signals. Not Setup. |
| `(maestro)/admin/agents/atlas/page.tsx` (legacy redirect) | DELETE after analytics window. |
| `/strategic-moves` vs `/moves` | OUT OF SCOPE for Setup, but Setup's readiness card link should be pinned to one of them and the founder needs to decide which Moves surface is canonical. |
| Brand-tile masthead avatar (`HomeOverviewV2.tsx:138-156`) | DELETE. Replace with the Trust strip. |
| The unconditional "Substrate live" pill (`HomeOverviewV2.tsx:193`) | Make conditional on `liveSnapshotPresent`. |
| `home-overview-v2.ts` panels array (8 cards) | REPLACE with the 4-group navigation aligned to §5.3 IA. |

### 5.6 — The pivotal screen

**The screen:** `/admin` landing, redesigned as **the Trust Plane**.

**Layout.** Three sticky zones above the fold (no scroll on a 1440×900 display):

- **Zone A · Masthead (96px tall).** Tenant name (Georgia, 30px), industry + tagline (DM Sans, 13px), refresh stamp (mono, 11px), and a single inline switcher chip ("acting as Apex Retail · switch") for founder/admin multi-tenant. No logo tile. No brand color band. Black-and-cream on cream paper. The masthead conveys *who* and *when*, nothing else.
- **Zone B · Trust strip (56px tall).** Four equal-width chips: **Substrate**, **Isolation**, **Integrations**, **Governance**. Each chip is `<status-dot> <noun> <one-number><one-word>` — example: `● Substrate · 11 mature / 3 sparse`, `● Isolation · 0 anomalies 24h`, `⚠ Integrations · 1 degraded`, `● Governance · 2 approvals pending`. Click → jumps to that group. Color is from the locked palette (Georgia ink; teal for ready, amber for attention, red for breach). Each chip is the page's primary state-of-the-tenant — a CIO can read the entire posture from this strip alone.
- **Zone C · Action queue (top 3 only, 220px tall).** The current queue is good. Surface only the top three above the fold; the rest live below the fold with a "see all N" pointer. Item 1 has a primary "Open" button (black filled), items 2 and 3 are ghost. Severity-tinted number column. Mono panel-label · consequence.

**Below the fold:**

- **Zone D · Posture grid (4 cards, 2×2).** Each card is one trust dimension:
  - *Substrate readiness* — segment count, % mature, last ingest, top 1 sparse segment with "Load X to unlock Y" copy. Click → Data Trust.
  - *Connector health* — connectors total, count by status, last pull time, top 1 degraded with reason. Click → Connectors.
  - *Auth & isolation posture* — RLS coverage %, tenant resolution events in last 24h, any anomalies named in plain language. Click → a NEW Isolation tab under Governance.
  - *Approvals & policy* — open approvals, policy drift count, SSO state. Click → Approvals.
- **Zone E · Audit ribbon (6 rows).** A *unified* event feed mixing substrate-ingest events with auth events with policy edits with connector pulls. Same temporal axis. Color-keyed by source. Click any row → the full audit page filtered to that surface. This is the answer to "what just happened" for an incident-response admin.
- **Zone F · Steward's read (collapsible).** The current orientation prose — Steward's voice paragraph + loaded/missing/next-load columns — retained at the bottom as a "read this before deciding" block. It's the most emotionally resonant thing on the page; it should not be first, but it should not be deleted.

**Content density target.** Above the fold on 1440×900: ~5 numbers per chip × 4 chips = 20 numbers; 3 action items with 2 facts each = 6 numbers. Total 26 numbers + 4 status dots + 1 timestamp on the masthead. That's *Snowflake-grade dense* without losing the editorial register, because every number is paired with a 2–3 word plain-language anchor.

**Empty state.** First load, no substrate yet: masthead shows tenant; the four chips show `○ no data yet` in muted gray; Zone C displays a single primary card — *"Upload your first dataset to begin grounding."* — with two ghost suggestions (org structure or KPI dictionary, the two highest-leverage starts). Zone D is replaced by a single 4-column upload affordance with the four "first 4 datasets" cards. The Steward orientation reads `"AbarVa has no substrate for this tenant. Once you load enterprise profile, Sentinel can begin answering with provenance."` This empty state is the founder's first-15-seconds demo and it must be more elegant than any peer admin tool's empty state.

**Loading state.** Skeletal chips with the dots blank; numbers replaced by `··· `. No spinners. The page renders the static masthead and Trust strip skeleton in <100ms; chip numbers stream in as the broker resolves. The action queue and posture grid each have their own suspense boundary. No full-page spinner anywhere — that's a founder principle and it should be visible here.

**What makes it different from every admin dashboard ever.** Three things, in order:

1. **The unification.** Most admin tools show you connectors *or* policies *or* RBAC. This shows the four trust dimensions on one strip and treats them as the same posture. The page is composed from one read model (`TrustSpine`), and that composition is visible — the user can see the connection.
2. **The editorial register.** Georgia serif for the masthead and zone headings, mono for status, DM Sans for body, on cream paper, black actions. No tabs across the top, no sidebar competing with the strip, no marketing pills. It reads like the front page of a serious operations memo. Snowflake-grade density with editorial restraint is a register nobody else owns in this category.
3. **The honesty.** "Live caveat" stays in the sidebar footer (`AdminSidebar.tsx:147`). Substrate-live pill becomes conditional. Every number is dated. Every fact cites its source segment. Empty states say "no substrate" not "set up". This is a control plane that admits when it doesn't know.

If this screen ships, a CIO on day-1 sees in 5 seconds whether AbarVa is grounded for their tenant, and a returning admin on day-30 has one page to live in. That is the surface that makes the rest of the product believable.

---

## § 6 — Risk register

**Biggest design risk.** Compressing the masthead + Trust strip into 96+56 = 152px above the fold may force a font-scale reduction that breaks the Georgia/DM Sans/mono balance. The current page uses 38px display serif and gets away with it because content is sparse. The Trust Plane will be denser; the 30px h2 may need to drop to 22px and the masthead h1 to 26px. That's at the edge of the locked typography; mitigation is to use the lockup as-is and accept a 200px sticky header instead of 152px.

**Biggest engineering risk.** The unified `TrustSpine` read model means joining substrate (Supabase), connector health (currently mostly fixture in `connectors-page-view.ts`), Clerk-sourced governance (SSO + invites), and the audit ledger (`audit_log_events` table). At least two of those sources have no production query path today. The risk: shipping a Trust strip whose Integrations chip is unbacked, which would make the page a lie. Mitigation: ship Substrate + Governance chips fully wired in Wave 1; ship Integrations + Isolation as authored stubs marked `evidence: 'estimated'` until the data lands, with the live-caveat footer line extended to call out which chips are estimated.

The second engineering risk: the broker-boundary violation in `src/lib/admin/overview-data.ts:11` (direct `getServerSupabase` import) needs to be moved behind a broker contract. The spine doc declares this load-bearing. If it stays, every new Setup page will copy the pattern, and the doctrine erodes.

**Biggest "founder is wrong" risk.** The instinct that pulls toward the editorial orientation prose ("3 categories are loaded…") as the centerpiece may be a founder's instinct, not an operator's instinct. Operators want numbers above prose. The 2026-05-08 wireframe lock around the prose-first orientation block is beautiful and right *for the founder's demo to a CIO who has 90 seconds*. It is wrong for *a steward who lives on this page*. The Trust Plane recommendation here puts the prose under the fold. If Anand resists that, the demo wins but the daily-usage retention loses. The mitigation is the collapsible "Steward's read" pull-tab — make the prose accessible without making it primary — but the demo will feel slightly less magic. Decide deliberately.

---

## § 7 — 90-day execution slicing

### Wave 1 — Weeks 1–3 · "One canonical tree, one read model"

Goal: kill the IA contradiction; ship the `TrustSpine` broker; land the Trust strip on the landing.

**PRs (6):**

1. **Single route tree.** Pick `/admin/*` as canonical. Delete `(maestro)/home/{data-trust,connectors,agent-readiness,ai-initiatives,configuration,tenant-profile,training}/page.tsx` re-exports. 301 `/home/*` → `/admin/*` in proxy/middleware. Keep `/home` and `/home/queue` (those are real pages, not re-exports). Update `home-overview-v2.ts:136-145` panel hrefs to `/admin/*`.
2. **Delete redundant routes.** Remove `/admin/users` and `SetupUsersPage.tsx`. Remove `/admin/invite` route; convert `InviteCollaboratorPage` into a modal off `/admin/users-access`. Remove `/admin/agents/atlas`. Move `/admin/atlas/traces` to `/engineering/traces` or fold into cross-program-signals tab.
3. **Demote tenant page.** Move `/admin/tenant` content to a tab inside `/admin`. Kill the legacy `SUB_NAV_ITEMS` SubNavStrip. Ensure every Setup page uses `AdminCanonShellV2` with `AdminSidebar`.
4. **TrustSpine broker.** Introduce `src/lib/admin/trust-spine-broker.ts`. Move the queries from `overview-data.ts` and any inline `getServerSupabase()` calls behind it. Define `getTrustSpine(tenantKey): TrustSpine`. Wire substrate + governance chips fully (Substrate from `data_inventory_segments`; Governance from approval queue + SSO state + open invites). Mark integrations + isolation as `evidence: 'estimated'`.
5. **Trust strip component.** Build the 4-chip strip and wire it as the first block in `HomeOverviewV2`. Conditional "Substrate live" → `liveSnapshotPresent`. Move action queue under the strip. Push the Steward orientation block below the action queue.
6. **Audit ribbon stub.** Extend the recent-activity composer to also pull approval events + connector reconnect events + invite events. Surface unified ribbon on landing. Schema for `audit_log_events` union view in Supabase migration.

**Wave 1 gate:** Click any panel link from the landing, land at the same URL the sidebar would land at. `/setup` → `/admin`; no `/home/*` re-exports remain. Trust strip renders with at least Substrate + Governance live. Module hygiene test rejects any `getServerSupabase` import outside the broker.

**Not in this wave:** Capability Constellation overhaul, connector deep work, isolation panel, masthead redesign beyond removing the brand-initials tile.

### Wave 2 — Weeks 4–6 · "Connector + Isolation honesty"

Goal: integrations and isolation chips become real; landing serves incident-response.

**PRs (6):**

1. **Connector health broker.** Pull connector last-pull, scope, status into `TrustSpine.integration`. Wire the Integrations chip to live data. Reorder Connectors page to put degraded connectors at the top.
2. **Isolation lane.** New `/admin/audit?tab=isolation` view (or `/admin/governance/isolation`). Reads `ai_egress_audit` and tenant-resolution logs. Surfaces anomaly count on the Trust strip chip. This is the answer to STRESS-P0-006-class incidents.
3. **Audit ribbon — full join.** Substrate + auth + policy + connector + invite + approval events unified on one ribbon, filterable. Powers Zone E on the landing and the Audit page.
4. **Posture grid.** The 2×2 card grid on the landing (Substrate / Connector / Isolation / Approvals & policy). Each card pulls from TrustSpine; each click jumps to the group.
5. **Tenant switcher chip.** Inline masthead chip — founder/admin can switch tenant from inside Setup. Required for incident response.
6. **Connectors action strip + onboarding flow.** "Add connector" entry point on landing; first-class flow with Clerk-OIDC for the common cases; test-connection affordance.

**Wave 2 gate:** Incident scenario — an admin can answer "did anything cross tenants in the last 24 hours?" from `/admin` in <10 seconds without leaving the surface. A degraded connector is visible on the masthead Trust strip without clicking. Lighthouse perf on `/admin` landing ≥ 90 (mobile 4G).

**Not in this wave:** Compliance panel, full per-agent grounding rewrite, /home merge with /admin, Moves consolidation.

### Wave 3 — Weeks 7–9 · "Capability constellation + agent readiness, real"

Goal: agent-readiness becomes a board-ready artifact; Setup feels finished.

**PRs (7):**

1. **Live capability matrix.** Replace hard-coded "Sentinel L3 · others L2" with real per-capability-family grounding scores derived from substrate + last-N answer evaluation. Drives the panel-05 status and the constellation.
2. **Per-segment unlock preview.** On Data Trust, every sparse segment shows a concrete preview: "Load this and Sentinel can answer X with citation Y." Tie to `unlocksCopy` in setup-vocab and extend.
3. **Steward chat lane upgrade.** Connect StewardDockPane to the TrustSpine read model so chat can answer "what should I do next" with grounded context, not just generic guidance.
4. **Compliance panel.** Wire panel 07 from `home-overview-v2.ts:143` (currently 'locked' with `href: '#'`). Even if it's just a posture digest (SOC 2 / GDPR posture cards), kill the dead link.
5. **Production-readiness consolidation.** Merge the Production Readiness tabs into a single posture page sequenced as gate criteria first, blockers next, history last. Demote the 4-tab pattern to 2 (Decision · History).
6. **Empty-state polish.** Implement the empty-state design from §5.6 — applies to brand-new tenants in pilot.
7. **Loading-state polish.** Suspense boundaries per zone; remove any spinner; verify streaming on the landing.

**Wave 3 gate:** A CIO walkthrough of Setup completes in 4 minutes, hits Overview + Substrate + Integrations + Governance, and the CIO can answer all five jobs from §5.2 from observation alone. Pilot Day-1 admin can self-provision SSO + invite their first 3 users + see at least one connector pull in green, all inside Setup.

**Not in this wave:** Multi-tenant admin overlay (founder view across all 5 canonical tenants), AI initiative registry rewrite, Moves surface consolidation.

---

## Appendix — Critical files for implementation

- `src/app/(maestro)/admin/page.tsx`
- `src/components/home/HomeOverviewV2.tsx`
- `src/lib/admin/home-overview-v2.ts`
- `src/lib/admin/overview-data.ts` (broker-boundary violation)
- `src/lib/admin/admin-shell-config.ts`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/setup/SetupTenantPage.tsx` (legacy SubNavStrip — kill)
- `src/app/(maestro)/home/{data-trust,connectors,agent-readiness,ai-initiatives,configuration,tenant-profile,training}/page.tsx` (re-export removal)
