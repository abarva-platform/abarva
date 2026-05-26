# 2026-05-26-packet-20-firstcapital-substrate-prompt — Packet 20 First Capital Substrate Authoring Prompt

## Release ID

`2026-05-26-packet-20-firstcapital-substrate-prompt`

## Status

`candidate`

## Plain-English Summary

Adds the authoring spec for First Capital Financial's synthetic substrate pack — the financial-services equivalent of Packet 18 (Apex Retail) and Packet 19 (Meridian Health). Without this pack, First Capital is the only one of the three demo composites with no structured app portfolio / integration topology / initiative roster / org chart / AI tool footprint, and any Sentinel stress run against First Capital will collapse to the same empty-substrate template that exposed Meridian. This release adds documentation only; the actual data files and ingestion ship as Phase A / Phase B follow-ups by Codex.

## Layer Impact

- `ops-release-lane`: adds a new authoring spec under `docs/build/`. This is a documentation-only lane impact — no runtime path, no schema, no tenant-data write.
- No other lane is affected by this change.

## Client Applicability

- All clients: no
- Specific clients: First Capital Financial — the eventual substrate pack will be tagged `clients.tenant_key = 'firstcapital'`. Apex and Meridian unaffected.
- Internal only: yes (authoring spec for Codex)
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/build/PACKET_20_FIRSTCAPITAL_SUBSTRATE_PROMPT.md`
- PR: #2347

## QA / Validation

- Source grounding: **passed**. Spec verified against canonical `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md` (660-line composite profile).
- Parity check against PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md: **passed**. Same 13-folder structure + 99-verification, identical CSV header conventions, same forbidden-term scanner pattern.
- Cross-tenant matrix self-consistency check: **passed**. Apex / Meridian / First Capital row counts and budget figures match each pack's own scaffold spec.
- Runtime / unit tests: **not run** — documentation-only change with no executable surface.
- Lint / typecheck: **not run** — no code added.

## Rollout Plan

Merge to `main`. No production rollout — this is a documentation deliverable. The follow-up rollout happens in two phases:
- Phase A: Codex authors the data files under `datasets/firstcapital-financial-synthetic-v1/` and adds `scripts/verify/firstcapital-data-pack-scaffold.mjs`.
- Phase B: loader `scripts/seed/firstcapital-substrate.ts` writes the rows into Supabase scoped to `clients.tenant_key = 'firstcapital'` and enqueues 400 chunks through the AI Egress Control Plane.

## Rollback Plan

Revert the merge commit. No runtime, no schema, no policy change.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2347
- Source seed: `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md`
- Sibling packets: `docs/build/PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md` and (referenced) `docs/build/codex-handoff-pilot-prep/05-APEX-SUBSTRATE-AUGMENTATION.md`.

## Known Gaps

- This is an authoring spec, not a dataset. The 180-app / 520-edge / 32-initiative / 22-team / 400-chunk substrate doesn't exist yet — Codex Phase A is the next hand-off.
- The verification stress run against First Capital can't execute until Phase B ingestion completes.
- Task #17 (third-generation tenant-bleed source via `ai_egress_audit` inspection) remains open and is not in scope here.
