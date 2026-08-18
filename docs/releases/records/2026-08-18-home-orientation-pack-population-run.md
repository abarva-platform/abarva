# 2026-08-18-home-orientation-pack-population-run — First orientation pack write, both tenants

## Release ID

`2026-08-18-home-orientation-pack-population-run`

## Status

`released`

## Plain-English Summary

Home's orientation pack — merged inert across #6482/#6483/#6485 — has been populated for the
first time. Both active tenants now carry a stored, validated, generated orientation pack in
`public.home_knowledge_packs`.

This closes the loop opened by that earlier work: the shell was live and correctly rendering
"not yet generated" because nothing had ever been written. It now renders real content.

## Job Contract (per `docs/ops/aca-data-build-job-rule.md`)

| Field | Value |
|---|---|
| Job name | `job-abarva-private-operator-eus` |
| Run id | `job-abarva-private-operator-eus-qxha12x` |
| Tenant scope | `meridian-health`, `skyharbor-air` (both active tenants; script default) |
| Build version | `home-orientation-a3e727c0-apply` |
| Input source version | canonical build from `datasets/tenant-inputs/active/*` at commit `9116a0541b316c1d91e3d9d1b14a6f9dd181c21c` |
| Idempotency key | `content_hash` of the deterministic aggregate (script-internal; regeneration is a no-op unless the facts change) |
| Started / finished | 2026-08-18T20:39:34.005Z / 2026-08-18T20:45:35.328Z |
| Operator identity | interactive session, `anand.sundaram@thesundaram.com`, via `npm run ops:aca-job` |
| Git SHA / image digest | `9116a054...` / `sha256:a3e727c0e493ad002cb9b77ba8a6338fc3c948dd7ed74b71a339ff67c0a8df50` |
| Status | Succeeded |
| Retry / timeout | 0 retries; 1800s timeout, completed in ~366s |
| Progress output | console log, captured at `./reports/home-orientation-pack/apply-1/04-logs.txt` |
| Validation output | per-tenant narrative generated/rejected counts and rejection reasons, same log |
| Quality-gate output | `validation_status` stored per pack row (see below) |
| Release record | this document |

## What was written

| Tenant | Pack id | Blocks | Dimensions | Narratives | Validation |
|---|---|---|---|---|---|
| meridian-health | `61e452ba-5924-4952-9bb6-34ea0c0cf82c` | 7 | 24 | 31/31 (100%) | `pass` |
| skyharbor-air | `38f56637-153b-451c-8c7e-34f23813d661` | 7 | 26 | 31/33 (94%) | `pass` |

Both rows were read back inside the writing transaction before commit — the script asserts the
stored `render_pack`'s block and dimension counts match what was built, and aborts the transaction
on mismatch. Neither run hit that path.

Both packs land with `status = 'candidate'`: generated and validated, not yet reviewed by a human.
`approved_by` is null on both. This is visible on the page itself — the orientation provenance bar
renders "Not yet reviewed" rather than hiding that state.

## Why this run succeeded where three earlier ones didn't

The first three plan (dry-run) passes against this same canonical data returned `validation fail`
(42-45%), then `warn` (73-74%), before this run's plan pass reached `pass` (91-97%) on both
tenants. Each step traced actual rejection reasons back to a specific bug in the validator itself —
comma-formatting asymmetry, an unrounded-fraction mismatch, two sentence-boundary regex bugs, and a
leading-determiner bug — fixed in PRs #6489, #6491, #6492 respectively, each redeployed and
re-verified before the next attempt. None of the four rounds involved loosening what the validator
requires; each fixed the validator's own comparison logic so it could recognise language a person
(or a competent model) actually writes. The full sequence, including specific rejection examples,
is documented in those PRs' release records.

## Layer Impact

Lane: `global-control-lane`. This record documents a data-plane write to Layer 4
(`public.home_knowledge_packs`) via an ACA Job. No code change in this document; the code that
produced this write is documented separately in #6482, #6483, #6489, #6491, #6492.

## Client Applicability

Both active tenants (all clients, per `CANONICAL_TENANT_KEYS`): `meridian-health`, `skyharbor-air`.

## QA / Validation

- Both packs: transactional pre-commit readback, PASS (blocks/dimensions counts matched before
  commit; script would have thrown and rolled back otherwise).
- Both packs: `validation_status = 'pass'` per the generator's own gate.
- Idle-restore verification on the operator job: PASS, `idleVerified: true`, no problems.
- **Not yet performed:** live signed-in browser proof that `/home` renders the written narrative
  for either tenant. The shell (#6485) and the read adapter were proven independently before this
  write existed to read; the two have not yet been proven together against this specific content.

## Rollout Plan

Already active. Home's read path (`loadOrientationPack`) queries the most recent non-retired,
non-`fail` pack per tenant and artifact type; both newly-written rows satisfy that query and will
be served on the next page load. No further rollout step required.

## Deployment Authority

Not applicable — no ACA web/worker runtime image, traffic weight, or shared configuration changed
by this write. The operator job ran against the already-approved digest-pinned image
(`sha256:a3e727c0...`), confirmed matching the live template and 100%-traffic revision before the
job was submitted, and was restored to its idle image afterward (verified).

## Rollback Plan

Retire the two written rows (`UPDATE ... SET status = 'retired' WHERE id IN (...)`) rather than
delete them, preserving the row for audit. `loadOrientationPack` will then correctly report "not
yet generated" again for both tenants, matching the pre-population state.

## Audit Evidence

- Job output: `./reports/home-orientation-pack/apply-1/` (request, execution, logs, idle-restore
  verification).
- Prior plan-pass diagnostics: `./reports/home-orientation-pack/plan-20260818/`,
  `plan-retry/`, `plan-retry2/`, `plan-retry3/`.
- Pack ids above are queryable directly against `public.home_knowledge_packs`.

## Known Gaps

- No live signed-in browser proof yet that Home renders this content correctly end to end. This is
  the natural next verification step.
- Both packs are `candidate`, not `approved` — no human has reviewed the generated narrative yet.
  There is currently no operator surface for promoting a pack to `approved`; this remains a known
  gap from #6482.
- A small number of narratives were withheld on both tenants (0 on meridian-health, 2 on
  skyharbor-air) where the gate correctly could not verify a generated sentence. This is the
  intended degraded state, not a defect: the corresponding blocks/dimensions render their facts
  without narration.
