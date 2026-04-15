'use client'
import { Suspense, useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'

// ─── Types ────────────────────────────────────────────────────────────────────
type SI = 'traditional' | 'huronavanade' | 'internal'
interface Risk { sev: 'red' | 'amber'; msg: string }
interface ScenData { value: number; investment: number; roi: number; payback: number; fee: number }
interface Out {
  totalValue: number; abarvaFee: number; netValue: number; payback: number
  investment: number; roi: number
  scenarios: { conservative: ScenData; base: ScenData; optimistic: ScenData }
  risks: Risk[]; highestROI: string
}

interface MI {
  cdoHired: boolean; ensemblePenalties: boolean; cohereContracted: boolean
  synapseCompletionDays: number; priorAuthMonths: number; cdoHireDays: number
  wave1Investment: number; siSelection: SI
  denialRateTarget: number; priorAuthFTEReduction: number
}
interface ARC {
  cdoAppointed: boolean; croFramework: boolean; fscActivated: boolean; bloombergModernized: boolean
  cdoHireWeeks: number; fscAdoptionTarget: number
  wave1Investment: number; siSelection: SI
}
interface APXI {
  segmentFixed: boolean; einsteinActivated: boolean; sapDecisionMade: boolean
  cartAbandonmentTarget: number; loyaltyActiveTarget: number
  wave1Investment: number; siSelection: SI
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SI_COST: Record<SI, number> = { traditional: 9.0, huronavanade: 4.2, internal: 1.8 }

const M_DEF: MI = {
  cdoHired: false, ensemblePenalties: false, cohereContracted: false,
  synapseCompletionDays: 90, priorAuthMonths: 6, cdoHireDays: 90,
  wave1Investment: 4.2, siSelection: 'huronavanade',
  denialRateTarget: 12, priorAuthFTEReduction: 11,
}
const ARC_DEF: ARC = {
  cdoAppointed: false, croFramework: false, fscActivated: false, bloombergModernized: false,
  cdoHireWeeks: 12, fscAdoptionTarget: 75,
  wave1Investment: 3.8, siSelection: 'huronavanade',
}
const APX_DEF: APXI = {
  segmentFixed: false, einsteinActivated: false, sapDecisionMade: false,
  cartAbandonmentTarget: 62, loyaltyActiveTarget: 55,
  wave1Investment: 5.8, siSelection: 'huronavanade',
}

// ─── Calculation engines ──────────────────────────────────────────────────────
function mkScen(v: number, i: number): ScenData {
  return { value: v, investment: i, roi: i > 0 ? v / i : 0, payback: v > 0 ? i / (v / 12) : 0, fee: v * 0.15 }
}

function calcMeridian(inp: MI): Out {
  const denialValue = Math.max(0, 18.2 - inp.denialRateTarget) * 6.4
  const priorAuthValue = inp.cohereContracted ? Math.max(0, 28 * (12 - inp.priorAuthMonths) / 12) : 0
  const fteValue = inp.priorAuthFTEReduction * 0.142
  const cdoValue = inp.cdoHired ? 48 : 0
  const ensembleValue = inp.ensemblePenalties ? 8 : 0
  const synapsePenalty = Math.max(0, (inp.synapseCompletionDays - 90) / 7) * 0.8
  const totalValue = Math.max(0, denialValue + priorAuthValue + fteValue + cdoValue + ensembleValue - synapsePenalty)
  const investment = inp.wave1Investment + SI_COST[inp.siSelection]
  const abarvaFee = totalValue * 0.15
  const netValue = totalValue - abarvaFee - investment
  const payback = totalValue > 0 ? investment / (totalValue / 12) : 0
  const roi = investment > 0 ? totalValue / investment : 0

  const risks: Risk[] = []
  if (!inp.cdoHired) risks.push({ sev: 'red', msg: 'CDO vacancy blocks 6 initiatives — $292M at risk · $5.6M per week delayed' })
  if (!inp.ensemblePenalties) risks.push({ sev: 'amber', msg: 'Losing negotiation leverage — $8M in penalties uncollected' })
  if (!inp.cohereContracted) {
    const excess = Math.max(0, inp.priorAuthMonths * 30 - 270)
    risks.push({ sev: 'red', msg: `CMS deadline: 270 days remaining — ~$${Math.round(excess * 0.77)}M penalty exposure if Cohere not contracted` })
  }
  if (inp.synapseCompletionDays > 120) {
    const wks = Math.floor((inp.synapseCompletionDays - 120) / 7)
    risks.push({ sev: 'red', msg: `AI model deployment blocked — ${wks} extra weeks = $${(wks * 0.8).toFixed(1)}M delayed` })
  }
  if (inp.siSelection === 'traditional') risks.push({ sev: 'amber', msg: 'Traditional SI rate: $320–420/hr. Same work, 2x cost. ROI drops from 6.7x to 4.2x.' })

  let highestROI = 'Hire a CDO this week. $5.6M in value per week of delay. Every other decision depends on this one.'
  if (inp.cdoHired && !inp.ensemblePenalties) highestROI = 'Enforce Ensemble SLA penalties. $8M in 30 days. Zero implementation cost.'
  if (inp.cdoHired && inp.ensemblePenalties && !inp.cohereContracted) highestROI = 'Contract Cohere Health this quarter. CMS compliance + $28M prior auth value. 6-month payback.'
  if (inp.cdoHired && inp.ensemblePenalties && inp.cohereContracted) highestROI = 'Complete Azure Synapse. Every week of delay is $800K in blocked AI value across a $292M pipeline.'

  return {
    totalValue, abarvaFee, netValue, payback, investment, roi,
    scenarios: { conservative: mkScen(totalValue * 0.6, investment * 1.1), base: mkScen(totalValue, investment), optimistic: mkScen(totalValue * 1.3, investment * 0.9) },
    risks, highestROI,
  }
}

function calcArcturus(inp: ARC): Out {
  const cdoValue = inp.cdoAppointed ? 94 : 0                           // golden record + all 6 data-blocked initiatives
  const croValue = inp.croFramework ? 101 : 0                          // CRO model freeze lifted
  const fscValue = inp.fscActivated ? Math.round((inp.fscAdoptionTarget - 44) / 56 * 65) : 0  // advisor AI + churn signals
  const bloombergValue = inp.bloombergModernized ? 32 : 0              // real-time reporting + AI reporting unblocked
  const vacancyCost = inp.cdoAppointed ? Math.min(inp.cdoHireWeeks * 5.6, 134) : 134  // weeks × $5.6M/wk cap
  const totalValue = Math.max(0, cdoValue + croValue + fscValue + bloombergValue - (inp.cdoAppointed ? 0 : vacancyCost * 0.1))
  const investment = inp.wave1Investment + SI_COST[inp.siSelection]
  const abarvaFee = totalValue * 0.15
  const netValue = totalValue - abarvaFee - investment
  const payback = totalValue > 0 ? investment / (totalValue / 12) : 0
  const roi = investment > 0 ? totalValue / investment : 0

  const risks: Risk[] = []
  if (!inp.cdoAppointed) risks.push({ sev: 'red', msg: `CDO vacant — 14 data silos, no golden record · $${(inp.cdoHireWeeks * 5.6).toFixed(0)}M vacancy cost at ${inp.cdoHireWeeks}wk hire timeline` })
  if (!inp.croFramework) risks.push({ sev: 'red', msg: 'CRO model freeze — Credit Risk AI ($34M) and 3 others blocked · validation framework needed to lift' })
  if (!inp.fscActivated) risks.push({ sev: 'amber', msg: `FSC 44% adoption — Salesforce Einstein never activated · ${inp.fscAdoptionTarget - 44}pt target gap = $${fscValue}M value blocked` })
  if (!inp.bloombergModernized) risks.push({ sev: 'amber', msg: 'Bloomberg legacy API + Advent Geneva 3-day batch lag — AI reporting impossible until modernized' })
  if (inp.siSelection === 'traditional') risks.push({ sev: 'amber', msg: 'Traditional SI: $320–420/hr. Same work, 2× cost. ROI drops from 6.2× to 3.8×.' })

  let highestROI = 'Appoint a CDO this quarter. $5.6M in AI value per week of vacancy. Every other initiative depends on this one.'
  if (inp.cdoAppointed && !inp.croFramework) highestROI = 'Establish CRO model validation framework. Lifts the freeze on $101M in committed AI value — 4 initiatives can go live immediately.'
  if (inp.cdoAppointed && inp.croFramework && !inp.fscActivated) highestROI = `Fix FSC SSO and activate Salesforce Einstein. Adoption at ${inp.fscAdoptionTarget}% = $${fscValue}M advisor AI value. 6-week implementation.`
  if (inp.cdoAppointed && inp.croFramework && inp.fscActivated) highestROI = 'Modernize Bloomberg API. Advent Geneva replacement unblocks real-time AI reporting — $32M value and board-facing dashboards.'

  return {
    totalValue, abarvaFee, netValue, payback, investment, roi,
    scenarios: { conservative: mkScen(totalValue * 0.6, investment * 1.1), base: mkScen(totalValue, investment), optimistic: mkScen(totalValue * 1.3, investment * 0.9) },
    risks, highestROI,
  }
}

function calcApex(inp: APXI): Out {
  const einsteinValue = inp.einsteinActivated && inp.segmentFixed ? 248 : inp.einsteinActivated ? 80 : 0
  const demandValue = 180
  const cartValue = Math.max(0, 72 - inp.cartAbandonmentTarget) * 46.7
  const loyaltyValue = Math.max(0, inp.loyaltyActiveTarget - 42) * 23.7
  const sapValue = inp.sapDecisionMade ? 24 : 0
  const totalValue = Math.max(0, einsteinValue + demandValue + cartValue + loyaltyValue + sapValue)
  const investment = inp.wave1Investment + SI_COST[inp.siSelection]
  const abarvaFee = totalValue * 0.15
  const netValue = totalValue - abarvaFee - investment
  const payback = totalValue > 0 ? investment / (totalValue / 12) : 0
  const roi = investment > 0 ? totalValue / investment : 0

  const risks: Risk[] = []
  if (!inp.segmentFixed) risks.push({ sev: 'red', msg: '50% profile fragmentation in Segment CDP — Einstein activation blocked until resolved' })
  if (!inp.einsteinActivated) risks.push({ sev: 'amber', msg: 'Einstein purchased, never activated — $248M annual value idle in a paid license' })
  if (!inp.sapDecisionMade) risks.push({ sev: 'red', msg: 'SAP ECC support ends 2027 — board decision overdue Q3 2024 — migration runway compressing monthly' })
  if (inp.siSelection === 'traditional') risks.push({ sev: 'amber', msg: 'Traditional SI rate: $320–420/hr. Same work, 2x cost.' })

  let highestROI = 'Fix Segment CDP profile fragmentation first. Until customer identity is unified, Einstein cannot be activated and $248M stays blocked.'
  if (inp.segmentFixed && !inp.einsteinActivated) highestROI = 'Activate Einstein personalization. 6-week implementation. $248M annual revenue at full attribution.'
  if (inp.segmentFixed && inp.einsteinActivated) highestROI = 'Make the SAP decision. Every month of delay compresses the migration timeline with the same complexity and less runway.'

  return {
    totalValue, abarvaFee, netValue, payback, investment, roi,
    scenarios: { conservative: mkScen(totalValue * 0.6, investment * 1.1), base: mkScen(totalValue, investment), optimistic: mkScen(totalValue * 1.3, investment * 0.9) },
    risks, highestROI,
  }
}

// ─── Shared UI components ─────────────────────────────────────────────────────
const SLBL: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '11px', color: value ? '#059669' : '#94A3B8', transition: 'color 0.2s' }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: value ? '#2563EB' : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

function Slider({ label, min, max, step = 1, value, onChange, fmt, hint }: {
  label: string; min: number; max: number; step?: number; value: number
  onChange: (v: number) => void; fmt: (v: number) => string; hint: string
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{label}</label>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }} />
      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>{hint}</div>
    </div>
  )
}

function RadioGroup({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: Array<{ id: string; label: string; cost: string; warn?: true }>
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>{label}</div>
      {options.map(o => (
        <div key={o.id} onClick={() => onChange(o.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '5px', background: value === o.id ? '#EFF6FF' : '#F8FAFC', border: '1px solid ' + (value === o.id ? '#2563EB' : '#E2E8F0'), transition: 'all 0.15s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid ' + (value === o.id ? '#2563EB' : '#CBD5E1'), background: value === o.id ? '#2563EB' : 'transparent', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A' }}>{o.label}</span>
            {o.warn && <span style={{ fontSize: '9px', fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '1px 5px', borderRadius: '4px' }}>2× cost</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: value === o.id ? '#2563EB' : '#64748B', fontFamily: "'IBM Plex Mono', monospace" }}>{o.cost}</span>
        </div>
      ))}
    </div>
  )
}

function BigMetric({ label, value, sub, color, flashGen, id }: { label: string; value: string; sub?: string; color: string; flashGen: number; id: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 18px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
      <div key={`${id}-${flashGen}`} className="numflash" style={{ fontSize: '26px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function ScenCol({ label, data, color, flashGen, id }: { label: string; data: ScenData; color: string; flashGen: number; id: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', flex: 1 }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>{label}</div>
      {([
        { k: 'val', l: 'Value', v: `$${data.value.toFixed(1)}M` },
        { k: 'inv', l: 'Investment', v: `$${data.investment.toFixed(1)}M` },
        { k: 'roi', l: 'ROI', v: `${data.roi.toFixed(1)}x` },
        { k: 'pay', l: 'Payback', v: `${data.payback.toFixed(1)} mo` },
        { k: 'fee', l: 'AbarVa fee', v: `$${data.fee.toFixed(1)}M` },
      ] as const).map(r => (
        <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>{r.l}</span>
          <span key={`${id}-${r.k}-${flashGen}`} className="numflash" style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', fontFamily: "'IBM Plex Mono', monospace" }}>{r.v}</span>
        </div>
      ))}
    </div>
  )
}

function RiskBadge({ sev, msg }: { sev: 'red' | 'amber'; msg: string }) {
  const red = sev === 'red'
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '9px 12px', borderRadius: '8px', marginBottom: '7px', background: red ? '#FEF2F2' : '#FFFBEB', border: '1px solid ' + (red ? '#FECACA' : '#FDE68A') }}>
      <span style={{ color: red ? '#DC2626' : '#D97706', fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{red ? '⚠' : '△'}</span>
      <span style={{ fontSize: '11px', color: '#374151', lineHeight: 1.5 }}>{msg}</span>
    </div>
  )
}

// ─── Client input panels ──────────────────────────────────────────────────────
function MeridianPanel({ inp, setInp, onFlash }: { inp: MI; setInp: (v: MI) => void; onFlash: () => void }) {
  const set = (k: keyof MI, v: unknown) => { setInp({ ...inp, [k]: v }); onFlash() }
  return (
    <div>
      <div style={SLBL}>Leadership Decisions</div>
      <Toggle label="CDO hired within 30 days" desc="Unblocks 6 initiatives · $48M value" value={inp.cdoHired} onChange={v => set('cdoHired', v)} />
      <Toggle label="Ensemble penalties enforced" desc="$8M immediate recovery · negotiation leverage" value={inp.ensemblePenalties} onChange={v => set('ensemblePenalties', v)} />
      <Toggle label="Cohere Health contracted this quarter" desc="CMS compliance path · $28M prior auth value" value={inp.cohereContracted} onChange={v => set('cohereContracted', v)} />
      <div style={{ marginBottom: '4px' }} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Timeline</div>
      <Slider label="Azure Synapse completion" min={30} max={180} value={inp.synapseCompletionDays} onChange={v => set('synapseCompletionDays', v)} fmt={v => `${v} days`} hint={`Each week beyond 90 days = $800K blocked value · ${Math.max(0, Math.floor((inp.synapseCompletionDays - 90) / 7))} weeks over baseline`} />
      <Slider label="Prior auth go-live" min={3} max={12} value={inp.priorAuthMonths} onChange={v => set('priorAuthMonths', v)} fmt={v => `${v} months`} hint={`Year 1 prior auth value: $${Math.max(0, 28 * (12 - inp.priorAuthMonths) / 12).toFixed(1)}M · CMS deadline at 270 days`} />
      <Slider label="CDO hire timeline" min={30} max={180} step={7} value={inp.cdoHireDays} onChange={v => set('cdoHireDays', v)} fmt={v => `${v} days`} hint={`$${((inp.cdoHireDays / 7) * 5.6).toFixed(1)}M total vacancy cost at this timeline`} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Investment</div>
      <Slider label="Wave 1 investment" min={2} max={8} step={0.1} value={inp.wave1Investment} onChange={v => set('wave1Investment', v)} fmt={v => `$${v.toFixed(1)}M`} hint="Platform foundation + implementation" />
      <RadioGroup label="System Integrator" value={inp.siSelection} onChange={v => set('siSelection', v as SI)} options={[
        { id: 'traditional', label: 'Traditional SI', cost: '$9.0M', warn: true },
        { id: 'huronavanade', label: 'Huron + Avanade', cost: '$4.2M' },
        { id: 'internal', label: 'Internal only', cost: '$1.8M' },
      ]} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Outcome Targets</div>
      <Slider label="Denial rate target" min={10} max={18} step={0.5} value={inp.denialRateTarget} onChange={v => set('denialRateTarget', v)} fmt={v => `${v}%`} hint={`${Math.max(0, 18.2 - inp.denialRateTarget).toFixed(1)} point improvement = $${Math.max(0, (18.2 - inp.denialRateTarget) * 6.4).toFixed(1)}M annual value`} />
      <Slider label="Prior auth FTE reduction" min={0} max={14} value={inp.priorAuthFTEReduction} onChange={v => set('priorAuthFTEReduction', v)} fmt={v => `${v} FTE`} hint={`$${(inp.priorAuthFTEReduction * 0.142).toFixed(1)}M annual savings`} />
    </div>
  )
}

function ArcturusPanel({ inp, setInp, onFlash }: { inp: ARC; setInp: (v: ARC) => void; onFlash: () => void }) {
  const set = (k: keyof ARC, v: unknown) => { setInp({ ...inp, [k]: v }); onFlash() }
  return (
    <div>
      <div style={SLBL}>Leadership Decisions</div>
      <Toggle label="CDO appointed" desc="Unblocks golden record · all 6 data initiatives · $94M value" value={inp.cdoAppointed} onChange={v => set('cdoAppointed', v)} />
      <Toggle label="CRO model validation framework" desc="Lifts freeze · Credit Risk AI + 3 others can go live" value={inp.croFramework} onChange={v => set('croFramework', v)} />
      <Toggle label="FSC SSO fixed + Einstein activated" desc="Advisor AI + churn signals · $65M value at full adoption" value={inp.fscActivated} onChange={v => set('fscActivated', v)} />
      <Toggle label="Bloomberg API modernized" desc="Real-time data · Advent Geneva replacement · $32M reporting" value={inp.bloombergModernized} onChange={v => set('bloombergModernized', v)} />
      <div style={{ marginBottom: '4px' }} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Timeline</div>
      <Slider label="CDO hire timeline" min={4} max={24} step={2} value={inp.cdoHireWeeks} onChange={v => set('cdoHireWeeks', v)} fmt={v => `${v} weeks`} hint={`Vacancy cost: $${(inp.cdoHireWeeks * 5.6).toFixed(0)}M · $5.6M per week of delay`} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Investment</div>
      <Slider label="Wave 1 investment" min={2} max={8} step={0.2} value={inp.wave1Investment} onChange={v => set('wave1Investment', v)} fmt={v => `$${v.toFixed(1)}M`} hint="CDO onboarding + data platform + FSC activation" />
      <RadioGroup label="System Integrator" value={inp.siSelection} onChange={v => set('siSelection', v as SI)} options={[
        { id: 'traditional', label: 'Traditional SI', cost: '$9.0M', warn: true },
        { id: 'huronavanade', label: 'Huron + Avanade', cost: '$4.2M' },
        { id: 'internal', label: 'Internal only', cost: '$1.8M' },
      ]} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Outcome Targets</div>
      <Slider label="FSC adoption target" min={50} max={95} value={inp.fscAdoptionTarget} onChange={v => set('fscAdoptionTarget', v)} fmt={v => `${v}%`} hint={`${inp.fscAdoptionTarget - 44}pt above current 44% = $${Math.round((inp.fscAdoptionTarget - 44) / 56 * 65)}M advisor AI value`} />
    </div>
  )
}

function ApexPanel({ inp, setInp, onFlash }: { inp: APXI; setInp: (v: APXI) => void; onFlash: () => void }) {
  const set = (k: keyof APXI, v: unknown) => { setInp({ ...inp, [k]: v }); onFlash() }
  return (
    <div>
      <div style={SLBL}>Leadership Decisions</div>
      <Toggle label="Segment CDP profiles fixed" desc="Identity resolution complete · Einstein unblocked" value={inp.segmentFixed} onChange={v => set('segmentFixed', v)} />
      <Toggle label="Einstein personalization activated" desc="6-week implementation · $248M revenue value" value={inp.einsteinActivated} onChange={v => set('einsteinActivated', v)} />
      <Toggle label="SAP modernization decision made" desc="S/4HANA migration plan approved" value={inp.sapDecisionMade} onChange={v => set('sapDecisionMade', v)} />
      <div style={{ marginBottom: '4px' }} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Investment</div>
      <Slider label="Wave 1 investment" min={2} max={10} step={0.2} value={inp.wave1Investment} onChange={v => set('wave1Investment', v)} fmt={v => `$${v.toFixed(1)}M`} hint="Einstein activation + Segment fix + SAP assessment" />
      <RadioGroup label="System Integrator" value={inp.siSelection} onChange={v => set('siSelection', v as SI)} options={[
        { id: 'traditional', label: 'Traditional SI', cost: '$9.0M', warn: true },
        { id: 'huronavanade', label: 'Huron + Avanade', cost: '$4.2M' },
        { id: 'internal', label: 'Internal only', cost: '$1.8M' },
      ]} />

      <div style={{ ...SLBL, marginTop: '20px' }}>Outcome Targets</div>
      <Slider label="Cart abandonment target" min={54} max={72} value={inp.cartAbandonmentTarget} onChange={v => set('cartAbandonmentTarget', v)} fmt={v => `${v}%`} hint={`${(72 - inp.cartAbandonmentTarget)} point improvement = $${((72 - inp.cartAbandonmentTarget) * 46.7).toFixed(0)}M value · current: 72%`} />
      <Slider label="Loyalty active rate target" min={42} max={68} value={inp.loyaltyActiveTarget} onChange={v => set('loyaltyActiveTarget', v)} fmt={v => `${v}%`} hint={`${inp.loyaltyActiveTarget - 42} point improvement = $${((inp.loyaltyActiveTarget - 42) * 23.7).toFixed(0)}M value · current: 42%`} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const CLIENTS = [
  { id: 'meridian',   label: 'Meridian' },
  { id: 'arcturus',   label: 'Arcturus' },
  { id: 'apexretail', label: 'Apex Retail' },
]

const CLIENT_NAMES: Record<string, string> = {
  meridian:   'Meridian Health System',
  arcturus:   'Arcturus Financial Group',
  apexretail: 'Apex Retail Group',
}

function ScenariosContent() {
  const { clientId: ctxClientId, allowedClients } = useClientContext()
  const [clientId, setClientId] = useState(ctxClientId)
  const [mInp, setMInp] = useState<MI>(M_DEF)
  const [arcInp, setArcInp] = useState<ARC>(ARC_DEF)
  const [apxInp, setApxInp] = useState<APXI>(APX_DEF)
  const [flashGen, setFlashGen] = useState(0)
  const flash = () => setFlashGen(g => g + 1)

  const visibleClients = CLIENTS.filter(c => allowedClients.find(a => a.id === c.id))

  const out: Out = clientId === 'arcturus' ? calcArcturus(arcInp)
    : clientId === 'apexretail' ? calcApex(apxInp)
    : calcMeridian(mInp)

  const fmt1 = (n: number) => n.toFixed(1)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer;background:#E2E8F0}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.15);cursor:pointer}
        input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#2563EB;border:none;cursor:pointer}
        @keyframes numflash{0%,20%{background:#FEF3C7;border-radius:3px}100%{background:transparent}}
        .numflash{animation:numflash 0.55s ease-out}
      `}} />
      <AbarvaNav activePage="scenarios" />

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '20px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '2px', letterSpacing: '-0.01em' }}>
            Scenario Modeling — {CLIENT_NAMES[clientId]}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>Change assumptions. See the impact. Make better decisions.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {visibleClients.map(c => (
              <button key={c.id} onClick={() => { setClientId(c.id); flash() }}
                style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: clientId === c.id ? '#2563EB' : '#F1F5F9', color: clientId === c.id ? 'white' : '#475569', transition: 'all 0.15s' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 48px', display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '24px', alignItems: 'start' }}>

        {/* Left: Assumptions */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 22px', position: 'sticky', top: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '18px' }}>Your Assumptions</div>
          {clientId === 'arcturus'
            ? <ArcturusPanel inp={arcInp} setInp={setArcInp} onFlash={flash} />
            : clientId === 'apexretail'
            ? <ApexPanel inp={apxInp} setInp={setApxInp} onFlash={flash} />
            : <MeridianPanel inp={mInp} setInp={setMInp} onFlash={flash} />
          }
        </div>

        {/* Right: Outputs */}
        <div>
          {/* 4 headline metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <BigMetric id="tv" label="Total Year 1 Value" value={`$${fmt1(out.totalValue)}M`} color="#059669" flashGen={flashGen} />
            <BigMetric id="fee" label="AbarVa Outcome Fee" value={`$${fmt1(out.abarvaFee)}M`} sub="15% of realized value" color="#2563EB" flashGen={flashGen} />
            <BigMetric id="net" label="Net Client Value" value={`$${fmt1(out.netValue)}M`} color={out.netValue >= 0 ? '#059669' : '#DC2626'} flashGen={flashGen} />
            <BigMetric id="pay" label="Payback Period" value={out.payback > 0 && out.payback < 200 ? `${fmt1(out.payback)} mo` : 'N/A'} color="#0F172A" flashGen={flashGen} />
          </div>

          {/* 3 scenario columns */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <ScenCol id="con" label="Conservative" data={out.scenarios.conservative} color="#64748B" flashGen={flashGen} />
            <ScenCol id="base" label="Base Case" data={out.scenarios.base} color="#2563EB" flashGen={flashGen} />
            <ScenCol id="opt" label="Optimistic" data={out.scenarios.optimistic} color="#059669" flashGen={flashGen} />
          </div>

          {/* Risk indicators */}
          {out.risks.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>Risk Indicators</div>
              {out.risks.map((r, i) => <RiskBadge key={i} sev={r.sev} msg={r.msg} />)}
            </div>
          )}

          {/* Highest ROI decision */}
          <div style={{ background: '#0F172A', borderRadius: '12px', padding: '22px 24px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '10px', fontFamily: "'IBM Plex Mono', monospace" }}>The Highest ROI Decision</div>
            <div key={`roi-${flashGen}`} style={{ fontSize: '14px', color: '#E6EDF3', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{out.highestROI}"
            </div>
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
              <a href={`/blueprint?client=${clientId}`} style={{ fontSize: '12px', fontWeight: 600, color: '#2DD4C8', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', background: 'rgba(45,212,200,0.1)', border: '1px solid rgba(45,212,200,0.25)' }}>Solution Blueprint →</a>
              <a href={`/justify?client=${clientId}`} style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Build Business Case →</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <ScenariosContent />
    </Suspense>
  )
}
