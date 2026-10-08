# 2026-10-06-moves-ava-declared-archetype-framing — Moves aVa chat is framed by the Move's declared archetype

## Release ID

`2026-10-06-moves-ava-declared-archetype-framing`

## Status

`candidate`

## Plain-English Summary

When a user asks the in-product assistant a question inside a Move's phase workspace, the assistant
receives a deterministic grounding block built from that Move's live state: its title, its current
phase, how many hard gate criteria are met, which evidence is still needed, and what it is and is not
allowed to do. That block never said what **kind** of Move it was grounding.

Every Move archetype in the catalogue already declares the subject domain its assistant answers should
stay inside — and, just as importantly, the domains it must **not** demand evidence from. One archetype,
for example, explicitly states that it certifies a data foundation and therefore must not ask for
software-delivery or engineering-lifecycle evidence during discovery. Nothing in the product read that
declaration, so a Move whose archetype was formally declared still reached the model with no subject
framing at all, and could be steered by the generic wording of the question instead.

This change reads the declared archetype's framing and its key questions and puts them into the
grounding block, immediately after the Move's identity and before any gate, evidence or drafting
instruction.

Two properties are deliberate and are tested in both directions:

1. **Identity is declared, never inferred.** A Move that declares no archetype the catalogue knows gets
   **no** framing. There is no default, because the default archetype's subject domain is a wrong
   answer rather than a neutral one — substituting it would point the model at engineering-delivery
   evidence for a Move that is something else entirely. An undeclared Move is also not treated as a
   Move with a missing input, so it gains no new caveat.
2. **The framing is text only.** It cannot move the live gate tally, the allowed/disallowed action
   lists, the recorded missing inputs, the caveats, or any deterministic answer. The assistant is told
   more about the subject; it is told nothing new about the state.

## Layer Impact

- **Layer 4 (Products — Moves):** `global-control-lane`. The Moves phase-workspace assistant surface
  gains declared-archetype framing in the system-prompt grounding block it already builds. No other
  product surface changes.
- **Layer 3 (Canonical model):** unchanged. No schema, migration, read model, or stored value is
  touched; the archetype declaration is read, never written.

## Client Applicability

- All clients: no. The surface is reached only where the assistant-hardening flag is enrolled.
- Specific clients: the tenants already enrolled for `moves_ava_chat_hardening`. The change adds no
  enrolment and no new tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_ava_chat_hardening` (existing, `policy: tenant`, unchanged by this release).
  Within that flag, framing appears only for a Move that declares a catalogued archetype; an
  undeclared Move's prompt is byte-for-byte what it was before.

## Changes Included

- `src/lib/programs/ava-chat/archetype-framing.ts` (new): `resolveMovesAvaArchetypeFraming` — resolves
  a Move's DECLARED archetype through `resolveDeclaredProgramArchetypeId` and the registry bridge
  `archetypeForDeclaredId`, and returns its `agentGuidance` framing, or `null`. No default fallback.
- `src/lib/programs/ava-chat/types.ts`: new `MovesAvaArchetypeFraming`; new `archetypeFraming` field on
  the grounding packet.
- `src/lib/programs/ava-chat/packet.ts`: pass-through. Deliberately **not** an optional-input label, so
  an undeclared Move does not acquire a "missing input" caveat.
- `src/lib/programs/ava-chat/system-prompt.ts`: renders the archetype name/id, its framing, and its key
  questions, placed directly after the Move identity line. Absent entirely when unframed.
- `src/app/api/chat/agent/route.ts`: resolves the framing from the Move's declaration channels and hands
  it to the packet builder.
- `src/lib/programs/__tests__/moves-ava-archetype-framing.test.ts` (new, 24 cases).
- Regenerated `docs/architecture/test-ci-coverage-census.json` and
  `docs/security/tenancy-fence-coverage.json`.

This release reads a declaration the catalogue has always carried. It adds no gate, no refusal, and no
requirement; nothing that previously advanced can now be blocked.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/moves-ava-archetype-framing.test.ts` — 24/24.
- **PASS** `npx jest src/lib/programs/__tests__` — 119 suites / 1198 tests (the directory swept by the
  required AI-surface control-catalog job, so the new suite is CI-registered rather than dark).
- **PASS** `npx jest src/lib/programs/ava-chat/__tests__` — 7 suites / 57 tests, no regression in the
  packet/prompt suites this change edits.
- **PASS** Mutation testing, 8 mutations, **8/8 killed**: dropping the route's pass-through; resolving
  from the Move's wording instead of its declaration; falling back to the default archetype; handing
  back the catalogue's own key-question array instead of a copy; dropping the key-questions prompt line;
  dropping the framing text while keeping the name; never carrying the framing through the packet; and
  treating an undeclared archetype as a missing input.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on every changed path — exit 0.
- **PASS** Census contribution isolated by moving the new suite out and regenerating:
  `testFiles`/`coveredTestFiles`/`pullRequestCoveredTestFiles` each exactly **+1**, `uncoveredTestFiles`
  **unchanged at 164**. One further `testFiles` increment is inherited drift already present on the base
  and is not this change's.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Live signed-in walk. This release changes the text of a model prompt; proving the
  assistant's wording changed on screen for a declared Move needs a signed-in session, which is not
  this lane's authority. Flagged below.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow then builds and deploys in the normal
lane. No migration, no environment variable, no flag change, no worker job, and no traffic shift is
required or performed by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may build
  the shared web image or shift shared Product/Lab traffic.
- Shared runtime mutators: none in this change. No `az containerapp update`, no ad-hoc `az acr build`,
  no revision-weight change was or should be run for this release.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: to be proven by the standard post-deploy check (Container App template image
  = 100%-traffic revision image = approved digest). Not claimed here.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not used. `moves_ava_chat_hardening` enrolment is unchanged.
- Live signed-in proof required: yes, for the on-screen claim (see Known Gaps). The code-level claims
  above stand on the automated evidence listed in QA / Validation.

## Rollback Plan

Revert the squash commit. The change is additive and read-only: a new module, one optional packet
field, one conditional prompt block, and one resolver call. Reverting restores the previous prompt
exactly, because an unframed Move's grounding block is already byte-for-byte the pre-change block —
that equality is itself one of the tests. There is no migration to unwind, no stored value to repair,
and no flag to retire.

## Audit Evidence

- The pull request for this branch and its CI run.
- `src/lib/programs/__tests__/moves-ava-archetype-framing.test.ts` — in particular the cases asserting
  that an undeclared Move is framed by nothing, that the five coarse values the engagement
  archetype column can hold resolve no framing, that the framed and unframed prompts differ by exactly
  the three archetype lines, and that the deterministic answer is identical either way.
- The required AI-surface control-catalog job, which sweeps the directory holding the new suite.
- `docs/architecture/test-ci-coverage-census.json` for the +1 registration delta.

## Known Gaps

- **Needs a signed-in walk (Anand).** The automated evidence proves the framing is resolved, carried
  and rendered, and that it moves no deterministic value. It does not prove what the assistant then
  *says* differently on screen for a declared Move. That is a signed-in, in-app observation and is
  outside this lane's authority.
- **Only one archetype's declaration is exercised end to end.** The resolver is archetype-agnostic and
  every catalogued archetype declares framing, but the behavioural cases are written against the two
  the tests name. The others are covered structurally, not by wording review.
- **The framing text is the catalogue's own, not reviewed as client-facing copy.** This release moves
  existing declarations into the prompt verbatim; it does not rewrite them. Whether each archetype's
  framing says the right thing is a product-vocabulary call, and changing it is a one-file edit with
  nothing recorded against the words.
- **The engagement archetype column cannot carry a declaration today.** It is constrained to five
  coarse values, none of which names a catalogued archetype, so the live declaration channel is the
  charter classification the declaration job writes (and `functionPackKey`). The column is still read,
  so a future widening starts working without a change here; the tests pin the current behaviour in
  both directions so that widening cannot silently start resolving the wrong framing.
- **Out of scope:** the other declared-archetype facts that still have no product reader
  (`analysisMethods`, `applicableIndustries`, `applicableFunctions`, and the per-phase
  `gateRequirements`). `gateRequirements` in particular would *add* gate criteria, which is a product
  decision rather than a wiring gap, and is deliberately untouched here.
