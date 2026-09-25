# Future of Tower

## 1. What Tower Is Today

Tower is no longer just a static dashboard. It has meaningful governed ingredients:

- deterministic `cio_tower` measures/facts/entities/source lineage;
- a budget and portfolio command surface;
- aVa Tower question contracts and answer traces;
- V7 projection bridge for initiatives, vendors, spend, and AI use cases;
- outcome-ledger logic that flags unevidenced verified claims.

The weakness is product shape. Tower still behaves like several useful read paths rather than one explicit value-realization contract. The current implementation can tell an executive what is loaded, but it does not yet force every value claim through a single baseline / target / promised / measured / realized / evidence / owner / method gate.

## 2. What Tower Should Become

Tower should become Nexus's **enterprise value-realization command center**:

- transformation value ledger;
- baseline, target, promised, measured, and realized tracker;
- evidence-backed benefits realization engine;
- cross-module accountability layer;
- CFO/CIO/CDAO cockpit for value, readiness, risk, controls, and measurement gaps.

## 3. Product Principles

- No measured value without evidence.
- Every value claim has owner, baseline, method, evidence, status, confidence, and caveat.
- Measurement plan comes before value claim.
- Gaps become evidence requests.
- Source savings are hypotheses until post-award measurement.
- Moves charters create measurement plans.
- Intelligence can define value hypotheses, but not realized value.

## 4. Future Information Architecture

- Executive Value Brief
- Portfolio Value Map
- Initiative Value Ledger
- Baseline & Measurement Plan
- Promised vs Measured Value
- Evidence & Confidence
- Risks to Realization
- Source Commercial Value Handoff
- Moves Execution Handoff
- CFO/CIO/CDAO Views
- Audit Trail and Calculation Methods

## 5. Future Views

- **Executive:** value story, decisions required, unsupported claims, risk to realization.
- **CFO:** budget, spend, promised vs measured value, ROI blockers, finance-attested outcomes.
- **CIO:** initiatives, vendors, operating risk, run/change mix, execution health.
- **CDAO:** data readiness, lineage, semantic ownership, confidence, controls.
- **CPO / Procurement:** Source commercial handoffs, renewal leverage, SLA commitments, savings hypotheses.

## 6. Future Data Contract

```ts
type TowerValueRecord = {
  tenant_key: string;
  initiative_id: string;
  move_id?: string; // internal only
  business_function: string;
  owner: string;
  metric_id: string;
  metric_name: string;
  baseline_value: number | null;
  baseline_source_evidence_id: string | null;
  baseline_as_of_date: string | null;
  target_value: number | null;
  target_date: string | null;
  promised_value: number | null;
  forecast_value: number | null;
  measured_value: number | null;
  realized_value: number | null;
  calculation_method: string;
  confidence: "low" | "medium" | "high";
  evidence_refs: string[];
  risk_ids: string[];
  control_ids: string[];
  source_handoff_id: string | null;
  moves_handoff_id: string | null;
  status:
    | "hypothesis"
    | "planned"
    | "tracked"
    | "measured"
    | "realized"
    | "blocked";
  caveats: string[];
  active_candidate_status: "active" | "candidate";
};

type TowerMetricRecord = {
  metric_id: string;
  metric_name: string;
  metric_family: string;
  business_owner: string;
  data_owner: string;
  calculation_method: string;
  source_system: string;
  evidence_id: string;
  baseline_status: "missing" | "partial" | "validated";
  measurement_frequency: string;
  current_value: number | null;
  target_value: number | null;
  confidence: "low" | "medium" | "high";
  gap_status: "none" | "warning" | "blocker";
};

type TowerValueClaim = {
  claim_text: string;
  claim_type:
    | "hypothesis"
    | "target"
    | "forecast"
    | "measured"
    | "realized"
    | "roi";
  claim_status: "safe" | "caveated" | "blocked";
  supported_by_evidence: boolean;
  supporting_evidence_refs: string[];
  unsupported_reason: string | null;
  visible_to_user: boolean;
  caveat_text: string | null;
};
```

## 7. Future Module Integrations

- **Knowledge to Tower:** active facts, relationships, evidence, gaps, answerability.
- **Intelligence to Tower:** value hypothesis and decision framing.
- **Moves to Tower:** measurement plan, phase commitments, owner, baseline method.
- **Source to Tower:** commercial hypotheses, renewal commitments, negotiated baselines.
- **aVa to Tower:** explain value state and route unsupported claims to evidence requests.

## 8. Roadmap

| phase | name                          | description                                                                                      | priority |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| P0    | Safety foundation             | Block unsupported realized value/ROI phrasing; require value claim status and caveat.            | High     |
| P1    | Measurement plan              | Represent baseline, target, owner, method, cadence, and missing evidence before any value claim. | High     |
| P2    | Value ledger                  | Create TowerValueRecord/TowerMetricRecord/TowerValueClaim as the formal contract.                | High     |
| P3    | Source commercial value       | Bring BAFO/savings opportunities into Tower as hypotheses until measured post-award.             | Medium   |
| P4    | Executive cockpit             | Role-based CFO/CIO/CDAO/CPO views with value, readiness, risk, and evidence.                     | Medium   |
| P5    | Continuous value intelligence | Close the loop from measured outcomes back to Knowledge/Intelligence/Moves/Source.               | Medium   |

## 9. What To Fix First

| rank | recommendation                                          | problem                                                                       | product_impact                                 | data_dependency                   | implementation_complexity | demo_priority |
| ---- | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------- | ------------------------- | ------------- |
| 1    | Formalize TowerContextPack                              | Tower has several valid read paths but no single named context pack boundary. | Prevents drift and makes audit proof simple.   | Knowledge/Tower context contracts | Medium                    | High          |
| 2    | Create TowerValueClaim gate                             | ROI/realized value needs a hard status gate.                                  | Prevents unsafe CFO-facing claims.             | measure_results + evidence        | Medium                    | High          |
| 3    | Add measurement-plan first view                         | Many Meridian metrics are trackable but not validated.                        | Makes gaps productive instead of embarrassing. | Moves P1/P5 handoff               | Medium                    | High          |
| 4    | Make baseline/target/promised/measured/realized visible | The data model separates states but UI can still compress them.               | Improves CFO trust.                            | Tower measure metadata            | Medium                    | High          |
| 5    | Persist context gaps as IDs                             | Current gaps are derived strings in places.                                   | Enables evidence-request workflow.             | Knowledge gaps                    | Medium                    | High          |
| 6    | Integrate Source handoff                                | Savings/commercial value should flow as hypotheses.                           | Connects sourcing wins to value realization.   | Source event/value ledger         | Medium                    | Medium        |
| 7    | Integrate Moves handoff                                 | Move charters and phase success metrics should seed Tower.                    | Closes strategy-to-execution loop.             | Moves measurement plan            | Medium                    | High          |
| 8    | Add control dimension                                   | CDAO/CFO trust requires controls, not just risks.                             | Board-grade value governance.                  | Risk/control records              | Medium                    | Medium        |
| 9    | Role-based Tower views                                  | CFO, CIO, CDAO, CPO need different slices.                                    | Improves demo relevance.                       | Same value ledger                 | High                      | Medium        |
| 10   | Retire old V-language from visible contracts            | Internal V6/V7 terms remain in code headers/internal labels.                  | Avoids confusing buyers and operators.         | API headers/release naming        | Low                       | Medium        |
