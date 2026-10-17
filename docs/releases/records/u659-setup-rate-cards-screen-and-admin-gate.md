# u659 — Setup → Rate cards: a workspace admin loads the rate card in the product

## Release ID

`2026-10-16-setup-rate-cards`

## Status

`candidate`

## Plain-English Summary

A workspace's own rates for Moves estimates (global integrators, boutiques, offshore providers and its internal staff) could only be loaded through the API. This release adds a Setup screen, **Setup → Rate cards** (`/admin/rate-cards`), where a workspace admin loads them once, before any Move:

- **Current card:** the approved version, the date, the approval reason, every line, and the version history. A card that cannot be read is said to be unreadable; it is never shown as "no card loaded".
- **Load a new version:** download the template, upload the CSV, and see every problem row with its row number and field. The change against the current version is summarised (added, changed with before → after, removed, unchanged). There is a warning before any line is removed and for any line not priced per hour.
- **Approve with a reason:** the reason is recorded with the new version. The button stays disabled, with the reason stated beside it, while any problem row remains (a card is approved whole, never with rows left out), when the file matches the current card exactly, or when no reason is given. If the approval request cannot be confirmed, the screen says it may have been saved, rather than claiming nothing was.
- **Codes you can use:** the provider classes (plus `INTERNAL`), locations and levels the upload accepts.

Loading or approving is now an admin act. Before this release, any signed-in member of a workspace could import and approve its rate card through the API. The import and approve routes now require the same authority as the Setup area: an explicit tenant admin for the workspace (platform admins included), or a user whose access policy lets them administer the workspace. Anything that cannot be confirmed is refused with a sentence. Reading the card list stays open to workspace members.

Moves estimates now price only hourly rate lines. The template allows `day` and `year` units, but the resolver treated every rate as hourly. A role a card prices only per day or year is now a stated gap ("prices role X per day, not per hour"); it never converts units and never silently falls back to reference rates.

The Moves estimate step's "reference rates" line now says where an admin loads a card, and the template README documents provider classes, `INTERNAL`, which line applies, hourly-only pricing, and the Setup screen.

## Layer Impact

Release lane: `global-control-lane`. Shared Setup and pricing behaviour for every workspace.

- **Layer 4, products (Setup screen, Moves estimate step):** a new page and component; Setup navigation and the `/admin` active sub-route allow-list.
- **Layer 2/3 boundary (governed rate-card load):** the import and approve routes gain the admin authority check. No schema, migration or data change.

## Client Applicability

- **All clients:** yes.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none (the `/admin` layout already limits who can open Setup).

## Changes Included

- `src/app/(maestro)/admin/rate-cards/page.tsx` (new) and `src/components/admin/RateCardManager.tsx` (new).
- `src/lib/pricing/governed-load/rate-card-authority.ts` (new), used by the import and approve routes.
- `src/proxy.ts` (`/admin/rate-cards` in `ACTIVE_ADMIN_SUBROUTES`); `src/lib/admin/admin-shell-config.ts` (nav entry).
- `src/lib/pricing/effort-engine/rate-card-resolver.ts` (hourly-only lines).
- `src/lib/pricing/moves-workflow/rom-reference.ts` (`loadCommittedRateCardCodes`).
- `src/components/strategic-moves/step-page/RomEstimateStep.tsx` (where to load a card).
- `datasets/templates/pricing-engine-v1/README.md`.
- Tests: `RateCardManager.test.tsx` (new, 10 cases); import and approve route tests (admin gate, using the real authority with the two role lookups mocked); resolver unit tests; proxy active sub-route test. `docs/architecture/test-ci-coverage-census.json` regenerated (+1 covered test file); `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` regenerated (new route listed).

## QA / Validation

- Affected suites (admin components, proxy, Setup integration, admin pricing routes, all pricing, the ROM estimate step, the ROM preview route): all passing. The component suite also passes with `TZ=America/Los_Angeles` (dates are formatted in UTC).
- Mutation check, 12 hand mutants, all killed:
  - the gate always admits;
  - the explicit tenant admin is ignored;
  - a policy error admits;
  - approve is allowed with problem rows;
  - a read error is shown as "no card";
  - no reason is required;
  - the removal warning is hidden;
  - day rates are counted as hourly;
  - the reason is not trimmed;
  - a network error claims nothing was saved;
  - an identical file is approvable;
  - a day line is priced as hourly.
- Visual check: the real component rendered in three states (current card, a checked file with a problem row and warnings, read error) at 1180px and 390px, with no page-level horizontal scroll on phone. The live page itself needs a signed-in admin session and was not walked.
- `tsc --noEmit` clean; ESLint clean on changed files; `audit:lib-orphans` no change; census regenerated, with no sibling PR committing the same counts.

## Rollout Plan

Merge after u657 and u658 (this stacks on both), then ship in the next repo-owned ACA main deploy. No migration and no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. As a workspace admin, open Setup → Rate cards, check a synthetic card file, and approve it. As a non-admin member, confirm the import route refuses with the sentence.

## Rollback Plan

Revert the squash commit and redeploy. Approved rate-card versions are kept, and older code reads them unchanged. Reverting also removes the admin gate on import and approve, so do not revert without re-applying the gate.

## Known Gaps

- **The screen manages the `ENTERPRISE` card code only.** That is the code Moves estimates read.
- **Approving cannot remove one line from the current card.** A new version replaces the whole card, which is the intended semantics.

## Audit Evidence

- PR URL and CI run.
- The mutation table and the rendered-state screenshots described in the PR.
