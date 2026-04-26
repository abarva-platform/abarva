# Page Workflow Enforcement Rules
**Authority: PX1 · Wave 20**

## Rule 1 — Blueprint Before Build
No page implementation may begin without a completed page blueprint satisfying the PAGE_EXPERIENCE_BLUEPRINT_STANDARD.

## Rule 2 — Blueprint Completeness Gate
A blueprint is complete only when it includes all 10 mandatory sections.
An incomplete blueprint is treated as missing.

## Rule 3 — New Route Gate
A new UI route must prove, before PR merge:
- [ ] Design canon followed (AbarVa palette, no teal, no full-dark, no sparkles)
- [ ] Page blueprint followed (all 10 sections satisfied)
- [ ] Agent-centric enforcement followed (AGENTX rules 1-10)
- [ ] Deterministic/live caveat included where data is seed-based
- [ ] Route ownership documented

## Rule 4 — UI PR Final Report Mandatory Fields
Every PR that adds or modifies a page must include in its PR description:
- Blueprint followed: yes / no / deferred (with reason)
- Blueprint deviations: list any intentional deviations
- Design canon followed: yes / no
- Agent-centric enforcement followed: yes / no
- Screenshots or manual review notes: if available

## Rule 5 — Design Review Failure Triggers
A page automatically fails design review if:
- Its blueprint does not exist
- Its blueprint is missing 3 or more of the 10 sections
- Agent guidance is generic (AGENTX Rule 9)
- The primary question is not answerable in 10 seconds
- A banned visual pattern is used (teal, full-dark, sparkles, chat-first)
- Missing data is hidden instead of disclosed

## Rule 6 — Legacy Shell Retirement
Routes identified as using legacy shell (TopBar.tsx / PrimaryNav.tsx) must be migrated before a related new feature lands on the same route.

## Rule 7 — Deterministic Data Disclosure
Any page rendering deterministic seed data must include a visible caveat.
Caveat must name: what is seed-based, what is missing, and what would change with live data.

## Rule 8 — Agent Panel Minimum Viable Structure
See AGENTX enforcement standard.
Every agent panel must contain: agent identity, workflow object, context used, evidence state, recommended action, blocker (if any), caveat.
