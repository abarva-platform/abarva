# ADMIN15 — Build Progress Depth

## Metadata
- ID: ADMIN15
- Title: Build Progress depth — wave timeline + slice drilldown + CI mini-strip
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, AGENT1
- Estimated complexity: M

## Purpose
Make `/admin/build-progress` a real wave-and-slice tracker by reading `build-waves.json` + `build-slices.json` deterministically. Add wave timeline + slice drilldown drawer + CI mini-strip + backlog preview. Absorbs the BuildProgressDashboard component currently living at legacy `/platform/admin/build-progress` (which uses the V1 shell).

## Context
Legacy `/platform/admin/build-progress` renders a full BuildProgressDashboard inside the V1 AdminCanonShell — never linked from the canonical nav, orphaned. ADMIN15 lifts that dashboard's data shape into canonical `/admin/build-progress`, wires it to AdminCanonShellV2, and adds the drawer + tabs.

## Target state
- `/admin/build-progress` has 4 tabs: Waves (default) / Slices / CI / Backlog.
- Waves tab: vertical timeline of all waves with status badge + percent-complete bar + slice-count badge.
- Click wave row → expand-in-place slice list.
- Slices tab: full slice table with id / title / status / mergeSHA / wave.
- Click slice row → drawer with slice metadata + linked PR (deterministic; PR URL synthesized from `mergedPrNumber` if present).
- CI tab: mini-strip of last 5 CI runs (deterministic seed; NOT live Vercel API).
- Backlog tab: next 3 planned waves with their slice IDs.

## Allowed files
- `src/app/(maestro)/admin/build-progress/page.tsx`
- `src/lib/admin/build-progress-page-view.ts`
- `src/components/admin/build-progress/WaveTimeline.tsx` (new)
- `src/components/admin/build-progress/SliceTable.tsx` (new)
- `src/components/admin/build-progress/SliceDetailDrawer.tsx` (new)
- `src/components/admin/build-progress/CIMiniStrip.tsx` (new)
- `src/components/admin/build-progress/BacklogPreview.tsx` (new)
- `src/__tests__/integration/admin/admin15-build-progress-depth.test.ts` (new)
- `docs/build/slices/ADMIN15_BUILD_PROGRESS_DEPTH.md`

## Forbidden files
- Live Vercel API calls
- Live CI status fetches
- Other admin pages
- Legacy `/platform/admin/build-progress/**` (handled in ADMIN10)

## Implementation scope
1. View-model reads `docs/build/build-waves.json` + `docs/build/build-slices.json` at build time (deterministic — no live read).
2. Build 5 components.
3. Wire 4 tabs.
4. CI mini-strip is a deterministic seed (5 fake runs); add a comment that real CI integration is Wave 27+.

## Tests
- Wave timeline renders all waves from manifest.
- Slice drawer shows correct PR link.
- CI strip renders 5 deterministic rows.
- Backlog preview shows next 3 planned waves.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/build-progress src/app/\(maestro\)/admin/build-progress
npx jest src/__tests__/integration/admin/admin15-build-progress-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. 4 tabs render with manifest-backed data.
2. Wave/slice counts match build-waves.json + build-slices.json.
3. CI mini-strip clearly labelled "deterministic — real CI integration in Wave 27".
4. ADMIN7 visual-lock passes.

## Risks
- Reading manifest files at runtime in Next.js requires `force-dynamic` or build-time inline. Use build-time inline (parse + import) to keep deterministic.

## Founder review
Visit `/admin/build-progress`. See wave timeline. Click wave-admin-redesign → expands to show 7 slices. Click ADMIN5 → drawer with PR 447 link.
