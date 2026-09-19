# 2026-09-19-tenant-display-name-authority — the registry decides, and neither contender matched it

## Release ID

`2026-09-19-tenant-display-name-authority`

## Status

`candidate`

## Plain-English Summary

Two vocabularies name the same tenants and disagree. `buildAgentContext` and
the client registry (`ALL_CLIENTS`) each supply a display name for the same
tenant key, and for three of six keys those names differ. The backlog asked
which of the two is authoritative for a surface that shows a tenant name to a
person.

**Neither.** The data operating model already names the authority:

> Identity is declared, never inferred. Tenancy comes from
> `datasets/tenant-inputs/tenant-input-registry.json`.

Measured against that file, both drift:

| tenant key | `buildAgentContext` matches the registry | `ALL_CLIENTS` matches the registry |
|---|---|---|
| first disputed key | yes | no |
| second disputed key | no | yes |
| third disputed key | yes | no |

**Two of three, and one of three.** Each is right where the other is wrong, so
picking the better of them would have enshrined a vocabulary wrong about a
third of its tenants.

The names themselves are not reproduced here — naming a registry tenant in
release-record prose is what the sibling disclosure guard exists to refuse, and
it duly refused two earlier drafts of this document. The three disputed names
and their counts are in `scripts/audit/tenant-display-name-baseline.json`,
which is the right home for them.

**Decision: the registry is the authority and both derive from it.** That is
not a preference between two internal lists — it is the rule the architecture
document already states, applied.

### What this release does, and what it deliberately does not

**64 non-test files already carry a name the registry does not declare** —
53 files for one of the three, 7 for another, 4 for the third, each named with
its count in the baseline file. Renaming them touches admin pages, auth logins,
landscape models and the client config. That is a cross-cutting change needing
its own review, and it is **not done here.**

What is done is stopping the drift growing. Each non-registry name has a
baseline count that can only fall:

```
Tenant display names: 8 declared in the registry. 64 non-test files still
carry a name it does not declare (baseline 64, never rises).
```

Two deliberate choices in how it counts:

- **Counts, not a ban.** A ban fails on day one and gets switched off. The
  ratchet is the shape already working for the Source integration quarantine.
- **Quoted string literals only.** A name inside prose or a comment is not a
  declaration; counting those would make the number move when someone edits a
  sentence, and describe something other than the problem.

### Why the item's framing mattered

T-011 said the isolation suites now "treat either vocabulary as a tenant label,
with an overlap rule" so that the shorter of two overlapping names is not read
as a leak inside the longer one — and called that rule *"a workaround for the
disagreement rather than a property of tenants"*. That is exactly right, and
this is what the workaround was waiting on: once the registry is the authority
and the count can only fall, the overlap rule has an end date rather than being
permanent.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI control plane** — one new PR gate plus its baseline.
- **No product code changes.** No tenant was renamed, no display name altered,
  no registry entry edited. The check reads; it does not rewrite.
- No schema, no migration, no runtime change.

## Client Applicability

No client receives this change. It constrains future code, and renames nothing
a user currently sees.

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `scripts/audit/tenant-display-name-authority.mjs` | new — the check |
| `scripts/audit/tenant-display-name-baseline.json` | new — the three names and their counts, with why it counts rather than bans |
| `package.json` | adds `audit:tenant-display-name-authority` |
| `.github/workflows/architecture-boundary.yml` | runs it |
| `docs/architecture/ci-gate-registry.json` | classifies it `pr-gate` |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `node scripts/audit/tenant-display-name-authority.mjs` | **pass** — exit 0, 64 against a baseline of 64 |
| `npm run audit:ci-gate-registry` | **pass** — the new gate self-classified |
| `node scripts/audit/ci-gate-registry-order-check.mjs` | **pass** — 219 entries, still sorted |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the new script | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| a new file uses a non-registry name | caught | exit 1, names the name and both counts |
| the registry declares no display names | caught | exit 1, refuses to read that as "nothing drifts" |
| the comparison neutered, then new drift added | **passes**, and prints 65 | exit 0 — the control |
| the baseline raised to 99 instead of fixing the drift | **passes** | exit 0 — see below |

The third is the control: with the comparison disabled the count still rises to
65 in the output while the check passes, which is what establishes the
comparison is doing the catching.

The fourth passes **by design**, and is worth stating rather than hiding.
Raising a baseline is a visible edit in the diff — a reviewer sees the number
go up and asks why. The alternative, refusing any baseline increase, would
block the legitimate case where a tenant is genuinely renamed, and the
file-level guard cannot tell those apart. The protection here is visibility,
not prevention.

## Rollout Plan

Squash merge to `main`. The gate runs on the next PR. No image build, no
deploy, no migration.

## Deployment Authority

Not applicable — no Azure Container Apps, image, flag, worker, traffic or DNS
is affected.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the commit. The gate and its baseline go; no name changes either way.

## Audit Evidence

- The rule being applied: `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`
- The authority: `datasets/tenant-inputs/tenant-input-registry.json`
- The check and its baseline: `scripts/audit/tenant-display-name-authority.*`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **The 64 files are not renamed.** This holds the line; it does not move it.
  The cleanup is recorded as its own item because it touches auth logins and
  admin surfaces and deserves a review of its own.
- **The count is per file, not per occurrence.** Ten new uses inside a file
  that already carries the name do not move the number. A per-occurrence count
  would be more sensitive and much noisier on formatting changes; the file
  count is the coarser, stabler measure.
- **A raised baseline passes.** By design, as above — the protection is that
  the increase is visible in the diff, not that it is impossible.
- **Only `src/` is scanned.** Scripts, datasets and docs can carry a
  non-registry name without this noticing.
