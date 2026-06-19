#!/usr/bin/env python3
"""Enrich Lakeshore Industries v4 DATA-INTELLIGENCE so the new Intelligence
front-end binds to real, demo-grade content (not filler).

Does three things, all bound to the real v4 estate (LAK-AI-001..010, Kyriba/
Quantum/SAP/BlackLine/Hyperion, real volumetrics + third-quartile benchmark gap):
  1. golden-questions.json   — 8 Kyriba-pilot showcase Q&A with real must_cite ids
  2. enterprise-reads.json    — cleans filler in the existing read + adds 2 themed reads
  3. family-7 O01/O03/O05     — replaces placeholder rows with real finance/treasury content

Schema-faithful: matches the existing derived-read shape and family-7 columns.
Idempotent-ish: rewrites the three target files from this script's content.
"""
import json, csv, io, os

ROOT = "datasets/lakeshore-industries-synthetic-v4"
GEN_AT = "2026-06-19T00:00:00Z"  # static (no Date.now in this pipeline)

# ----- shared real entities -----
ANSWER_CONTRACT = {
    "answerStyle": "plain-English senior CIO/CDAO/CFO advisor",
    "mustInclude": ["business context", "current platforms", "volumetrics",
                    "architecture read", "peer/north-star read", "recommended moves", "evidence"],
    "mustNotLeadWith": ["chunk count", "graph edge count", "raw fact count"],
}
CORE_VOLUMETRICS = {
    "applicationsTotal": 130, "criticalOrHighApplications": 89, "dataProductsTotal": 105,
    "integrationsTotal": 200, "averageQualityOrTrustScore": 65.5,
    "namedPlatformVolumetrics": {
        "daily_bank_balance_records": 18000, "payments_per_month": 85000,
        "cash_forecast_lines": 152000, "GL_journal_lines": 286000, "close_reconciliations": 353000,
    },
}

# ========================= 1. GOLDEN QUESTIONS =========================
GOLDEN = {
    "client": "lakeshore", "tenant_key": "lakeshore", "name": "Lakeshore Industries",
    "dataset": "lakeshore-industries-synthetic-v4", "generated_at": GEN_AT,
    "answer_contract": ANSWER_CONTRACT,
    "questions": [
        {"id": "GQ-LAK-001", "intent": "treasury_readiness",
         "question": "Is Kyriba ready to go live, or what control evidence is still open?",
         "expected_answer_points": [
             "Kyriba go-live is a control-evidence question, not a project milestone",
             "Open: bank connectivity certification, SAP feed quality, SOX signer controls, payment-format defects"],
         "must_cite": ["LAK-AI-001", "LAK-AI-002", "LAK-APP-011", "lak-kyriba-control-evidence", "LAKESHORE-RAID-0001"],
         "evidence_quality": "high"},
        {"id": "GQ-LAK-002", "intent": "scale_vs_hold",
         "question": "Which finance and treasury AI initiatives are proven enough to scale versus still need evidence?",
         "expected_answer_points": [
             "Scale candidate: Liquidity forecasting automation (high confidence)",
             "Hold/evidence: Kyriba rollout (medium), M365 Copilot finance (at risk, value not realized)"],
         "must_cite": ["LAK-AI-003", "LAK-AI-001", "LAK-AI-009"], "evidence_quality": "high"},
        {"id": "GQ-LAK-003", "intent": "spend_to_value",
         "question": "Where is finance AI spend committed but value not yet realized?",
         "expected_answer_points": [
             "M365 Copilot finance: $86M committed, $2.86M measured, at risk",
             "Kyriba rollout: $86M committed, $18.9M measured, medium confidence"],
         "must_cite": ["LAK-AI-009", "LAK-AI-001"], "evidence_quality": "high"},
        {"id": "GQ-LAK-004", "intent": "blocker",
         "question": "What is blocking the automated close and finance reporting semantic layer?",
         "expected_answer_points": [
             "Finance AI is not board-ready without a governed GL/treasury/working-capital semantic layer",
             "Needs certified metrics, source-evidence links, BlackLine/Hyperion/SAP reconciliation"],
         "must_cite": ["LAK-AI-004", "lak-finance-semantic-layer", "LAK-AI-006"], "evidence_quality": "high"},
        {"id": "GQ-LAK-005", "intent": "peer_benchmark",
         "question": "How does Lakeshore's treasury and finance modernization compare to peers?",
         "expected_answer_points": [
             "Lakeshore sits in the third quartile on the core finance-modernization metrics",
             "North star: automated bank connectivity, certified cash positioning, controlled payments, finance semantic layer"],
         "must_cite": ["LAKESHORE-BM-0001", "LAKESHORE-MET-0001"], "evidence_quality": "medium"},
        {"id": "GQ-LAK-006", "intent": "risk_posture",
         "question": "What are the top control and risk items that could block treasury value?",
         "expected_answer_points": [
             "Bank connectivity not certified; SOX signer evidence incomplete; payment-format defects",
             "Forecast data products not certified for FP&A use"],
         "must_cite": ["LAKESHORE-RAID-0001", "LAKESHORE-RAID-0003", "LAK-AI-002"], "evidence_quality": "high"},
        {"id": "GQ-LAK-007", "intent": "payments_risk",
         "question": "Which bank connectivity and payment-format risks threaten the Kyriba rollout?",
         "expected_answer_points": [
             "85,000 payments/month carry a format-mapping defect; manual bank-portal fallback",
             "Prioritize critical banks, automate connectivity tests, monitor exception rates"],
         "must_cite": ["lak-bank-connectivity-risk", "LAK-AI-002", "LAK-VOL-002"], "evidence_quality": "high"},
        {"id": "GQ-LAK-008", "intent": "steering_moves",
         "question": "What three moves should go to the next finance steering committee?",
         "expected_answer_points": [
             "Approve guarded Kyriba cash/payments pilot ($67.1M)",
             "Close bank-connectivity control-evidence gap ($19.6M); sequence liquidity forecasting ($24.2M)"],
         "must_cite": ["LAK-AI-001", "LAK-AI-002", "LAK-AI-003"], "evidence_quality": "high"},
    ],
}

# ========================= 2. DERIVED READS (add 2 themed) =========================
def read(read_id, family, dimension, qfams, headline, exec_summary, arch, maturity,
         stack, insights, north_star, peer_impl, patterns, moves):
    return {
        "readId": read_id, "tenantKey": "lakeshore", "tenantName": "Lakeshore Industries",
        "industry": "industrial_manufacturing", "readFamily": family, "dimension": dimension,
        "generatedAt": GEN_AT, "questionFamilies": qfams, "headline": headline,
        "executiveSummary": exec_summary,
        "currentStateRead": {"architecturePattern": arch, "maturityRead": maturity,
            "whatThisMeans": "Lead with business implications, peer/north-star context, and recommended moves; keep row/chunk/fact counts behind evidence.",
            "confirmedTechnologyStack": stack},
        "volumetrics": CORE_VOLUMETRICS,
        "derivedInsights": insights, "benchmarkRead": {"northStar": north_star, "peerImplication": peer_impl},
        "matchedPatterns": patterns, "recommendedMoves": moves, "sentinelAnswerContract": ANSWER_CONTRACT,
    }

READ_FINANCE_AI = read(
    "enterprise-read-lakeshore-finance-ai-semantic-layer-v1", "opportunity", "finance_ai_readiness",
    ["What does finance AI need before it is board-ready?",
     "Should we scale finance Copilot and AI reporting now?"],
    "Finance AI is not board-ready until a governed semantic layer certifies GL, treasury, and working-capital metrics.",
    "Lakeshore has four finance-AI initiatives in flight (close/reporting semantic layer, variance explainer, "
    "ServiceNow finance agent, M365 Copilot finance), but committed value is outrunning realized value because the "
    "underlying metrics are not yet certified or source-linked. The move is to stand up a governed finance semantic "
    "layer over SAP FI/CO, BlackLine, and Hyperion before scaling AI reporting — otherwise users keep spreadsheet "
    "workarounds and board reporting cannot be trusted.",
    "Finance semantic layer over SAP FI/CO + BlackLine + Hyperion, feeding close automation, variance explanation, and AI reporting.",
    "Initiatives are real but value is unproven: M365 Copilot finance is at risk ($86M committed, $2.86M measured); "
    "close/semantic-layer is mid-build; metric ownership and source citations are incomplete.",
    ["SAP FI/CO finance feeds", "BlackLine / Hyperion close stack", "M365 Copilot (finance)",
     "ServiceNow finance support agent", "Finance semantic layer (planned)"],
    [
        {"headline": "Committed finance-AI value is outrunning realized value.",
         "soWhat": "M365 Copilot finance shows $86M committed but $2.86M measured and is flagged at risk; scaling before metric certification compounds the gap.",
         "severity": "high", "evidence": ["LAK-AI-009", "lak-finance-semantic-layer", "O01_business-metrics.csv#LAKESHORE-MET-0007"]},
        {"headline": "Close automation depends on certified metrics, not dashboard speed.",
         "soWhat": "Automated close and reporting need source citations, control evidence, and metric ownership across SAP/BlackLine/Hyperion before they are board-ready.",
         "severity": "high", "evidence": ["LAK-AI-004", "source-docs/Lakeshore_Finance_AI_and_Close_SYNTHETIC.md", "LAKESHORE-RAID-0006"]},
        {"headline": "A semantic layer is the unlock for the variance explainer.",
         "soWhat": "The finance AI narrative/variance explainer (design stage) is only trustworthy once GL/working-capital definitions are governed.",
         "severity": "medium", "evidence": ["LAK-AI-006", "lak-finance-semantic-layer"]},
    ],
    "Top-quartile industrials run finance AI on a governed semantic layer with certified metrics, source-linked evidence, and measured close acceleration.",
    "Lakeshore can convert at-risk finance-AI spend into board-trusted reporting by certifying the semantic layer before scaling Copilot and AI reporting.",
    [{"patternId": "lak-finance-semantic-layer", "patternName": "Finance semantic layer before AI reporting",
      "domain": "finance_ai", "score": 5, "whyMatched": "Matched signals: SAP, BlackLine, Hyperion, Kyriba",
      "recommendedActions": ["certify metrics", "link source evidence", "measure close acceleration"]}],
    [{"title": "Certify the finance semantic layer before scaling AI reporting", "owner": "Controller",
      "decision": "Stand up governed GL/treasury/working-capital metrics over SAP FI/CO + BlackLine + Hyperion", "expectedImpact": "$28.0M"},
     {"title": "Hold M365 Copilot finance scale until value is proven", "owner": "CFO",
      "decision": "Gate further Copilot finance rollout on measured benefit and metric certification", "expectedImpact": "$12.4M"}],
)

READ_PAYMENTS_RISK = read(
    "enterprise-read-lakeshore-bank-connectivity-payments-risk-v1", "risk", "treasury_operations_risk",
    ["What are the live risks to the Kyriba rollout?",
     "Which bank connectivity and payment-format issues need to be closed first?"],
    "Bank connectivity and payment-format defects are the live risk to the Kyriba go-live — close them before broad rollout.",
    "Lakeshore processes ~85,000 payments/month with a known format-mapping defect and falls back to manual bank "
    "portals for daily balances (~18,000 records/month). Until ISO 20022 connectivity is certified for critical banks, "
    "SOX signer controls are evidenced, and payment formats are reconciled, the Kyriba rollout carries real operational "
    "and control risk. Sequence the critical banks first, automate connectivity tests, and monitor exception rates.",
    "Treasury operations: Kyriba + Quantum legacy TMS, bank portals/ISO 20022 connectivity, SOX payment approvals and signer controls.",
    "Manual bank-portal fallback and payment-format defects persist; bank connectivity is not yet certified for critical banks; SOX signer evidence is incomplete.",
    ["Kyriba cash and payments platform", "Quantum legacy TMS", "Bank portals / ISO 20022 connectivity",
     "SOX payment and signer controls"],
    [
        {"headline": "85,000 payments/month carry a format-mapping defect.",
         "soWhat": "Payment-format defects and manual portal fallback put cash and payments value at risk the day Kyriba goes live.",
         "severity": "high", "evidence": ["lak-bank-connectivity-risk", "LAK-VOL-002", "LAKESHORE-RAID-0002"]},
        {"headline": "Bank connectivity is not certified for critical banks.",
         "soWhat": "Treasury bank connectivity control evidence (mobilize stage) must be closed before broad rollout, prioritizing critical banks.",
         "severity": "high", "evidence": ["LAK-AI-002", "lak-kyriba-control-evidence", "LAKESHORE-RAID-0001"]},
        {"headline": "SOX signer controls evidence is incomplete.",
         "soWhat": "Payment approvals and signer controls need SOX evidence before payments automation can be trusted.",
         "severity": "high", "evidence": ["LAK-AI-001", "source-docs/Lakeshore_IT_Systems_and_Controls_SYNTHETIC.md", "LAKESHORE-RAID-0003"]},
    ],
    "Top-quartile treasuries run automated, certified bank connectivity with monitored exception rates and evidenced payment controls.",
    "Lakeshore can de-risk the Kyriba rollout by sequencing critical-bank connectivity, automating tests, and evidencing signer controls before broad go-live.",
    [{"patternId": "lak-bank-connectivity-risk", "patternName": "Bank connectivity and payment format risk",
      "domain": "treasury_operations", "score": 4, "whyMatched": "Matched signals: manual bank portal fallback, test defects, format mapping",
      "recommendedActions": ["prioritize critical banks", "automate tests", "monitor exception rates"]},
     {"patternId": "lak-kyriba-control-evidence", "patternName": "Kyriba rollout control evidence gate",
      "domain": "treasury_modernization", "score": 4, "whyMatched": "Matched signals: bank connectivity, SOX controls, defects",
      "recommendedActions": ["sequence go-live", "close defect RACI", "prove signer controls"]}],
    [{"title": "Close bank-connectivity control-evidence gap before broad Kyriba rollout", "owner": "Treasurer",
      "decision": "Certify ISO 20022 connectivity for critical banks and evidence signer controls", "expectedImpact": "$19.6M"}],
)

# clean the existing read's filler (real peer plays + drop the placeholder pattern)
REAL_PEER_PLAYS = [
    {"peer": "top quartile treasury operator", "play": "Automated bank connectivity + certified cash positioning",
     "enablers": "ISO 20022; Kyriba; bank API certification; exception monitoring", "domain": "value_capture",
     "evidence": "O03_competitor-plays.csv#LAKESHORE-PLAY-0001"},
    {"peer": "top quartile finance org", "play": "Finance semantic layer to accelerate close",
     "enablers": "SAP FI/CO; BlackLine; Hyperion; certified metrics", "domain": "cycle_time",
     "evidence": "O03_competitor-plays.csv#LAKESHORE-PLAY-0002"},
    {"peer": "top quartile controls org", "play": "Automated SOX payment and signer evidence",
     "enablers": "payment controls; signer matrix; evidence automation", "domain": "risk_posture",
     "evidence": "O03_competitor-plays.csv#LAKESHORE-PLAY-0003"},
    {"peer": "top quartile finance org", "play": "Governed finance Copilot with certified metrics",
     "enablers": "semantic layer; metric ownership; adoption telemetry", "domain": "adoption",
     "evidence": "O03_competitor-plays.csv#LAKESHORE-PLAY-0004"},
    {"peer": "top quartile FP&A org", "play": "Liquidity forecasting automation on certified data",
     "enablers": "cash/working-capital data products; forecast models", "domain": "cost_to_serve",
     "evidence": "O03_competitor-plays.csv#LAKESHORE-PLAY-0005"},
]

def enrich_reads():
    p = f"{ROOT}/derived-intelligence/enterprise-reads.json"
    d = json.load(open(p))
    base = d["reads"][0]
    base["benchmarkRead"]["matchedPeerPlays"] = REAL_PEER_PLAYS
    base["matchedPatterns"] = [m for m in base["matchedPatterns"] if not m["patternId"].startswith("lakeshore-v4-pattern")]
    d["reads"] = [base, READ_FINANCE_AI, READ_PAYMENTS_RISK]
    json.dump(d, open(p, "w"), indent=2)
    return len(d["reads"])

# ========================= 3. FAMILY-7 DE-FILLER =========================
def write_csv(path, header, rows):
    buf = io.StringIO(); w = csv.writer(buf); w.writerow(header); [w.writerow(r) for r in rows]
    open(path, "w").write(buf.getvalue())

O01 = ("Metric_ID,Function,Owning_CXO,Metric_Name,Definition,Unit,Current_Value,Target_Value,Value_Stream_ID,Primary_Capability_ID".split(","),
    [["LAKESHORE-MET-0001","value_capture","CFO","Benefit realization vs committed value","Realized AI/transformation benefit divided by committed benefit","pct",22,70,"LAK-VS-FINANCE","LAK-CAP-VALUE"],
     ["LAKESHORE-MET-0002","treasury","Treasurer","Cash visibility (certified positions)","Share of global cash positions certified daily in Kyriba","pct",41,95,"LAK-VS-TREASURY","LAK-CAP-CASH"],
     ["LAKESHORE-MET-0003","treasury","Treasurer","Payment straight-through-processing rate","Payments processed without manual format correction","pct",58,92,"LAK-VS-PAYMENTS","LAK-CAP-PAYMENTS"],
     ["LAKESHORE-MET-0004","finance","Controller","Close cycle time","Business days to complete the financial close","days",9.5,5,"LAK-VS-CLOSE","LAK-CAP-CLOSE"],
     ["LAKESHORE-MET-0005","fp_and_a","CFO","Liquidity forecast accuracy","13-week cash forecast accuracy vs actuals","pct",63,90,"LAK-VS-LIQUIDITY","LAK-CAP-FORECAST"],
     ["LAKESHORE-MET-0006","risk_posture","CRO","Control evidence completeness","Share of SOX payment/signer controls with current evidence","pct",54,98,"LAK-VS-CONTROLS","LAK-CAP-CONTROLS"],
     ["LAKESHORE-MET-0007","adoption","CIO","Finance Copilot active adoption","Active weekly users of M365 Copilot finance vs licensed","pct",18,70,"LAK-VS-PRODUCTIVITY","LAK-CAP-ADOPTION"],
     ["LAKESHORE-MET-0008","cost_to_serve","CFO","Bank connectivity certified","Critical banks with certified ISO 20022 connectivity","pct",35,100,"LAK-VS-TREASURY","LAK-CAP-CONNECTIVITY"]])

O03 = ("Play_ID,Metric_ID,Peer_or_Archetype,Play_Name,Metric_Moved,Delta,Enablers,Reference_Pattern,Domain".split(","),
    [["LAKESHORE-PLAY-0001","LAKESHORE-MET-0002","top quartile treasury operator","Automated bank connectivity + certified cash positioning","Cash visibility (certified positions)","+45pp","ISO 20022; Kyriba; bank API certification; exception monitoring","lak-bank-connectivity-risk","value_capture"],
     ["LAKESHORE-PLAY-0002","LAKESHORE-MET-0004","top quartile finance org","Finance semantic layer to accelerate close","Close cycle time","-4.5 days","SAP FI/CO; BlackLine; Hyperion; certified metrics","lak-finance-semantic-layer","cycle_time"],
     ["LAKESHORE-PLAY-0003","LAKESHORE-MET-0006","top quartile controls org","Automated SOX payment and signer evidence","Control evidence completeness","+40pp","payment controls; signer matrix; evidence automation","lak-kyriba-control-evidence","risk_posture"],
     ["LAKESHORE-PLAY-0004","LAKESHORE-MET-0007","top quartile finance org","Governed finance Copilot with certified metrics","Finance Copilot active adoption","+50pp","semantic layer; metric ownership; adoption telemetry","lak-finance-semantic-layer","adoption"],
     ["LAKESHORE-PLAY-0005","LAKESHORE-MET-0005","top quartile FP&A org","Liquidity forecasting automation on certified data","Liquidity forecast accuracy","+25pp","cash/working-capital data products; forecast models","lak-finance-semantic-layer","cost_to_serve"]])

O05 = ("Item_ID,Initiative_ID,Type,Description,Severity,Likelihood,Status,Owner,Due_Date,Mitigation".split(","),
    [["LAKESHORE-RAID-0001","LAK-AI-002","risk","Bank connectivity not certified for critical banks (ISO 20022); manual portal fallback in use","high","high","open","Treasurer","2026-09-30","Prioritize critical banks; automate connectivity tests; monitor exception rates"],
     ["LAKESHORE-RAID-0002","LAK-AI-001","risk","Payment-format mapping defect affecting ~85,000 payments/month","high","medium","open","Treasury Ops Lead","2026-08-31","Reconcile payment formats; add pre-submission validation; defect RACI"],
     ["LAKESHORE-RAID-0003","LAK-AI-001","issue","SOX payment and signer controls evidence incomplete for go-live","high","high","open","Controller","2026-09-15","Evidence signer matrix; link controls to source; close audit gaps"],
     ["LAKESHORE-RAID-0004","LAK-AI-003","dependency","Liquidity forecast data products not certified for FP&A use","medium","high","open","CFO","2026-10-15","Certify cash/working-capital data products; assign metric ownership"],
     ["LAKESHORE-RAID-0005","LAK-AI-009","risk","M365 Copilot finance adoption drag; committed value not realized (at risk)","high","medium","open","CIO","2026-09-30","Gate scale on measured benefit; targeted enablement; metric certification"],
     ["LAKESHORE-RAID-0006","LAK-AI-004","assumption","Finance semantic-layer metric ownership assigned across SAP/BlackLine/Hyperion","medium","medium","open","Controller","2026-08-31","Assign metric owners; certify definitions; link source evidence"]])

def main():
    json.dump(GOLDEN, open(f"{ROOT}/99-verification/golden-questions.json", "w"), indent=2)
    n_reads = enrich_reads()
    write_csv(f"{ROOT}/family-7-outcome-intelligence/O01_business-metrics.csv", *O01)
    write_csv(f"{ROOT}/family-7-outcome-intelligence/O03_competitor-plays.csv", *O03)
    write_csv(f"{ROOT}/family-7-outcome-intelligence/O05_raid-log.csv", *O05)
    print(f"golden questions: {len(GOLDEN['questions'])}")
    print(f"derived reads: {n_reads}")
    print(f"O01 metrics: {len(O01[1])} | O03 plays: {len(O03[1])} | O05 RAID: {len(O05[1])}")

if __name__ == "__main__":
    main()
