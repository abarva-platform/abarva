# 2026-05-26-packet-20-firstcapital-substrate-prompt — Packet 20 First Capital Substrate Authoring Prompt

## Release ID

`2026-05-26-packet-20-firstcapital-substrate-prompt`

## Status

`candidate`

## Plain-English Summary

Adds the authoring spec for First Capital Financial's synthetic substrate pack — the financial-services equivalent of Packet 18 (Apex Retail) and Packet 19 (Meridian Health). Without this pack, First Capital is the only one of the three demo composites with no structured app portfolio / integration topology / initiative roster / org chart / AI tool footprint, and any Sentinel stress run against First Capital will collapse to the same empty-substrate template that exposed Meridian. This release adds documentation only; the actual data files and ingestion ship as Phase A / Phase B follow-ups by Codex.

## Layer Impact

- `documentation`: new `docs/build/PACKET_20_FIRSTCAPITAL_SUBSTRATE_PROMPT.md` (394 lines) is the authoring spec.
- No runtime impact. No schema change. No tenant-data write.

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

- Spec grounded on canonical `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md` (660-line composite profile).
- Cross-checked against PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md to ensure parity of structure (13 folders + 99-verification, same CSV header conventions, same forbidden-term scanner pattern).
- Cross-tenant matrix at end of spec makes Apex / Meridian / First Capital differences explicit.

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
