# 2026-09-23-ava-event-context-bundle — Acceptance-bound governed event-context bundle

## Release ID

`2026-09-23-ava-event-context-bundle`

## Status

`candidate`

## Plain-English Summary

When the assistant answers a question about a sourcing event, something has to decide
which facts it is allowed to read. Until now that decision was split across each answer
mode, and the one shared control it passed through — the context and corpus policy — is
never told *whose* answer it is building. It checks that a piece of context is well
governed in the abstract: classified correctly, reviewed, indexed, not marked as
excluded. It cannot check that the context belongs to the tenant asking, to the event
asked about, to the contract that event is bound to, or to the version of a document
somebody actually accepted, because none of those facts are expressible in the shape it
receives.

This change adds the missing half. A new module takes the authorized identity — tenant,
event, contract, current stage, and the accepted version of each document — as a
parameter, and refuses any candidate that does not match it before the existing policy
control ever sees it. It refuses six further classes outright: a document version that
is not the accepted one, a document whose content has drifted from the accepted version
or whose drift was never measured, evidence nobody reviewed, a plan for a stage the
event has already left, a raw upload, and draft assistant text that no named user has
accepted. Refused material is returned with its prose removed, so a diagnostic view of
what was rejected cannot re-introduce the text the rejection existed to keep out.

Identity is a parameter and is never read out of the material being filtered. A piece of
context asserting its own tenancy is precisely the input this control exists to reject.

## Layer Impact

Release lane: `global-control-lane` — a shared control that any client's Source answers
would flow through once a caller is wired to it. It is not client-scoped data, not an
AbarVa-only admin capability, not a public or demo path, and it is not behind a flag.

- **Layer 4 — Products (Source):** adds a contract module under the Source answer layer.
  No product surface imports it yet, so no rendered behaviour changes in this release.
- **Layer 3 — Canonical model:** unchanged. The module reads the acceptance grammar's
  published types rather than restating them, so the reader cannot drift from the writer.
- **Layers 1 and 2 — intake and adapters:** untouched. No loader, migration, projection
  or job is involved.

## Client Applicability

- All clients: no behaviour change in this release — nothing under `src/` imports the
  new module yet.
- Specific clients: none.
- Internal only: yes in effect — this is a governance contract plus its test suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/event-context-bundle.ts` — new. `buildGovernedEventContextBundle`,
  `eventContextFenceHolds`, `summarizeEventContextRefusals`, and the admissible-kind
  allowlist.
- `src/lib/source/ava/__tests__/event-context-bundle.test.ts` — new, 42 cases.
- This record.

No migration, no schema change, no data write, no auth or RLS change, no deploy-affecting
configuration.

## QA / Validation

**Red first, measured over the same scope.** The "before" state is the behaviour that
exists on `main` today: the policy seam with no identity fence, reproduced by making the
fence a no-op.

| | tests | failing | passing |
|---|---|---|---|
| before — policy seam only | 42 | **25** | 17 |
| after | 42 | **0** | 42 |

**Same scope, wider:** `jest src/lib/source/ava src/lib/governance` — 33 suites /
404 tests passing before, 34 suites / 446 tests passing after. No pre-existing suite
changed verdict; the only movement is the new file.

**Mutation proof — 17 mutations, 17 caught, 0 escaped.** Each mutation was confirmed to
change the source before it was run (a no-op mutation reads exactly like a coverage gap),
and the file was byte-restored and `cmp`-verified after each.

| | mutation | failing |
|---|---|---|
| M1 | tenant fence checks only the cover key | 2 |
| M2 | tenant fence removed | 6 |
| M3 | cross-event fence removed | 2 |
| M4 | cross-contract fence removed | 2 |
| M5 | raw-upload / draft-text exclusion removed | 3 |
| M6 | kind allowlist inverted to admit anything | 1 |
| M7 | accepted-version binding removed | 1 |
| M8 | drift gate opened for `unknown` (fails open instead of closed) | 2 |
| M9 | missing-acceptance branch removed | 1 |
| M10 | review-state gate removed | 3 |
| M11 | stage-plan currency gate removed | 1 |
| M12 | refusal redaction removed | 1 |
| M13 | kind checks hoisted above the isolation boundary (ordering) | 1 |
| M14 | policy-seam-blocked candidates silently admitted | 4 |
| M15 | fence post-condition hardcoded true | 3 |
| M16 | post-condition drops the event half | 1 |
| M17 | post-condition drops the tenant-id half | 1 |

**One escape was found and repaired rather than reported.** On the first pass M15
escaped: the post-condition was recomputed only inside the function that guarantees it,
so deleting it changed nothing observable — a check that cannot fail is not a check. It
was extracted as `eventContextFenceHolds`, which is called with a hand-built set in four
cases and now fails under M15, M16 and M17.

**Negative control with independent truth.** Two cases assert the behaviour of
`buildValidatedAgentContextBundle` itself — the dependency, not the module under test —
showing it admits an opposite-tenant candidate and has no field in which event, version
or review state could even be expressed. If this fence were redundant those cases would
fail, so the suite cannot pass by describing something that was already true.

**Toolchain.** `npx eslint` on both files: exit 0, no errors, no warnings.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: **exit 0**,
zero diagnostics — judged by exit code, since a bare run exits 134 on this machine and a
grep over empty output reports a false clean.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and ships the image as it
does for every merge. There is no runtime rollout step specific to this change and no
flag to turn on: the module is a pure function with no importer.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command was run and none is required.
- Approved image digest: produced by the merge deploy; recorded in the claim register
  after the run keyed to the squash completes.
- ACA runtime invariant: to be proven after merge by reading Azure — template image equals
  the digest of the single 100%-traffic revision, revision active/Healthy/Running.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and this is a property of the change rather than an
  omission.** Nothing under `src/` imports the module, so no product surface can observe
  it and a signed-in session would have nothing to look at. It becomes owed at the moment
  an answer path is wired to it — see Known Gaps.

## Rollback Plan

Revert the PR. Two new files and one record; nothing else references them, so the revert
is a deletion with no call sites to repair. No migration to unwind and no data to restore.

## Audit Evidence

- PR and its CI run, including the jest and `release:check` steps.
- The before/after and mutation tables above, each reproducible from the suite.
- `docs/governance/CONTEXT_CORPUS_POLICY.md` and
  `src/lib/governance/agent-context-bundle.ts` for the control this composes with.

## Known Gaps

- **The module has no caller.** This release ships the contract and its proof; wiring the
  per-mode answer builders to it is deliberately separate, because changing a live answer
  path needs a signed-in acceptance that an unattended run may not perform. Stated plainly
  rather than implied: until that wiring lands, the fences described here protect nothing
  that a user can see.
- **The caller must supply a true `acceptedArtifactVersions` map.** The module checks a
  candidate against the map it is given; it does not read
  `source_artifact_acceptances` itself, by design — it is pure and DB-free. A caller that
  builds that map wrongly defeats the version binding, and nothing here can detect it.
- **Supplier-fact allowance is delegated.** "Allowed supplier facts" is enforced through
  the existing `downstream_context_policy` on the policy seam rather than re-implemented,
  so a supplier fact with no policy recorded is admitted if it is otherwise in-identity
  and reviewed.
