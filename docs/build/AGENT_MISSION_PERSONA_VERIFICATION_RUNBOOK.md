# Agent Mission / Persona Verification Runbook

Slice ID: QA4
Slice name: Agent Mission Persona Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls.

This runbook is the founder-facing checklist for verifying that the
**agent mission model** implementation — the AG10 mission queue read
model, the AG11 mission UI panel, the MG2 model gateway stub, the
TOOL2 tool registry MVP, and the PROD2 production-readiness validator
— lands **honestly** before push or PR. It is the fourth companion
to:

- QA1 — [`AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`](./AGENTIC_SPINE_VERIFICATION_RUNBOOK.md)
- QA2 — [`SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md`](./SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md)
- QA3 — [`SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`](./SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md)

The runbook is meant to be **walked manually** after the relevant
slice work has reached `code_complete`. It supports:

- Solo overnight founder review when batch slices land.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-demo dry-run on a local dev server.

Each section has one expected outcome per row; do not skip rows.

---

## §A · Purpose and scope

QA4 verifies five canonical implementation surfaces that together
turn the deterministic Agent Mission Model (`docs/platform-architecture/runtime/13_AGENT_MISSION_MODEL.md`)
into a renderable, audit-friendly, no-fabrication artifact:

- **AG10 — Mission Queue Read Model.** The deterministic seed and
  read-model contract that emits typed missions for Nexus, Sentinel,
  Atlas, and Steward across Programs, Source, Intelligence, Tower,
  and Admin/Setup. AG10 must produce a stable, deep-equal queue when
  called repeatedly with the same tenant + work-object inputs.
- **AG11 — Mission UI Panel.** The deterministic React component
  that renders an AG10 mission queue as a compact strip, right
  mission panel, inline recommendation, executive brief, or
  background drawer per the Experience System Agent Activity UI
  Pattern. AG11 must compile without runtime mounting; route
  integration is staged separately.
- **MG2 — Model Gateway Stub.** The single-entry-point gateway
  contract that **refuses** all live model calls in this slice and
  returns a deterministic, honest "deferred · live model runtime not
  wired" response. MG2 establishes the call shape for future live
  wiring without leaking provider names, keys, or fake completions.
- **TOOL2 — Tool Registry MVP.** The deterministic, append-only
  catalog of tools that an agent mission may declare it needs (e.g.,
  `evidence.lookup`, `dataset.describe`, `gate.evaluate`,
  `workshop.prepare`, `pattern.match`). TOOL2 records tool names,
  shapes, and refusal modes; it does not invoke tools. Mission
  consumers reference tool keys; runtime invocation is deferred.
- **PROD2 — Production-Readiness Validator.** The deterministic
  validator that loads `docs/build/production-readiness.json`,
  asserts schema, gate, blocker, and dimension invariants, and
  returns `{ passed: boolean, violations: [...] }`. PROD2 is the
  programmatic guardrail that enforces the `code_complete ≠
  production_ready` rule from the Production Readiness Update
  Protocol.

**In scope.** Reading the implementation modules; running the
required tests; walking each persona's expected route in the dev
server; reading the JSON projection of the AG10 mission queue to
check for fabricated dollars, fake citations, named-vendor
endorsements, or false production-ready claims; confirming the
PROD2 validator returns `passed: true` against the live manifest.

**Out of scope.** Workshop dynamics (covered in QA2). Solution
intelligence canvas walks (covered in QA3). Agentic spine route
walks of Programs / Tower / Intelligence / Admin (covered in QA1 —
QA4 reuses the same route table but limits its assertions to the
mission surface). Live retrieval, live model calls, scheduler /
background mission triggers, mission persistence, mission dismissal
/ escalation persistence, exporter pipelines, real evidence
citations — all deferred.

**Why this runbook exists separately.** AG10 / AG11 / MG2 / TOOL2 /
PROD2 are the runtime-shape contracts that **future** live agent
work depends on. The risk profile is therefore different from QA1 /
QA2 / QA3: the failure mode here is not a missing field on a
deterministic surface, it is an honest-shape contract that quietly
**implies live behavior** (a fake completion from MG2, a tool
invocation in TOOL2, a fabricated mission queue from AG10, a silent
component promotion from PROD2). QA4 explicitly walks each of those
failure modes and refuses any wording that crosses the line.

---

## §B · Branch hygiene

Run from the repo root before any verification walk.

| Check | Command | Expected outcome |
|---|---|---|
| Current branch | `git branch --show-current` | Names the slice / batch branch you intend to verify (no detached HEAD). For QA4 worktree review the branch is `pack/qa4-agent-mission-persona-verification`. |
| Working tree | `git status --short` | No unexpected modifications. Untracked founder / canon docs are allowed (they were never staged). |
| Branch position | `git status -sb` (header line) | Branch is ahead of `origin/<branch>` by the expected commit count; never behind without intent. |
| Ahead-of-main delta | `git log --oneline origin/main..HEAD` | Lists exactly the slices in scope (AG10, AG11, MG2, TOOL2, PROD2, QA4); no surprise commits. |
| Last three commits | `git log --oneline -3` | Each commit message names a slice in scope (or QA4 itself); subjects are short and scoped. |
| Last commit scope | `git show --stat HEAD` | Touches only the slice's allowed files; no Source / migration / supabase files. |
| Pre-commit staged set was exact | `git diff --cached --name-only` immediately after the QA4 commit returns empty (because everything staged was committed). Re-staging the QA4 allowed files prints exactly: `docs/build/AGENT_MISSION_PERSONA_VERIFICATION_RUNBOOK.md`, `docs/build/build-slices.json`, `docs/build/production-readiness.json` — three lines, no more. | Means the staged set matched the slice's `allowedFiles`; nothing slipped in. |
| Untracked surprise check | `git ls-files --others --exclude-standard` | Only known founder / canon docs. No new src / supabase / migration files. |

**Pass criterion for each row:** the actual output equals the
expected outcome verbatim, modulo whitespace. **Stop and investigate**
if any check fails. Do not push or demo from a working tree with
unexplained modifications.

---

## §C · Required validation commands

Run from the repo root in order. Each must pass before the per-slice
checklist walks.

| Step | Command | Pass criterion |
|---|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` | Empty output (no errors). |
| Production build | `npm run build` | Completes; route table emitted; no compile errors. |
| DOM integrity linter | `npm run integrity:dom` | Reports **0 violations**. ("Coming soon" / "TBD" / "Lorem ipsum" anywhere in the source tree fails the run.) |
| AG10 — mission queue read model | `npx jest src/__tests__/integration/agents/agent-mission-queue.test.ts` | All green. |
| AG11 — mission UI panel | `npx jest src/__tests__/integration/agents/agent-mission-panel.test.ts` | All green. |
| MG2 — model gateway stub | `npx jest src/__tests__/integration/architecture/model-gateway-stub.test.ts` | All green. |
| TOOL2 — tool registry MVP | `npx jest src/__tests__/integration/architecture/tool-registry-mvp.test.ts` | All green. |
| PROD2 — readiness validator | `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts` | All green. |
| PROD2 regression — readiness tracker | `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts` | All green. (Confirms the validator's input schema still matches the tracker that produced it.) |
| Manifest parse | `python3 -c "import json; json.load(open('docs/build/production-readiness.json')); json.load(open('docs/build/build-slices.json'))"` | Empty output (no parse errors). |

If any command fails, **stop and decide**: amend the slice, discard,
or capture the failure in a tracked issue before proceeding to the
persona walks.

### Why the regression suite is required

PROD2 is a validator over the same JSON file that PROD1
(production-readiness tracker) produces and that the admin route
renders. If PROD2's validator and PROD1's tracker diverge — e.g., a
new component shape lands in the manifest but the validator does
not yet read it — QA4 must catch the drift before the morning push
decision. Running both jest suites back-to-back is the cheapest
guard against silent drift. Add the same guard whenever a new
component or maturity-snapshot indicator lands in the manifest.

### Why MG2 and TOOL2 each get their own jest suite

MG2 and TOOL2 are small modules but they are the load-bearing
honesty contracts for the runtime path. Their suites assert
specifically:

- **MG2.** Calling the gateway with any request returns a
  deterministic refusal object whose shape names the deferred state
  (`status: 'deferred'`, `reason: '...'`); no SDK import is
  reachable from the gateway module; no environment variable lookup
  for `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` is performed.
- **TOOL2.** The exported tool registry is byte-equal across
  imports; every tool descriptor carries `invocationStatus:
  'deferred'` (or equivalent honest field); no `invoke()` /
  `execute()` function is exported; the registry's append-only
  ordering is preserved.

These are tiny suites by line count, but skipping them is the
fastest way to ship a runtime that quietly implies live behavior.

---

## §D · Persona walks

Each subsection lists the routes a persona walks and what they
should see. Where AG11 is not yet mounted on a route, the row is
marked **static-source assertion** — the founder reads the AG11
component source and the AG10 fixtures rather than the rendered
panel.

### §D.1 — Founder / Platform Operator

Routes:

- `/platform/admin`
- `/platform/admin/production-readiness`
- `/platform/admin/build-progress`

| Check | Where | Expected |
|---|---|---|
| Steward setup control center mounts | `/platform/admin` | Renders the deterministic steward brief; no "Coming soon" / "TBD" copy; no live-monitoring claim. |
| Production-readiness tracker mounts | `/platform/admin/production-readiness` | Lists exactly **15 components** in canonical order; each row carries `status`, `dimensions`, `nextAction`, and `blockers` chips. |
| Maturity snapshot rendered | `/platform/admin/production-readiness` | Shows **3 indicators** (overall product maturity, demo / proof-of-concept maturity, production readiness) and **20 areas**. Each indicator's `percentLow` and `percentHigh` match the manifest. |
| `overallReadinessPercent` honest | `/platform/admin/production-readiness` | Header shows a value within **20–25** (matches the `production_readiness` indicator band). Never claims `>=50` or `production_ready` overall. |
| No false `production_ready` | `/platform/admin/production-readiness` | No component card shows `production_ready` status. Some show `code_complete`, `tested`, `scaffolded`, `not_started`, or `blocked` per the manifest. |
| Build progress page renders | `/platform/admin/build-progress` | Lists the slice manifest (S0–S?, AG-series, MG-series, TOOL-series, PROD-series, QA-series). QA4 row is present after this slice lands; status `code_complete`. |
| AG11 mission panel — static-source | Read `src/components/agents/AgentMissionPanel.tsx` (or wherever AG11 declared) | Component compiles; renders deterministic mission rows from an AG10 read model prop; no `useEffect` model fetch; no `fetch()`; no `anthropic` / `openai` import. **Route mounting is deferred**; mounting on `/platform/admin` is a downstream slice. |
| Honest disclaimer present | Anywhere a mission strip / panel renders | The deterministic-seed disclaimer ("Mission queue is deterministic seed; runtime triggers deferred." or equivalent verbatim string) is visible. |

Stop if any of: a component shows `production_ready`; the maturity
snapshot is missing; an AG11 import touches `anthropic`, `openai`,
`pinecone`, or `fetch`.

### §D.2 — Client Maestro

Routes:

- `/tenant/apex-retail/programs`
- `/tenant/apex-retail/programs/{programSlug}` (e.g., the first program card)
- `/tenant/apex-retail/programs/{programSlug}/phase/{phaseNum}` (Phase 2 or 3)

| Check | Where | Expected |
|---|---|---|
| Programs index renders | `/tenant/apex-retail/programs` | Canonical 4-program seed for Apex Retail (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting) per the demo-seed anchor. |
| Programs detail renders workshop mode (PW1) shell | `/tenant/apex-retail/programs/{slug}` | Workshop mode shell visible; phases 1–6 strip rendered; gate row G1–G4 visible. |
| Artifact canvas (PDEL5) shell renders | `/tenant/apex-retail/programs/{slug}` or `/phase/{n}` | Deliverables-by-phase logic surfaces ≥1 artifact for the active phase; missing-input copy honest where seed is partial. |
| AG11 mission panel — mock-mounted | Detail right column or compact strip | Three mission rows visible from AG10 seed: Nexus `next_action` (e.g., "Lock workshop scope before Phase 2 evidence intake"), Steward `gate_check` (e.g., "G2 CXO interview pending — schedule with sponsor"), Sentinel `evidence_gap` (e.g., "DORA baseline not seeded for this program; recommendation is pattern-level only"). |
| Mission rationale ≥1 sentence | Any visible mission row | `summary` and `rationale` fields each render at least one full sentence; never empty. |
| Mission stop condition concrete | Any visible mission row | The `stopCondition` field reads as a concrete event (e.g., "Steward records gate verdict in workshop notes") not a vague "Wait for closure". |
| No fabricated dollars | Any visible mission row | No `$<digit>` substring anywhere on the panel. |
| AG11 not mounted yet — static-source fallback | If AG11 is not mounted on Programs detail in this slice | Read AG11 source as in §D.1; assert the mock fixture `programs-mission-queue.fixture.ts` (or AG10 equivalent) carries one Nexus + one Sentinel + one Steward mission for the canonical Apex Retail program. |

Stop if any of: the mission panel shows fabricated dollar values;
the rationale is blank; the stop condition reads as "Wait" with no
specific event.

### §D.3 — CIO / CTO

Routes:

- `/tenant/apex-retail/tower`

| Check | Where | Expected |
|---|---|---|
| Tower renders | `/tenant/apex-retail/tower` | Atlas executive brief and program pressure cards visible. |
| Atlas `executive_brief` mission visible | Tower header / right column | AG10 seed includes one Atlas `executive_brief` mission tied to the canonical Apex Retail portfolio pressure. The brief names a decision needed and the recommended owner; no fabricated dollar at risk. |
| Pressure cards rendered | Tower body | Per-program pressure cards visible; each names the program, phase, gate state, and the highest-priority mission that originated the pressure. |
| No fabricated dollar figures | Anywhere on Tower | No `$<digit>` substring; value at stake reads as a band, descriptor, or honest "not yet baselined" copy. |
| No live-monitoring claim | Anywhere on Tower | No copy says "live production observability", "live monitoring", or implies real-time feeds. The deterministic-seed disclaimer is visible. |

Stop if any of: a dollar value appears; "live monitoring" copy is
present without the honest-disclaimer caveat; Atlas mission
references a real-time data source.

### §D.4 — CFO / Value Office

Routes:

- `/tenant/apex-retail/tower`

| Check | Where | Expected |
|---|---|---|
| Steward `value_risk` mission visible | Tower right column or executive brief variant | AG10 seed includes a Steward (or Atlas) `value_risk` mission framing portfolio value at stake honestly: descriptors and bands, not fabricated dollars. |
| Portfolio pressure honest | Tower body | Cards reference confidence (`low` / `medium`), evidence state (`not_seeded` / `partial` / `ready`), and gate state. No card claims `high` confidence from seed alone. |
| No model-invocation claim | Anywhere on Tower | No copy says "Atlas computed this via live model call" or implies an active inference. The MG2 deferred disclaimer applies whenever an agent recommendation is shown. |
| No fabricated `E-###` citations | Anywhere on Tower | `E-\d{3}` substring search returns zero hits. Real evidence citations are wired through PDEL evidence trail in a future slice. |

Stop if any of: a mission claims a live model call; a fabricated
`E-###` citation appears; portfolio pressure shows fabricated
dollars.

### §D.5 — Steward Admin

Routes:

- `/platform/admin`
- `/platform/admin/production-readiness`

| Check | Where | Expected |
|---|---|---|
| Steward `data_readiness` mission visible | `/platform/admin` mission strip or right column | AG10 seed includes a Steward `data_readiness` mission for at least one partial data domain; rationale names the missing domain by name. |
| Steward `workflow_blocker` mission visible | `/platform/admin` or `/platform/admin/production-readiness` | At least one Steward `workflow_blocker` mission is visible, tied to a `blocked` component (e.g., `production_deployment` or `model_gateway`). |
| PROD2 validator passes against the manifest | Run `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts` | Test assertion shows `passed: true`; `violations.length === 0`. |
| Steward refusal language honest | Any Steward mission row | Refusal reads "cannot proceed because <named gate / data / policy>" — never an evasive "wait" or "soon". |
| Steward routes the user | Suggested actions block | Each Steward mission's `suggestedActions` lists concrete admin routes (e.g., "Open dataset domain inventory", "Open production-readiness tracker") that exist in the route table. |

Stop if any of: the validator returns `passed: false`; a Steward
mission's refusal language is vague; a suggested action points to a
non-existent route.

### §D.6 — Data Owner

Routes:

- `/platform/admin` (Dataset Explorer / Dataset Domain Inventory)

| Check | Where | Expected |
|---|---|---|
| Dataset domain inventory mounts | `/platform/admin` Dataset Explorer surface | Lists canonical data domains; each row carries readiness state (`not_seeded` / `partial` / `ready`). |
| Steward `data_readiness` mission for partial domains | Mission strip or right panel | For each domain with state `partial`, a Steward `data_readiness` mission is visible naming the domain and what evidence / connector / parsing is missing. |
| No live-connector claim | Anywhere on Dataset Explorer | No copy says "live connector", "real-time ingest", or "production data flowing". The deterministic-seed disclaimer is visible. |
| No fabricated row counts | Any domain card | Domain row counts are absent or shown as "not yet measured" — never invented numerals. |

Stop if any of: a domain row claims a live connector; row counts
are fabricated; the deterministic-seed disclaimer is missing.

---

## §E · Route coverage table

| Route | Primary agent | Mission types expected | Current status |
|---|---|---|---|
| `/platform/admin` | Steward | `data_readiness`, `workflow_blocker`, `gate_check` | exists (Steward setup control center mounted; AG11 mounting deferred — read mock fixture) |
| `/platform/admin/production-readiness` | Steward | `gate_check`, `workflow_blocker` | exists (production-readiness tracker mounted; PROD2 validator runs against this manifest) |
| `/tenant/apex-retail/programs` | Nexus | `next_action`, `pattern_signal` | exists (programs index mounted; AG11 strip mounting deferred) |
| `/tenant/apex-retail/tower` | Atlas | `executive_brief`, `value_risk` | exists (Tower mounted with Atlas executive brief and pressure cards; AG10 seed wires Atlas missions; AG11 panel mounting deferred) |
| `/tenant/apex-retail/intelligence` | Sentinel | `evidence_gap`, `pattern_signal`, `low_context_warning` | exists (Intelligence landing + active patterns mounted; AG10 seed wires Sentinel missions for visible patterns) |
| `/tenant/apex-retail/intelligence/patterns/[patternKey]` | Sentinel | `evidence_gap`, `validation_defer` | exists (pattern detail + evidence trail mounted; AG11 inline recommendation mounting deferred) |

The "Current status" column reflects what is renderable today. AG11
panel / strip / inline-recommendation mounting on each route is
**deferred** — verifying the AG11 component compiles and accepts an
AG10 read-model prop is the QA4 acceptance bar, not full route
integration.

### Cross-tenant note

Where both `apex-retail` and `meridian` exist, the QA4 walk uses
**Apex Retail** as the canonical mission seed (matching the
Programs demo seed anchor: Contact Center AI, CDP, Store Associate
Productivity, Demand Forecasting). Meridian remains on the
Intelligence demo seed; AG10 emits Sentinel `pattern_signal` and
`evidence_gap` missions on Meridian's intelligence pages, but the
canonical end-to-end mission walk (Programs → Tower → Admin) is
exercised on Apex Retail. Switching tenant mid-walk is allowed for
spot-checks but should not be the primary review path — the AG10
seed depth is uneven by design.

### Mission-type to surface map

The route coverage above pairs each route with the mission types
its primary agent owns. The reverse map is also useful when
investigating a suspect mission row: any `executive_brief` mission
should originate on Tower; any `next_action` should originate on a
work-object surface (Programs detail, Source event detail); any
`gate_check` should originate on a workflow surface (Programs
phase, Admin); any `evidence_gap` should originate on Intelligence
pattern detail or Programs phase artifact. A mission whose surface
recommendation does not match this rule is a defect.

---

## §F · Agent mission verification

Per agent, walk both the AG10 fixture (read the mock seed module
under `src/lib/agents/__fixtures__/` or equivalent) and the rendered
panel where mounted.

| Agent | Check | Expected |
|---|---|---|
| Nexus | `next_action` mission visible | At least one `next_action` mission per active work object (e.g., per visible program). `recommendedAction` is a single concrete sentence; `rationale` ≥1 sentence; `stopCondition` names a concrete event. |
| Sentinel | `evidence_gap` mission visible | At least one `evidence_gap` mission where the AG10 seed has a partial-evidence work object. `citationHint` names the kind of evidence needed (e.g., "DORA baseline interview", "ticket volume sample") without inventing an `E-###` ID. |
| Atlas | `executive_brief` mission visible | At least one `executive_brief` mission on Tower. Frames the portfolio decision needed, names value at stake as a band/descriptor (not a dollar), and lists the operational follow-up owner. |
| Steward | `gate_check` or `data_readiness` mission visible | At least one Steward mission with refusal language: "cannot proceed because <named condition>". Allowed states: `blocked`, `waiting`, `deferred`. Never silently `active` when a hard gate is unmet. |
| All agents | Rationale never empty | Every mission row's `rationale` field is ≥1 sentence. |
| All agents | Stop condition concrete | Every mission row's `stopCondition` field names a concrete observable event ("Steward records gate verdict", "Workshop notes capture DORA baseline"), not "Wait for closure" or "TBD". |
| All agents | No infinite loops | Every mission `state` has a terminal path: `completed`, `dismissed`, `escalated`, or `deferred`. The AG10 contract documents the transitions; no state is reachable that has no outgoing edge. |
| All agents | Handoff target valid | When `handoffTarget` is set, it names one of `nexus`, `sentinel`, `atlas`, `steward`. No invented agent names. |
| All agents | UI visibility recommendation matches surface | `executive_brief` missions render only on Tower or the Atlas executive-brief variant; `next_action` / `gate_check` / `evidence_gap` render on `right_panel` or `compact_strip` per the Experience System Agent Activity UI Pattern. No `executive_brief` leaks to a Programs phase strip. |

Stop if any of: rationale is empty; stop condition reads "Wait" or
"TBD"; handoff target names an invented agent; an `executive_brief`
mission renders on a non-Tower surface.

### Mission-state transition diagram (assertion form)

The AG10 contract documents allowed `state` transitions. QA4 reads
them as a closure check — every state must reach a terminal state
in finite hops:

| From | Allowed next states | Terminal? |
|---|---|---|
| `proposed` | `active`, `dismissed`, `deferred` | no (must transition) |
| `active` | `waiting`, `blocked`, `completed`, `dismissed`, `escalated`, `deferred` | no (must transition) |
| `waiting` | `active`, `blocked`, `completed`, `dismissed`, `deferred` | no |
| `blocked` | `active`, `waiting`, `escalated`, `dismissed`, `deferred` | no |
| `escalated` | `active`, `completed`, `dismissed` | no |
| `completed` | (none — terminal) | **yes** |
| `dismissed` | (none — terminal) | **yes** |
| `deferred` | `active`, `dismissed` | no |

A mission that loops `active ↔ waiting ↔ active` indefinitely
without an exit edge to `completed`, `dismissed`, or `escalated` is
a defect. The AG10 fixture must not seed such a mission. The AG11
panel should render a "stuck" indicator when a mission has been
`waiting` past its declared `dueAt` so the founder can spot the
condition without reading the underlying state machine.

### Priority-order assertion

For any surface that renders multiple missions, the AG11 panel must
order them by priority (`critical` > `high` > `medium` > `low`)
then by `agentName` then by `missionId` for stable tie-break. The
AG10 fixtures should produce at least one `critical`, one `high`,
and one `medium` mission across the canonical seed so the order
rule is observable; if all missions seed at the same priority, the
order rule is unverifiable and the seed is a defect.

---

## §G · No-fabrication checks

Walk every AG10 seed module, AG11 fixture, MG2 stub, TOOL2 catalog,
and the live PROD2 manifest. Assert each line below explicitly.

| Check | Expected |
|---|---|
| No fabricated dollar values in mission seed | `JSON.stringify(<AG10 seed export>)` does not match `/\$\s?\d/`. Run after every AG10 fixture change. |
| No fabricated `E-###` evidence citations | `git grep -E 'E-[0-9]{3}'` across `src/lib/agents/**` and AG10 / AG11 source returns zero matches. (Real evidence citations land via PDEL evidence trail; AG10 references shape, not invented IDs.) |
| No fake live runtime claims | `git grep -ni 'live monitoring\|production observability\|real-time feed\|live connector\|live retrieval' src/` returns matches only inside an honest-disclaimer caveat or the PROD2 manifest's prose `source` field that explicitly negates ("**No** live monitoring …"). No positive claim of live runtime. |
| No fake production readiness | `production-readiness.json` has `overallReadinessPercent` ≤ the planned-indicator high band (currently 25); no component carries `production_ready` status; the PROD2 validator enforces this and returns `violations: [...]` if either rule fails. |
| No banned placeholders | `npm run integrity:dom` reports 0 violations. "Coming soon" / "TBD" / "Lorem ipsum" anywhere in the source tree fails the run. |
| Honest disclaimers present | Every AG10-fed surface (mission strip, panel, executive brief) carries the deterministic-seed disclaimer ("Mission queue is deterministic seed; runtime triggers deferred." or verbatim equivalent). The MG2 stub returns the deferred-runtime disclaimer; the TOOL2 registry's tool descriptors carry an `invocationStatus: 'deferred'` field; the PROD2 manifest's `source` field names "no live monitoring". |
| No named-vendor endorsements in mission rationale | The QA3 vendor deny-list scan applies to AG10 / AG11 text fields too (`grep -ri -f tools/sol-vendor-deny-list.txt src/lib/agents/`). Zero hits. |
| No model / API call leakage | `git grep -nE 'anthropic\|openai\|pinecone' src/lib/agents/ src/components/agents/` returns matches only in MG2 (the gateway stub itself, where the names appear inside a refusal string). No imports from `anthropic` / `openai` SDKs anywhere in AG10 / AG11. |

Stop if any fabrication slips through. The platform's defensibility
depends on it.

---

## §H · Production-readiness tracker verification

Walk the live `docs/build/production-readiness.json` after every
batch's cherry-pick. Each row below must hold.

| Check | Expected |
|---|---|
| Manifest parses | `python3 -c "import json; json.load(open('docs/build/production-readiness.json'))"` returns no parse error. |
| Fifteen canonical components present | The `components` array has exactly **15** entries with IDs `programs`, `program_workshop_mode`, `deliverables_artifacts`, `intelligence`, `ai_control_tower`, `admin_setup`, `source`, `data_evidence_knowledge_fabric`, `solution_intelligence`, `agent_runtime`, `model_gateway`, `ingestion_parsing`, `audit_governance`, `validation_qa`, `production_deployment`. |
| Maturity snapshot has 3 indicators + 20 areas | `maturitySnapshot.indicators.length === 3`; `maturitySnapshot.areas.length === 20`. The three indicator IDs are `overall_product_maturity`, `demo_proof_of_concept_maturity`, `production_readiness`. |
| `overallReadinessPercent` honest | Value ∈ [20, 25] and equals or sits inside the `production_readiness` indicator's `[percentLow, percentHigh]` band. |
| PROD2 validator returns `passed: true` | `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts` reports the validator returned `{ passed: true, violations: [] }` against the live manifest. |
| `lastUpdated` reflects most recent change | After every batch cherry-pick that touches the manifest, the top-level `lastUpdated` ISO date matches the cherry-pick day. Component-level `lastVerifiedCommit` is `null` unless a verified live walk recorded it. |
| No silent component promotion | No component's `status` advanced from `code_complete` to `tested`, `full_flow_ready`, `pilot_ready`, or `production_ready` without an explicit founder verification commit; PROD2 enforces this by rejecting promotions that lack the corresponding gate evidence. |
| `validation_qa` notes QA1/QA2/QA3/QA4 | After this slice, `components[id=validation_qa].notes` lists the four founder-facing runbooks (QA1 Agentic Spine, QA2 Solution Workshop, QA3 Solution Intelligence, QA4 Agent Mission / Persona) without claiming the work is full-flow-ready. |

Stop if any of: a component's status promoted silently; the
validator returns `passed: false`; the maturity snapshot loses an
indicator or area; `overallReadinessPercent` drifts outside the
honest band.

---

## §I · Morning review decision rules

After the per-slice walk, decide for **each** of AG10, AG11, MG2,
TOOL2, PROD2, and QA4:

| Decision | When to choose | Action |
|---|---|---|
| **keep** | All checks pass; the slice reflects intent. | Leave the branch / commit as-is; recommend it for push / PR after founder review. |
| **amend** | Validation passes but the surface needs polish (a missing AG10 field, a stale rationale, a missed PROD2 violation). | Amend on the same branch; re-run §C validation; do not change scope. |
| **discard** | Validation fails or the slice does not reflect intent and is not worth amending. | `git branch -D <branch>` (only after confirming no other branch / worktree depends on it). Document the reason in the morning review note. |
| **cherry-pick** | A subset of the slice's commits is worth keeping in a different branch / a clean integration branch. | Use the canonical cherry-pick path documented in §J. |
| **push / PR** | Slice is `keep`-ready and the founder has explicitly signed off. | `git push origin <branch>` and `gh pr create`. Apply only after the slice's own acceptance criteria and §C validation are explicitly verified. |

**Default for unsupervised overnight runs:** do not push, do not
merge, do not open PRs. Local commits only. The morning review
chooses one of the five outcomes above per branch. **Push only with
explicit founder go-ahead.**

### Conflict resolution policy for `production-readiness.json`

When multiple lanes touch the manifest in parallel (the AG-series
lane and the PROD2 lane both edit it; QA4 also appends a note to
`validation_qa`), apply the conservative merge rule from PROD2 §I:

1. **Conservative status.** When two lanes propose different
   `status` values for the same component, take the **less
   advanced** of the two (`scaffolded` < `code_complete` < `tested`
   < `full_flow_ready` < `pilot_ready` < `production_ready`;
   `blocked` outranks all). Never auto-promote.
2. **Union blockers.** When two lanes append different `blockers`
   to the same component, **union** them by `id`. Drop nothing.
3. **Latest `nextAction` wins, or append.** When two lanes propose
   different `nextAction` strings, prefer the lane whose commit is
   chronologically later. If both are equally relevant, append the
   second as a follow-up sentence rather than overwriting.
4. **Preserve notes from both sides.** When two lanes append
   different rows to a component's `notes` array, keep both in the
   order each lane added them.
5. **Bump `lastUpdated`.** After resolving, set the top-level
   `lastUpdated` to today's ISO date. Set `updatedBy` to the agent
   that performed the merge (typically `Code` for unsupervised batch
   runs).

This rule is applied by hand during the morning review; the PROD2
validator then re-runs against the merged manifest and must report
`passed: true` before the integration branch is pushed.

---

## §J · Branch hygiene appendix · canonical cherry-pick path

When a pack lane lands AG10, AG11, MG2, TOOL2, PROD2, and QA4 in
parallel and each lane appended its own slice entry to
`docs/build/build-slices.json` and / or its own note to
`production-readiness.json`, every lane's JSON edit conflicts with
every other lane's. The morning review resolves it like this:

1. Branch off `main` into a fresh integration branch:
   `git checkout -b integration/agent-mission-batch main`.
2. For each lane to keep, in dependency order
   (AG10 → AG11 → MG2 → TOOL2 → PROD2 → QA4):
   `git cherry-pick <lane-head-sha>`.
3. On each `build-slices.json` conflict, **keep both entries** (each
   lane appended an entry; the JSON array order is `AG10`, `AG11`,
   `MG2`, `TOOL2`, `PROD2`, `QA4`). Resolve with the editor so all
   objects survive; bump `lastUpdated` once at the top of the file.
4. On each `production-readiness.json` conflict, apply the §I
   conflict-resolution policy: conservative status, union blockers,
   latest `nextAction` wins (or append), preserve notes from both
   sides, bump `lastUpdated`.
5. Re-run §C validation on the integration branch:
   `npx tsc --noEmit --pretty false && npm run build &&
   npm run integrity:dom` plus every per-slice jest suite, including
   the PROD2 validator and the production-readiness-tracker
   regression.
6. Push **only with founder go-ahead**:
   `git push origin integration/agent-mission-batch` and open the
   PR with the QA4 runbook linked from the PR body.

This path is the same shape used by QA1 (agentic spine batch), QA2
(solution / workshop batch), and QA3 (solution intelligence batch).
The only QA4-specific step is rule §I.4 (PROD2 manifest conflict
resolution), which is invoked when the AG-series lane and the PROD2
lane both touch a component's `notes` array — the QA4 lane's own
edit to `validation_qa.notes` is a single-row append and conflicts
only with another `validation_qa` edit.

### Worktree hygiene reminder

When running multi-lane batches via `git worktree`:

- One worktree per slice.
- Symlinking `node_modules` into a worktree breaks Next.js Turbopack;
  run `npm install --prefer-offline` per worktree instead.
- Each worktree's `.next/` is independent; clearing it can be needed
  when the route table changes (e.g., a route directory is removed
  or renamed).
- Never run `git add .` in a worktree. Stage only the slice's
  declared allowed files. For QA4 the staged set is exactly:
  `docs/build/AGENT_MISSION_PERSONA_VERIFICATION_RUNBOOK.md`,
  `docs/build/build-slices.json`,
  `docs/build/production-readiness.json`.
- Before commit: `git diff --cached --name-only`. Confirm only
  allowed files are staged. Unstage anything else with
  `git restore --staged <path>` before committing.
- After commit: do not push. The morning review owns the push
  decision.
