'use client'
import { useState } from 'react'

const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  text: '#EFF6FF', text2: '#94A3B8',
  teal: '#2DD4C8', amber: '#F59E0B', purple: '#818CF8', green: '#34D399',
  red: '#EF4444', indigo: '#6366F1',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
}

type DimKey = 'client' | 'industry' | 'public' | 'genome'
type FileStatus = 'active' | 'parsed' | 'monitored' | 'missing' | 'risk'

interface DataFile {
  icon: string
  name: string
  meta: string
  status: FileStatus
  confidence: number
  detail?: string
}

interface GenomePattern {
  pattern: string
  cases: number
  failureRate: number
  status: 'PRESENT' | 'NOT PRESENT' | 'MONITORING'
}

interface MissingGap {
  name: string
  confidenceGain: number
  unlocks: string
}

interface Finding {
  label: string
  severity: 'critical' | 'high' | 'medium'
  source: string
}

interface Signal {
  label: string
  source: string
}

interface ClientData {
  lastSync: string
  overallConfidence: number
  dimensions: Record<DimKey, { confidence: number; files: DataFile[] }>
  findings: Finding[]
  gaps: MissingGap[]
  signals: Signal[]
  genomePatterns: GenomePattern[]
}

// ─── Arcturus data ────────────────────────────────────────────────────────────

const ARCTURUS: ClientData = {
  lastSync: '2026-04-02 14:33',
  overallConfidence: 91,
  dimensions: {
    client: {
      confidence: 96,
      files: [
        { icon: 'XLS', name: 'Arcturus_Financials_2024.xlsx', meta: 'Thomas Kellner (CFO) · Mar 28 · 2.4 MB', status: 'active', confidence: 96, detail: 'Revenue, CIR, IT budget, AI investment, P&L by region' },
        { icon: 'PDF', name: 'AI_Portfolio_Summary_Q1_2026.pdf', meta: 'Raj Malhotra (CIO) · Mar 30 · 1.1 MB', status: 'active', confidence: 88, detail: '28 initiatives, $94M committed, 0 baselines, status per initiative' },
        { icon: 'XLS', name: 'Technology_Landscape_2026.xlsx', meta: 'Michael Santos (CTO) · Mar 30 · 1.8 MB', status: 'active', confidence: 88, detail: 'Bloomberg AIM, Salesforce FSC, Aladdin, 14 systems inventory' },
        { icon: 'PDF', name: 'Leadership_Profiles_Arcturus.pdf', meta: 'Victoria Hargreaves (CEO) · Mar 28 · 0.8 MB', status: 'parsed', confidence: 91, detail: '6 executives, org chart, CDO vacancy documented' },
        { icon: 'PDF', name: 'Regulatory_Register_2026.pdf', meta: 'Sarah Chen (CRO) · Mar 31 · 1.6 MB', status: 'risk', confidence: 94, detail: 'SEC MRA open, MAS FEAT overdue 4 months — CRITICAL' },
        { icon: 'CSV', name: 'Salesforce_FSC_Adoption_Report.csv', meta: 'Michael Santos (CTO) · Mar 30 · 0.3 MB', status: 'active', confidence: 85, detail: '44% adoption rate, NPS 31, client usage logs' },
      ],
    },
    industry: {
      confidence: 89,
      files: [
        { icon: 'PDF', name: 'OliverWyman_GlobalAM_2025.pdf', meta: 'AbarVa Intelligence · Mar 2026 · 4.2 MB', status: 'parsed', confidence: 89, detail: 'CIR benchmarks, fee compression trends, digital advice penetration' },
        { icon: 'PDF', name: 'McKinsey_AI_AssetMgmt_2025.pdf', meta: 'AbarVa Intelligence · Feb 2026 · 3.8 MB', status: 'parsed', confidence: 91, detail: 'AI maturity scores, ROI benchmarks, CDO impact analysis' },
        { icon: 'PDF', name: 'Gartner_WM_Platform_MQ_2025.pdf', meta: 'AbarVa Intelligence · Jan 2026 · 5.1 MB', status: 'monitored', confidence: 86, detail: 'Salesforce FSC positioning, portal adoption benchmarks' },
        { icon: 'CSV', name: 'ICI_FactBook_Benchmarks_2025.csv', meta: 'AbarVa Intelligence · Mar 2026 · 0.9 MB', status: 'active', confidence: 92, detail: 'AUM per employee, revenue per employee, industry medians' },
      ],
    },
    public: {
      confidence: 94,
      files: [
        { icon: 'PDF', name: 'SEC_FormADV_Arcturus_2026.pdf', meta: 'SEC EDGAR (public) · Mar 2026 · 3.2 MB', status: 'monitored', confidence: 98, detail: '$840B AUM disclosed. 28 AI/ML models. Zero with Form ADV Item 17 documentation.' },
        { icon: 'PDF', name: 'Arcturus_AnnualReport_2024.pdf', meta: 'Investor Relations (public) · Feb 2026 · 8.7 MB', status: 'parsed', confidence: 95, detail: 'CIR 71%, target 58%, Salesforce FSC deployment announced' },
        { icon: 'TXT', name: 'MAS_Register_ArcturusSG.txt', meta: 'MAS Public Register · Apr 2026 · 0.1 MB', status: 'risk', confidence: 99, detail: 'MAS FEAT compliance window expired December 2025. No update filed.' },
        { icon: 'TXT', name: 'FCA_Register_ArcturusUK.txt', meta: 'FCA Register (public) · Apr 2026 · 0.1 MB', status: 'monitored', confidence: 97, detail: 'Consumer Duty implementation 40% complete per supervisory notes' },
        { icon: 'PDF', name: 'Bloomberg_News_CDOVacancy_Feb2026.pdf', meta: 'Bloomberg (public) · Feb 2026 · 0.2 MB', status: 'parsed', confidence: 88, detail: 'CDO vacant 11 months, 3 search firms, regulatory concern cited' },
      ],
    },
    genome: {
      confidence: 87,
      files: [
        { icon: 'GNM', name: 'CDO_Vacancy_Pattern.gnm', meta: 'AbarVa Genome · 14 cases · Apr 2026', status: 'active', confidence: 94, detail: '79% failure rate. PRESENT at Arcturus — 11 months vacant.' },
        { icon: 'GNM', name: 'AI_Without_GoldenRecord.gnm', meta: 'AbarVa Genome · 22 cases · Apr 2026', status: 'active', confidence: 91, detail: '86% failure rate. PRESENT — 14 siloed systems, no golden record.' },
        { icon: 'GNM', name: 'PortalAdoption_Sub50pct.gnm', meta: 'AbarVa Genome · 11 cases · Apr 2026', status: 'active', confidence: 88, detail: '64% failure rate. PRESENT — FSC at 44% at 8 months.' },
        { icon: 'GNM', name: 'Regulatory_Overdue_NoPlan.gnm', meta: 'AbarVa Genome · 9 cases · Apr 2026', status: 'risk', confidence: 96, detail: '89% failure rate. PRESENT — MAS FEAT overdue 4 months, SEC MRA open.' },
      ],
    },
  },
  findings: [
    { label: 'MAS FEAT overdue 4 months — supervisory action under consideration', severity: 'critical', source: 'MAS Public Register' },
    { label: '$94M AI investment, 0 documented baselines — CFO cannot defend at board', severity: 'critical', source: 'CFO data upload' },
    { label: 'CDO vacant 11 months — 14 of 28 AI initiatives blocked', severity: 'critical', source: 'CIO data upload' },
    { label: 'SEC MRA open Sep 2024 — model risk governance inadequate', severity: 'high', source: 'CRO regulatory register' },
    { label: 'Salesforce FSC: $38M invested, 44% adoption, NPS 31', severity: 'high', source: 'CTO data upload' },
    { label: 'Bloomberg AIM 28 years old — 3 failed modernizations', severity: 'medium', source: 'Technology landscape' },
  ],
  gaps: [
    { name: 'CDO hire timeline + interim plan', confidenceGain: 8, unlocks: 'AI governance framework, MAS FEAT path' },
    { name: 'Model inventory (all 28 initiatives)', confidenceGain: 6, unlocks: 'SEC MRA remediation, AI governance score' },
    { name: 'Salesforce FSC client-level adoption data', confidenceGain: 4, unlocks: 'Portal recovery strategy' },
    { name: 'Bloomberg AIM migration feasibility study', confidenceGain: 5, unlocks: 'AI data pipeline design' },
  ],
  signals: [
    { label: '$840B AUM — scale to justify full AI investment', source: 'Annual Report 2024' },
    { label: 'CEO from BlackRock — understands AI at scale', source: 'Leadership profile' },
    { label: 'CIO from JPMorgan AI — knows what governance looks like', source: 'Leadership profile' },
    { label: 'NA and Europe offices already on modern cloud infra', source: 'Technology data' },
  ],
  genomePatterns: [
    { pattern: 'CDO Vacancy During AI Scale-Up', cases: 14, failureRate: 79, status: 'PRESENT' },
    { pattern: 'AI Without Golden Record', cases: 22, failureRate: 86, status: 'PRESENT' },
    { pattern: 'Portal Adoption <50% at 18 Months', cases: 11, failureRate: 64, status: 'PRESENT' },
    { pattern: 'Regulatory Overdue With No Plan', cases: 9, failureRate: 89, status: 'PRESENT' },
  ],
}

// ─── Nexora data ──────────────────────────────────────────────────────────────

const NEXORA: ClientData = {
  lastSync: '2026-04-02 11:18',
  overallConfidence: 89,
  dimensions: {
    client: {
      confidence: 93,
      files: [
        { icon: 'XLS', name: 'Nexora_PL_ByChannel_2024.xlsx', meta: 'Kirsten Mueller (CFO) · Apr 1 · 3.1 MB', status: 'active', confidence: 95, detail: 'P&L by channel: In-Store 5.8%, E-Commerce -2.1%, Wholesale 4.2%' },
        { icon: 'XLS', name: 'ERP_Inventory_GlobalStatus.xlsx', meta: 'Priya Krishnamurthy (COO) · Apr 1 · 2.4 MB', status: 'risk', confidence: 87, detail: '6 ERP systems, SAP R/3 Continental Europe EOL Dec 2027 — CRITICAL' },
        { icon: 'PDF', name: 'AI_Portfolio_Q1_2026.pdf', meta: 'David Park (CIO) · Apr 2 · 1.6 MB', status: 'active', confidence: 85, detail: '34 initiatives, $148M, $12M ROI, Einstein idle 18 months' },
        { icon: 'CSV', name: 'Operations_Dashboard_2024.csv', meta: 'Priya Krishnamurthy (COO) · Apr 1 · 0.8 MB', status: 'active', confidence: 87, detail: 'Inventory turns, store KPIs, shrinkage, supplier data' },
        { icon: 'PDF', name: 'Einstein_License_Status.pdf', meta: 'David Park (CIO) · Apr 2 · 0.4 MB', status: 'risk', confidence: 92, detail: '$14M/yr license, 18 months idle, $248M revenue opportunity not activated' },
        { icon: 'XLS', name: 'Shrinkage_By_Region_2024.xlsx', meta: 'Priya Krishnamurthy (COO) · Apr 1 · 1.1 MB', status: 'active', confidence: 88, detail: '2.8% overall = $515M. 12-store AI pilot: 34% reduction.' },
      ],
    },
    industry: {
      confidence: 91,
      files: [
        { icon: 'PDF', name: 'NRF_RetailTech_2025.pdf', meta: 'AbarVa Intelligence · Mar 2026 · 5.8 MB', status: 'parsed', confidence: 91, detail: 'Inventory benchmarks, fulfillment costs, shrinkage rates' },
        { icon: 'PDF', name: 'McKinsey_RetailAI_Dividend_2025.pdf', meta: 'AbarVa Intelligence · Feb 2026 · 4.1 MB', status: 'parsed', confidence: 93, detail: 'AI ROI benchmarks: 38% median vs 8% Nexora' },
        { icon: 'PDF', name: 'BCG_MarginRecovery_Retail_2025.pdf', meta: 'AbarVa Intelligence · Jan 2026 · 3.6 MB', status: 'monitored', confidence: 89, detail: 'Fulfillment cost reduction playbook, margin recovery levers' },
        { icon: 'PDF', name: 'Forrester_CXI_Retail_2025.pdf', meta: 'AbarVa Intelligence · Mar 2026 · 2.9 MB', status: 'parsed', confidence: 87, detail: 'Loyalty engagement benchmarks, personalization ROI' },
      ],
    },
    public: {
      confidence: 95,
      files: [
        { icon: 'PDF', name: 'Nexora_10K_2024.pdf', meta: 'SEC EDGAR (public) · Feb 2026 · 11.2 MB', status: 'monitored', confidence: 98, detail: 'Operating margin 3.2%, SAP EOL risk disclosed, $148M AI investment announced' },
        { icon: 'PDF', name: 'SAP_ECC_EOL_Documentation.pdf', meta: 'SAP Official (public) · Jan 2026 · 2.3 MB', status: 'risk', confidence: 99, detail: 'SAP R/3 mainstream maintenance ends Dec 2025. Extended ends Dec 2027. Hard deadline.' },
        { icon: 'TXT', name: 'NexoraPressRelease_AI_Jan2026.txt', meta: 'Nexora IR (public) · Jan 2026 · 0.1 MB', status: 'parsed', confidence: 88, detail: '"$148M AI investment programme." No ROI methodology mentioned.' },
        { icon: 'PDF', name: 'Bloomberg_NexoraEcom_Feb2026.pdf', meta: 'Bloomberg (public) · Feb 2026 · 0.3 MB', status: 'parsed', confidence: 86, detail: '"3rd lowest e-commerce margin among 28 peers." -2.1% contribution margin.' },
        { icon: 'PDF', name: 'Nexora_AnnualReport_2024.pdf', meta: 'Investor Relations · Feb 2026 · 9.4 MB', status: 'parsed', confidence: 94, detail: 'Revenue $18.4B, margin decline trend, o9 implementation mentioned' },
      ],
    },
    genome: {
      confidence: 86,
      files: [
        { icon: 'GNM', name: 'AIPersonalization_Idle_12mo.gnm', meta: 'AbarVa Genome · 8 cases · Apr 2026', status: 'risk', confidence: 92, detail: '75% failure rate. PRESENT — Einstein idle 18 months.' },
        { icon: 'GNM', name: 'ERP_EOL_NoMigrationPlan.gnm', meta: 'AbarVa Genome · 12 cases · Apr 2026', status: 'risk', confidence: 96, detail: '83% failure rate. PRESENT — SAP R/3 EOL Dec 2027, no plan.' },
        { icon: 'GNM', name: 'SixPlus_ERPs_BlockingUnified.gnm', meta: 'AbarVa Genome · 7 cases · Apr 2026', status: 'active', confidence: 88, detail: '71% failure. PRESENT — 6 ERPs, no unified data model.' },
        { icon: 'GNM', name: 'Ecom_NegativeMargin_NoRoadmap.gnm', meta: 'AbarVa Genome · 14 cases · Apr 2026', status: 'active', confidence: 90, detail: '64% failure. PRESENT — E-commerce -2.1% margin, no roadmap.' },
      ],
    },
  },
  findings: [
    { label: 'SAP R/3 EOL December 2027 — no migration programme started', severity: 'critical', source: 'COO data upload + SAP docs' },
    { label: 'Einstein AI idle 18 months — $14M/yr license, $248M revenue not activated', severity: 'critical', source: 'CIO data upload' },
    { label: 'E-commerce -2.1% margin — growing channel destroying blended margin', severity: 'critical', source: 'CFO channel P&L' },
    { label: '$148M AI spend, $12M ROI — 8% return vs 38% peer median', severity: 'high', source: 'CIO AI portfolio' },
    { label: 'o9 demand forecasting 40% complete after 18 months — finish or replace decision needed', severity: 'high', source: 'COO operations' },
    { label: 'Shrinkage $515M — 2x industry benchmark. AI pilot showing 34% reduction in 12 stores.', severity: 'medium', source: 'COO shrinkage data' },
  ],
  gaps: [
    { name: 'Continental Europe P&L detail (SAP R/3 region)', confidenceGain: 7, unlocks: 'SAP migration business case' },
    { name: 'Einstein activation readiness assessment', confidenceGain: 5, unlocks: 'Activation sprint plan' },
    { name: 'E-commerce fulfillment cost breakdown by carrier', confidenceGain: 6, unlocks: 'Fulfillment margin recovery plan' },
    { name: 'o9 implementation assessment (what\'s missing in the 60%)', confidenceGain: 4, unlocks: 'Finish vs restart decision' },
  ],
  signals: [
    { label: 'AI pilot showing 34% shrinkage reduction — ready to scale', source: 'COO data' },
    { label: 'NA region on SAP S/4HANA — proven migration playbook exists', source: 'Technology data' },
    { label: 'Klaviyo + Segment licensed — infrastructure ready for cart recovery', source: 'CIO data' },
    { label: 'Databricks churn model built — deployment is execution, not technology', source: 'CIO data' },
  ],
  genomePatterns: [
    { pattern: 'AI Personalization Idle >12 Months', cases: 8, failureRate: 75, status: 'PRESENT' },
    { pattern: 'ERP EOL <24 Months, No Migration Plan', cases: 12, failureRate: 83, status: 'PRESENT' },
    { pattern: '6+ ERPs Blocking Unified Commerce', cases: 7, failureRate: 71, status: 'PRESENT' },
    { pattern: 'Negative E-Commerce Margin, No Roadmap', cases: 14, failureRate: 64, status: 'PRESENT' },
  ],
}

// ─── Default for unknown clients ──────────────────────────────────────────────

const DEFAULT_DATA: ClientData = {
  lastSync: '—',
  overallConfidence: 0,
  dimensions: {
    client: { confidence: 0, files: [] },
    industry: { confidence: 0, files: [] },
    public: { confidence: 0, files: [] },
    genome: { confidence: 0, files: [] },
  },
  findings: [],
  gaps: [],
  signals: [],
  genomePatterns: [],
}

function getClientData(clientId: string): ClientData {
  if (clientId === 'arcturus') return ARCTURUS
  if (clientId === 'nexora') return NEXORA
  return DEFAULT_DATA
}

// ─── Helper components ────────────────────────────────────────────────────────

const DIMS: { key: DimKey; label: string; color: string }[] = [
  { key: 'client',   label: 'Client Data',     color: T.teal },
  { key: 'industry', label: 'Industry Data',   color: T.amber },
  { key: 'public',   label: 'Public Data',     color: T.purple },
  { key: 'genome',   label: 'Genome Patterns', color: T.green },
]

function statusPill(status: FileStatus) {
  const map: Record<FileStatus, { bg: string; color: string; label: string }> = {
    active:    { bg: `${T.teal}18`,   color: T.teal,   label: 'Active' },
    parsed:    { bg: `${T.green}18`,  color: T.green,  label: 'Parsed' },
    monitored: { bg: `${T.purple}18`, color: T.purple, label: 'Monitored' },
    missing:   { bg: `${T.amber}18`,  color: T.amber,  label: 'Missing' },
    risk:      { bg: `${T.red}18`,    color: T.red,    label: 'Risk' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, padding: '2px 8px', borderRadius: '10px', background: s.bg, color: s.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function severityColor(s: 'critical' | 'high' | 'medium') {
  return s === 'critical' ? T.red : s === 'high' ? T.amber : '#60A5FA'
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: T.border, borderRadius: '2px' }}>
        <div style={{ height: '4px', borderRadius: '2px', width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: '10px', color, fontFamily: T.mono, fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  clientId: string
  clientName: string
}

export default function DataIntelligenceTab({ clientId, clientName }: Props) {
  const [activeDim, setActiveDim] = useState<DimKey>('client')
  const data = getClientData(clientId)
  const dim = data.dimensions[activeDim]
  const dimMeta = DIMS.find(d => d.key === activeDim)!

  return (
    <div style={{ fontFamily: T.sans, color: T.text }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Data Intelligence</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: T.text }}>{clientName}</div>
          <div style={{ fontSize: '12px', color: T.text2, marginTop: '2px' }}>Last sync: {data.lastSync}</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {DIMS.map(d => (
            <div key={d.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: d.color, fontFamily: T.mono }}>{data.dimensions[d.key].confidence}%</div>
              <div style={{ fontSize: '10px', color: T.text2, marginTop: '1px' }}>{d.label}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, fontFamily: T.mono }}>{data.overallConfidence}%</div>
            <div style={{ fontSize: '10px', color: T.text2, marginTop: '1px' }}>Overall</div>
          </div>
        </div>
      </div>

      {/* ── Dimension tabs ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {DIMS.map(d => {
          const active = activeDim === d.key
          return (
            <button key={d.key} onClick={() => setActiveDim(d.key)} style={{ padding: '10px 18px', borderRadius: '8px', border: `1px solid ${active ? d.color : T.border}`, background: active ? `${d.color}12` : T.surface, color: active ? d.color : T.text2, fontSize: '12px', fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: d.color, display: 'inline-block', opacity: active ? 1 : 0.4 }} />
              {d.label}
              <span style={{ fontSize: '10px', fontFamily: T.mono, color: active ? d.color : T.text2, background: active ? `${d.color}20` : T.border, padding: '1px 6px', borderRadius: '10px' }}>
                {data.dimensions[d.key].files.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left: file list */}
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: dimMeta.color, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {dimMeta.label} · {dim.files.length} files
              </div>
              <ConfidenceBar value={dim.confidence} color={dimMeta.color} />
            </div>
            {dim.files.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: T.text2, fontSize: '13px' }}>
                No data loaded yet for this dimension.
              </div>
            ) : (
              dim.files.map((f, i) => (
                <div key={i} style={{ padding: '14px 18px', borderBottom: i < dim.files.length - 1 ? `1px solid ${T.border}` : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, color: dimMeta.color, background: `${dimMeta.color}12`, padding: '4px 6px', borderRadius: '4px', letterSpacing: '0.04em', flexShrink: 0, marginTop: '2px' }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {statusPill(f.status)}
                        <span style={{ fontSize: '10px', fontFamily: T.mono, color: f.confidence >= 90 ? T.green : f.confidence >= 75 ? T.amber : T.red, fontWeight: 700 }}>{f.confidence}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: T.text2, marginBottom: f.detail ? '4px' : '0' }}>{f.meta}</div>
                    {f.detail && <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.4, opacity: 0.8 }}>{f.detail}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Genome patterns table — always visible */}
          {data.genomePatterns.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: T.green, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Genome Patterns · Failure Risk Analysis</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Pattern', 'Prior Cases', 'Failure Rate', 'Status'].map((h, i) => (
                      <th key={i} style={{ padding: '8px 16px', fontSize: '9px', fontWeight: 700, fontFamily: T.mono, color: T.text2, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.genomePatterns.map((p, i) => {
                    const statusColor = p.status === 'PRESENT' ? T.red : p.status === 'MONITORING' ? T.amber : T.green
                    return (
                      <tr key={i} style={{ borderBottom: i < data.genomePatterns.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: T.text }}>{p.pattern}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: T.text2, fontFamily: T.mono }}>{p.cases}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: p.failureRate >= 80 ? T.red : p.failureRate >= 60 ? T.amber : T.green, fontFamily: T.mono }}>{p.failureRate}%</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, color: statusColor, background: `${statusColor}18`, padding: '3px 8px', borderRadius: '10px' }}>{p.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Confidence per dimension */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Confidence by Source</div>
            {DIMS.map(d => (
              <div key={d.key} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: T.text2, marginBottom: '4px' }}>{d.label}</div>
                <ConfidenceBar value={data.dimensions[d.key].confidence} color={d.color} />
              </div>
            ))}
          </div>

          {/* Critical findings */}
          {data.findings.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.red, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Critical Findings</div>
              {data.findings.map((f, i) => (
                <div key={i} style={{ borderBottom: i < data.findings.length - 1 ? `1px solid ${T.border}` : 'none', paddingBottom: i < data.findings.length - 1 ? '10px' : '0', marginBottom: i < data.findings.length - 1 ? '10px' : '0' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '3px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: severityColor(f.severity), flexShrink: 0, marginTop: '4px' }} />
                    <div style={{ fontSize: '11px', color: T.text, lineHeight: 1.4 }}>{f.label}</div>
                  </div>
                  <div style={{ fontSize: '10px', color: T.text2, marginLeft: '12px' }}>{f.source}</div>
                </div>
              ))}
            </div>
          )}

          {/* Missing data gaps */}
          {data.gaps.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.amber, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Data Gaps</div>
              {data.gaps.map((g, i) => (
                <div key={i} style={{ borderBottom: i < data.gaps.length - 1 ? `1px solid ${T.border}` : 'none', paddingBottom: i < data.gaps.length - 1 ? '10px' : '0', marginBottom: i < data.gaps.length - 1 ? '10px' : '0' }}>
                  <div style={{ fontSize: '11px', color: T.text, marginBottom: '2px' }}>{g.name}</div>
                  <div style={{ fontSize: '10px', color: T.text2, marginBottom: '4px' }}>+{g.confidenceGain}% confidence · unlocks {g.unlocks}</div>
                  <button style={{ fontSize: '10px', fontFamily: T.mono, color: T.amber, background: `${T.amber}12`, border: `1px solid ${T.amber}30`, padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                    Download template →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Positive signals */}
          {data.signals.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.green, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Confirmed Signals</div>
              {data.signals.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: i < data.signals.length - 1 ? '8px' : '0' }}>
                  <span style={{ color: T.green, fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <div>
                    <div style={{ fontSize: '11px', color: T.text, lineHeight: 1.4 }}>{s.label}</div>
                    <div style={{ fontSize: '10px', color: T.text2 }}>{s.source}</div>
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
