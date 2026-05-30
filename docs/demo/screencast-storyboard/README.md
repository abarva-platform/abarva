# P13 IT-Productivity Screencast Storyboard

Target asset: 6-minute screencast or annotated storyboard
Status: storyboard complete; live recording is gated by authenticated Apex demo credentials and stable production smoke.

## Shot List

| Time | Shot | Screen | Annotation |
|---:|---|---|---|
| 0:00-0:20 | Title frame | Apex Retail CTO / IT Productivity | "One CTO question becomes an executable decision path." |
| 0:20-0:45 | Intelligence Enterprise Context | `/intelligence/ask` | Highlight Apex context loaded: app portfolio, org topology, DORA, tools, vendors. |
| 0:45-1:15 | Ask question | `/intelligence/ask` | Paste the IT-productivity question. |
| 1:15-2:05 | Sentinel six cards | `/intelligence/ask` | Callouts: citations, dissent, "what would change my view", audit trace. |
| 2:05-2:40 | Shape Moves | `/intelligence/ask` | Click the CTA and annotate "reasoning -> execution". |
| 2:40-3:20 | Portfolio DAG | `/tower/portfolio-dag` | Show parent Move, five sibling Moves, and AMS Source workflow edge. |
| 3:20-4:30 | IT-Productivity Move | `/tower/programs/[programId]/value` | Show 9 gates and 8 value layers: projected, tracked, verified. |
| 4:30-5:25 | AMS Optimization Source | `/source/events/apex-retail-ams-outsourcing-2026` | Show vendor portfolio diagnostic, concentration, leakage, and outcome clauses. |
| 5:25-6:00 | Public comparison close | `/how-it-works/it-productivity-comparison` | Show generic LLM vs Sentinel and AI Egress Control Plane banner. |

## Narration

"This is the Apex CTO gold path. We start with a normal executive question: how do I improve IT productivity using AI SDLC tools? A generic model can give a plausible checklist. AbarVa has to do more. It uses Apex context, corpus patterns, Move templates, Source workflows, and AI Egress governance to form a view that can be executed and audited."

"The key moment is the Shape Moves click. The answer becomes a portfolio: the IT-Productivity Move, five sibling Moves, and the AMS Optimization Source workflow. Tower then tracks value as projected, tracked, or verified. Source handles vendor portfolio diagnostics outside the productivity Move so sourcing economics do not get confused with engineering-productivity gates."

## Capture Checklist

- Browser zoom 100 percent.
- Hide bookmarks and unrelated tabs.
- Use Apex Retail signed-in session.
- Keep cursor movement slow around the Shape Moves CTA, DAG nodes, and verified-value labels.
- If auth fails, record the public comparison and framework pages only and label the authenticated path as storyboarded.
- Do not claim live external model calls during the public comparison; the page uses cached/static content.

## Evidence Needed Before Final Recording

- Public smoke passes for comparison and framework pages.
- Authenticated smoke passes or is explicitly marked Clerk-gated in `EXECUTION_STATUS.md`.
- Production deploy URL is recorded separately from local and preview URLs.
