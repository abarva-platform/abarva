# 2026-09-19-tenant-narrative-term-drift-gate — a new single-word tenant term cannot appear without a read

## Release ID

`2026-09-19-tenant-narrative-term-drift-gate`

## Status

`candidate`

## Plain-English Summary

The release-record tenant-narrative guard refuses any tenant identifier written
as prose in a release record. It works out what to refuse from the tenant
registry: the full key, the key with separators as spaces, and every key part
that is not on a hand-maintained exemption list of words that carry no identity
on their own.

That exemption list is the weak point. Add a tenant whose key contains an
ordinary word nobody thought to exempt, and that word silently becomes a term
refused everywhere in release-record prose — the gate starts rejecting ordinary
sentences for a reason nobody chose. It has already happened once: `first`
reached the term list from a key whose two other parts were both already exempt,
and it cost a round trip to diagnose.

A dictionary check is the obvious fix and the wrong one. It would have to decide
what counts as an English word, and it would either miss coined cover names or
refuse real identity tokens. **This check makes no claim about English at all.**
The single-word terms the registry derives today are written down in
`docs/architecture/tenant-narrative-single-word-terms.json`, each with a one-line
reason. `check:tenant-narrative-term-drift` recomputes the set and fails when it
differs, naming the word and both ways to resolve it:

- exempt it, if blocking it would refuse ordinary prose while protecting nothing
  because the tenant's full key and full display name stay blocked either way; or
- accept it as a real identity token and add it to the committed file with a
  reason.

**The cost, stated rather than absorbed:** one human read per new registry
tenant. That is the cost the backlog item asked to be named before anything was
built, and it is smaller than the cost of a dictionary that is wrong in both
directions.

**There is deliberately no `--write` mode.** A script that rewrote the committed
set would let anyone silence this gate by running it — the same move the CI gate
registry now refuses for baseline writers. The file is six entries; when the
answer is that a word really is an identity token, it is edited by hand.

### Two things found while building it

- **Two exemption entries are inert.** `air` and `new` are three characters, and
  the derivation drops any term shorter than four, so neither could ever be
  derived and removing them would change nothing. They now say so in the code, so
  the next reader does not take the list for protection it is not providing.
- **The first draft of one test proved the wrong thing.** It used a key of
  `air-holdings` to show that a fully-exempt key derives no single word — and it
  passed whether or not `air` was exempt, because of the same length floor. It
  now uses `capital-holdings`, and a companion case asserts the two exemptions it
  depends on are actually present.

### What this deliberately does not decide

Two of the six committed terms are on the list because the registry derives them
today, **not** because anyone ruled they should stay. Both are under an open
per-word decision that belongs to the owner, and each entry in the committed file
says so in its own reason line. This change records the state; it does not settle
it. The words themselves are not repeated here — naming them in a release record
is the thing the sibling guard exists to refuse, which it duly did to the first
draft of this document.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI control plane** — one new PR gate, wired into the existing
  Release Control Gate workflow beside the guard it protects.
- **No product layer is affected.** No route, no projection, no adapter, no
  canonical model, no schema, no migration, no runtime code, no image, no deploy.
- The tenant registry itself is **read only** and unchanged.

## Client Applicability

No client receives this change. It is repository tooling only.

- All clients: no
- Specific clients: none
- Internal only: yes — repository CI, and anyone writing a release record
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `scripts/release-control/check-tenant-narrative-term-drift.mjs` | new — recomputes the single-word term set and fails on drift |
| `docs/architecture/tenant-narrative-single-word-terms.json` | new — the committed set, six entries, each with a reason |
| `scripts/release-control/release-record-tenant-narrative-guard.mjs` | comment only — names the new gate, and records that `air` and `new` are inert |
| `package.json` | adds `check:tenant-narrative-term-drift` |
| `.github/workflows/release-control.yml` | runs it |
| `docs/architecture/ci-gate-registry.json` | classifies it `pr-gate` |
| `src/__tests__/behaviors/tenant-narrative-term-drift.test.ts` | new — 9 cases |

No migrations, no routes, no product code.

## QA / Validation

**Status: pass.** Run in the working tree at `HEAD`.

| check | result |
|---|---|
| `npm run check:tenant-narrative-term-drift` | **pass** — exit 0, 6 terms match |
| `npx jest --runTestsByPath src/__tests__/behaviors/tenant-narrative-term-drift.test.ts` | **pass** — 9/9 |
| `npm run check:release-record-tenant-narrative-guard` | **pass** — 11/11, the sibling guard is unchanged in behaviour |
| `npm run audit:ci-gate-registry` | **pass** — exit 0, 213 scripts, new entry counted as an invoked `pr-gate` |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the three changed code files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | **pass** — exit 0 |

### Mutation results

Each mutation applied to a clean tree, measured, then restored.

| mutation | target | expected | observed |
|---|---|---|---|
| a registry tenant `summit-air-holdings` added | the gate | caught | exit 1 — names `summit` and both resolutions |
| a committed term the registry no longer derives | the gate | caught | exit 1 — names the stale entry |
| `singleWordTerms` neutered to `[]` | the suite | caught | 3 of 9 red |
| `diffTerms` reports nothing | the suite | caught | 4 of 9 red |
| `'capital'` removed from `GENERIC_TENANT_WORDS` | the suite | caught | 3 of 9 red |

The fifth mutation is the one that found the vacuous test described above. It was
first run against `'air'` and the suite stayed green — correctly, since that
entry is inert. Re-pointing it at a length-eligible exemption is what exposed
that the exemption case was proving the length floor instead.

## Rollout Plan

Squash merge to `main`. The gate runs on the next PR through the Release Control
Gate workflow. No image build, no ACA deploy, no migration, no flag.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, deploy
workflows, runtime images, flags, environment variables, worker jobs, traffic,
DNS, or environment promotion.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a — no image built
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no — nothing here is observable to a signed-in user

## Rollback Plan

Revert the commit. The gate stops running and the committed term file becomes
unreferenced. The tenant-narrative guard itself is unchanged in behaviour by this
release, so reverting cannot affect what release records are accepted today.

## Audit Evidence

- Gate: `scripts/release-control/check-tenant-narrative-term-drift.mjs`
- Committed set and its reasons: `docs/architecture/tenant-narrative-single-word-terms.json`
- Behaviour: `src/__tests__/behaviors/tenant-narrative-term-drift.test.ts`
- Wiring: `.github/workflows/release-control.yml`, step "Refuse a newly derived
  single-word tenant term without a read"
- Classification: `docs/architecture/ci-gate-registry.json`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **It detects drift, not wrongness.** A new word is flagged for a read; nothing
  decides for the reader whether it is generic or identity-bearing. That is the
  deliberate trade — the alternative is a dictionary that is wrong in both
  directions.
- **Two of the six committed terms remain undecided.** They are recorded, not
  ratified. The per-word decision is open and belongs to the owner; the committed
  file identifies which two and why.
- **Multi-word terms are out of scope.** Only single-word terms can collide with
  ordinary prose, so only those are tracked. A multi-word term that reads as an
  ordinary phrase would not be caught.
- **A word could be added to both places at once.** Someone editing the registry
  and the committed file in the same commit satisfies the gate without the read
  actually happening. The gate makes the change visible in the diff; it cannot
  make anyone think about it.
