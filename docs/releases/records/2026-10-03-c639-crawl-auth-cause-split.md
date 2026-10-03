# 2026-10-03-c639-crawl-auth-cause-split — Signed-in crawl names which of two auth causes stopped it

## Release ID

`2026-10-03-c639-crawl-auth-cause-split`

## Status

`candidate`

## Plain-English Summary

The automated signed-in proof lane logs into the product as two tenant personas and walks the real
product routes. It has been refusing on every `main` commit with a single line: the browser rejecting
the sign-in ticket as invalid. That one line is consistent with two different problems, and they are
not fixed by the same person:

- the key used to mint the ticket belongs to a **different authentication instance** than the one the
  browser loads, in which case an operator has to provision the matching key and nobody should edit
  the crawl; or
- the crawl **mints or redeems the ticket wrongly**, in which case it is ordinary code and the
  engineering lane fixes it.

For months the lane reported the symptom without distinguishing those two, so a reader could not tell
whose problem it was. This change makes it say which. The two stages — minting the ticket through the
backend API, and redeeming it in the browser — are now observed separately, and the two instance
identities are compared. Both identities are readable **without knowing the secret's value**: the
minting instance from the ticket's own issuer claim, the redeeming instance from the public
publishable key. The lane now reports one of: a mismatch between those instances (an operator
provisions a key), a ticket refused by the same instance that minted it (this lane's code), a ticket
redeemed after it had expired (this lane's code), a refusal at the minting stage before any browser
was opened, or — when either identity cannot be read — **undetermined**, naming which side it could
not read. Reporting the wrong owner is worse than reporting neither, so it never guesses.

The lane still fails closed. No persona was dropped, no shell response is accepted in place of a real
product route, and the lane does not pass while the bootstrap failure is in its log.

## Layer Impact

Release lane: **`internal-admin`** — this is AbarVa-only CI proof tooling. No client receives it and
no product surface reads it.

- **Layer 4 (products):** no product behavior changes. No route, component, API response, schema or
  tenant datum is touched. The only consumer of the changed code is the post-deploy crawl harness,
  which runs in CI and never serves a request.
- **Layers 1–3:** unaffected.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — CI proof tooling only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/clerk-auth-cause.ts` (new) — the pure classifier and the single-line verdict
  formatter. Reads the minting instance from the ticket's unverified `iss` claim (an identity
  comparison for a diagnostic, never an authorization decision) and the redeeming instance via the
  existing `clerkFrontendApiHostFromPublishableKey`.
- `src/lib/crawl/persona-switcher.ts` — the minting stage is extracted into its own function that
  reports that stage on its own and fails closed; the browser redemption is wrapped so a refusal is
  classified, logged, and thrown with the verdict in its message, which is how it reaches the run's
  own finding text through the harness's existing `auth-bootstrap` observation.
- `src/__tests__/behaviors/crawl-auth-cause.test.ts` (new) — 11 cases on the classifier and the
  verdict-line formatter.
- `src/lib/crawl/__tests__/crawl-auth-cause-live-path.test.ts` (new) — 3 cases driving the real
  `signInPersona` handler with a minting client that succeeds and a page that refuses the ticket the
  way the live run did. It lives here rather than in the behaviours directory for a measured reason
  recorded under QA below.
- `.github/workflows/unit-suites.yml` — the signed-in-crawl step now names the
  `src/lib/crawl/__tests__` **directory** instead of the single file it used to name, so the new
  suite runs in the required `Unit suites that pass on main` check and any suite written there
  tomorrow runs the day it lands. This widens the gate; it never narrows it.

## QA / Validation

Measured on merge base `84b2aa3d4738fd50e0b35dec4b9c48f432a7f3b0`, same scope each time.

**Item re-verified by execution before any edit, not read from the item.** `Post-deploy crawl` run
`37150673373` on `30e0d29d18` failed 2026-10-03T20:15:19Z. Its log shows, for both personas,
`crawl_auth_ticket_start` → `crawl_clerk_testing_token_installed` →
`crawl_auth_bootstrap_failed … This ticket is invalid`, ending `0 P0, 2 P1`. Two facts the item did
not have, both read from that log: the **minting side demonstrably succeeded** (neither
`crawl_clerk_ticket_user_not_found` nor `crawl_clerk_ticket_create_timeout` appears, and the failure
is thrown inside `page.evaluate`), and the whole bootstrap takes **2.5 s against a 300 s expiry**, so
expiry is excluded as a cause.

**Red first, then green.**

| scope | before | after |
|---|---|---|
| the two new suites, classifier module absent | suite fails to run, **0 tests** | — |
| the two new suites, classifier present but live path at merge base | **3 failed / 11 passed** | **14 passed / 0 failed** |
| `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` (pre-existing, same files) | 17 passed | 17 passed |
| whole `src/lib/crawl/__tests__` directory, as CI now runs it | — | **20 passed / 0 failed** |

The 3 red cases on the merge-base live path are precisely the three that drive the real handler, so
the live half of this change is proved by a test that fails without it rather than by the classifier
alone.

**Necessity proved by mutation — ten deliberate breaks, ten caught.**

| mutation | result |
|---|---|
| invert the instance comparison (`!==` → `===`) | 5 failed / 9 passed |
| delete the unreadable-identity guard, so an unreadable identity would blame the operator on no evidence | 1 failed / 13 passed |
| make the classifier always answer `operator-secret` → `this-lane` | 3 failed / 11 passed |
| verdict line drops the `owner=` field | 3 failed / 11 passed |
| verdict line prints an empty instance instead of `unreadable` | 1 failed / 13 passed |
| ticket issuer always reads back as the redeem host | 4 failed / 10 passed |
| live path throws the raw refusal again (the pre-change behavior) | 2 failed / 12 passed |
| verdict thrown but no longer logged | 1 failed / 13 passed |
| minting stage warns instead of failing closed | 1 failed / 13 passed |
| a refused mint reported as a redemption defect (stage lie) | 2 failed / 12 passed |

Tree restored to green (14/14) after each.

**A first mutation batch was vacuous and is reported rather than quietly re-run.** The ten rows above
are the second batch. The first passed both test paths to jest through an unquoted shell variable,
which hid them from the resolver: every run — including the green control — reported `Tests: 0 total`,
so a batch that executed nothing would have read as a batch that caught nothing. The green control is
what caught it, and it is listed in every batch above for that reason.

**A required check this change would have broken, found locally and fixed at the cause.** The first
layout put all 14 cases in `src/__tests__/behaviors/`, which pulled all 514 lines of
`persona-switcher.ts` into the `Behavior coverage floor` coverage set — including the password
sign-in fallback and `waitForSignInOutcome`, which this change does not touch. Measured on this
branch: **90.15% lines without the new test → 89.92% with it, against a 90% floor.** That is a gate
failure this change caused. The floor was **not** moved. The three cases that import the live handler
were moved to `src/lib/crawl/__tests__/`, wired by name into the required
`Unit suites that pass on main` check, and the gate re-measured at **90.09%** — above the floor, with
the live handler still under a test that runs in CI.

- `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 0**, 0 diagnostics. The build-info is removed first per `T-040`/item 40; the exit code is judged, not grepped.
- `npx eslint` on all three files → exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow runs on merge as it does for any commit, but
nothing in this change is served at runtime: the changed modules are imported only by the post-deploy
crawl harness. The change becomes active the next time `Post-deploy crawl` runs, which is on the next
`main` commit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` command, no image, env var, flag, scale or
  secret is touched.
- Approved image digest: not applicable — no runtime image change is requested by this release.
- ACA runtime invariant: unchanged; this release makes no claim on it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and this is the point of the change.** Nothing here is
  reachable by a signed-in user. Whether the crawl can itself reach a signed-in product route is the
  open question this release makes answerable rather than answers.

## Rollback Plan

Revert the single squash commit. No migration, no data, no flag, no runtime state is involved, so the
revert is complete and immediate. The crawl returns to reporting the symptom without the cause.

## Audit Evidence

- PR URL and CI run for this branch.
- `Post-deploy crawl` run `37150673373` on `30e0d29d18`, the pre-change failure this was measured
  against; and the first run on a `main` SHA containing this change, whose log should carry a
  `crawl_auth_cause:` line naming an owner.
- The mutation table above; each row is reproducible from the commit by the stated break.

## Known Gaps

Stated rather than hidden, because three of them matter:

1. **This change does not make the crawl reach a product route.** It makes the lane name whose
   problem it is. If the verdict is `instance_mismatch`, the remedy is a secret an operator
   provisions and this lane must stop there; the acceptance for the item says so explicitly and this
   release does not pre-empt it.
2. **The verdict for the live instance is not yet observed.** The classifier is proved on both
   branches by test, and the live evidence available without the secret (mint succeeds, redemption
   refused, 2.5 s elapsed) is consistent with `instance_mismatch`, but the comparison itself has not
   yet run in CI. Until a `main` run prints a `crawl_auth_cause:` line, the live cause is
   **undetermined and is reported as owed, not as established.**
3. **No item is promoted by this change.** 249 rows sit in the `Signed-in acceptance owed` bucket;
   none of them may move on the strength of a repaired crawl, and `T-439`'s four questions about what
   the crawl actually proves remain unanswered and out of scope here.
