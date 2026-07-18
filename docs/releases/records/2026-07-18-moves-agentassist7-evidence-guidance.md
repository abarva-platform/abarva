# 2026-07-18-moves-agentassist7-evidence-guidance — Contact Center Agent Assist Evidence Guidance

## Release ID

`2026-07-18-moves-agentassist7-evidence-guidance`

## Status

`candidate`

## Plain-English Summary

`MOVES-AGENT-ASSIST-7` from the Moves UX backlog. Investigation found the core ask — DORA/engineering-delivery evidence should never be a hard P2 blocker for the Contact Center Agent Assist archetype, and P2 should prioritize call-center/CRM/claims/transcripts/PHI evidence instead — is **already correctly implemented** on `main` via a real archetype framework (`CONTACT_CENTER_AGENT_ASSIST` in `src/lib/programs/archetypes/registry.ts`, with an explicit code comment: *"DORA/ITSM can help later for implementation estimation, but they are never hard P2 strategy blockers"*), already wired into the real request path.

The one concrete, still-open gap: the per-family *guidance content* shown on P2 evidence cards (example template, example bullets, why-it-matters, next-action, blocked-artifact linkage) was keyed off a lookup table covering only 9 generic/legacy family ids. None of the 12 healthcare-contact-center-specific family ids existed in that table, so a Meridian Agent Assist Move's P2 cards showed the *correct* required/optional labels but *generic, non-specific* guidance text — a boilerplate "Upload the source file or record a human waiver" instead of "Upload redacted call transcripts / intent taxonomy."

This release fills that gap with real, archetype-specific guidance content, following the exact pattern already used for two other Move types (Treasury, AP Invoice) in the same file.

## Layer Impact

- `global-control-lane`: `move-evidence-need-packet.ts` is shared logic for every tenant's Moves evidence-readiness cards.

## Client Applicability

- All clients: yes — any Move whose name matches contact-center/agent-assist/member-service keywords gets this guidance.
- Specific clients: Meridian Health's "Member Service Agent Assist" Move is the concrete beneficiary right now.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts`: new `CONTACT_CENTER_AGENT_ASSIST_EXAMPLES` guidance table (12 family ids, content adapted from the real `HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST` catalog in `discovery-blueprint.ts` — labels/grounds/likelySource/format, not invented fresh), a new `isContactCenterAgentAssistMove()` detector (same keyword set as `archetypes/registry.ts`'s `resolveProgramArchetype`, kept in sync deliberately, flagged as not shared code), wired into `familyGuidance()`'s existing precedence chain (treasury → AP invoice → **contact center** → generic fallback), and 12 new `FAMILY_TO_ARTIFACTS` entries mapping each family to real `deliverable-registry.ts` deliverable types for blocked-artifact linkage.
- `src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts`: new test proving real (not generic-fallback) guidance renders for a Contact Center Agent Assist Move, and that DORA/CI/CD/sprint language never appears.

## QA / Validation

- Pass: `npx eslint` on both touched files.
- Pass: `npx jest src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts` — 4/4 (3 pre-existing + 1 new).
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Not run: live signed-in browser proof (no valid local Clerk session, established constraint this session).

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. Pure content/data addition to an existing table-driven system — no schema change, no pipeline/generation logic touched (unlike `MOVES-DELIVERABLE-4`).

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — open Meridian's Member Service Agent Assist Move's P2 evidence cards post-deploy and confirm they show contact-center-specific guidance, not the generic fallback.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- Updated test file, full pass.
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **Two independently-maintained evidence-family catalogs exist for this archetype with non-overlapping id namespaces**: `archetypes/registry.ts`'s `CONTACT_CENTER_AGENT_ASSIST_FAMILIES` (e.g. `contact_center_transcripts_intents`) and `discovery-blueprint.ts`'s `HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST` (e.g. `call_recording_transcript_availability`) describe overlapping real-world evidence under different ids. This release only fills guidance for the ids the actual `move-evidence-need-packet.ts` pipeline receives (the `discovery-blueprint.ts` catalog, confirmed by tracing `loadDiscoveryEvidenceReadiness` → `getDiscoveryBlueprint`). Whether these two catalogs should eventually converge is a real open question, not something this release attempts to resolve.
- `isContactCenterAgentAssistMove()` is a lightweight Move-name keyword match, consistent with this file's existing Treasury/AP-invoice pattern — it is not wired to the more robust `resolveProgramArchetype()` heuristic (which also considers charter classification, not just the Move name). Edge cases where the name alone doesn't signal the archetype would fall through to generic guidance; this matches the existing precedent for the other two Move-type overrides rather than introducing a new, more invasive integration.
