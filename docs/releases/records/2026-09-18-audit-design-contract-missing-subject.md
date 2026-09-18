# 2026-09-18-audit-design-contract-missing-subject — A missing audit subject is reported, not thrown

## Release ID

`2026-09-18-audit-design-contract-missing-subject`

## Status

`released`

## Plain-English Summary

One audit script reads a UI component and checks it for wording and chart markers we
require. That component was deleted some time ago. The script read it with no guard, so
instead of reporting anything an operator could act on, it died with a raw Node.js stack
trace. Four separate `npm run audit:*` entry points share that script and all four were
down the same way.

The script now states the problem: it names the file it expected, says why it needed it,
and stops. Same exit code as before, but the operator gets a sentence instead of a stack
trace, and the sentence names the two ways out — restore the component, or point the audit
at whatever replaced it.

**The obvious repair was the wrong one, and the change is built to keep it wrong.** Guarding
the read with `existsSync(file) ? readFileSync(file) : ""` would have stopped the crash and
introduced a worse defect: an absent subject becomes an empty string, the empty string
mentions nothing the audit forbids, and every scan over it reports a pass about a file that
is not there. That exact idiom is what made a sibling audit score a deleted file nine out of
nine. A missing subject is an unanswerable question, not a clean answer. The comment above
the new reader says so, and one of the tests fails if a future change softens it.

## Layer Impact

Lane: `internal-admin`. Audit and verification tooling only — an operator-facing script and
its behavioral test.

- **Products (layer 4):** no change. No route, component, page or answer path is touched.
- **Canonical model (layer 3):** no change. No schema, projection or read model.
- **Source adapters (layer 2) and client intake (layer 1):** no change. No loader, no data
  build, no tenant input.

The only committed artifacts the script would write are its report bundle, and it exits
before reaching them, so no report changed in this release.

## Client Applicability

- All clients: no.
- Specific clients: no.
- Internal only: **yes** — an operator-run audit script and a test in the pre-commit
  behavioral suite. Nothing a signed-in user can reach.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/home-knowledge-design-contract-ui.mjs` — new `readDeclaredSubject(file,
  purpose)` beside the existing `readJson`, which already fails closed on a missing pack
  with a stated message. Both bare `readFileSync` calls on the component subject (the
  blocked-content scan target, and the required-marker source) now go through it.
- `src/__tests__/behaviors/audit-home-knowledge-design-contract-missing-subject.test.ts` —
  new. Drives the real script as a subprocess, in a scratch tree and against the real
  repository.
- This record.

Backlog item 48a. Split out of item 48 by the triage in #7829, which closed the sibling
script and deliberately left this one open as a separate repair because its failure mode is
the opposite: loud, not silent.

## QA / Validation

Measured on this branch, against `origin/main` at `5665d2455`.

**The defect, reproduced before any edit.** All four entry points —
`audit:home-knowledge-design-contract-ui`, `audit:home-dimension-data-tab`,
`audit:home-dimension-evidence-tab`, `audit:home-dimension-story-claims` — exit 1 with an
unhandled `ENOENT` stack trace at line 486.

**New suite:** 3 failed / 1 passed before the fix → 0 failed / 4 passed after. The case that
passes on unfixed code is deliberate: it asserts a subject that *is* present is not reported
missing, which unfixed code satisfies trivially. It is a guardrail against an over-broad fix,
not evidence of the repair, and mutation M4 is what proves it earns its place.

**Four mutations, each caught** (tests failing, of 4):

| Mutation | Failed |
|---|---|
| M1 — revert the scan-target read to a bare `readFileSync` (the original crash) | 3 |
| M2 — soften the reader to `existsSync(file) ? readFileSync(file) : ""` (the tempting wrong fix) | 3 |
| M3 — stop naming the subject path in the stated failure | 2 |
| M4 — report every subject as missing, present or not | 1 |

**Exit code was deliberately not used as the evidence.** This audit already had other reasons
to exit 1, so it exits 1 before the change and after it, and a silent-pass regression would
also exit 1 — just further down, on markers it could not find in an empty string. The
assertions are therefore on the reported reason: the run must name the missing subject, and
must not have reached the downstream marker check. That is what makes M2 fail.

**Scope baseline,** `npx jest src/__tests__/behaviors`: 0 failing / 205 passing before,
0 failing / 209 passing after.

**Working tree:** clean after running all four entry points. The script exits before it
writes any report, so a local verification run does not dirty a committed file.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, with
  `tsconfig.tsbuildinfo` removed first and the exit code judged, not grepped.
- `npx eslint` on both changed files — **exit 0**.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

## Rollout Plan

Merge to `main`. No runtime rollout: this is a script and a test, neither imported by the
application. The repo-owned ACA deploy workflow will build and deploy the merge commit as it
does every merge, and the runtime invariant is verified as standard practice, but nothing in
this change reaches the running product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: whatever the main deploy workflow produces for the merge commit.
- ACA runtime invariant: verified after merge as standard practice — template image equals
  the 100%-traffic revision image, digest-pinned — though no product behavior changes.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing in this change is reachable from a signed-in
  session. Audit tooling only.

## Rollback Plan

Revert the PR. The script returns to its previous behavior, which is the unhandled stack
trace, and the new test fails — correctly, because the defect would be back. No migration, no
data, no flag, nothing to unwind.

## Audit Evidence

- PR and merge commit on `abarva-platform/abarva`.
- CI: the new suite runs inside `npm run test:behaviors`, which is part of
  `test:before-commit` and of the PR check set — so this is a gate that runs, not only an
  npm entry.
- `node scripts/release-check.mjs --base origin/main --head HEAD` exit 0.
- Before/after output of all four entry points, quoted in the PR body.
- Mutation table above, each row reproducible by applying the named edit and re-running the
  suite.

## Known Gaps

- **The decision this change does not take.** Whether the design-contract surface should be
  restored or the audit retargeted at whatever replaced it is still open, and it is
  deliberately left open. The same component is named as the subject of seven criteria in
  the sibling story-quality audit, and item 48a asks for that call to be taken once, for both,
  by the owner — not twice, by two unattended runs. Until it is taken, all four entry points
  fail with a stated reason. That is the correct state: the audit cannot honestly report on a
  file that is not there.
- The audit remains pinned to a single hard-coded tenant key at the top of the script. That is
  pre-existing and out of scope here, but it is the same class as the hard-coded lists backlog
  items 51 and 52 cover, and it should be swept when those are settled.
- The script's committed report bundle under
  `reports/home-knowledge-design-contract-ui-wiring/` is stale — it was written while the
  subject still existed. It is not rewritten here, because doing so would assert a fresh result
  the audit cannot currently produce. It will be regenerated when the decision above is taken.
- Not live-proven, and no signed-in proof is owed: nothing in this change is reachable from a
  signed-in session.
