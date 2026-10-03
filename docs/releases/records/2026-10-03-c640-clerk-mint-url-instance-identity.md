# 2026-10-03-c640-clerk-mint-url-instance-identity — Mint-side instance identity read from the mint response, compared on the instance rather than the host

## Release ID

`2026-10-03-c640-clerk-mint-url-instance-identity`

## Status

`candidate`

## Plain-English Summary

The automated signed-in crawl signs itself in by asking the auth provider's
backend for a one-time sign-in ticket and then redeeming that ticket in a
browser. For months the redemption has been refused with a single line that is
consistent with two different defects whose remedies point at different people:
either the backend credential belongs to a different auth tenant than the
browser loads — only an operator can provision the matching secret — or the
crawl redeems the ticket wrongly, which is ordinary code this lane owns.

A previous change shipped a discriminator that reads both identities without
needing the secret's value: the minting side from the ticket's own issuer
claim, the redeeming side from the public key. It ran live on its first `main`
commit and correctly answered `undetermined`, reporting that it could not read
the minting side. That was the design working rather than failing — a
classifier that guessed would have named an owner on no evidence — but it left
the original question open, because the assumption that the ticket is a
readable token turned out to be wrong.

This change reads the minting identity from a different field of the same mint
response, which the provider serves from the minting tenant, and logs that
field's host and status verbatim so one run may settle the question outright.

The substance of the change is the comparison, not the extra field. One auth
tenant presents **two** hosts — a sign-in portal host and an API host — and the
two halves of this diagnostic read different ones. Comparing those two strings
directly would report a mismatch on a perfectly matched pair, and would send an
operator to rotate a correct secret: exactly the failure the `undetermined`
answer exists to prevent. So both hosts are reduced to the tenant they share
before being compared, two hosts that cannot be placed produce `undetermined`
rather than a verdict, and a development tenant against a production one stays
a decisive mismatch.

No credential is logged. The field this change reads carries the live ticket in
a query parameter, so only its host is ever read or printed.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operations capability —
the diagnostic output of a post-deploy CI job, read by engineers and operators
in a workflow log. It is deliberately not `global-control-lane`: nothing here
changes shared app or control-plane behavior for any client, and the modules
touched are reachable only from the crawl job, not from the web image's request
path.

- **Layer 4 — products:** none. No product surface, route, component, or model
  prompt changes. The modules touched are the crawl's own sign-in helper and
  its pure classifier, which run only inside the post-deploy crawl job.
- **Layers 1–3 (client intake, source adapters, canonical model):** untouched.
  No tenant data is read or written, no dataset, loader, migration, or
  projection changes, and no governed context object is created or consumed.

## Client Applicability

- All clients: no. No client-visible behavior changes.
- Specific clients: none.
- Internal only: yes — diagnostic output of the post-deploy crawl, read by
  engineers and operators in a CI log.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/clerk-auth-cause.ts` — adds `url`, `status` and `tokenId` to
  the mint outcome; adds `clerkMintUrlHost`, `clerkMintInstanceHost`,
  `clerkInstanceIdentityFromHost` and `compareClerkInstances`; the classifier
  now compares derived instance identities instead of raw hosts and gains an
  `undetermined` branch for a comparison that is readable but not sound.
- `src/lib/crawl/persona-switcher.ts` — carries those three mint-response
  fields into the observation and logs `crawl_auth_mint_identity:<persona>` with
  the status, the token id and the **host** of the mint url.
- `src/__tests__/behaviors/crawl-auth-cause.test.ts` — pure-classifier cases.
- `src/lib/crawl/__tests__/crawl-auth-cause-live-path.test.ts` — cases that
  drive the real sign-in handler.
- This record.

No workflow file changes: `src/lib/crawl/__tests__` is already named as a
directory by the `Run signed-in crawl proof contracts` step of
`.github/workflows/unit-suites.yml`, so the live-path cases run in the required
`Unit suites that pass on main` check the day they land.

## QA / Validation

**Baseline, same scope, on the merge base `80fb04f4fe`** — the three suites
over the two modules touched: `3 suites / 31 tests, 31 passed, 0 failed`.

**Red first, measured with the FINAL tests against the merge base's
implementation:** `12 failed / 34 passed of 46`. After the fix: `0 failed /
53 passed of 53`. (The 53 includes seven cases added after the mutation batch;
see below.)

One of the four live-path cases passes on the merge base by design: it is a
regression guard asserting that an unreadable ticket with no mint url still
answers `undetermined`, which is the behavior live today and must not change.

**Eleven deliberate mutations, eleven caught, with an unmutated green control
run and printed inside the same batch** — the control is printed because a
batch that silently executes nothing reads exactly like a batch that catches
nothing:

| mutation | failing cases |
|---|---|
| green control, no mutation | 0 failed / 53 passed |
| compare bare hosts, not instance identities | 2 |
| `compareClerkInstances` always answers `same` | 8 |
| a development host acquires a production identity | 7 |
| widen the bare development suffix to an identity instead of `null` | 2 |
| test the shorter development suffix first | 8 |
| treat an unsound comparison as a mismatch | 1 |
| stop dropping the leading portal/API label | 3 |
| drop the bare-suffix ambiguity guard | 1 |
| log the mint url verbatim instead of its host | 1 |
| never carry the mint url into the observation | 2 |
| prefer the mint url over the ticket's own issuer | 1 |

**A twelfth mutation SURVIVED and the code changed rather than the test.** The
first implementation compared the two identities' *kind* before their id, and
deleting that comparison changed no outcome. The fixture it was meant to decide
already differs by id, and no input can reach it: every host under the
development suffix is routed to the development branch or gets no identity at
all, so a production id can never collide with a development one. A branch no
input reaches is the unfailable-guard shape this module exists against, so the
branch was removed and the invariant that makes it unnecessary is now asserted
by seven cases of its own rather than left as an argument in a comment. That is
what took the suite from 46 to 53.

**Two defects in my own work, found by the above and recorded rather than
quietly fixed.** (1) A first fixture passed a non-URL string as the ticket
issuer to reproduce the live unreadable-ticket shape; the helper wrapped it in
a valid token whose issuer read back fine, so the case under test was not the
live case at all. (2) `clerk.accounts.dev` — the bare API suffix, carrying no
tenant — was read as a tenant whose slug is `clerk`. Both were caught by cases
written before the implementation.

**Gates, judged on exit code:**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit `0`, zero lines of output, with `tsconfig.tsbuildinfo` removed first so
  the check is not answered from a cache.
- `npx eslint` over all four changed source files — exit `0`.
- `npx prettier --check` over the same four — all files conform.
- `npm run coverage:behavior-gate` — **1975 of 1975 tests pass**, lines
  **90.09%** against a **90%** floor, statements 90.09%/90, functions
  70.25%/60, branches 71.32%/50. The floor is not moved and nothing is
  weakened. The base's own last measured figure, recorded in the register by
  the change merged into this base, was also 90.09%; I did not re-measure the
  base in this run, and the reason no regression is expected is structural
  rather than asserted — the pure cases import only a module already in the
  denominator, and the cases that import the 514-line live handler are in
  `src/lib/crawl/__tests__/`, which the floor does not sweep.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded in
  the pull request.

## Rollout Plan

Merge to `main`, which triggers the repo-owned ACA main deploy workflow. No
migration, no flag, no data build, no manual runbook step.

**This change has no runtime behavior to roll out.** Both modified modules are
reachable only from the post-deploy crawl, which runs as its own workflow job
and not from the web image's request path. The deploy is therefore an ordinary
consequence of merging rather than the mechanism that makes this change active;
the change becomes active on the next `Post-deploy crawl` run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No hand-run Azure command, no ad-hoc `az acr build`, no branch
  workflow against the shared registry.
- Shared runtime mutators: none in this change.
- Approved image digest: whichever digest the repo-owned workflow builds from
  the merge commit; to be read from Azure after the run reaches a terminal
  state and recorded in the register, not predicted here.
- ACA runtime invariant: to be proven after deploy — the web Container App
  template image, the sole 100%-traffic revision's image, and both delivery
  worker job templates must equal one digest, read read-only from Azure at a
  single instant and reported as point-in-time.
- Worker image invariant: no worker code changes; no worker image is expected
  to move for this change's own sake.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and asserting one would be false
  evidence.** Nothing here renders on a client surface or reaches a model path,
  so a signed-in walk could not observe this change. Its live evidence is a
  `Post-deploy crawl` run printing a `crawl_auth_mint_identity` line and a
  `crawl_auth_cause` verdict.

## Rollback Plan

Revert the pull request and let the repo-owned workflow deploy the revert. There
is no migration, no persisted state, and no flag, so the revert is complete in
one step. The pre-change behavior is the `undetermined` verdict the crawl prints
today, which is already a correct and safe answer — so a rollback loses a
diagnostic and breaks nothing.

## Audit Evidence

- The pull request, with the red-first numbers and the full mutation table
  above.
- The required CI checks on the merge head, enumerated individually by name
  from the ruleset rather than read as a green tick.
- The merge SHA and GitHub's own `mergedAt`.
- The repo-owned deploy run keyed at or after the merge SHA, read to a terminal
  state, and a read-only Azure digest readback.
- The first `Post-deploy crawl` run after the deploy, whose log is the live
  evidence for this change: the `crawl_auth_mint_identity` line and the
  `crawl_auth_cause` verdict it produces.

## Known Gaps

- **The live verdict is OWED, not established.** This change makes the
  comparison possible; it does not assert its outcome. Whether the crawl's
  minting credential belongs to the tenant the browser loads is still
  undetermined until a run prints the line, and this record does not predict
  which way it will go. The honest reading of the available evidence is that
  three outcomes remain open: the two hosts reduce to the same tenant and the
  owner is this lane; they reduce to different tenants and the owner is an
  operator; or the mint url is absent or unplaceable and the answer stays
  `undetermined` with a third field now named as unreadable.
- **The predecessor item stays open.** It remains open until a live run names an
  owner, and this change is its mechanism rather than its closure.
- **If the mint url is also unreadable, the no-secret sources are exhausted.**
  The mint response has no further field that identifies the minting tenant
  without the secret's value, so that outcome would make the question an
  operator's to answer with a credential comparison, not this lane's.
- **The instance-identity rule is not a public-suffix implementation and does
  not claim to be.** It recognizes the two host shapes the provider actually
  serves and answers `null` for everything else, which the comparison reports
  as unsound. A provider host shape outside those two would therefore yield
  `undetermined` rather than a wrong verdict. That is the intended failure
  direction, and widening it to make a verdict appear is explicitly out of
  scope.
- The crawl's other two P1 findings are untouched and unrelated.
