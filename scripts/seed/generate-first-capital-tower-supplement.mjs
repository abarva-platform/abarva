#!/usr/bin/env node
/**
 * First Capital Financial — AI Control Tower Supplement (V2)
 *
 * Generates Tower-specific data that was missing from the base V2 generator:
 *   T01 Initiative milestones + gate criteria
 *   T02 Benefit realization (committed vs realized $)
 *   T03 M365 Copilot + GitHub Copilot adoption by function
 *   T04 ERP & platform-embedded agents (Workday AI, SAP Joule, ServiceNow Now Assist)
 *   T05 ServiceNow automation metrics by workflow
 *   T06 Function-level AI productivity scorecard
 *   T07 Model risk inventory (47 production models, SR 11-7 status)
 *   T08 AI spend by initiative (YTD actuals vs budget)
 *   T09 AI risk register (model drift, hallucination incidents, unauthorized use)
 *   T10 Gate approval history (sponsor sign-offs per gate per initiative)
 *
 * Output: datasets/first-capital-financial-synthetic-v2/ai-control-tower/
 * Usage:  node scripts/seed/generate-first-capital-tower-supplement.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT = path.join(REPO_ROOT, 'datasets/first-capital-financial-synthetic-v2/ai-control-tower');
const GENERATED_AT = '2026-06-17T00:00:00Z';

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function write(rel, content) {
  const file = path.join(ROOT, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}
function esc(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
function csv(headers, rows) {
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r[h] ?? '')).join(','))
  ].join('\n') + '\n';
}

// ════════════════════════════════════════════════════════════════════════════
// T01 — Initiative Milestones + Gate Criteria
// Each initiative has 5 milestones (M0–M4) and a current gate.
// ════════════════════════════════════════════════════════════════════════════

write('T01_initiative-milestones.csv', csv(
  ['initiative_id','milestone_id','milestone_name','milestone_type','target_date','actual_date','status','gate_criteria','gate_approver_role','blocker','evidence_artifact'],
  [
    // FCF-INIT-001: FedNow and RTP Modernization
    {initiative_id:'FCF-INIT-001',milestone_id:'M01-0',milestone_name:'Business case approved',milestone_type:'gate',target_date:'2025-09-30',actual_date:'2025-09-28',status:'complete',gate_criteria:'Sponsor approval + total cost of change estimate',gate_approver_role:'SVP Payments Technology',blocker:'',evidence_artifact:'FCF-BC-FEDNOW-2025.pdf'},
    {initiative_id:'FCF-INIT-001',milestone_id:'M01-1',milestone_name:'Core API integration live',milestone_type:'delivery',target_date:'2025-12-31',actual_date:'2026-01-14',status:'complete',gate_criteria:'FedNow message types 20/16/28 validated; 99.95% uptime 30-day soak',gate_approver_role:'SVP Payments Technology',blocker:'',evidence_artifact:'FCF-FEDNOW-SOAK-JAN26.log'},
    {initiative_id:'FCF-INIT-001',milestone_id:'M01-2',milestone_name:'Sanctions screening wired',milestone_type:'gate',target_date:'2026-03-31',actual_date:'',status:'at_risk',gate_criteria:'OFAC + FinCEN feed integrated; false-positive rate <0.8%; OCC sign-off',gate_approver_role:'Chief Compliance Officer',blocker:'OFAC feed latency spike: 340ms vs 150ms SLA; vendor Accelitas remediating',evidence_artifact:''},
    {initiative_id:'FCF-INIT-001',milestone_id:'M01-3',milestone_name:'24x7 ops readiness',milestone_type:'gate',target_date:'2026-06-30',actual_date:'',status:'not_started',gate_criteria:'NOC runbook approved; on-call rota staffed; war-game exercise passed',gate_approver_role:'COO',blocker:'NOC staffing gap: 3 FTE required; 1 hired, 2 open',evidence_artifact:''},
    {initiative_id:'FCF-INIT-001',milestone_id:'M01-4',milestone_name:'Volume target: 35% instant pay share',milestone_type:'outcome',target_date:'2027-06-30',actual_date:'',status:'not_started',gate_criteria:'FedNow/RTP ≥35% of total payment volume; commercial and consumer clients onboarded',gate_approver_role:'SVP Payments Technology',blocker:'',evidence_artifact:''},

    // FCF-INIT-002: AML Case Triage Automation
    {initiative_id:'FCF-INIT-002',milestone_id:'M02-0',milestone_name:'Business case approved',milestone_type:'gate',target_date:'2025-10-15',actual_date:'2025-10-12',status:'complete',gate_criteria:'Risk sponsor sign-off; SR 11-7 pre-assessment complete',gate_approver_role:'Chief Risk Officer',blocker:'',evidence_artifact:'FCF-BC-AML-TRIAGE-2025.pdf'},
    {initiative_id:'FCF-INIT-002',milestone_id:'M02-1',milestone_name:'Model development complete',milestone_type:'delivery',target_date:'2026-01-31',actual_date:'2026-02-10',status:'complete',gate_criteria:'Model trained on 18-month alert history; precision ≥72% on holdout',gate_approver_role:'Chief Model Risk Officer',blocker:'',evidence_artifact:'FCF-MRM-AML-TRIAGE-DEV.pdf'},
    {initiative_id:'FCF-INIT-002',milestone_id:'M02-2',milestone_name:'SR 11-7 validation evidence',milestone_type:'gate',target_date:'2026-04-30',actual_date:'',status:'blocked',gate_criteria:'MRM validation complete; bias test pass; OCC pre-exam walkthrough done; back-test report filed',gate_approver_role:'Chief Model Risk Officer',blocker:'MRM team backlog: 12 models ahead in queue; earliest slot July 2026',evidence_artifact:''},
    {initiative_id:'FCF-INIT-002',milestone_id:'M02-3',milestone_name:'Pilot: 50 analyst seats',milestone_type:'delivery',target_date:'2026-07-31',actual_date:'',status:'not_started',gate_criteria:'50 AML analysts using triage scores; false-positive rate ≤70%; caseload delta measured',gate_approver_role:'Chief Risk Officer',blocker:'Blocked on M02-2',evidence_artifact:''},
    {initiative_id:'FCF-INIT-002',milestone_id:'M02-4',milestone_name:'Scale: all 420 AML analysts',milestone_type:'outcome',target_date:'2026-12-31',actual_date:'',status:'not_started',gate_criteria:'False-positive rate ≤65%; SAR filing cycle ≤22 days; FinCEN no objection letter',gate_approver_role:'Chief Risk Officer',blocker:'',evidence_artifact:''},

    // FCF-INIT-003: Core Banking Future Decision
    {initiative_id:'FCF-INIT-003',milestone_id:'M03-0',milestone_name:'OCC MRA remediation plan filed',milestone_type:'gate',target_date:'2025-12-31',actual_date:'2026-01-08',status:'complete',gate_criteria:'Remediation plan accepted by OCC; data lineage gap addressed in plan',gate_approver_role:'CIO',blocker:'',evidence_artifact:'FCF-OCC-REMEDIATION-PLAN-JAN26.pdf'},
    {initiative_id:'FCF-INIT-003',milestone_id:'M03-1',milestone_name:'Data migration sequencing study',milestone_type:'delivery',target_date:'2026-05-31',actual_date:'',status:'in_progress',gate_criteria:'Core data migration complexity + risk scored; parallel run duration estimated',gate_approver_role:'CIO',blocker:'FIS contract data export terms under legal review',evidence_artifact:''},
    {initiative_id:'FCF-INIT-003',milestone_id:'M03-2',milestone_name:'RFP issued',milestone_type:'gate',target_date:'2026-09-30',actual_date:'',status:'on_hold',gate_criteria:'Board approval of $80M+ replacement budget; OCC data lineage MRA closed',gate_approver_role:'Board IT Committee',blocker:'HOLD until M03-1 complete + OCC MRA closed',evidence_artifact:''},
    {initiative_id:'FCF-INIT-003',milestone_id:'M03-3',milestone_name:'Vendor selected',milestone_type:'gate',target_date:'2027-06-30',actual_date:'',status:'not_started',gate_criteria:'RFP evaluation; TCO model approved; parallel run commitment letter from vendor',gate_approver_role:'Board IT Committee',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-003',milestone_id:'M03-4',milestone_name:'Parallel run start',milestone_type:'delivery',target_date:'2028-01-01',actual_date:'',status:'not_started',gate_criteria:'New core live in parallel with FIS Horizon; first branch cutover',gate_approver_role:'CIO',blocker:'',evidence_artifact:''},

    // FCF-INIT-004: Fraud Graph Analytics v2
    {initiative_id:'FCF-INIT-004',milestone_id:'M04-0',milestone_name:'Business case approved',milestone_type:'gate',target_date:'2025-04-30',actual_date:'2025-04-28',status:'complete',gate_criteria:'$28.6M fraud avoidance evidence from v1; v2 enhancement scope approved',gate_approver_role:'Chief Risk Officer',blocker:'',evidence_artifact:'FCF-BC-FRAUD-GRAPH-V2.pdf'},
    {initiative_id:'FCF-INIT-004',milestone_id:'M04-1',milestone_name:'Graph model production deploy',milestone_type:'delivery',target_date:'2025-09-30',actual_date:'2025-09-22',status:'complete',gate_criteria:'Graph model scoring 100% of card-present transactions; latency <80ms p99',gate_approver_role:'Chief Risk Officer',blocker:'',evidence_artifact:'FCF-FRAUD-GRAPH-DEPLOY-SEPT25.log'},
    {initiative_id:'FCF-INIT-004',milestone_id:'M04-2',milestone_name:'90-day fraud loss evidence',milestone_type:'gate',target_date:'2025-12-31',actual_date:'2026-01-02',status:'complete',gate_criteria:'Verified fraud loss reduction ≥$18M annualized vs control group; MRM sign-off',gate_approver_role:'Chief Model Risk Officer',blocker:'',evidence_artifact:'FCF-FRAUD-GRAPH-90DAY-EVIDENCE.pdf'},
    {initiative_id:'FCF-INIT-004',milestone_id:'M04-3',milestone_name:'ACH + wire fraud expansion',milestone_type:'delivery',target_date:'2026-06-30',actual_date:'',status:'in_progress',gate_criteria:'Graph model extended to ACH and wire transactions; BEC detection rate ≥78%',gate_approver_role:'Chief Risk Officer',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-004',milestone_id:'M04-4',milestone_name:'$75M annualized fraud avoidance',milestone_type:'outcome',target_date:'2026-12-31',actual_date:'',status:'in_progress',gate_criteria:'Verified quarterly fraud-loss avoidance report to board; run-rate ≥$75M/yr',gate_approver_role:'Board Risk Committee',blocker:'',evidence_artifact:''},

    // FCF-INIT-005: Digital Account Opening Recovery
    {initiative_id:'FCF-INIT-005',milestone_id:'M05-0',milestone_name:'Abandonment root cause locked',milestone_type:'gate',target_date:'2026-01-31',actual_date:'2026-02-03',status:'complete',gate_criteria:'UX research complete; top 3 drop-off steps identified; KYC friction mapped',gate_approver_role:'Chief Digital Officer',blocker:'',evidence_artifact:'FCF-DAO-UX-RESEARCH-FEB26.pdf'},
    {initiative_id:'FCF-INIT-005',milestone_id:'M05-1',milestone_name:'KYC instant-verify integration',milestone_type:'delivery',target_date:'2026-04-30',actual_date:'',status:'in_progress',gate_criteria:'Jumio/Socure instant KYC live; funding step <60s; ID verification pass rate ≥91%',gate_approver_role:'Chief Digital Officer',blocker:'CFPB guidance on e-KYC pending; legal review in progress',evidence_artifact:''},
    {initiative_id:'FCF-INIT-005',milestone_id:'M05-2',milestone_name:'Abandonment ≤42% (peer median)',milestone_type:'gate',target_date:'2026-07-31',actual_date:'',status:'not_started',gate_criteria:'Abandonment rate ≤42%; A/B test over 30,000 applicants; stat-sig at 95%',gate_approver_role:'Chief Digital Officer',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-005',milestone_id:'M05-3',milestone_name:'AI personalization layer',milestone_type:'delivery',target_date:'2026-10-31',actual_date:'',status:'not_started',gate_criteria:'Consent-based AI personalization live; offer relevance score ≥0.72; no data class violations',gate_approver_role:'Chief Digital Officer',blocker:'Consent framework not yet filed with CFPB',evidence_artifact:''},
    {initiative_id:'FCF-INIT-005',milestone_id:'M05-4',milestone_name:'Abandonment ≤28% (top quartile)',milestone_type:'outcome',target_date:'2027-03-31',actual_date:'',status:'not_started',gate_criteria:'Abandonment ≤28%; $18.4M projected NII contribution verified',gate_approver_role:'Chief Digital Officer',blocker:'',evidence_artifact:''},

    // FCF-INIT-006: Commercial Credit Memo AI
    {initiative_id:'FCF-INIT-006',milestone_id:'M06-0',milestone_name:'Pilot scope approved',milestone_type:'gate',target_date:'2026-01-15',actual_date:'2026-01-14',status:'complete',gate_criteria:'MRM pre-assessment; 8 analyst pilot cohort; credit policy alignment confirmed',gate_approver_role:'SVP Commercial Bank CIO',blocker:'',evidence_artifact:'FCF-CREDIT-MEMO-PILOT-SCOPE.pdf'},
    {initiative_id:'FCF-INIT-006',milestone_id:'M06-1',milestone_name:'Pilot: 8 analysts, 60 days',milestone_type:'delivery',target_date:'2026-04-15',actual_date:'',status:'in_progress',gate_criteria:'60-day controlled pilot; cycle time measured pre/post; error rate documented',gate_approver_role:'SVP Commercial Bank CIO',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-006',milestone_id:'M06-2',milestone_name:'MRM validation complete',milestone_type:'gate',target_date:'2026-06-30',actual_date:'',status:'not_started',gate_criteria:'SR 11-7 evidence package filed; explainability report; fair-lending impact assessment',gate_approver_role:'Chief Model Risk Officer',blocker:'MRM slot availability (same queue as AML triage)',evidence_artifact:''},
    {initiative_id:'FCF-INIT-006',milestone_id:'M06-3',milestone_name:'Deploy: all 280 credit analysts',milestone_type:'delivery',target_date:'2026-10-31',actual_date:'',status:'not_started',gate_criteria:'Cycle time ≤18 days; quality pass rate ≥94%; no increase in credit loss rate',gate_approver_role:'EVP Commercial Banking',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-006',milestone_id:'M06-4',milestone_name:'Cycle time ≤14 days (target)',milestone_type:'outcome',target_date:'2027-03-31',actual_date:'',status:'not_started',gate_criteria:'14-day cycle time sustained; $12.2M revenue acceleration verified',gate_approver_role:'EVP Commercial Banking',blocker:'',evidence_artifact:''},

    // FCF-INIT-007: Branch Queue Vision AI — KILL
    {initiative_id:'FCF-INIT-007',milestone_id:'M07-0',milestone_name:'Pilot launched',milestone_type:'delivery',target_date:'2024-09-30',actual_date:'2024-09-28',status:'complete',gate_criteria:'3 pilot branches live; camera infrastructure installed',gate_approver_role:'SVP Retail Bank Ops',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-007',milestone_id:'M07-1',milestone_name:'90-day teller adoption review',milestone_type:'gate',target_date:'2025-01-31',actual_date:'2025-02-10',status:'failed',gate_criteria:'≥60% teller adoption; ≥5% transaction throughput improvement',gate_approver_role:'SVP Retail Bank Ops',blocker:'Adoption 18%; privacy review not cleared; throughput flat',evidence_artifact:'FCF-VISION-AI-PILOT-REVIEW-FEB25.pdf'},
    {initiative_id:'FCF-INIT-007',milestone_id:'M07-2',milestone_name:'Kill decision ratified',milestone_type:'gate',target_date:'2026-06-30',actual_date:'',status:'in_progress',gate_criteria:'Kill memo approved by CIO + SVP Retail; camera infrastructure decommission plan filed',gate_approver_role:'CIO',blocker:'Camera lease termination cost ($420K) under CFO review',evidence_artifact:''},

    // FCF-INIT-008: Contact Center Sentiment AI — KILL
    {initiative_id:'FCF-INIT-008',milestone_id:'M08-0',milestone_name:'Deployed: 850 agent seats',milestone_type:'delivery',target_date:'2025-03-31',actual_date:'2025-03-28',status:'complete',gate_criteria:'All contact center agents using sentiment overlay',gate_approver_role:'SVP Client Service',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-008',milestone_id:'M08-1',milestone_name:'6-month AHT review',milestone_type:'gate',target_date:'2025-09-30',actual_date:'2025-10-05',status:'failed',gate_criteria:'≥10% AHT reduction; ≥5% CSAT improvement; no coaching-risk incidents',gate_approver_role:'SVP Client Service',blocker:'AHT unchanged (8.1 vs 8.2 baseline); 3 coaching-risk incidents filed by HR; CSAT flat',evidence_artifact:'FCF-SENTIMENT-AI-REVIEW-OCT25.pdf'},
    {initiative_id:'FCF-INIT-008',milestone_id:'M08-2',milestone_name:'Kill decision + license termination',milestone_type:'gate',target_date:'2026-06-30',actual_date:'',status:'in_progress',gate_criteria:'Kill memo approved; vendor license terminated or converted to base ITSM only',gate_approver_role:'CIO',blocker:'Vendor minimum term runs through Q3 2026',evidence_artifact:''},

    // FCF-INIT-010: M365 Copilot Controlled Rollout
    {initiative_id:'FCF-INIT-010',milestone_id:'M10-0',milestone_name:'1,200 seat controlled pilot',milestone_type:'delivery',target_date:'2025-10-31',actual_date:'2025-10-28',status:'complete',gate_criteria:'Developer + ops cohort live; baseline metrics captured; data-handling policy signed',gate_approver_role:'CIO',blocker:'',evidence_artifact:'FCF-COPILOT-PILOT-OCT25.pdf'},
    {initiative_id:'FCF-INIT-010',milestone_id:'M10-1',milestone_name:'90-day productivity evidence',milestone_type:'gate',target_date:'2026-01-31',actual_date:'2026-02-05',status:'complete',gate_criteria:'≥20% code-completion velocity improvement; ≥15% email triage time reduction; no data-class violations',gate_approver_role:'CIO',blocker:'',evidence_artifact:'FCF-COPILOT-90DAY-EVIDENCE-FEB26.pdf'},
    {initiative_id:'FCF-INIT-010',milestone_id:'M10-2',milestone_name:'Expand to 3,000 seats',milestone_type:'delivery',target_date:'2026-06-30',actual_date:'',status:'in_progress',gate_criteria:'Finance (240 seats) + Ops (180 seats) + Wealth (120 seats) added; privacy impact assessment per function complete',gate_approver_role:'CIO',blocker:'Finance DLP policy for Copilot-for-Excel on GL data under review',evidence_artifact:''},
    {initiative_id:'FCF-INIT-010',milestone_id:'M10-3',milestone_name:'Function-level ROI measured',milestone_type:'gate',target_date:'2026-09-30',actual_date:'',status:'not_started',gate_criteria:'ROI model by function; ≥$9.2M verified productivity savings at 3,000 seats',gate_approver_role:'CFO',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-010',milestone_id:'M10-4',milestone_name:'Enterprise standard (8,000+ seats)',milestone_type:'outcome',target_date:'2027-03-31',actual_date:'',status:'not_started',gate_criteria:'Board approval for enterprise-wide rollout; ≥$24M annualized benefit verified',gate_approver_role:'Board IT Committee',blocker:'',evidence_artifact:''},

    // FCF-INIT-012: Model Risk Evidence Automation
    {initiative_id:'FCF-INIT-012',milestone_id:'M12-0',milestone_name:'47-model inventory complete',milestone_type:'gate',target_date:'2026-01-31',actual_date:'2026-01-29',status:'complete',gate_criteria:'All 47 production models cataloged in model registry with SR 11-7 status',gate_approver_role:'Chief Model Risk Officer',blocker:'',evidence_artifact:'FCF-MODEL-INVENTORY-JAN26.pdf'},
    {initiative_id:'FCF-INIT-012',milestone_id:'M12-1',milestone_name:'Evidence packaging automated: 12 at-risk models',milestone_type:'delivery',target_date:'2026-05-31',actual_date:'',status:'in_progress',gate_criteria:'Automated evidence bundles for 12 SR 11-7 at-risk models; review cycle ≤10 days',gate_approver_role:'Chief Model Risk Officer',blocker:'',evidence_artifact:''},
    {initiative_id:'FCF-INIT-012',milestone_id:'M12-2',milestone_name:'Review cycle ≤6 days',milestone_type:'outcome',target_date:'2026-09-30',actual_date:'',status:'not_started',gate_criteria:'All 47 models on automated evidence refresh; median review cycle ≤6 days',gate_approver_role:'Chief Model Risk Officer',blocker:'',evidence_artifact:''},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T02 — Benefit Realization Tracker (committed vs projected vs realized $)
// ════════════════════════════════════════════════════════════════════════════

write('T02_benefit-realization.csv', csv(
  ['initiative_id','benefit_category','committed_roi_usd','projected_roi_usd','realized_ytd_usd','realization_pct','evidence_quality','evidence_source','last_evidence_date','realizaton_status','next_review_date','notes'],
  [
    {initiative_id:'FCF-INIT-001',benefit_category:'payment_revenue',committed_roi_usd:42000000,projected_roi_usd:42000000,realized_ytd_usd:840000,realization_pct:2,evidence_quality:'low',evidence_source:'payments volume report',last_evidence_date:'2026-05-31',realizaton_status:'far_behind',next_review_date:'2026-09-30',notes:'2% instant pay share vs 35% target; revenue dependent on volume milestone'},
    {initiative_id:'FCF-INIT-002',benefit_category:'compliance_efficiency',committed_roi_usd:21000000,projected_roi_usd:21000000,realized_ytd_usd:1260000,realization_pct:6,evidence_quality:'medium',evidence_source:'case management metrics',last_evidence_date:'2026-05-31',realizaton_status:'blocked',next_review_date:'2026-10-31',notes:'Blocked on SR 11-7; pilot data shows directional improvement but not verifiable at scale'},
    {initiative_id:'FCF-INIT-003',benefit_category:'infrastructure_cost_avoidance',committed_roi_usd:0,projected_roi_usd:0,realized_ytd_usd:0,realization_pct:0,evidence_quality:'none',evidence_source:'',last_evidence_date:'',realizaton_status:'on_hold',next_review_date:'2026-12-31',notes:'HOLD — no benefit case until RFP scoping complete'},
    {initiative_id:'FCF-INIT-004',benefit_category:'fraud_loss_avoidance',committed_roi_usd:28600000,projected_roi_usd:75000000,realized_ytd_usd:26120000,realization_pct:91,evidence_quality:'high',evidence_source:'fraud operations verified report',last_evidence_date:'2026-05-31',realizaton_status:'on_track',next_review_date:'2026-09-30',notes:'$26.1M YTD on $28.6M committed; ACH+wire expansion will push toward $75M target'},
    {initiative_id:'FCF-INIT-005',benefit_category:'new_account_revenue',committed_roi_usd:18400000,projected_roi_usd:18400000,realized_ytd_usd:920000,realization_pct:5,evidence_quality:'low',evidence_source:'digital funnel analytics',last_evidence_date:'2026-05-31',realizaton_status:'behind',next_review_date:'2026-09-30',notes:'Abandonment 58% vs 28% target; KYC friction reduction in progress'},
    {initiative_id:'FCF-INIT-006',benefit_category:'revenue_acceleration',committed_roi_usd:12200000,projected_roi_usd:12200000,realized_ytd_usd:244000,realization_pct:2,evidence_quality:'low',evidence_source:'pilot time study',last_evidence_date:'2026-04-30',realizaton_status:'piloting',next_review_date:'2026-07-31',notes:'8-analyst pilot showing 2-day cycle improvement; scale benefit not yet realized'},
    {initiative_id:'FCF-INIT-007',benefit_category:'throughput_improvement',committed_roi_usd:600000,projected_roi_usd:600000,realized_ytd_usd:0,realization_pct:0,evidence_quality:'none',evidence_source:'',last_evidence_date:'',realizaton_status:'kill_pending',next_review_date:'',notes:'KILL — no value verified; camera infrastructure $420K decommission cost'},
    {initiative_id:'FCF-INIT-008',benefit_category:'contact_center_efficiency',committed_roi_usd:800000,projected_roi_usd:800000,realized_ytd_usd:0,realization_pct:0,evidence_quality:'none',evidence_source:'',last_evidence_date:'',realizaton_status:'kill_pending',next_review_date:'',notes:'KILL — AHT unchanged; coaching-risk incidents; $800K sunk cost + vendor term fee'},
    {initiative_id:'FCF-INIT-009',benefit_category:'advisor_productivity',committed_roi_usd:1700000,projected_roi_usd:1700000,realized_ytd_usd:0,realization_pct:0,evidence_quality:'none',evidence_source:'',last_evidence_date:'',realizaton_status:'kill_pending',next_review_date:'',notes:'KILL — FINRA supervision gap unresolved; client-note data path unauthorized'},
    {initiative_id:'FCF-INIT-010',benefit_category:'developer_productivity',committed_roi_usd:4400000,projected_roi_usd:9200000,realized_ytd_usd:3080000,realization_pct:70,evidence_quality:'high',evidence_source:'GitHub Copilot telemetry + time study',last_evidence_date:'2026-05-31',realizaton_status:'on_track',next_review_date:'2026-09-30',notes:'Developer seats delivering 28% velocity improvement; expansion to 3K seats will accelerate'},
    {initiative_id:'FCF-INIT-010',benefit_category:'operations_productivity',committed_roi_usd:4800000,projected_roi_usd:4800000,realized_ytd_usd:480000,realization_pct:10,evidence_quality:'low',evidence_source:'manager survey',last_evidence_date:'2026-03-31',realizaton_status:'behind',next_review_date:'2026-09-30',notes:'Ops seats not yet deployed; 180 seats in progress; Finance DLP review blocking GL use cases'},
    {initiative_id:'FCF-INIT-011',benefit_category:'underwriting_efficiency',committed_roi_usd:7400000,projected_roi_usd:7400000,realized_ytd_usd:740000,realization_pct:10,evidence_quality:'medium',evidence_source:'underwriter time study',last_evidence_date:'2026-04-30',realizaton_status:'piloting',next_review_date:'2026-08-31',notes:'4-day cycle reduction proven in pilot; MRM validation required before full deploy'},
    {initiative_id:'FCF-INIT-012',benefit_category:'model_risk_efficiency',committed_roi_usd:4100000,projected_roi_usd:4100000,realized_ytd_usd:820000,realization_pct:20,evidence_quality:'medium',evidence_source:'MRM cycle time report',last_evidence_date:'2026-05-31',realizaton_status:'on_track',next_review_date:'2026-09-30',notes:'Review cycle 14 days vs 18 baseline; 4-day savings on 47 models; target 6 days by Q3'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T03 — Copilot Adoption by Function (M365 + GitHub — separate from initiative tracking)
// These are "ambient AI" tools that don't map to a single initiative.
// ════════════════════════════════════════════════════════════════════════════

write('T03_copilot-adoption-by-function.csv', csv(
  ['function_id','function_name','copilot_product','seats_allocated','seats_active','adoption_pct','primary_use_cases','approved_data_scope','dpl_policy_status','verified_time_savings_hrs_per_fte_month','estimated_benefit_usd_annual','evidence_quality','evidence_date','blocker','notes'],
  [
    {function_id:'FCF-BF-TECH',function_name:'Technology',copilot_product:'GitHub Copilot',seats_allocated:1200,seats_active:980,adoption_pct:82,primary_use_cases:'Code completion|Unit test generation|PR review assist|Documentation',approved_data_scope:'internal_code_only',dpl_policy_status:'approved',verified_time_savings_hrs_per_fte_month:18,estimated_benefit_usd_annual:4200000,evidence_quality:'high',evidence_date:'2026-05-31',blocker:'',notes:'28% code-completion velocity improvement; code review throughput +34%; 220 seats inactive (contractor seats)'},
    {function_id:'FCF-BF-TECH',function_name:'Technology',copilot_product:'M365 Copilot',seats_allocated:400,seats_active:340,adoption_pct:85,primary_use_cases:'Meeting transcription|Email summarization|Teams thread synthesis|Incident summary',approved_data_scope:'internal_confidential',dpl_policy_status:'approved',verified_time_savings_hrs_per_fte_month:6,estimated_benefit_usd_annual:920000,evidence_quality:'medium',evidence_date:'2026-05-31',blocker:'',notes:'Meeting transcription most adopted; incident post-mortem drafting saving ~2hr per P1/P2'},
    {function_id:'FCF-BF-FINANCE',function_name:'Finance & Accounting',copilot_product:'M365 Copilot',seats_allocated:240,seats_active:96,adoption_pct:40,primary_use_cases:'Close narrative drafting|Variance commentary|Board deck assembly|FP&A workbook analysis',approved_data_scope:'internal_aggregate_only',dpl_policy_status:'under_review',verified_time_savings_hrs_per_fte_month:3,estimated_benefit_usd_annual:410000,evidence_quality:'low',evidence_date:'2026-04-30',blocker:'DLP policy for Copilot-for-Excel on GL data under CFO review — restricts highest-value use case (close narrative from trial balance)',notes:'Low adoption due to policy uncertainty; finance analysts self-limiting to non-GL documents'},
    {function_id:'FCF-BF-OPS',function_name:'Operations',copilot_product:'M365 Copilot',seats_allocated:180,seats_active:0,adoption_pct:0,primary_use_cases:'Loan servicing correspondence|Case summary|SOP drafting|Escalation triage',approved_data_scope:'pending',dpl_policy_status:'pending',verified_time_savings_hrs_per_fte_month:0,estimated_benefit_usd_annual:0,evidence_quality:'none',evidence_date:'',blocker:'Ops DLP policy not yet filed; PII-in-Teams risk assessment pending',notes:'Seats allocated but not yet activated; expected Q3 2026'},
    {function_id:'FCF-BF-WEALTH',function_name:'Wealth & Private Banking',copilot_product:'M365 Copilot',seats_allocated:120,seats_active:0,adoption_pct:0,primary_use_cases:'Client meeting prep|Portfolio summary|Trust document review|Compliance memo',approved_data_scope:'blocked',dpl_policy_status:'blocked',verified_time_savings_hrs_per_fte_month:0,estimated_benefit_usd_annual:0,evidence_quality:'none',evidence_date:'',blocker:'FINRA supervision framework for AI-assisted client comms not resolved; same issue as Wealth Advisor Copilot kill',notes:'Blocked pending FINRA-compliant supervision model; legal and compliance reviewing'},
    {function_id:'FCF-BF-RISK',function_name:'Risk & Compliance',copilot_product:'M365 Copilot',seats_allocated:80,seats_active:64,adoption_pct:80,primary_use_cases:'Regulatory filing drafting|Audit response memos|SAR narrative assist|Policy drafting',approved_data_scope:'internal_restricted_no_pii',dpl_policy_status:'approved_restricted',verified_time_savings_hrs_per_fte_month:5,estimated_benefit_usd_annual:480000,evidence_quality:'medium',evidence_date:'2026-05-31',blocker:'Cannot use on PII-containing documents or alert data',notes:'SAR narrative assist saving avg 45 min per SAR; limited to non-PII use cases per OCC guidance'},
    {function_id:'FCF-BF-COMMBK',function_name:'Commercial Banking',copilot_product:'M365 Copilot',seats_allocated:60,seats_active:48,adoption_pct:80,primary_use_cases:'Credit memo drafting|Client pitch deck assist|Market commentary',approved_data_scope:'internal_confidential_no_client_data',dpl_policy_status:'approved',verified_time_savings_hrs_per_fte_month:4,estimated_benefit_usd_annual:210000,evidence_quality:'medium',evidence_date:'2026-05-31',blocker:'Cannot use on client financial data or credit files',notes:'Credit memo drafting is primary use case; overlaps with FCF-INIT-006 credit memo AI initiative'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T04 — ERP & Platform-Embedded Agents
// These are AI capabilities embedded in core systems — often untracked and unaccounted for
// in the AI program budget but consuming data, creating model risk, and affecting productivity.
// ════════════════════════════════════════════════════════════════════════════

write('T04_erp-platform-agents.csv', csv(
  ['agent_id','agent_name','parent_system_id','vendor','capability_type','business_function','active_users','ai_feature_status','approved_data_scope','regulated_workflow','monthly_cost_incremental_usd','verified_value','model_risk_assessed','sr117_required','notes'],
  [
    {agent_id:'FCF-ERP-001',agent_name:'Workday Illuminate (AI Assistant)',parent_system_id:'FCF-APP-WORKDAY-HCM',vendor:'Workday',capability_type:'conversational_hr_ai',business_function:'FCF-BF-HR',active_users:14200,ai_feature_status:'active_default_on',approved_data_scope:'internal_hr_only',regulated_workflow:false,monthly_cost_incremental_usd:0,verified_value:'Manager self-service HR query reduction 34%; no time study',model_risk_assessed:false,sr117_required:false,notes:'Default-on in Workday HCM; employees using for payroll queries, PTO, benefits. No formal approval or tracking. No incremental cost (bundled). No model risk assessment done. Gap: no usage telemetry, no benefit measurement, no data governance review.'},
    {agent_id:'FCF-ERP-002',agent_name:'SAP Joule (ERP AI Assistant)',parent_system_id:'FCF-APP-SAP-ECC',vendor:'SAP',capability_type:'erp_conversational_ai',business_function:'FCF-BF-FINANCE',active_users:0,ai_feature_status:'disabled_pending_review',approved_data_scope:'none',regulated_workflow:true,monthly_cost_incremental_usd:0,verified_value:'none — not yet enabled',model_risk_assessed:false,sr117_required:true,notes:'Joule features shipped in SAP ECC update but DISABLED per CFO directive pending data policy review. Finance data (GL, AP, regulatory reporting) is in-scope for SR 11-7 if Joule is used for financial modeling or reporting. Re-enable requires: data classification review, model risk pre-assessment, CFO + Chief Model Risk Officer approval.'},
    {agent_id:'FCF-ERP-003',agent_name:'ServiceNow Now Assist — IT Service Management',parent_system_id:'FCF-APP-SERVICENOW',vendor:'ServiceNow',capability_type:'itsm_ai_deflection',business_function:'FCF-BF-TECH',active_users:1200,ai_feature_status:'active_approved',approved_data_scope:'internal_itsm_tickets',regulated_workflow:false,monthly_cost_incremental_usd:38000,verified_value:'Auto-resolve rate 31% of L1 tickets; avg MTTR L1 reduced 2.1hr',model_risk_assessed:false,sr117_required:false,notes:'Approved for IT incident and request management. 31% auto-resolution rate. CMDB-grounded answers only — no hallucination risk above threshold. Not assessed for model risk (IT ops, not financial model). Monthly cost bundled in Now Assist license.'},
    {agent_id:'FCF-ERP-004',agent_name:'ServiceNow Now Assist — GRC & Compliance',parent_system_id:'FCF-APP-SERVICENOW',vendor:'ServiceNow',capability_type:'grc_ai_policy_assistant',business_function:'FCF-BF-RISK',active_users:940,ai_feature_status:'piloting',approved_data_scope:'internal_grc_only',regulated_workflow:true,monthly_cost_incremental_usd:12000,verified_value:'Evidence-packaging time reduced 3.2hr per audit cycle in pilot',model_risk_assessed:false,sr117_required:true,notes:'GRC AI for control evidence packaging and policy Q&A. PILOT only. Regulatory workflows (OCC, FRB, FinCEN) mean SR 11-7 pre-assessment required before production. OCC has flagged AI in compliance workflows as an examination point. Gap: no model risk pre-assessment filed.'},
    {agent_id:'FCF-ERP-005',agent_name:'ServiceNow Now Assist — HR Case Management',parent_system_id:'FCF-APP-SERVICENOW',vendor:'ServiceNow',capability_type:'hr_case_ai',business_function:'FCF-BF-HR',active_users:280,ai_feature_status:'active_approved',approved_data_scope:'internal_hr_cases_no_pii_in_prompt',regulated_workflow:false,monthly_cost_incremental_usd:8000,verified_value:'HR case deflection rate 28%; avg resolution time -1.4 days',model_risk_assessed:false,sr117_required:false,notes:'HR case management AI. Approved with restriction: PII must not be included in AI prompt (ticket descriptions scrubbed before AI). Benefit is directional — no formal time study.'},
    {agent_id:'FCF-ERP-006',agent_name:'Salesforce Einstein — Wealth Advisor Insights',parent_system_id:'FCF-APP-SALESFORCE-FSC',vendor:'Salesforce',capability_type:'crm_next_best_action',business_function:'FCF-BF-WEALTH',active_users:0,ai_feature_status:'disabled_pending_approval',approved_data_scope:'none',regulated_workflow:true,monthly_cost_incremental_usd:0,verified_value:'none',model_risk_assessed:false,sr117_required:true,notes:'Einstein Next Best Action for wealth advisors is available in FSC license but DISABLED. FINRA supervision issue: if AI recommends a portfolio action, the recommendation must be supervised and attributed. No compliant supervision model in place. Same blocker as Wealth Advisor Copilot kill.'},
    {agent_id:'FCF-ERP-007',agent_name:'Salesforce Einstein — Retail CRM AI',parent_system_id:'FCF-APP-SALESFORCE-FSC',vendor:'Salesforce',capability_type:'crm_lead_scoring',business_function:'FCF-BF-RETAIL',active_users:840,ai_feature_status:'active_conditional',approved_data_scope:'internal_crm_no_credit_data',regulated_workflow:false,monthly_cost_incremental_usd:18000,verified_value:'Lead conversion rate +8% on AI-scored leads; directional only (no control group)',model_risk_assessed:false,sr117_required:false,notes:'Einstein lead scoring active for retail banking. Conditional: cannot use credit data as input (ECOA/fair lending risk). No formal model risk assessment — not classified as a "credit model" per MRM policy. Gap: fair lending review pending for CFPB examination readiness.'},
    {agent_id:'FCF-ERP-008',agent_name:'Pega GenAI Blueprint — Loan Operations',parent_system_id:'FCF-APP-PEGA-CASE',vendor:'Pega',capability_type:'process_automation_ai',business_function:'FCF-BF-OPS',active_users:0,ai_feature_status:'pending_approval',approved_data_scope:'pending',regulated_workflow:true,monthly_cost_incremental_usd:0,verified_value:'Projected: 40% reduction in loan modification case handling time',model_risk_assessed:false,sr117_required:true,notes:'Pega GenAI Blueprint for loan operations case automation. Approval in progress. Regulated workflow (loan modification, loss mitigation) requires SR 11-7 pre-assessment and CFPB examination readiness. Use case is high value but pipeline is gated behind compliance review.'},
    {agent_id:'FCF-ERP-009',agent_name:'Databricks Mosaic AI — Fraud Real-Time Scoring',parent_system_id:'FCF-APP-DATABRICKS',vendor:'Databricks',capability_type:'ml_real_time_scoring',business_function:'FCF-BF-RISK',active_users:160,ai_feature_status:'active_approved',approved_data_scope:'internal_restricted_card_transactions',regulated_workflow:true,monthly_cost_incremental_usd:98000,verified_value:'$26.1M fraud loss avoidance YTD (verified)',model_risk_assessed:true,sr117_required:true,notes:'Fraud graph v2 real-time scoring — the one fully SR 11-7 compliant AI model in production at First Capital. MRM validation complete. OCC no-objection. This is the gold standard for how AI should be governed here.'},
    {agent_id:'FCF-ERP-010',agent_name:'Snowflake Cortex — Analytics AI',parent_system_id:'FCF-APP-SNOWFLAKE',vendor:'Snowflake',capability_type:'data_analytics_ai',business_function:'FCF-BF-TECH',active_users:380,ai_feature_status:'active_conditional',approved_data_scope:'aggregate_masked_only',regulated_workflow:false,monthly_cost_incremental_usd:42000,verified_value:'Data analyst query time -22%; directional',model_risk_assessed:false,sr117_required:false,notes:'Cortex AI for analytics use. Restricted to masked or aggregate data. No production model risk (analytics only, not decisioning). AI-generated SQL is reviewed before execution. Gap: no formal usage telemetry or benefit measurement.'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T05 — ServiceNow Automation Metrics by Workflow
// ════════════════════════════════════════════════════════════════════════════

write('T05_servicenow-automation-metrics.csv', csv(
  ['workflow_id','workflow_name','workflow_type','business_function','monthly_volume_tickets','ai_deflection_rate_pct','auto_resolve_rate_pct','avg_mttr_before_hrs','avg_mttr_after_hrs','mttr_delta_hrs','fte_equivalent_saved','monthly_cost_avoided_usd','ai_feature_status','notes'],
  [
    {workflow_id:'SNW-001',workflow_name:'Password Reset & MFA',workflow_type:'itsm_l1',business_function:'all',monthly_volume_tickets:2840,ai_deflection_rate_pct:68,auto_resolve_rate_pct:61,avg_mttr_before_hrs:0.5,avg_mttr_after_hrs:0.08,mttr_delta_hrs:0.42,fte_equivalent_saved:4.2,monthly_cost_avoided_usd:18200,ai_feature_status:'active',notes:'Highest-volume, highest-AI-deflection workflow; Now Assist + Virtual Agent handling 61% fully automated'},
    {workflow_id:'SNW-002',workflow_name:'Software Access Request',workflow_type:'itsm_l1',business_function:'all',monthly_volume_tickets:1920,ai_deflection_rate_pct:42,auto_resolve_rate_pct:38,avg_mttr_before_hrs:8.0,avg_mttr_after_hrs:2.1,mttr_delta_hrs:5.9,fte_equivalent_saved:2.8,monthly_cost_avoided_usd:12100,ai_feature_status:'active',notes:'CMDB-grounded access rules power 38% auto-approval; complex exceptions still routed to human'},
    {workflow_id:'SNW-003',workflow_name:'Laptop & Hardware Issues',workflow_type:'itsm_l2',business_function:'FCF-BF-TECH',monthly_volume_tickets:840,ai_deflection_rate_pct:22,auto_resolve_rate_pct:14,avg_mttr_before_hrs:6.2,avg_mttr_after_hrs:4.8,mttr_delta_hrs:1.4,fte_equivalent_saved:0.6,monthly_cost_avoided_usd:2600,ai_feature_status:'active',notes:'Physical hardware requires human dispatch; AI limited to triage and dispatch routing'},
    {workflow_id:'SNW-004',workflow_name:'Core Banking Incident (P1/P2)',workflow_type:'itsm_major_incident',business_function:'FCF-BF-RETAIL',monthly_volume_tickets:18,ai_deflection_rate_pct:0,auto_resolve_rate_pct:0,avg_mttr_before_hrs:4.2,avg_mttr_after_hrs:3.1,mttr_delta_hrs:1.1,fte_equivalent_saved:0.5,monthly_cost_avoided_usd:8800,ai_feature_status:'active_assist_only',notes:'AI not auto-resolving P1/P2 — human in the loop required. AI providing runbook suggestions and similar-incident retrieval; saving ~1.1hr per incident in bridge time'},
    {workflow_id:'SNW-005',workflow_name:'GRC Control Evidence Request',workflow_type:'grc_compliance',business_function:'FCF-BF-RISK',monthly_volume_tickets:320,ai_deflection_rate_pct:28,auto_resolve_rate_pct:0,avg_mttr_before_hrs:18.0,avg_mttr_after_hrs:14.8,mttr_delta_hrs:3.2,fte_equivalent_saved:2.4,monthly_cost_avoided_usd:4800,ai_feature_status:'piloting',notes:'PILOT: AI packaging evidence from CMDB + Splunk + change records; SR 11-7 pre-assessment required before production — regulatory workflow'},
    {workflow_id:'SNW-006',workflow_name:'HR Onboarding Task',workflow_type:'hr_case',business_function:'FCF-BF-HR',monthly_volume_tickets:280,ai_deflection_rate_pct:35,auto_resolve_rate_pct:28,avg_mttr_before_hrs:2.4,avg_mttr_after_hrs:1.4,mttr_delta_hrs:1.0,fte_equivalent_saved:0.8,monthly_cost_avoided_usd:3200,ai_feature_status:'active',notes:'Onboarding task orchestration; PII scrubbed from AI prompt per policy; new hire day-1 experience improved'},
    {workflow_id:'SNW-007',workflow_name:'Model Risk Evidence Package',workflow_type:'mrm_governance',business_function:'FCF-BF-RISK',monthly_volume_tickets:47,ai_deflection_rate_pct:60,auto_resolve_rate_pct:0,avg_mttr_before_hrs:86.0,avg_mttr_after_hrs:54.0,mttr_delta_hrs:32.0,fte_equivalent_saved:3.4,monthly_cost_avoided_usd:14200,ai_feature_status:'active',notes:'Model risk evidence packaging (FCF-INIT-012): AI assembling data lineage, performance metrics, bias test results from Databricks + ServiceNow; 32hr saved per model review'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T06 — Function-Level AI Productivity Scorecard
// Roll-up of all personas + all AI tools in each business function.
// ════════════════════════════════════════════════════════════════════════════

write('T06_function-ai-productivity-scorecard.csv', csv(
  ['function_id','function_name','total_fte','ai_active_fte','ai_adoption_pct','ai_eligible_fte_pct','ai_tools_count','ai_tools_approved','ai_tools_conditional','ai_tools_blocked_or_kill','ai_spend_fy26_usd','benefit_committed_usd','benefit_realized_ytd_usd','realization_pct','top_value_driver','biggest_blocker','tower_rag_status'],
  [
    {function_id:'FCF-BF-TECH',function_name:'Technology',total_fte:2240,ai_active_fte:1320,ai_adoption_pct:59,ai_eligible_fte_pct:85,ai_tools_count:6,ai_tools_approved:4,ai_tools_conditional:2,ai_tools_blocked_or_kill:0,ai_spend_fy26_usd:18200000,benefit_committed_usd:13400000,benefit_realized_ytd_usd:3980000,realization_pct:30,top_value_driver:'GitHub Copilot: 28% code velocity improvement on 980 engineers',biggest_blocker:'Ops DLP policy delays M365 Copilot ops expansion',tower_rag_status:'amber'},
    {function_id:'FCF-BF-RISK',function_name:'Risk & Compliance',total_fte:940,ai_active_fte:484,ai_adoption_pct:51,ai_eligible_fte_pct:62,ai_tools_count:5,ai_tools_approved:2,ai_tools_conditional:2,ai_tools_blocked_or_kill:1,ai_spend_fy26_usd:12800000,benefit_committed_usd:25100000,benefit_realized_ytd_usd:2080000,realization_pct:8,top_value_driver:'Fraud Graph v2: $26.1M fraud avoidance YTD (only fully-proven AI at scale)',biggest_blocker:'SR 11-7 MRM queue blocking AML triage scale — 12 models need validation; 7-month backlog',tower_rag_status:'red'},
    {function_id:'FCF-BF-RETAIL',function_name:'Retail Banking',total_fte:6800,ai_active_fte:544,ai_adoption_pct:8,ai_eligible_fte_pct:45,ai_tools_count:3,ai_tools_approved:1,ai_tools_conditional:1,ai_tools_blocked_or_kill:1,ai_spend_fy26_usd:4100000,benefit_committed_usd:18400000,benefit_realized_ytd_usd:920000,realization_pct:5,top_value_driver:'Digital account opening recovery (in progress; abandonment 58% → target 28%)',biggest_blocker:'3,200 branch bankers have 8% AI adoption — highest AI-eligible FTE count with lowest adoption',tower_rag_status:'red'},
    {function_id:'FCF-BF-OPS',function_name:'Operations',total_fte:1680,ai_active_fte:0,ai_adoption_pct:0,ai_eligible_fte_pct:40,ai_tools_count:3,ai_tools_approved:0,ai_tools_conditional:0,ai_tools_blocked_or_kill:3,ai_spend_fy26_usd:2400000,benefit_committed_usd:800000,benefit_realized_ytd_usd:0,realization_pct:0,top_value_driver:'None — all AI initiatives in Operations are Kill candidates or pending approval',biggest_blocker:'Contact center sentiment AI (KILL); Pega GenAI pending SR 11-7; M365 Copilot DLP policy pending',tower_rag_status:'red'},
    {function_id:'FCF-BF-COMMBK',function_name:'Commercial Banking',total_fte:2100,ai_active_fte:328,ai_adoption_pct:16,ai_eligible_fte_pct:55,ai_tools_count:3,ai_tools_approved:2,ai_tools_conditional:1,ai_tools_blocked_or_kill:0,ai_spend_fy26_usd:3400000,benefit_committed_usd:12200000,benefit_realized_ytd_usd:244000,realization_pct:2,top_value_driver:'Credit memo AI pilot (8 analysts, 2-day improvement); expanding to 280 analysts pending MRM',biggest_blocker:'MRM validation queue for credit memo AI; CFPB fair-lending model review',tower_rag_status:'amber'},
    {function_id:'FCF-BF-WEALTH',function_name:'Wealth & Private Banking',total_fte:680,ai_active_fte:0,ai_adoption_pct:0,ai_eligible_fte_pct:70,ai_tools_count:3,ai_tools_approved:0,ai_tools_conditional:0,ai_tools_blocked_or_kill:3,ai_spend_fy26_usd:3100000,benefit_committed_usd:1700000,benefit_realized_ytd_usd:0,realization_pct:0,top_value_driver:'None — all three Wealth AI initiatives are Kill candidates or blocked',biggest_blocker:'FINRA supervision framework for AI-assisted client comms not resolved; blocks Copilot, Einstein, and Copilot Shadow',tower_rag_status:'red'},
    {function_id:'FCF-BF-FINANCE',function_name:'Finance & Accounting',total_fte:580,ai_active_fte:96,ai_adoption_pct:17,ai_eligible_fte_pct:60,ai_tools_count:2,ai_tools_approved:0,ai_tools_conditional:2,ai_tools_blocked_or_kill:0,ai_spend_fy26_usd:1600000,benefit_committed_usd:4100000,benefit_realized_ytd_usd:820000,realization_pct:20,top_value_driver:'Model risk evidence automation (FCF-INIT-012): 4-day review cycle reduction',biggest_blocker:'CFO DLP review blocking M365 Copilot on GL data — highest-value Finance AI use case frozen',tower_rag_status:'amber'},
    {function_id:'FCF-BF-HR',function_name:'Human Resources',total_fte:280,ai_active_fte:14200,ai_adoption_pct:100,ai_eligible_fte_pct:30,ai_tools_count:2,ai_tools_approved:2,ai_tools_conditional:0,ai_tools_blocked_or_kill:0,ai_spend_fy26_usd:0,benefit_committed_usd:0,benefit_realized_ytd_usd:0,realization_pct:0,top_value_driver:'Workday Illuminate + ServiceNow HR: 34% HR query deflection; 28% case deflection (untracked cost avoidance)',biggest_blocker:'No formal benefit tracking for ambient HR AI — $0 in Tower because no initiative owns it',tower_rag_status:'amber'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T07 — Production AI Model Risk Inventory (47 models, SR 11-7 status)
// ════════════════════════════════════════════════════════════════════════════

const modelInventory = [
  // Fully validated
  {model_id:'FCF-MDL-001',model_name:'Fraud Graph Scoring v2',domain:'fraud_detection',system_id:'FCF-APP-DATABRICKS',business_function:'FCF-BF-RISK',model_type:'graph_neural_network',deployment_env:'production',decisioning_impact:'high',sr117_tier:'tier_1',validation_status:'current',last_validation_date:'2025-12-15',next_validation_date:'2026-12-15',open_findings:0,mra_linked:false,notes:'Gold standard — only fully SR 11-7 current model at First Capital; $26.1M verified value'},
  {model_id:'FCF-MDL-002',model_name:'Card Transaction Anomaly v4',domain:'fraud_detection',system_id:'FCF-APP-DATABRICKS',business_function:'FCF-BF-RISK',model_type:'isolation_forest_ensemble',deployment_env:'production',decisioning_impact:'high',sr117_tier:'tier_1',validation_status:'current',last_validation_date:'2025-11-01',next_validation_date:'2026-11-01',open_findings:0,mra_linked:false,notes:'Real-time card transaction scoring; deployed alongside fraud graph'},
  {model_id:'FCF-MDL-003',model_name:'Credit Bureau Score Adjuster',domain:'credit_risk',system_id:'FCF-APP-NCINO',business_function:'FCF-BF-COMMBK',model_type:'logistic_regression',deployment_env:'production',decisioning_impact:'high',sr117_tier:'tier_1',validation_status:'current',last_validation_date:'2025-08-20',next_validation_date:'2026-08-20',open_findings:1,mra_linked:false,notes:'1 open finding: CFPB ECOA explainability gap for adverse action notices; remediation in progress'},

  // At-risk — validation overdue or expiring
  ...Array.from({length:12}, (_,i) => ({
    model_id:`FCF-MDL-${String(i+10).padStart(3,'0')}`,
    model_name:['AML Alert Prioritizer','KYC Risk Score','Sanctions Name Match','Mortgage Default Predictor','Commercial Credit PD Model','LTV Estimator v3','Deposit Attrition Predictor','Interest Rate Sensitivity','Liquidity Stress Model','Collections Propensity','Branch Staffing Optimizer','FedNow Fraud Pre-Screen'][i],
    domain:['aml','kyc','sanctions','credit_risk','credit_risk','credit_risk','deposit','market_risk','liquidity','collections','workforce','fraud_detection'][i],
    system_id:['FCF-APP-NICE-ACTIMIZE','FCF-APP-FENERGO-KYC','FCF-APP-NICE-ACTIMIZE','FCF-APP-FIS-HORIZON','FCF-APP-NCINO','FCF-APP-FIS-HORIZON','FCF-APP-SALESFORCE-FSC','FCF-APP-MUREX-TREASURY','FCF-APP-MUREX-TREASURY','FCF-APP-PEGA-CASE','FCF-APP-WORKDAY-HCM','FCF-APP-FEDNOW-RTP'][i],
    business_function:['FCF-BF-RISK','FCF-BF-RISK','FCF-BF-RISK','FCF-BF-RETAIL','FCF-BF-COMMBK','FCF-BF-RETAIL','FCF-BF-RETAIL','FCF-BF-TREASURY','FCF-BF-TREASURY','FCF-BF-OPS','FCF-BF-HR','FCF-BF-OPS'][i],
    model_type:['xgboost','logistic_regression','fuzzy_string_match','gradient_boosting','scorecard','linear_regression','survival_model','var_model','stress_test_scenario','propensity_model','staffing_algorithm','rule_based_ml'][i],
    deployment_env:'production',
    decisioning_impact:'high',
    sr117_tier:'tier_1',
    validation_status:'overdue',
    last_validation_date:`202${4-Math.floor(i/6)}-${String((i%12)+1).padStart(2,'0')}-15`,
    next_validation_date:`2026-${String((i%6)+7).padStart(2,'0')}-15`,
    open_findings: 1 + (i % 3),
    mra_linked: i < 4,
    notes:`SR 11-7 validation overdue; MRM review slot requested Q${Math.min(3+Math.floor(i/4),4)} 2026; blocking AI scale decisions`,
  })),

  // Active but lower-risk (not tier 1)
  ...Array.from({length:32}, (_,i) => ({
    model_id:`FCF-MDL-${String(i+30).padStart(3,'0')}`,
    model_name:`Analytics Model ${i+1}`,
    domain:['marketing_analytics','ops_analytics','data_quality','reporting','forecasting','segmentation'][i%6],
    system_id:['FCF-APP-SNOWFLAKE','FCF-APP-DATABRICKS','FCF-APP-SALESFORCE-FSC'][i%3],
    business_function:['FCF-BF-DIGITAL','FCF-BF-OPS','FCF-BF-FINANCE','FCF-BF-TECH','FCF-BF-RETAIL','FCF-BF-COMMBK'][i%6],
    model_type:['clustering','time_series','regression','classification','nlp','recommendation'][i%6],
    deployment_env:'production',
    decisioning_impact:'low',
    sr117_tier:'tier_2',
    validation_status: i % 5 === 0 ? 'expiring_soon' : 'current',
    last_validation_date:`2025-${String((i%12)+1).padStart(2,'0')}-01`,
    next_validation_date:`2026-${String((i%12)+1).padStart(2,'0')}-01`,
    open_findings:0,
    mra_linked:false,
    notes:'Tier 2 analytics model; lower decisioning impact; standard review cycle',
  })),
];

write('T07_model-risk-inventory.csv', csv(
  ['model_id','model_name','domain','system_id','business_function','model_type','deployment_env','decisioning_impact','sr117_tier','validation_status','last_validation_date','next_validation_date','open_findings','mra_linked','notes'],
  modelInventory
));

// ════════════════════════════════════════════════════════════════════════════
// T08 — AI Spend by Initiative (YTD Actuals vs Budget)
// ════════════════════════════════════════════════════════════════════════════

write('T08_ai-spend-by-initiative.csv', csv(
  ['initiative_id','title','posture','fy26_budget_usd','ytd_actuals_usd','ytd_burn_rate_pct','fte_labor_usd','vendor_tools_usd','infra_usd','external_si_usd','projected_year_end_usd','variance_usd','variance_pct','notes'],
  [
    {initiative_id:'FCF-INIT-001',title:'FedNow and RTP Modernization',posture:'Restructure',fy26_budget_usd:18600000,ytd_actuals_usd:9860000,ytd_burn_rate_pct:53,fte_labor_usd:4200000,vendor_tools_usd:2400000,infra_usd:1800000,external_si_usd:1460000,projected_year_end_usd:19800000,variance_usd:-1200000,variance_pct:-6,notes:'Over budget by 6%; sanctions screening remediation adding $1.2M unplanned cost'},
    {initiative_id:'FCF-INIT-002',title:'AML Case Triage Automation',posture:'Restructure',fy26_budget_usd:8900000,ytd_actuals_usd:4100000,ytd_burn_rate_pct:46,fte_labor_usd:2200000,vendor_tools_usd:980000,infra_usd:420000,external_si_usd:500000,projected_year_end_usd:8200000,variance_usd:700000,variance_pct:8,notes:'Under-spending due to MRM blockage — pilot paused; budget underspend is a warning sign not a win'},
    {initiative_id:'FCF-INIT-003',title:'Core Banking Future Decision',posture:'Hold',fy26_budget_usd:14000000,ytd_actuals_usd:2800000,ytd_burn_rate_pct:20,fte_labor_usd:1400000,vendor_tools_usd:0,infra_usd:0,external_si_usd:1400000,projected_year_end_usd:6200000,variance_usd:7800000,variance_pct:56,notes:'HOLD — spending only on migration study and legal review; large underspend expected'},
    {initiative_id:'FCF-INIT-004',title:'Fraud Graph Analytics v2',posture:'Continue',fy26_budget_usd:7300000,ytd_actuals_usd:4020000,ytd_burn_rate_pct:55,fte_labor_usd:1800000,vendor_tools_usd:1200000,infra_usd:820000,external_si_usd:200000,projected_year_end_usd:7100000,variance_usd:200000,variance_pct:3,notes:'On track; ACH+wire expansion adding modest infra cost; ROI clearly positive'},
    {initiative_id:'FCF-INIT-005',title:'Digital Account Opening Recovery',posture:'Continue',fy26_budget_usd:4100000,ytd_actuals_usd:2050000,ytd_burn_rate_pct:50,fte_labor_usd:1200000,vendor_tools_usd:480000,infra_usd:200000,external_si_usd:170000,projected_year_end_usd:4200000,variance_usd:-100000,variance_pct:-2,notes:'On budget; CFPB legal review causing 6-week delay but no budget impact yet'},
    {initiative_id:'FCF-INIT-006',title:'Commercial Credit Memo AI',posture:'Continue',fy26_budget_usd:3400000,ytd_actuals_usd:1020000,ytd_burn_rate_pct:30,fte_labor_usd:680000,vendor_tools_usd:220000,infra_usd:80000,external_si_usd:40000,projected_year_end_usd:3100000,variance_usd:300000,variance_pct:9,notes:'Under-spending; MRM validation delay pushing costs to H2'},
    {initiative_id:'FCF-INIT-007',title:'Branch Queue Vision AI',posture:'Kill',fy26_budget_usd:1900000,ytd_actuals_usd:1120000,ytd_burn_rate_pct:59,fte_labor_usd:280000,vendor_tools_usd:420000,infra_usd:120000,external_si_usd:300000,projected_year_end_usd:1640000,variance_usd:260000,variance_pct:14,notes:'KILL — $420K camera lease termination cost; $1.12M sunk; stop further spend immediately'},
    {initiative_id:'FCF-INIT-008',title:'Contact Center Sentiment AI',posture:'Kill',fy26_budget_usd:2400000,ytd_actuals_usd:1200000,ytd_burn_rate_pct:50,fte_labor_usd:200000,vendor_tools_usd:800000,infra_usd:60000,external_si_usd:140000,projected_year_end_usd:2000000,variance_usd:400000,variance_pct:17,notes:'KILL — vendor minimum term through Q3; $400K savings vs budget if terminated at contract break'},
    {initiative_id:'FCF-INIT-009',title:'Wealth Advisor Copilot Shadow',posture:'Kill',fy26_budget_usd:3100000,ytd_actuals_usd:1550000,ytd_burn_rate_pct:50,fte_labor_usd:800000,vendor_tools_usd:480000,infra_usd:120000,external_si_usd:150000,projected_year_end_usd:2900000,variance_usd:200000,variance_pct:6,notes:'KILL — FINRA blocker unresolvable in 2026; terminate and redeploy budget to proven ROI initiatives'},
    {initiative_id:'FCF-INIT-010',title:'M365 Copilot Controlled Rollout',posture:'Continue',fy26_budget_usd:3800000,ytd_actuals_usd:2280000,ytd_burn_rate_pct:60,fte_labor_usd:600000,vendor_tools_usd:1400000,infra_usd:80000,external_si_usd:200000,projected_year_end_usd:3900000,variance_usd:-100000,variance_pct:-3,notes:'On budget; expansion from 1,200 to 3,000 seats in H2 will push full-year spend ~$100K over'},
    {initiative_id:'FCF-INIT-011',title:'Mortgage Document Intelligence',posture:'Continue',fy26_budget_usd:2800000,ytd_actuals_usd:840000,ytd_burn_rate_pct:30,fte_labor_usd:480000,vendor_tools_usd:220000,infra_usd:80000,external_si_usd:60000,projected_year_end_usd:2600000,variance_usd:200000,variance_pct:7,notes:'Under-spending; MRM validation in H2 will consume remaining budget'},
    {initiative_id:'FCF-INIT-012',title:'Model Risk Evidence Automation',posture:'Continue',fy26_budget_usd:1600000,ytd_actuals_usd:800000,ytd_burn_rate_pct:50,fte_labor_usd:480000,vendor_tools_usd:180000,infra_usd:60000,external_si_usd:80000,projected_year_end_usd:1580000,variance_usd:20000,variance_pct:1,notes:'On budget; delivering strong ROI relative to spend'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T09 — AI Risk Register (AI-specific operational risks)
// ════════════════════════════════════════════════════════════════════════════

write('T09_ai-risk-register.csv', csv(
  ['risk_id','risk_name','risk_type','linked_system_id','linked_initiative_id','likelihood','impact','risk_score','current_control','control_adequacy','owner_role','regulatory_implication','status','notes'],
  [
    {risk_id:'FCF-AIRSK-001',risk_name:'AML triage model deployed without SR 11-7 validation',risk_type:'model_risk_regulatory',linked_system_id:'FCF-APP-NICE-ACTIMIZE|FCF-APP-DATABRICKS',linked_initiative_id:'FCF-INIT-002',likelihood:'high',impact:'critical',risk_score:20,current_control:'Model in pilot only; not in production AML decision',control_adequacy:'adequate_for_now',owner_role:'Chief Model Risk Officer',regulatory_implication:'OCC examination finding; potential MRA if deployed without validation',status:'open',notes:'Risk escalates if business pressure leads to production deployment before MRM slot available (Q3 2026 earliest)'},
    {risk_id:'FCF-AIRSK-002',risk_name:'Workday Illuminate (AI) processing HR data without formal risk assessment',risk_type:'ungoverned_ai',linked_system_id:'FCF-APP-WORKDAY-HCM',linked_initiative_id:'',likelihood:'high',impact:'medium',risk_score:12,current_control:'Default-on feature; no data governance review completed',control_adequacy:'inadequate',owner_role:'CHRO',regulatory_implication:'CFPB: AI in employment decisions (if extended to performance); EEOC: bias in AI-assisted HR',status:'open',notes:'14,200 employees interacting with AI tool with no formal approval, no bias assessment, no usage telemetry. Requires immediate data governance review.'},
    {risk_id:'FCF-AIRSK-003',risk_name:'SAP Joule inadvertently re-enabled via SAP update',risk_type:'shadow_ai',linked_system_id:'FCF-APP-SAP-ECC',linked_initiative_id:'',likelihood:'medium',impact:'high',risk_score:12,current_control:'CFO directive to disable; no technical enforcement',control_adequacy:'inadequate',owner_role:'CIO',regulatory_implication:'SR 11-7 if Joule used for financial modeling; OCC MRA for unvalidated model in regulatory reporting workflow',status:'open',notes:'Joule disabled by config but SAP updates can re-enable features. Technical control (feature flag lockdown) not yet implemented. Next SAP update scheduled Q3 2026.'},
    {risk_id:'FCF-AIRSK-004',risk_name:'GitHub Copilot generating code with embedded API keys or PII',risk_type:'data_exfiltration',linked_system_id:'FCF-APP-DATABRICKS',linked_initiative_id:'FCF-INIT-010',likelihood:'medium',impact:'high',risk_score:12,current_control:'DLP policy on code repos; Copilot telemetry reviewed monthly',control_adequacy:'adequate',owner_role:'CISO',regulatory_implication:'GLBA safeguards; PCI DSS if payment card data in generated code',status:'monitoring',notes:'DLP scanning in place; one near-miss in Q1 2026 (developer hardcoded test credential, caught by DLP). No breach. Monthly review cadence adequate.'},
    {risk_id:'FCF-AIRSK-005',risk_name:'Salesforce Einstein Retail scoring using inputs that proxy for protected class',risk_type:'fair_lending_ai',linked_system_id:'FCF-APP-SALESFORCE-FSC',linked_initiative_id:'',likelihood:'medium',impact:'critical',risk_score:16,current_control:'Conditional: credit data excluded from Einstein input',control_adequacy:'partial',owner_role:'Chief Compliance Officer',regulatory_implication:'CFPB ECOA; potential fair lending examination finding if proxy variables present',status:'open',notes:'CFPB examination readiness review pending; Einstein input features not fully audited for proxy risk. Fair lending impact assessment required before next exam.'},
    {risk_id:'FCF-AIRSK-006',risk_name:'12 production AI models operating past SR 11-7 validation expiry',risk_type:'model_risk_regulatory',linked_system_id:'FCF-APP-DATABRICKS|FCF-APP-NICE-ACTIMIZE|FCF-APP-FIS-HORIZON',linked_initiative_id:'FCF-INIT-012',likelihood:'certain',impact:'high',risk_score:20,current_control:'Model inventory tracking; MRM review slots requested',control_adequacy:'inadequate',owner_role:'Chief Model Risk Officer',regulatory_implication:'Federal Reserve SR 11-7; OCC MRA if identified in examination; blocks AML and credit AI scale',status:'open',notes:'This is the most material AI governance risk at First Capital. 12 tier-1 models overdue for validation. MRM team has 7-month backlog. FCF-INIT-012 is the remediation path.'},
    {risk_id:'FCF-AIRSK-007',risk_name:'AI-generated SAR narratives not reviewed before filing',risk_type:'regulatory_process',linked_system_id:'FCF-APP-NICE-ACTIMIZE',linked_initiative_id:'FCF-INIT-002',likelihood:'low',impact:'critical',risk_score:8,current_control:'Policy: AI-assisted drafts require human review before FinCEN submission',control_adequacy:'adequate',owner_role:'Chief Compliance Officer',regulatory_implication:'BSA/AML: inaccurate SAR = criminal liability; FinCEN examination finding',status:'controlled',notes:'Policy and system controls in place. Human review required for all AI-assisted SARs. Monitoring for control drift as AML triage scales.'},
    {risk_id:'FCF-AIRSK-008',risk_name:'M365 Copilot summarizing confidential client communications in Teams',risk_type:'data_privacy',linked_system_id:'',linked_initiative_id:'FCF-INIT-010',likelihood:'medium',impact:'high',risk_score:12,current_control:'DLP policy restricts certain channels; Copilot excluded from client-facing Teams channels',control_adequacy:'partial',owner_role:'CISO',regulatory_implication:'GLBA; CCPA if consumer data; FINRA if wealth advisor channels',status:'open',notes:'Configuration partially complete. Wealth and commercial banker channels not yet fully scoped. Data classification of Teams channels incomplete.'},
  ]
));

// ════════════════════════════════════════════════════════════════════════════
// T10 — Gate Approval History (sponsor sign-offs per initiative)
// ════════════════════════════════════════════════════════════════════════════

write('T10_gate-approval-history.csv', csv(
  ['gate_id','initiative_id','gate_name','gate_date','approved_by_role','approved_by_name','decision','conditions','next_gate','next_gate_target_date'],
  [
    {gate_id:'GAP-001',initiative_id:'FCF-INIT-001',gate_name:'Business Case Approval',gate_date:'2025-09-28',approved_by_role:'SVP Payments Technology',approved_by_name:'[Synthetic]',decision:'approved',conditions:'Sanctions screening must reach OCC sign-off before full go-live',next_gate:'Sanctions Screening Gate',next_gate_target_date:'2026-03-31'},
    {gate_id:'GAP-002',initiative_id:'FCF-INIT-001',gate_name:'Core API Integration Complete',gate_date:'2026-01-14',approved_by_role:'SVP Payments Technology',approved_by_name:'[Synthetic]',decision:'approved',conditions:'FedNow ops runbook due Q2 2026',next_gate:'24x7 Ops Readiness',next_gate_target_date:'2026-06-30'},
    {gate_id:'GAP-003',initiative_id:'FCF-INIT-002',gate_name:'Business Case Approval',gate_date:'2025-10-12',approved_by_role:'Chief Risk Officer',approved_by_name:'[Synthetic]',decision:'approved',conditions:'SR 11-7 pre-assessment must complete before pilot goes to production',next_gate:'SR 11-7 Validation',next_gate_target_date:'2026-04-30'},
    {gate_id:'GAP-004',initiative_id:'FCF-INIT-002',gate_name:'Model Development Complete',gate_date:'2026-02-10',approved_by_role:'Chief Model Risk Officer',approved_by_name:'[Synthetic]',decision:'approved',conditions:'Model not to be used in production AML decisioning until SR 11-7 complete',next_gate:'SR 11-7 Validation',next_gate_target_date:'2026-07-31'},
    {gate_id:'GAP-005',initiative_id:'FCF-INIT-004',gate_name:'Business Case Approval',gate_date:'2025-04-28',approved_by_role:'Chief Risk Officer',approved_by_name:'[Synthetic]',decision:'approved',conditions:'MRM validation prior to ACH extension',next_gate:'90-Day Fraud Evidence',next_gate_target_date:'2025-12-31'},
    {gate_id:'GAP-006',initiative_id:'FCF-INIT-004',gate_name:'90-Day Fraud Evidence',gate_date:'2026-01-02',approved_by_role:'Board Risk Committee',approved_by_name:'[Synthetic]',decision:'approved',conditions:'None — evidence exceeded threshold; scale to ACH+wire approved',next_gate:'ACH+Wire Expansion',next_gate_target_date:'2026-06-30'},
    {gate_id:'GAP-007',initiative_id:'FCF-INIT-007',gate_name:'90-Day Teller Adoption Review',gate_date:'2025-02-10',approved_by_role:'SVP Retail Bank Ops',approved_by_name:'[Synthetic]',decision:'failed',conditions:'Adoption 18% vs 60% required; privacy review not cleared; initiative on watchlist',next_gate:'Kill Decision',next_gate_target_date:'2026-06-30'},
    {gate_id:'GAP-008',initiative_id:'FCF-INIT-008',gate_name:'6-Month AHT Review',gate_date:'2025-10-05',approved_by_role:'SVP Client Service',approved_by_name:'[Synthetic]',decision:'failed',conditions:'AHT unchanged; coaching-risk incidents; recommend kill at next IT governance meeting',next_gate:'Kill Decision',next_gate_target_date:'2026-06-30'},
    {gate_id:'GAP-009',initiative_id:'FCF-INIT-010',gate_name:'1,200 Seat Pilot Live',gate_date:'2025-10-28',approved_by_role:'CIO',approved_by_name:'[Synthetic]',decision:'approved',conditions:'Data-handling policy to be renewed at 90-day review',next_gate:'90-Day Productivity Evidence',next_gate_target_date:'2026-01-31'},
    {gate_id:'GAP-010',initiative_id:'FCF-INIT-010',gate_name:'90-Day Productivity Evidence',gate_date:'2026-02-05',approved_by_role:'CIO',approved_by_name:'[Synthetic]',decision:'approved',conditions:'Finance DLP policy must be resolved before GL-connected Copilot use cases',next_gate:'3,000 Seat Expansion',next_gate_target_date:'2026-06-30'},
    {gate_id:'GAP-011',initiative_id:'FCF-INIT-012',gate_name:'47-Model Inventory Complete',gate_date:'2026-01-29',approved_by_role:'Chief Model Risk Officer',approved_by_name:'[Synthetic]',decision:'approved',conditions:'12 at-risk models prioritized for Q2-Q3 2026 evidence packaging',next_gate:'12 At-Risk Models Automated',next_gate_target_date:'2026-05-31'},
  ]
));

// Update verification
const supplementCounts = {
  initiative_milestones: 44,
  benefit_realization_rows: 13,
  copilot_by_function_rows: 7,
  erp_platform_agents: 10,
  servicenow_automation_workflows: 7,
  function_scorecard_rows: 8,
  model_risk_inventory: modelInventory.length,
  ai_spend_rows: 12,
  ai_risk_register: 8,
  gate_approval_history: 11,
};

write('../99-verification/tower-supplement-counts.json', JSON.stringify({
  supplement: 'ai-control-tower',
  generated_at: GENERATED_AT,
  ...supplementCounts,
  total_tower_rows: Object.values(supplementCounts).reduce((a,b) => a+b, 0),
}, null, 2));

console.log(`\n✓ AI Control Tower supplement generated at ${ROOT}`);
console.log(`  Initiative milestones: ${supplementCounts.initiative_milestones} (across 10 initiatives)`);
console.log(`  Benefit realization: ${supplementCounts.benefit_realization_rows} rows`);
console.log(`  Copilot by function: ${supplementCounts.copilot_by_function_rows} function×product rows`);
console.log(`  ERP/Platform agents: ${supplementCounts.erp_platform_agents} (Workday, SAP Joule, ServiceNow, Salesforce, Databricks, Snowflake, Pega)`);
console.log(`  ServiceNow workflows: ${supplementCounts.servicenow_automation_workflows}`);
console.log(`  Function productivity scorecard: ${supplementCounts.function_scorecard_rows} functions`);
console.log(`  Model risk inventory: ${supplementCounts.model_risk_inventory} models (12 SR 11-7 at-risk)`);
console.log(`  AI spend by initiative: ${supplementCounts.ai_spend_rows} rows`);
console.log(`  AI risk register: ${supplementCounts.ai_risk_register} risks`);
console.log(`  Gate approval history: ${supplementCounts.gate_approval_history} gates\n`);
console.log(`  Total Tower rows: ${Object.values(supplementCounts).reduce((a,b) => a+b, 0)}`);
