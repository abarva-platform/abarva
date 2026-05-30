# 2026-05-30 · Atlas IAC — Cursor + AI-led product development archetypes

## Release ID
`2026-05-30-atlas-iac-cursor-and-aldpd`

## Status
candidate

## Plain-English Summary
The Atlas Initiative-Archetype Corpus (IAC) foundation shipped in PR #2570 with two reference archetypes (GitHub Copilot, Claude Code) and Wave 2 sibling slices are adding eight more in parallel. This release adds two of those eight, covering the AI-coding and AI-led product-development verticals:

- **Cursor** (`cursor`, `ai-coding`) — Anysphere's AI-first IDE forked from VS Code: Cursor Tab, Composer, Agent mode, multi-model routing.
- **AI-led product development** (`ai_led_product_development`, `ai-product-dev`) — the pattern popularly labelled "vibe coding," covering Replit Agent, v0 by Vercel, Lovable, Bolt.new, and Cursor Agent used in this style.

Both archetypes follow the honesty discipline locked in the foundation slice. Every numeric figure is a labelled planning range with cohort, sample size, source, and `YYYY-MM` date. Where a number could not be tied to a primary, dated, verifiable source, it is omitted.

## Layer Impact
- `runtime-app-lane`: none today. Atlas runtime composition is Wave 3's lane; this slice is corpus-only and exposes its content through the existing IAC retrieval API.
- `architecture-lane`: appends two entries to the IAC registry (`src/lib/atlas/iac/registry.ts`) in alphabetical position by `archetypeKey`. No schema changes.
- `qa-validation-lane`: extends the content-floor test file with two new `describe` blocks — one per new archetype. Existing honesty-invariants tests automatically cover the new entries via the registry iteration.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — these archetypes ship as part of the same industry-context corpus surfaced to every tenant.
- Specific clients: none preferentially.
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/iac/archetypes/cursor.ts` — new. 5 adoption metrics, 5 deployment patterns, 4 pitfalls, 4 emerging patterns, 5 evidence anchors.
- `src/lib/atlas/iac/archetypes/ai-led-product-development.ts` — new. 3 adoption metrics, 4 deployment patterns, 4 pitfalls, 3 emerging patterns, 5 evidence anchors.
- `src/lib/atlas/iac/registry.ts` — append two entries in alphabetical-by-`archetypeKey` position (`ai_led_product_development` first, `cursor` between `claude_code` and `github_copilot`).
- `src/lib/atlas/iac/__tests__/archetype-content.test.ts` — add two new `describe` blocks (one per new archetype) following the GitHub Copilot / Claude Code content-floor pattern. AI-led product development uses a deliberately lower floor (1 adoption metric, 2 patterns, 2 pitfalls, 2 whatNext, 3 evidence anchors) because the pattern is vendor-neutral and harder to source rigorously than named products.

## QA / Validation
- `npx tsc --noEmit` clean.
- `npx jest src/lib/atlas/iac` — all passing (foundation 41 + 17 new content-floor + automatic honesty-invariants coverage for the two new archetypes).
- Honesty invariants enforced on the two new archetypes: planning-range tag on every figure, source + `YYYY-MM` (or `YYYY-MM-DD`) date on every figure and evidence anchor, banned-phrase guard clean, valid `lastReviewed` (`2026-05-30`).

## Rollout Plan
- Merge this PR to main.
- Vercel auto-deploys main. No runtime behavior changes — the IAC has no consumers until Wave 3 wires Atlas composition.
- Other Wave 2 sibling slices (Workday + Oracle ERP, SAP Joule + ServiceNow, Salesforce Einstein + M365 Copilot) land in parallel; merge conflicts on the registry resolve by union in alphabetical-by-`archetypeKey` order.

## Rollback Plan
- Revert this PR. Removes the two archetype files, the two registry imports/entries, and the two new test blocks. No other code paths depend on this slice.

## Audit Evidence
- Sources cited in **Cursor**: Andreessen Horowitz published Series B investment note ("Investing in Anysphere"), Stack Overflow Developer Survey 2024 AI section, Cursor's own blog and changelog (Cursor Tab, Composer, Agent mode), Cursor documentation (Privacy & Security, Models). Every figure resolves to a primary, dated source.
- Sources cited in **AI-led product development**: Andrej Karpathy's February 2025 "vibe coding" public post (named driver), Replit's "Introducing Replit Agent" launch post, Vercel's generative-UI / v0 announcement, StackBlitz's "Introducing Bolt.new" launch post, and Garry Tan's on-record remarks about the YC W25 batch coding mix. Vendor secondary tech press recaps without a primary source are not cited.
- Honesty floor matches the foundation slice (PR #2570) and the Atlas P0 audit closure (PR #2562). Banned-phrase guard ("industry standard", "everyone is doing", "best practice") passes on both archetypes.

## Known Gaps
- The AI-led product development archetype intentionally ships with a lower content floor than the named-product entries because the pattern is vendor-neutral and no single vendor publishes a usage figure for it. Some claims that could have been included (e.g. specific Lovable / Bolt.new user counts) were omitted because the primary source had moved or could not be re-verified at authoring time.
- Wave 3 (Atlas composition wiring) is out of scope.
- `Routes and disclaimers` integrity check may report pre-existing main breakage unrelated to this PR — same precedent as recent Atlas PRs.
