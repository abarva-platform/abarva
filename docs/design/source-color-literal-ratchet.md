# Source color literal ratchet

## Stage 1: stop adding debt

Run `npm run audit:source-color-literals` locally. It compares the working tree,
including untracked files, with `origin/main`. Fetch the base branch first. CI
uses `--base=origin/main --head=HEAD` to compare committed trees instead.

The scope is production CSS, JavaScript and TypeScript under:

- `src/components/source/`
- `src/app/(maestro)/source/`
- `src/lib/source/`

Tests, mocks, fixtures and type declarations are excluded. The only literal-color
authorities inside this scope are `canvas/canvas-tokens.ts` and
`portfolio/portfolio-tokens.ts`. Brand CSS variables in `src/styles/abarva-canon.css`
are also available to consumers; shared styles outside the Source roots are not
covered by this narrowly scoped gate. Creating a file called `new-tokens.ts` does
not exempt it.

CSS declarations are parsed with PostCSS; JavaScript and TypeScript literals with
the TypeScript AST. Hex, named colors, RGB/HSL and modern color functions are
checked, including gradients, shadows, variable fallbacks and Tailwind arbitrary
values (with Tailwind's encoded whitespace decoded). Embedded styled-JSX blocks
are parsed as stylesheets. Token-derived color functions are allowed, while
their literal fallbacks remain checked. Comments, CSS strings, asset URLs, JSX copy, navigation attributes and
selector calls are not color declarations. Semantic utility classes, `transparent`,
`currentColor` and token references are allowed. This is a static literal check,
not a computed-style, contrast or complete Tailwind palette audit.

The allowance is a multiset keyed by **file and normalized color literal** in the
base branch. Case and insignificant color-function whitespace do not change an
allowance. Existing literals may stay or be removed; additional occurrences or
different literals fail. Deleting a color elsewhere cannot pay for a new one.
Moving a literal to a different consumer file is also new debt. Once a removal
lands on main, later branches cannot use its old allowance. No checked-in count
or baseline-refresh command can grant extra headroom.

This first stage changes no runtime styles. It is enforced by
`architecture-boundary.yml`, alongside `npm run test:source-color-literals`.

## Deferred stages

Stage 2 replaces existing literals with shared tokens at exactly the current
light-mode values. Before/after screenshots must preserve light-mode rendering.

Stage 3 follows a reviewed light-to-dark token mapping, using the brand canon and
the user's system preference. Body text must meet 4.5:1 contrast; large text and
controls must meet 3:1. A dark-mode screenshot is not a pass merely because a dark
system preference was emulated. Phone layouts remain a separate workstream.
