# Wave 3 · Claude Code assignment

**Self-queue · 2026-04-21**

## Execution order (sequential · design-heavy pages)

| # | Pack | File | Est. minutes |
|---|---|---|---|
| 0 | Shared components (prereq) | — (direct implementation) | 45-60 |
| 1 | C11 · Composite Home + 4 instantiations | `c11-composite-home-template.md` | 100-140 |
| 2 | C17 · Program Detail 5-phase viz | `c17-program-detail.md` | 100-140 |
| 3 | C21 · Briefing surfaces | `c21-intelligence-briefing-surfaces.md` | 60-90 |
| 4 | C1 · Homepage rewrite | `c1-homepage-rewrite.md` | 75-100 |
| 5 | C4 · Investors page | `c4-investors-page.md` | 60-90 |

**Total sequential: ~7-9h. No parallelism — design-heavy pages need focus.**

## Why these five

- **C11 · demo primacy.** Every other logged-in page links back. Sets the design-system precedent.
- **C17 · highest visual ambition.** 5-phase horizontal viz is its own design problem.
- **C21 · shares components with C11.** Natural follow-on.
- **C1 · marketing voice.** Editorial character > volume.
- **C4 · investor deliverable.** Voice + narrative are the product.

## Design-system anchor (already partial)

PR #30 already shipped `MOTION` / `TRANSITIONS` / `FOCUS_RING` tokens in `src/lib/design-system.ts` + `useReducedMotion` hook. Build on this, don't fork.

## Branching

- `waves3-shared-components` off `main` (first)
- Each pack gets its own branch off `waves3-shared-components` OR off `main` after shared components merge
- **Do not auto-merge.** Each PR gets reviewed by Anand.

## Coordination

- Codex is on C12, C14/C15, C2 (stretch). They're waiting on the shared-components PR to land before starting their pages that consume `<EntityLink>` / `<ExecutiveCard>` / `<ProgramCard>`.
- Land shared components fast so Codex unblocks.
