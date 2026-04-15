'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = 'rgba(255,255,255,0.75)', DIM = 'rgba(255,255,255,0.5)'
const RED = '#EF4444', AMBER = '#F59E0B', GREEN = '#34D399', INDIGO = '#818CF8'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

// ── Intelligence Data ──────────────────────────────────────────────────────────
const DATA: Record<string, any> = {
  meridian: {
    client: 'Meridian Health System',
    vertical: 'Healthcare',
    updated: 'April 9, 2026',
    confidence: 94,
    color: '#2DD4C8',

    // Dimension 1: Your Data
    categories: [
      {
        id: 'financial', label: 'Financial Intelligence', color: '#4DA3FF', confidence: 96,
        files: ['Meridian_IT_Financial_Model_FY2024.xlsx', 'Ensemble_Contract_Analysis.xlsx'],
        records: '847 line items · 14 cost centers · 3 years',
        findings: [
          { severity: 'critical', fact: 'Ensemble RCM SLA penalties uncollected', value: '$8M', source: 'IT_Financial_Model_FY2024.xlsx · Vendor Contracts', why: '3 years of documented SLA breach — $8M contractual penalties never enforced. Renegotiation window open now.' },
          { severity: 'critical', fact: 'Denial write-off FY2023', value: '$94M', source: 'Healthcare_Quality_RCM_Data.xlsx · Write-offs', why: '$37M above benchmark — root cause is Ensemble SLA failure. Direct CFO exposure.' },
          { severity: 'critical', fact: 'Transformation budget gap', value: '$116M short', source: 'IT_Financial_Model_FY2024.xlsx · Budget Breakdown', why: 'Board mandated $200M — only $84M approved. Gap makes 4% margin target mathematically impossible.' },
          { severity: 'warning', fact: 'Travel nurse cost', value: '$142M FY2023', source: 'Workforce_HR_Analytics.xlsx · Labor Cost', why: '$74M above benchmark. 756 travel nurses at $188K avg — driven by 24% RN turnover rate.' },
          { severity: 'warning', fact: 'Azure waste identified', value: '$1.8M/year', source: 'DataCenter_Infrastructure.xlsx · VM Utilization', why: '340 VMs below 20% utilization — quick win, 2 months to remediate.' },
          { severity: 'warning', fact: 'IT spend vs benchmark', value: '$340M (3.0% of rev)', source: 'IT_Financial_Model_FY2024.xlsx · Budget', why: 'Below 5.2% healthcare benchmark by $242M — transformation chronically underfunded.' },
        ],
      },
      {
        id: 'technology', label: 'Technology Stack', color: '#818CF8', confidence: 91,
        files: ['Meridian_Application_Technology_Inventory.xlsx', 'DataCenter_Infrastructure_Inventory.xlsx'],
        records: '47 apps · 1,240 servers · 3 data centers · 847 integrations',
        findings: [
          { severity: 'critical', fact: 'Prior auth payer connections', value: '23 of 100', source: 'Application_Technology_Inventory.xlsx · Integration Map', why: 'CMS requires 100% by Jan 2026 — compliance crisis 8 months away. Ensemble not flagging it.' },
          { severity: 'critical', fact: 'Blue Ridge Cerner migration', value: '8 months overdue', source: 'Application_Technology_Inventory.xlsx · EHR', why: '424 interface mappings undocumented. Migration failure probability 71% at current state (Genome F015).' },
          { severity: 'critical', fact: 'Azure Synapse completion', value: '40% stalled', source: 'Application_Technology_Inventory.xlsx · Projects', why: 'Foundation for all AI workloads. No MLOps until complete — $42M AI portfolio blocked.' },
          { severity: 'warning', fact: 'Epic Cogito dashboards unused', value: '35 of 47 paid', source: 'Application_Technology_Inventory.xlsx · Epic Modules', why: '$18M annual value idle. CMIO never received activation plan from Epic CSM.' },
          { severity: 'warning', fact: 'Sepsis AI pilot stalled', value: '2 of 23 hospitals', source: 'Application_Technology_Inventory.xlsx · AI Initiatives', why: '31% mortality reduction validated — stuck 18 months. MLOps gap blocks scale.' },
          { severity: 'warning', fact: 'Server utilization', value: '340 VMs under 20%', source: 'DataCenter_Infrastructure.xlsx · VM Utilization', why: '$1.8M waste — Azure Cost Management automates right-sizing in 2 months.' },
        ],
      },
      {
        id: 'clinical', label: 'Clinical & Quality', color: '#34D399', confidence: 88,
        files: ['Meridian_Healthcare_Quality_RCM_Data.xlsx'],
        records: '23 hospitals · 47 payers · 18M claims · 4 years',
        findings: [
          { severity: 'critical', fact: 'RCM denial rate', value: '18.2% (SLA: 12%)', source: 'Healthcare_Quality_RCM_Data.xlsx · Denial Summary', why: '6.2pp breach sustained 36 months. TennCare rule change Jan 2023 never propagated to Epic billing team.' },
          { severity: 'critical', fact: 'Worst payer denial rate', value: 'TennCare: 34%', source: 'Healthcare_Quality_RCM_Data.xlsx · Denial by Payer', why: 'Coverage rule changed — Epic team never notified. 14 months unresolved.' },
          { severity: 'critical', fact: 'Days in AR', value: '52 days (benchmark: 42)', source: 'Healthcare_Quality_RCM_Data.xlsx · AR Aging', why: '$47M in delayed collections. 10 days above benchmark — recoverable in 6 months with process fix.' },
          { severity: 'warning', fact: 'MA Star rating', value: '3.5 stars (target: 4.0)', source: 'Healthcare_Quality_RCM_Data.xlsx · Quality Metrics', why: '$34M quality bonus at risk. 10 HEDIS measures below 4.0 threshold — each has a known fix.' },
          { severity: 'warning', fact: 'MyChart adoption', value: '34% (target: 60%)', source: 'Healthcare_Quality_RCM_Data.xlsx · Patient Engagement', why: '26pp below target. Epic engagement tools licensed but not activated — configuration issue.' },
        ],
      },
      {
        id: 'workforce', label: 'Workforce Intelligence', color: '#F59E0B', confidence: 92,
        files: ['Meridian_Workforce_HR_Analytics.xlsx'],
        records: '42,000 employees · 23 hospitals · 18 months',
        findings: [
          { severity: 'critical', fact: 'CDO role status', value: 'Vacant 8+ months', source: 'Workforce_HR_Analytics.xlsx · Leadership Org Chart', why: 'Every AI initiative blocked at governance stage. Most important single hire — no active requisition.' },
          { severity: 'critical', fact: 'RN turnover rate', value: '24% (benchmark: 18%)', source: 'Workforce_HR_Analytics.xlsx · Turnover by Role', why: 'Primary driver of $74M travel nurse excess. Predictive attrition model built — not deployed.' },
          { severity: 'warning', fact: 'ML and AI talent', value: '3 data scientists', source: 'Workforce_HR_Analytics.xlsx · IT Headcount by Skill', why: 'Need 8-10 to execute roadmap. No hiring plan in HR system despite CDO governance mandate.' },
          { severity: 'warning', fact: 'Travel nurses', value: '756 FTE', source: 'Workforce_HR_Analytics.xlsx · Staffing by Type', why: '$142M annual cost — $74M above benchmark. Reduction requires turnover program + predictive scheduling.' },
        ],
      },
      {
        id: 'vendors', label: 'Vendor Performance', color: '#EF4444', confidence: 89,
        files: ['Meridian_Vendor_Performance_Scorecard.xlsx'],
        records: '32 vendors · 847 SLA data points · 3 years',
        findings: [
          { severity: 'critical', fact: 'Ensemble SLA compliance', value: '67% vs 95% target', source: 'Vendor_Performance_Scorecard.xlsx · SLA Tracking', why: '$8M in penalties never enforced in 3 years. Renegotiation leverage: documented breach history.' },
          { severity: 'critical', fact: 'Ensemble denial rate SLA', value: '18.2% vs 12% contracted', source: 'Vendor_Performance_Scorecard.xlsx · RCM Metrics', why: '6.2pp sustained breach — 36 months of evidence. Contract termination right available.' },
          { severity: 'warning', fact: 'SI vendor billing rates', value: 'Avg $318/hr', source: 'Vendor_Performance_Scorecard.xlsx · SI Contracts', why: '14% above market. Avanade at $220/hr — $2.1M savings on current engagement scope.' },
          { severity: 'warning', fact: 'Mirth Connect support SLA', value: '71% compliance', source: 'Vendor_Performance_Scorecard.xlsx · SLA Tracking', why: 'Underperforming. Azure Integration Services evaluation due at next renewal.' },
        ],
      },
    ],

    // Dimension 2: Industry benchmarks
    industryBenchmarks: [
      { metric: 'Denial Rate', ours: '18.2%', peer: '12.0%', unit: '%', gap: '+6.2pp', severity: 'critical', impact: '$94M annual write-off vs benchmark' },
      { metric: 'Operating Margin', ours: '1.8%', peer: '3.4%', unit: '%', gap: '-1.6pp', severity: 'critical', impact: '2.2pp to target — $246M annual gap at $11.2B revenue' },
      { metric: 'Days in AR', ours: '52', peer: '35', unit: 'days', gap: '+17 days', severity: 'critical', impact: '$47M in delayed collections' },
      { metric: 'Prior Auth Automation', ours: '23%', peer: '62%', unit: '%', gap: '-39pp', severity: 'critical', impact: 'CMS Jan 2026 deadline — regulatory exposure' },
      { metric: 'Epic Optimization Score', ours: '58/100', peer: '78/100', unit: '', gap: '-20 pts', severity: 'warning', impact: '$18M in unused licensed capabilities' },
      { metric: 'RN Turnover', ours: '24%', peer: '18%', unit: '%', gap: '+6pp', severity: 'warning', impact: '$74M excess travel nurse spend' },
      { metric: 'MyChart Adoption', ours: '34%', peer: '58%', unit: '%', gap: '-24pp', severity: 'warning', impact: 'Patient portal engagement and quality scores lagging' },
      { metric: 'IT Spend (% Revenue)', ours: '3.0%', peer: '5.2%', unit: '%', gap: '-2.2pp', severity: 'warning', impact: '$246M underfunded vs healthcare IDN benchmark' },
    ],

    // Dimension 3: Genome knowledge layer
    genomePatterns: [
      { code: 'F011', name: 'RCM Vendor Misalignment', failureRate: 74, confirmed: true, color: RED, desc: 'Vendor missing SLAs with penalties never enforced. Seen in 74% of failed RCM transformations.', mitigation: 'Renegotiate with clawback provisions. Commission independent denial audit. Pilot Cohere Health AI-assisted denial prevention alongside Ensemble.' },
      { code: 'F007', name: 'Margin Transformation Gap', failureRate: 77, confirmed: true, color: RED, desc: 'Budget approved far below what is needed — transformation launched with structural funding gap.', mitigation: 'Prioritize top 5 highest-ROI initiatives with 90-day sprints. Present Genome-validated ROI to close funding gap with CFO.' },
      { code: 'F003', name: 'EHR Under-Optimization', failureRate: 69, confirmed: true, color: AMBER, desc: 'EHR licensed capabilities unused — vendor never provided activation roadmap.', mitigation: 'Epic Cogito acceleration programme. CMIO-led dashboard rollout. 35 dashboards activated in 90 days.' },
      { code: 'F015', name: 'Integration Fragmentation', failureRate: 65, confirmed: true, color: AMBER, desc: 'Multiple EHR versions across hospitals — migration overdue — undocumented interfaces compound risk.', mitigation: 'Milestone-gated Blue Ridge migration. Interface mapping sprint before code freeze. Azure Integration Services for long-term integration layer.' },
    ],

    // AI Readiness
    readiness: [
      { dimension: 'Data Foundation', score: 62, benchmark: 71, blocker: 'Azure Synapse 40% complete — AI models cannot deploy on incomplete foundation' },
      { dimension: 'Technology Platform', score: 44, benchmark: 68, blocker: 'No MLOps pipeline — sepsis model validated but cannot scale across 23 hospitals' },
      { dimension: 'Data Governance', score: 38, benchmark: 65, blocker: 'CDO vacant 8+ months — no owner for data quality, access controls, or AI governance' },
      { dimension: 'Talent & Skills', score: 32, benchmark: 58, blocker: '3 data scientists vs 8-10 needed — hiring plan not in HR system' },
      { dimension: 'Leadership Alignment', score: 72, benchmark: 74, blocker: 'Near benchmark — CIO, CFO, CMIO aligned. CDO hire is the unlock.' },
      { dimension: 'Change Readiness', score: 34, benchmark: 62, blocker: '24% nurse turnover, incomplete Blue Ridge migration, AI pilot fatigue across org' },
    ],

    // Sources
    howWeKnow: [
      { claim: 'Ensemble SLA compliance 67% vs 95% — $8M penalties uncollected', source: 'Vendor_Performance_Scorecard.xlsx · SLA Tracking · Row 847', data: 'Monthly SLA rate: 67.3% avg over 36 months. Penalty clause: $2M/quarter for sustained breach. Accrued: $8.1M. Collected: $0.' },
      { claim: '$8M in SLA penalties available — never enforced in 3 years', source: 'IT_Financial_Model_FY2024.xlsx · Vendor Contracts · Penalty Clauses', data: 'Contract clause confirmed. Three years of breach documentation in scorecard. No penalty collection initiated.' },
      { claim: 'Prior auth: 23% of payers electronically connected — CMS deadline Jan 2026', source: 'Application_Technology_Inventory.xlsx · Integration Map · Filter: Prior Auth', data: '23 of 100 payer portal integrations: Active. 77: Manual or Pending. CMS mandate: 100% by January 2026.' },
      { claim: 'Azure Synapse 40% complete and stalled since October 2024', source: 'Application_Technology_Inventory.xlsx · Projects · Row: Azure Synapse', data: 'Status: 40%. Last update: October 2024. Budget consumed: $1.8M of $3.2M. No milestone update in 6 months.' },
      { claim: 'CDO role vacant 8+ months — no active requisition', source: 'Workforce_HR_Analytics.xlsx · Leadership Org Chart · Row: Chief Data Officer', data: 'Vacant since August 2025. Active requisition: None. Interim coverage: None assigned.' },
      { claim: 'Sepsis AI model stuck at 2 hospitals for 18 months — no scale plan', source: 'Application_Technology_Inventory.xlsx · AI Initiatives · Row: Sepsis Early Warning', data: 'Status: Pilot. Hospitals live: 2 of 23. Start date: October 2024. Scale plan: None documented.' },
    ],
  },

  arcturus: {
    client: 'Arcturus Financial Group',
    vertical: 'Financial Services',
    updated: 'April 14, 2026',
    confidence: 91,
    color: '#818CF8',

    categories: [
      {
        id: 'financial', label: 'Financial Intelligence', color: '#818CF8', confidence: 94,
        files: ['Arcturus_IT_Financial_Model_FY2025.xlsx', 'AI_Portfolio_Investment_Register.xlsx'],
        records: '612 line items · 9 cost centers · 28 AI initiatives',
        findings: [
          { severity: 'critical', fact: 'AI portfolio with zero baselines', value: '$94M committed', source: 'AI_Portfolio_Investment_Register.xlsx · Committed Spend', why: 'Zero initiatives with documented baselines — cannot verify ROI of any single dollar spent.' },
          { severity: 'critical', fact: 'CIR efficiency gap to target', value: '$840M at 71% vs 58%', source: 'AI_Portfolio_Investment_Register.xlsx · Efficiency Metrics', why: 'Closing to benchmark recovers $840M in annual operating expense. No programme to achieve it.' },
          { severity: 'critical', fact: 'Bloomberg AIM cost and age', value: '$42M/yr · 28 years', source: 'IT_Financial_Model_FY2025.xlsx · Vendor Contracts', why: 'Auto-renews December 2026 — last opportunity to negotiate API terms before another 5-year lock-in.' },
          { severity: 'warning', fact: 'Salesforce FSC vs ROI', value: '$38M total · 44% adoption', source: 'IT_Financial_Model_FY2025.xlsx · Vendor Contracts', why: 'Einstein analytics never activated. $38M investment delivers zero analytics value. SSO bug root cause.' },
          { severity: 'warning', fact: 'CRO-blocked initiative value', value: '$101M stalled', source: 'AI_Portfolio_Investment_Register.xlsx · Blocked Initiatives', why: 'All risk model refreshes blocked pending architecture decision. Value accruing without resolution.' },
        ],
      },
      {
        id: 'technology', label: 'Technology Stack', color: '#6D28D9', confidence: 89,
        files: ['Arcturus_Application_Technology_Inventory.xlsx', 'Arcturus_Infrastructure_Audit_FY2025.xlsx'],
        records: '34 apps · 3 data centers · Azure + on-prem · 621 integrations',
        findings: [
          { severity: 'critical', fact: 'MDM golden record gap', value: '14 systems · no single record', source: 'Infrastructure_Audit_FY2025.xlsx · Data Architecture', why: 'All 28 AI initiatives require clean counterparty data. MDM gap blocks entire $94M AI portfolio.' },
          { severity: 'critical', fact: 'Bloomberg AIM API constraints', value: '500 calls/hr vs 50,000 needed', source: 'Application_Technology_Inventory.xlsx · Core Systems', why: '18 of 28 AI initiatives blocked by this single constraint. Real-time portfolio intelligence impossible.' },
          { severity: 'critical', fact: 'Aladdin stress testing gap', value: 'Monthly vs daily required', source: 'Application_Technology_Inventory.xlsx · Risk Systems', why: 'SEC requires daily by Q3 2026. Compliance gap opens March 2027 contract renewal as leverage.' },
          { severity: 'warning', fact: 'Salesforce FSC SSO bug', value: 'Unresolved · 18 months', source: 'Application_Technology_Inventory.xlsx · CRM Systems', why: 'Advisor login blocked — 210 of 380 advisors never logged in. Einstein analytics completely dead.' },
          { severity: 'warning', fact: 'Azure data platform progress', value: 'Phase 1 of 3 complete', source: 'Infrastructure_Audit_FY2025.xlsx · Cloud Projects', why: 'Foundation for AI workloads. Phases 2-3 unlock model training and deployment.' },
        ],
      },
      {
        id: 'investment', label: 'Investment & Risk', color: '#0D9488', confidence: 86,
        files: ['Arcturus_Portfolio_Performance_FY2025.xlsx', 'Risk_Reporting_Q1_2026.xlsx'],
        records: '$2.4B Singapore AUM · 23 AI models · 4 years risk history',
        findings: [
          { severity: 'critical', fact: 'MAS FEAT compliance', value: '0 of 23 models', source: 'Risk_Reporting_Q1_2026.xlsx · FEAT Checklist', why: '4 months past deadline. All 23 AI models lack FEAT documentation. Supervisory action imminent.' },
          { severity: 'critical', fact: 'Singapore AUM at regulatory risk', value: '$2.4B', source: 'Risk_Reporting_Q1_2026.xlsx · MAS Exposure', why: 'MAS FEAT overdue 4 months. Remediation requires CDO appointment as precondition.' },
          { severity: 'warning', fact: 'Intelligent Portfolio Construction', value: '$17M committed · stalled', source: 'Portfolio_Performance_FY2025.xlsx · AI Initiatives', why: 'Blocked by MDM golden record gap. 3-day lag makes real-time optimization impossible.' },
          { severity: 'warning', fact: 'Client Churn Prediction accuracy', value: '61% vs 85% target', source: 'Portfolio_Performance_FY2025.xlsx · AI Initiatives', why: 'Running on 44% FSC data coverage. Model data-starved. FSC adoption is root cause.' },
        ],
      },
      {
        id: 'workforce', label: 'Workforce Intelligence', color: '#F59E0B', confidence: 93,
        files: ['Arcturus_Workforce_HR_Analytics.xlsx'],
        records: '2,400 employees · 8 business units · 24 months',
        findings: [
          { severity: 'critical', fact: 'CDO role status', value: 'Vacant 11 months', source: 'Workforce_HR_Analytics.xlsx · Leadership Org Chart', why: 'Every AI initiative blocked at governance. Data quality decisions defaulting to CTO with no data mandate.' },
          { severity: 'warning', fact: 'ML and AI talent', value: '4 data scientists', source: 'Workforce_HR_Analytics.xlsx · IT Headcount by Skill', why: 'Need 10-12 for 28-initiative roadmap. No hiring plan in HR system.' },
          { severity: 'warning', fact: 'Quant researchers Bloomberg-constrained', value: '18 researchers', source: 'Workforce_HR_Analytics.xlsx · Investment Headcount', why: 'All quant models run inside Bloomberg AIM — API limits cap research output and AI integration.' },
          { severity: 'warning', fact: 'Salesforce CRM adoption', value: '44% of 380 advisors', source: 'Workforce_HR_Analytics.xlsx · CRM Adoption', why: 'SSO bug: 210 advisors never logged in. Data gap propagates to all AI models.' },
        ],
      },
      {
        id: 'vendors', label: 'Vendor Performance', color: '#EF4444', confidence: 88,
        files: ['Arcturus_Vendor_Performance_Scorecard.xlsx'],
        records: '18 vendors · 4 years · 621 SLA data points',
        findings: [
          { severity: 'critical', fact: 'Bloomberg AIM SLA penalties', value: '$8M unenforced', source: 'Vendor_Performance_Scorecard.xlsx · Bloomberg SLA', why: '$8M accrued over 12 consecutive quarters. Never enforced. Renegotiation window: December 2026.' },
          { severity: 'critical', fact: 'Salesforce FSC SSO ticket age', value: 'Open 18 months — P1 breach', source: 'Vendor_Performance_Scorecard.xlsx · Salesforce SLA', why: 'P1 SLA is 30 days. 18x breach. Penalty clause not activated. Credit demand available.' },
          { severity: 'warning', fact: 'Aladdin SLA vs SEC requirement', value: 'Monthly vs daily contracted', source: 'Vendor_Performance_Scorecard.xlsx · BlackRock SLA', why: 'Contract specifies daily capability. SEC confirms daily by 2026. Contractual leverage for renewal.' },
          { severity: 'warning', fact: 'SI vendor rates (Deloitte)', value: 'Avg $380/hr', source: 'Vendor_Performance_Scorecard.xlsx · SI Contracts', why: '22% above FS market ($310/hr benchmark). $2.8M excess fees on current engagement.' },
        ],
      },
    ],

    industryBenchmarks: [
      { metric: 'Cost-to-Income Ratio', ours: '71%', peer: '58%', unit: '%', gap: '+13pp', severity: 'critical', impact: '$840M annual efficiency gap vs peer median' },
      { metric: 'AUM per Employee', ours: '$667M', peer: '$787M', unit: '$M', gap: '-$120M/FTE', severity: 'critical', impact: 'Productivity gap vs peers — workforce efficiency programme needed' },
      { metric: 'AI Maturity Score', ours: '42/100', peer: '68/100', unit: '', gap: '-26 pts', severity: 'critical', impact: '26 points below peer median — $94M invested with no measurable progress' },
      { metric: 'MAS FEAT Compliance', ours: '0%', peer: '100%', unit: '%', gap: '-100%', severity: 'critical', impact: 'Regulatory action imminent — $2.4B AUM at risk' },
      { metric: 'CRM Advisor Adoption', ours: '44%', peer: '78%', unit: '%', gap: '-34pp', severity: 'warning', impact: '$38M FSC investment delivering no analytics value' },
      { metric: 'Quant Research Automation', ours: '12%', peer: '48%', unit: '%', gap: '-36pp', severity: 'warning', impact: '18 researchers Bloomberg-constrained — competitive intelligence gap widening' },
    ],

    genomePatterns: [
      { code: 'F005', name: 'AI Governance Vacuum', failureRate: 82, confirmed: true, color: RED, desc: 'CDO vacant — data quality decisions made by CTO without data mandate. Seen in 82% of failed AI transformations.', mitigation: 'Appoint interim CDO within 30 days. Establish AI governance council. Baseline all 28 initiatives within 60 days of CDO appointment.' },
      { code: 'F002', name: 'Cost Transformation Stall', failureRate: 84, confirmed: true, color: RED, desc: 'CIR reduction programme exists on paper — no executive accountability mechanism. Seen in 84% of failed cost transformations.', mitigation: 'Independent CIR reduction programme with weekly CEO accountability. Genome shows 71% success when CEO is named sponsor vs 23% without.' },
      { code: 'F009', name: 'Regulatory Debt Spiral', failureRate: 71, confirmed: true, color: AMBER, desc: 'Multiple overlapping regulatory deadlines with no coordinated remediation programme.', mitigation: 'Dedicated MAS FEAT remediation squad (90 days). FCA AI governance framework prep Q3. Bloomberg contract terms at December 2026 renewal.' },
      { code: 'F014', name: 'Platform Adoption Failure', failureRate: 68, confirmed: true, color: AMBER, desc: 'Enterprise platform deployed — adoption ceiling hit — vendor blamed — root cause is unresolved technical blocker.', mitigation: 'Fix FSC SSO bug (Salesforce P1 SLA breach — demand credit). Advisor adoption programme 44% → 78%. Einstein analytics activation once adoption unblocked.' },
    ],

    readiness: [
      { dimension: 'Data Foundation', score: 38, benchmark: 71, blocker: 'No MDM golden record — 14 systems with conflicting counterparty data — all AI models inherit data quality problem' },
      { dimension: 'Technology Platform', score: 31, benchmark: 68, blocker: 'Bloomberg AIM API constraints and no MLOps pipeline — models cannot deploy at scale' },
      { dimension: 'Data Governance', score: 22, benchmark: 65, blocker: 'CDO vacant 11 months — no owner for MAS FEAT compliance, data quality, or AI governance' },
      { dimension: 'Talent & Skills', score: 28, benchmark: 58, blocker: '4 data scientists vs 10-12 needed — $94M AI portfolio with no execution capacity' },
      { dimension: 'Leadership Alignment', score: 58, benchmark: 74, blocker: 'CRO and CTO aligned — CEO engagement needed — CDO vacancy creates governance vacuum' },
      { dimension: 'Regulatory Readiness', score: 15, benchmark: 60, blocker: 'MAS FEAT: 0 of 23 models compliant — 4 months overdue — supervisory action risk immediate' },
    ],

    howWeKnow: [
      { claim: '$94M committed to AI — zero initiatives with documented baselines', source: 'AI_Portfolio_Investment_Register.xlsx · Committed Spend · Column: Baseline Documented', data: '28 initiatives reviewed. Column "Baseline Documented": all blank. Investment committed sum: $94.2M.' },
      { claim: 'Bloomberg AIM has $8M in accrued SLA penalties — never collected', source: 'Vendor_Performance_Scorecard.xlsx · Bloomberg SLA · Rows: 2022–2026', data: 'API uptime SLA: 99.9%. Actual: 98.2% avg over 12 quarters. Penalty: $667K/quarter. Accrued: $8M. Collected: $0.' },
      { claim: 'Salesforce FSC adoption 44% after 18 months and $38M investment', source: 'Workforce_HR_Analytics.xlsx · CRM Adoption · Filter: Salesforce FSC', data: 'Total advisors: 380. Active logins (trailing 30 days): 167. Adoption: 43.9%. Root cause: IT ticket #FSC-2024-0891 (open 541 days).' },
      { claim: 'MAS FEAT compliance: 0 of 23 AI models documented', source: 'Risk_Reporting_Q1_2026.xlsx · FEAT Checklist · All rows', data: 'FEAT documentation status for 23 models: all "Not Started". Deadline: December 2025. Overdue: 4 months.' },
      { claim: 'CDO vacant 11 months — no active requisition', source: 'Workforce_HR_Analytics.xlsx · Leadership Org Chart · Row: Chief Data Officer', data: 'Vacant since May 2025. Active requisition: None. Interim coverage: None.' },
      { claim: 'Charles River OMS creates 3-day reporting lag', source: 'Infrastructure_Audit_FY2025.xlsx · Data Architecture · Row: OMS-MDM Integration', data: 'Integration: Batch. Frequency: Daily EOD. MDM reconciliation: Manual. Avg: 3.2 business days. Measured: February 2026.' },
    ],
  },
}

// ── Components ─────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const c = severity === 'critical' ? RED : AMBER
  return (
    <span style={{
      fontFamily: MONO, fontSize: '8px', padding: '2px 6px', borderRadius: '3px',
      background: `${c}15`, color: c, textTransform: 'uppercase' as const, letterSpacing: '.08em', flexShrink: 0,
    }}>
      {severity}
    </span>
  )
}

function DimBar({ value, benchmark, color }: { value: number; benchmark: number; color: string }) {
  return (
    <div style={{ position: 'relative', height: '6px', background: BORDER, borderRadius: '3px', marginTop: '6px' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '6px', width: `${value}%`, background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      <div style={{ position: 'absolute', top: '-3px', left: `${benchmark}%`, width: '1px', height: '12px', background: 'rgba(255,255,255,0.3)' }} />
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ d, setTab, setCatId }: { d: any; setTab: (t: string) => void; setCatId: (id: string) => void }) {
  const criticalCount = d.categories.reduce((n: number, c: any) => n + c.findings.filter((f: any) => f.severity === 'critical').length, 0)
  const totalFindings = d.categories.reduce((n: number, c: any) => n + c.findings.length, 0)

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
        {[
          { label: 'Data Confidence', value: `${d.confidence}%`, color: TEAL, sub: `Updated ${d.updated}` },
          { label: 'Critical Findings', value: String(criticalCount), color: RED, sub: 'Require immediate action' },
          { label: 'Total Findings', value: String(totalFindings), color: AMBER, sub: `Across ${d.categories.length} data categories` },
          { label: 'Genome Patterns', value: String(d.genomePatterns.length), color: INDIGO, sub: 'Matched to your situation' },
        ].map(m => (
          <div key={m.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `2px solid ${m.color}`, borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: '36px', color: m.color, lineHeight: 1, marginBottom: '4px' }}>{m.value}</div>
            <div style={{ fontFamily: SANS, fontSize: '11px', color: DIM }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 3 dimensions */}
      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '16px' }}>
        Three dimensions of intelligence
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '40px' }}>

        {/* Dim 1: Your Data */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(45,212,200,0.06)', borderBottom: `1px solid ${BORDER}`, padding: '14px 20px' }}>
            <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '4px' }}>Dimension 1</div>
            <div style={{ fontFamily: SERIF, fontSize: '18px', color: WHITE }}>Your Data Intelligence</div>
            <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '2px' }}>{d.categories.length} categories · {d.confidence}% confidence</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {d.categories.slice(0, 3).map((cat: any) => {
              const critical = cat.findings.filter((f: any) => f.severity === 'critical').length
              return (
                <button key={cat.id} onClick={() => { setTab('data'); setCatId(cat.id) }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SANS, fontSize: '12px', color: WHITE }}>{cat.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED }}>{cat.confidence}% confidence</div>
                  </div>
                  {critical > 0 && <span style={{ fontFamily: MONO, fontSize: '9px', color: RED }}>{critical} critical</span>}
                </button>
              )
            })}
            <button onClick={() => setTab('data')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 0', fontFamily: MONO, fontSize: '9px', color: TEAL }}>
              View all {d.categories.length} categories →
            </button>
          </div>
        </div>

        {/* Dim 2: Industry */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(245,158,11,0.06)', borderBottom: `1px solid ${BORDER}`, padding: '14px 20px' }}>
            <div style={{ fontFamily: MONO, fontSize: '8px', color: AMBER, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '4px' }}>Dimension 2</div>
            <div style={{ fontFamily: SERIF, fontSize: '18px', color: WHITE }}>Industry Intelligence</div>
            <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '2px' }}>{d.industryBenchmarks.length} benchmarks vs {d.vertical} peers</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {d.industryBenchmarks.filter((b: any) => b.severity === 'critical').slice(0, 3).map((b: any) => (
              <button key={b.metric} onClick={() => setTab('industry')}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontFamily: SANS, fontSize: '12px', color: WHITE }}>{b.metric}</span>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: RED }}>{b.gap}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED }}>{b.ours} vs {b.peer} peer</div>
              </button>
            ))}
            <button onClick={() => setTab('industry')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 0', fontFamily: MONO, fontSize: '9px', color: TEAL }}>
              View all benchmarks →
            </button>
          </div>
        </div>

        {/* Dim 3: Genome */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(129,140,248,0.06)', borderBottom: `1px solid ${BORDER}`, padding: '14px 20px' }}>
            <div style={{ fontFamily: MONO, fontSize: '8px', color: INDIGO, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '4px' }}>Dimension 3</div>
            <div style={{ fontFamily: SERIF, fontSize: '18px', color: WHITE }}>Genome Intelligence</div>
            <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '2px' }}>Knowledge layer · 340 patterns</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {d.genomePatterns.map((p: any) => (
              <button key={p.code} onClick={() => setTab('genome')}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: p.color, background: `${p.color}15`, padding: '1px 5px', borderRadius: '3px' }}>{p.code}</span>
                  <span style={{ fontFamily: SANS, fontSize: '12px', color: WHITE }}>{p.name}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: p.color }}>{p.failureRate}% failure rate in similar situations</div>
              </button>
            ))}
            <button onClick={() => setTab('genome')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 0', fontFamily: MONO, fontSize: '9px', color: TEAL }}>
              View full genome analysis →
            </button>
          </div>
        </div>
      </div>

      {/* AI Readiness summary */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '4px' }}>AI Readiness</div>
            <div style={{ fontFamily: SERIF, fontSize: '20px', color: WHITE }}>Scored from data — not interviews</div>
          </div>
          <button onClick={() => setTab('readiness')} style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}>
            Full assessment →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {d.readiness.map((r: any) => {
            const c = r.score >= 70 ? GREEN : r.score >= 45 ? AMBER : RED
            return (
              <div key={r.dimension}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: SANS, fontSize: '11px', color: MUTED }}>{r.dimension}</span>
                  <span style={{ fontFamily: MONO, fontSize: '11px', color: c }}>{r.score}</span>
                </div>
                <DimBar value={r.score} benchmark={r.benchmark} color={c} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Your Data Tab ──────────────────────────────────────────────────────────────
function DataTab({ d, catId, setCatId }: { d: any; catId: string; setCatId: (id: string) => void }) {
  const active = d.categories.find((c: any) => c.id === catId) || d.categories[0]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px' }}>
      {/* Category nav */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '10px' }}>Data Categories</div>
        {d.categories.map((cat: any) => {
          const critical = cat.findings.filter((f: any) => f.severity === 'critical').length
          const isActive = cat.id === active.id
          return (
            <button key={cat.id} onClick={() => setCatId(cat.id)}
              style={{
                width: '100%', textAlign: 'left', background: isActive ? `${cat.color}10` : 'none',
                border: isActive ? `1px solid ${cat.color}40` : '1px solid transparent',
                borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', marginBottom: '4px', display: 'block',
              }}>
              <div style={{ fontFamily: SANS, fontSize: '12px', color: isActive ? cat.color : MUTED, fontWeight: isActive ? 600 : 400 }}>{cat.label}</div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: isActive ? cat.color : 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                {cat.confidence}% · {critical > 0 ? `${critical} critical` : 'no critical'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Category content */}
      <div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ fontFamily: SERIF, fontSize: '22px', color: WHITE }}>{active.label}</div>
            <span style={{ fontFamily: MONO, fontSize: '10px', color: active.color, background: `${active.color}10`, border: `1px solid ${active.color}30`, borderRadius: '4px', padding: '3px 10px' }}>
              {active.confidence}% confidence
            </span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginBottom: '10px' }}>{active.records}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            <span style={{ fontFamily: MONO, fontSize: '8px', color: MUTED }}>FILES:</span>
            {active.files.map((f: string) => (
              <span key={f} style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, background: BORDER, borderRadius: '3px', padding: '2px 8px' }}>📄 {f}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {active.findings.map((f: any, i: number) => (
            <div key={i} style={{
              background: CARD,
              border: `1px solid ${f.severity === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
              borderLeft: `3px solid ${f.severity === 'critical' ? RED : AMBER}`,
              borderRadius: '10px', padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                <SeverityBadge severity={f.severity} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: WHITE }}>{f.fact}</div>
                  <div style={{ fontFamily: SERIF, fontSize: '20px', color: f.severity === 'critical' ? RED : AMBER, lineHeight: 1.1, marginTop: '4px' }}>{f.value}</div>
                </div>
              </div>
              <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.6, marginBottom: '8px' }}>{f.why}</div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>Source: {f.source}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Industry Tab ───────────────────────────────────────────────────────────────
function IndustryTab({ d }: { d: any }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: AMBER, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '8px' }}>Industry Intelligence · {d.vertical} Peer Benchmarks</div>
        <div style={{ fontFamily: SERIF, fontSize: '32px', color: WHITE, marginBottom: '8px' }}>How you compare to peers.</div>
        <div style={{ fontFamily: SANS, fontSize: '14px', color: MUTED }}>Every benchmark sourced from {d.vertical} peer data — not analyst estimates.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        {d.industryBenchmarks.map((b: any) => {
          const c = b.severity === 'critical' ? RED : AMBER
          return (
            <div key={b.metric} style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderLeft: `3px solid ${c}`,
              borderRadius: '10px', padding: '20px 24px',
              display: 'grid', gridTemplateColumns: '1fr 120px 120px 1fr', gap: '16px', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 600, color: WHITE, marginBottom: '4px' }}>{b.metric}</div>
                <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED }}>{b.impact}</div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, textTransform: 'uppercase' as const, marginBottom: '2px' }}>Yours</div>
                <div style={{ fontFamily: SERIF, fontSize: '22px', color: c }}>{b.ours}</div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, textTransform: 'uppercase' as const, marginBottom: '2px' }}>Peer Median</div>
                <div style={{ fontFamily: SERIF, fontSize: '22px', color: GREEN }}>{b.peer}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 700, color: c, background: `${c}10`, border: `1px solid ${c}30`, borderRadius: '6px', padding: '4px 12px' }}>
                  {b.gap}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Genome Tab ─────────────────────────────────────────────────────────────────
function GenomeTab({ d }: { d: any }) {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: INDIGO, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '8px' }}>Genome Intelligence · Knowledge Layer</div>
        <div style={{ fontFamily: SERIF, fontSize: '32px', color: WHITE, marginBottom: '8px' }}>What 340 transformations predict for yours.</div>
        <div style={{ fontFamily: SANS, fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>
          The Transformation Genome contains 340 cross-client patterns — each tied to a real transformation with a documented outcome.
          When a pattern appears in your data, we surface the failure rate and what recovered it.
        </div>
      </div>

      {/* Patterns matched */}
      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '12px' }}>
        {d.genomePatterns.length} patterns confirmed in your situation
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '40px' }}>
        {d.genomePatterns.map((p: any) => (
          <div key={p.code} style={{
            background: CARD,
            border: `1px solid ${p.color}25`,
            borderLeft: `4px solid ${p.color}`,
            borderRadius: '12px', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flexShrink: 0, textAlign: 'center' as const, minWidth: '80px' }}>
                <div style={{ fontFamily: MONO, fontSize: '11px', color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}30`, borderRadius: '4px', padding: '3px 8px', marginBottom: '8px', display: 'inline-block' }}>{p.code}</div>
                <div style={{ fontFamily: SERIF, fontSize: '28px', color: p.color, lineHeight: 1 }}>{p.failureRate}%</div>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, marginTop: '2px' }}>failure rate</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SERIF, fontSize: '18px', color: WHITE, marginBottom: '8px' }}>{p.name}</div>
                <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>{p.desc}</div>
                <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '6px' }}>What recovers it</div>
                  <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, lineHeight: 1.6 }}>{p.mitigation}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Knowledge layer explained */}
      <div style={{ background: 'rgba(129,140,248,0.04)', border: `1px solid rgba(129,140,248,0.2)`, borderRadius: '12px', padding: '28px 32px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: INDIGO, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '12px' }}>About the Knowledge Layer</div>
        <div style={{ fontFamily: SERIF, fontSize: '22px', color: WHITE, marginBottom: '12px' }}>340 patterns. Each one a real transformation with a documented outcome.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { stat: '340', label: 'Transformation patterns', desc: 'Cross-client data — not analyst opinion' },
            { stat: '89%', label: 'Prediction accuracy', desc: 'Pattern-to-outcome match rate across validated cases' },
            { stat: '6 yrs', label: 'Data history', desc: 'Genome data spans 6 years of real transformations' },
          ].map(s => (
            <div key={s.stat}>
              <div style={{ fontFamily: SERIF, fontSize: '36px', color: INDIGO, lineHeight: 1, marginBottom: '4px' }}>{s.stat}</div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600, marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── AI Readiness Tab ───────────────────────────────────────────────────────────
function ReadinessTab({ d }: { d: any }) {
  const overall = Math.round(d.readiness.reduce((sum: number, r: any) => sum + r.score, 0) / d.readiness.length)
  const c = overall >= 60 ? GREEN : overall >= 40 ? AMBER : RED

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '8px' }}>AI Readiness Assessment</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '8px' }}>
          <div style={{ fontFamily: SERIF, fontSize: '64px', color: c, lineHeight: 1 }}>{overall}</div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: '24px', color: MUTED }}>/100</div>
            <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED }}>Overall readiness score</div>
          </div>
        </div>
        <div style={{ fontFamily: SANS, fontSize: '14px', color: MUTED }}>Scored from loaded data — not interviews. Every score tied to a specific data point.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
        {d.readiness.map((r: any) => {
          const rc = r.score >= 70 ? GREEN : r.score >= 45 ? AMBER : RED
          const pct = Math.round((r.score / r.benchmark) * 100)
          return (
            <div key={r.dimension} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SERIF, fontSize: '17px', color: WHITE, marginBottom: '4px' }}>{r.dimension}</div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: RED, lineHeight: 1.5 }}>{r.blocker}</div>
                </div>
                <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: SERIF, fontSize: '32px', color: rc, lineHeight: 1 }}>{r.score}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED }}>benchmark: {r.benchmark}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: pct >= 85 ? GREEN : pct >= 60 ? AMBER : RED }}>{pct}% of benchmark</div>
                </div>
              </div>
              <div style={{ position: 'relative', height: '6px', background: BORDER, borderRadius: '3px' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '6px', width: `${r.score}%`, background: rc, borderRadius: '3px' }} />
                <div style={{ position: 'absolute', top: '-4px', left: `${r.benchmark}%`, width: '2px', height: '14px', background: 'rgba(255,255,255,0.3)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', color: rc }}>Your score: {r.score}</span>
                <span style={{ fontFamily: MONO, fontSize: '8px', color: MUTED }}>Benchmark: {r.benchmark}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sources Tab ────────────────────────────────────────────────────────────────
function SourcesTab({ d }: { d: any }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '8px' }}>How We Know This</div>
        <div style={{ fontFamily: SERIF, fontSize: '32px', color: WHITE, marginBottom: '8px' }}>Every claim. Sourced to the row.</div>
        <div style={{ fontFamily: SANS, fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>
          No guessing. No assumptions. Every insight AbarVa surfaces is tied to a specific row in a specific file from your data upload.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
        {d.howWeKnow.map((item: any, i: number) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ fontFamily: MONO, fontSize: '16px', color: TEAL, fontWeight: 700, flexShrink: 0, minWidth: '28px' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SERIF, fontSize: '15px', color: WHITE, fontWeight: 500, marginBottom: '12px', lineHeight: 1.4 }}>{item.claim}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: BG, borderRadius: '6px', padding: '10px 14px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '4px' }}>Source File</div>
                    <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, lineHeight: 1.5 }}>{item.source}</div>
                  </div>
                  <div style={{ background: BG, borderRadius: '6px', padding: '10px 14px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '4px' }}>Data Point</div>
                    <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, lineHeight: 1.5 }}>{item.data}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
function DataContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [tab, setTab] = useState('overview')
  const [catId, setCatId] = useState('financial')

  const d = DATA[clientId] || DATA.meridian

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'data', label: 'Your Data' },
    { key: 'industry', label: 'Industry' },
    { key: 'genome', label: 'Genome' },
    { key: 'readiness', label: 'AI Readiness' },
    { key: 'sources', label: 'Sources' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="data-intelligence" />

      {/* Page header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '28px 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: d.color, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            Intelligence Hub · {d.client} · {d.vertical}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 500, color: WHITE, margin: 0, lineHeight: 1.1 }}>
              What your data tells us.
            </h1>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 16px', textAlign: 'center' as const }}>
                <div style={{ fontFamily: SERIF, fontSize: '22px', color: TEAL, lineHeight: 1 }}>{d.confidence}%</div>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, marginTop: '2px' }}>data confidence</div>
              </div>
              <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 16px', textAlign: 'center' as const }}>
                <div style={{ fontFamily: SERIF, fontSize: '22px', color: RED, lineHeight: 1 }}>
                  {d.categories.reduce((n: number, c: any) => n + c.findings.filter((f: any) => f.severity === 'critical').length, 0)}
                </div>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, marginTop: '2px' }}>critical findings</div>
              </div>
              <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 16px', textAlign: 'center' as const }}>
                <div style={{ fontFamily: SERIF, fontSize: '22px', color: INDIGO, lineHeight: 1 }}>{d.genomePatterns.length}</div>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, marginTop: '2px' }}>genome patterns</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '0 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: SANS, fontSize: '13px',
                color: tab === t.key ? TEAL : MUTED,
                padding: '14px 20px',
                borderBottom: tab === t.key ? `2px solid ${TEAL}` : '2px solid transparent',
                whiteSpace: 'nowrap' as const,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 48px 80px' }}>
        {tab === 'overview' && <OverviewTab d={d} setTab={setTab} setCatId={setCatId} />}
        {tab === 'data' && <DataTab d={d} catId={catId} setCatId={setCatId} />}
        {tab === 'industry' && <IndustryTab d={d} />}
        {tab === 'genome' && <GenomeTab d={d} />}
        {tab === 'readiness' && <ReadinessTab d={d} />}
        {tab === 'sources' && <SourcesTab d={d} />}
      </div>
    </div>
  )
}

export default function DataIntelligencePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: BG }} />}>
      <DataContent />
    </Suspense>
  )
}
