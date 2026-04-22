# Wave 3 · Codex assignment

**Assigned to Codex · 2026-04-21**

Your three packs. Claude Code is handling the other five (C11, C17, C21, C1, C4) where design/editorial precision is highest. Split was chosen so you ship volume on template-heavy pages while Claude handles design-ambition pages.

## Your packs (paste-ready)

| File | Pack | Est. Codex minutes |
|---|---|---|
| `c12-executive-profile-pages.md` | C12 · Executive Profile pages (8 profiles · composite + real-world) | 60-90 |
| `c14-c15-kpi-and-pattern-detail.md` | C14 + C15 · KPI Detail + Pattern Detail (shared template) | 60-90 |
| `c2-intelligence-suite-detail-pages.md` | **C2 · Intelligence Suite detail pages × 9** — deferred stretch goal per Wave 3 README §2. Only pick up after C12 + C14/C15 ship and only if Anand greenlights. | 60-90 |

**Total elapsed (parallel): ~2-3h for the two primary packs. +1-2h if you also ship C2.**

## Read first (non-negotiable)

1. `README-FOR-CODEX-WAVE3.md` — full Wave 3 context
2. Section §5 of that README — "Design system guardrails" — **if a page feels like generic AI-generated UI, it's wrong**
3. Section §8.3 — interaction polish: hover deliberate not bouncy · brand shimmer not spinners · `prefers-reduced-motion` · keyboard nav
4. Section §8.4 — data realism: every rendered value sourced from real composite data

## Blocker to respect

**C12 real-world profiles (Prat / Shail / Tim / Ranjan) blocked on Anand's ethics review** per Wave 3 README §9.3. Ship the 4 composite profiles first; leave real-world profile rendering gated behind a flag or skip those 4 until Anand clears. Flag this in the PR body.

## Shared-component dependency

**Claude Code is building shared components FIRST** on branch `waves3-shared-components` (tokens, typography primitives, layout shell, `<EntityLink>`, `<ExecutiveCard>`, `<ProgramCard>`). Do NOT re-implement these. Wait for Claude's PR to land or rebase onto it when starting C12.

Expected shared components path: `src/design-system/` (tokens) + `src/components/shared/` (primitives).

If Claude hasn't landed the shared components yet when you start, flag it in your PR — don't fork the components.

## Branching strategy

- `codex/waves3-c12-executive-profiles` off `main` (or off `waves3-shared-components` if that's still open)
- `codex/waves3-c14-c15-entity-detail` off `main`
- `codex/waves3-c2-intelligence-suite` off `main` (if you pick up the stretch)

One PR per pack. **Do not auto-merge.** Ping @anandsundaram-hash.

## Verification per PR

Same bar as the Wave 3 README §11 output expectations:
- `npx tsc --noEmit` clean in `src/`
- `npx next build` clean
- Responsive design verified at mobile / tablet / desktop breakpoints
- Accessibility: semantic HTML, keyboard nav works, screen reader coherent
- Empty states + error states implemented
- Every rendered value sourced from real composite data (no lorem ipsum)
- Visual regression tests if the project has a framework
- Interaction tests for the key flows on each page

## Coordination with in-flight work

- Wave 2 is still active (PR #33 codex/wave2 open) — it depends on that landing first for some data
- AGE migration tonight — Wave 3 data queries assume it's landed
- Drop 5 Executive Profile schema needs to be populated for C12

**If Wave 2 or AGE migration aren't ready:** start scaffolding your pages with empty states per README §9.1. Data wiring happens after the dependencies land.

## Quality bar reminder

From Wave 3 README §8:
- First meaningful paint under 1.5 seconds
- Hover states deliberate, not bouncy
- Loading states brand-color shimmer, not generic spinners
- Motion respects `prefers-reduced-motion`
- Names/titles/KPI values consistent with source data

## What Claude Code is building in parallel

For your situational awareness:
- `src/design-system/` tokens + motion primitives (already partial from PR #30)
- Shared typography components (`<PageTitle>`, `<SectionHeading>`, `<EyebrowLabel>`, `<Body>`, `<MetaLabel>`)
- Shared layout (`<PageShell>`, `<AuthenticatedNav>` wrapper, `<MarketingNav>` wrapper, `<PageFooter>`)
- Shared entity components (`<EntityLink>`, `<ExecutiveCard>`, `<ProgramCard>`)
- Then: C11 Composite Home → C17 Program Detail → C21 Briefings → C1 Homepage → C4 Investors

Your work and Claude's should never collide on file paths. Your domain is the three pages above + their specific data hookups. Claude owns the rest.
