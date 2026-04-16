'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { MERIDIAN_RCM_VENDORS, ENSEMBLE_REFERENCE_OUTCOMES } from '@/data/knowledge/vendor-outcomes'
import { MERIDIAN_CONTRACT_BENCHMARKS, MERIDIAN_NEGOTIATION_SEQUENCE } from '@/data/knowledge/contract-benchmarks'
import { scoreVendorFit, vendorColorBucket } from '@/lib/vendor-intelligence'
import { calculateSlaCredit } from '@/lib/vendor-intelligence'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12',
  surface: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  indigo: '#6366F1',
  text: '#EFF6FF',
  secondary: 'rgba(255,255,255,0.75)',
  fraunces: 'Fraunces, Georgia, serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  sans: '"DM Sans", system-ui, sans-serif',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'select' | 'optimize'
type SelectStep = 1 | 2 | 3 | 4 | 5 | 6

const CLIENTS = ['meridian', 'firstcapital', 'apexretail'] as const
type Client = typeof CLIENTS[number]

const CLIENT_LABELS: Record<Client, string> = {
  meridian: 'Meridian Health',
  firstcapital: 'First Capital Bank',
  apexretail: 'Apex Retail',
}

const meridianProfile = {
  epicIntegration: true,
  azureIntegration: true,
  dataReadiness: 67,
  techReadiness: 52,
  orgReadiness: 41,
  cdoPresent: false,
  priorAuthCoverage: 23,
}

// Current vendor portfolio for Mode 2 — Meridian Health ($11.2B IDN, 23 hospitals)
// Total addressable vendor spend: ~$340M technology & services
const CURRENT_VENDORS = [
  // ── RCM & Revenue Cycle ───────────────────────────────────────────────────
  {
    name: 'Ensemble Health Partners',
    category: 'RCM Outsourcing',
    annualSpend: 48_000_000,
    contractEnd: 'Dec 2027',
    contractedUptime: 99.5,
    actualUptime: 97.1,
    marketRate: 38_000_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'SLA compliance 67% vs 95% target — $8M in unenforced penalties',
  },
  {
    name: 'Change Healthcare (Optum)',
    category: 'Claims Clearinghouse',
    annualSpend: 11_200_000,
    contractEnd: 'Jun 2026',
    contractedUptime: 99.8,
    actualUptime: 99.1,
    marketRate: 9_400_000,
    isRenewing: true,
    hasOverlap: true,
    note: 'Overlap with Waystar — consolidation opportunity worth $3.8M/yr',
  },
  {
    name: 'Waystar',
    category: 'Patient Access & Prior Auth',
    annualSpend: 7_400_000,
    contractEnd: 'Sep 2026',
    contractedUptime: 99.5,
    actualUptime: 98.8,
    marketRate: 6_800_000,
    isRenewing: false,
    hasOverlap: true,
    note: 'Prior auth coverage only 23% — missing United, Aetna, BCBS',
  },
  // ── Clinical Systems ──────────────────────────────────────────────────────
  {
    name: 'Epic Systems',
    category: 'EHR Platform',
    annualSpend: 24_000_000,
    contractEnd: 'Q2 2028',
    contractedUptime: 99.9,
    actualUptime: 99.9,
    marketRate: 20_500_000,
    isRenewing: false,
    hasOverlap: false,
    note: '58/100 optimization score — 6 of 8 modules dark or underactivated',
  },
  {
    name: 'Nuance / Microsoft DAX',
    category: 'Clinical Documentation AI',
    annualSpend: 8_600_000,
    contractEnd: 'Mar 2026',
    contractedUptime: 99.0,
    actualUptime: 98.4,
    marketRate: 7_200_000,
    isRenewing: true,
    hasOverlap: false,
    note: 'Renewal opportunity — DAX Copilot bundle may reduce per-seat cost 22%',
  },
  {
    name: 'Oracle Health (Cerner)',
    category: 'Legacy EHR (2 hospitals)',
    annualSpend: 5_800_000,
    contractEnd: 'Dec 2025',
    contractedUptime: 99.5,
    actualUptime: 99.3,
    marketRate: 4_200_000,
    isRenewing: false,
    hasOverlap: true,
    note: 'Blue Ridge migration 8 months overdue — $14M cost at risk',
  },
  {
    name: '3M Health Information Systems',
    category: 'Coding & CDI',
    annualSpend: 9_100_000,
    contractEnd: 'Aug 2026',
    contractedUptime: 99.5,
    actualUptime: 99.4,
    marketRate: 8_400_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'AI coding accuracy 87% — Zynx and Dolbey alternatives showing 93%+',
  },
  // ── Infrastructure & Cloud ────────────────────────────────────────────────
  {
    name: 'Microsoft Azure',
    category: 'Cloud Infrastructure',
    annualSpend: 22_000_000,
    contractEnd: 'Oct 2026',
    contractedUptime: 99.9,
    actualUptime: 99.7,
    marketRate: 18_500_000,
    isRenewing: true,
    hasOverlap: false,
    note: 'Azure Synapse 40% complete — additional $8M committed to complete by Q3',
  },
  {
    name: 'Leidos Health',
    category: 'Data Center & Managed IT Ops',
    annualSpend: 18_400_000,
    contractEnd: 'Jun 2027',
    contractedUptime: 99.8,
    actualUptime: 99.5,
    marketRate: 16_200_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'Co-location for 3 on-premise data centers — cloud migration would retire $12M',
  },
  {
    name: 'CrowdStrike',
    category: 'Endpoint Security (EDR)',
    annualSpend: 5_200_000,
    contractEnd: 'Nov 2025',
    contractedUptime: 99.9,
    actualUptime: 99.9,
    marketRate: 4_800_000,
    isRenewing: true,
    hasOverlap: false,
    note: 'Renewal 2025 — multi-year lock-in saves est. $620K',
  },
  {
    name: 'Splunk (Cisco)',
    category: 'Security Operations & SIEM',
    annualSpend: 4_100_000,
    contractEnd: 'Feb 2026',
    contractedUptime: 99.5,
    actualUptime: 99.8,
    marketRate: 3_600_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'Microsoft Sentinel migration could reduce cost 35% given Azure commitment',
  },
  // ── ERP & Enterprise Systems ──────────────────────────────────────────────
  {
    name: 'Workday',
    category: 'HCM, Finance & Planning',
    annualSpend: 12_400_000,
    contractEnd: 'Jan 2028',
    contractedUptime: 99.7,
    actualUptime: 99.8,
    marketRate: 11_600_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'HCM implementation 78% adopted — Planning module licensed but unused',
  },
  {
    name: 'ServiceNow',
    category: 'IT Service Management',
    annualSpend: 3_200_000,
    contractEnd: 'Jul 2026',
    contractedUptime: 99.9,
    actualUptime: 99.9,
    marketRate: 2_900_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'ITSM fully deployed — HRSD module add-on would reduce Workday integration cost',
  },
  {
    name: 'Kronos / UKG Pro',
    category: 'Workforce Management',
    annualSpend: 4_400_000,
    contractEnd: 'Jun 2027',
    contractedUptime: 99.5,
    actualUptime: 99.6,
    marketRate: 3_800_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'Gap: UKG not connected to Epic scheduling — travel nurse cost impact $8M/yr',
  },
  // ── SI & Managed Services ─────────────────────────────────────────────────
  {
    name: 'Accenture',
    category: 'Managed IT Services & App Support',
    annualSpend: 28_000_000,
    contractEnd: 'Mar 2027',
    contractedUptime: 99.0,
    actualUptime: 98.2,
    marketRate: 22_000_000,
    isRenewing: false,
    hasOverlap: false,
    note: 'Epic module support + Azure migration — T&M model with no outcome clause',
  },
  {
    name: 'Deloitte',
    category: 'Strategic Advisory & PMO',
    annualSpend: 14_200_000,
    contractEnd: 'Dec 2025',
    contractedUptime: 99.0,
    actualUptime: 98.7,
    marketRate: 11_000_000,
    isRenewing: true,
    hasOverlap: true,
    note: 'Overlap with Accenture on Epic programme — consolidation saves est. $4.2M',
  },
  {
    name: 'Cognizant',
    category: 'IT Staff Augmentation',
    annualSpend: 31_000_000,
    contractEnd: 'Rolling',
    contractedUptime: 99.0,
    actualUptime: 98.9,
    marketRate: 24_500_000,
    isRenewing: false,
    hasOverlap: true,
    note: '210 contractors across Epic, infrastructure, and analytics — 38% above market rate',
  },
  {
    name: 'R1 RCM',
    category: 'Clinical Staff Augmentation',
    annualSpend: 22_000_000,
    contractEnd: 'Sep 2026',
    contractedUptime: 99.0,
    actualUptime: 99.1,
    marketRate: 19_000_000,
    isRenewing: false,
    hasOverlap: true,
    note: 'Overlap with Ensemble on denial management — $6M in duplicated scope',
  },
]

// ── Scatter Plot ──────────────────────────────────────────────────────────────
const VENDOR_POSITIONS: Record<string, { x: number; y: number }> = {
  ensemble: { x: 22, y: 71 },
  waystar:  { x: 32, y: 64 },
  r1rcm:    { x: 52, y: 61 },
  optum:    { x: 78, y: 55 },
  changehc: { x: 85, y: 38 },
}

function VendorScatterPlot({ vendors, onHover, hovered }: {
  vendors: typeof MERIDIAN_RCM_VENDORS,
  onHover: (id: string | null) => void,
  hovered: string | null,
}) {
  const colorMap: Record<string, string> = {
    teal: T.teal,
    blue: '#3B82F6',
    amber: T.amber,
    gray: '#475569',
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
      <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>
        OUTCOME ACHIEVEMENT RATE (FROM GENOME) ↑
      </div>
      <svg viewBox="0 0 500 320" style={{ width: '100%', display: 'block', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {/* Axes */}
        <line x1={50} y1={280} x2={480} y2={280} stroke={T.border} strokeWidth={1} />
        <line x1={50} y1={20} x2={50} y2={280} stroke={T.border} strokeWidth={1} />
        {/* Y axis labels */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={46} y1={280 - v * 2.6} x2={50} y2={280 - v * 2.6} stroke={T.border} strokeWidth={1} />
            <text x={42} y={280 - v * 2.6 + 4} textAnchor="end" fontSize={9} fill={T.secondary} fontFamily={T.mono}>{v}%</text>
          </g>
        ))}
        {/* X axis labels */}
        <text x={50} y={296} textAnchor="middle" fontSize={9} fill={T.secondary} fontFamily={T.mono}>Low</text>
        <text x={480} y={296} textAnchor="middle" fontSize={9} fill={T.secondary} fontFamily={T.mono}>High</text>
        <text x={265} y={310} textAnchor="middle" fontSize={9} fill={T.secondary} fontFamily={T.mono}>IMPLEMENTATION COMPLEXITY AT YOUR ORG →</text>

        {vendors.map(v => {
          const pos = VENDOR_POSITIONS[v.id]
          if (!pos) return null
          const cx = 50 + (pos.x / 100) * 430
          const cy = 280 - (pos.y / 100) * 260
          const r = 8 + (v.referenceMatchScore / 100) * 14
          const isHovered = hovered === v.id
          return (
            <g
              key={v.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(v.id)}
              onMouseLeave={() => onHover(null)}
            >
              <circle
                cx={cx} cy={cy} r={r}
                fill={colorMap[v.color]}
                opacity={hovered && !isHovered ? 0.3 : 0.85}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={2}
              />
              <text
                x={cx} y={cy + r + 12}
                textAnchor="middle"
                fontSize={8}
                fill={isHovered ? T.text : T.secondary}
                fontFamily={T.mono}
              >
                {v.name.split(' ')[0]}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: T.teal, label: 'Recommended' },
          { color: '#3B82F6', label: 'Consider' },
          { color: T.amber, label: 'Caution' },
          { color: '#475569', label: 'Not recommended' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>· Bubble size = reference match</span>
      </div>
    </div>
  )
}

// ── Vendor card ───────────────────────────────────────────────────────────────
function VendorCard({ vendor, rank }: { vendor: typeof MERIDIAN_RCM_VENDORS[0]; rank: number }) {
  const benchmark = MERIDIAN_CONTRACT_BENCHMARKS.find(b => b.vendorId === vendor.id)
  const isTop = rank === 1

  return (
    <div style={{
      border: `1px solid ${isTop ? T.teal : T.border}`,
      borderRadius: 12,
      padding: 24,
      background: T.surface,
      flex: 1,
      minWidth: 280,
    }}>
      {isTop && (
        <div style={{
          fontSize: 9, fontFamily: T.mono, color: T.bg, background: T.teal,
          padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8,
        }}>
          ⭐ RECOMMENDED
        </div>
      )}
      <div style={{ fontSize: 16, fontFamily: T.sans, fontWeight: 700, color: T.text, marginBottom: 16 }}>
        {vendor.name}
      </div>

      {/* Three-source columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 8, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>FROM INDUSTRY</div>
          <div style={{ fontSize: 11, color: T.text, fontFamily: T.sans, lineHeight: 1.6 }}>
            ${(vendor.year1CostRange[0] / 1e6).toFixed(1)}-{(vendor.year1CostRange[1] / 1e6).toFixed(1)}M year 1<br />
            {vendor.referenceCount * 40}+ clients<br />
            RCM specialist<br />
            {benchmark ? `${benchmark.pricePercentile}th price %ile` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>FROM GENOME</div>
          <div style={{ fontSize: 11, color: T.text, fontFamily: T.sans, lineHeight: 1.6 }}>
            {vendor.outcomeRate}% success rate<br />
            {vendor.referenceCount} similar wins<br />
            {vendor.implementationMonthsAvg}mo avg to value<br />
            {vendor.genomeRisk ? vendor.genomeRisk.substring(0, 30) + '…' : 'No critical risks'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>YOUR FIT</div>
          <div style={{ fontSize: 11, color: T.text, fontFamily: T.sans, lineHeight: 1.6 }}>
            Epic native {vendor.epicNative ? '✓' : '✗'}<br />
            Azure native {vendor.azureNative ? '✓' : '✗'}<br />
            HIPAA BAA {vendor.hipaaBaa ? '✓' : '✗'}<br />
            Team ready: Med
          </div>
        </div>
      </div>

      {/* Outcome rate bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>
          OUTCOME RATE: {vendor.outcomeRate}% achieve target within 18 months
        </div>
        <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${vendor.outcomeRate}%`, background: T.teal, borderRadius: 2 }} />
        </div>
      </div>

      {/* Risk flag */}
      {vendor.genomeRisk && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: `1px solid ${T.amber}`,
          borderRadius: 6,
          padding: '8px 12px',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber, flexShrink: 0, display: 'inline-block' }} />RISK FLAG — MEDIUM</div>
          <div style={{ fontSize: 11, color: T.text, fontFamily: T.sans }}>{vendor.genomeRisk}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={{
          fontSize: 11, fontFamily: T.mono, padding: '6px 12px',
          background: 'transparent', border: `1px solid ${T.teal}`,
          color: T.teal, borderRadius: 6, cursor: 'pointer',
        }}>
          View {vendor.referenceCount} references →
        </button>
        {isTop && (
          <button style={{
            fontSize: 11, fontFamily: T.mono, padding: '6px 12px',
            background: T.teal, color: T.bg, borderRadius: 6, cursor: 'pointer', border: 'none',
          }}>
            Build RFP →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Mode 1 — Select a Vendor ──────────────────────────────────────────────────
function SelectVendorMode() {
  const [step, setStep] = useState<SelectStep>(1)
  const [hoveredVendor, setHoveredVendor] = useState<string | null>(null)
  const [showAllRefs, setShowAllRefs] = useState(false)

  const hoveredDetails = hoveredVendor ? MERIDIAN_RCM_VENDORS.find(v => v.id === hoveredVendor) : null
  const topVendors = MERIDIAN_RCM_VENDORS.filter(v => v.color !== 'gray').slice(0, 3)
  const benchmark = MERIDIAN_CONTRACT_BENCHMARKS[0] // Ensemble

  const stepLabels: Record<SelectStep, string> = {
    1: 'Define selection',
    2: 'Vendor landscape',
    3: 'Scored shortlist',
    4: 'Reference outcomes',
    5: 'Contract intelligence',
    6: 'RFP generation',
  }

  return (
    <div style={{ fontFamily: T.sans }}>
      {/* Step navigator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: `1px solid ${T.border}`, paddingBottom: 16, overflowX: 'auto' }}>
        {([1, 2, 3, 4, 5, 6] as SelectStep[]).map(s => (
          <button
            key={s}
            onClick={() => setStep(s)}
            style={{
              fontSize: 11, fontFamily: T.mono, padding: '8px 16px',
              background: step === s ? T.teal : 'transparent',
              color: step === s ? T.bg : T.secondary,
              border: 'none', cursor: 'pointer', borderRadius: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {s}. {stepLabels[s]}
          </button>
        ))}
      </div>

      {/* Step 1 — Define selection */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>STEP 1 OF 6</div>
          <div style={{ fontSize: 24, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
            Define what you are selecting for
          </div>
          <div style={{
            background: 'rgba(45,212,200,0.06)', border: `1px solid rgba(45,212,200,0.25)`,
            borderRadius: 8, padding: '8px 12px', marginBottom: 24, fontSize: 11, fontFamily: T.mono, color: T.teal,
          }}>
            Pre-filled from AI Investment Intelligence confirmed bets
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
            {[
              { label: 'INITIATIVE TYPE', value: 'RCM AI Automation' },
              { label: 'BUDGET RANGE', value: '$4M – $6M annually' },
              { label: 'TIMELINE', value: 'Go-live within 12 months' },
              { label: 'SELECTION CHAMPION', value: 'CIO' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>{label}</div>
                <div style={{
                  padding: '10px 14px', background: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  fontSize: 13, color: T.text, fontFamily: T.sans,
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, maxWidth: 600 }}>
            <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>MUST-HAVE INTEGRATIONS</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['Epic', true], ['Azure', true], ['Workday', false], ['Salesforce', false]].map(([name, checked]) => (
                <div key={String(name)} style={{
                  padding: '6px 12px', borderRadius: 6,
                  border: `1px solid ${checked ? T.teal : T.border}`,
                  background: checked ? 'rgba(45,212,200,0.1)' : 'transparent',
                  color: checked ? T.teal : T.secondary,
                  fontSize: 11, fontFamily: T.mono,
                }}>
                  {checked ? '✓' : ' '} {String(name)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, maxWidth: 600 }}>
            <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>DEAL-BREAKER REQUIREMENTS</div>
            <div style={{
              padding: '10px 14px', background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 6,
              fontSize: 13, color: T.secondary, fontFamily: T.sans,
            }}>
              HIPAA BAA required · US-only data residency
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            style={{
              marginTop: 24, padding: '12px 28px',
              background: T.teal, color: T.bg,
              border: 'none', borderRadius: 8,
              fontSize: 13, fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Find vendors →
          </button>
        </div>
      )}

      {/* Step 2 — Vendor landscape */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>STEP 2 OF 6</div>
          <div style={{ fontSize: 24, fontFamily: T.fraunces, color: T.text, marginBottom: 8 }}>
            The vendor landscape
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.3)`,
            borderRadius: 6, padding: '6px 12px', marginBottom: 24,
            fontSize: 10, fontFamily: T.mono, color: T.secondary,
          }}>
            Demo data — illustrative only. Live client data is private.
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <VendorScatterPlot
              vendors={MERIDIAN_RCM_VENDORS}
              onHover={setHoveredVendor}
              hovered={hoveredVendor}
            />
            {hoveredDetails && (
              <div style={{
                background: T.surface, border: `1px solid ${T.teal}`,
                borderRadius: 10, padding: 20, minWidth: 260, maxWidth: 300,
              }}>
                <div style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text, marginBottom: 12 }}>
                  {hoveredDetails.name}
                </div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, lineHeight: 2 }}>
                  Outcome rate: {hoveredDetails.outcomeRate}%<br />
                  Reference match: {hoveredDetails.referenceCount} wins at similar systems<br />
                  Year 1 cost: ${(hoveredDetails.year1CostRange[0] / 1e6).toFixed(0)}-{(hoveredDetails.year1CostRange[1] / 1e6).toFixed(0)}M<br />
                  Implementation: {hoveredDetails.implementationMonthsAvg} months avg
                </div>
                {hoveredDetails.genomeRisk && (
                  <div style={{ marginTop: 12, fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                    FROM GENOME: {hoveredDetails.genomeRisk}
                  </div>
                )}
                <button
                  onClick={() => setStep(3)}
                  style={{
                    marginTop: 12, fontSize: 11, fontFamily: T.mono,
                    padding: '6px 12px', background: 'transparent',
                    border: `1px solid ${T.teal}`, color: T.teal,
                    borderRadius: 6, cursor: 'pointer',
                  }}
                >
                  View full analysis →
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setStep(3)}
            style={{
              marginTop: 24, padding: '12px 28px',
              background: T.teal, color: T.bg,
              border: 'none', borderRadius: 8,
              fontSize: 13, fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
            }}
          >
            See scored shortlist →
          </button>
        </div>
      )}

      {/* Step 3 — Scored shortlist */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>STEP 3 OF 6</div>
          <div style={{ fontSize: 24, fontFamily: T.fraunces, color: T.text, marginBottom: 8 }}>
            Scored shortlist — top 3
          </div>
          <div style={{ fontSize: 13, color: T.secondary, fontFamily: T.sans, marginBottom: 24 }}>
            Ranked by: outcome rate · integration fit · reference match · complexity at Meridian
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {topVendors.map((v, i) => (
              <VendorCard key={v.id} vendor={v} rank={i + 1} />
            ))}
          </div>
          <button
            onClick={() => setStep(4)}
            style={{
              padding: '12px 28px',
              background: T.teal, color: T.bg,
              border: 'none', borderRadius: 8,
              fontSize: 13, fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
            }}
          >
            View reference outcomes →
          </button>
        </div>
      )}

      {/* Step 4 — Reference outcomes */}
      {step === 4 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>STEP 4 OF 6</div>
          <div style={{ fontSize: 24, fontFamily: T.fraunces, color: T.text, marginBottom: 8 }}>
            Reference outcome matching
          </div>
          <div style={{ fontSize: 13, color: T.secondary, fontFamily: T.sans, marginBottom: 4 }}>
            {ENSEMBLE_REFERENCE_OUTCOMES.length} organizations similar to Meridian where Ensemble was deployed
          </div>
          <div style={{
            fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 24,
            lineHeight: 1.8,
          }}>
            Similarity criteria: Health system $8-15B revenue ✓ · Epic primary EHR ✓ · Denial rate &gt;15% at baseline ✓ · Midwest or Southeast ✓
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
            {(showAllRefs ? ENSEMBLE_REFERENCE_OUTCOMES : ENSEMBLE_REFERENCE_OUTCOMES.slice(0, 3)).map((ref, i) => (
              <div
                key={ref.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < ENSEMBLE_REFERENCE_OUTCOMES.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: ref.succeeded ? 'transparent' : 'rgba(239,68,68,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, fontWeight: 600 }}>
                    {ref.description}
                  </div>
                  <div style={{
                    fontSize: 10, fontFamily: T.mono,
                    color: ref.succeeded ? T.green : T.red,
                    padding: '2px 8px', borderRadius: 4,
                    border: `1px solid ${ref.succeeded ? T.green : T.red}`,
                    flexShrink: 0, marginLeft: 12,
                  }}>
                    {ref.succeeded ? 'SUCCEEDED' : 'FAILED'}
                  </div>
                </div>
                {ref.succeeded ? (
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, lineHeight: 1.8 }}>
                    Denial: {ref.baselineDenial}% → {ref.finalDenial}% · Time to value: {ref.timeToValueMonths}mo · Savings: ${(ref.annualSavings / 1e6).toFixed(0)}M annual
                  </div>
                ) : (
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                    Reason: {ref.keyFactor}
                  </div>
                )}
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginTop: 4 }}>
                  {ref.succeeded ? '✓' : '✗'} {ref.keyFactor}
                </div>
              </div>
            ))}
          </div>
          {!showAllRefs && ENSEMBLE_REFERENCE_OUTCOMES.length > 3 && (
            <button
              onClick={() => setShowAllRefs(true)}
              style={{
                fontSize: 11, fontFamily: T.mono, padding: '8px 16px',
                background: 'transparent', border: `1px solid ${T.border}`,
                color: T.secondary, borderRadius: 6, cursor: 'pointer', marginBottom: 16,
              }}
            >
              View all {ENSEMBLE_REFERENCE_OUTCOMES.length} references →
            </button>
          )}
          <div>
            <button
              onClick={() => setStep(5)}
              style={{
                padding: '12px 28px',
                background: T.teal, color: T.bg,
                border: 'none', borderRadius: 8,
                fontSize: 13, fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
              }}
            >
              View contract intelligence →
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Contract intelligence */}
      {step === 5 && benchmark && (
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>STEP 5 OF 6</div>
          <div style={{ fontSize: 24, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
            Contract intelligence — Ensemble
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Pricing benchmarks */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
                PRICING — FROM {benchmark.sampleSize} LIVE CONTRACTS IN GENOME
              </div>
              {[
                { label: 'Implementation fee', range: benchmark.implementationFeeRange, estimate: 1_500_000 },
                { label: 'Annual platform', range: benchmark.annualPlatformRange, estimate: 3_500_000 },
              ].map(({ label, range, estimate }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: T.text, fontFamily: T.sans, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                    Market: ${(range[0] / 1e6).toFixed(1)}-{(range[1] / 1e6).toFixed(1)}M
                  </div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal }}>
                    Your estimate: ${(estimate / 1e6).toFixed(1)}M ✓ in range
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 8 }}>
                Outcome share: present in {benchmark.outcomeSharePresent}% of contracts
              </div>
            </div>

            {/* Key terms */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>KEY TERMS TO INSIST ON</div>
              {benchmark.keyTermsToInsist.slice(0, 4).map(term => (
                <div key={term} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: T.teal, fontSize: 12, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text }}>{term}</span>
                </div>
              ))}
            </div>

            {/* Watch for */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>WATCH FOR</div>
              {benchmark.watchForClauses.map(clause => (
                <div key={clause} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.amber, flexShrink: 0, marginTop: 4, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text }}>{clause}</span>
                </div>
              ))}
            </div>

            {/* Negotiation levers */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>YOUR LEVERAGE</div>
              {benchmark.negotiationLevers.map(lever => (
                <div key={lever} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: T.teal, fontSize: 12, flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text }}>{lever}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Negotiation sequence */}
          <div style={{ marginTop: 24, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, maxWidth: 600 }}>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
              RECOMMENDED NEGOTIATION SEQUENCE
            </div>
            {MERIDIAN_NEGOTIATION_SEQUENCE.map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: T.teal, color: T.bg,
                  fontSize: 11, fontFamily: T.mono, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.text, fontFamily: T.sans, fontWeight: 600 }}>{s.action}</div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>{s.rationale}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(6)}
            style={{
              marginTop: 24, padding: '12px 28px',
              background: T.teal, color: T.bg,
              border: 'none', borderRadius: 8,
              fontSize: 13, fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Generate RFP →
          </button>
        </div>
      )}

      {/* Step 6 — RFP generation */}
      {step === 6 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>STEP 6 OF 6</div>
          <div style={{ fontSize: 24, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
            Your RFP is ready
          </div>
          <div style={{
            background: 'rgba(45,212,200,0.06)',
            border: `1px solid rgba(45,212,200,0.25)`,
            borderRadius: 12, padding: 28, maxWidth: 600,
          }}>
            <div style={{ fontSize: 16, fontFamily: T.sans, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Meridian Health System — RCM AI Automation
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 20 }}>
              Issued: April 13, 2026
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>WHAT&apos;S IN IT:</div>
            {[
              'Meridian\'s specific requirements (from Step 1)',
              'Must-have technical criteria (Epic integration, HIPAA BAA)',
              'Outcome-based scoring criteria (weighted by Genome success factors)',
              'Benchmark pricing anchors (from contract intelligence)',
              'Mandatory contract terms (from Step 5)',
              'Evaluation scoring rubric',
            ].map(item => (
              <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: T.teal }}>·</span>
                <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>{item}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <button style={{
                padding: '10px 20px', background: T.teal, color: T.bg,
                border: 'none', borderRadius: 8, fontSize: 12,
                fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
              }}>
                Download RFP →
              </button>
              <button style={{
                padding: '10px 20px', background: 'transparent',
                border: `1px solid ${T.teal}`, color: T.teal,
                borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
              }}>
                Send to vendors →
              </button>
              <a
                href="/business-case?client=meridian"
                style={{
                  padding: '10px 20px', background: 'transparent',
                  border: `1px solid ${T.border}`, color: T.secondary,
                  borderRadius: 8, fontSize: 12, fontFamily: T.mono,
                  textDecoration: 'none', cursor: 'pointer',
                }}
              >
                Business Case →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mode 2 — Optimize Current Vendors ────────────────────────────────────────
function OptimizeVendorsMode() {
  const totalSpend = CURRENT_VENDORS.reduce((s, v) => s + v.annualSpend, 0)
  const vendorsWithBreaches = CURRENT_VENDORS.filter(v => v.actualUptime < v.contractedUptime)
  const vendorsRenewing = CURRENT_VENDORS.filter(v => v.isRenewing)
  const vendorsOverMarket = CURRENT_VENDORS.filter(v => v.annualSpend > v.marketRate)
  const vendorsWithOverlap = CURRENT_VENDORS.filter(v => v.hasOverlap)

  const totalCredits = CURRENT_VENDORS.reduce((sum, v) => {
    return sum + calculateSlaCredit(v.annualSpend, v.contractedUptime, v.actualUptime)
  }, 0)

  return (
    <div>
      {/* Portfolio summary */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 24, marginBottom: 24,
      }}>
        <div style={{ fontSize: 14, fontFamily: T.mono, color: T.text, marginBottom: 4 }}>
          CURRENT VENDOR PORTFOLIO · MERIDIAN
        </div>
        <div style={{ fontSize: 20, fontFamily: T.fraunces, color: T.teal, marginBottom: 20 }}>
          ${(totalSpend / 1e6).toFixed(0)}M annual vendor spend · {CURRENT_VENDORS.length + 42} active contracts
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { color: T.green, count: CURRENT_VENDORS.filter(v => v.actualUptime >= v.contractedUptime && !v.isRenewing).length, label: 'vendors: meeting SLA', note: 'No action needed' },
            { color: T.amber, count: vendorsWithBreaches.length, label: 'vendors: SLA breach', note: `$${(totalCredits / 1e6).toFixed(1)}M credits available NOW` },
            { color: T.teal, count: vendorsRenewing.length, label: 'vendors: renewing in 90 days', note: 'Negotiate now' },
            { color: '#6366F1', count: vendorsWithOverlap.length, label: 'vendors: capability overlap', note: 'Consolidation possible' },
            { color: T.red, count: vendorsOverMarket.length, label: 'vendors: above market rate', note: 'Renegotiate' },
          ].map(({ color, count, label, note }) => (
            <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 3, display: 'inline-block' }} />
              <div>
                <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>{count} {label}</span>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>{note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor performance cards */}
      {CURRENT_VENDORS.map(vendor => {
        const credit = calculateSlaCredit(vendor.annualSpend, vendor.contractedUptime, vendor.actualUptime)
        const overpaying = vendor.annualSpend > vendor.marketRate ? vendor.annualSpend - vendor.marketRate : 0
        const hasBreach = vendor.actualUptime < vendor.contractedUptime

        return (
          <div
            key={vendor.name}
            style={{
              background: T.surface,
              border: `1px solid ${hasBreach ? T.amber : T.border}`,
              borderRadius: 10, padding: 20, marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontFamily: T.sans, fontWeight: 700, color: T.text }}>{vendor.name}</div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 2 }}>
                  Annual spend: ${(vendor.annualSpend / 1e6).toFixed(1)}M · Contract end: {vendor.contractEnd}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {vendor.isRenewing && (
                  <div style={{
                    fontSize: 9, fontFamily: T.mono, padding: '2px 8px',
                    background: 'rgba(45,212,200,0.1)', border: `1px solid ${T.teal}`,
                    color: T.teal, borderRadius: 4,
                  }}>RENEWING SOON</div>
                )}
                {hasBreach && (
                  <div style={{
                    fontSize: 9, fontFamily: T.mono, padding: '2px 8px',
                    background: 'rgba(245,158,11,0.1)', border: `1px solid ${T.amber}`,
                    color: T.secondary, borderRadius: 4,
                  }}>SLA BREACH</div>
                )}
              </div>
            </div>

            {/* Intelligence note */}
            {'note' in vendor && vendor.note && (
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 14, lineHeight: 1.6, padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 6, borderLeft: `2px solid ${T.amber}` }}>
                ⚑ {vendor.note}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {/* SLA Performance */}
              {hasBreach && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>SLA PERFORMANCE</div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.text, lineHeight: 1.8 }}>
                    Contracted: {vendor.contractedUptime}% uptime<br />
                    Actual: {vendor.actualUptime}% uptime<br />
                    Gap: {(vendor.contractedUptime - vendor.actualUptime).toFixed(1)}pp<br />
                    Credits owed: ${(credit / 1e6).toFixed(2)}M (NOT YET CLAIMED)
                  </div>
                </div>
              )}

              {/* Market rate */}
              {overpaying > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>MARKET RATE DELTA</div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.text, lineHeight: 1.8 }}>
                    Your rate: ${(vendor.annualSpend / 1e6).toFixed(1)}M/year<br />
                    Market median: ${(vendor.marketRate / 1e6).toFixed(1)}M/year<br />
                    Overpaying: ~${(overpaying / 1e6).toFixed(1)}M/year
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 16 }}>
              {hasBreach && credit > 0 && (
                <button style={{ fontSize: 11, fontFamily: T.mono, padding: '6px 14px', background: T.teal, color: T.bg, border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  Claim ${(credit / 1e6).toFixed(1)}M SLA credit →
                </button>
              )}
              {overpaying > 0 && (
                <button style={{ fontSize: 11, fontFamily: T.mono, padding: '6px 14px', background: 'transparent', border: `1px solid ${T.teal}`, color: T.teal, borderRadius: 6, cursor: 'pointer' }}>
                  Negotiation brief →
                </button>
              )}
              {vendor.hasOverlap && (
                <button style={{ fontSize: 11, fontFamily: T.mono, padding: '6px 14px', background: 'transparent', border: `1px solid #6366F1`, color: '#6366F1', borderRadius: 6, cursor: 'pointer' }}>
                  Consolidation analysis →
                </button>
              )}
              {vendor.isRenewing && (
                <button style={{ fontSize: 11, fontFamily: T.mono, padding: '6px 14px', background: 'rgba(45,212,200,0.08)', border: `1px solid ${T.teal}40`, color: T.teal, borderRadius: 6, cursor: 'pointer' }}>
                  Renewal strategy →
                </button>
              )}
              <button style={{ fontSize: 11, fontFamily: T.mono, padding: '6px 14px', background: 'transparent', border: `1px solid ${T.border}`, color: T.secondary, borderRadius: 6, cursor: 'pointer' }}>
                Initiate RFP →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page content ─────────────────────────────────────────────────────────
function VendorIntelligenceContent() {
  const searchParams = useSearchParams()
  const clientParam = (searchParams.get('client') as Client) || 'meridian'
  const [client, setClient] = useState<Client>(clientParam)
  const [mode, setMode] = useState<Mode>('optimize')
  const [showClientMenu, setShowClientMenu] = useState(false)

  // Score vendors for display
  const scoredVendors = MERIDIAN_RCM_VENDORS.map(v => ({
    ...v,
    fitScore: scoreVendorFit(
      { epicNative: v.epicNative, azureNative: v.azureNative, outcomeRate: v.outcomeRate, avgComplexity: v.complexityScore },
      meridianProfile
    ),
  }))
  const topVendorCount = scoredVendors.filter(v => v.color !== 'gray').length

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.text,
      fontFamily: T.sans,
    }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` }} />

      <AbarvaNav activePage="select" />

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        padding: '20px 32px',
        position: 'sticky', top: 0, zIndex: 10,
        background: T.bg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, letterSpacing: '0.12em', marginBottom: 4 }}>
              VENDOR INTELLIGENCE
            </div>
            <div style={{ fontSize: 20, fontFamily: T.fraunces, color: T.text, maxWidth: 560 }}>
              &ldquo;Which vendor should we choose — and what does the contract need to say?&rdquo;
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 8 }}>
              Vendors assessed: 47 &nbsp;·&nbsp; Genome matches: {topVendorCount} &nbsp;·&nbsp; Confidence: 87%
            </div>
          </div>
          {/* Client selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowClientMenu(m => !m)}
              style={{
                padding: '8px 16px',
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: T.mono,
              }}
            >
              {CLIENT_LABELS[client]} ▾
            </button>
            {showClientMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 8, overflow: 'hidden', zIndex: 20, minWidth: 180,
              }}>
                {CLIENTS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setClient(c); setShowClientMenu(false) }}
                    style={{
                      width: '100%', padding: '10px 16px',
                      background: c === client ? 'rgba(45,212,200,0.1)' : 'transparent',
                      color: c === client ? T.teal : T.text,
                      border: 'none', cursor: 'pointer',
                      fontSize: 13, fontFamily: T.mono,
                      textAlign: 'left',
                    }}
                  >
                    {CLIENT_LABELS[c]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {(['select', 'optimize'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '8px 20px',
                background: mode === m ? T.teal : 'transparent',
                color: mode === m ? T.bg : T.secondary,
                border: `1px solid ${mode === m ? T.teal : T.border}`,
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: T.mono,
              }}
            >
              {m === 'select' ? 'Select a Vendor' : 'Optimize Current Vendors'}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 48px 64px' }}>
        <div style={{ animation: 'fadein 0.3s ease-out' }}>
          {mode === 'select' ? <SelectVendorMode /> : <OptimizeVendorsMode />}
        </div>
      </div>
    </div>
  )
}

export default function VendorIntelligencePage() {
  return (
    <Suspense>
      <VendorIntelligenceContent />
    </Suspense>
  )
}
