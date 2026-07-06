# 2026-07-06-home-know-advisory-handoff — Home hands advisory questions to Intelligence

## Release ID

`2026-07-06-home-know-advisory-handoff`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-07-06-home-know-enterprise-profile-grounding`. Home is the **context browser** — its job is to help a user orient on what enterprise context is loaded and whether it can be trusted. Advisory/judgment questions ("why is X a good problem", "what should we do", "recommend / prioritize / is it worth it") belong on **Intelligence**, not Home.

The prior change added a rule that tried to *answer* "why is X a good demo problem" on Home. That over-reached the surface boundary. This change removes that rule and instead routes advisory phrasing to the existing `handoff_intelligence` topic, so Home responds with the "Intelligence owns advisory synthesis / Open Intelligence" boundary rather than giving advice itself. Identity/orientation routing ("who is the company", "tell me about the business") and the real enterprise-profile prose from the prior change are unchanged — those are Home's job.

## Layer Impact

- `global-control-lane`: Home KNOW question classification (`src/lib/home/know/v6-home-ask.ts`, `classifyQuestion`) for all tenants. No schema, data-plane, or flag change.

## Client Applicability

- All clients: Yes.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/know/v6-home-ask.ts` `classifyQuestion`:
  - Removed the `<good|why> <demo|use case>` → `loaded_context` rule added in the prior release.
  - Added an advisory rule → `handoff_intelligence` matching `should we / what should / worth it / business case for / roi of / prioritize / recommend`, and `<good|right|best|compelling|ideal|strong>` combined with `<demo|use case|example|candidate|problem|opportunity|bet|investment|first move>`.
  - Identity/orientation rules ("who is <company>" with leader-role exclusion; "tell me about / describe the business") unchanged → still `loaded_context`.

## QA / Validation

- **Routing smoke — PASS:** ported `classifyQuestion` prefix and ran a case table:
  - "Why is Legal Contract Intake a good CXO demo problem?" → `handoff_intelligence`.
  - "What should we do about legal contract intake?" / "Is this a good use case to pilot?" / "Recommend where to invest first" → `handoff_intelligence`.
  - "Who is Lakeshore, and why is Legal Contract Intake a good CXO demo problem?" → `loaded_context` (identity fires first; Home orients on the who-is half).
  - "What context is loaded, and what can we trust?" / "Which areas are strongest…" → Home (unchanged).
  - "Tell me about the company" → `loaded_context`; "Who is the CIO?" → not captured (leader-role exclusion); "What vendors do we have contracts with?" → `vendors_contracts` (unchanged).
- **Typecheck — PASS:** CI "Typecheck + reasoning-layer tests".
- **Live signed-in proof — NOT-RUN (pending deploy):** on `ca-abarva-web-lab-eastus`, confirm an advisory question on Home shows the Intelligence handoff, and an identity question shows the enterprise profile.

## Rollout Plan

Merge to `main` → "ACA main deploy" builds from the merge SHA and deploys to `ca-abarva-web-lab-eastus` → 100% traffic to the new healthy revision → verify live. No migration, worker, flag, or env change.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% before verification.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Home advisory question shows Intelligence handoff on `app.abarva.ai`.

## Rollback Plan

Revert the PR (ACA main deploy ships the prior image) or shift ACA traffic back to the previous revision. No state involved.

## Audit Evidence

- PR URL: (added on open)
- CI: "Typecheck + reasoning-layer tests", "Release record and impact note".
- Routing smoke output: in the PR description / session transcript.
- Live proof: `app.abarva.ai` Home advisory-handoff screenshot (after deploy).

## Known Gaps

- Home KNOW still reads the on-disk per-tenant V6 dataset pack, not live `enterprise_context` uploads (see `2026-07-06-home-know-enterprise-profile-grounding`).
- The `handoff_intelligence` answer names the loaded initiatives and points to Intelligence; it does not itself render the advisory synthesis (that is Intelligence's surface, by design).
