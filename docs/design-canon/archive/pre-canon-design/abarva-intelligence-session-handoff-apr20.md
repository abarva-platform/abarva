# AbarVa Intelligence Design · Session Handoff
**Date:** April 20, 2026
**Session status:** Packets 1–8 complete · Packet 9 pending · Programs page queued next

---

## TL;DR for next-session Claude

Anand and I just completed 8 of 9 packets designing the AbarVa Intelligence page in a single extended session. The canonical spec is at `abarva-intelligence-design-spec.md` in this same outputs folder (1,598 lines). If you're picking this up cold, **read that file first** — it's the source of truth.

What's left: Packet 9 (Claude Code build execution packet) to finish Intelligence. Then pivot to the Programs page with the same 9-packet rigor.

---

## Where we are

### Completed this session
- **Packet 1** · Page architecture (4 zones × 3 states × 3 breakpoints, routing, performance)
- **Packet 2** · Nexus behavior model (3 modes × 6 capabilities, voice calibration, triggers)
- **Packet 3** · Response formats + data architecture (8 formats, 6-phase pipeline, assembler)
- **Packet 4** · Agent orchestration + governance (Nexus + 5 specialists, ephemeral/persistent, privacy)
- **Packet 5** · Wireframes part 1 (State A Dormant + State B Engaged)
- **Packet 6** · Wireframes part 2 (6 capabilities in action)
- **Packet 7** · Screen-by-screen spec (TypeScript contracts, API endpoints, Postgres+Neo4j+Pinecone models, 10 flows, errors, WCAG 2.2 AA, analytics)
- **Packet 8** · Prat demo script (T0–T8) + 12 anticipated Q&As + cross-links

### Next immediate step
- **Packet 9** · Claude Code build execution packet. Covers SQL migrations, file-by-file changes, sequencing, QA gates, smoke tests, rollback, dual-engine Claude Code + Codex strategy. Designed to paste into Claude Code.

### Then
- **Programs page design** — same 9-packet structure, same rigor. Anand explicitly queued this. Four tensions already flagged (lifecycle UI across 6 phases · 17-module render pattern · multi-role composition · Nexus role shift from research to delivery).

---

## Canonical visualizations rendered in chat (for reference)

These are HTML mockups rendered as interactive widgets during the session. They're referenced in the spec doc as `[VIZ reference — <name>]`:

| Visualization | Purpose |
|---|---|
| `abarva_intelligence_page_wireframe_v1` | Initial zone structure (4 zones) |
| `abarva_nexus_program_pivot_response` | Mode 3 takeover shape |
| `abarva_nexus_research_with_floater` | Mode 2 with floater layout |
| `abarva_nexus_artifact_ephemeral_mode` | Artifact format with governance |
| `abarva_data_architecture_3_dimensions` | Graph × Vector × Structured triple |
| `abarva_intelligence_page_state_diagram` | States A, B, C side-by-side |
| `abarva_query_traversal_pipeline` | 6-phase retrieval pipeline |
| `abarva_agent_orchestration_map` | Nexus + 5 specialists |
| `abarva_wireframe_state_a_dormant` | Full State A landing |
| `abarva_wireframe_state_b_engaged` | Full State B engaged |
| `abarva_wireframe_clarifying_questions` | Capability 1 |
| `abarva_wireframe_multimodal_ingest` | Capability 2 |
| `abarva_wireframe_cross_client_cohort` | Capability 3 |
| `abarva_wireframe_state_c_deep_dive` | Capability 5 |
| `abarva_wireframe_counter_argument` | Capability 6 |
| `abarva_wireframe_persona_lens` | Capability 4 |
| `abarva_ml_roadmap_24_months` | ML tier timeline |

When building the Programs page, render new visualizations with similar naming: `abarva_programs_*`.

---

## Key decisions locked (non-negotiable)

1. **Classifier is deterministic rule-based**, not LLM-soft. LLM reasons *within* a mode, not across modes.
2. **Nexus is the single face.** 5 specialists (Intake, Evidence, Contradiction, Value, Decision) never speak to users — only appear in provenance.
3. **Query-layer tenancy enforcement.** Cross-tenant leaks fail at DB, not application policy.
4. **Cohort minimum n=3** for emergent layer surfacing. Below that: "insufficient peer data."
5. **One-way promotion** from ephemeral → persistent. Never reverse.
6. **Composition ceiling = 3 capabilities per turn.** Beyond → split into follow-ups.
7. **Max 1 clarifying question per turn, ever.**
8. **LLM choice:** Claude Opus 4.7 for Nexus, Haiku 4.5 for classifiers. Voyage-3 for embeddings day one.
9. **ML scope = Option A.** Stay simple until seed. Full ML platform = post-seed workstream.
10. **Pipeline hard cap = 15s.** Beyond → Format 8 "I don't know" with redirect.
11. **Artifacts ephemeral by default** with `expires_at` = session end + 24hr grace.
12. **Audit log 7-year retention** minimum, never purged even on client deletion.
13. **Composite demo clients** (Meridian, First Capital, Apex) disclosed honestly when probed.

---

## Demo-critical data (Meridian composite)

Used throughout Prat demo in Packet 8:
- 42 use cases, 109 vendor deployments, 7 live contradictions
- 847 patterns in library, 312 benchmarks, 4 active programs
- 847K ED visits/yr, Cerner-native
- **The hook flag:** $2.3M Abridge/DAX shadow-budget contradiction
- Prat's VIP profile: Target EVP CIPO, ex-Kaiser SVP/CDO, MIT Sloan, builder culture

---

## Files in this outputs folder

1. `abarva-intelligence-design-spec.md` — master canonical spec (1,598 lines, 75KB)
2. `abarva-intelligence-session-handoff-apr20.md` — this doc

Both should be committed to the AbarVa repo. Suggested path:
- `docs/design/abarva-intelligence-design-spec.md`
- `docs/design/sessions/abarva-intelligence-session-handoff-apr20.md`

---

## Open threads / pending decisions

- **GPT is drafting an end-to-end spec separately** — Anand will send for Claude red-team review when ready
- **Dual-engine execution planned** across Claude Code + Codex with worktree strategy (Packet 9 detail)
- **Programs page tensions** flagged but not yet resolved (queued for that page's Packet 1)

---

## Session tone notes (for continuity)

Anand is velocity mode, mobile typing ALL CAPS, 12+ hours deep-work. He explicitly corrected Claude twice this session: (1) stop presenting multiple-choice options and lead execution; (2) don't go off tangent — make interactive. Appreciates senior-partner confidence, direct decisions with "Calls I made (override any)" sections. Likes structured delivery with progress toolbar visualizations every turn. Dislikes consulting-vocabulary fluff ("engagements" rejected, "programs" adopted).

**Do not** ask him which packet to work on next. Just march. He'll redirect if needed.

---

## CRITICAL naming/attribution rules

Never reference in any AbarVa artifact: CADE, Accenture, Dell, McKinsey, Deloitte, BCG, Bain, Huron, Navigant, Presbyterian, PHS, MD Anderson, CommonSpirit, HP Inc.

Use instead: "Fortune 50 CTO," "senior AI executive," "top consulting firm," "leading advisory firms," "major healthcare system."

Company name is always **AbarVa** (not ABARVA, not Abarva).

Composite clients are **Meridian Health System** (healthcare), **First Capital Financial** (FinServ), **Apex Retail Group** (retail). Always "composite organizations built from real-world data."

---

## Production context

- Live at https://nexus-vert-kappa.vercel.app (deployed April 9, 2026)
- Repo at github.com/anandsundaram-hash/abarva (private)
- Demo window: days away (Prat + Shail Jain)

---

*End handoff.*
