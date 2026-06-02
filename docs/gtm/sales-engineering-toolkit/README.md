# AbarVa Sales Engineering Toolkit

Status: active draft
Owner: sales engineering / founder
Audience: founder, solution engineer, enterprise champion, security reviewer
Backlog task: T111 - Sales engineering toolkit

This folder is the in-repo sales engineering kit for enterprise pilot
conversations. It collects the minimum material needed to run a technical
buyer conversation without scattering the architecture, demo, ROI, and security
story across unrelated documents.

## Toolkit Contents

| Artifact | Use it for | Source anchors |
| --- | --- | --- |
| [Reference architecture deck outline](reference-architecture-deck.md) | 10-12 slide architecture walkthrough for CIO/CISO/enterprise architecture review. | `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md`, `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`, `docs/architecture/MODEL1_AZURE_CLAUDE_ROUTE_VALIDATION.md` |
| [Security review reference architecture deck](../../security/REFERENCE_ARCHITECTURE_SECURITY_REVIEW_DECK.md) | 15-slide CISO/security architecture leave-behind for pilot reviews. | `docs/security/INFOSEC-ACCELERATOR.md`, `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`, `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md` |
| [Demo script](demo-script.md) | 30-minute sales-engineering demo run of show. | `docs/demo/ABARVA_BOARDROOM_DEMO_SCRIPT.md`, `docs/demo/SOURCE_COMMERCIAL_INTELLIGENCE_DEMO_SCRIPT.md` |
| [ROI calculator template](roi-calculator-template.md) | Discovery worksheet for estimating value-at-stake, implementation cost, and payback. | `docs/gtm/D2-MONETIZATION-TIERS.md`, `docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md` |
| [Security one-pager](security-one-pager.md) | First-pass response for security and procurement teams. | `docs/pilot/SECURITY_POSTURE.md`, `docs/security/INFOSEC-ACCELERATOR.md`, `docs/pilot/SECURITY_CONTROLS_MATRIX.md` |
| [Competitive intelligence brief](../COMPETITIVE_INTELLIGENCE.md) | Internal differentiation against Glean, Hebbia, Writer, Anthropic, BCG, and McKinsey. | Public/official competitor pages checked on 2026-06-02. |

## How To Use

1. Start with the buyer role: CIO/enterprise architecture, CISO/security, CFO,
   COO/CDO, or AI transformation lead.
2. Pick one primary artifact and one supporting artifact. Do not send the full
   folder by default.
3. Before any external send, compare claims against the source anchors above and
   the latest release records under `docs/releases/records/`.
4. Use the demo script caveats verbatim when the environment is seed-driven.
5. When a buyer asks for a control, answer from the source document and link the
   canonical source, not this summary.

## Buyer Routing

| Buyer | Primary asset | Supporting asset | What to emphasize |
| --- | --- | --- | --- |
| CIO / enterprise architecture | Reference architecture deck | Demo script | Control plane vs private data plane, deployment options, integration path. |
| CISO / security reviewer | Security one-pager | Security review reference architecture deck | Current posture, known gaps, SSO/RBAC/RLS, release evidence, no hidden compliance claims. |
| CFO | ROI calculator template | Demo script | Value-at-stake, founder-time assumptions, payback, decision accountability. |
| COO / CDO | Demo script | ROI calculator template | Phase-gated moves, evidence-backed operating rhythm, accountable approvals. |
| AI transformation lead | Reference architecture deck | Demo script | Agent governance, model gateway, context broker, evidence trail. |

## Guardrails

- Do not claim SOC 2 certification, external pen-test completion, or production
  private data-plane operation unless the canonical security docs and release
  records say it is complete.
- Do not claim live LLM composition in demo environments unless the specific
  environment is configured and validated for live model calls.
- Do not claim customer raw data crosses the control plane. Use the documented
  architecture vocabulary: SaaS control plane, per-client private data plane,
  metadata manifests, evidence locators, and human approval gates.
- Do not hand-edit security, pricing, or architecture claims in this folder
  without also updating the source-of-truth document it summarizes.

## Maintenance

| Cadence | Check |
| --- | --- |
| Before a buyer meeting | Refresh caveats against the current demo environment and release records. |
| Monthly | Reconcile this folder with `docs/gtm/`, `docs/demo/`, `docs/pilot/`, and `docs/security/`. |
| After a material architecture change | Update the deck outline and security one-pager in the same PR as the source architecture record. |
| After pricing changes | Update the ROI template and cite the current pricing source. |
