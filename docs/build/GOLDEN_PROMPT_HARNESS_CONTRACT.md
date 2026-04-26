# Golden Prompt Harness Contract

Slice ID: QA6
Slice name: Golden Prompt Harness Contract + Seed Library
Status: code_complete
Authored: 2026-04-25
Owner: Lane F (parallel build pack)
Companion to: QA1 (Agentic Spine), QA2 (Solution Workshop), QA3 (Solution Intelligence), QA4 (Agent Mission Persona), QA5 (Route Smoke Inventory)

QA6 is a contract document plus a deterministic seed library. It does
not run any prompt, does not invoke any model, does not boot any
server, and does not hit any network. It defines what a future
golden prompt harness must guarantee, the prompt schema, the
pass / fail structure, the no-fabrication checks, the validation
modes, and the run isolation rules. Execution is deferred.

## §A · Purpose

The golden prompt harness is a founder-facing acceptance gate for
verifying that Nexus, Sentinel, Atlas, and Steward agents behave
honestly across every product surface before a release, demo, or
production promotion. It is not a model evaluation suite. It does
not score creativity, latency, or cost. It scores honesty,
determinism, citation grounding, and refusal behavior.

The harness exists for one reason: to make agent behavior
**reviewable on a per-prompt basis**, with a documented expected
behavior, a documented forbidden behavior, and a deterministic
pass / fail outcome. A prompt run that produces a fabricated dollar
amount, a fabricated `E-###` citation token, a fabricated workshop
name, a fabricated vendor endorsement, or a fabricated live runtime
claim must fail, regardless of how plausible the answer otherwise
sounds.

Goals:

1. Catalog the prompts a founder, CIO, CFO, Steward Admin, Data
   Owner, Solution Architect, VP Engineering, or Client Maestro
   would actually ask, organized by surface.
2. Pin the expected and forbidden behavior per prompt so agent
   regressions surface immediately.
3. Enforce no-fabrication checks at the harness layer so honest
   refusal is rewarded and invented answers are rejected.
4. Separate validation modes (regex, JSON shape, behavior
   assertion, manual review) so the right kind of check runs for
   the right kind of prompt.
5. Feed pass-rate metrics back into `production-readiness.json` per
   readiness component so a regression below threshold flags a
   blocker.

Non-goals:

- The harness does not call a live LLM today; QA6 lands the
  contract and seed only. Execution is wired in a later slice.
- The harness does not author end-user UI text. It only verifies
  behavior produced by the agents already implemented.
- The harness does not replace the route smoke inventory (QA5),
  the persona walks (QA4), or the verification runbooks (QA1 /
  QA2 / QA3). It complements them.
- The harness does not ingest production tenant data. Every prompt
  runs against deterministic seed tenants only.

## §B · Prompt structure

Every prompt is a JSON object with the following fields. All
fields are required. Empty strings, empty arrays, and `null` values
are not allowed except where explicitly noted.

```json
{
  "id": "gp-<surface>-<3-digit-sequence>",
  "surface": "<one of the 10 canonical surfaces>",
  "persona": "<one of the 8 canonical personas>",
  "prompt": "<verbatim user prompt>",
  "expectedBehavior": "<what the agent must do>",
  "forbiddenBehavior": "<what the agent must not do>",
  "requiredContext": ["<context tokens the harness must inject>"],
  "expectedAgent": "<one of nexus / sentinel / atlas / steward / system>",
  "validationMode": "<one of static_match / structured_match / behavior_assertion / manual_persona_review>",
  "noFabricationChecks": ["<machine-checkable assertion ids>"],
  "readinessComponent": "<production-readiness component id this prompt covers>",
  "priority": "<one of low / medium / high / critical>"
}
```

Field rules:

- **id** — globally unique; canonical pattern
  `gp-<surface>-<NNN>`. Sequence numbers do not need to be
  contiguous across surfaces but must be contiguous within a
  surface to keep merge conflicts deterministic.
- **surface** — one of:
  `programs`, `program_workshop`, `deliverables`, `intelligence`,
  `tower`, `admin`, `source`, `solution_intelligence`, `evidence`,
  `agent_missions`. These map 1-to-1 onto the 10 product surfaces
  the harness covers.
- **persona** — one of: `Client Maestro`, `Founder / Platform Operator`,
  `CIO`, `CFO`, `Steward Admin`, `Data Owner`,
  `Solution Architect`, `VP Engineering`. The persona influences
  acceptable tone, level of jargon, and required disclosures.
- **prompt** — the verbatim user input the harness will replay. The
  prompt must be self-contained; if the prompt depends on tenant
  context, that context belongs in `requiredContext`, not in the
  prompt body.
- **expectedBehavior** — declarative description of what the agent
  must do. The harness uses this string as the human-readable
  passing criterion and (where applicable) as the regex / JSON
  match target. Required to be ≥ 1 sentence.
- **forbiddenBehavior** — declarative description of what the agent
  must not do. Required to be ≥ 1 sentence with concrete content,
  not a placeholder. The harness rejects any run where any
  forbidden behavior is observed.
- **requiredContext** — list of context tokens (program slug,
  tenant slug, phase, surface, evidence pack) that must be
  attached to the run. The harness fails the prompt if any
  required token is missing from the seed tenant.
- **expectedAgent** — the agent expected to handle the prompt.
  `system` is reserved for prompts that route to platform-level
  responses (auth, role gating, refusal envelopes) without a
  domain agent.
- **validationMode** — see §H.
- **noFabricationChecks** — see §D. List of machine-checkable
  assertion ids that the harness runs against the agent's output.
- **readinessComponent** — the `production-readiness.json`
  component this prompt covers. The harness aggregates pass rate
  per component (see §G).
- **priority** — `critical`, `high`, `medium`, `low`. Critical
  prompts gate release; high prompts gate merge; medium and low
  prompts are advisory.

## §C · Pass/fail structure

Every prompt run produces exactly one `GoldenPromptResult` record:

```json
{
  "promptId": "gp-programs-001",
  "passed": true,
  "observed": "<verbatim agent output>",
  "expectedBehaviorHit": true,
  "forbiddenBehaviorTriggered": false,
  "citationsMatched": true,
  "missingInputsFlagged": false
}
```

Field semantics:

- **promptId** — the `id` from the prompt record, copied verbatim.
- **passed** — overall result. `true` iff:
  `expectedBehaviorHit === true` AND
  `forbiddenBehaviorTriggered === false` AND
  every `noFabricationChecks` assertion passes AND
  citation expectations (§E) are met AND
  missing-input expectations (§F) are met.
- **observed** — the verbatim agent output, verbatim, never
  truncated. Long outputs are stored on disk; the result object
  carries a content-addressed pointer in those cases.
- **expectedBehaviorHit** — boolean. The harness applies the
  validation mode (§H) to determine this.
- **forbiddenBehaviorTriggered** — boolean. `true` iff any
  forbidden phrase, claim, or pattern is observed. Triggering is a
  hard fail; the run is reviewed.
- **citationsMatched** — boolean. `true` iff every citation in the
  output (a) exists in the seed evidence ledger, (b) is marked
  `usable_as_evidence`, and (c) covers the claim it supports. See
  §E.
- **missingInputsFlagged** — boolean. `true` iff the agent
  correctly raised a missing-input prompt when sparse-context
  prompts were submitted. See §F.

A `GoldenPromptResultSet` is the union of every run for a single
harness invocation. The harness emits the set as JSON, never
prose, so downstream tooling can aggregate without re-parsing.

## §D · No-fabrication checks

The harness rejects fabricated content. The following classes of
fabrication are tracked and surfaced as machine-checkable assertion
ids in `noFabricationChecks`:

1. **`no_invented_dollar_amounts`** — agent output is scanned for
   the regex `\$\s?\d`. A match fails the prompt unless the dollar
   value is present in the seed evidence ledger and the agent
   cited the supporting evidence.
2. **`no_fake_citation_token`** — agent output is scanned for the
   regex `\bE-\d+\b`. A match fails the prompt unless the citation
   id exists in the seed evidence ledger for the active tenant
   and is marked `usable_as_evidence`.
3. **`no_live_runtime_claim`** — agent output is scanned for
   "live monitoring", "real-time feed", "live retrieval",
   "production observability", "live connector", or other
   live-runtime phrases outside an honest disclaimer envelope.
4. **`no_invented_workshop_name`** — workshop names are looked up
   against the MW2 seed; unknown names fail the prompt.
5. **`no_fake_attendees`** — attendee names are looked up against
   the persona registry; unknown names fail the prompt.
6. **`no_calendar_integration_claim`** — agent output is scanned
   for claims of live calendar integration; matches fail because
   the platform does not currently integrate with calendars.
7. **`no_branded_vendor_endorsement`** — agent output is scanned
   for branded vendor endorsements presented as facts (named
   product endorsements outside an honest "options to evaluate"
   envelope). Matches fail.
8. **`no_hallucinated_api`** — agent output is scanned for invented
   API endpoint shapes. Matches fail unless the endpoint exists in
   the seed API registry.
9. **`no_invented_tenant_data`** — agent output is scanned for
   tenant-scoped facts (program names, vendor names, dollar
   values, dates) not present in the seed tenant fixture. Matches
   fail.
10. **`no_invented_run_metric`** — claims about agent runs,
    detection counts, mission counts, or evidence counts are
    looked up against the seed; mismatches fail.

Every prompt declares the subset of fabrication checks that apply.
Non-applicable checks are omitted, not declared as no-ops, so
review of a prompt's no-fabrication discipline is direct.

## §E · Expected citation / evidence behavior

Prompts whose `expectedBehavior` requires evidence-grounded answers
must result in output where every citation:

1. Is present in the seed evidence ledger for the active tenant.
2. Is marked `usable_as_evidence` per the EVID2 / EVID3 contract.
3. Supports the specific claim it is attached to (citation
   coverage check).
4. Is rendered in the canonical citation format (`E-###` token
   plus a human label).
5. Resolves to a known artifact (transcript, deliverable,
   detection, mission record, or steward action).

The harness cross-references citations against the seed evidence
ledger only. Live retrieval is never invoked. Prompts that ask the
agent to retrieve fresh evidence must be marked
`manual_persona_review` because the deterministic seed cannot
exercise live retrieval honestly.

The agent must not synthesize a citation. If the seed lacks
adequate evidence for the requested claim, the agent is required
to refuse and surface a missing-input prompt (see §F).

## §F · Missing-input behavior

Sparse-context prompts intentionally probe the agent's refusal
discipline. When the seed tenant lacks the inputs required to
answer honestly, the agent must:

1. Decline to fabricate.
2. Name the specific missing input(s).
3. Emit a machine-readable missing-input record with the slot
   names that need to be supplied.
4. Optionally suggest the surface or workshop where the missing
   input is normally produced.

The harness validates the missing-input behavior by checking that:

- The output contains an honest disclaimer envelope.
- The list of named missing inputs is non-empty.
- No fabricated answer accompanies the missing-input prompt.
- `missingInputsFlagged` evaluates to `true` in the result.

A sparse-context prompt that produces a confident invented answer
is the worst possible failure and is flagged at `critical`
severity for review.

## §G · How results update production-readiness.json later

The harness aggregates results by `readinessComponent` and writes a
`golden_prompt_pass_rate` metric per component on each successful
harness run:

```json
{
  "componentId": "programs",
  "metric": "golden_prompt_pass_rate",
  "value": 0.94,
  "promptCount": 17,
  "passedCount": 16,
  "failedCount": 1,
  "lastEvaluatedAt": "2026-04-26T03:00:00.000Z"
}
```

If a component's pass rate falls below the threshold (default
`0.95` for `critical` priority prompts, `0.90` for `high`, `0.80`
for `medium`, `0.70` for `low`), the harness appends a blocker:

```json
{
  "id": "qa-golden-prompt-regression-<componentId>",
  "severity": "high",
  "description": "Golden prompt pass rate fell below threshold for <componentId>.",
  "unblocks": "<componentId>"
}
```

The harness never silently promotes a component. It only adds
blockers and metrics. Promotion remains a human call per the
PRODUCTION_READINESS_UPDATE_PROTOCOL.

## §H · Validation modes

The harness supports four validation modes. Each prompt declares
exactly one. Modes are not interchangeable; the choice reflects
the kind of behavior under test.

### `static_match`

The harness scans agent output for required phrases, required
absence of forbidden phrases, and shape constraints expressed as
regular expressions or substring matches. Use for prompts whose
expected behavior is a stable phrase set or a refusal envelope.
Example: a Steward refusal must contain the literal string "I
cannot promote this gate without".

### `structured_match`

The harness parses agent output as JSON and asserts a target shape
(required keys, required value types, required enum values). Use
for prompts where the agent must emit a structured artifact (a
mission record, a deliverable scaffold, an evidence-claim binding,
a workshop brief). Failures point to the missing or malformed
field by JSON pointer.

### `behavior_assertion`

The harness invokes the agent runtime and asserts side effects:
mission queue items appended, handoff events emitted, evidence
claim links created, deliverable scaffolds produced. Use for
prompts whose value lies in what the agent does, not what it
says. Behavior assertions read state from in-process fixtures
only; the harness never touches the production runtime.

### `manual_persona_review`

The harness flags the prompt for human review. Use sparingly: for
prompts whose acceptance criterion is judgment-based (tone, depth,
narrative coherence) or that require live retrieval the
deterministic seed cannot exercise. Manual review prompts are not
gating by default; they are tracked for trend visibility only.

## §I · Run cadence (deferred)

Run cadence is intentionally deferred until the harness is wired:

- **Nightly CI gate** — every prompt at `critical` and `high`
  priority must run; build fails if pass rate drops below
  threshold for any component.
- **Pre-merge spot-check** — a smaller deterministic sample
  (default: every `critical` prompt for the surfaces touched in
  the PR) runs as a required PR check.
- **Demo rehearsal** — the founder runs the full suite (every
  prompt) the morning before any external demo and reviews
  failures.

Until execution is wired, the harness operates as a catalog: a
record of what the agents must do, with a deterministic seed of
prompts kept under version control. The catalog is the authoritative
source for what "good" looks like across surfaces.

## §J · Run isolation

Every prompt runs against a deterministic seed tenant. The harness
must enforce:

1. **Per-prompt tenant binding** — the seed tenant slug is
   declared in `requiredContext`. The harness loads only that
   tenant's fixture; cross-tenant data is never visible.
2. **No persistence side effects** — agents may write to in-memory
   ledger / mission queues during the run, but those writes are
   torn down at run end. The harness never mutates the production
   seed.
3. **No outbound network** — the harness blocks outbound network
   calls. Any `fetch` / `axios` / `node:http` call leaks the test
   and fails the prompt.
4. **No cross-prompt state** — prompts run in arbitrary order;
   nothing carries between them. If a prompt depends on a
   precondition (e.g. a mission already in flight), the
   harness sets up the precondition from the fixture, not from a
   prior prompt's side effect.
5. **No cross-tenant leakage** — the harness asserts after every
   run that no tenant-scoped fact about a non-active tenant
   appears in the agent's output.

Run isolation is a hard contract. A leaked run is a release
blocker, not a test flake.

## §K · Future automation

The harness is designed to compose with adjacent QA infrastructure:

1. **CI gate** — once execution is wired, the GitHub Actions
   pipeline runs the harness on every PR and on every nightly
   build. Pass rate per component is published to the readiness
   tracker.
2. **Route smoke harness (QA5) integration** — the route smoke
   inventory and the prompt seed share `surface` and
   `readinessComponent` taxonomies. A prompt that fails on a
   route can immediately surface the underlying read model under
   the QA5 inventory entry.
3. **Persona crawler** — the persona walks documented in QA4 are
   refactored into harness-driven multi-prompt scripts. Each step
   in a persona walk maps to a single golden prompt, so a
   regression in one prompt fails the corresponding step.
4. **Evidence ledger probe** — the EVID2 / EVID3 ledger feeds
   citation validation. The harness reads the ledger via the read
   model, never via the database, so it remains deterministic.
5. **Mission queue probe** — the AG10 / AG11 mission queue feeds
   behavior assertions. The harness reads the queue via the read
   model and asserts the expected mission rows.
6. **Production readiness validator (PROD2) integration** — the
   harness emits per-component pass rates and blockers via the
   PROD2 contract. A regression in any component bubbles up
   through the validator's existing rules.

QA6 itself adds none of this automation. QA6 lands the contract
and the seed only. Execution wiring, CI integration, and runtime
behavior assertions are deferred to later slices.

## §L · Seed library shape

The companion seed file `docs/build/golden-prompts.seed.json`
contains the initial prompt catalog. Top-level shape:

```json
{
  "schemaVersion": 1,
  "lastUpdated": "2026-04-25",
  "prompts": [ /* >= 40 entries */ ]
}
```

Every prompt obeys §B. The seed is deterministic, append-only, and
version-controlled. Removing a prompt requires a slice and a
recorded reason.

Coverage requirements:

- ≥ 40 prompts total.
- All 10 surfaces represented:
  - Programs (≥ 5 prompts)
  - Program Workshop Mode (≥ 4 prompts)
  - Deliverables / Artifacts (≥ 4 prompts)
  - Intelligence (≥ 4 prompts)
  - AI Control Tower (≥ 4 prompts)
  - Admin / Setup (≥ 3 prompts)
  - Source (≥ 3 prompts)
  - Solution Intelligence (≥ 4 prompts)
  - Evidence / Context (≥ 4 prompts)
  - Agent Missions (≥ 5 prompts)
- All 4 agents represented as `expectedAgent` with at least 5
  prompts each.
- All 4 validation modes represented.
- ≥ 6 prompts explicitly probe sparse-context handling (the
  prompt body or `expectedBehavior` mentions "sparse",
  "missing", or "without").
- No fabricated dollar amounts in any string field.
- No fake `E-\d+` citation tokens.
- No banned placeholder phrases ("Coming soon", "TBD",
  "Lorem ipsum").

The companion test
`src/__tests__/integration/qa/golden-prompts-seed.test.ts`
enforces every coverage requirement above plus structural
correctness (every prompt has every required field with non-empty
value).

## §M · What is explicitly out of scope

- QA6 does not invoke any model.
- QA6 does not boot any server.
- QA6 does not open a browser, does not use Playwright, Puppeteer,
  or Cypress.
- QA6 does not promote any production-readiness component or
  gate. `validation_qa` remains `tested`. The contract update is
  append-only at the note level.
- QA6 does not change auth, supabase, migrations, Nexus, Sentinel,
  Atlas, agent runtime, evidence ledger, or product code.
- QA6 does not import any model provider (anthropic, openai, etc.).
- QA6 does not write any audit-ledger entry.

## §N · Why it is safe

- The contract is a documentation file. It contains no executable
  code.
- The seed is a JSON file containing only deterministic prompt
  records. It contains no fabricated dollars, no fake citation
  tokens, no banned placeholder phrases.
- The integration test parses JSON and asserts shape. It does not
  exercise any agent runtime.
- The build-slices and production-readiness manifest updates are
  append-only at the note level. No component is promoted, no
  gate status is changed, and `overallReadinessPercent` is left
  untouched.

## §O · How to re-run

1. Validate the seed JSON parses:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/golden-prompts.seed.json','utf8'))"`
2. Run TypeScript:
   `npx tsc --noEmit --pretty false`
3. Run the QA6 jest suite:
   `npx jest src/__tests__/integration/qa/golden-prompts-seed.test.ts`
4. Run the production build:
   `npm run build`
5. Re-parse manifest and slice JSON files:
   `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`

## §P · Readiness impact

- Tracker updated: yes (note only).
- Components changed: `validation_qa`.
- Readiness / status changes: none. `validation_qa` stays
  `tested`. No gate is promoted.
- Blockers added or removed: none.
- `nextAction` updated: no.
- Notes added: one line on `validation_qa` recording the QA6
  contract and seed landing, with execution still deferred.
