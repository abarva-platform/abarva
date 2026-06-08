# Discovery Intake — execution backlog (Originate + Charter, then Diagnose)

*Chain of backlog items, ready to go one after another. Each = an isolated branch off `codex/corpus-wave-24`, PR'd back into it, verified before merge. Additive + feature-flagged (`DISCOVERY_INTAKE_V2`); the live Originate/Charter flow is untouched until each slice is proven. Design: [discovery-engine-design.md](discovery-engine-design.md) · front-of-funnel chain in the conversation · wireframe `wireframes/originate-charter-intake.html`.*

## Anti-bug rules (apply to every item)
1. Additive + flag-gated — no regression to the live flow.
2. Contract/types first — compile clean before wiring.
3. One server source of truth — agent panel + capture panel both render from it.
4. Reuse, don't rebuild — origination-submit, evidence-ingestion, Sentinel panel, board-grade renderers.
5. Never touch deterministic facts — extraction/generation → review-required, never auto-committed.
6. Verify every slice — tsc + unit/behavior tests + (UI) browser pass before merge.

## The chain

| # | Item | Scope | Reuses | Acceptance / verify | Status |
|---|---|---|---|---|---|
| **S1** | **Contract** | `DiscoveryShape` / `DiscoveryPlan` types + pure transformers (capture, completeness, gate-readiness, shape→plan, emit). No DB, no route, no UI. | content-model patterns | unit tests green · tsc clean | **IN PROGRESS** |
| **S2** | Persistence + conversational capture | Store shape/plan in `engagements.charter` JSONB (no migration); wire Originate/Charter agent flow to fill fields. | origination-submit.ts, charter packs | behavior tests · existing flow unaffected (flag off) | queued |
| **S3** | Upload → extract → field routing | Bring evidence-ingestion forward to P0/P1; route extracted facts to fields with provenance + review-gating. | evidence-ingestion.ts | integration test · review-pending honored | queued |
| **S4** | Context-layer pre-fill | Pre-fill known fields through the broker boundary. | AgentContextBroker | test · no direct broker import | queued |
| **S5** | Emit / handoff | `discoveryShape → discoveryPlan → Diagnose` continuity; Diagnose consumes the plan. | phase handoff | handoff test asserts plan reaches P2 | queued |
| **S6** | UI — agent panel + capture | Extend Sentinel panel (bounded, sticky Ask, AI-draft badge) + sub-tabbed capture, rendering from server state. | Sentinel panel | browser verify vs wireframe | queued |
| **S7** | Agent response rendering | Markdown→tables/lists inline; heavy/structured → downloadable artifact cards. | board-grade renderers | browser verify · no truncation | queued |
| **S8** | Template generators | Downloadable current-state assessment templates + interview-guide packs (XLSX/DOCX). | XLSX/DOCX renderers | unit + browser · round-trip (generate→fill→upload→extract) | queued |

**Deploy checkpoints:** after S5 (engine complete, no UI), and after S8 (full intake). Not per-slice.

**Risk hotspots & de-risk:** extraction hallucination → review-gating + provenance + adversarial verify · left/right drift → single server source of truth · backward-compat → flag + null-safe fields · tenancy → reuse scoping + RLS test · broken continuity → dedicated handoff test.
