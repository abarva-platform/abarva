# 2026-06-20-scb-loyalty-expert — Customer Loyalty & Personalization expert (faculty 54)

## Release ID

`2026-06-20-scb-loyalty-expert`

## Status

`candidate`

## Plain-English Summary

Adds a retail/consumer Customer Loyalty, Personalization & First-Party Data expert — loyalty program economics, recommendation/personalization, CDP/first-party data + consent, and CRM lifecycle. This is the crown-jewel capability for specialty retailers (e.g. a loyalty-led beauty retailer where the program drives the overwhelming majority of sales), and the faculty previously only had an airline-flavored loyalty expert. Authored with an honest posture: `roiClarity: low` because personalization attribution is genuinely hard. **Additive and dormant — no product route serves it differently yet (it joins the same dormant faculty as the other 53).**

## Layer Impact

- **global-control-lane (additive, dormant):** one new `ExpertPack` data module + the `registry.ts` list (54). Consumed only by the (default-off) router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None (this PR). A separate change activates the faculty for `apexretail`.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None in this PR.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/customer-loyalty-personalization.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 54 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + golden eval; `gateExpertPack` PASS (0 blockers) for all 54 registered packs (54 unique ids); router resolves the new domain on loyalty/personalization probes AND the airline-loyalty expert still wins airline-miles probes (no cannibalization); the W5.2 golden eval still passes 35/35.

## Rollout Plan

Merge to `main`. No runtime rollout — dormant data consumed only by the unwired/default-off router/engine.

## Deployment Authority

Not applicable — additive build-time data with no runtime call sites that are on by default.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a (separate activation change)
- Live signed-in proof required: No (this PR).

## Rollback Plan

Revert the PR — no runtime call sites, no migration.

## Known Gaps

- AI-authored, deterministic-gate-passed; no human SME review and no live retrieval/answer proof.
- Becomes user-visible only when the faculty is activated for a tenant (separate flag flip + deploy + signed-in proof).

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-loyalty-expert` → `main`.
- CI: `npm run release:check`, `tsc` clean, 54-pack gate + routing (incl. airline disambiguation) + 35/35 golden verification.
