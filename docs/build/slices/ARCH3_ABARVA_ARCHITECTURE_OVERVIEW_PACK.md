# ARCH3 · AbarVa Architecture Overview Pack

**Slice ID:** ARCH3
**Slice name:** AbarVa Architecture Overview Pack
**Category:** architecture
**Status:** code_complete
**Risk:** low
**Created:** 2026-04-26
**Author:** Code (sole)
**Type:** Specification / architecture documentation only — no application
code, no runtime modification, no migrations, no model calls.

---

## Goal

Produce a complete, founder-reviewable, board-ready architecture
overview pack for the AbarVa platform. The pack covers all eleven
architectural planes, the full request-to-output execution flow, the
data and evidence ingestion pipeline, the Azure reference deployment
target, the private data plane model, the Model Gateway and Tool Plane
deep dives, and the Agent Mission Runtime.

This pack is the canonical reference for enterprise architects, security
reviewers, and board-level technology reviewers who need the full
topology before evaluating an AbarVa deployment.

---

## Files created

| File | Description |
|---|---|
| `docs/architecture/ABARVA_ARCHITECTURE_OVERVIEW.md` | Top-level plane map; all 11 planes; how planes interact; document map |
| `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md` | Per-plane deep dive: purpose, key components, interfaces, Mermaid diagrams, implementation status |
| `docs/architecture/ABARVA_REQUEST_TO_CONTEXT_FLOW.md` | Full request → context → agent → output Mermaid sequence diagram; 16-step path; surface variation table |
| `docs/architecture/ABARVA_DATA_EVIDENCE_FLOW.md` | Data ingestion → evidence usability Mermaid flowchart; 7-stage pipeline; evidence ledger projection; trust scoring |
| `docs/architecture/ABARVA_AZURE_REFERENCE_TARGET.md` | Azure VNet layout; AKS; Key Vault; Azure OpenAI; Postgres Flexible Server; NSGs; DR targets |
| `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md` | SaaS Control vs. Private Data Plane; data residency; CMK; tenant isolation; trust boundaries |
| `docs/architecture/ABARVA_MODEL_GATEWAY_AND_TOOL_PLANE.md` | Gateway contract; provider abstraction; model routing; rate limiting; tool registry (TOOL2); tool invocation flow; SEC1 policy gate |
| `docs/architecture/ABARVA_AGENT_MISSION_RUNTIME.md` | Nexus / Sentinel / Atlas / Steward roles; mission queue; mission lifecycle; context injection; output constraints; audit trail; platform event loop |
| `docs/build/slices/ARCH3_ABARVA_ARCHITECTURE_OVERVIEW_PACK.md` | This file — slice contract |

---

## JSON updates

- **`docs/build/build-slices.json`** — ARCH3 entry appended after OPS9.
- **`docs/build/production-readiness.json`** — notes appended to
  `data_evidence_knowledge_fabric` and `agent_runtime` components.
- **`docs/build/build-waves.json`** — wave-11 entry appended.

---

## Validation status

- TypeScript: no application code added; tsc --noEmit passes (docs only).
- Build: no runtime code changes; Next.js build is not affected by this
  slice.
- No migrations, no seed changes, no new source files in `src/`.

---

## Honest constraints

- All documents in this pack are specification-only. No application code,
  runtime wiring, or database mutations are included.
- Documents describe the target architecture; implementation status
  sections are explicit about what is live vs. deferred.
- No `createdFrom: 'gateway_compose'` anywhere in this slice —
  everything is `human_authored` specification.
- This slice does not promote any production-readiness component status.
  The architecture overview documents the current state and the
  production target; it does not change the implementation state.
