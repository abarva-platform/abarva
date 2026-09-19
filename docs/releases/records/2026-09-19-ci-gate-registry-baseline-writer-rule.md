# 2026-09-19-ci-gate-registry-baseline-writer-rule — CI gate registry refuses a baseline writer that is also a gate

## Release ID

`2026-09-19-ci-gate-registry-baseline-writer-rule`

## Status

`candidate`

## Plain-English Summary

Some npm entries in this repository do not check anything — they rewrite the file a
different check measures against.

`audit:control-plane-purity:baseline` is one. It runs
`scripts/audit/control-plane-tenant-purity.mjs --baseline`, which writes
`scripts/audit/control-plane-tenant-purity.baseline.json`. Its sibling
`audit:control-plane-purity:check` reads that same file and fails when a tenant's count
*exceeds* the recorded number. So running the writer after adding debt makes the check
pass — not by paying the debt down, but by moving the number the check compares to. From
the outside a passing check looks identical either way, which is the whole problem.

Until now the registry had nothing to say about that. The writer sat `unclassified`, and
nothing would have objected if someone had classified it `pr-gate` or added it to a
workflow.

Two things changed:

1. `audit:control-plane-purity:baseline` is now classified `operator`, with the reason
   stated as the class reason rather than as a fact about this one entry.
2. `scripts/audit/ci-gate-registry-check.mjs` now enforces the class. An entry whose npm
   command passes a write flag (`--baseline`, `--update`, `--write`, `--refresh`) may not
   be classified `pr-gate`, may not be reached from any workflow, and may not be left
   `unclassified`.

The rule tests the **command**, not the script body. Referencing a baseline path is not
enough to qualify, because the `:check` gates reference it too — and they are the things
being protected. Only invoking a write counts.

### Scope of the class, measured rather than assumed

The backlog item behind this assumed there were several `:baseline` writers among the 184
unclassified entries. There are not. Across every `audit:` / `validate:` / `check:` npm
entry, exactly two invoke a write flag:

| entry | kind before | kind after | invoked by a workflow |
|---|---|---|---|
| `audit:control-plane-purity:baseline` | `unclassified` | `operator` | no |
| `audit:test-ci-coverage:write` | `operator` | `operator` (unchanged) | no |

Neither is a `pr-gate` and neither runs in CI, so the registry state was already correct
in fact — it just was not enforced, and one of the two was not classified. The durable
part of this change is therefore the rule, not the reclassification: the rule is what
catches the third writer, whenever someone adds it.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI control plane** — the only layer touched. The registry gate gains one
  rule and one entry gains a classification.
- **No product layer is affected.** Nothing here is reachable from a Next.js route, a
  product projection, a tenant adapter, or the canonical model. No schema, no migration,
  no runtime code, no image, no deploy.

## Client Applicability

No client receives this change. It is repository tooling only.

- All clients: no
- Specific clients: none
- Internal only: yes — repository CI and the agents/operators who run it
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `docs/architecture/ci-gate-registry.json` | `audit:control-plane-purity:baseline` reclassified `unclassified` → `operator`, with the class reason |
| `scripts/audit/ci-gate-registry-check.mjs` | adds `WRITE_FLAG` / `isBaselineWriter` and three problems the rule raises |
| `src/__tests__/behaviors/ci-gate-registry-invoked-predicate.test.ts` | adds a describe block of 5 cases (3 positive, 2 negative) |
| `docs/releases/records/2026-09-19-ci-gate-registry-baseline-writer-rule.md` | this record |

Commit: `b04d02e40`. No migrations, no routes, no workflow changes.

## QA / Validation

**Status: pass.** Run in the working tree at `HEAD`.

| check | result |
|---|---|
| `npm run audit:ci-gate-registry` | **pass** — exit 0, 212 scripts |
| `npx jest --runTestsByPath src/__tests__/behaviors/ci-gate-registry-invoked-predicate.test.ts` | **pass** — 16/16 (was 11; 5 added) |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both changed code files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | **pass** — exit 0 |

### Mutation results — the rule

Each mutation was applied to a clean tree, the registry check run, and the tree restored.

| mutation | expected | observed |
|---|---|---|
| writer reclassified `pr-gate` | caught | exit 1 — "passes a write flag … it cannot be a pr-gate" |
| writer left `unclassified` | caught | exit 1 — "passes a write flag and is unclassified" |
| writer added to `production-readiness-gate.yml` | caught | exit 1 — "passes a write flag and is invoked by a workflow" |
| rule neutered to `return false`, writer `unclassified` | **passes** | exit 0 |

The last row is the one that matters: with the rule removed the tree is silent again, so
the first three are caught by the new rule and not by something that was already there.

### Mutation results — the tests

Neutering `isBaselineWriter` to `return false` and re-running the suite turned **3 of the
16** cases red — exactly the three positive cases. The two negative cases (a writer
correctly classified `operator`, and a `:check` sibling that names a baseline file but
passes no write flag) stayed green, which is correct: a rule that never fires cannot
produce a false positive. The negative cases are load-bearing in the other direction —
they are what would fail if the rule were widened to match baseline *paths* instead of
write flags, which would condemn the gate rather than the writer.

## Rollout Plan

Squash merge to `main`. Takes effect on the next PR that runs the registry gate. No image
build, no ACA deploy, no migration, no flag.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, deploy workflows,
runtime images, flags, environment variables, worker jobs, traffic, DNS, or environment
promotion.

- Repo-owned deploy workflow: not involved — no workflow file changed
- Shared runtime mutators: none
- Approved image digest: n/a — no image built
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no — nothing in this change is observable to a signed-in
  user

## Rollback Plan

Revert commit `b04d02e40`. The registry returns to 184 unclassified entries including the
writer, and the checker stops enforcing the write-flag class. No migration to unwind, no
runtime state to restore.

## Audit Evidence

- Registry entry and its reason: `docs/architecture/ci-gate-registry.json`
- Rule: `scripts/audit/ci-gate-registry-check.mjs` (`WRITE_FLAG`, `isBaselineWriter`)
- Behaviour: `src/__tests__/behaviors/ci-gate-registry-invoked-predicate.test.ts`,
  describe block "an entry that writes the baseline cannot also be a gate"
- The mechanism being guarded: `scripts/audit/control-plane-tenant-purity.mjs` — the
  `--baseline` write path and the `--check` comparison it feeds
- PR URL and CI run: recorded on the PR

## Known Gaps

- **184 entries remain unclassified.** This change classifies one and does not reduce the
  backlog. That backlog is its own item.
- **The flag list is a list.** `WRITE_FLAG` matches four spellings
  (`--baseline|--update|--write|--refresh`). A writer that spells its flag differently —
  `--regenerate`, `--record`, a positional `write` subcommand, or a script that writes
  unconditionally with no flag at all — is not caught. Testing the command rather than the
  script body is a deliberate trade: it is what keeps the `:check` siblings out of the
  rule, and the cost is that the list has to grow when a new spelling appears.
- **`audit:test-ci-coverage:write` was already correct** and is unchanged here, so this
  release proves the rule against one real entry and five synthetic trees, not against a
  writer that was genuinely mis-wired. No such writer exists in the tree today.
