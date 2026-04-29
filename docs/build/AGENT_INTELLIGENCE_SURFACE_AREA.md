# Agent Intelligence Surface Area

**Status:** Architectural anchor for the AbarVa agent layer · 2026-04-29
**Author:** Claude Opus 4.7 (with founder review)
**Read this when:** sequencing any agent-fluency work, evaluating whether a
PR moves the needle on the "is Nexus an actual senior PM" question, or
deciding whether scope is comprehensive or just plausible.

---

## Why this doc exists

The product premise is that a tenant's senior program leader can be
replaced — or augmented to 10× output — by AbarVa's agent layer (Nexus,
Maestro, Sentinel, Steward, Atlas). For that to be defensibly true, the
agents have to know how to actually run programs at the discipline level
of a senior PM, not just decorate a dashboard with phase labels.

Up to and including PR #1114 (Phase Intelligence Packs scaffold + P2
Synthesis reference), we have shipped scaffolding that *enables* agent
fluency — schemas, sentinel grammar, tool-use loop, reactive panel,
phase-pack contract — but we have **not yet shipped the breadth of
intelligence the premise requires**. This doc maps that gap honestly
and sequences the PRs that close it.

Without this doc, we will keep shipping plausible-looking scaffolding
that demos well to friendly audiences but collapses the moment a real
senior PM stress-tests it.

---

## What "comprehensive" actually means

The agent layer needs four orthogonal kinds of intelligence:

1. **Vertical** — per-phase coaching discipline (the packs)
2. **Horizontal** — cross-cutting workflows that operate within a phase
3. **Lateral** — agent-to-agent state and handoffs
4. **Longitudinal** — packs that learn from program outcomes

Plus an **external** reality layer (vendor windows, board cycles,
fiscal-year freezes) that no playbook can fake.

Today, we have *partial* coverage of #1 only. Everything else is design
debt. This doc enumerates each, names the PRs, and flags which ones need
your operator judgment vs which I can take alone.

---

## 1. Vertical intelligence — per-phase packs

**What it is:** opinionated playbooks Nexus reads at every turn, telling
it what to ask, what to flag, what evidence to drive toward, and how
its posture shifts from entry to exit of a phase.

**What's shipped:** schema (`src/lib/programs/phase-packs/types.ts`),
resolver, prompt formatter, P2 Synthesis reference pack, Nexus binding
in `route.ts`, schema-sanity test suite that runs over every authored
pack.

**What's pending:**

| Pack | Status | Owner |
|---|---|---|
| P0 Originate | ✅ Shipped (PR #1121) | Codex |
| P1 Discovery | ✅ Shipped (PR #1121) | Codex |
| **P2 Synthesis** | **✅ Shipped (reference, PR #1114)** | Claude |
| P3 Design | ✅ Shipped (PR #1121) | Codex |
| P4 Build | ✅ Shipped (PR #1121) | Codex |
| P5 Activate | ✅ Shipped (PR #1121) | Codex |
| P6 Operate | ✅ Shipped (PR #1121) | Codex |

All 7 packs pass the `__tests__/phase-packs.test.ts` schema-sanity
suite (99 tests). Cross-phase handoffs (`producesForNext` /
`requiresFromPrior`) are word-for-word aligned across each transition.

**Open design question:** the per-pattern overlay. The codebase already
has `LifecyclePatternSeed` per pattern (CDP, AMS, etc.) with
pattern-specific failure modes. Today these are loaded only at
classification (P0). They should compose with the generic pack at every
phase — generic + pattern-specific = full prompt. **Not yet wired.**

**PRs:**
- **PR-D:** integrate Codex-authored P0/P1/P3/P4/P5/P6 packs
- **PR-F:** pack ↔ pattern-overlay composition (generic + pattern-specific)

---

## 2. Horizontal intelligence — within-phase workflows

**What it is:** the loops that run *during* a phase, turning the static
pack into live signal.

| Workflow | Today | Required |
|---|---|---|
| **Question-resolution tracking** | Nexus may ask the same opener twice | Track which `rightQuestions` IDs have been answered in this engagement, suppress repeats, surface unresolved ones at gate exit |
| **Anti-pattern detection runner** | Pack lists `detectionHint` strings; Nexus *might* notice in chat | Tool that scans transcript + evidence for detection signals, emits `anti-pattern-flag` artifacts proactively |
| **Phase-progress artifact loop** | None | At every Nexus turn, emit `phase-progress` artifact summarizing question-completion vs. evidence-completion ratios |
| **Meeting-notes → pack signal** | `meeting-notes-capture.ts` exists | Wire ingested notes into question-resolution tracker so face-to-face conversation flows back into the pack |
| **Evidence-type expansion** | `deliverables_v2`, `program_modules` | Add: vendor-demo evidence, security-review evidence, change-readiness signal, training-plan completion, support-runbook readiness |
| **Pack ↔ pattern overlay** | Generic packs only | Compose generic pack + active pattern's per-stage `failureModes` + `contradictionTemplates` into one prompt section |
| **Sponsor health drift detection** | None | Track sponsor presence in workshops/meetings/Nexus chat; flag when cadence breaks |
| **Cross-program portfolio reasoning** | Each program isolated | Reason about 4 Apex programs sharing sponsor, competing for budget, stalling each other |

**PRs:**
- **PR-B:** `phase_evidence_check` tool + reactive artifacts (`phase-progress`, `anti-pattern-flag`)
- **PR-G:** question-resolution tracking with persistence
- **PR-H:** meeting-notes → pack signal
- **PR-I:** evidence-type expansion (vendor demos, security, change readiness)
- **PR-J:** sponsor health drift detector
- **PR-K:** cross-program portfolio reasoning (4-Apex stress test)

---

## 3. Lateral intelligence — agent-to-agent state

**What it is:** when one agent finds a signal, do the others see it?

| Handoff | Today | Required |
|---|---|---|
| Sentinel finds a contradicting pattern → Nexus | None | Shared signal store; Nexus reads at every turn |
| Maestro flags a risk → Nexus pack anti-pattern | None | Maestro flags map to pack `antiPatterns.id` so Nexus can re-coach toward mitigation |
| Steward registers a new sponsor → Nexus pack re-evaluates | None | Tenancy-scoped event bus; pack DoD recomputes |
| Atlas portfolio signal → individual program Nexus | None | Atlas-emitted `portfolio-signal` artifacts visible to per-program Nexus |
| Nexus phase-advance → Sentinel pattern weight update | None | P6 outcome closes the longitudinal loop (see §4) |

**PRs:**
- **PR-L:** shared signal store schema + Sentinel→Nexus contradiction relay
- **PR-M:** Maestro flag ↔ pack anti-pattern binding
- **PR-N:** Steward sponsor change → Nexus re-evaluation
- **PR-O:** Atlas portfolio signal visibility

---

## 4. Longitudinal intelligence — packs that learn

**What it is:** the moonshot. Static packs are good. Packs that *learn*
from outcomes are what makes the product defensible against any
LLM-wrapper competitor.

**Mechanism:** every program contributes signal:
- Anti-pattern fires → program later stalls in P3 → anti-pattern weight ↑
- Anti-pattern fires → program advances cleanly → anti-pattern weight ↓
- A `rightQuestions` resolution correlates with successful gates → question gets promoted to OPEN
- A pack `definitionOfDone` item never blocks anyone → flagged for review

**What's required:**
- Outcome telemetry per program (gate-pass/stall, P6 attestation, kill-criterion fires)
- Pack-version history (so weights have something to attach to)
- Cross-tenant aggregation (anonymized) so the pack improves portfolio-wide
- Pack-evolution review process (founder approves weight shifts? Auto-applies above threshold?)

**PRs:**
- **PR-P:** outcome telemetry capture
- **PR-Q:** pack versioning + weight attachment
- **PR-R:** longitudinal aggregation + review queue
- **PR-S:** pack-evolution governance (auto vs. founder-reviewed updates)

**Operator decision required from founder:**
- Aggregation across tenants — yes/no? privacy posture?
- Auto-apply weight shifts above threshold X, or founder-review every change?

---

## 5. External reality — what no playbook can fake

**What it is:** the world programs collide with that lives outside the
agent layer.

| Reality | Today | Required |
|---|---|---|
| Vendor contract dates | Not modeled | First-class event in tenant context |
| Regulatory deadlines | Not modeled | First-class event with cascade to affected packs |
| Board cycles | Not modeled | Tenant-level calendar that affects sponsor availability |
| Fiscal-year freezes | Not modeled | Window during which advance-to-Build is gated |
| Org chart events (sponsor leaves, reorg) | Not modeled | Triggers pack re-evaluation + Nexus coaching shift |

**PRs:**
- **PR-T:** tenant-context calendar (vendor dates, regulatory windows, fiscal freezes)
- **PR-U:** org-chart event ingestion → pack re-evaluation

---

## 6. Knowledge-layer broker boundary (load-bearing)

**What it is:** the architectural seam between app-tier code (agents,
routes, components) and the data layer (EnterpriseDataRoom, vector,
graph, persistence). The boundary is named `AgentContextBroker` and is
the **only allowed pathway** from app code to tenant data.

**Five layers:**

```
PhasePack            static workflow doctrine (this doc, §1)
EnterpriseDataRoom   tenant/client facts, artifacts, systems, evidence
AgentContextBroker   governed context envelope · the contracted seam
PersistenceMapper    dry-run lowering toward Postgres / vector / graph
Vector / graph       designed but NOT live yet
```

**Hard rules for app-tier work:**

1. Never `import` EnterpriseDataRoom seed files / broker internals /
   vector-or-graph stores from `src/app/**` or `src/lib/agent/**`.
2. Never query a vector or graph store directly from agents/routes —
   they aren't live and even when they are, the broker is the seam.
3. Phase Packs stay static doctrine — `evaluationHint` strings can
   *describe* tables/columns by name, but pack code MUST NOT call them.
4. Programs runtime defaults to read-only. Write-back is a separate,
   contracted scope.

**Implication for sequencing:** every PR in §2-5 below that needs
tenant evidence has a hidden prerequisite — `ProgramsBrokerAdapter`
(thin wrapper around `buildEnterpriseAgentContextBundle`). Without
that adapter, the implementation has to either (a) mock evidence in
TS or (b) violate the boundary. We pick (a) until the broker is live.

**PRs:**
- **PR-V:** `ProgramsBrokerAdapter` — thin adapter around
  `buildEnterpriseAgentContextBundle`. Converts `ProgramContextBundle`
  + tenant/program ids into a broker request. Read-only.
- **PR-W:** Evidence-binding tests — for each phase pack, verify
  `definitionOfDone[].evaluationHint` maps to either current DB
  concepts or Enterprise Data Room artifact/evidence concepts. The
  test is descriptive (string matching to a known vocabulary), not
  runtime-coupled.
- **PR-X:** Graph/vector readiness doc (BEFORE any persistence
  migration). Recommended defaults from Codex: text-embedding-3-small,
  1536 dims, `vector(1536)` if Supabase pgvector is chosen. Graph
  fallback: Postgres tables first, not Neo4j-first.
- **PR-Y:** Write-back contract — generated deliverables, user edits,
  decisions, approvals, evidence attachments become write events with
  provenance. Lands AFTER PR-V (read-only adapter) is stable.

---

## Sequencing — the path to "actually replaces a senior PM"

Within the agent-intelligence track, work proceeds in waves.
Each wave produces something demonstrable; we don't queue the next
wave's work behind speculative scope from later waves.

**Wave 1 — Foundation (COMPLETE):**
- ✅ PR-A · Pack scaffold + P2 Synthesis reference *(#1114)*
- ✅ PR-B · `phase-progress` + `anti-pattern-flag` artifacts *(#1119)*
- ✅ PR-C · `advance_phase` tool + surface-glob registry *(#1120)*
- ✅ PR-D · Codex-authored P0/P1/P3/P4/P5/P6 packs *(#1121)*
- ✅ PR-F · Agent-centric layout reshape `/programs/<id>` *(#1123)*
- ✅ PR-G · Surface canonicalization fix · restored tool + artifact channel *(#1125)*
- ✅ PR-H · Readability + reactive-panel empty state *(#1126)*
- ✅ PR-K · Origination → active program persistent canvas *(#1127)*
- ✅ PR-L · In-place phase advance + shared-chat artifact dispatch *(#1131)*
- ✅ PR-V/W/X · Codex broker bundle (`ProgramsBrokerAdapter` + evidence-binding tests + readiness doc) *(#1129/1130/1132)*

**Wave 1.5 — Master canvas across all four entry surfaces (COMPLETE):**
- ✅ PR-I · `/programs` (list) agent-centric reshape *(#1134)*
- ✅ PR-J · `/home` (Atlas portfolio) agent-centric reshape *(#1136)*
- ✅ PR-INT-A through E · `/intelligence` (Sentinel) agent-centric surface, Sentinel tools, new artifact types · parallel session *(#1135/1137/1138/1139/1141)*
- ✅ Redirect fix · retired stale `/intelligence` → `/preview/intelligence` redirect that 404'd Sentinel surface *(#1142)*

**Wave 1.6 — PR-E production walk + polish (COMPLETE):**
- ✅ PR-E · Chrome MCP walk on production `nexus-vert-kappa.vercel.app` · all four surfaces verified behaviorally:
   - **`/home` Atlas** — chat works, portfolio triage (Critical/Watch/On Track), reactive panel populates with `phase-recommendation` + `gate-evaluation [BLOCKED]` cards
   - **`/programs` Nexus list** — chat works, portfolio overview with per-program risk classification + recommended actions
   - **`/programs/<id>` Nexus detail** — `advance_phase` tool fires, `governance.evaluateGate` returns hard-fail blockers, four cards render in panel (`phase-recommendation` + 3× `gate-evaluation`), Nexus refuses to fabricate success
   - **`/intelligence` Sentinel** — chat works, `search_patterns` tool fires; **bug found:** `pattern-match` artifacts emitted with malformed JSON when summary contained `[[/artifact]]` substring → fixed in PR-O
- ✅ PR-N · Adaptive panel header by active agent (Atlas/Nexus/Sentinel labels match) *(#1145)*
- ✅ PR-O · `search_patterns` summary sanitizer (drops `longDescription` fallback, caps + escapes close-sentinel) *(#1147)*
- ✅ PR-P · CardShell adaptive agent prefix · cards inside the panel match the panel header *(#1148)*

**Wave 2 — Activation + broker contract:**
- PR-G' · Question-resolution tracking (Nexus knows which pack questions have been answered, doesn't repeat openers)
- PR-H' · Meeting-notes → pack signal
- PR-F'  · Pack ↔ pattern-overlay composition (per-pattern + per-phase compose into one prompt)
- Sourcing module session · `SESSION_BRIEF_SOURCING_MODULE.md` (#1144) ready to hand off to a fresh session — 8 PRs (PR-SRC-A through PR-SRC-H)

**Wave 3 — Lateral & expansion:**
- PR-I: Evidence-type expansion
- PR-J: Sponsor health drift
- PR-L: Sentinel→Nexus contradiction relay
- PR-M: Maestro flag ↔ pack anti-pattern

**Wave 4 — Portfolio & reality:**
- PR-K: Cross-program portfolio reasoning
- PR-T: Tenant calendar
- PR-N: Steward sponsor change relay
- PR-O: Atlas portfolio signal
- PR-U: Org-chart event ingestion

**Wave 5 — The moonshot (longitudinal):**
- PR-X: Graph/vector readiness doc (gates anything below)
- PR-Y: Write-back contract (provenance-tracked deliverables/edits/decisions)
- PR-P: Outcome telemetry (writes go through PR-Y)
- PR-Q: Pack versioning
- PR-R: Longitudinal aggregation
- PR-S: Pack-evolution governance

---

## What this means for the demo trajectory

**At Wave 1 close** (PR-A through PR-E, ~5-7 days):
- Nexus is opinionated on whatever phase you land on
- Surface 2 advance gate works correctly
- Reactive artifacts replace static cards

This is enough for a sponsor demo and meaningfully past "agent decoration."

**At Wave 2 close** (~2 weeks):
- Nexus tracks question resolution, doesn't repeat itself
- Meeting notes feed back into pack signal
- Generic + pattern-specific intelligence composes

This is enough for an investor demo to claim "agent-driven program platform"
without hand-waving.

**At Wave 3 close** (~3-4 weeks):
- Nexus knows when sponsor health drifts
- Sentinel and Maestro signals reach Nexus
- Evidence model covers vendor/security/change

This is enough to put in front of a real senior PM and survive 30 minutes.

**At Wave 4 close** (~5-6 weeks):
- Portfolio reasoning works across 4 Apex programs
- External reality (vendor dates, board cycles) is modeled

This is enough to put in front of a CIO and survive a 60-minute exec session.

**At Wave 5 close** (~8-10 weeks):
- Packs learn from outcomes
- Cross-tenant aggregation improves the platform-wide playbook

This is the "AbarVa is defensibly different from any LLM wrapper" moment.

---

## Honest gaps in this doc

Things I'm aware of and have not designed yet:

1. **Latency budget for pack-loaded prompts.** Each pack is ~200 lines
   formatted. Adding pattern overlay + signal store + question-tracker
   could push system block past where Anthropic's caching helps. Need
   measurement before Wave 2.

2. **Cross-tenant aggregation privacy posture.** Wave 5 implies
   anonymized cross-tenant signal. Not designed. Needs founder + counsel input.

3. **Pack ground-truth source.** I author packs from inferred discipline.
   Codex authors from broader source. **Neither is the same as a senior PM
   who has run 30 of these.** Wave 5 telemetry partially mitigates by
   letting the platform learn, but the cold-start packs need at least
   one real-PM review pass before stress-testing with a CIO.

4. **Tooling for pack maintenance.** No UI to read/edit packs. They're
   TypeScript files. At some volume that becomes a problem. Pre-Wave 5.

5. **Voice consistency across packs.** P2 reference has a strong tone.
   Codex-authored packs may drift in voice. Schema-sanity tests catch
   structure but not tone — need a style lint pass before PR-D merges.

---

## Ownership

Every row in §1-5 above maps to a PR. PRs without a named owner default
to Claude. PR-D content authoring is Codex (parallel). Founder reviews
the moonshot (Wave 5) before scope is locked.

This doc is the tracking artifact. When a PR ships, it gets crossed off
here. When new gaps emerge, they get added here, not buried in commit
messages.
