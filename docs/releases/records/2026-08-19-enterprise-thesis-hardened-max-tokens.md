# 2026-08-19-enterprise-thesis-hardened-max-tokens — restore headroom the hardening pass's new required fields needed

## Release ID

`2026-08-19-enterprise-thesis-hardened-max-tokens`

## Status

`candidate`

## Plain-English Summary

The first live run of the four-part hardening pass (`2026-08-19-enterprise-thesis-hardening`)
truncated on both tenants: `stop_reason=max_tokens` with valid-but-incomplete JSON, at the 10,000
ceiling that call had used successfully before hardening. This is not the array-bounds sprawl the
ceiling was deliberately narrowed to prevent earlier this stretch — the prompt's stated bounds (3-5
items per array, 250-400 words for the story) are unchanged. What changed is real required
structure per item: every claim now carries a `claim_type`; `enterprise_story` decomposes into
3-5 additional claims; `value_creation_model`'s drivers and dependencies became full claims
instead of bare strings; up to 6 `visual_opportunities` can now be proposed. That's genuine content
growth the hardening pass itself required, not scope creep.

Raises the main generation call's `max_tokens` from 10,000 back to 16,000 (the ceiling this call
used before the array-bound-driven reduction), with the array/word bounds still in force so the
extra headroom is slack, not an invitation to grow further. Also adds always-on diagnostic logging
of the thinking/output token split whenever a call's `stop_reason` is `max_tokens`, not only on the
empty-text failure branch — previously that split was only logged when a response came back
completely empty, so a truncated-but-nonempty response (this failure) had no equivalent diagnostic.
If the ceiling proves wrong again, the actual split is now on record instead of requiring a third
live failure to find out.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) generation tooling only —
`scripts/data-build/build-enterprise-thesis.ts`.

## Client Applicability

- All clients: applies to any tenant this generator is run against.
- Specific clients: none.
- Internal only: yes — data-build script, not a served route.
- Public/demo only: no.
- Feature flag: none new.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` — main generation call's `max_tokens` 10000 →
  16000; `callClaude` now logs the thinking/output token split whenever `stop_reason === "max_tokens"`,
  not only when text comes back empty.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint scripts/data-build/build-enterprise-thesis.ts` — PASS, 0 errors.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` — PASS, 33/33 (unaffected by this change --
  these test the structural validator against fixtures, not live token ceilings).
- Root cause confirmed against a real ACA Job run's captured log for both tenants: `! thesis did
  not parse as JSON`, output beginning mid-valid-JSON and cut off, at the ceiling introduced by the
  prior hardening release.
- Live re-run against both tenants under this fix is the immediate next step, tracked as a
  required follow-up before the four hardening fixes can be confirmed to hold on real output.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. A fresh
`data-build:enterprise-thesis:plan` job run (no DB write) against both tenants is the actual proof
this holds -- the hardening pass has not yet had a single successful, complete live generation to
verify against.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR; follow-up is a plan-only ACA Job run.

## Rollback Plan

Revert the commit. No DB row has been written under any version of this script this stretch, so
rollback is a pure code revert with no data migration needed.

## Audit Evidence

PR link recorded at merge. The truncating job's captured log is retained locally at
`/tmp/enterprise-thesis-hardened/04-logs.txt` from this session pending inclusion in the
follow-up job's evidence bundle.

## Known Gaps

Live re-run against both tenants has not happened yet as of this record. Whether 16,000 is
sufficient headroom for the hardened schema, and whether the four hardening fixes (story/VCM
verification, ctx_* citations, claim_type domain scoping, visual_opportunities) actually hold on
complete real output, is unverified until that run completes.
