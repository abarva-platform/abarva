# CLAUDE_CODE_INTELLIGENCE_KICKOFF — Build doctrine for the Intelligence surface

Slice ID: INT-KICKOFF
Status: founder-accepted (auto-approve window 2026-04-30)
Authored: 2026-04-30
Type: build doctrine — referenced by every INT-* slice

This is the contract Claude Code agrees to before writing the
first line of `/intelligence` route code. It locks the build
order, the test discipline, the editorial workflow, and the
honest-fallback policy. Every Intelligence slice (INT-3 onwards)
must reference this doc and prove compliance against it.

Reads alongside:
- `docs/build/INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md` (the spine)
- `docs/build/CONTEXT_BROKER_DESIGN.md` (the retrieval contract — CB-1..CB-6)
- `docs/build/TENANT_DATA_INTEGRATION_DESIGN.md` (TD-1..TD-9)
- `docs/build/intelligence/INT-1_DETAILED_DESIGN.md` (J0 cold landing — shipped)
- `docs/build/intelligence/INT-2_DETAILED_DESIGN.md` (J1 oriented browse — shipped)

Memories: `feedback_no_demo_thinking`,
`feedback_design_thinking_end_to_end`,
`feedback_agent_anchored_setup`,
`project_codex_parallel_track`.

---

## 1. The three principles

### Principle 1 — Substrate before surface

No `/intelligence` route code ships ahead of the substrate it
depends on. The order is fixed:

1. Worldview chunks generated (Codex output, namespace
   `worldview`)
2. Pinecone ingestion path built and tested (CB-2, CB-3)
3. Worldview chunks ingested with embeddings
4. Retrieval contract verified end-to-end (`ContextBundle`
   carries facts + graph + chunks + corpus-patterns with
   provenance)
5. Sentinel voice doctrine system prompt composed and tested
   in isolation against the bundle
6. The four-mode answer model (generic / corpus / tenant /
   full) implemented as a service that works against real
   retrieval
7. *Then* the Intelligence surface gets built on top

If the substrate isn't real for a stage, the surface for that
stage is **honestly mocked** with a visible "fixture data" badge
in dev/staging mode (Principle 7). It is never silently mocked
and shipped.

The order matters because every UI decision is constrained by
what retrieval can actually return. Mocking retrieval and
building the UI on top means the integration moment surfaces a
hundred decisions that can't be answered without going back to
the design doc. **Substrate-first makes the integration moment
unnecessary because the surface is built directly against
working retrieval.**

### Principle 2 — Failure-mode-driven testing, not feature-driven testing

The default test discipline (unit-tests-on-functions,
integration-tests-on-routes) misses what matters for
Intelligence. The tests that matter are **failure-mode
regression tests** — for each of the 10 failure modes in the
spine doc, an explicit test that proves the failure mode is
prevented.

The 10 failure-mode regression tests live in
`tests/intelligence/failure-modes/` and run on every PR that
touches `/intelligence` or the broker. The full suite spec is
in §5.

### Principle 3 — Surface fidelity comes from content, not code

Most of what makes Intelligence land is editorial — the 10
cards' text, the thesis statements, the voice register, the
provenance rendering. **Content is a separate stream from
code.** The build sequence calls out per stage which content
artifacts must exist (signed off by the founder) before the
rendering code matters.

Confusing these is a major risk: Claude Code will produce
placeholder content that ships and never gets replaced because
"it's already there." The fixture-badge policy (§7) is the
guardrail.

---

## 2. The three locks (resolved)

### Lock 1 — Substrate readiness

**Resolved: two-wave ship.**

| Substrate layer | State (2026-04-30) | Wave |
|---|---|---|
| Postgres facts (segments, records) | **Real** — Apex 403, Meridian 714 | 1 |
| Graph (nodes, edges) | **Real** — Apex 257n/275e, Meridian 423n/584e | 1 |
| Pinecone semantic retrieval | **Pending** — CB-2/CB-3 land embeddings | 2 |
| Worldview corpus | **Not generated** — Codex pending | 2 |
| Industry corpus chunks | TS fixtures only, not embedded | 2 |
| Pattern catalog (corpus mode) | **Real** — addressable via `getPatternManifestEntries` | 1 |

**Wave 1 (built now, ships against keyword + structured retrieval):**
INT-3 (J2 topical deep-dive over patterns + contradictions),
INT-4 (J3 conversational surface — Sentinel chat), INT-9 (J5
synthesis validation), CB-1, CB-4, CB-5 from the broker design.

**Wave 2 (gated on Pinecone keys + worldview chunks):**
INT-7 (J4 tenant-grounded), the cross-corpus mode in INT-4, the
worldview-citing path in J0/J1/J2, the four-mode comparison
artifact at full fidelity.

### Lock 2 — Editorial content sequencing

**Resolved: parallel content stream, with three artifacts to
author before INT-3 / INT-4 ship.**

| Artifact | State |
|---|---|
| 10 J0 failure-mode cards | **Authored** (`src/lib/intelligence/j0-failure-mode-cards.ts`) |
| 10 J1 topic theses | **Authored** (`src/lib/intelligence/j1-topics.ts`) |
| `AGENT_VOICE_SENTINEL.md` doctrine | **Authoring now** (INT-VOICE) |
| Demo-robustness 50-question suite | **Authoring now** (INT-RGS) |
| Worldview chunks (W1-W5) | Codex pending; placeholder retrieval until they land |
| `AGENT_VOICE_ATLAS.md`, `_NEXUS.md`, `_STEWARD.md` | Wave 2 |

### Lock 3 — Worldview chunk timing

**Resolved: parallel.** Codex generates worldview content while
Claude Code:
- Builds the Pinecone ingestion path (CB-2 / CB-3 — code lands
  without keys; running needs keys)
- Authors the Sentinel voice doctrine
- Builds the failure-mode regression suite
- Wires keyword retrieval + structured-fallback as the
  placeholder retrieval contract

Worldview chunks land into the existing contract; no surface
refactor required. The contract in CB-1 is fixed first.

---

## 3. Build sequence (dependency-ordered)

The build is sequenced by dependency, not by visibility. Highest
visibility surface (`/intelligence` chat) is among the *last*
things built — because its credibility depends on substrate
quality.

### 3.1 Wave 1 — independent of Pinecone keys

| Order | Slice | Description |
|---|---|---|
| 1 | INT-VOICE | `AGENT_VOICE_SENTINEL.md` — sample-exchange spec composed into Sentinel system prompt |
| 2 | INT-RGS | 50-question demo-robustness regression suite scaffold; runs against current `agent-retrieval.ts` and CB-1 stubs |
| 3 | CB-1 | `ContextBundle` + `ContextBroker` types + contract + stubs (per CONTEXT_BROKER_DESIGN.md §2) |
| 4 | CB-4 | `POST /api/context/demo` returning the bundle as JSON; deterministic; works without LLM |
| 5 | CB-5 | "Context Assembled" panel UI — renders the bundle beside any chat answer |
| 6 | CB-2 | Embedding job code (gated on `OPENAI_API_KEY` to *run*, not to merge) |
| 7 | INT-3 | J2 topical deep-dive — pattern detail + contradiction detail with provenance from CB-1 |
| 8 | INT-9 | J5 synthesis validation — `validate_synthesis` tool + assessment rendering |
| 9 | INT-4 (partial) | J3 conversational surface — Sentinel chat + reactive pane + mode toggle (modes work; chunks empty until CB-3) |

### 3.2 Wave 2 — gated on Pinecone keys + worldview chunks

| Order | Slice | Description |
|---|---|---|
| 10 | CB-3 | Pinecone client wired into the embed job (real upsert) + vector retrieval in the broker |
| 11 | CB-6 | 4-mode toggle UX in chat composer + per-mode bundle assembly + telemetry events; post-hoc validator (soft) |
| 12 | INT-7 | J4 tenant-grounded surface — full Apex / Meridian narrative |
| 13 | INT-4 (full) | J3 with vector retrieval + worldview citations live |

### 3.3 Build can ship Wave 1 to pilot

J0/J1/J2/J3/J5 deliver ≥70% of the surface and demonstrate most
of the moat. J4 is the moat-most-legible surface but its
credibility depends on substrate quality — better to ship Wave
1 without J4 than to ship a fake J4.

---

## 4. Editorial content sequencing per stage

Before each user-journey stage's surface code merges, verify
the content registry for that stage exists and is signed off.

| Stage | Required content | Status |
|---|---|---|
| J0 | 10 failure-mode narrative cards | ✓ shipped |
| J1 | 10 topic theses | ✓ shipped |
| J2 | Pattern detail content (existing pattern manifest) + contradiction registry | manifest exists; contradiction registry to be authored alongside INT-3 |
| J3 | Sentinel voice doctrine + system prompt | INT-VOICE in flight |
| J4 | Tenant narrative templates per archetype (retail, healthcare) | wave 2 |
| J5 | Voice doctrine + assessment templates | partial — `validate_synthesis` tool exists; assessment UI pending INT-9 |

If Claude Code reaches a stage and the content doesn't exist, it
**pauses and surfaces this** rather than scaffolding placeholder
content.

---

## 5. The 50-question demo-robustness regression suite (INT-RGS)

The suite runs against the current `agent-retrieval.ts` path
and (once landed) CB-1 stubs. Initial runs will fail most
tests — the failure list **is** the build backlog.

### 5.1 Question set composition

50 questions, distributed across:
- **15 cold/CIO-frame questions** ("How should I think about pilot-to-production?", "What goes wrong with AI governance?")
- **15 tenant-grounded questions** (Apex + Meridian; e.g. "Why is Meridian's prior-auth program high-risk right now?")
- **10 cross-corpus questions** ("Compare Apex's CDP rollout against industry pilot-to-production patterns")
- **5 voice-doctrine probes** (questions designed to elicit "you should…" lapses, marketing-language drift, etc.)
- **5 honesty probes** (questions whose answer should be "I don't know" or "tenant data not yet persisted")

### 5.2 Failure-mode ↔ test mapping

| FM | Test |
|---|---|
| #1 Indistinguishable from ChatGPT | Generic vs. corpus_grounded mode produce structurally different responses; corpus_grounded cites at least 2 worldview/industry chunks; generic cites zero |
| #2 Empty-state collapse | Cold load of `/intelligence` renders 10 failure-mode cards with substantive (>100 chars) content; no lorem ipsum; no "TODO" |
| #3 Provenance buried | Every claim in a Sentinel response is matched to a `ProvenanceCitation` in the assembled bundle |
| #4 Voice drift | Responses pass voice-doctrine checks: no "you should" / "we recommend" lapses; citation-first structure; contradiction-aware framing |
| #5 Search-results page | J3 responses render as synthesis prose, not bulleted pattern lists |
| #6 Tenant-context unused | Authenticated tenant-grounded mode default uses `bundle.facts` + `bundle.chunks` for the active tenant; not the generic LLM prior |
| #7 Browse mode without thesis | Every J1 topic page has a thesis statement `<h2>` element at the top |
| #8 Failure-mode narrative absent | J0 cards link to `/intelligence/failure-modes/<slug>` pages with substantive narrative (>500 chars) |
| #9 Cross-corpus reasoning missing | Cross-corpus / `full` mode bundle includes items from at least two of {worldview, industry, tenant} namespaces |
| #10 Demo-fragile | Full 50-question suite runs as a regression gate before any deploy; >40 must pass for deploy to proceed |

### 5.3 Test infrastructure

- Suite location: `tests/intelligence/failure-modes/`
- Runner: `npx jest tests/intelligence/failure-modes`
- Each FM gets one or more `*.test.ts` files
- Snapshots disallowed — assertions are explicit, value-based
- Suite runs in CI on every PR touching `src/app/intelligence/**`,
  `src/components/intelligence/**`, `src/lib/intelligence/**`,
  `src/lib/knowledge/**`, `src/lib/agent/tools/intelligence/**`
- Wave-1 acceptance: ≥35 of 50 pass (worldview-dependent
  questions allowed to fail with documented reason)
- Wave-2 acceptance: ≥45 of 50 pass

---

## 6. Stage gates

Each stage's PR is blocked from merging unless its relevant
failure modes are prevented in the regression suite.

| Stage | Gate failure modes |
|---|---|
| INT-3 (J2) | #2, #3, #7, #8 |
| INT-4 (J3 partial) | #1, #3, #4, #5 |
| INT-9 (J5) | #3, #4 |
| CB-5 (Context Assembled panel) | #3, #9 |
| INT-7 (J4) | #6, #9 |
| INT-4 (J3 full) | #1, #3, #4, #5, #6, #9, #10 (full suite ≥45/50) |

---

## 7. Honest-fallback policy

If at any point a surface is rendering content from TypeScript
fixtures rather than real persistence, the page **must visibly
indicate this in dev/staging mode**. A subtle "fixture data"
badge in the corner of the panel, with a tooltip explaining
which substrate layer is pending.

The badge is **suppressed only in production** and **only when
the substrate is real**. Production with fixture-data fallback
is a deploy block, not a hidden state.

The agent's voice mirrors this: when `bundle.warnings` includes
`'vector_index_pending'`, Sentinel says "vector retrieval not
yet live; this answer is grounded in tenant Postgres + graph
only" rather than pretending vector retrieval ran.

---

## 8. Boundary discipline

Per `feedback_broker_boundary.md`:

- App-tier code (`src/app/**`, `src/components/**`,
  `src/lib/agent/**`) MUST NOT directly import:
  - `EnterpriseDataRoom`
  - `tenant-data/store.ts`
  - Pinecone client modules
  - Vector / graph stores
- The single seam is `ContextBroker.assemble()` returning
  `ContextBundle`. The bundle is JSON-shaped; everything
  app-side consumes the bundle.
- ESLint rule `no-restricted-imports` enforces this for the
  `tenant-data/store` and Pinecone modules; CB-1 extends it to
  the `context-broker/store` internals.

---

## 9. What ships when

| Artifact | Status as of 2026-04-30 |
|---|---|
| INT-1 (J0 cold) | ✓ Shipped |
| INT-2 (J1 oriented browse) | ✓ Shipped |
| INT-VOICE (Sentinel doctrine) | In flight |
| INT-RGS (regression suite scaffold) | In flight |
| CB-1 (ContextBundle types) | In flight |
| CB-2 (embedding job code) | After CB-1 |
| CB-3 (Pinecone wired) | Gated on `OPENAI_API_KEY` + `PINECONE_API_KEY` |
| CB-4 (`/api/context/demo`) | After CB-1 |
| CB-5 (Context Assembled panel) | After CB-1 |
| CB-6 (4-mode toggle + telemetry) | After CB-3 + CB-5 |
| INT-3 (J2 deep-dive) | After CB-1 |
| INT-4 (J3 chat) | After CB-1 + CB-5 |
| INT-7 (J4 tenant) | After CB-3 |
| INT-9 (J5 validation) | After CB-1 |

---

## 10. Acceptance criteria for INT-KICKOFF

- [x] §1 three principles stated and locked
- [x] §2 three locks resolved with current substrate state
- [x] §3 build sequence dependency-ordered
- [x] §4 editorial content sequencing per stage
- [x] §5 50-question regression suite spec
- [x] §6 stage gates per slice
- [x] §7 honest-fallback policy
- [x] §8 boundary discipline carried forward
- [x] §9 ship-status table

---

## End of CLAUDE_CODE_INTELLIGENCE_KICKOFF

The next move is **INT-VOICE** in parallel with **CB-1**. Both
are buildable now without keys. The 50-question regression
suite (INT-RGS) follows immediately and becomes the gate for
every subsequent slice.
