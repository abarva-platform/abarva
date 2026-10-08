# u598 — The hygiene gate's typecheck gets the heap the build gets

## Release ID

`2026-10-08-hygiene-gate-typecheck-heap`

## Status

`candidate`

## Plain-English Summary

The repository hygiene gate runs a TypeScript check and then a build, in the
same CI job on the same runner. The build was given an 8192 MB Node heap; the
typecheck was given 6144 MB. The project's type graph has grown past the lower
number, so the typecheck began dying with `exit 134` and
`FATAL ERROR: Ineffective mark-compacts near heap limit` at roughly 6.12 GB
against that 6144 ceiling.

Because the failure sat so close to the limit, it depended on garbage-collection
timing: it failed intermittently, which is why the first responses to it were
re-runs rather than a change. That is no longer the right reading. The step has
now failed this way four times, twice simultaneously on two different pull
requests, and on one of them it failed **again on the re-run** — so a re-run no
longer clears it and the gate is a lane blocker rather than a flake.

The two heap numbers live in the same script and run in the same job, so the
lower one was an asymmetry rather than a considered budget. This raises the
typecheck to the build's 8192 MB and adds a test holding it at or above the
build's heap, so the asymmetry cannot return silently.

The failure itself was reported honestly: the gate judges the typecheck by exit
status precisely because an out-of-memory crash emits no diagnostics at all, so
this was a real red and not a false one. The heap is what stops the crash.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

No product layer changes. Layer 1 (Client Intake), Layer 2 (Source Adapters),
Layer 3 (Canonical Model) and Layer 4 (Products) are untouched: no schema,
adapter, intake, route, read-model or component change. The change is confined
to a CI script's resource setting and the test that guards it.

## Client Applicability

- All clients: not applicable — no runtime or product behaviour changes.
- Specific clients: none.
- Internal only: yes. Repository CI gating only.
- Public/demo only: no.
- Feature flag: none. The change ships no runtime behaviour to gate.

## Changes Included

- `scripts/integration/hygiene_gate.sh` — the TypeScript section's default
  `--max-old-space-size` goes from 6144 to 8192, matching the build section
  below it. The existing override behaviour is unchanged: an inherited
  `NODE_OPTIONS` that already names a heap still wins, so this only moves the
  default. The section comment records the measurement and why the two numbers
  are now equal.
- `src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts` — one new case
  asserting the typecheck's heap is at least the build's. The pre-existing case
  only asserts that a heap option is *present*, so it stayed green through the
  regression this guards against.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts`
  → 31 of 31 pass.
- **PASS** — `npx jest src/__tests__/behaviors/hygiene-gate` (every hygiene-gate
  behaviour suite).
- **PASS** — mutation testing: reverting the typecheck heap to 6144 fails
  **exactly one** case, the new one. The pre-existing presence assertion stays
  green through that mutation, which is the hole the new case closes. The new
  case asserts both heap values were actually found before comparing them, so a
  missed match cannot read as a pass — the `case` guards above each assignment
  mention the flag without a value, so the value pattern deliberately matches
  the assignment shape only.
- **PASS** — `bash -n scripts/integration/hygiene_gate.sh` (shell syntax).
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.
- **PASS** — `npx eslint` on the changed test.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **Measurement supporting the change** — four observed failures, all the same
  signature (`exit 134`, `Ineffective mark-compacts near heap limit`, peak
  6.11–6.13 GB against the 6144 ceiling). On one pull request the re-run failed
  the same way, which is what distinguishes this from the earlier intermittent
  reading. On the same commits the separately required typecheck job was green,
  so this is a heap ceiling and not a type error.
- **NOT RUN** — no signed-in walk. The change ships no runtime behaviour, so
  there is nothing on a live surface for a walk to observe.
- **NOT RUN** — no measurement of the new ceiling's own headroom under CI. The
  evidence is that 6144 is insufficient and that 8192 is already proven
  sufficient for the heavier build step in the same job; it is not a claim that
  8192 is the long-term number. See Known Gaps.

## Rollout Plan

Merge to `main` via squash. There is no runtime rollout: no image build, no
Azure Container Apps deploy, no migration, no flag change. The gate uses the new
default on its next run.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — this change does not deploy.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision change, no web or worker template change.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected — no runtime image or template is touched.
  The heap setting applies to a CI job, not to any deployed container.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. No client-visible surface changes.

## Rollback Plan

Revert the squash commit. Two files and no state: the script returns to the
6144 default and the guard case is removed. No migration, no data and no
deployed artifact is involved. Note that reverting restores the failing
condition, so the revert is only safe alongside another remedy for the heap.

## Audit Evidence

- The pull request for this record and its CI run, where the hygiene gate's
  TypeScript section runs at the raised heap.
- The four failing runs' logs, each showing `exit 134` with
  `FATAL ERROR: Ineffective mark-compacts near heap limit` and a peak heap of
  6.11–6.13 GB against 6144 — including the re-run that failed identically.
- `src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts` — the guard holding
  the typecheck heap at or above the build's.

## Known Gaps

- This raises a ceiling; it does not reduce what the typecheck needs. The type
  graph that outgrew 6144 will eventually approach 8192, and the runner's own
  memory bounds how far this can be repeated. Reducing the typecheck's peak
  (project references, narrower `include`, splitting the graph) is the durable
  fix and is out of scope here.
- The guard ties the typecheck's heap to the build's. If the build's heap is ever
  lowered, the guard follows it down rather than holding an absolute floor. That
  is deliberate — the two should not diverge again — but it means the guard
  expresses parity, not sufficiency.
- No headroom measurement was taken for the new ceiling under CI; see QA.

## Related

Unblocks the hygiene gate on in-flight Moves pull requests that were held red by
this ceiling. Those changes are unrelated to it in substance.
