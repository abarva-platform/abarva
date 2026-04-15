'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const DATA: Record<string, any> = {
  meridian: {
    client: 'Meridian Health System',
    updated: 'April 9, 2026',
    confidence: 94,
    categories: [
      {
        id: 'financial', label: 'Financial Intelligence', icon: '$', color: '#1B4FD8', confidence: 96,
        files: ['Meridian_IT_Financial_Model_FY2024.xlsx', 'Enterprise_IT_Financial_Models_All_Clients.xlsx'],
        records: '847 line items across 14 cost centers',
        findings: [
          { fact: 'IT Budget FY2024', value: '$504M', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Budget', why: 'Underspending vs 5.2% revenue benchmark — $80M gap blocking transformation' },
          { fact: 'Transformation budget', value: '$84M of $504M', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Budget Breakdown', why: 'Board mandated $200M needed — gap of $116M is fatal to 4% margin target' },
          { fact: 'Ensemble RCM contract', value: '$48M/year', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Vendor Contracts', why: 'Vendor missing SLAs — $8M in unenforced penalties identified' },
          { fact: 'Travel nurse cost', value: '$142M FY2023', source: 'Workforce_HR_Analytics.xlsx · Sheet: Labor Cost', why: '756 travel nurses at $188K avg — $74M above benchmark' },
          { fact: 'Denial write-off', value: '$94M FY2023', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Write-offs', why: '$37M above benchmark — root cause is Ensemble SLA failure' },
          { fact: 'Azure waste identified', value: '$1.8M/year', source: 'DataCenter_Infrastructure.xlsx · Sheet: VM Utilization', why: '340 VMs below 20% utilization — Azure Cost Management can automate right-sizing' },
        ],
      },
      {
        id: 'technology', label: 'Technology Stack', icon: '#', color: '#6D28D9', confidence: 91,
        files: ['Meridian_Application_Technology_Inventory.xlsx', 'Meridian_DataCenter_Infrastructure_Inventory.xlsx'],
        records: '47 applications · 1,240 servers · 3 data centers · 847 integrations mapped',
        findings: [
          { fact: 'Epic EHR version', value: '2023 November', source: 'Application_Technology_Inventory.xlsx · Sheet: EHR', why: 'Enables Cohere Health native integration — no custom build required' },
          { fact: 'Azure Synapse status', value: '40% complete', source: 'Application_Technology_Inventory.xlsx · Sheet: Projects', why: 'Foundation for all AI workloads — must complete before deploying ML models' },
          { fact: 'Cogito dashboards', value: '12 of 47 live', source: 'Application_Technology_Inventory.xlsx · Sheet: Epic Modules', why: '35 paid dashboards unused — $18M annual value idle' },
          { fact: 'Blue Ridge Cerner', value: 'Millennium 2019', source: 'Application_Technology_Inventory.xlsx · Sheet: EHR', why: '8 months overdue migration — 424 interface mappings undocumented' },
          { fact: 'Prior auth connections', value: '23 of 100 payers', source: 'Application_Technology_Inventory.xlsx · Sheet: Integration Map', why: 'CMS requires 100% by January 2026 — 8 months to compliance crisis' },
          { fact: 'Server utilization', value: '340 VMs under 20%', source: 'DataCenter_Infrastructure.xlsx · Sheet: VM Utilization', why: '$1.8M annual waste — automated right-sizing is a 2-month quick win' },
        ],
      },
      {
        id: 'clinical', label: 'Clinical and Quality', icon: '+', color: '#047857', confidence: 88,
        files: ['Meridian_Healthcare_Quality_RCM_Data.xlsx'],
        records: '23 hospitals · 47 payers · 18M claims · 4 years history',
        findings: [
          { fact: 'RCM denial rate', value: '18.2% overall', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Denial Summary', why: '6.2 points above Ensemble SLA — $8M in available penalties never enforced' },
          { fact: 'Worst payer', value: 'TennCare: 34%', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Denial by Payer', why: 'TennCare changed coverage rules Jan 2023 — Epic billing team never notified' },
          { fact: 'Days in AR', value: '52 days', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: AR Aging', why: '10 days above 42-day benchmark — $47M in delayed collections' },
          { fact: 'MA Star rating', value: '3.5 stars', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Quality Metrics', why: '$34M quality bonus at risk — 10 HEDIS measures below 4.0 threshold' },
          { fact: 'Sepsis AI pilot', value: '31% mortality reduction', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: AI Pilots', why: 'Validated at 2 hospitals — stuck 18 months — no MLOps to scale' },
        ],
      },
      {
        id: 'workforce', label: 'Workforce Intelligence', icon: '@', color: '#B45309', confidence: 92,
        files: ['Meridian_Workforce_HR_Analytics.xlsx'],
        records: '42,000 employees · 23 hospitals · 18 months of data',
        findings: [
          { fact: 'Travel nurses', value: '756 FTE', source: 'Workforce_HR_Analytics.xlsx · Sheet: Staffing by Type', why: '$142M annual cost — $74M above benchmark' },
          { fact: 'Nurse turnover rate', value: '24%', source: 'Workforce_HR_Analytics.xlsx · Sheet: Turnover by Role', why: '6 points above 18% benchmark — primary driver of travel nurse dependency' },
          { fact: 'CDO role status', value: 'Vacant 8+ months', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart', why: 'Every AI initiative blocked — most important single hire' },
          { fact: 'ML and AI talent', value: '3 data scientists', source: 'Workforce_HR_Analytics.xlsx · Sheet: IT Headcount by Skill', why: 'Need 8-10 to execute roadmap — hiring plan must start immediately' },
        ],
      },
      {
        id: 'vendors', label: 'Vendor Performance', icon: '!', color: '#DC2626', confidence: 89,
        files: ['Meridian_Vendor_Performance_Scorecard.xlsx'],
        records: '32 vendors · 847 SLA data points · 3 years history',
        findings: [
          { fact: 'Ensemble SLA compliance', value: '67% vs 95% target', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SLA Tracking', why: '$8M in contractual penalties available — not enforced in 3 years' },
          { fact: 'Ensemble denial rate SLA', value: '18.2% vs 12%', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: RCM Metrics', why: '6.2 points of sustained breach — 3 years of documented evidence' },
          { fact: 'SI vendor rates paid', value: 'Avg $318/hr', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SI Contracts', why: '14% above market — renegotiate or switch to Avanade at $220/hr' },
          { fact: 'Mirth Connect support', value: '71% SLA compliance', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SLA Tracking', why: 'Underperforming — evaluate upgrade to Azure Integration Services' },
        ],
      },
    ],
    readiness: [
      { dimension: 'Data Foundation', score: 62, benchmark: 71, blocker: 'Azure Synapse 40% complete — AI models cannot deploy on incomplete foundation' },
      { dimension: 'Technology Platform', score: 44, benchmark: 68, blocker: 'No MLOps pipeline — sepsis model validated but cannot be deployed at scale' },
      { dimension: 'Data Governance', score: 38, benchmark: 65, blocker: 'No CDO — no owner for data quality, access controls, or AI model governance' },
      { dimension: 'Talent and Skills', score: 32, benchmark: 58, blocker: '3 data scientists vs 8-10 needed — cannot execute roadmap without immediate hiring' },
      { dimension: 'Leadership Alignment', score: 72, benchmark: 74, blocker: 'Near benchmark — CIO, CFO, CMIO aligned on AI priority' },
      { dimension: 'Change Readiness', score: 34, benchmark: 62, blocker: '24% nurse turnover, incomplete Blue Ridge integration, AI pilot fatigue' },
    ],
    howWeKnow: [
      { claim: 'Ensemble SLA compliance is 67% vs 95% contractual requirement', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SLA Tracking · Row 847', data: 'Monthly SLA compliance rate by vendor, 36 months of data, average 67.3%' },
      { claim: '$8M in available SLA penalties have never been enforced', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Vendor Contracts · Column: Penalty Clauses', data: 'Contract clause: Vendor shall pay $2M per quarter for sustained breach of denial rate SLA. Penalty accrued not collected: $8.1M' },
      { claim: 'Prior auth: 23% of payers connected electronically', source: 'Application_Technology_Inventory.xlsx · Sheet: Integration Map · Filter: Prior Auth', data: '23 of 100 payer portal integrations marked as Active. 77 marked as Manual or Pending' },
      { claim: 'Azure Synapse is 40% complete and stalled', source: 'Application_Technology_Inventory.xlsx · Sheet: Projects · Row: Azure Synapse', data: 'Project status: 40% complete. Last update: October 2024. Budget consumed: $1.8M of $3.2M allocated' },
      { claim: 'CDO role has been vacant for 8+ months', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart · Row: Chief Data Officer', data: 'Status: Vacant since August 2025. No active requisition in HR system.' },
      { claim: 'Sepsis AI model stuck at 2 hospitals for 18 months', source: 'Application_Technology_Inventory.xlsx · Sheet: AI Initiatives · Row: Sepsis Early Warning', data: 'Initiative status: Pilot. Hospitals live: 2 of 23. Start date: October 2024. Scale plan: None documented' },
    ],
  },

  arcturus: {
    client: 'Arcturus Financial Group',
    updated: 'April 14, 2026',
    confidence: 91,
    categories: [
      {
        id: 'financial', label: 'Financial Intelligence', icon: '$', color: '#818CF8', confidence: 94,
        files: ['Arcturus_IT_Financial_Model_FY2025.xlsx', 'AI_Portfolio_Investment_Register.xlsx'],
        records: '612 line items across 9 cost centers · 28 AI initiatives tracked',
        findings: [
          { fact: 'Total AI investment committed', value: '$94M', source: 'AI_Portfolio_Investment_Register.xlsx · Sheet: Committed Spend', why: 'Zero initiatives with documented baselines — cannot verify ROI of any single dollar' },
          { fact: 'Technology budget FY2025', value: '$198M', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Budget Summary', why: '12.4% of $1.6B operating base — above 8% FS sector benchmark but critically misallocated' },
          { fact: 'Bloomberg AIM annual cost', value: '$42M/yr', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Vendor Contracts', why: '28-year-old system — 3 failed modernizations — December 2026 auto-renewal locked' },
          { fact: 'Salesforce FSC investment', value: '$38M total · $14M/yr', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Vendor Contracts', why: '44% adoption after 18 months — Einstein analytics never activated — no measurable ROI' },
          { fact: 'CIR efficiency gap', value: '$840M at current 71%', source: 'AI_Portfolio_Investment_Register.xlsx · Sheet: Efficiency Metrics', why: 'Target is 58% CIR — closing to benchmark recovers $840M in operating expense annually' },
          { fact: 'CRO framework blocked value', value: '$101M', source: 'AI_Portfolio_Investment_Register.xlsx · Sheet: Blocked Initiatives', why: 'All risk model refreshes blocked pending architecture decision — value accruing without resolution' },
        ],
      },
      {
        id: 'technology', label: 'Technology Stack', icon: '#', color: '#6D28D9', confidence: 89,
        files: ['Arcturus_Application_Technology_Inventory.xlsx', 'Arcturus_Infrastructure_Audit_FY2025.xlsx'],
        records: '34 applications · 3 data centers · Azure + on-prem hybrid · 621 integrations mapped',
        findings: [
          { fact: 'Bloomberg AIM version', value: 'AIM 9.x · 28 yrs deployed', source: 'Application_Technology_Inventory.xlsx · Sheet: Core Systems', why: 'API-constrained — no native AI integration path — real-time data extraction requires custom middleware' },
          { fact: 'Aladdin Risk stress testing', value: 'Monthly only — daily required', source: 'Application_Technology_Inventory.xlsx · Sheet: Risk Systems', why: 'SEC requires daily stress testing by Q3 2026 — compliance gap opens March 2027 contract renewal' },
          { fact: 'Salesforce FSC Einstein SSO bug', value: 'Unresolved · 18 months', source: 'Application_Technology_Inventory.xlsx · Sheet: CRM Systems', why: 'Advisor login blocked — primary reason for 44% adoption ceiling — $38M investment delivers 0 analytics value' },
          { fact: 'Charles River OMS silo', value: 'No MDM connection · 3-day lag', source: 'Application_Technology_Inventory.xlsx · Sheet: OMS', why: 'AUM reconciliation manual across 3 systems — real-time portfolio intelligence impossible' },
          { fact: 'MDM (Informatica) status', value: '14 systems · no golden record', source: 'Infrastructure_Audit_FY2025.xlsx · Sheet: Data Architecture', why: 'All AI initiatives require clean counterparty data — MDM gap blocks entire $94M AI portfolio' },
          { fact: 'Azure data platform', value: 'Phase 1 of 3 complete', source: 'Infrastructure_Audit_FY2025.xlsx · Sheet: Cloud Projects', why: 'Foundation for AI workloads — remaining 2 phases unlock model training and deployment' },
        ],
      },
      {
        id: 'investment', label: 'Investment & Risk Analytics', icon: '~', color: '#0D9488', confidence: 86,
        files: ['Arcturus_Portfolio_Performance_FY2025.xlsx', 'Arcturus_Risk_Reporting_Q1_2026.xlsx'],
        records: '$2.4B Singapore AUM · 23 AI models · 4 years risk history',
        findings: [
          { fact: 'Singapore AUM at regulatory risk', value: '$2.4B', source: 'Risk_Reporting_Q1_2026.xlsx · Sheet: MAS Exposure', why: 'MAS FEAT compliance overdue 4 months — zero models with documented explainability — supervisory action imminent' },
          { fact: 'MAS FEAT model compliance', value: '0 of 23 models', source: 'Risk_Reporting_Q1_2026.xlsx · Sheet: FEAT Checklist', why: 'All 23 AI models lack FEAT-compliant documentation — 4 months past deadline' },
          { fact: 'Intelligent Portfolio Construction', value: '$17M committed · stalled', source: 'Portfolio_Performance_FY2025.xlsx · Sheet: AI Initiatives', why: 'Blocked by MDM golden record gap — 3-day lag makes real-time optimization impossible' },
          { fact: 'Trade Surveillance AI', value: 'Batch only — Bloomberg constraint', source: 'Portfolio_Performance_FY2025.xlsx · Sheet: AI Initiatives', why: 'API limits force batch processing — misses same-day anomalies — regulatory exposure' },
          { fact: 'Client Churn Prediction', value: 'Live · 61% accuracy vs 85% target', source: 'Portfolio_Performance_FY2025.xlsx · Sheet: AI Initiatives', why: 'Running on FSC data at 44% advisor coverage — model data-starved — FSC adoption is root cause' },
        ],
      },
      {
        id: 'workforce', label: 'Workforce Intelligence', icon: '@', color: '#B45309', confidence: 93,
        files: ['Arcturus_Workforce_HR_Analytics.xlsx'],
        records: '2,400 employees · 8 business units · 24 months of data',
        findings: [
          { fact: 'CDO role status', value: 'Vacant 11 months', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart', why: 'Every AI initiative blocked at governance stage — data quality decisions defaulting to CTO with no data mandate' },
          { fact: 'ML and AI talent', value: '4 data scientists', source: 'Workforce_HR_Analytics.xlsx · Sheet: IT Headcount by Skill', why: 'Need 10-12 to execute 28-initiative roadmap — no hiring plan in HR system' },
          { fact: 'Quant research team', value: '18 researchers · Bloomberg-constrained', source: 'Workforce_HR_Analytics.xlsx · Sheet: Investment Headcount', why: 'All quant models run inside Bloomberg AIM — API limits cap research output and AI integration' },
          { fact: 'Salesforce CRM adoption', value: '44% of 380 advisors', source: 'Workforce_HR_Analytics.xlsx · Sheet: CRM Adoption', why: 'Einstein SSO bug means 210 advisors never logged in — data gap propagates to all AI models' },
        ],
      },
      {
        id: 'vendors', label: 'Vendor Performance', icon: '!', color: '#DC2626', confidence: 88,
        files: ['Arcturus_Vendor_Performance_Scorecard.xlsx'],
        records: '18 vendors · 4 years history · 621 SLA data points',
        findings: [
          { fact: 'Bloomberg AIM penalty accrual', value: '$8M unenforced', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: Bloomberg SLA', why: '$8M in contractual penalties accrued over 12 consecutive quarters — never enforced' },
          { fact: 'Salesforce FSC SSO ticket', value: 'Open 18 months — P1 breach', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: Salesforce SLA', why: 'Critical bug unresolved — P1 SLA is 30 days — 18x breach — penalty clause not activated' },
          { fact: 'Aladdin risk model SLA', value: 'Monthly vs daily contracted', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: BlackRock SLA', why: 'Contract specifies daily capability — SEC requirement confirms daily by 2026 — contractual breach' },
          { fact: 'SI vendor rates (Deloitte)', value: 'Avg $380/hr', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SI Contracts', why: '22% above FS market rate — $2.8M excess fees on current engagement — benchmark $310/hr' },
        ],
      },
    ],
    readiness: [
      { dimension: 'Data Foundation', score: 38, benchmark: 71, blocker: 'No MDM golden record — 14 systems with conflicting counterparty data — all AI models inherit data quality problem' },
      { dimension: 'Technology Platform', score: 31, benchmark: 68, blocker: 'Bloomberg AIM API constraints and no MLOps pipeline — models cannot deploy at scale' },
      { dimension: 'Data Governance', score: 22, benchmark: 65, blocker: 'CDO vacant 11 months — no owner for MAS FEAT compliance, data quality, or AI model governance' },
      { dimension: 'Talent and Skills', score: 28, benchmark: 58, blocker: '4 data scientists vs 10-12 needed — $94M AI portfolio with no execution capacity' },
      { dimension: 'Leadership Alignment', score: 58, benchmark: 74, blocker: 'CRO and CTO aligned — CEO engagement needed — CDO vacancy creates governance vacuum' },
      { dimension: 'Regulatory Readiness', score: 15, benchmark: 60, blocker: 'MAS FEAT: 0 of 23 models compliant — 4 months overdue — supervisory action risk is immediate' },
    ],
    howWeKnow: [
      { claim: '$94M committed to AI with zero initiatives having documented baselines', source: 'AI_Portfolio_Investment_Register.xlsx · Sheet: Committed Spend · Column: Baseline Documented', data: '28 initiatives reviewed. Column "Baseline Documented": all blank. Investment committed column sum: $94.2M.' },
      { claim: 'Bloomberg AIM has $8M in accrued SLA penalties never enforced', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: Bloomberg SLA · Rows: 2022–2026', data: 'API downtime SLA: 99.9% uptime contracted. Actual: 98.2% average over 12 quarters. Penalty: $667K/quarter. Accrued: $8M. Collected: $0.' },
      { claim: 'Salesforce FSC adoption at 44% after 18 months and $38M investment', source: 'Workforce_HR_Analytics.xlsx · Sheet: CRM Adoption · Filter: Salesforce FSC', data: 'Total advisors: 380. Active logins trailing 30 days: 167. Adoption rate: 43.9%. Root cause: Einstein SSO failure documented in IT ticket #FSC-2024-0891 (open 541 days).' },
      { claim: 'MAS FEAT compliance: 0 of 23 AI models have required documentation', source: 'Risk_Reporting_Q1_2026.xlsx · Sheet: FEAT Checklist · All rows', data: 'FEAT documentation status for 23 models: all "Not Started". Deadline: December 2025. Overdue: 4 months.' },
      { claim: 'CDO role vacant 11 months — no active requisition in HR system', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart · Row: Chief Data Officer', data: 'Status: Vacant since May 2025. Open requisition: None. Interim coverage: None assigned.' },
      { claim: 'Charles River OMS creates 3-day reporting lag', source: 'Infrastructure_Audit_FY2025.xlsx · Sheet: Data Architecture · Row: OMS-MDM Integration', data: 'Integration type: Batch. Frequency: Daily EOD. MDM reconciliation: Manual. Average reconciliation time: 3.2 business days. Last measured: February 2026.' },
    ],
  },

  apexretail: {
    client: 'Apex Retail Group',
    updated: 'April 14, 2026',
    confidence: 87,
    categories: [
      {
        id: 'financial', label: 'Financial Intelligence', icon: '$', color: '#F59E0B', confidence: 91,
        files: ['ApexRetail_IT_Financial_Model_FY2025.xlsx', 'Apex_AI_Initiative_Register.xlsx'],
        records: '524 line items across 11 cost centers · 19 AI initiatives tracked',
        findings: [
          { fact: 'Technology budget FY2025', value: '$86M', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Budget Summary', why: '2.4% of $3.6B revenue — below 3.5% retail benchmark — underinvestment vs competitive set' },
          { fact: 'AI initiatives committed', value: '$31M across 19 initiatives', source: 'Apex_AI_Initiative_Register.xlsx · Sheet: Committed Spend', why: '14 of 19 initiatives stalled — $22M committed with no documented outcomes' },
          { fact: 'Legacy demand forecasting cost', value: '$4.2M/yr (SAP APO)', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Vendor Contracts', why: 'SAP APO running 2014 version — 34% forecast error rate drives $68M excess inventory annually' },
          { fact: 'E-commerce platform cost', value: '$12M/yr (Salesforce Commerce)', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Vendor Contracts', why: 'Personalization engine disabled — 1.8% conversion vs 3.2% benchmark — $28M revenue gap' },
          { fact: 'CDP investment (Segment)', value: '$8.4M total', source: 'Apex_AI_Initiative_Register.xlsx · Sheet: AI Status', why: 'CDP deployed at 34% journey coverage — AI segmentation models data-starved — Phase 2 not started' },
          { fact: 'Annual shrinkage loss', value: '$127M FY2024', source: 'IT_Financial_Model_FY2025.xlsx · Sheet: Operations', why: '3.5% of revenue vs 1.8% benchmark — computer vision pilot proved 67% reduction but not scaled' },
        ],
      },
      {
        id: 'technology', label: 'Technology Stack', icon: '#', color: '#6D28D9', confidence: 84,
        files: ['ApexRetail_Application_Technology_Inventory.xlsx'],
        records: '28 applications · 680 store systems · AWS + Azure multi-cloud',
        findings: [
          { fact: 'SAP APO version', value: '2014 — 11 years old', source: 'Application_Technology_Inventory.xlsx · Sheet: Core Systems', why: 'End-of-life 2025 — no S/4HANA migration plan — demand forecasting accuracy 66% vs 92% AI benchmark' },
          { fact: 'Commerce Cloud personalization', value: 'Disabled — data quality issue', source: 'Application_Technology_Inventory.xlsx · Sheet: E-commerce Stack', why: 'Customer profile completeness at 34% — engine requires 70%+ — $28M conversion gap' },
          { fact: 'CDP (Segment) status', value: 'Phase 1 complete — 34% coverage', source: 'Application_Technology_Inventory.xlsx · Sheet: Data Platform', why: 'Phase 2 (store transaction integration) not started — 66% of customer journeys invisible to AI' },
          { fact: 'Computer vision shrinkage pilot', value: '67% reduction · 12 stores validated', source: 'Application_Technology_Inventory.xlsx · Sheet: AI Pilots', why: 'Proven at 12 of 680 stores — MLOps gap prevents scaling — $85M unrecovered savings' },
          { fact: 'POS system age', value: '340 stores on 2016 vintage', source: 'Application_Technology_Inventory.xlsx · Sheet: Store Systems', why: 'No real-time inventory API — prevents AI replenishment optimization across half the store fleet' },
          { fact: 'AWS data lake utilization', value: '40% utilization', source: 'Application_Technology_Inventory.xlsx · Sheet: Cloud Infrastructure', why: 'Capacity paid for, not used — 8 departments still exporting to Excel for reporting' },
        ],
      },
      {
        id: 'operations', label: 'Merchandising & Operations', icon: '+', color: '#047857', confidence: 88,
        files: ['ApexRetail_Operations_Analytics.xlsx'],
        records: '680 stores · 42M customer records · 5 years transaction history',
        findings: [
          { fact: 'Demand forecast error rate', value: '34% MAPE', source: 'Operations_Analytics.xlsx · Sheet: Forecast Accuracy', why: '34% MAPE vs 8% AI benchmark — direct driver of $68M excess inventory and 18% stockout rate' },
          { fact: 'Stockout rate', value: '18% of SKUs weekly', source: 'Operations_Analytics.xlsx · Sheet: Inventory Performance', why: '8 points above 10% benchmark — $42M in lost sales annually' },
          { fact: 'Customer loyalty segments', value: '3 static segments', source: 'Operations_Analytics.xlsx · Sheet: Customer Analytics', why: 'Competitors running 200+ dynamic micro-segments — loyalty program shows 23% disengagement vs 14% benchmark' },
          { fact: 'E-commerce conversion rate', value: '1.8%', source: 'Operations_Analytics.xlsx · Sheet: Digital Performance', why: '1.4 points below 3.2% benchmark — $28M annual revenue gap — personalization engine disabled' },
          { fact: 'Shrinkage rate', value: '3.5% of revenue', source: 'Operations_Analytics.xlsx · Sheet: Loss Prevention', why: '$127M annually — 3.5x benchmark — computer vision solution proven but MLOps blocks deployment' },
        ],
      },
      {
        id: 'workforce', label: 'Workforce Intelligence', icon: '@', color: '#B45309', confidence: 89,
        files: ['ApexRetail_Workforce_HR_Analytics.xlsx'],
        records: '48,000 employees · 680 stores · 12 months of data',
        findings: [
          { fact: 'Data and AI talent', value: '6 data scientists', source: 'Workforce_HR_Analytics.xlsx · Sheet: IT Headcount by Skill', why: 'Need 14-16 to execute 19-initiative roadmap — store operations team has zero ML capability' },
          { fact: 'Store manager attrition', value: '31%', source: 'Workforce_HR_Analytics.xlsx · Sheet: Turnover by Role', why: '14 points above 17% retail benchmark — compensation and scheduling AI pilots both stalled' },
          { fact: 'CDO hire status', value: 'Role approved · unfilled', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart', why: 'Board approved CDO position Q3 2025 — no hire made — data governance vacuum blocks AI deployment' },
        ],
      },
      {
        id: 'vendors', label: 'Vendor Performance', icon: '!', color: '#DC2626', confidence: 85,
        files: ['ApexRetail_Vendor_Performance_Scorecard.xlsx'],
        records: '24 vendors · 3 years history · 480 SLA data points',
        findings: [
          { fact: 'SAP APO support cost (EOL)', value: '$4.2M/yr', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SAP SLA', why: 'Paying premium support for EOL product — S/4HANA migration quote: $28M — deferral costs compound' },
          { fact: 'Salesforce Commerce personalization SLA', value: 'Breached 8 months', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: Salesforce SLA', why: 'Feature disabled by Salesforce pending data fix — $3.2M in penalties available — not activated' },
          { fact: 'AWS data egress costs', value: '$1.4M/yr unbudgeted', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: Cloud Costs', why: 'Multi-cloud architecture creates charges not captured in IT budget — 2 years untracked' },
        ],
      },
    ],
    readiness: [
      { dimension: 'Data Foundation', score: 41, benchmark: 68, blocker: 'CDP at 34% coverage — 66% of customer journeys invisible — AI models trained on incomplete data' },
      { dimension: 'Technology Platform', score: 35, benchmark: 65, blocker: 'SAP APO EOL, no MLOps pipeline — shrinkage pilot validated but cannot scale to 680 stores' },
      { dimension: 'Data Governance', score: 30, benchmark: 62, blocker: 'CDO role approved but unfilled — no governance framework — 8 departments reporting in Excel' },
      { dimension: 'Talent and Skills', score: 33, benchmark: 55, blocker: '6 data scientists vs 14-16 needed — store operations team has zero ML capability' },
      { dimension: 'Leadership Alignment', score: 64, benchmark: 72, blocker: 'CEO and COO aligned on AI priority — CFO waiting for business case before releasing budget' },
      { dimension: 'Change Readiness', score: 44, benchmark: 60, blocker: '31% store manager attrition — AI pilot fatigue from 3 failed rollouts — cultural resistance in operations' },
    ],
    howWeKnow: [
      { claim: 'Demand forecast error rate of 34% — direct cause of $68M excess inventory', source: 'Operations_Analytics.xlsx · Sheet: Forecast Accuracy · Rolling 12M', data: 'MAPE: 34.2% average. AI benchmark: 8%. Inventory carrying cost at benchmark: $180M. Actual: $248M. Excess: $68M.' },
      { claim: 'Computer vision shrinkage pilot reduced losses 67% across 12 stores', source: 'Application_Technology_Inventory.xlsx · Sheet: AI Pilots · Row: CV Shrinkage Pilot', data: 'Pilot status: Complete. Stores: 12 of 680. Shrinkage reduction: 67%. ROI period: 11 months. Scale plan: None — MLOps capability required.' },
      { claim: 'CDP (Segment) covers only 34% of customer journeys', source: 'Application_Technology_Inventory.xlsx · Sheet: Data Platform · Row: Segment CDP', data: 'Phase 1 sources integrated: web, app, email (34% of touchpoints). Phase 2 (POS, in-store, loyalty) not started. Customer profile completeness: 34%.' },
      { claim: 'Personalization engine disabled for 8 months — $28M conversion gap', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: Salesforce SLA · Row: Commerce Personalization', data: 'Feature disabled by Salesforce (ticket SFCC-AX-09341). Reason: customer profile quality below threshold. Duration: 8 months. Conversion impact: -1.4% vs benchmark = $28M ARR gap.' },
      { claim: '$127M shrinkage loss at 3.5% of revenue vs 1.8% benchmark', source: 'Operations_Analytics.xlsx · Sheet: Loss Prevention · Summary', data: 'FY2024 net sales: $3.6B. Shrinkage rate: 3.5% = $126.7M. Industry benchmark: 1.8% = $64.8M. Gap: $61.9M recoverable annually.' },
      { claim: 'CDO role created Q3 2025 — no hire made — no active requisition', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart · Row: Chief Data Officer', data: 'Role created: July 2025. Board approval: July 2025. Recruiter assigned: None. Active job posting: Not found in HR system.' },
    ],
  },
}

function DataContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [section, setSection] = useState('overview')
  const d = DATA[clientId] || DATA.meridian
  const active = d.categories.find((c: any) => c.id === section)

  // Dynamic nav built from client data
  const navSections = [
    { id: 'overview', label: 'Data Overview' },
    ...d.categories.map((cat: any) => ({ id: cat.id, label: cat.label })),
    { id: 'readiness', label: 'AI Readiness Scores' },
    { id: 'howweknow', label: 'How We Know This' },
  ]

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; }
    .h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #111827; margin-bottom: 8px; }
    .h2 { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 12px; }
    .body { font-size: 14px; line-height: 1.7; color: #4B5563; }
    .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .nav-btn { background: none; border: none; cursor: pointer; font-size: 13px; padding: 9px 12px; border-radius: 6px; width: 100%; text-align: left; font-family: inherit; color: #6B7280; display: block; transition: all 0.12s; }
    .nav-btn.active { background: #F3F4F6; color: #111827; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9CA3AF; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; }
    td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; color: #374151; vertical-align: top; line-height: 1.5; }
    tr:last-child td { border-bottom: none; }
    .bar { background: #F3F4F6; border-radius: 4px; height: 8px; overflow: hidden; margin: 4px 0; }
    .bar-fill { height: 8px; border-radius: 4px; }
  `

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system, sans-serif" }}>
      <style>{css}</style>
      <AbarvaNav />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: '1480px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ padding: '32px 16px 32px 0', position: 'sticky' as const, top: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto' as const }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Data Confidence</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1B4FD8', letterSpacing: '-0.02em' }}>{d.confidence}%</div>
            <div className="bar"><div className="bar-fill" style={{ width: d.confidence + '%', background: '#1B4FD8' }} /></div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            {d.categories.map((cat: any) => (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>{cat.label.split(' ')[0]}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: cat.confidence >= 90 ? '#059669' : '#D97706' }}>{cat.confidence}%</span>
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '12px' }} />
          {navSections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} className={'nav-btn' + (section === s.id ? ' active' : '')}>{s.label}</button>
          ))}
        </div>

        <div style={{ padding: '32px 0 64px 32px', borderLeft: '1px solid #E5E7EB' }}>

          {section === 'overview' && (
            <div>
              <h1 className="h1">Data Intelligence — {d.client}</h1>
              <p className="body" style={{ marginBottom: '24px' }}>Every insight AbarVa surfaces is sourced to a specific row in a specific file.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                {[
                  { label: 'Data categories', value: String(d.categories.length), sub: d.categories.map((c: any) => c.label.split(' ')[0]).join(', '), color: '#1B4FD8' },
                  { label: 'Files ingested', value: String(d.categories.reduce((n: number, c: any) => n + c.files.length, 0)) + ' files', sub: 'Sourced to specific rows', color: '#6D28D9' },
                  { label: 'Contradictions found', value: String(d.howWeKnow.length), sub: 'Each sourced to exact data point', color: '#DC2626' },
                  { label: 'Readiness dimensions', value: String(d.readiness.length), sub: 'Scored from loaded data', color: '#D97706' },
                  { label: 'Key findings', value: String(d.categories.reduce((n: number, c: any) => n + c.findings.length, 0)), sub: 'Across all categories', color: '#047857' },
                  { label: 'Overall confidence', value: d.confidence + '%', sub: 'Weighted across all categories', color: '#1B4FD8' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '2px' }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h2 className="h2">Data Categories Loaded</h2>
                {d.categories.map((cat: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px', borderRadius: '10px', border: '1px solid #E5E7EB', marginBottom: '8px', cursor: 'pointer', alignItems: 'center' }}
                    onClick={() => setSection(cat.id)}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: cat.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: cat.color, fontWeight: 800, flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{cat.label}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{cat.records}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: cat.confidence >= 90 ? '#059669' : '#D97706' }}>{cat.confidence}%</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active && (
            <div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: active.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: active.color }}>{active.icon}</div>
                <div style={{ flex: 1 }}>
                  <h1 className="h1" style={{ fontSize: '22px', marginBottom: '2px' }}>{active.label}</h1>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{active.records}</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: active.confidence >= 90 ? '#059669' : '#D97706' }}>{active.confidence}%</div>
              </div>
              <div className="card" style={{ background: '#F9FAFB', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '8px' }}>Files Loaded</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {active.files.map((f: string, i: number) => (
                    <span key={i} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '8px', background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }}>📄 {f}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="h2">What AbarVa Knows — Sourced to Specific Data</h2>
                <table>
                  <thead><tr><th>Finding</th><th>Value</th><th>Source</th><th>Why It Matters</th></tr></thead>
                  <tbody>
                    {active.findings.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{row.fact}</td>
                        <td style={{ fontWeight: 800, color: active.color, whiteSpace: 'nowrap' as const }}>{row.value}</td>
                        <td style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', fontFamily: 'monospace' }}>{row.source}</td>
                        <td style={{ fontSize: '12px', color: '#374151' }}>{row.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'readiness' && (
            <div>
              <h1 className="h1">AI Readiness Assessment</h1>
              <p className="body" style={{ marginBottom: '24px' }}>Scored from loaded data — not interviews. Every score is tied to a specific data point.</p>
              <div className="card">
                {d.readiness.map((row: any, i: number) => {
                  const c = row.score >= 70 ? '#059669' : row.score >= 50 ? '#D97706' : '#DC2626'
                  return (
                    <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: i < d.readiness.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{row.dimension}</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Benchmark: {row.benchmark}</span>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: c }}>{row.score}</span>
                        </div>
                      </div>
                      <div className="bar"><div className="bar-fill" style={{ width: row.score + '%', background: c }} /></div>
                      <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px', fontStyle: 'italic' }}>{row.blocker}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {section === 'howweknow' && (
            <div>
              <h1 className="h1">How We Know This</h1>
              <p className="body" style={{ marginBottom: '16px' }}>Every claim AbarVa makes is tied to a specific row in a specific file. No guessing. No assumptions.</p>
              <div className="card" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: '16px' }}>
                <p className="body" style={{ fontWeight: 600, color: '#1B4FD8' }}>The most common question in every demo: "How did you know that?" This page is the answer.</p>
              </div>
              {d.howWeKnow.map((item: any, i: number) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#9CA3AF', flexShrink: 0 }}>0{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>{item.claim}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Source File</div>
                          <div style={{ fontSize: '12px', color: '#374151', fontFamily: 'monospace' }}>{item.source}</div>
                        </div>
                        <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Data Point</div>
                          <div style={{ fontSize: '12px', color: '#374151' }}>{item.data}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function DataIntelligencePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6B7280' }}>Loading...</div>}>
      <DataContent />
    </Suspense>
  )
}
