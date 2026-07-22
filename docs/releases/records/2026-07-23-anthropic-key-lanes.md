# 2026-07-23-anthropic-key-lanes — Anthropic API key lane split

## Release ID

`2026-07-23-anthropic-key-lanes`

## Status

`candidate`

## Plain-English Summary

All Nexus model calls currently share one `ANTHROPIC_API_KEY`. The Anthropic
Admin API can only attribute spend to keys that actually differ, so the
verified $3,227.89 month-to-date API bill (2026-07-22) is a single
undifferentiated bucket — there is no way to tell Tower answers from Home pack
generation from QA pressure tests.

This adds the plumbing to split that key by **economic lane**: a set of workloads
that would be optimized the same way.

| Lane                  | Carries                                          | Why it is its own lane                         |
| --------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `prod-realtime`       | Intelligence + Tower answers                     | interactive, latency-sensitive, frontier model |
| `offline-generation`  | Home packs, Moves deliverables, Source artifacts | batchable, long-output, Batch API candidate    |
| `qa-evaluation`       | pressure tests, graders                          | high volume, cheap-model candidate             |
| `engineering-scripts` | ad hoc operator scripts                          | must never be confused with product spend      |

**Nothing changes at runtime until lane keys are provisioned.** Every lane falls
back to the existing `ANTHROPIC_API_KEY`, so deploying this is a no-op, and a
partially-provisioned rollout is valid — lanes can be split one at a time.

## Layer Impact

- `global-control-lane`: the shared AI egress path gains an optional `workload`
  argument and a per-lane client cache. Behavior is unchanged when the argument
  is omitted and lane keys are unset.
- No tenant data path, RLS policy, schema, or product surface changes.

## Client Applicability

- All clients: no behavioral change.
- Internal only: yes — billing attribution is an operator concern.
- Feature flag: none. The fallback IS the safety mechanism.

## Changes Included

- `src/lib/integrations/ai-egress/anthropic-key-lanes.ts` — lane resolution,
  shared-key fallback, audit-safe descriptors, coverage reporting.
- `src/lib/integrations/ai-egress/anthropic-direct.ts` — the module-level single
  client became a per-lane cache; `getAnthropicDirectClient`,
  `createAnthropicDirectTextAdapter` and `preflightAnthropicDirectClient` accept
  an optional `workload`; lane is stamped on audit metadata.
- `src/lib/integrations/ai-egress/__tests__/anthropic-key-lanes.test.ts` — 13
  tests.

## QA / Validation

- `npx jest src/lib/integrations/ai-egress/__tests__/anthropic-key-lanes.test.ts`
  — 13/13 pass.
- `npx jest src/lib/integrations/ai-egress` — 40/40 pass across 6 suites; no
  regression from replacing the client singleton.
- `npx tsc --noEmit` — no errors in the changed files.
- `npx eslint src/lib/integrations/ai-egress/ src/lib/observability/` — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.
- Secret-safety asserted directly: the audit-metadata test sets a key value and
  asserts the serialized metadata does not contain it.

## Rollout Plan

Merge. No runtime deploy required and no behavior change on merge. Provisioning
is then incremental and reversible at every step:

1. Mint a key per lane in the Anthropic console with a matching name.
2. Set one lane's env var (e.g. `ANTHROPIC_API_KEY_QA_EVALUATION`) on the ACA
   web app and worker jobs. That lane's traffic moves to the new key; every
   other lane continues on the shared key.
3. Confirm the new key appears in the Admin API usage report.
4. Repeat per lane.

Per-lane env var updates on a shared ACA runtime must pass the currently
approved digest-pinned `--image`, per the deployment authority rule in
AGENTS.md — otherwise Azure can create a revision from a stale template image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for any
  env var rollout.
- Shared runtime mutators: none in this PR. It adds no `az` invocation.
- Approved image digest: unchanged by this PR; required for the later env var
  update.
- ACA runtime invariant: unaffected by merge.
- Worker image invariant: unaffected by merge. Worker jobs need the same lane
  env vars as the web app when `offline-generation` is provisioned.
- Feature/env flag update path: new optional env vars only, all with fallback.
- Live signed-in proof required: no client-visible surface changes.

## Rollback Plan

Unset the lane env var; that lane immediately falls back to the shared key on
the next client construction. To revert the code, revert the commit — the
`workload` argument is optional everywhere, so no call site depends on it.

## Known Gaps

- **No call site passes `workload` yet.** This PR is plumbing only. Until call
  sites are labelled, every call resolves to `prod-realtime` and the shared key,
  and provider-side attribution is unchanged. Labelling the ~20 call sites is
  deliberately separate so this change stays reviewable and revertible.
- **Some code bypasses the egress path entirely.** At least
  `src/lib/home/home-summary-claude-render.ts:545` constructs
  `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })` directly, so it
  will not pick up lane routing until it is migrated onto
  `getAnthropicDirectClient`. Those sites also bypass tenant AI policy checks,
  which is a governance concern beyond cost and should be assessed separately.
- **Default lane is a guess for unlabelled traffic.** Unlabelled calls are
  attributed to `prod-realtime`. That is the deliberate safe direction — it
  cannot understate product spend — but it means the `prod-realtime` figure is
  an upper bound until labelling is complete.
- **No enforcement that `workload` is supplied.** A lint rule or a required
  argument could force labelling; both were rejected for this PR because they
  would break every existing call site at once.

## Audit Evidence

- Test file asserts fallback, precedence, partial provisioning, the
  both-unset error path, and secret exclusion from audit metadata.
- `describeKeyLaneCoverage()` is the runtime evidence surface: it reports how
  many lanes are actually separated, so the cost digest can state its own
  attribution quality rather than implying precision it does not have.
