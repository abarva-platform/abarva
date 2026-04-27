# ADMIN18 — Overview Depth

## Metadata
- ID: ADMIN18
- Title: Overview depth — setup timeline + recent activity + cross-page CTAs
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN11–ADMIN17
- Estimated complexity: M

## Purpose
Make `/admin` (Overview) a true overview that pulls state through from all 7 sibling pages. Add setup-progress timeline, recent-activity strip, and cross-page CTAs that route to the highest-priority destination based on AGENT1 posture.

## Context
ADMIN18 is intentionally sequenced last in Tier 3 because its content depends on the read-models built by ADMIN11–17. With every sibling page now exposing a richer view-model, Overview can summarize.

## Target state
- `/admin` (Overview) renders Steward editorial + setup-progress timeline + recent-activity strip + cross-page CTAs.
- Setup timeline: 6 vertical steps (Connectors / Data Trust / Users / Agents / Production / Architecture / Build), each with state (done / in_progress / pending / blocked).
- Per-step click → expand-in-place: shows what needs doing + link to the relevant `/admin/<x>` page.
- Recent-activity strip: last 5 admin actions (deterministic seed).
- Cross-page CTAs: 2–3 buttons that link to the highest-priority destinations based on AGENT1 Steward posture.

## Allowed files
- `src/app/(maestro)/admin/page.tsx`
- `src/lib/admin/overview-page-view.ts`
- `src/components/admin/overview/SetupTimeline.tsx` (new)
- `src/components/admin/overview/RecentActivityStrip.tsx` (new)
- `src/components/admin/overview/CrossPageCTAs.tsx` (new)
- `src/__tests__/integration/admin/admin18-overview-depth.test.ts` (new)
- `docs/build/slices/ADMIN18_OVERVIEW_DEPTH.md`

## Forbidden files
- Other admin pages
- Real audit-event store reads

## Implementation scope
1. View-model imports the 7 sibling page-views, pulls a state summary from each, and computes the timeline.
2. Build 3 components.
3. Cross-page CTAs read AGENT1 Steward posture.choices to pick the top 2–3 next-actions.

## Tests
- Timeline renders 7 steps with correct states.
- Recent activity shows 5 deterministic rows.
- CTAs link to the right pages based on simulated postures.
- ADMIN7 visual-lock passes.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/overview src/app/\(maestro\)/admin/page.tsx
npx jest src/__tests__/integration/admin/admin18-overview-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. Setup timeline renders 7 steps.
2. Recent activity strip + cross-page CTAs render.
3. CTA destinations honest — pick from AGENT1 posture.choices, not fabricated.
4. ADMIN7 visual-lock passes.

## Risks
- Importing 7 sibling view-models may create circular dependencies; structure overview-page-view.ts as a pure consumer that imports page-view types only, not full components.

## Founder review
Visit `/admin`. See timeline of 7 setup steps with states. See last 5 admin actions. CTAs route to Production Readiness (or wherever the top blocker lives).
