# User Handoff · Wave 3 pickup

Saved from chat on 2026-04-21 so the exact operating guidance survives future sessions.

## Message to Codex

Wave 3 pickup. Read `/Users/anand/Projects/nexus/.codex-inbox/waves3-codex/README-CODEX-ASSIGNMENT.md` first — it assigns you three packs (`C12`, `C14/C15`, `C2` stretch), flags the ethics-review blocker on 4 `C12` real-world profiles, and coordinates with Claude's parallel work.

Prerequisite: Claude just shipped Wave 3 shared components on PR `#36` (`waves3-shared-components`). Wait for `#36` to merge, then rebase your branches onto `main`. Use these exports from `@/components/shared`:

- Typography: `PageTitle`, `SectionHeading`, `EyebrowLabel`, `Body`, `MetaLabel`
- Layout: `PageShell`, `PageFooter`
- Entities: `EntityLink`, `ExecutiveCard`, `ProgramCard`

Do NOT re-implement these. Compose them.

Primary packs (parallel OK, separate branches):

- `codex/waves3-c12-executive-profiles` → `c12-executive-profile-pages.md`
- `codex/waves3-c14-c15-entity-detail` → `c14-c15-kpi-and-pattern-detail.md`

Stretch (after primaries ship, only if Anand greenlights):

- `codex/waves3-c2-intelligence-suite`

## Bars (non-negotiable)

- Design · Wave 3 README `§5` — Georgia / DM Sans / JetBrains Mono only, near-black bg, warm off-white text, teal accent, no purple, no stoplight RGB, no generic shadcn. If it feels generic, it's wrong.
- Interaction · `§8.3` — hover deliberate, brand shimmer not spinners, `prefers-reduced-motion`, keyboard nav, screen reader coherent. Use `useReducedMotion` from `@/hooks/useReducedMotion` and `TRANSITIONS` / `FOCUS_RING` from `@/lib/design-system`.
- Data · `§8.4` — every value from real composite data, no lorem ipsum.

Do not auto-merge. One PR per pack. Ping `@anandsundaram-hash`.

## Claude path (for reference)

Folder: `/Users/anand/Projects/nexus/.claude-queue/waves3/`

```text
waves3/
├── README-CLAUDE-ASSIGNMENT.md
├── c11-composite-home-template.md
├── c17-program-detail.md
├── c21-intelligence-briefing-surfaces.md
├── c1-homepage-rewrite.md
└── c4-investors-page.md
```

## Notes

- Keep this file as the exact user-language supplement to `README-CODEX-ASSIGNMENT.md`.
- If the structured README and this note diverge, flag the mismatch explicitly in the next Wave 3 status update or PR body.
