# Learn Panel · Shell Specification

**Route:** `/home/learn`
**Status:** Shell only in this package. Content fills via follow-up Learn Content Package.
**Job:** Be the destination for "what is this?" / "how do I?" / "tell me about" — for product info, doctrine reference, glossary, agent explanations, quickstart.

---

## What ships in this package

The structure of the Learn panel as a navigable shell with empty / placeholder content. When this package merges:

- `/home/learn` route exists and renders
- Navigation between Learn sections works
- Section structure is locked (so future content packages know where things go)
- Placeholder text indicates "Content coming soon — see [Learn Content Package]"
- Search affordance scaffolded (even if search is disabled until content lands)

---

## Section structure

Six sections, listed in order they appear:

### 1. Quickstart

**For:** First-time tenant admins (e.g., Castillo logging in for the first time)

**Future content:**
- 90-second product tour ("here's what AbarVa does")
- Step-by-step "First Move" walkthrough
- Video / animated walkthrough
- Common first-day questions

**Shell today:** Section exists with placeholder card "Quickstart guide coming soon — for now, start at the AI Initiatives panel to see what's already loaded for your tenant."

---

### 2. Glossary

**For:** Anyone hitting unfamiliar terminology (Strategic Move · archetype · Three Tests gate · pressure card · provenance · etc.)

**Future content:**
- Alphabetical glossary of platform terms
- Each term has plain-language definition + a longer "see also" reference + one example
- Cross-linked from anywhere in the platform a term appears

**Shell today:** Section exists. Search field at the top (disabled). Stub list of 5-10 terms with placeholder definitions:

- AI Initiative
- Strategic Move
- Phase (P0-P5)
- Archetype
- Pressure card
- Provenance
- Three Tests gate
- Substrate

---

### 3. Doctrine reference

**For:** Anyone wanting the platform's opinionated framework — "what does AbarVa believe is true about how AI portfolios should be managed?"

**Future content:**
- The 6-phase Strategic Moves model with explanations per phase
- The 5 archetypes (operational_optimization, ai_product_enablement, etc.) with examples
- The 8 AI categories with definitions
- The Three Tests gate framework
- The substrate-to-surface contract

**Shell today:** Section exists. Subsection placeholder cards for each of the above. Each card says "Detailed reference coming soon — for now, see [linked doc in repo / package]."

---

### 4. Agents

**For:** Understanding what each AbarVa agent does, how to interact, when to expect it

**Future content:**
- One page per agent: Sentinel · Atlas · Nexus · Steward
- Each page: agent's job, where it surfaces, what it has access to (substrate), what kinds of questions to ask, examples
- Behavior expectations ("Sentinel will push back if you make a claim that contradicts substrate")

**Shell today:** Section exists with 4 placeholder cards (Sentinel, Atlas, Nexus, Steward). Each card has agent name + one-line job + "Read more →" stub.

---

### 5. Workflows

**For:** Guided walkthroughs of common operational tasks

**Future content:**
- Originating a Strategic Move
- Reviewing AI portfolio performance
- Handling a pressure card (cost overrun / value lag / duplication)
- Onboarding a new connector
- Validating substrate completeness
- Per-phase guided workflows for Strategic Moves

**Shell today:** Section exists. Placeholder card grid for ~6 common workflows.

---

### 6. About AbarVa

**For:** Product information, philosophy, what AbarVa is and isn't

**Future content:**
- Product description (what AbarVa is)
- Differentiators (what makes AbarVa different from generic AI dashboards)
- Customer outcomes (case studies, anonymized)
- Roadmap (what's coming next)
- Contact / support
- Release notes / changelog

**Shell today:** Section exists. One-paragraph product description + "More content coming."

---

## Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Home > Learn                                                        │
│ Product info · Training · Doctrine reference                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ [search learn ...                                              🔍] │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 1. QUICKSTART                                                │  │
│ │ For first-time users · 5-min tour · "make your first Move"  │  │
│ │ [Coming soon]                                                │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 2. GLOSSARY                                                  │  │
│ │ Terms used across AbarVa · click any term in the platform   │  │
│ │ to come back here                                            │  │
│ │                                                              │  │
│ │ AI Initiative · Strategic Move · Phase · Archetype ·         │  │
│ │ Pressure · Provenance · Three Tests · Substrate              │  │
│ │                                                              │  │
│ │ [Browse all terms →]                                         │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 3. DOCTRINE REFERENCE                                        │  │
│ │ The opinionated framework: phases · archetypes · categories  │  │
│ │ · Three Tests gate · substrate-to-surface contract           │  │
│ │ [Read doctrine →]                                            │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 4. AGENTS                                                    │  │
│ │ How to work with each AbarVa agent                           │  │
│ │ [Sentinel] [Atlas] [Nexus] [Steward]                         │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 5. WORKFLOWS                                                 │  │
│ │ Step-by-step for common tasks                                │  │
│ │ - Originate a Strategic Move                                 │  │
│ │ - Review portfolio performance                               │  │
│ │ - Handle a pressure card                                     │  │
│ │ - Validate substrate                                         │  │
│ │ [More workflows →]                                           │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 6. ABOUT ABARVA                                              │  │
│ │ Product · Philosophy · Roadmap                               │  │
│ │ [Read more →]                                                │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Footer: Last updated · Feedback · Report something missing        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Routes within Learn

```
/home/learn                     → Index page (the layout above)
/home/learn/quickstart          → Quickstart section
/home/learn/glossary            → Glossary index
/home/learn/glossary/:term      → Individual term (e.g., /glossary/strategic-move)
/home/learn/doctrine            → Doctrine reference index
/home/learn/doctrine/:topic     → Individual doctrine topic
/home/learn/agents              → Agents index
/home/learn/agents/:agent       → Individual agent (sentinel · atlas · nexus · steward)
/home/learn/workflows           → Workflows index
/home/learn/workflows/:slug     → Individual workflow
/home/learn/about               → About AbarVa
```

In this package, only the index pages render. Sub-pages (`/glossary/:term`, etc.) return a placeholder "Content coming soon" page.

---

## What's NOT in this package

- Glossary entry content (all terms placeholder)
- Doctrine reference content (placeholder)
- Agent detail pages (placeholder)
- Workflow guides (placeholder)
- Search functionality (scaffolded but disabled)
- Inline help / tooltips throughout the platform that link to Learn
- Cross-linking from agent responses to Learn (agent training / coordination concern)

These are scoped for the **Learn Content Package** which ships separately, after the journey kit run surfaces what users actually struggle with.

---

## Why ship the shell now (without content)

Three reasons:

1. **Reserve the route.** Other packages (Setup Redesign, AI Initiatives Substrate) shouldn't accidentally claim `/home/learn` for unrelated purposes. Reserving the route locks the destination.

2. **Establish discoverability pattern.** Other surfaces can start linking to Learn ("see glossary" link, "doctrine reference" link) even if the destination is a placeholder. When content lands, those links automatically resolve.

3. **Force structural decisions early.** Locking the 6 sections (Quickstart, Glossary, Doctrine, Agents, Workflows, About) prevents bikeshedding later. When content packages ship, they fill known sections instead of debating new structure.

Cost of shipping shell: ~half day. Benefit: all subsequent content lands cleanly.

---

## Acceptance criteria

```
✓ /home/learn route exists and renders
✓ All 6 sections visible per layout
✓ Search affordance present (disabled)
✓ Each section has at least placeholder content (no blank cards)
✓ Sub-routes (/home/learn/quickstart, /glossary, /doctrine, /agents, /workflows, /about) all 200 (with placeholder content)
✓ Cross-linkable from anywhere in platform (route is stable)
✓ Footer with feedback affordance present
✓ No broken images, no [object Object], no console errors
✓ Browser-Chrome verification: navigate to each section, screenshot
```

7+ screenshots minimum for QA on Learn panel alone.

---

## What this signals to users

When Castillo lands on Home and sees the Learn card, she knows:

1. There's a destination for product questions
2. The structure tells her what kinds of questions are answered (glossary · doctrine · agents · workflows)
3. Things are still being built ("Coming soon" is honest, not a sign of weakness)
4. She can come back later when she has time

This is the shell-as-promise pattern: ship the structure, fill the content over time, never have to apologize for missing surfaces because the surface promises what's coming.
