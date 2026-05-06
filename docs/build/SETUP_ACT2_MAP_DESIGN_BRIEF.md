# Design Brief: Setup Act 2 Capability Map
**Slice:** SETUP-1.3 visual concept  
**For:** Claude Design — capability map spatial layout  
**Date:** 2026-05-06

---

## What this is asking for

A **concept sketch / layout direction** for how to render the Act 2 capability map in the Setup/Admin landing page.

The current implementation is a 4-card grid. The design direction is a **constellation or node-map view** — capabilities as positioned nodes, grounding examples as radiating links, depth state as a visual property of the node rather than a background tint. This brief asks Design to review the live code and propose a spatial layout.

---

## Please review these source files first

Before producing anything, read the actual implementation and content:

1. **Current component** — [`src/components/admin/setup/SetupActTwo.tsx`](../../src/components/admin/setup/SetupActTwo.tsx)  
   The live card grid, depth tones, DepthPill, CapabilityCard. This is what exists today.

2. **Capability content** — [`src/lib/admin/setup-acts-registry.ts`](../../src/lib/admin/setup-acts-registry.ts)  
   The 4 capability families, their `depthState`, and their `groundingExamples` (2-3 links per family). This is the data the map must display.

3. **Design tokens** — [`src/lib/design/design-tokens.ts`](../../src/lib/design/design-tokens.ts)  
   All color tokens: `navy`, `skyPale`, `mintSoft/mintInk`, `amberSoft/amberInk`, `coralSoft/coralInk`.

4. **Shell tokens** — [`src/lib/shell/shell-tokens.ts`](../../src/lib/shell/shell-tokens.ts)  
   Typography: `SHELL.SERIF` (Georgia), `SHELL.SANS` (DM Sans), `SHELL.MONO` (JetBrains Mono). Spacing scale.

5. **Full implementation spec** — [`docs/build/intelligence/SETUP-1_DETAILED_DESIGN.md`](./intelligence/SETUP-1_DETAILED_DESIGN.md)  
   §6.3 covers Act 2 in detail. Open decision D4 (list vs constellation) is the exact decision this brief resolves.

6. **Setup design brief** — [`docs/build/SETUP_ADMIN_DESIGN_BRIEF.md`](./SETUP_ADMIN_DESIGN_BRIEF.md)  
   Broader design context, the "stellar / imagination run wild" founder directive, and the 6 design directions for the full page.

---

## The 4 capability nodes (content you'll be laying out)

| Family ID | Display name | Current depth state |
|---|---|---|
| `pattern-citations` | Pattern citations across the corpus | `partial` |
| `cross-program-signals` | Cross-program signals + contradictions | `partial` |
| `evidence-grounded-qa` | Evidence-grounded Q&A | `grounded` |
| `outcome-measurement-readiness` | Outcome measurement readiness | `missing` |

Each node has 2–3 grounding example links that the user can click through to the underlying record. These links need to be visible from the node or on hover/expand.

**Depth states are dynamic** — in SETUP-1.3 these will be computed live from segment coverage. The visual treatment of depth state must work as a data variable, not static art.

---

## Design constraints

- **Container width:** ~800–1200px inside `EditorialCanvas`. Must be responsive.
- **Must stay in React / inline styles** — this codebase uses zero CSS files and no Tailwind. All styling is inline style objects using the design tokens above.
- **No SVG library dependencies** — if the concept uses SVG, it must be raw `<svg>` elements the engineer can implement without adding a package.
- **Grounding examples must remain accessible** — each node's 2-3 link examples must be reachable, either always-visible or on expand/hover.
- **Color is already assigned** — `mintInk` = grounded, `amberInk` = partial, `coralInk` = missing. Use these; don't invent new semantic colors.

---

## The spatial layout question to answer

The current card grid communicates depth state correctly but doesn't feel like a "capability map" — it reads as four parallel items, not a connected intelligence layer.

**What the design concept should address:**

1. **Node positions** — do the 4 capabilities sit at equal distance (compass points)? Do they cluster by relationship to data families? Is there a center node (e.g., a "corpus health" hub) with four orbiting capabilities?

2. **Edge/link treatment** — how do grounding examples attach to nodes? Do they radiate outward as dotted lines? Appear in a drawer below the node? Show on hover only?

3. **Depth state as node property** — should depth state control: fill opacity? Border weight? A "pulse" animation keyframe? A progress arc around the node?

4. **Empty / missing state** — nodes with `missing` depth state need a treatment that communicates "this could be here" rather than "this is broken." Ghost node? Dashed border? Dimmed label?

5. **Page integration** — Act 2 sits between the opener (skyPale, navy left-border) and Act 3 (white cards, Today/After previews). Should the map have its own background treatment, or float inside a white container like Act 1 and Act 3?

---

## Deliverable requested

A **layout concept** — this can be:
- Annotated ASCII / box diagram describing node positions and relationships
- Described component tree (what nodes render, how edges are drawn, what hover state does)
- Specific inline-style code sketch for the container + node positioning

Do NOT produce a full pixel-perfect design. Produce a **spatial and interaction model** the engineer (Claude Code) can implement in one sitting. If there are two viable options (e.g., compass vs hub-and-spoke), present both in a sentence each and recommend one.

The final output of this brief should be something Claude Code can immediately turn into a working SETUP-1.3 implementation.
