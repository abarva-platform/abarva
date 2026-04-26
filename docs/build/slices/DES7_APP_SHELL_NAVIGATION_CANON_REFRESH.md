# DES7 · AbarVa App Shell Navigation Canon Refresh

- Wave: wave-17
- Lane: DES7
- Status: code_complete
- Branch: `wave17/des7-app-shell-navigation-canon`

## What was created

- `src/components/abarva/AbarVaWordmark.tsx` — canonical re-export of
  `AbarvaWordmark` from `AbarVaTopNav.tsx` so new callers can import
  from the canonical filename without reaching into the top-nav
  module.
- `src/components/abarva/AbarVaShellNav.tsx` — new shell navigation
  primitive. 56px height, warm off-white `#FBFAF7` surface, NAVY
  `#1B2B5C` accent, NAVY-on-active text + 1.5px underline. No teal,
  no dark toolbar, no icons, no client switcher. Each surface entry
  carries an optional `workflowQuestion` for orientation prompts.
- `src/__tests__/integration/design/app-shell-navigation-canon.test.ts`
  — 13 type/source assertions (export shape, manifest shape, source
  canon: no `#14B8A6`, no Sanskrit, no sparkle, NAVY + surface present).

## Design canon followed

Yes. AbarVa Visual Canon §B (wordmark), §D (palette — NAVY accent,
warm off-white surface), §E (DM Sans), §G (top nav: 56px, NAVY-on-
active underline).

## AbarVa primitives used

- `AbarvaWordmark` from `AbarVaTopNav.tsx` (re-exported via
  `AbarVaWordmark.tsx`).

## Intentional deviations

None. Hex values are inlined in `AbarVaShellNav.tsx` (NAVY, surface,
border, ink, body, muted) so the primitive remains readable in
isolation; the inlined values match the tokens in
`src/lib/design/abarva-theme.ts`.

## Logo + color direction preserved

Yes. Wordmark behaviour unchanged. NAVY-only accent, no teal/cyber/
neon, no dark page chrome.

## Backward compatibility

Legacy chrome components `src/components/chrome/TopBar.tsx` and
`src/components/chrome/PrimaryNav.tsx` remain untouched. Routes opt
into `AbarVaShellNav` explicitly.
