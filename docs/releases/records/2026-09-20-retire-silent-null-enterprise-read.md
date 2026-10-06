# 2026-09-20-retire-silent-null-enterprise-read — a dependency that answered null to everything

## Release ID

`2026-09-20-retire-silent-null-enterprise-read`

## Status

`candidate`

## Plain-English Summary

A local V4 derived-enterprise-read loader sat on three live composition paths
and returned `null` for **every tenant, on every request, silently**. It is
retired from those paths.

The files it reads do not exist. Its six configured roots point at dataset
directories that were archived by the canonical-input commit and deleted by a
later purge, and a bare `catch` turned every miss into `null` rather than an
error — so nothing logged, nothing failed, and the absence never surfaced.

It was reached from:

- `src/lib/atlas/llm.ts` — the Atlas LLM composition
- `src/lib/atlas/scripted-engine.ts` — the Atlas scripted engine
- `src/lib/enterprise-context/intelligence-read-model.ts` — the Intelligence
  enterprise-context read model

So Atlas has been composing answers with no derived enterprise read for any
tenant, and presenting no sign of it.

## Why this is safe, and how that was proved rather than argued

**Measured before changing anything:** the loader returns `null` for **every
one of the six configured tenant spellings**, exercised directly rather than
sampled. Every consumer downstream is null-guarded and was already taking its
fallback branch on every request.

So removing the call is **behaviour-preserving by construction**, and the test
results confirm it exactly:

| suite tree | unmodified `main` | with this change |
|---|---|---|
| `src/lib/enterprise-context` | 5 failed / 52 passed | **5 failed / 52 passed** |
| `src/lib/atlas` | 4 failed / 243 passed | **4 failed / 243 passed** |

Identical. The baseline was taken by stashing the change and re-running, not
from memory — and doing so corrected a miscount: an earlier reading of "four
failing cases" in enterprise-context was a truncated grep, and the real figure
was five both before and after.

## What is retired, and what is deliberately not

**Retired:** the three live call sites. Each now holds `null` explicitly, with
the reason and the reversal condition beside it.

**Not retired:** the loader module, its types, and its test suite. They are left
in place because they document the capability that is missing, and deleting
them would erase the record of what a governed replacement has to provide. The
suite stays red and unwired, which is honest — it asserts a capability the
system does not currently have.

**The reversal condition, carried in the code comment:** restore this only by
binding a governed Layer 3 derived-enterprise-read source readable per tenant
with provenance, evidence status and agent-readiness enforcement. The
architecture constitution forbids substituting Layer 1 intake files for the
missing Layer 3 projection, so repointing the loader at the new canonical
intake layout would be the wrong repair.

## How this was found

By diagnosing a red suite in an **unwired** directory. The suite that asserts
this loader works has been failing where no workflow runs it. That is the
argument for the wiring work of the last several changes, demonstrated on a
shipped surface rather than asserted: an unrun suite was the only thing that
knew.

## Layer Impact

- `global-control-lane`. Three call sites in application composition. No
  tenant data, schema, projection, migration, or flag change. No product
  behaviour change — the value supplied was already `null` on every path.

## Client Applicability

- All clients: yes — Atlas and Intelligence composition, though the observable
  behaviour is unchanged because the value was already absent
- Internal only: no · Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/atlas/llm.ts` — call replaced with a typed `null`; unused import
  removed.
- `src/lib/atlas/scripted-engine.ts` — same.
- `src/lib/enterprise-context/intelligence-read-model.ts` — same, and carries
  the full explanatory note.

## QA / Validation

Measured on base `e0f5a5ec3`.

| What | Result |
|---|---|
| Loader return value, every configured tenant spelling | **`null` in all six cases** |
| `src/lib/enterprise-context` | unchanged: 5 failed / 52 passed |
| `src/lib/atlas` | unchanged: 4 failed / 243 passed |
| `tsc` (exit code) | 0 |
| `release-check` | passed |

`tsc` initially failed: replacing the call with a bare `null` narrowed the
value to `never` at the consumers, which is the type system correctly noticing
that the removed call had a type. The fix keeps the declared type
(`DerivedEnterpriseReadSummary | null`) so the consumers stay honest about what
they would receive if the source is ever restored.

## Rollout Plan

Merge to `main`. No image build, migration, flag, or runtime change beyond the
ordinary deploy. No observable product behaviour change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The three call sites resume calling a loader that returns `null`,
which is the state this change left behind — so rollback restores the silence,
not the data.

## Audit Evidence

- The probe exercising all six configured spellings, `null` in every case.
- The before/after suite counts on both affected trees, taken by stashing.

## Known Gaps

- **This does not restore the capability.** Atlas still has no derived
  enterprise read; it simply no longer pretends to look for one. Whatever the
  read contributed to answer quality has been absent since the purge and
  remains absent.
- **Nothing measures what was lost.** There is no before-and-after of answer
  quality, because the data has been gone for long enough that no current
  baseline includes it.
- **The bare `catch` that hid this is still in the loader.** It is unreachable
  from live paths now, so it was left rather than changed in the same breath;
  if the loader is ever rebound, that `catch` should fail loudly instead.
- **The red suite stays red and unwired.** Wiring it would fail on arrival, and
  fixing it requires the governed source that does not exist.
