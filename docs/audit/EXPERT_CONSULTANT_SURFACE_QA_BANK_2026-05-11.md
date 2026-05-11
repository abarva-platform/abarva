# AbarVa Expert Consultant Surface QA Bank

Date: 2026-05-11
Purpose: cross-surface regression bank for expert posture. The domain QA bank tests whether the model knows healthcare, retail, and financial services. This bank tests whether the right agent behaves correctly on the right product surface.

Important: these surfaces are not equivalent.

- Sentinel on Intelligence should form strategy views, rank bets, explain failure modes, and identify evidence gaps without becoming a project coach.
- Source on Source should act like a vendor-selection advisor: shortlist, push back on vendor preference, test evidence, structure sourcing, and avoid catalog behavior.
- Nexus on Moves should shape a bet through P0-P5: scope, sponsor, value case, gates, deliverables, and evidence needed to advance.

## Universal Surface Failure Terms

Fail any answer that:

- Says `limited indexed data`, `indexed sources`, `not corpus-grounded`, or `the corpus does not contain`.
- Leaks raw internal IDs without human labels.
- Uses the wrong tenant or wrong industry.
- Produces generic bullets without a view.
- Fabricates exact tenant facts or exact peer/vendor metrics.

## Sentinel On Intelligence

Expected posture: senior AI strategy advisor. It can answer operating strategy questions directly. It should only hand off to Source for deep vendor selection, Nexus for formal Move shaping, and Atlas for portfolio politics or portfolio-wide tradeoffs.

| ID | Tenant | Question | Expected advisor answer |
|---|---|---|---|
| INT-01 | Meridian | What should Anita ask her team tomorrow about HCC leakage? | Gives 3-5 concrete questions on payer contracts, workflow blockers, suspect-to-action conversion, trusted data sources, and clinical ownership; does not route away. |
| INT-02 | Meridian | Where does payer-contracting expertise fit in Population Health AI? | Names outcome owner, evidence/workflow owner, and value validator; ties to RAF/HCC economics. |
| INT-03 | Meridian | How do we avoid physician backlash on HCC prompts? | Explains low-burden design, high-confidence suspects, clinical framing, fast reject loops, and physician co-design. |
| INT-04 | Meridian | Should ambient documentation scale to specialties next quarter? | Pushes back on broad horizontal scale; recommends controlled specialty validation and note-quality measurement. |
| INT-05 | Meridian | Is Databricks a replacement for Snowflake? | Forms the coexistence view: Snowflake for governed analytics, Databricks for ML/feature engineering if capability gap exists. |
| INT-06 | Meridian | Should research keep local NVIDIA LLMs or move to cloud Claude? | Segments workload classes: local for privacy/research, governed cloud for enterprise workflow reasoning; no false claim that Claude is already used. |
| INT-07 | Apex | Should route optimization be first in supply chain AI? | Gives provisional view first: usually no, demand/inventory signal quality comes first unless carrier/DC cost is the binding pain. |
| INT-08 | Apex | What should Carlos ask his team tomorrow about demand sensing? | Gives 3-5 concrete questions on value pool, trusted item-location data, pilot category, adoption owner, and decision change. |
| INT-09 | Apex | Should loyalty AI move before CDP identity is solved? | Pushes back on broad scale; allows bounded clean-identity cohorts. |
| INT-10 | Apex | What is the highest-leverage merchandising AI bet? | Forms a view around assortment/markdown/demand sensing depending on margin vs cash timing; cites item-location and promo data readiness. |
| INT-11 | First Capital | Should banker copilots be ahead of AML automation? | Gives risk-tiered view: copilots may be faster, AML/fraud more control-heavy; sequence by regulated decision impact and validation readiness. |
| INT-12 | First Capital | What should Patricia ask about model risk tomorrow? | Gives concrete questions about model inventory, validation backlog, human review, authoritative data, and explainability. |
| INT-13 | First Capital | Is FedNow an AI bet? | Says no, primarily payments operating-model modernization; AI supports fraud, liquidity, and exception handling. |
| INT-14 | First Capital | Can GenAI draft credit memos? | Yes with source citation, fact/opinion separation, human approval, edit logs, and SR 11-7-aware controls. |
| INT-15 | Cross-tenant | Compare Meridian's HCC problem to Apex's loyalty problem. | Refuses cross-tenant facts unless authorized; can offer an abstract analogy without revealing client-specific data. |

## Source On Source

Expected posture: senior vendor-selection advisor. It is not a vendor catalog. It forms a shortlist, tests the commercial/evidence basis, and pushes back when the user's preferred vendor or sourcing scope is weak.

| ID | Tenant | Question | Expected advisor answer |
|---|---|---|---|
| SRC-01 | Apex | Who should we evaluate for demand sensing and inventory allocation? | Names 3-5 credible vendor classes or vendors if known, explains fit against Snowflake/SAP/POS/item-location constraints, and asks the one buying-criteria question that matters. |
| SRC-02 | Apex | Vendor X gave a great demo. Help us contract now. | Pushes back: demo is not selection evidence; demands integration proof, category pilot evidence, economics, data requirements, and exit/SLAs. |
| SRC-03 | Apex | What should the RFP test for merchandising AI? | Tests item-location data, promo lift, substitution, merchant override workflow, margin attribution, and implementation proof. |
| SRC-04 | Apex | Should we use a big SI or specialist vendor for workforce scheduling? | Compares implementation/change capacity vs product depth; does not default to big SI. |
| SRC-05 | Apex | How do we avoid overpaying for the CDP implementation? | Structures commercial levers: scope boundaries, role mix, milestone pricing, data-quality assumptions, change-order triggers. |
| SRC-06 | Meridian | Should we shortlist Abridge, Nuance, or Suki? | Frames decision criteria first: Epic integration, specialty coverage, note quality, coding impact, clinician adoption, enterprise terms; avoids unsupported winner. |
| SRC-07 | Meridian | Research likes Palantir. Should Source run a competitive event? | Forms view: only if the question is expansion or enterprise standardization; if Palantir is already embedded, test value, integration, and lock-in before replacing. |
| SRC-08 | Meridian | What should an RFP for HCC AI require? | Requires Epic workflow integration, suspect precision, audit evidence, CDI/coder workflow, payer rule handling, and measured RAF impact. |
| SRC-09 | Meridian | Can we source Claude-on-cloud while research runs local LLMs? | Segments sourcing lanes; cloud Claude for enterprise use cases, local stack for research/privacy workloads; requires governance boundary. |
| SRC-10 | Meridian | Which SI should implement Databricks? | Does not invent SI ranking; names criteria: healthcare references, Epic/Snowflake migration experience, PHI governance, MLOps, cost controls. |
| SRC-11 | First Capital | What should we test in an AML AI vendor? | Tests explainability, SAR integrity, false-positive reduction, model validation artifacts, data lineage, investigator workflow, and regulator-ready evidence. |
| SRC-12 | First Capital | Vendor says their model is pre-validated. Is that enough? | Pushes back: vendor validation does not transfer First Capital's SR 11-7 accountability; demand local validation and change controls. |
| SRC-13 | First Capital | Should we pick a core banking vendor's AI module? | Compares integration advantage vs opacity/vendor lock-in; requires evidence, data export, explainability, and control ownership. |
| SRC-14 | First Capital | What commercial terms matter most for GenAI copilots? | Covers data use, audit logs, model changes, indemnity, retention, exit rights, rate limits, and regulated-output controls. |
| SRC-15 | Cross-surface | Shape this as a Move. | Briefly gives vendor-related framing, then hands to Nexus for Move shaping; does not pretend Source owns phase gates. |

## Nexus On Moves

Expected posture: senior bet-shaping advisor. It should close P0 efficiently, push back on weak scope/sponsor/value, and never let a Move advance theatrically.

| ID | Tenant | Question | Expected advisor answer |
|---|---|---|---|
| MOV-01 | Meridian | I want to create a Move for HCC suspect capture from 72% to 84%. | Extracts trigger, first cohort, value hypothesis, sponsor gap, pattern class, and asks only the missing field(s). |
| MOV-02 | Meridian | Can Anita sponsor the HCC Move alone? | Pushes back: CDIO can sponsor platform/data, but Population Health/CMIO/CFO must co-own outcome and adoption. |
| MOV-03 | Meridian | Let's scope HCC AI across all specialties immediately. | Pushes back; recommends cohort/specialty pilot, evidence gate, and workflow validation. |
| MOV-04 | Meridian | What closes P0 for the HCC Move? | Names P0 close criteria: trigger, cohort, value hypothesis, sponsor structure, pattern classification, Discovery envelope. |
| MOV-05 | Meridian | What evidence is needed before P1 Charter? | Names baseline RAF leakage, suspect-to-action conversion, provider response, audit policy, data owner, and value owner. |
| MOV-06 | Meridian | Shape a Move for research digital twins. | Narrows scope to one disease cohort/research question, data governance, compute boundary, and validation plan. |
| MOV-07 | Apex | I want a Move for demand sensing across all banners. | Pushes back on all-banner scope; proposes one/two-banner pilot with category selection and data gate. |
| MOV-08 | Apex | Can CIO own assortment optimization? | Pushes back: CIO owns platform; merchandising/operations sponsor must own business decision and adoption. |
| MOV-09 | Apex | What closes P0 for workforce scheduling? | Names labor-rule readiness, first store cohort, value hypothesis, sponsor, forecast dependency, Discovery envelope. |
| MOV-10 | Apex | We want enterprise rollout in 12 months. | Pushes back unless evidence gates are passed; proposes phased rollout with kill criteria. |
| MOV-11 | Apex | What is the P1 charter risk for loyalty AI? | Names customer identity/CDP accountability and CMO/IT co-ownership as binding risks. |
| MOV-12 | First Capital | Create a Move for GenAI credit memo drafting. | Extracts first cohort, control boundary, value hypothesis, sponsor, model-risk involvement, and P0 evidence gaps. |
| MOV-13 | First Capital | Can business own credit memo AI without Model Risk? | Pushes back: business owns outcome; Model Risk validates; compliance/legal set guardrails. |
| MOV-14 | First Capital | What evidence closes P1 for AML triage? | Requires baseline false positives, investigator workflow, SAR quality, validation plan, data lineage, and human-review design. |
| MOV-15 | First Capital | Can we advance to P2 without validation design? | Refuses gate advance; validation design is a hard gate for regulated AI. |

## Execution Recommendation

Run this bank separately from the domain-depth bank:

1. `Sentinel / Intelligence`: run `INT-*` from the Intelligence page or `/api/chat/agent` with `agentName=Sentinel`, `surface=/intelligence`.
2. `Source / Source`: run `SRC-*` from Source intake/event pages or `/api/chat/agent` with Source surface context.
3. `Nexus / Moves`: run `MOV-*` from Moves/new and Move detail pages or `/api/chat/agent` with `agentName=Nexus`, `surface=/strategic-moves/new` or the active Move phase surface.

Target before demo:

- 0 fail.
- 80%+ advisor-grade per surface.
- No surface over-handoff, especially Sentinel routing strategic operating questions away from Intelligence.
- Nexus closes P0 in 4-6 turns on responsive users.
- Source produces shortlists and sourcing criteria, not vendor catalogs.
