// DES7 · Canonical AbarVa wordmark module.
//
// The wordmark implementation lives in `AbarVaTopNav.tsx` (DES2). This
// module re-exports it under the canonical filename so new callers can
// import from `'@/components/abarva/AbarVaWordmark'` without reaching
// into the top-nav module. Existing DES2 callers remain valid.
//
// Wordmark rule (canon §B):
//   • Inline-flex, baseline-aligned, no gap between halves.
//   • "Abar" → near-black `#0A0C12`, weight 700, DM Sans.
//   • "Va"   → NAVY `#1B2B5C`, weight 700, DM Sans, 1.05–1.10× larger.
//   • Letter-spacing -0.01em, line-height 1.
//   • Sizes: sm = 16px base · md = 20px base · lg = 28px base.

export { AbarvaWordmark } from './AbarVaTopNav';

// SHELL1: canonical PascalCase alias for new shell consumers
export { AbarvaWordmark as AbarVaWordmark } from './AbarVaTopNav';
