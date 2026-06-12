# Document Generation Model Policy

The single source of truth for which Claude model and token budget each kind of
work may use. Implemented in `src/lib/ai/document-generation-policy.ts`. Callers
must resolve model/token settings from here — do not hardcode them.

**Core rule:** serious deliverables must not run on chat-answer settings. Final,
client-facing artifacts get an Opus-class model, a generous token budget,
multi-pass generation, quality validation, citations, and durable storage.

## Tiers

| Tier                       | Use for                                                          | Default model (env-overridable)                           | Default max tokens                         | Multi-pass                   | Validation / citations / File Cabinet |
| -------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------ | ---------------------------- | ------------------------------------- |
| **Tier 1 — Chat**          | Short Nexus/Sentinel answers                                     | `claude-haiku-4-5-20251001` (`ABARVA_CLAUDE_CHAT_MODEL`)  | 1024 (`ABARVA_DOCGEN_CHAT_MAX_TOKENS`)     | no                           | no — **never a final deliverable**    |
| **Tier 2 — Working draft** | Preliminary drafts, internal analysis                            | `claude-sonnet-4-6` (`ABARVA_CLAUDE_WORKING_DRAFT_MODEL`) | 4000 (`ABARVA_DOCGEN_DRAFT_MAX_TOKENS`)    | no                           | no                                    |
| **Tier 3 — Board-grade**   | Final / near-final client-facing artifacts                       | `claude-opus-4-8` (`ABARVA_CLAUDE_BOARD_GRADE_MODEL`)     | 16000 (`ABARVA_DOCGEN_BOARD_MAX_TOKENS`)   | **yes**                      | **yes**                               |
| **Tier 4 — Large package** | RFPs, proposal packs, strategy memos, business cases, exec packs | `claude-opus-4-8` (`ABARVA_CLAUDE_LARGE_PACKAGE_MODEL`)   | 16000 (`ABARVA_DOCGEN_PACKAGE_MAX_TOKENS`) | **yes** (section-by-section) | **yes**                               |

Model ids and token budgets are **environment-configurable** so models can be
upgraded without code changes. Defaults deliberately do not starve final
deliverables.

## Deliverable → tier map (excerpt)

- **Tier 3 (board-grade):** Program Charter, Discovery Report, Current-State
  Assessment, Solution Design, Target Architecture, Operating Model, Estimate
  Model, Value Model, Mobilization Plan, Handoff Pack; Source Event Brief,
  Evidence Readiness, Vendor Discussion Guide, Proposal Health Summary, BAFO Ask
  Sheet, Contracting Handoff Pack.
- **Tier 4 (large package):** Roadmap, Business Case, Executive Playback;
  Sourcing Strategy Memo, RFP Package, Proposal Normalization Workbook,
  Evaluation Workbook, Pricing/Negotiation Memo, Executive Recommendation.
- **Tier 1/2:** Nexus/Sentinel chat (1), internal analysis / preliminary drafts (2).

**Unknown deliverable types fail SAFE to Tier 3** — a final-artifact path is
never silently starved to a chat budget because its key was unmapped.

## API

- `resolveDocumentPolicy({ deliverableType } | { tier })` → `{ tier, model,
maxTokens, multiPass, requiresValidation, requiresCitations,
requiresFileCabinet, isChatTier }`.
- `tierForDeliverable(type)` / `policyForTier(tier)`.
- `assertDeliverablePolicy(type)` — **the guard**: throws if a deliverable
  resolves to a chat tier or a budget at/below the chat ceiling. Call at
  deliverable-generation entry points.

## Retry / cost guidance

- Use the cheaper tier for classification/routing and validation where adequate.
- Use the working tier for evidence mapping; the board/package tier for the
  final rewrite.
- Cap runaway retries (the orchestrator's plan/render passes are bounded; do not
  loop indefinitely on malformed JSON — retry at most twice then fail honestly).
- Log token usage + estimated cost per artifact (workflow tag
  `deliverable:<module>:<type>:<pass>` already flows to the audited egress).

## Wiring status

- ✅ The orchestrator model-caller resolves its model from this policy by the
  deliverable's tier (env-overridable).
- ⏳ Next: route Source D09/D01/D05 and the remaining Moves/Source final paths
  through the orchestrator + this policy (PR-F/PR-G), replacing route-local
  Sonnet-4000 one-shot settings.
