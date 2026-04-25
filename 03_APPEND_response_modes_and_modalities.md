## Response modes and UX modalities · Cycle 4 revision

**Added:** Cycle 4 canon revision session · April 24, 2026
**Addresses:** Conflict C4 from canon-vs-existing cross-check documented in commit `1653852`

This section reconciles the **7 response modes** specified in this document's GPT refinement addendum with the **5 UX modalities** specified in `docs/design-canon/agent-interaction-design-thinking.md`. Both taxonomies apply; they classify different axes.

### The two orthogonal axes

**Response modes (7, specified in this document):** classify the *content type* the agent is producing.

- `status` — current state reporting
- `diagnostic` — why-something-is-stuck reasoning
- `recommendation` — what-to-do-next guidance
- `artifact` — produce a deliverable
- `evidence` — source-and-why explanation
- `executive` — portfolio-level synthesis
- `refusal_or_caveat` — context-missing or unsafe-to-answer

**UX modalities (5, specified in `agent-interaction-design-thinking.md`):** classify the *UX surface shape* the response renders through.

- Named recommendation (structured advisory block)
- Framed choice (3-chip guided selection)
- Long response (prose response with reasoning)
- Structured document (formatted deliverable)
- Free-text escape (conversational fallback)

### How they compose

Every agent turn has exactly one response mode AND exactly one UX modality. They combine orthogonally.

**Examples:**

- Response mode `recommendation` + UX modality `named recommendation` → Nexus surfacing a specific next action in a structured advisory block ("Schedule CXO touchpoint 2 by Thursday")
- Response mode `diagnostic` + UX modality `long response` → Nexus explaining why a gate is blocked in prose
- Response mode `artifact` + UX modality `structured document` → Nexus generating a Decision Memo with headers and evidence
- Response mode `status` + UX modality `framed choice` → Nexus opening with state narration and closing with 3 context-generated action chips
- Response mode `executive` + UX modality `named recommendation` → Atlas portfolio editorial leading Tower with a specific pressure
- Response mode `refusal_or_caveat` + UX modality `free-text escape` → Nexus declining to fabricate a financial figure and explaining what would unlock the claim

### Which axis governs which decision

- **Response mode** is chosen by the agent based on Context Bundle contents and user intent classification. It answers "what kind of content am I producing?"
- **UX modality** is chosen by the surface based on the response mode and the interaction context. It answers "what shape should this content render in?"

### Enforcement

Every implemented agent response must declare both. Observability logs capture both. Crawler personas test both. A response tagged with only one is incomplete.

### Anti-patterns this prevents

- **The modality-confusion anti-pattern.** Choosing a UX modality without knowing the response mode produces mismatched UX (e.g., rendering an `artifact` response as a `framed choice` with 3 chips — absurd).
- **The mode-confusion anti-pattern.** Choosing a response mode without considering the UX surface produces awkward renderings (e.g., `executive` synthesis forced into a `free-text escape` conversational bubble).

Both taxonomies stay authoritative. Existing `docs/design-canon/agent-interaction-design-thinking.md` remains the source of truth for UX modalities. This document remains the source of truth for response modes.
