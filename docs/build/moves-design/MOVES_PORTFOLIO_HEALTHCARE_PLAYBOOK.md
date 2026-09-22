# Moves Portfolio Model — Healthcare / Provider Playbook

> Extends `MOVES_BUILDING_BLOCK_SPINE.md` (one Move as lanes across phases) to the **portfolio** level: many Moves that *share* building blocks and *depend* on each other. Healthcare is the worked example; the portfolio concept is general.

## The new concept: Moves compose into a portfolio

A set of enterprise use cases is **not** seven unrelated Moves. It is a **portfolio** of Moves that share common building blocks — data foundation + semantic layer + analytics/intelligence + workflow automation + human-in-the-loop AI + controls/governance + Tower value tracking.

The key move is to separate two Move types:

- **Foundation Moves** — create the enterprise substrate (data, semantic layer, governed pipelines, control model). They are *enabling* Moves for automation, AI, analytics, and decisions — **not "just IT projects."**
- **Business-outcome Moves** — use the foundation to change work or decisions.

**Some use cases are prerequisites for others.** The building blocks are how AbarVa sees the shared substrate and the dependencies — which is what lets it **sequence** the portfolio instead of starting everything at once.

## 1. Classify the portfolio

**Foundation Moves**

| Use case | Why it's foundational |
|---|---|
| Unified clinical + claims data | Longitudinal patient/member/person view + data substrate |
| Data foundation for automation | Semantic layer, governed pipelines, data quality, AI-ready controls |

**Business-outcome Moves**

| Use case | Business outcome |
|---|---|
| Call center optimization | Agent productivity, first-call resolution, member/patient experience |
| Provider quality & performance | Quality performance, attribution visibility, provider benchmarking |
| End-to-end cost transparency | Cost-of-care and margin decisions |
| Payment integrity & leakage reduction | Reduce FWA, billing anomalies, claims leakage |
| Automated close & reporting | Less manual reconciliation, faster close |

## 2. The building blocks in healthcare terms

| Building block | Healthcare meaning |
|---|---|
| Process redesign | Care ops, call center, UM, finance close, payment-integrity workflows |
| Data readiness / remediation | Harmonize EMR, claims, pharmacy, provider, contract, GL, CRM data |
| Knowledge / retrieval copilot | Policy, benefit, contract, clinical guideline, coding, appeal, procedure Q&A |
| AI-assisted decision support | Prior-auth support, coding assist, anomaly scoring, next-best-action, quality-gap prioritization |
| Workflow automation | Routing, task creation, status, alerts, handoffs, exception queues |
| Human-in-the-loop agent | AI prepares/recommends; nurse, coder, finance analyst, agent, or investigator approves |
| Analytics / intelligence layer | Dashboards, benchmarks, cost/margin, quality, provider performance, payment integrity |
| System / platform implementation | Lakehouse, semantic layer, CRM, EMR integration, call center, data platform, MDM |
| Controls / governance / risk | HIPAA, PHI, audit, model governance, clinical safety, financial controls |
| Value tracking / operating cadence | Tower metrics, baselines, targets, cadence, realized value |

## 3. Portfolio map by use case

### A. Unified clinical + claims data — *"Create a Longitudinal Patient and Cost Data Foundation"* (Foundation)
**Blocks:** Data readiness (main) · Analytics layer · System/platform implementation · Controls/governance · Value tracking.
**P2:** What data exists / where fragmented / what identifiers link patients-members-providers / quality gaps / what's trusted.
**P3:** Data architecture + semantic model — lakehouse ingestion, identity resolution, clinical/claims/pharmacy harmonization, semantic layer, governed data products.
**P4 workstreams:** EMR ingestion · claims ingestion · pharmacy integration · provider attribution · identity resolution · semantic layer · data-quality controls · security/access · analytics enablement.
**Tower:** data freshness · completeness · match rate · certified data products · downstream use cases enabled · analyst cycle-time reduction.

### B. Data foundation for automation — *"Build the AI-Ready Data and Semantic Foundation"* (Foundation)
**Blocks:** Data readiness (main) · Controls/governance (critical) · System/platform implementation · AI-assisted decision support (later) · Human-in-the-loop (later) · Value tracking.
**P2:** Which workflows need automation / required data / missing fields / brittle pipelines / inconsistent definitions.
**P3:** Design governed pipelines + semantic layer **before** building AI workflows.
**Advisory point AbarVa must say:** *Do not start with prior-auth or coding automation if the data foundation, semantic definitions, and control model are not ready.*
**Tower:** pipeline reliability · data-quality score · semantic-layer adoption · AI-workflow readiness · automation workflows certified.

### C. Call center optimization — *"Improve Call Center Resolution with Agent Assist"*
**Blocks:** Process redesign · Data readiness · Knowledge copilot · AI-assisted decision support · Human-in-the-loop · Workflow automation · Controls/governance · Value tracking.
**P2 evidence:** call transcripts · CRM disposition · claims inquiry · AHT/FCR · escalation reasons · knowledge articles · agent feedback · QA results.
**P3 options:** (1) Knowledge assist — policy/claim Q&A with citations (fast phase one); (2) Intent + next-best-action (better experience); (3) Full workflow automation (later, after controls).
**P4 workstreams:** transcript ingestion · knowledge corpus · CRM integration · agent-assist UX · QA/control design · pilot training · metric dashboard.
**Tower:** AHT · FCR · transfer rate · abandonment · agent adoption · QA score · member satisfaction · repeat calls.

### D. Provider quality & performance — *"Improve Provider Quality and Performance Visibility"*
**Blocks:** Data readiness · Analytics layer (main) · Controls/governance · Workflow automation · Value tracking.
**P2 evidence:** quality-measure definitions · claims/encounter · EMR clinical · provider roster · attribution rules · quality-gap lists · provider contracts · dashboards.
**P3:** curated datasets, attribution logic, quality-measure definitions, provider dashboards, outreach workflows.
**Tower:** quality-gap closure · measure completeness · attribution accuracy · dashboard adoption · performance variance · intervention completion.

### E. End-to-end cost transparency — *"Create Cost-of-Care and Margin Transparency"*
**Blocks:** Data readiness · Analytics layer (main) · Controls/governance · System/platform implementation · Value tracking.
**P2 evidence:** claims · capitation · provider contracts · GL · product hierarchy · population definitions · cost-allocation rules · existing margin reports.
**P3:** governed cost/margin semantic model by product, provider, population, contract type.
**P4 workstreams:** data reconciliation · cost-allocation model · contract-term mapping · margin dashboard · finance governance · executive review cadence.
**Tower:** cost-model coverage · margin-report cycle time · reconciliation variance · decisions supported · identified margin opportunities.

### F. Payment integrity & leakage reduction — *"Reduce Payment Leakage and Billing Anomalies"*
**Blocks:** Data readiness · Analytics layer · AI-assisted decision support · Human-in-the-loop · Workflow automation · Controls/governance · Value tracking.
**P2 evidence:** claims history · payment policies · provider contracts · known FWA cases · edit rules · denial/appeal data · provider patterns · recovery outcomes.
**P3 options:** rule enhancement · analytics anomaly layer · investigator workbench (prioritize cases with evidence + rationale) · automated denial (**usually not recommended first**).
**P4 workstreams:** claims data model · anomaly analytics · case scoring · investigator workflow · policy review · false-positive controls · recovery tracking.
**Tower:** leakage identified · recoveries · prevented payments · false-positive rate · case cycle time · investigator productivity · appeal-overturn rate.

### G. Automated close & reporting — *"Accelerate Financial Close and Reporting"*
**Blocks:** Process redesign · Data readiness · Workflow automation · Analytics layer · AI-assisted decision support · Controls/governance · Value tracking.
**P2 evidence:** close calendar · reconciliation logs · manual journal entries · reporting package · variance explanations · approval workflow · control issues · data-refresh timing.
**P3:** governed reporting pipelines, automated reconciliation workflow, variance-explanation support, approval controls.
**Tower:** days to close · manual-journal volume · reconciliation aging · reporting cycle time · control exceptions · manual-effort hours.

## 4. How this works across phases (portfolio-aware)

- **P2** — the selected blocks generate the **evidence contract**, made *domain-specific*. A use case with Data-readiness + Analytics + Controls asks for source inventory, data-quality profile, business definitions, ownership, current reports, control rules, baselines. Add Human-in-the-loop → it *also* asks for human decision points, override history, approval rules, exception patterns, error/quality outcomes. **Phase-specific and domain-specific without hundreds of archetypes.**
- **P3** — blocks become **design lanes** (call center: knowledge lane, data lane, AI-decision lane, workflow lane, controls lane); architecture is designed against the lanes.
- **P4** — lanes become **workstreams** (transcript+CRM ingestion · knowledge/retrieval · agent-assist UX · control/QA · pilot training · Tower metrics).
- **P5** — workstreams become **owners** (call-center ops → workflow · IT → CRM integration · Compliance → scripts/PHI · Training → adoption · Tower owner → metrics).
- **Tower** — measures each lane (data quality · AI adoption · human-override rate · workflow throughput · quality/compliance · business value).

## 5. What this means for a provider — guardrails first

The most important product behavior in healthcare is **guardrails.** AbarVa should repeatedly say: *This is healthcare. Do not automate clinical, financial, or eligibility decisions beyond readiness. Start with evidence, recommendations, human review, controls, and measurement.*

| Use case | Safe phase-one posture |
|---|---|
| Prior auth | Assist review / prepare packet — **not autonomous denial** |
| Coding | Suggest codes / flag gaps — coder approves |
| Utilization management | Recommend review priority — clinician decides |
| Payment integrity | Prioritize cases — investigator validates |
| Quality performance | Identify gaps — care/quality team acts |
| Call center | Suggest next action — agent decides |

## 6. Portfolio sequencing (waves)

Do **not** start all use cases at once. Sequence by dependency + readiness:

- **Wave 1 — Foundation:** unified clinical + claims data · AI-ready semantic layer · cost-transparency foundation.
- **Wave 2 — Low-risk, high-value workflows:** call-center agent assist · financial-close reporting automation · provider-quality dashboards.
- **Wave 3 — Higher-control AI decision support:** payment-integrity investigator workbench · prior-auth / UM support · coding assist.
- **Wave 4 — Scaled operating model:** cross-workflow automation · Tower-managed value realization · advanced contract/payment/provider analytics.

## 7. How AbarVa presents it — the portfolio view

| Move | Foundation dependency | Readiness | Recommended first step |
|---|---|---|---|
| Call center agent assist | CRM + claims + knowledge corpus | Medium | Knowledge assist + intent detection |
| Payment integrity | Claims + provider + policy data | Medium-low | Investigator workbench, not auto-denial |
| Cost transparency | Claims + GL + contracts | Low-medium | Semantic cost model first |
| Provider quality | Claims + EMR + attribution | Medium | Curated quality dataset + dashboards |
| Automated close | GL/subledger + workflow | Medium | Close workflow + dashboard |

This portfolio view — Move × foundation dependency × readiness × recommended first step — is where AbarVa feels like a real transformation operating system, not a bag of point solutions.

## Bottom line

For the healthcare/provider portfolio, the building blocks let AbarVa: **(1)** ask for the right evidence in P2; **(2)** shape the right solution lanes in P3; **(3)** convert lanes into workstreams and value in P4; **(4)** enforce healthcare-appropriate human review, controls, and Tower measurement. The blocks are **not archetype labels** — they are reusable operating lanes that make each Move more specific, safer, and executable, and reusable *foundations* that let a portfolio be sequenced rather than attempted all at once.

**Product implication (beyond the single-Move features in `MOVES_BUILDING_BLOCK_SPINE.md`):** Moves need a **portfolio layer** — Move classification (foundation vs outcome), a shared-foundation dependency graph, readiness-based wave sequencing, and the portfolio view above.
