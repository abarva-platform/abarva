# Codex backlog · detailed specs (16 tasks · A1-E3)

> **Generated 2026-04-21 by Claude Code.** Each task is paste-ready for Codex and standalone. Task IDs #81-#96 in TaskList.
>
> **Global rules:**
> - Each task gets its own branch off `main`, its own PR.
> - **Never auto-merge.** Ping @anandsundaram-hash when ready.
> - Run `npx tsc --noEmit` and (where code changes) `npx next build` before push. Both must be clean in `src/` (pre-existing `tests/e2e/` `familiarity` union-type errors are known — not your responsibility unless your task touches those files).
> - If a task conflicts with in-flight PRs, commit what you can and surface the conflict — don't resolve unilaterally.
> - **E2 (#95) is blocked on Anand's teal decision.** All others unblocked.
> - Suggested parallelization: A1+A3+A4 (different seed files); B1+B2+B3 (different spec files); C1+C2 (different markdown); D2+D3; E1+E3. E2 waits for decision.

---

## Task A1 · Additional deliverable templates · 2-3h

**Branch:** `codex/deliverable-templates-phase-1-4` off `main`

**Why:** PR #28 populated `template_structure` / `quality_rubric` / `generation_prompt_template` on the `charter` row in `deliverable_types`. Three other deliverable types exist (`diagnostic_charter`, `design_brief`, `execution_plan`, `outcome_report`) but their template fields are empty, so `src/lib/deliverables/generate.ts:generateDeliverableForPhase()` produces thin auto-generated artifacts when those phases complete.

**Scope:**
- 4 new idempotent SQL migrations at `supabase/migrations/20260422_NNNNNN_<type>_template_content.sql` (one per type)
- Each migration `UPDATE deliverable_types SET template_structure = ..., quality_rubric = ..., generation_prompt_template = ... WHERE type_key = '<type>' AND (template_structure = '{}' OR template_structure IS NULL)` — guard against overwriting populated rows
- Mirror content as TypeScript at `src/lib/deliverables/templates/{diagnostic_charter,design_brief,execution_plan,outcome_report}.ts` following `charter.ts` shape from PR #28 (export `STRUCTURE`, `RUBRIC`, `PROMPT` constants)
- Migration loads constants by `\copy` or inline-escaped JSONB — whichever PR #28 did, follow that pattern

**Section hints (not prescriptive):**
- `diagnostic_charter` (Phase 1→2): problem definition, root-cause hypothesis, baseline metrics, first-win scope (2-3 weeks), success criteria, the one decision that can't wait past Phase 1
- `design_brief` (Phase 2→3): solution architecture sketch, vendor shortlist with explicit tradeoffs, data flow diagram slot, the irreversible decision
- `execution_plan` (Phase 2→3): milestones with owners + dates, dependency graph, risk register (each risk has a mitigation owner), 30-day target
- `outcome_report` (Phase 3→4): baseline vs actual table, attested savings (with attestor name + bar), what we'd do differently, handoff to BAU

**Rubric shape:** JSONB array. Each criterion: `{criterion: string, rationale: string, severity: 'blocker'|'major'|'minor'}`.

**Verification:**
- Run each migration locally
- `SELECT type_key, jsonb_pretty(template_structure), jsonb_pretty(quality_rubric), generation_prompt_template FROM deliverable_types WHERE type_key IN ('diagnostic_charter','design_brief','execution_plan','outcome_report');` — all three populated for all four types
- Typecheck on the new TypeScript modules passes
- Re-run programs-demo-apex seed — charter preservation guard from PR #28 shouldn't affect these new types (they're different rows)

**Non-goals:** Don't touch `src/lib/deliverables/generate.ts`. Don't add new deliverable types. Don't modify the `charter` row.

**Overlap risk:** None identified. PR #33 (codex/wave2) is about intelligence overlays, not deliverables.

---

## Task A2 · Demo engagement turn-history depth · 2-3h

**Branch:** `codex/demo-turn-history` off `main`

**Why:** Live demos need the chat panel to look realistic at any phase, not just Phase 0. Current demo engagements have sparse turns. Demoing Phase 3 with 2 turns in history feels fake.

**Scope:** New idempotent script at `src/scripts/seed/demo-turn-history.ts` that, for each seeded demo engagement (Meridian Analytics Modernization, Arcturus Wealth Platform, Apex Retail HR ERP, plus the 4 Apex Phase-5 programs), seeds:
- 8-15 user+agent turn pairs per phase the engagement has progressed through
- Realistic scope-tightening dialogue aligned to each phase per `src/lib/nexus/gateLifecycle.ts:PHASE_OPENERS`
- At least one `<gate_approval>` JSON block at each phase boundary — shape must parse via `src/lib/agent/parse.ts:parseGateApprovalBlock` (fields: `phase: number`, `approval_text: string`, `summary: string`)
- 2-3 `<decision_logged>` blocks per engagement with believable `{summary, rationale, decision_maker, impact}` — must parse via `parseDecisionBlocks`
- For Phase 3-4 engagements, 1-2 `<actual_metrics>` blocks with `{items: [{metric, actual_value, measurement_date?, source?}]}`

**Turn row shape (from `src/lib/db/turn.ts:TurnRow`):**
```
engagement_id (FK)
phase (int 0-4)
sender ('agent' | 'user')
text (string — for agent turns, include the JSON blocks inline as the model emits)
mode_label (string | null — 'research' / 'execution' etc.)
retrieved_refs (jsonb — empty object {} is fine for demo turns)
created_at (timestamptz — sequence so turns read chronologically within phase)
```

**Idempotency:** guard with `WHERE NOT EXISTS (SELECT 1 FROM turns WHERE engagement_id = $1 AND text = $2)` or hash-based dedup on `(engagement_id, sender, text)`. Re-running must be a no-op.

**Package.json:** add `"seed:demo-turns": "npx tsx src/scripts/seed/demo-turn-history.ts"`.

**Verification:**
- Run twice, confirm `SELECT COUNT(*) FROM turns WHERE engagement_id = <meridian>` stable across runs
- Manually open each demo engagement in dev server, scrub the phase dropdown, confirm rich history at every phase
- Confirm `<gate_approval>` blocks are stripped from user-visible text (voiceFilter's job — shouldn't see raw JSON in chat)

**Non-goals:** Don't create new engagements. Don't modify existing engagement rows other than the turns they contain. Don't add turns for non-demo engagements.

**Overlap risk:** PR #26 (intelligence-layer-keystone) may have touched Keystone's turns. Confirm Keystone is out of scope unless Anand says otherwise — this task covers Meridian / First Capital / Apex only.

---

## Task A3 · Peer decisions + contradiction seed expansion · 1-2h

**Branch:** `codex/peer-decisions-contradictions-seed` off `main`

**Why:** Engagement console right-rail pulls `peer_decisions` (`src/lib/graph/retrieval.ts:getPeerDecisionsForPhase`) and `contradictions` (Tower). Both tables are thin; demos hit empty-state messages too often.

**⚠️ Overlap check first:** PR #32 (codex/contradiction-engine) merged a contradiction *runtime*. Before writing seed, `git log origin/main -- supabase/migrations/ | head -20` to see if #32 also seeded rows. If yes, this task becomes "add N more" to whatever #32 shipped. If no, seed from scratch.

**Scope:**

**Peer decisions (20-30 rows):**
- Spread across 3 industries: HEALTHCARE_IDN / FINSERV / RETAIL
- Phases 0-4 representation (not all concentrated in Phase 1)
- Each row:
  - `choice` (snake_case string — `build_in_house`, `buy_snowflake_cortex`, `partner_with_accenture`, etc.)
  - `engagement_count` (3-12, realistic cohort size)
  - `avg_outcome_usd` ($500K – $50M, varies by industry scale)
  - `avg_duration_weeks` (8-52 weeks)
  - `industry_code` (one of the 3)
  - `phase` (0-4)
- Idempotent seed via `WHERE NOT EXISTS (SELECT 1 FROM peer_decisions WHERE choice = $1 AND industry_code = $2 AND phase = $3)`

**Contradictions (10-15 rows per demo client):**
- Tied to real `engagement_id` via FK to engagements across Meridian / First Capital / Apex
- Mix of severities: 30% high, 50% medium, 20% low
- Each row:
  - `one_liner` (30-80 char tight summary — "sales force predicts but CFO's forecast doesn't feed it")
  - `description` (longer narrative, 150-300 char)
  - `severity` (high / medium / low)
  - `monthly_total_usd` (null OR $10K-$5M range, sized to client scale from `CLIENT_PROFILES`)
  - `eliminable_usd_annual` (null OR $100K-$20M; approx 60-80% of monthly × 12)
  - `owner_named` (mix of true/false — exercise the "no owner" badge)
- Idempotent via `(engagement_id, one_liner)` composite guard

**Files:** `src/scripts/seed/peer-contradictions-expansion.ts` + `package.json` script entry (`"seed:peer-contradictions"`).

**Verification:**
- Run twice; row counts stable
- Open engagement console for each demo engagement — right-rail shows 3+ peer decisions and 3+ contradictions
- Contradictions render with eliminable $ formatted correctly (`$Xm/yr eliminable` vs `$XK/yr`)

**Non-goals:** Don't modify the contradiction detection runtime (#32's domain). Don't add contradictions for engagements that don't exist.

---

## Task A4 · Public-patterns Pinecone expansion · 1-2h

**Branch:** `codex/public-patterns-v2` off `main`

**Why:** PR #74 populated an initial set in `nexus-knowledge:public-patterns` namespace. Current classifier (`src/lib/programs/classifier.ts`) returns empty matches for too many common queries. Double the count for industry+function depth.

**⚠️ Overlap check:** PR #33 (codex/wave2) mentions "foundational patterns." Before running, inspect `gh pr view 33 --json files` — if wave2 already populated public-patterns, this task is redundant or needs rescoping. If wave2 is different (overlays, briefings), A4 proceeds.

**Scope:** Extend `src/scripts/populate-public-patterns.ts` from PR #74. Add new pattern records. Target distribution:

| Industry / area | New patterns |
|---|---|
| Finserv · wealth management | 4-5 (advisor copilots, client portfolio analytics, proposal generation, KYC automation, marketing rule compliance) |
| Finserv · investment research | 2-3 (earnings summarization, ESG signal extraction, analyst note drafting) |
| Healthcare · RCM | 3-4 (claims denial reduction, prior-auth automation, charge capture, coding assistance) |
| Healthcare · clinical | 2-3 (ambient scribes, clinical decision support, patient access chatbot) |
| Retail · supply chain | 3-4 (demand forecasting, inventory optimization, markdown optimization) |
| Retail · store ops | 2-3 (store associate productivity, conversation commerce, loss prevention) |
| Cross-industry back-office | 3-4 (procurement automation, close-process acceleration, HR helpdesk AI, IT service desk) |

**Pattern record shape (extend existing):**
```typescript
{
  pattern_key: string,         // unique snake_case, e.g. 'finserv_wealth_advisor_copilot'
  title: string,
  summary: string,             // 2-3 sentences
  industries: string[],        // array — matches metadata filter shape per PR #17 fix
  function_code: string,
  archetype: 'strategic_transformation' | 'workflow_automation' | 'platform_modernization' | 'ai_product_enablement' | 'operational_optimization',
  typical_outcomes: string[],  // 3-5 outcome bullets
  vendor_examples: string[],
  failure_modes: string[],
}
```

**Embedding:** OpenAI `text-embedding-3-large` with **dimensions: 1024** (index dim; 3072 will fail). Input text = `${title}\n\n${summary}\n\n${typical_outcomes.join(' · ')}`.

**Upsert:** `pc.index('nexus-knowledge').namespace('public-patterns').upsert({ records: batch })` — the records-wrapper shape from PR #17.

**Idempotency:** upsert with same `pattern_key` replaces in-place. No special guard needed.

**Verification:**
- After run: `pc.index('nexus-knowledge').describeIndexStats()` shows namespace vector count increased by expected delta
- Run classifier against 5 new representative queries spanning the added industries — confirm non-empty matches with reasonable confidence bands
- Add a smoke assertion to `scripts/verify-classifier-matches.ts` (or mirror it) if one exists

**Gotcha:** embed dims MUST be 1024. Confirm `dimensions: 1024` in the `openai.embeddings.create` call. 3072 (default) will throw "Vector dimension 3072 does not match index 1024."

---

## Task B1 · Programs sub-page E2E · 2-3h

**Branch:** `codex/e2e-programs-subpages` off `main`

**Why:** PR #27 covers Phase 0-4 transitions. Programs sub-pages (`/programs/[id]/module/[key]`, `/settings`, `/team`, `/timeline`) aren't covered. A regression there ships silently.

**Scope:** Reuse helpers from `tests/e2e/_helpers/` in PR #27 (`auth.ts`, `env.ts`, `program-fixtures.ts`, `stream-mock.ts`). Don't duplicate.

**New specs:**

1. `tests/e2e/programs-module.spec.ts`
   - Seed a fixture engagement via `program-fixtures.ts` at Phase 2
   - Navigate to `/programs/[graphNodeId]/module/[key]` (pick a real module key that exists on demo engagements — check `src/app/(maestro)/programs/[programId]/module/[key]/page.tsx` for param shape)
   - Assert module detail heading, the back-to-program link, at least one descriptor block renders

2. `tests/e2e/programs-settings.spec.ts`
   - Navigate to `/programs/[graphNodeId]/settings`
   - Assert form fields (program name input, sponsor select, industry field) populated with fixture values
   - Mock the `PATCH /api/programs/[programId]` (or whatever the update endpoint is — check `src/app/api/programs/[programId]/route.ts`) via `page.route()`
   - Type a new program name, submit, assert success state

3. `tests/e2e/programs-team.spec.ts`
   - Navigate to `/programs/[graphNodeId]/team`
   - Assert the roster renders with fixture team members (sponsor + co-sponsor + maestro)
   - Confirm role badges render correctly (Sponsor / Co-sponsor / Maestro)

4. `tests/e2e/programs-timeline.spec.ts`
   - Navigate to `/programs/[graphNodeId]/timeline`
   - Assert events render in chronological order (use fixture turns + gate approvals from `program-fixtures.ts`)
   - Assert phase-advance events have the correct phase label

**Shared:**
- Extend `tests/e2e/_helpers/program-fixtures.ts` if it lacks a `Phase 2` or higher fixture — add one if needed
- Follow PR #27's env-gated skip pattern for missing `CLERK_SESSION_TOKEN`

**Package.json:**
```
"test:e2e:programs-subpages": "playwright test tests/e2e/programs-module.spec.ts tests/e2e/programs-settings.spec.ts tests/e2e/programs-team.spec.ts tests/e2e/programs-timeline.spec.ts"
```

**Verification:**
- `npx playwright test tests/e2e/ --list` shows 4 new specs
- `./node_modules/.bin/tsc --noEmit` clean (fix the `familiarity` union type if it surfaces — that was a real type error in PR #27 helpers)

**Non-goals:** Don't assert data correctness, just UI smoke (page renders, nav works). Don't cover admin surfaces.

---

## Task B2 · Auth + sign-in smoke E2E · 1-2h

**Branch:** `codex/e2e-auth-sign-in` off `main`

**Why:** Clerk OTP is central to every demo. Role-gated nav (per #46) means a Clerk config drift silently breaks role handling.

**Scope:** Single spec `tests/e2e/auth-sign-in.spec.ts` with 4 test cases, one per role.

**Demo Clerk users** (look up exact emails from `~/.claude/projects/-Users-anand-Projects-nexus/memory/demo_accounts.md` — approx shapes):
- Admin: `admin+clerk_test@example.com`
- Maestro: `mh+clerk_test@example.com` or `af+clerk_test@example.com`
- Client (Meridian): `prat+clerk_test@example.com`
- Client (Apex): `priya+clerk_test@example.com`
- Investor: `investor+clerk_test@example.com`

**OTP:** All demo users use `424242` per Clerk test-user convention.

**Per role, assert nav items:**

| Role | Home | Programs | Intelligence | Tower | Platform | Investor |
|---|---|---|---|---|---|---|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Maestro | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Client | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Investor | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |

**Test flow per role:**
1. Navigate to `/sign-in`
2. Enter email
3. Complete OTP with `424242`
4. Assert redirect to `/home`
5. Assert top-nav items match table above
6. Sign out
7. Assert redirect to `/`

**Fixtures:** pull email addresses from a `tests/e2e/_helpers/demo-accounts.ts` helper (new). Include env gate for `CLERK_TEST_OTP` — if unset, skip cleanly.

**Gotcha:** Clerk test users in OTP mode require the test key published in Clerk dashboard. If `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` on the test env is production-mode, OTP won't accept `424242`. Env-gate the tests accordingly.

**Verification:**
- `npx playwright test tests/e2e/auth-sign-in.spec.ts --list` shows 4 cases
- Typecheck clean

---

## Task B3 · Intelligence Library + Foundation E2E · 1-2h

**Branch:** `codex/e2e-intelligence-library` off `main`

**Why:** `/intelligence` dashboard + `/intelligence/foundation` browse path are demo-critical (Prat memories reference these). Not covered by PR #27's Ask-only smoke.

**Scope:**

1. `tests/e2e/intelligence-library.spec.ts`
   - Navigate to `/intelligence` as signed-in admin
   - Mock `/api/v1/intelligence/foundation/browse` via `page.route()` with deterministic fixture response (3-5 product tiles)
   - Assert product tiles render
   - Click first tile, assert navigation to `/intelligence/foundation/[productKey]` or wherever the tile points

2. `tests/e2e/intelligence-foundation.spec.ts`
   - Navigate to `/intelligence/foundation`
   - Mock the browse endpoint with filterable items
   - Assert filter interactions work (industry filter, search input)
   - Click an item, assert detail drawer/panel opens

**Helpers:** reuse `auth.ts` + `env.ts` from `tests/e2e/_helpers/`. Add a `tests/e2e/_helpers/intelligence-mocks.ts` for the shared intelligence API response fixtures.

**Package.json:** `"test:e2e:intelligence": "playwright test tests/e2e/intelligence-*.spec.ts"` (covers Ask from PR #27 + new Library/Foundation).

**Verification:** Typecheck + `playwright --list` both clean.

**Non-goals:** Don't validate result correctness — just UI smoke.

---

## Task B4 · API integration tests for `/api/v1/nexus/*` · 2-3h

**Branch:** `codex/api-tests-nexus` off `main`

**Why:** Nexus routes are critical path. Only E2E (UI) currently covers them. Server-side invariants need their own tests that run fast without a browser.

**Scope:** Jest tests under `src/__tests__/integration/nexus/`:

1. `query.test.ts` — POST `/api/v1/nexus/query`:
   - Assert SSE events emit in order: `turn_started` → `retrieval_progress` → `content_delta` → `source_attached` → `turn_complete`
   - Assert `turn_started` payload has `turnId`, `mode`, `format`
   - Assert `turn_complete` payload has `latencyMs` breakdown with phase keys
   - Assert empty body returns 400 `{ error: 'bad_request' }`
   - Assert missing `query` returns 400
   - Tenancy: assert 403 when the Clerk session's `clientId` cookie ≠ a different `clientId` in the query body

2. `counter.test.ts` — POST `/api/v1/nexus/counter`:
   - Assert format classification returns a valid `NexusFormat` type
   - Assert the counter capability path is invoked (check response shape has the counter-specific fields)

3. `persona.test.ts` — POST `/api/v1/nexus/persona`:
   - Assert persona parameter is accepted and threaded through
   - Assert invalid persona returns 400

4. `voice-filter.test.ts` — unit-level for `src/lib/nexus/voiceFilter.ts`:
   - Test every forbidden phrase gets stripped
   - Test generic `<foo_bar>{json}</foo_bar>` gets stripped
   - Test non-JSON tags (e.g. `<em>foo</em>`) are preserved
   - Test `liveStripInternalTags` cuts at open tag when close hasn't arrived
   - Test `filterPayload` walks JSON values

**Mocks:** Use `jest.mock('@anthropic-ai/sdk')`, `jest.mock('openai')`, `jest.mock('@pinecone-database/pinecone')` at module level. The classifiers in `src/lib/nexus/classifiers/*` hold module-level singletons — factor out the SDK client init to be mockable, OR use `jest.isolateModules` + `jest.doMock` per test.

**Tenancy setup:** the `requireTenancy()` helper in `src/app/api/v1/_intel-auth.ts` needs a mock. Either inject via a test helper that sets the Clerk session cookie OR mock `clerkMiddleware` / `auth()` return value per test.

**Package.json:** `"test:integration:nexus": "jest src/__tests__/integration/nexus"`. Confirm `jest.config` includes the `src/__tests__/integration/**/*.test.ts` glob — add if missing.

**Verification:**
- `npm run test:integration:nexus` passes
- Each test file runs in <2s
- Typecheck clean on the test files

**Non-goals:** Don't test live model output — mock the Anthropic response. Don't test UI — E2E covers that.

---

## Task C1 · Spec hygiene audit + cleanup PR · 1h

**Branch:** `codex/spec-hygiene` off `main`

**Why:** PR #72 moved 21+ spec files into `docs/specs/` hierarchy. Internal relative links weren't audited for integrity.

**Scope:**

1. Walk every `.md` file under `docs/specs/` (use `find docs/specs -name '*.md'`)
2. Extract all relative links: `grep -oP '\]\(\.[^)]+\)' <file>` for each file
3. For each link, verify the target path resolves from the source file's directory
4. Build a list of broken links with (source_file, link_text, bad_target)
5. Fix by either:
   - Updating the link to the correct new path
   - Restoring a referenced file from `docs/specs/_archive/` if it was moved there incorrectly
   - Removing the link if the target is genuinely gone (document this in the PR body)

6. Check for duplicate-content files between primary locations and `_archive/` — if a file is only in `_archive/` but still being referenced, either move it out or update the reference
7. Check `docs/specs/README.md` (if it exists) for stale references — PR #23 added Keystone entries there; confirm nothing else is outdated

**Deliverable:** PR with:
- Diff showing link fixes + file moves
- PR body with a table: `| file | issue | fix |` so Anand can review what changed and why
- No .md file should be unreachable from `docs/specs/README.md` (if README exists as an index)

**Non-goals:** Don't rewrite spec content. Don't reorganize the hierarchy. Just fix broken links.

---

## Task C2 · Runtime contract docs · 2h

**Branch:** `codex/runtime-contract-docs` off `main`

**Why:** Three Nexus runtime pieces have implicit contracts that future sessions break. Documenting them protects against regressions.

**Scope:** Create `docs/specs/platform/runtime-contracts/` directory with 3 markdown files, each transcribing actual shipped behavior from the source (don't invent — read the code):

### `orchestrator.md`
Source: `src/lib/nexus/orchestrator.ts`, `src/app/api/v1/nexus/query/route.ts`, `src/lib/nexus/sseStream.ts`

Must document:
- Input schema: `OrchestratorInput` (query, tenancy, priorTurns, formatOverride, pivotHints, capability, includeSessionContext, onProgress, onTextDelta, onGateSignal)
- Output schema: `OrchestratorOutput` (mode, format, payload, bundle, latencyMs, strippedCount, clarifying, session, gateSignals)
- 6-phase pipeline: parse (mode + format + clarifying) → plan (intake) → retrieve (evidence) → assemble (bundle with value/contradiction/decision) → compose (LLM stream) → render
- Hard cap: 15s, trips to `idk` format if exceeded pre-compose
- SSE event schema emitted by the route: `turn_started`, `clarifying_question`, `retrieval_progress`, `content_delta`, `source_attached`, `turn_complete`, `error` (event name + payload shape for each)
- Gate signal parsing: three tag types (`gate_approval`, `phase_transition`, `charter_generation`), the `parseGateSignals` regex, the signal payload shape
- Session context: when it loads, what it contains, how it's threaded into compose

### `voice-filter.md`
Source: `src/lib/nexus/voiceFilter.ts`

Must document:
- Two-phase filtering: generic XML signal tag stripper, then forbidden phrase list
- `INTERNAL_SIGNAL_TAG` regex and why it requires `contentLooksLikeJson`
- `FORBIDDEN_PATTERNS` exhaustive list (transcribe from source)
- `applyVoiceFilter` return shape (cleaned, strippedCount, issues)
- `liveStripInternalTags` behavior during streaming
- `filterPayload` deep-walk for structured format outputs
- The history: why generic stripper exists (tag-class bug from 2026-04-21 per the code comment)

### `gate-lifecycle.md`
Source: `src/lib/nexus/gateLifecycle.ts`, `src/lib/db/engagement.ts:recordGateApproval`, `src/app/api/engage/[engagementId]/turn/route.ts`

Must document:
- `PHASE_OPENERS` verbatim
- `applyGateSignal` input/output contract
- Phase transition sequence: `gate_approval` signal parsed → `recordGateApproval` advances `engagements.current_phase` + appends to `gates_passed` jsonb → `generateDeliverableForPhase` fires in background → opener turn appended + `phase_opener` SSE event emitted
- Audit log entries written
- Charter auto-generation on 0→1 transition (upsert `deliverable_types`, create `deliverables_v2` + `deliverable_versions`)
- How the engage route consumes `phaseOpenerFor` to populate the next phase

**Each doc:** ≤2 pages. Include a short "Why this contract matters" opening and a changelog stub at the bottom so future changes can be tracked.

**Verification:** Open each doc, cross-check every claim against current source. A reviewer should be able to reconstruct the runtime by reading only these three docs.

**Non-goals:** Don't modify the runtime. Don't add code examples that aren't from the actual source.

---

## Task D1 · Migration drift CI auth fix · 1-2h

**Branch:** `codex/migration-drift-ci-auth` off `main`

**Why:** Per Anand's memory (`migration_drift_check_status`), nightly drift check is warn-only because of GitHub-side auth issue. PR check works (uses PAT); nightly fails on `GITHUB_TOKEN` scope or OIDC.

**Scope:**

1. Read `.github/workflows/` — find the nightly drift workflow (likely `migration-drift.yml` or similar)
2. Read the workflow's `permissions:` block + its Supabase connection setup
3. Identify the auth failure — most common:
   - Missing `contents: read`
   - Missing `id-token: write` (if OIDC federation to Supabase / AWS)
   - `GITHUB_TOKEN` being used where a PAT with broader scope is needed (read failures, forked-repo context)
   - Secrets unavailable in scheduled workflow context
4. Fix the `permissions:` block OR swap `GITHUB_TOKEN` → a project-scoped secret (`SUPABASE_ACCESS_TOKEN` or similar — check if the repo has one stored)
5. Add a `workflow_dispatch` trigger so Anand can retrigger manually without waiting for nightly
6. Once green, remove the `continue-on-error: true` (warn-only flag) so drift actually blocks

**Verification:**
- Trigger manually: `gh workflow run <name>` — confirm exit 0
- Check the drift-detection step logs — confirm it successfully connects to the target Supabase project
- If possible: introduce a harmless pending migration locally, confirm the workflow now blocks the PR

**Non-goals:** Don't change the drift check logic itself. Don't move CI to a different CI provider. Only fix the auth.

**Coordination:** coordinate with Anand before flipping from warn-only to blocking — confirm there's no in-flight branch with deliberately-pending migrations that would get blocked.

---

## Task D2 · Scripts/ lint cleanup · 2-3h

**Branch:** `codex/scripts-lint-cleanup` off `main`

**Why:** `npm run lint` produces ~10k errors, overwhelmingly in `src/scripts/`. Many are false positives (`react-hooks/rules-of-hooks` on node helpers named `useX`). Blocks "lint clean" as a CI gate.

**Scope:** Prefer **Approach 1 (override)** as primary, **Approach 2 (targeted fixes)** as secondary.

**Approach 1: ESLint override for scripts/**
- In root `eslint.config.js` (or `.eslintrc.js`), add an override block:
```js
{
  files: ['src/scripts/**', 'scripts/**'],
  rules: {
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
```
- Comment the override block explaining why: "node scripts aren't React; the `use*` prefix is coincidental"

**Approach 2: Targeted fixes for remaining errors**
- After the override, re-run `npm run lint` — remaining errors should be <100
- Walk them, delete genuine dead vars, fix broken patterns
- Don't delete code that might be CLI-invoked (seed runners, migration helpers) — rename underscore-prefixed instead: `_unused` instead of `unused`

**Verification:**
- `npm run lint` reports <50 errors total across the codebase
- Add a new CI job `lint` in `.github/workflows/` that runs `npm run lint` and fails on errors (warnings still allowed)
- Confirm no legitimate code was deleted — diff-check critical seed/migration scripts

**Non-goals:** Don't touch lint rules for `src/` (product code). Don't modify `tsconfig.json`. Don't run `eslint --fix` wholesale (too risky).

---

## Task D3 · Programs types.ts split · 2-3h

**Branch:** `codex/programs-types-split` off `main`

**Why:** Per memory `project_programs_types_split`: `src/lib/programs/types.ts` coexists UI view-model types (Codex contracts) and DB row types. Post-demo cleanup to split them.

**Scope:**

1. Read `src/lib/programs/types.ts`
2. Categorize every exported type:
   - **UI view-model** (consumed by `src/app/(maestro)/programs/**/*.tsx` or `src/components/programs/*`) → goes to `types.ui.ts`
   - **DB row** (returned from Supabase queries, matches table schema) → goes to `types.db.ts`
3. Move types accordingly. Keep file naming consistent with memory.
4. For types where UI and DB overlap (e.g. a type used directly in a component that reads from the DB unfiltered), introduce a transformer:
   - Add to `src/lib/programs/transformers.ts` (new or existing per memory `project_programs_api_transformer_rule`)
   - `transformDbToUi(db: ProgramRowDb): ProgramViewModelUi`
5. Update every API route under `src/app/api/programs/*` to use the transformer at the response boundary (so routes return UI types, not DB types)
6. Update every import: replace `from '@/lib/programs/types'` with either `from '@/lib/programs/types.ui'` or `from '@/lib/programs/types.db'`
7. Delete old `types.ts` OR leave as a re-export shim with deprecation comment (prefer clean delete if <10 imports)

**Verification:**
- `npx tsc --noEmit` clean
- `npx next build` clean
- No behavior change — spot-check `/programs` and `/programs/[id]` routes render identically before/after
- If a type collision surfaces during the split (e.g. UI type named `Program` collides with DB type named `Program`), flag it — that's the coupling the split is meant to surface

**Non-goals:** Don't rewrite component logic. Don't change the API contract (response JSON shape must stay identical — transformer is the only new surface).

**Coordination:** if PR #31 or #32 merged new Programs types in `types.ts`, incorporate them into the split.

---

## Task E1 · CSS custom properties migration · 4-6h (split-friendly)

**Branch:** `codex/css-vars-migration` off `main` (or per-surface sub-branches)

**Why:** Per design-system spec §1.L6: "Tokens are named, never inlined hex." Reality: every component inlines `#2DD4C8`, `#F5F5F0`, etc. PR #30 added TypeScript constants (`MOTION`, `TRANSITIONS`, `FOCUS_RING`) as a bridge but colors/typography/spacing are still inlined.

**Scope (split into commits or sub-PRs):**

**Phase 1: foundations**
1. Create or extend `src/app/globals.css` with CSS custom properties mirroring `src/lib/design-system.ts:COLORS`:
```css
:root {
  --color-page-bg: #060A12;
  --color-card-bg: #0D1520;
  --color-surface-bg: #060A12;
  --color-border: #1C2D45;
  --color-border-hover: #2DD4C8;
  --color-teal: #2DD4C8;
  --color-teal-dim: rgba(45,212,200,0.12);
  --color-teal-border: rgba(45,212,200,0.25);
  --color-text-primary: #EFF6FF;
  --color-text-secondary: rgba(255,255,255,0.75);
  --color-text-muted: rgba(255,255,255,0.6);
  --color-text-disabled: #374151;
  --color-red: #EF4444;
  --color-amber: #F59E0B;
  --color-green: #34D399;
  --color-indigo: #818CF8;

  --font-sans: "DM Sans", -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  --font-serif: "Fraunces", Georgia, serif;
}
```

**Phase 2: per-surface migration (one commit each)**

Surface order by demo priority:
1. Nexus chat (`src/components/engagement/EngagementConsole.tsx`, `EngagementCreationConsole.tsx`)
2. Intelligence Ask (`src/components/intelligence/AskIntelligenceConsole.tsx`)
3. Intelligence Library/Foundation (`src/components/intelligence/IntelligenceConsole.tsx` + browse components)
4. Tower (`src/components/tower/*`)
5. Home (`src/components/home/*` + `src/app/(maestro)/home/page.tsx`)
6. Programs list + Engagements list
7. Platform shell (`src/components/AbarvaNav.tsx`)

**Per surface:** replace every inline hex with `var(--color-*)`. Use find-and-replace carefully — verify each replacement in context (e.g. `#2DD4C8` might appear in a gradient where the replacement looks wrong).

**Phase 3: retain TypeScript mirrors**
- Keep `COLORS` in `src/lib/design-system.ts` as-is for inline-style fallback callsites
- Don't remove the TypeScript constants — some components will still reference them

**Verification per commit:**
- Visual inspection in dev server — each migrated surface renders identically
- `grep -r "#2DD4C8\|#EFF6FF\|#060A12" src/` — counts should drop meaningfully per surface
- Build still clean

**Non-goals:** Don't change any behavior. Don't introduce light-mode tokens (spec §1.L1 defers post-demo). Don't refactor component structure while migrating.

**Coordination:** this is the big one. If running in parallel with E3, coordinate so E3 picks up the token names from E1's first commit.

---

## Task E2 · Teal palette reconciliation · **BLOCKED on Anand decision**

**Branch:** `codex/teal-reconciliation` off `main`

**⚠️ Do not start. Waiting on Anand to post in chat: either "Teal should be `#14B8A6`" (spec wins) or "Teal should be `#2DD4C8`" (codebase wins).**

**Context:** Spec `docs/specs/platform/design-system.md` §1.1 locks canonical teal at `#14B8A6`. Product code (`src/lib/design-system.ts:COLORS.teal`) uses `#2DD4C8`. Inline hex references to `#2DD4C8` are scattered across ~50+ files.

**Scope when unblocked:**

1. Acknowledge Anand's decision in the PR body
2. `grep -rE "#(14B8A6|2DD4C8)" src/ docs/` — enumerate every occurrence
3. Sweep the losing color to the winning one
4. Update `src/lib/design-system.ts:COLORS.teal` accordingly
5. Update any CSS vars from E1 if it landed first
6. Update spec `docs/specs/platform/design-system.md` §1.1 if codebase wins (otherwise spec is already right)

**Verification:**
- `grep -r "#2DD4C8"` (or `#14B8A6` depending on outcome) returns only the expected survivors (possibly zero)
- Visual inspection: every surface renders with consistent teal

**Non-goals:** Don't change other colors. Don't touch semantic tokens.

---

## Task E3 · `prefers-reduced-motion` rollout · 2-3h

**Branch:** `codex/reduced-motion-rollout` off `main`

**Why:** PR #30 introduced `src/hooks/useReducedMotion.ts` + `MOTION`/`TRANSITIONS` tokens, applied to Nexus chat, Intelligence Ask, Platform nav. Other surfaces still have uncoordinated motion.

**Scope:** Roll the pattern to remaining surfaces:

1. **Tower dashboard + sub-pages**
   - Files: `src/components/tower/*` (Atlas rail from PR #21, SignalList, CohortPeerVisualization, EvidenceChainCard)
   - Any animated panel transitions, any CSS transition on hover — guard with `reducedMotion`

2. **Home**
   - File: `src/app/(maestro)/home/page.tsx` + `src/components/home/*`
   - Activity feed entries, zero-metrics fade-in, card hover transitions

3. **Programs list**
   - File: `src/app/(maestro)/programs/page.tsx`
   - Card hover, phase indicator ticks on list view

4. **Deliverables detail**
   - Files: `src/components/engagement/DeliverableDetail*.tsx` (find via grep)
   - Content expand/collapse animations, tab transitions

5. **IntelligenceConsole** (the non-Ask one)
   - File: `src/components/intelligence/IntelligenceConsole.tsx`
   - Any stream-pulse cursors, panel transitions, card hovers

**Per surface pattern:**
1. `import { useReducedMotion } from '@/hooks/useReducedMotion';`
2. `import { TRANSITIONS, MOTION } from '@/lib/design-system';`
3. `const reducedMotion = useReducedMotion();`
4. Wrap existing transitions: `transition: reducedMotion ? undefined : TRANSITIONS.hover`
5. Wrap animations: `animation: reducedMotion ? undefined : 'pulseKeyframe 1.2s...'`

**Also add `@media (prefers-reduced-motion: reduce)` blocks in scoped CSS where pure-CSS animations exist:**
```css
@media (prefers-reduced-motion: reduce) {
  .some-class { transition: none !important; animation: none !important; }
}
```

**Don't invent motion where none exists** — only upgrade what's already animating.

**Verification:**
- Manually toggle `prefers-reduced-motion` in macOS Accessibility settings; every surface that had motion no longer animates (or clamps to `instant` 75ms)
- Visual inspection per surface — nothing broken
- Typecheck + build clean

**Non-goals:** Don't refactor the components beyond motion wrapping. Don't add new animations.

---

## Appendix · suggested execution order

If picking one at a time:

**Demo leverage first:** A1 → A2 → A3 → A4
**Test coverage next:** B1 → B2 → B3 → B4
**Documentation next:** C1 → C2
**Infrastructure next:** D1 → D2 → D3
**Design-system polish last:** E1 → E3 → E2 (after Anand's call)

**Parallelization opportunities:**
- A1 + A3 + A4 in parallel (disjoint seed files)
- B1 + B2 + B3 in parallel (disjoint spec files)
- C1 + C2 in parallel (different markdown)
- D2 + D3 in parallel
- E1 + E3 in parallel
- E2 waits for decision

**Overlap to resolve before starting (see task-level ⚠️ notes):**
- A3 vs PR #32 (contradiction engine)
- A4 vs PR #33 (wave2)
- A2 vs PR #26 (intelligence-layer-keystone)

---

*Updated 2026-04-21. Keep this in sync if tasks get rescoped.*

---

## Queued next · Industry Knowledge Layer v1 · Healthcare + Retail

Source file:
`/Users/anand/Library/Mobile Documents/com~apple~CloudDocs/Downloads/industry-knowledge-layer-v1-healthcare-retail.md`

Execution note:
- User requested this be treated as the next backlog item after the current in-flight backlog slice.
- Expect full execution path: implement, open PR, run full QA, and commit without waiting for additional permissions.
- Treat opinion passages flagged `[ANAND CURATE]` as content that may need careful handling during implementation, but do not leave the task idle waiting for permission unless a true blocker appears.
