# u626 — aVa's input-drafting offer reaches only the phases it can draft

## Release ID

`2026-10-08-drafting-offer-reaches-only-draftable-phases`

## Status

`candidate`

## Plain-English Summary

The redesigned phase capture puts aVa in a dock beside the questions, with a
short row of suggested actions above the composer. One of those actions is
"Draft proposed inputs": aVa reads the phase's empty capture fields, drafts each
one from an earlier phase's approved answers, and cites what it drew on, for a
person to review and save.

The host handed the dock a **literal one-action list**, built the same way on
every phase the redesigned capture mounts. The handler behind the button then
decided, separately, whether the phase could be drafted at all — and when it
could not, it returned without doing anything: no request, no message, no
change to the dock. The two halves disagreed, and on the first phase the
disagreement was visible.

Drafting works by carrying an **earlier** approved answer forward with a
citation. The first phase has no earlier phase, so there is nothing to cite and
nothing to draft; the drafting endpoint accepts the five later phases only and
refuses the first. But the dock still offered the button there, enabled and
indistinguishable from a working one. Pressing it did literally nothing — not an
error, not an empty result, not a spinner. A person starting a Move pressed the
one control aVa offered them and the product did not respond.

Two changes, both small:

- **The offer is now derived, not literal.** One function answers whether aVa
  can draft a given phase, and the dock's action list is built from it. Where
  aVa cannot draft, the list is empty and no button is rendered — the absence is
  the point, because the dock renders every action it is handed as an enabled
  button, so an action there is a dead control.
- **The handler states a reason instead of returning silently.** The same
  function supplies a sentence for the phase it refuses — that drafting carries
  an earlier approved capture forward, that the first phase has nothing upstream
  to cite, and that aVa can draft from the second phase onward. This arm is not
  reachable from this surface now that the control is withheld; it exists so the
  next surface to wire the control cannot reintroduce a button that says
  nothing, and the tests pin that invariant rather than pretending to exercise
  it.

No capture field, saved answer, evidence, gate, approval, generation or
drafting behaviour changes. On every phase that could already be drafted the
button, the request and the result are identical.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 (Products) only. One client host's action list and one of its
  handlers, plus a pure decision added to the dock adapter that already owned
  action composition. No canonical model, adapter, intake, schema, migration,
  retrieval or API-route behaviour changes; the drafting endpoint and its
  validation are untouched.

## Client Applicability

- All clients: yes for the decision itself — it is tenant-blind and carries no
  tenant-derived content.
- Specific clients: the visible change only appears where the redesigned
  capture is enabled, and the first-phase extension is enabled for the
  synthetic demo tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. The surface is reached through the existing
  `moves_capture_v2` flag and, for the first phase, `moves_capture_p0_v1`;
  both already tenant-gated and default off. With the flags off the legacy
  canvas behaves as before — its own trigger already withheld the offer on the
  first phase, and now reads the same shared decision instead of its own
  comparison (behaviour-identical on every phase the surface can render).

## Changes Included

- `src/components/strategic-moves/ava-dock-adapter.ts` — adds
  `avaPhaseInputDraftAvailability`, `avaPhaseInputDraftLeadingActions`, and the
  three constants that state the drafting window and the action id. Pure, no
  framework imports, beside the existing `avaSuggestedActions`.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the dock's
  leading actions are derived from that decision; the drafting handler reads it
  and answers with its sentence instead of returning silently; the legacy dock's
  render guard reads it too.
- `src/components/strategic-moves/__tests__/ava-dock-adapter.test.ts` — nine
  added cases for the decision and its composition into the dock's three slots.
- `src/components/strategic-moves/__tests__/ava-draft-action-phase-reach.test.tsx`
  — new suite, nine cases, mounting the real host with a dock mock that renders
  suggested actions the way the shared dock does.
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new suite
  as the forty-seventh named path in the required step, with a note on why.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath <both suites> --runInBand`: 22 of 22.
- **PASS** — mutation testing, 12 mutations, 11 killed:
  the literal action list restored in the host (1 case fails); the leading-action
  builder ignoring availability (3); the decision calling the first phase
  draftable (5); the first-phase arm answering with the out-of-window sentence
  (2); the out-of-window arm answering with the first-phase sentence (1); the
  window constant moved (6); the integer check dropped (1); the refusal carrying
  no reason (2); the handler's silent return restored (2); the handler refusing
  without showing a reason (1); the handler's source anchor broken, which fails
  loudly rather than asserting against an empty slice (7).
- **PASS, behaviour-neutral survivor** — the twelfth mutation reverts the legacy
  dock's render guard to its own phase comparison. It survives because the two
  predicates agree on every phase this surface can render: the phase route's
  parser refuses anything outside the six canonical phases. Recorded as a
  de-duplication, not as a behaviour fix, and not papered over with a test that
  would pin an identity.
- **PASS** — `npx jest src/components/strategic-moves/__tests__
src/components/agent/__tests__ --runInBand`: 57 suites, 837 of 837.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
--noEmit`, exit 0.
- **PASS** — `npx eslint` on the four changed source files: 0 errors. Two
  pre-existing unused-import warnings in the host, on lines this change does not
  touch, left alone.
- **PASS** — census regenerated: covered test files +1 with **uncovered
  unchanged**, which is what proves the new suite is registered rather than
  dark. The counts read +2 against the committed file because that file carried
  one test file of inherited drift at this base (a base regen with this change
  removed reads +1 against it, and the census `--check` reports counts as a
  report, not a gate; the coverage shape matched at base and matches now).
- **PASS** — `node scripts/quality/check-named-suite-requiredness.mjs`.
- **PASS** — the workflow parses and the step lists 47 paths including the new
  one.
- **PASS** — prettier measured per file in place: all three pre-existing files
  already warn at this base. Exactly one of prettier's proposed hunks fell on a
  line this change added, and that one is hand-fixed; the other four are
  pre-existing and untouched. The new file is clean.
- **NOT RUN** — signed-in walk. Nothing here is live-proven.

## Rollout Plan

Merge to main. No migration, no data build, no flag change, no Azure action.
The behaviour reaches a tenant only through the existing capture flags, which
this change does not alter.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only
  path that may ship this to a shared runtime. Not invoked by this change.
- Shared runtime mutators: none. No `az` command, no revision, no traffic, no
  template, no env var, no secret, no worker job.
- Approved image digest: not applicable — no runtime image update.
- ACA runtime invariant: unchanged by this change; not asserted here.
- Worker image invariant: unchanged by this change; not asserted here.
- Feature/env flag update path: none. No flag definition, tenant list or default
  changes.
- Live signed-in proof required: yes, for the visible half — a signed-in walk on
  the first phase of the demo Move with the capture flags on, confirming the dock
  no longer offers the drafting action there and that the later phases still
  offer it and still return cited drafts. Owed to Anand; not performed here.

## Rollback Plan

Revert the single squash commit. Nothing persists: no migration, no data write,
no flag state, no stored artifact. The reverted state is the current behaviour,
including the dead button.

## Audit Evidence

- PR and its CI run, including the required AI surface control catalog step that
  now names the new suite.
- The mutation tally above, reproducible by applying each listed edit and
  re-running the two suites.
- `docs/architecture/test-ci-coverage-census.json` diff: covered +1, uncovered
  unchanged.

## Known Gaps

- **Not live-proven.** The signed-in walk is owed and is not a code-lane step.
- The handler's refusal arm is **unreachable from this surface** by
  construction, so it is asserted structurally rather than exercised by
  rendering. If a future surface wires the control without reading the shared
  decision, the arm becomes reachable and should then get a rendered case.
- Measured and deliberately **not** changed: the dock offers the drafting action
  on a draftable phase whose inputs are all already answered, where the
  endpoint returns no proposals and the panel shows the endpoint's own
  "nothing empty to draft" sentence. The legacy dock instead hides the button
  and shows a standing line. Both inform the reader, so the difference is
  presentation and out of scope here.
- Measured and deliberately **not** changed: the drafting endpoint's response
  carries `currentRevision`, `writes`, `savePath`, `programId` and `phase`, and
  **no client reads any of them** — the one fetcher reads `ok`, `proposals`,
  `refusal`, `detail` and `error` only. Inert today; worth a separate decision
  on whether the fields are owed a reader or should be dropped.
