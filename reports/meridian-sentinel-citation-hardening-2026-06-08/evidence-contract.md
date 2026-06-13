# Meridian Sentinel/Nexus — Evidence & Answer Contract

Two enforced contracts: (1) the **answer contract** (synthesis layer, #3323) and
(2) the **evidence-display contract** (UI, #3324 / #3322).

## 1. Answer contract (healthcare, vertical-gated)
`src/lib/intelligence/synthesis/healthcareAnswerContract.ts`. Applied only when the
tenant vertical is Healthcare (Meridian/PHS); other tenants unchanged. Every serious
answer should carry this spine (adaptive, concise — not a rigid template):
1. **My read** — the specific take on THIS client's situation.
2. **Why it matters** — named lens: clinical / operational / financial / data / compliance.
3. **Evidence basis** — separate **client facts** (Meridian context) from **healthcare
   industry patterns** from **inference**; reference what grounds each claim.
4. **Decision fork / options.**
5. **What I'd do next** — name the artifact/work product (charter, business case,
   solution architecture, RFP, control-tower metric set …).
6. **Value / risk implication** — no unsupported ROI; flag weak assumptions / missing baselines.
7. **Evidence gaps** — what's missing to be decision-grade.
8. **Human approval / governance** — required for implied clinical action; human-in-the-loop.

Hard rules: never invent clinical metrics, Epic modules, vendors, or denial/MLR/Stars
numbers; never give patient medical advice; no raw internal IDs in prose; no boastful
framing; non-fabrication / honest "reasoning from domain expertise, clearly labeled"
when grounded context is absent.

## 2. Evidence-display contract (UI)
`EvidenceBasis` (`src/components/intelligence/EvidenceBasis.tsx`, `src/components/agent/EvidenceBasis.tsx`).
For every answer the UI shows:
- **Source groups**: Client facts (TENANT/GRAPH) · Healthcare patterns
  (PATTERN/BENCHMARK/INSIGHT/WORLDVIEW/RESEARCH/REGULATION/TOPIC/VENDOR) · Inference (GENERAL/SURFACE).
- **Confidence**: per-item High (≥0.85) / Partial (≥0.6) / Low; aggregate downgraded to
  "Partial evidence" if inference-only or coverage non-full (never overclaims High).
- **Provenance/excerpt** with PHI-adjacent raw IDs + filesystem paths SCRUBBED from the
  main view (internal IDs only behind a Details toggle).
- **Missing evidence** group from `coverageReport`.
- **Citation gap** warning ONLY when `sources.length === 0` (honest; never silenced when
  evidence is genuinely absent).

## 3. Safety + isolation invariants
- Tenant-scoped retrieval (`WHERE client_id = $1`) + tenant-identity-pin synthesis guard;
  no cross-tenant data, no tenant switcher.
- No patient medical advice; clinical actions require human review/governance.
- No PHI/PII in logs, metadata, or UI evidence snippets.
