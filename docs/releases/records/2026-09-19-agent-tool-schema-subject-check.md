# 2026-09-19-agent-tool-schema-subject-check — Model-facing tool schema subjects are checked against their real source

## Release ID

`2026-09-19-agent-tool-schema-subject-check`

## Status

`candidate`

## Plain-English Summary

Every agent tool carries two pieces of prose — a description of what the tool does, and a
description of each input it accepts. Both are handed to the model word for word when it decides
what to call. That means a worked example written in one of them is not documentation; it is an
instruction the model will follow.

Nothing checked that the things those descriptions named still existed. A recent repair found one
tool offering an example identifier that had been retired from the pattern corpus, so a model
following the tool's own documentation got "not found". That repair covered the one tool it was
about. This change covers the registry.

One check now walks every registered tool, pulls out every string the model reads, and resolves
each subject it names against the thing that actually owns it:

- **another tool** — must be registered, and must be callable from a surface the naming tool is
  itself on, because the model only sees the tools its current surface registered;
- **a pattern identifier** — must resolve in the live corpus;
- **a value named alongside a property's declared `enum`** — must be in that enum;
- **a quoted route** — must be accepted by the navigation tool's own handler, and the page must
  exist in the App Router.

The check found two live defects, both fixed here.

**One tool told the model to call a tool that was not there.** The sponsor-assignment tool is
registered on the program detail surface only. It requires an internal person identifier, and it
said three times to resolve that identifier through the person-lookup tool — which was registered
on four other surfaces and not that one. On the only surface where sponsor assignment exists, the
model was being told to call something it could not see, and the registry's surface gate would have
refused the call. Since sponsor assignment satisfies a hard gate, the practical effect was a gate
artifact the agent could not produce correctly without the user pasting an internal identifier,
which other tools explicitly instruct it never to ask for. Fixed by registering the lookup tool on
that surface: it is read-only, tenant-scoped by the same authorization call, and already exposed on
broader surfaces, so this narrows nothing and widens no data class.

**One tool offered an identifier the corpus no longer holds.** The program-commit tool's
`matched_pattern_id` input carried a worked example that does not resolve. That value is written
unvalidated into the pattern match log and the module state log, so following the example did not
merely fail a lookup — it recorded a match that never happened. The example is gone; the
description now says where the key legitimately comes from and to omit it otherwise.

## Layer Impact

Release lane: `global-control-lane` — shared agent tool registry behaviour, applying to all
clients, behind no feature gate.

- **Products (layer 4).** Two agent tool definitions change: one gains a surface, one loses a worked
  example from its input description. No handler logic, route, render path or response shape
  changes.
- **Canonical model (layer 3).** Untouched. The pattern-corpus lookup is read-only, at test time.
- **Source adapters (layer 2) / Client intake (layer 1).** Untouched.

## Client Applicability

- All clients: yes — the tool registry is shared, not tenant-scoped. The behaviour change is that
  the model is given accurate instructions; no tenant data, entitlement or authorization boundary
  moves.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/tools/__tests__/model-facing-schema-subjects.test.ts` (new) — the check. Runs in
  the existing `AI surface control catalog` workflow step that covers
  `src/lib/agent/tools/__tests__`; no workflow edit required.
- `src/lib/agent/tools/program/lookupPerson.ts` — adds `/programs/:id` to `surfaces`, with the
  reason at the call site.
- `src/lib/agent/tools/program/commitProgram.ts` — removes the unresolvable worked identifier from
  the `matched_pattern_id` description.

## QA / Validation

- **Failing first, same file either side.** `2 failed / 4 passed of 6` before the fixes →
  `0 failed / 6 passed` after. The two failures are the two defects above; the other four cases
  pass on unmodified `main` by design — they are the guardrails an over-broad fix would break, and
  each is mutation-checked below.
- **Scope baseline, same command either side** (`npx jest src/lib/agent/tools`, measured by
  restoring the changed files to `main` and re-running): **16 suites / 126 tests / 0 failing
  before → 17 suites / 132 tests / 0 failing after.**
- **Six mutations, six caught** (1 / 1 / 1 / 1 / 1 / 1), each file byte-restored afterwards and the
  restore confirmed:
  1. put the retired identifier back in the commit tool's input description — pattern check fails;
  2. remove the newly added surface from the lookup tool — cross-tool reachability check fails;
  3. delete one tool import from the check itself — the coverage guard fails, because a tool nobody
     imports is a tool every check silently skips;
  4. name a non-member value in an enum-bearing property's prose — enum check fails;
  5. offer a quoted route the navigation handler refuses — route-acceptance check fails;
  6. offer a quoted route the handler accepts but the App Router does not serve — router-existence
     check fails.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit **0**, with
  `tsconfig.tsbuildinfo` removed first and the exit code judged rather than the output grepped.
- `npx eslint` on the three changed files exit **0**, no output.
- `node scripts/release-check.mjs --base origin/main --head HEAD` exit 0.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys from the
merge commit as usual. No migration, no data build, no flag, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this PR.
- Shared runtime mutators: none. This PR runs no Azure command.
- Approved image digest: assigned by the deploy workflow on merge; read back after.
- ACA runtime invariant: to be proven after merge — Container App template image equals the
  100%-traffic revision image equals both non-manual worker job images, digest-pinned.
- Worker image invariant: same digest as above.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Nothing rendered changes. The user-visible surface of this
  change is the instruction text a model reads before choosing a tool, plus one additional tool in
  the model's list on the program detail surface. There is no copy, route, component or data path
  to sign in and look at.

## Rollback Plan

Revert the merge commit. Nothing persists state, so there is no data to unwind. The added surface
and the edited description both revert with the file.

## Audit Evidence

- The PR, its CI run, and the `AI surface control catalog` job log showing the new file executing
  (`PASS src/lib/agent/tools/__tests__/model-facing-schema-subjects.test.ts`) rather than merely
  being present.
- The before/after and mutation numbers under QA, each reproducible by the commands named there.
- The post-merge deploy run and the digest readback.

## Known Gaps

- **Route claims are read only from double-quoted paths.** Unquoted slashes in this corpus are
  prose alternations rather than routes, so quoting is the only unambiguous signal available
  without a parser that guesses. A future tool writing an unquoted bad route escapes the prose half
  of the route check. The App Router half does not depend on prose quoting, so a renamed page is
  still caught.
- **The commit tool's pattern key is still unvalidated at the handler.** Removing the misleading
  example stops the tool from recommending an unresolvable key; it does not stop a model from
  inventing one, and the value still reaches the match log unchecked. Whether the handler should
  refuse an unresolvable key or record it with a flag is a behaviour decision with callers, so it
  is filed as its own backlog item rather than decided inside a test repair.
- **Tenant names in model-facing prose are not checked.** One tool's description uses a fixture
  tenant name in a worked example. Whether naming a tenant in prose the model reads is a violation
  at all is a separate call; it is filed, not changed here.
- No signed-in acceptance was attempted, and none is owed — see Deployment Authority.
