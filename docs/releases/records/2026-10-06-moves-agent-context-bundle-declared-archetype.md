# 2026-10-06-moves-agent-context-bundle-declared-archetype — The agent context bundle reads the archetype a Move declared

## Release ID

`2026-10-06-moves-agent-context-bundle-declared-archetype`

## Status

`candidate`

## Plain-English Summary

Before an agent reasons about a Move, it is handed a context bundle: which kind of
work this Move is, what evidence that kind of work requires, what is already
committed, and what is still missing. That bundle resolved "which kind of work"
in a way that **could not see a declaration**, so for a Move whose kind had been
explicitly declared it described a different kind of work entirely.

Three separate reasons, all in one place:

- It read the Move's coarse archetype column. A database constraint limits that
  column to five broad values, none of which names a specific kind of work, so
  the exact-match path never fired for a stored Move.
- It read the charter's classification as if it were a line of text. The
  classification is an object, and the declared identity sits on a field inside
  it. The resolver keeps only text, so the object was dropped whole — the
  declaration contributed nothing, not even as a hint.
- It never passed the declared-identity argument the resolver accepts.

What was left was a keyword guess over the Move's name, which fell through to a
back-compat default. That resolved kind of work is then what the readiness report
is asked for, so the bundle's required-evidence list, its outstanding gaps, its
risk dimensions, and its "what should be diagnosed next" answer all described the
wrong kind of work — confidently, and in a shape that renders perfectly.

The fix is to stop resolving here at all and call the canonical per-Move resolver,
which reads the declaration and whose inference input is strictly wider. That
resolver is the one **every other** caller of the readiness report already pairs
with; this bundle was the single call site resolving its own.

Two smaller consequences of the same edit: the Move-name read and the archetype
read are now caught separately, so a failed name read no longer also costs the
archetype; and the type cast that misdescribed the classification as a string is
gone.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

- **Layer 3 (canonical model) → Layer 4 (products):** no stored data changes. A
  declared identity already present on the record now reaches the agent context
  projection that was ignoring it. Nothing new is written.
- **Governed agent context:** the bundle is the object an agent must receive
  before reasoning about a Move, so this is a correctness fix on governed context
  assembly, not a display change.

## Client Applicability

- All clients: yes — the resolver change is unconditional and applies to every
  tenant's Moves.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is flag-less and backward-compatible: a Move
  that declares nothing resolves exactly as it did, through inference, now over a
  wider input.

## Changes Included

- `src/lib/programs/archetype-context-bundle.ts` — `buildArchetypeContextBundle`
  resolves through `resolveMoveArchetypeForProgram` instead of an inline
  `resolveProgramArchetype` call; the two record reads are caught separately; the
  reason the old inline resolution could not see a declaration is documented at
  the call site.
- `src/lib/programs/__tests__/archetype-context-bundle-resolution.test.ts` — new
  suite, in a CI-wired directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated: `testFiles`
  and `coveredTestFiles` each +1, `uncoveredTestFiles` unchanged, which is the
  proof the new suite is swept by CI rather than dark.

No migration, no route, no script, no flag.

## QA / Validation

- **PASS** — new suite: `npx jest src/lib/programs/__tests__/archetype-context-bundle-resolution.test.ts`
  → 1 suite, 6 tests.
- **PASS** — baseline fails in the right direction: with the source change
  reverted and the new suite kept, 4 of 6 tests fail. The 2 that stay green are
  the negative guards, which must hold both before and after.
- **PASS** — mutation testing, 5 mutations, 5 killed:
  1. merge the two record reads back into one `try` → 1 failure;
  2. resolve the archetype but discard the result → 4 failures;
  3. resolve for a different record id → 4 failures;
  4. ask the readiness report for the default instead of the resolved archetype
     → 1 failure;
  5. report the default archetype id on the bundle → 3 failures.
- **PASS** — regression: `npx jest src/lib/programs/__tests__ src/lib/programs/archetypes/__tests__`
  → 126 suites, 1289 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  → exit 0.
- **PASS** — `npx eslint` on both changed source files → 0 errors, 0 warnings.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — live signed-in walk. This change is on a server-side context
  assembly path reached through a governed API route; it cannot be proven from a
  development box against the private data plane. Not claimed live-proven.

## Rollout Plan

Merge to `main` by squash merge. The repo-owned Azure Container Apps main deploy
workflow builds and deploys the image. No migration, no flag flip, no environment
variable change, no worker job. The behaviour is active as soon as the new
revision takes traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path permitted to shift shared Product/Lab web traffic.
- Shared runtime mutators: none in this change. No `az containerapp` command, no
  ad-hoc `az acr build`, no traffic or revision-weight write.
- Approved image digest: assigned by the main deploy workflow on merge; not
  pinned by this record.
- ACA runtime invariant: to be proven after deploy — Container App template
  image, the 100%-traffic revision image, and required worker job images all
  matching the approved digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable — no flag, no environment
  variable.
- Live signed-in proof required: yes, before this record may be marked
  `live-proven`. Not claimed here.

## Rollback Plan

Revert the squash commit and redeploy through the main deploy workflow, or shift
traffic back to the prior healthy revision by digest. No migration to unwind and
no written state to repair: the change only alters which archetype is resolved
for a read, so reverting restores the previous resolution exactly. The new test
file is additive and reverts with the commit.

## Known Gaps

- The governed API route that builds this bundle has **no caller inside this
  repository** today. The fix corrects the governed context contract an
  integrator or agent receives from that route; it does not by itself change a
  rendered screen. It is grouped with the archetype-threading work because it is
  the same defect class and the last remaining instance of it on this path.
- The surrounding keyword-inference ladder is unchanged. A Move that declares
  nothing is still classified by keyword, with the same rules and the same
  back-compat default; only the input it guesses over is now wider.
- The sibling resolver in the phase-intelligence panel binds a **function-pack**
  identity, a different id space from the archetype, and is untouched here. Its
  fallback still keyword-matches a blended text blob; whether that misreads a
  Move whose archetype is declared but whose function pack is not was not
  measured in this change and remains open.
- One other reader of the coarse archetype column was reviewed and left alone
  deliberately: it formats the column for display, which is what the column is
  for.

## Audit Evidence

- PR URL: recorded on the pull request opened from this branch.
- CI run: the pull request's check run, including the census drift gate and
  `release:check`.
- Local validation: the commands and counts under **QA / Validation** above.
- Mutation evidence: the five mutations and their failure counts above, each run
  against the new suite with the working tree staged beforehand and restored
  after.
