# Source Audit · Claude Code Standing Instructions
## Read-only audit of AbarVa Source against design baseline + doctrine baseline

| | |
|---|---|
| **Doc ID** | `SOURCE_AUDIT_PROMPT_2026-05-05` |
| **Version** | 1.0 |
| **Audience** | Fresh Claude Code session assigned to Source audit |
| **Authority** | Anand (founder) · sole sign-off on findings |
| **Scope** | Audit-only · NO code changes · NO migrations · NO PRs touching `src/` |
| **Estimated effort** | 77–94 hours across 6 modes · ~2.5 weeks |
| **Companion docs** | `SOURCE_DOSSIER_DIGESTION.md`, `SOURCE_DESIGN_V03_RECONCILIATION.md` |

---

## §0 · How to read this prompt

You are a fresh Claude Code session. You have been assigned a **read-only audit** of the AbarVa Source feature in the `~/Projects/nexus/` repository. This document is your complete standing instruction set. Read all of it before opening a single file in the repo.

The audit produces **documents and a gap register**. It does NOT produce code, migrations, or fixes. If during audit work you identify something that "should be fixed," you log the finding to the gap register with severity and recommendation. Fixing is a separate, post-audit decision made by Anand.

This prompt has 12 sections. Read in order:

- §1 Hard scope ground rules — what you must NOT do
- §2 Why this audit exists — context that informs your judgment
- §3 The two baselines — what you're auditing against
- §4 The 6 audit modes — what to produce, in what order
- §5 Conflict resolution rules — when sources disagree
- §6 Output structure — where deliverables land
- §7 Anchor points — the 600+ assertions to verify
- §8 Reporting cadence — how to communicate findings
- §9 Acceptance — when you're done
- §10 Failure modes specific to this audit — what previous agents got wrong
- §11 Reference repo locations
- §12 Final checklist before you start

---

## §1 · Hard scope ground rules

These rules are non-negotiable. Violating any of them makes your audit invalid and triggers escalation to Anand.

### 1.1 What you MUST NOT do

You MUST NOT:

1. **Modify any file in `src/`** — not a single line, not a typo fix, not a comment update
2. **Create or run database migrations** — no `supabase/migrations/` files, no migration SQL, no schema changes
3. **Open a PR that touches code** — your PRs touch only `docs/` paths
4. **Implement any of the gaps you identify** — even if the fix seems obvious; even if it's a one-line change; even if you're "already in there"
5. **Refactor anything** — including obviously broken things; including dead code; including duplicated logic
6. **Run destructive operations** — no `rm`, no force-push, no branch deletion, no data deletion
7. **Modify seed data or fixtures** — even if you find clearly wrong values
8. **Touch any other feature area** — Strategic Moves, Tower, Setup, Intelligence, Production Readiness — all out of scope; only `/source/*` and Source-specific code paths
9. **Make decisions Anand has not delegated** — when in doubt, log a question, don't decide
10. **Pretend the audit is complete when it isn't** — partial audits get reported as partial, not as complete

### 1.2 What you MAY do

You MAY:

1. **Read any file in the repo** — including code, tests, migrations, fixtures, docs, configs
2. **Run database queries against the local/dev DB** — read-only SELECT statements, no INSERT/UPDATE/DELETE/DDL
3. **Run the dev server locally to inspect rendered UI** — but do not click buttons that mutate data; observation only
4. **Run existing tests to observe pass/fail** — but do not write new tests as part of the audit
5. **Generate documents in `docs/design/source/audit/`** — this is your output directory
6. **Open PRs containing only `docs/` changes** — one PR per audit mode + one PR for synthesis
7. **Ask Anand for clarification when stuck** — better to pause than to drift

### 1.3 The "fix while I'm here" trap

This is the single most common audit failure mode. The previous Knowledge Layer audit by Cursor went off-script TWICE in 24 hours by drifting from "audit and document" into "audit and fix the obvious things." This created PR #1517, which had to be closed because it shipped destructive migrations that bypassed the audit's governance entirely.

When you encounter something broken during the audit, your reflexive thought will be: "this is a one-line fix, let me just do it." Resist. The fix may have unintended consequences you can't see. The fix may conflict with planned substrate work. The fix may be wrong because the audit hasn't yet established what "right" means.

The discipline: **log it, don't fix it.** Every gap goes in the gap register with severity and recommendation. Fixing happens after Anand reviews the complete audit and decides what to fix in what order.

---

## §2 · Why this audit exists

Source is one of three major product surfaces in AbarVa (alongside Strategic Moves and Setup/Tower). It was built in waves over multiple PRs against an original design dossier (v1.0). The team believes Source is "good" but has never done a formal audit to verify whether reality matches the design.

Three things triggered this audit:

1. **An evolved design (v0.3) exists** that materially differs from the original dossier — Universal Canvas pattern, chat moved to left lane, 14 templates instead of 6 routes. Need to know whether implementation reflects v0.3 or is stuck at dossier v1.0.

2. **The Source dossier pre-disclosed implementation gaps** (sec 12 lists 3 "Partial / gap" items: Scorecard Governance, Artifact Detail, Source Value Ledger). Need to know if those gaps are still open or have been closed since the dossier was written.

3. **The Knowledge Layer audit precedent** — when audits aren't done, accumulated drift between design intent and shipped reality silently breaks user trust. The team now believes audits should precede decisions about what to refine.

This audit produces the truth needed to make those decisions. It is not a fixing exercise. It is a seeing exercise.

---

## §3 · The two baselines

You are auditing against TWO baseline documents, with different roles:

### 3.1 Design baseline — `Source_End-to-End.html` (v0.3, 14 templates)

This is the **current visual + interaction design** for Source. It defines:

- 14 templates organized in 3 waves (Spine / Tables / Exec)
- Universal Canvas pattern (one shell governing 7 of 11 steps)
- Chat-lane-left / canvas-right layout
- Step rail with 11 nodes
- Drawer treatment for data readiness, evidence, and gate detail
- Specific demo data narratives (4 events across Apex Retail and Meridian Health)
- Pre-disclosed binding gaps (footnote)

When auditing **what the UI should look like and how it should behave**, this is your authority.

### 3.2 Doctrine baseline — `AbarVa_Source_IT_Sourcing_Product_Requirements_Design_Dossier_v1.md` (dossier v1.0)

This is the **product requirements + agent doctrine** for Source. It defines:

- 4 named agents (Nexus, Sentinel, Steward, Atlas) with bounded roles
- 11 canonical sourcing steps with primary user questions and lead agents
- 13 data readiness states
- 10 artifact states · 4 value states
- 13 personas
- 15 forbidden claims (sec 15.2 + sec 2.2 non-goals)
- 7 product truths that must remain visible (sec 2.3)
- 9 universal page acceptance criteria (sec 13.1)
- Stage-by-stage data requirements (sec 9.2)
- Field-level data binding reference (sec 18)

When auditing **what the agents should claim and not claim, what data must be present, what must be honestly disclosed**, this is your authority.

### 3.3 Companion docs you will read

Before starting, read both companion docs in `docs/design/source/`:

- `SOURCE_DOSSIER_DIGESTION.md` — structured summary of the dossier with anchor points
- `SOURCE_DESIGN_V03_RECONCILIATION.md` — what changed from dossier v1.0 to v0.3, including conflict resolution rules

These are pre-digested for you. They condense ~3,500 lines of source material into ~700 lines of structured baseline. Do not re-read the original dossier line-by-line; trust the digestion. If the digestion is wrong about something, log it as a finding and flag it to Anand.

---

## §4 · The 6 audit modes

The audit runs in 6 modes. Modes 1–5 are independent investigations. Mode 6 synthesizes them.

### 4.1 Mode 1 · Substrate audit — what the database actually holds

**Question:** Does the substrate hold the data the design promises?

**Inputs:** `SOURCE_DOSSIER_DIGESTION.md` §7 (stage data), §8 (field-level binding), §9 (UI element binding); `SOURCE_DESIGN_V03_RECONCILIATION.md` §4 (demo events), §5 (Universal Canvas anatomy).

**Tasks:**
- Inventory every Source-related table, view, RLS policy, foreign key
- For each canonical field in `SOURCE_DOSSIER_DIGESTION.md` §8 (sourcingEvent.eventId, stage.currentStep, dataReadiness.state, artifact.status, etc.), confirm a corresponding column exists or log it as a substrate gap
- For each of the 4 demo events in `SOURCE_DESIGN_V03_RECONCILIATION.md` §4 (AMS Outsourcing 2026, Cloud Platform Consolidation, Data Platform Renewal, Endpoint Management Migration), confirm seed data exists with appropriate stage, gate state, blocker, agent attribution
- Verify tenant scoping — Apex Retail events visible only to Apex users, Meridian to Meridian
- Verify the artifact catalog supports the `dNN_short_name` convention shown in v0.3 design
- Verify pricing trap log substrate exists with severity (P0/P1/P2), agent attribution, vendor association
- Verify confidence-band substrate is NOT present (per v0.3 footnote — "v2 PENDING SUBSTRATE" must mean substrate doesn't yet exist)

**Output:** `docs/design/source/audit/01-SUBSTRATE_INVENTORY.md`

**Effort:** 15–18 hours

**Acceptance:** Every field in the dossier digestion §8 has a substrate verdict (present / partial / missing). Every demo event from v0.3 §4 has a seed data verdict. Tenant scoping verified for both canonical tenants (Apex Retail, Meridian Health) and informationally for the other 3.

### 4.2 Mode 2 · Code-path audit — what the implementation actually does

**Question:** Does the code path that renders Source match the design?

**Inputs:** All of `src/app/source/`, `src/lib/source/`, `src/lib/intelligence/source-*`, `src/app/api/source/`, `src/app/api/chat/agent/route.ts` (for agent scoping).

**Tasks:**
- Map every Source route handler to the page component it renders
- Map every page component to the data queries it makes
- Map every mutation to the substrate tables it touches
- Identify dead code (functions exported but never called from Source paths)
- Identify duplicate logic (same query implemented in multiple places)
- Verify the Universal Canvas shell is implemented as ONE shell consumed by 7 step contexts (NOT 7 near-copies)
- Verify the bespoke variants for Steps 5/6/8/11 use distinct components
- Verify drawer infrastructure exists for data readiness, evidence, and gate detail
- Verify the agent route at `src/app/api/chat/agent/route.ts` correctly scopes Source-context conversations (event/step/agent attribution)
- Verify chat-lane is in left position across all step contexts (per v0.3, NOT right-rail per dossier)

**Output:** `docs/design/source/audit/02-CODE_PATH_MAP.md`

**Effort:** 18–22 hours

**Acceptance:** Every Source route documented end-to-end (URL → handler → component → queries → tables). Universal Canvas shell consistency verified or gap logged. Dead code and duplicates inventoried.

### 4.3 Mode 3 · UI deployed audit — what the user sees in production

**Question:** Does the deployed UI on Vercel preview match the v0.3 design?

**Inputs:** Vercel preview URL for current `main` branch · `Source_End-to-End.html` · `SOURCE_DESIGN_V03_RECONCILIATION.md` §5 (Universal Canvas anatomy).

**Tasks:**
- For each of the 14 templates in v0.3 design, navigate to the deployed equivalent and compare
- Capture screenshots of each surface in each meaningful state (canonical user, canonical event, canonical step)
- For each canonical tenant (Apex Retail, Meridian Health), walk Flow 1 (act on a stuck event) and Flow 2 (create new event)
- Verify the 11-step rail renders consistently across all step contexts
- Verify chat-lane is in left position with context strip and three-choices
- Verify status chips, agent attribution, and value-at-stake formatting match v0.3
- Verify drawer overlays slide from right (per v0.3 footnote production behavior)
- Capture console errors and network failures during walk-through
- For the 3 informational tenants (Apex/other, plus 2 not-yet-named), spot-check that the same patterns work but flag variance as informational

**Output:** `docs/design/source/audit/03-UI_DEPLOYED_AUDIT.md` with embedded screenshots in `docs/design/source/audit/screenshots/` directory.

**Effort:** 14–18 hours

**Acceptance:** All 14 templates have a deployed-vs-design verdict. Both canonical tenants walked end-to-end. Console error log captured.

### 4.4 Mode 4 · Agent behavior audit — what Nexus/Sentinel/Steward/Atlas actually say

**Question:** Do the agents behave per dossier §7 (Agent Behavior Requirements) and §8 (Context Requirements)?

**Inputs:** Source-scoped agent fixtures · `SOURCE_DOSSIER_DIGESTION.md` §2.1 (agent roles), §3 (forbidden claims), §4 (must remain visible truths) · agent route at `src/app/api/chat/agent/route.ts`.

**Tasks:**
- Construct 30 fixture conversations across the 4 canonical tenants, covering each of the 11 steps and each agent's lead context
- For each fixture, replay through the deployed agent and capture:
  - What patterns load
  - What context is in the prompt (event, step, data readiness, artifacts, vendors, evidence)
  - What the agent claims
  - Whether claims are evidence-grounded or evidence-free
  - What artifacts the agent produces or references
  - What the agent refuses or skips
- Verify agent NEVER claims missing data exists (per dossier §7.1)
- Verify agent NEVER cites loaded/uploaded files as usable evidence (forbidden claim #4)
- Verify agent NEVER claims final selection (forbidden claim #12)
- Verify agent NEVER claims realized savings without measurement owner + evidence (forbidden claim #7)
- Verify agent ALWAYS names current event/step/blocker/next-action when offering recommendations
- Verify agent ALWAYS produces three choices + custom when moving work forward
- Verify agent attribution (Nexus/Sentinel/Steward/Atlas) is correct per step (per dossier §2.2 lead agent column)

**Output:** `docs/design/source/audit/04-AGENT_BEHAVIOR_AUDIT.md`

**Effort:** 12–14 hours

**Acceptance:** 30 fixtures replayed. Each of the 15 forbidden claims tested with at least 2 prompts attempting to elicit them. Agent attribution verified across all 11 steps.

### 4.5 Mode 5 · Documentation drift audit — what the docs claim vs. what's true

**Question:** Where do existing docs (READMEs, comments, design files) diverge from reality after Modes 1–4?

**Inputs:** Outputs of Modes 1–4 · all Source-related documentation in `docs/design/source/`, `docs/build/`, `README.md`, code comments in Source files.

**Tasks:**
- For every Source design doc in the repo, compare claims against Mode 1–4 findings
- Where docs claim X and reality is Y, log as drift
- Where docs are silent on something the code does, log as undocumented behavior
- Where docs reference deprecated patterns (e.g., dossier's right-rail chat vs. v0.3's left-lane chat), log as superseded
- Where code comments make claims about behavior, verify against Mode 2/3 findings

**Output:** `docs/design/source/audit/05-DOCUMENTATION_DRIFT.md`

**Effort:** 10–12 hours

**Acceptance:** Every Source design doc has a drift verdict. Top 10 most-drifted docs flagged for prioritized update.

### 4.6 Mode 6 · Cross-reference matrix — synthesis

**Question:** Where are the inconsistencies across substrate / code / UI / agent / docs?

**Inputs:** Outputs of Modes 1–5.

**Tasks:**
- Build a matrix where rows are Source features (one row per template + key feature like "value-at-stake rendering" or "promote button enabling") and columns are: substrate verdict, code verdict, UI verdict, agent verdict, docs verdict
- For each row, identify whether all 5 columns agree (consistent) or disagree (drift)
- For each drift, characterize: which layer(s) are wrong, what the recommendation is
- Produce the gap register: every gap from Modes 1–5 consolidated, deduplicated, severity-rated, recommendation-tagged

**Output:** 
- `docs/design/source/audit/06-CROSS_REFERENCE_MATRIX.md` — the matrix
- `docs/design/source/audit/SOURCE_GAP_REGISTER.md` — the consolidated gap register
- `docs/design/source/audit/00-AUDIT_SUMMARY.md` — executive summary, top findings, recommended next steps (this is the doc Anand reads first)

**Effort:** 8–10 hours

**Acceptance:** Matrix has every Source feature × every audit mode. Gap register has zero duplicates and every entry has severity + recommendation. Executive summary is ≤4 pages and answers: is Source solid, is Source drifted, what should be done first?

---

## §5 · Conflict resolution rules

When the dossier baseline and the v0.3 design baseline disagree, apply these rules:

| Conflict type | Authority | Notes |
|---|---|---|
| Layout, position, visual hierarchy | v0.3 design | dossier visual specs are superseded |
| Page count, route count | v0.3 design | 14 templates + 3 drawers, not 6 routes |
| Per-step uniqueness | v0.3 design | Universal Canvas governs 7, bespoke 4 |
| Chat lane position | v0.3 design | Left lane, not right rail |
| Atlas scope | v0.3 design | Atlas stays in Source; Tower not yet designed; do NOT audit Tower integration |
| Vocabulary (agent names, step names, state names) | dossier | v0.3 inherits dossier vocabulary |
| Forbidden claims | dossier | 15 prohibitions (15.2 + 2.2) are hard constraints |
| Agent role bounds | dossier | Nexus/Sentinel/Steward/Atlas roles are doctrine |
| Evidence rules | dossier | "Loaded ≠ usable evidence" is doctrine |
| Universal acceptance criteria | dossier | 9 criteria from §13.1 apply per surface |
| Implementation status statuses | NEITHER | Both are stale; Mode 1 + Mode 2 establish ground truth |

When something is ambiguous (e.g., a feature appears in v0.3 with no dossier coverage, or a dossier rule has no v0.3 equivalent), log it as an open question in the audit summary, do NOT make the call yourself.

---

## §6 · Output structure

All audit outputs land in `docs/design/source/audit/`. Final structure:

```
docs/design/source/audit/
├── 00-AUDIT_SUMMARY.md                    ← Anand reads this first
├── 01-SUBSTRATE_INVENTORY.md              ← Mode 1 output
├── 02-CODE_PATH_MAP.md                    ← Mode 2 output
├── 03-UI_DEPLOYED_AUDIT.md                ← Mode 3 output
├── 04-AGENT_BEHAVIOR_AUDIT.md             ← Mode 4 output
├── 05-DOCUMENTATION_DRIFT.md              ← Mode 5 output
├── 06-CROSS_REFERENCE_MATRIX.md           ← Mode 6 synthesis
├── SOURCE_GAP_REGISTER.md                 ← Consolidated gap register
└── screenshots/                           ← Mode 3 captures
    ├── apex-retail/
    │   ├── t01-portfolio.png
    │   ├── t02-create-event.png
    │   └── ...
    └── meridian-health/
        └── ...
```

Each Mode N output uses this structure internally:

1. Mode purpose + scope (1 paragraph)
2. Methodology (what you did, what tools, what fixtures)
3. Findings (organized by anchor point per §7 below)
4. Per-finding detail (what was checked, what was found, severity, evidence)
5. Open questions for Anand
6. Sign-off checklist (own work; doesn't replace Anand sign-off)

The gap register uses this row format:

| Gap ID | Source Mode | Severity | Layer | Description | Evidence | Recommendation |
|---|---|---|---|---|---|---|

Severity ladder: **P0 critical** (broken doctrine, e.g., agent claims forbidden) · **P1 high** (broken design, e.g., template materially differs from v0.3) · **P2 medium** (drift, e.g., docs say X reality says Y) · **P3 low** (cosmetic, e.g., status chip color slightly off).

---

## §7 · Anchor points (the assertions to verify)

Per `SOURCE_DESIGN_V03_RECONCILIATION.md` §6, the audit has roughly **600 testable assertions**. They group as follows:

### A · Vocabulary integrity (~50 assertions)
4 agents × correct roles · 11 steps × correct names + lead agents · 6+ routes (now 14 templates) × correct paths · 13 readiness states · 10 artifact states · 4 value states.

### B · Forbidden claims (~30 assertions)
15 specific prohibitions × 2 elicitation attempts each.

### C · Required design implications (~21 assertions)
7 product truths × 3 surfaces each.

### D · Universal page acceptance (~126 assertions)
9 criteria × 14 templates.

### E · Implementation status verification (~20 assertions)
Each capability in dossier §12 verified against current code/UI.

### F · Stage data requirements (~80 assertions)
11 stages × ~7 required fields × 2 canonical tenants verified for presence.

### G · Field-level binding (~32 assertions)
16 canonical fields × substrate target verification + UI consumer verification.

### H · UI element binding (~22 assertions)
11 UI elements × seed source + real source verification.

### I · Artifact catalog (~39 assertions)
13 artifacts × 3 verifications each (producer agent, reviewer, evidence requirement).

### J · Cross-surface integration (~12 assertions)
6 integration points + 6 consistency rules. **NOTE:** Tower integration is NOT audited (Tower not yet designed per v0.3).

### A1–A6 · v0.3 additions (~320 assertions)
- A1 Universal Canvas shell consistency: 7 universal screens × 15 zone elements = 105
- A2 Bespoke variant fidelity: 4 variants × 10 elements = 40
- A3 Step rail consistency: 11 nodes × 11 step contexts × 3 states = 33 (focused)
- A4 Drawer behavior: 3 drawer types × 3 invocation contexts = 9
- A5 Mini-rail in portfolio: 4 rows × 11 dots × 3 states = 132
- A6 v0.3 binding gaps honored: 5 gaps × verification = 5

**Audit guidance:** You don't enumerate all 600 in your output. You verify them in batches by anchor group, and report findings at the group level with specific exceptions called out. The gap register captures the specific exceptions.

---

## §8 · Reporting cadence

**Per-mode incremental reporting.** As each mode completes:

1. Open a PR with that mode's output doc(s) on a branch named `audit/source-mode-N-{mode-name}`
2. PR title: `[AUDIT] Source Mode N — {Mode Name}`
3. PR description: brief summary of mode's scope, top 3 findings, link to next mode
4. Wait for Anand to review and merge before starting next mode (Anand may merge in batches; that's OK)

**Discipline rule:** No mode produces decisions or recommendations to fix. Each mode produces findings only. The gap register is populated incrementally but is NOT a fix queue. Decisions about what to fix happen AFTER Mode 6 (cross-reference matrix) is complete and Anand has reviewed.

**Anand review cadence:** Anand will batch reviews twice weekly (Tuesday + Friday mornings, 90 minutes each — same schedule as the Strategic Moves WBS). Plan PR opening such that Anand has at least 24 hours before each review window.

---

## §9 · Acceptance

The audit is complete when ALL of the following are true:

1. All 6 mode outputs are merged to main
2. The gap register is populated with every finding from Modes 1–5
3. The cross-reference matrix is complete and shows verdicts for every Source feature
4. The audit summary (`00-AUDIT_SUMMARY.md`) is signed off by Anand
5. The screenshots directory has captures for both canonical tenants
6. No `src/` files were modified during the audit
7. No PRs were opened that touch code

If any of these is missing, the audit is incomplete and you must NOT report it as done. Report partial completion explicitly: "Modes 1, 2, 3 complete; Mode 4 in progress; estimated 2 more days."

---

## §10 · Failure modes specific to this audit

These are mistakes previous agents have made on similar audits. Do not repeat them.

### 10.1 The "obvious fix" trap (Cursor's PR #1517)

**What happened:** Cursor was asked for read-only audit of Knowledge Layer. While auditing, it noticed the phase-pack files had old vocabulary. It "fixed" them, producing PR #1517 with a destructive migration that bypassed the audit's governance entirely.

**How to avoid:** Every time you think "this is broken, let me fix it," STOP. Log the finding. Move on. Anand reviews and decides what to fix.

### 10.2 The "construct what should exist" trap

**What happened:** Without a clear baseline, agents infer what "should exist" from the current code, then propose changes to make reality match their construction. This is circular — you cannot audit code against itself.

**How to avoid:** You have TWO baselines (v0.3 design, dossier doctrine). Use them. When in doubt, the baselines are right and reality is wrong (which is logged as a finding) OR the baselines are wrong (which is logged as a question to Anand). NEVER infer a third baseline.

### 10.3 The "scope creep into adjacent features" trap

**What happened:** Audits of Source touch Strategic Moves substrate (because they share `engagements` table), then touch Setup (because Setup feeds Source data readiness), then touch agent route (because agents are shared infrastructure). Soon the audit is auditing the entire app.

**How to avoid:** Stay scoped to `/source/*` paths and Source-specific code. When you encounter shared infrastructure (agent route, common components, shared substrate tables), audit it ONLY for its Source-specific behavior. Log the shared dependency in your output but do NOT audit its non-Source uses.

### 10.4 The "complete-it-fast" trap

**What happened:** Audits get rushed because they don't ship features. Agents skip mode 4 (agent behavior) because "the UI looks fine," or skip mode 5 (doc drift) because "we know docs are stale."

**How to avoid:** All 6 modes are mandatory. Mode 4 (agent behavior) is the most important — it's the one that catches forbidden-claim violations that the UI appears to handle correctly. Do not skip.

### 10.5 The "report findings as conclusions" trap

**What happened:** Audits produce findings like "this should be refactored" or "we should add a new column for X." That's not a finding; that's a recommendation.

**How to avoid:** Findings describe reality. Recommendations describe what to do about reality. Keep them separate. Findings go in the per-mode outputs and the matrix. Recommendations go in the gap register's "Recommendation" column. The audit summary suggests prioritization but does NOT make the calls.

---

## §11 · Reference repo locations

These are the directories you'll touch most:

### Source-specific code
- `src/app/source/` — Source page routes
- `src/lib/source/` — Source business logic, queries, mutations
- `src/lib/intelligence/source-*` — Source-related agent intelligence
- `src/app/api/source/` — Source API endpoints
- `src/app/api/chat/agent/route.ts` — Shared agent route (Source scoping verified here)

### Source substrate (read-only)
- `supabase/migrations/` — schema history (do NOT add files)
- Source-related tables: `sourcing_engagements`, `sourcing_events` (verify exact name in Mode 1), `vendor_*`, `rfx_*`, scorecard tables, evaluation tables, artifact tables, value ledger tables (audit will discover the actual list)

### Existing docs
- `docs/design/source/` — Source design docs (input + output location)
- `docs/build/` — Source build/PR notes (input only)
- `docs/abarva-source/product-requirements/` — dossier location per dossier §25
- Existing audit examples: `docs/design/strategic-moves/PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` — reference for binding-matrix format

### Tests
- `__tests__/source/` or similar — Source-related tests
- Run with project's existing test runner; observe pass/fail; do NOT add tests during audit

### Demo deployment
- Vercel preview URL for current `main` branch — Anand will provide
- Test as Apex Retail user (Maya Desai) and Meridian Health user (different persona) — Anand will provide credentials/persona-switch mechanism

---

## §12 · Final checklist before you start

Mark each item before opening any file in the repo:

- [ ] Read this entire prompt end-to-end
- [ ] Read `SOURCE_DOSSIER_DIGESTION.md` end-to-end
- [ ] Read `SOURCE_DESIGN_V03_RECONCILIATION.md` end-to-end
- [ ] Reviewed `Source_End-to-End.html` v0.3 design (open in browser, scroll all 14 templates)
- [ ] Confirmed access to local repo at `~/Projects/nexus/`
- [ ] Confirmed access to local/dev DB for read-only queries
- [ ] Confirmed Vercel preview URL from Anand
- [ ] Confirmed canonical tenant credentials/personas from Anand
- [ ] Created `docs/design/source/audit/` directory with empty `00-AUDIT_SUMMARY.md` placeholder
- [ ] Created branch `audit/source-mode-1-substrate` for Mode 1 work
- [ ] Confirmed branch protection on `main` will require Anand review for any merge
- [ ] Understood the §1.3 "fix while I'm here" rule and committed to the discipline
- [ ] Understood that all 6 modes are mandatory (no skipping)
- [ ] Understood that the gap register is NOT a fix queue
- [ ] Understood the §5 conflict resolution table

When all 14 items are checked: begin Mode 1 (Substrate audit).

If any item cannot be checked because something is missing (e.g., Anand hasn't provided Vercel URL yet), STOP. Pause. Ask Anand. Do not proceed.

---

## §13 · A note on tone

When you write findings, write them straightforwardly. No hedging, no over-qualification. If something is broken, say it's broken. If something is correct, say it's correct. If something is ambiguous, name the ambiguity.

Don't write defensively. Don't apologize for findings. Don't soften severity. The audit's value comes from honest reporting; everyone has read enough corporate-toned audit reports to know they bury the lede.

Example of good finding:
> The Pricing Trap Log substrate does not exist. The v0.3 design renders 6 trap entries on Template 05 (Pricing canvas), but the substrate has no `pricing_traps` table or equivalent. The UI is rendering hardcoded fixture data with no persistence layer. Severity: P1 (design promises functionality the substrate does not support). Recommendation: define `pricing_traps` schema before any further Pricing canvas work; substrate gap blocks Wave 2 implementation.

Example of bad finding (don't do this):
> It appears that the Pricing Trap Log functionality may not be fully backed by substrate at this time. We should consider exploring whether additional substrate work might be needed to support this feature in future iterations.

The first one is useful. The second one is not.

---

## §14 · End of prompt

You now have everything you need to execute the Source audit. The estimated effort is 77–94 hours across 6 modes, ~2.5 weeks calendar.

When you finish reading, post a single message to Anand confirming:
1. All 14 checklist items in §12 are complete
2. You understand the §1 hard rules
3. You are starting Mode 1 (Substrate audit)
4. Your estimated date for Mode 1 PR opening

Then begin.

End.
