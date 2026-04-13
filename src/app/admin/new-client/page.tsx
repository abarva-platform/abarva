'use client'
import { useState } from 'react'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', green: '#6EE7B7', amber: '#F59E0B', red: '#EF4444',
}

const STEPS = [
  { id: 1, label: 'Org Identity' },
  { id: 2, label: 'Data Loading' },
  { id: 3, label: 'Team Access' },
  { id: 4, label: 'Engagement Scope' },
  { id: 5, label: 'Launch' },
]

const VERTICALS = ['Healthcare', 'Financial Services', 'Retail', 'Manufacturing', 'Technology', 'Government', 'Other']
const SIZES = ['$1B–5B Revenue', '$5B–15B Revenue', '$15B–50B Revenue', '$50B+ Revenue']
const CATEGORIES = ['Financial Performance', 'Technology Inventory', 'Leadership Profiles', 'Vendor Contracts', 'Clinical / Operations Data', 'Competitive Intelligence', 'Customer / Market Data', 'Regulatory Filings']
const SOLUTIONS = ['Situation Intelligence', 'AI Investment Intelligence', 'Business Case Intelligence', 'Vendor Intelligence', 'Outcome Intelligence', 'Delivery Intelligence', 'Workforce Intelligence', 'Data Estate Intelligence', 'Procurement Intelligence']
const ROLES = ['CIO', 'CFO', 'COO', 'CMIO', 'CMO', 'CEO', 'CDO', 'CRO']

const STANDARD_METRICS: Record<string, Array<{ metric: string; source: string }>> = {
  Healthcare: [
    { metric: 'RCM Denial Rate (%)', source: 'RCM vendor monthly report' },
    { metric: 'Prior Auth Approval Time (days)', source: 'Epic scheduling data' },
    { metric: 'Operating Margin (%)', source: 'Finance ERP / CFO report' },
    { metric: 'Travel Nurse FTE Count', source: 'Kronos / HR system' },
    { metric: 'AI Pilot Count (stuck or scaled)', source: 'IT project tracker' },
  ],
  'Financial Services': [
    { metric: 'Core System Downtime (hours/month)', source: 'IT operations log' },
    { metric: 'Manual Processing Rate (%)', source: 'Operations team survey' },
    { metric: 'Cost per Transaction ($)', source: 'Finance ERP' },
    { metric: 'Compliance Gap Count', source: 'Risk management system' },
    { metric: 'Time to Market — New Product (weeks)', source: 'PMO tracker' },
  ],
  Retail: [
    { metric: 'Loyalty Active Rate (%)', source: 'CRM / CDP platform' },
    { metric: 'Inventory Out-of-Stock Rate (%)', source: 'POS / WMS system' },
    { metric: 'Same-Day Fulfillment Rate (%)', source: 'Order management system' },
    { metric: 'Marketing Personalization Score', source: 'Email platform analytics' },
    { metric: 'Cart Abandonment Rate (%)', source: 'e-commerce analytics' },
  ],
  Manufacturing: [
    { metric: 'OEE (Overall Equipment Effectiveness, %)', source: 'MES / SCADA system' },
    { metric: 'Unplanned Downtime (hours/month)', source: 'Maintenance system' },
    { metric: 'Defect Rate (PPM)', source: 'Quality management system' },
    { metric: 'Supply Chain On-Time Delivery (%)', source: 'ERP / SCM system' },
    { metric: 'Energy Cost per Unit ($)', source: 'Utilities / ERP' },
  ],
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#161B22', border: '1px solid #30363D',
  borderRadius: '8px', fontSize: '14px', color: '#E6EDF3', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
}

export default function NewClientWizard() {
  const [step, setStep] = useState(1)
  const [org, setOrg] = useState({ name: '', vertical: '', size: '', hq: '' })
  const [categories, setCategories] = useState<string[]>([])
  const [team, setTeam] = useState([{ email: '', role: 'CIO', access: 'Full' }])
  const [solutions, setSolutions] = useState<string[]>([])
  const [baselines, setBaselines] = useState([{ metric: '', current: '', target: '' }])

  const canNext =
    step === 1 ? (org.name && org.vertical && org.size) :
    step === 2 ? categories.length > 0 :
    step === 3 ? team.some(t => t.email) :
    step === 4 ? solutions.length > 0 :
    true

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <a href="/admin" style={{ fontSize: '13px', color: T.text3, textDecoration: 'none', marginBottom: '4px', display: 'block' }}>← Engagement Hub</a>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>New Engagement</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {STEPS.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => step > s.id && setStep(s.id)}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: step === s.id ? T.teal : step > s.id ? T.green : T.border2, color: step >= s.id ? '#0D1117' : T.text3 }}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span style={{ fontSize: '12px', color: step === s.id ? T.teal : T.text3, display: 'none' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Step {step} of 5 — {STEPS[step-1].label}</div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: T.text2, display: 'block', marginBottom: '8px' }}>Organization Name *</label>
              <input style={inputStyle} placeholder="e.g., Memorial Health System" value={org.name} onChange={e => setOrg(o => ({ ...o, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: T.text2, display: 'block', marginBottom: '8px' }}>Industry Vertical *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {VERTICALS.map(v => (
                  <button key={v} onClick={() => setOrg(o => ({ ...o, vertical: v }))} style={{ padding: '8px', background: org.vertical === v ? T.teal : T.surface2, color: org.vertical === v ? '#0D1117' : T.text3, border: '1px solid ' + (org.vertical === v ? T.teal : T.border2), borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: T.text2, display: 'block', marginBottom: '8px' }}>Organization Size *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {SIZES.map(s => (
                  <button key={s} onClick={() => setOrg(o => ({ ...o, size: s }))} style={{ padding: '10px', background: org.size === s ? T.teal : T.surface2, color: org.size === s ? '#0D1117' : T.text3, border: '1px solid ' + (org.size === s ? T.teal : T.border2), borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: T.text2, display: 'block', marginBottom: '8px' }}>HQ / Primary Geography</label>
              <input style={inputStyle} placeholder="e.g., Charlotte, NC" value={org.hq} onChange={e => setOrg(o => ({ ...o, hq: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '14px', color: T.text3, marginBottom: '20px' }}>Select the data categories you will load for this engagement. Each category enables specific intelligence products.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategories(c => c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat])} style={{ padding: '12px 16px', background: categories.includes(cat) ? T.teal + '20' : T.surface2, color: categories.includes(cat) ? T.teal : T.text3, border: '1px solid ' + (categories.includes(cat) ? T.teal : T.border2), borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
                  <span>{categories.includes(cat) ? '✓' : '○'}</span>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '8px', padding: '16px', fontSize: '13px', color: T.text3 }}>
              <strong style={{ color: T.text }}>{categories.length} categories selected.</strong> AbarVa will generate intelligence from your uploaded files. Templates are available for each category.
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '14px', color: T.text3, marginBottom: '20px' }}>Invite the client team. Each person will see intelligence filtered to their role&apos;s access level.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {team.map((member, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center' }}>
                  <input style={inputStyle} placeholder="email@org.com" value={member.email} onChange={e => setTeam(t => t.map((m, mi) => mi === i ? { ...m, email: e.target.value } : m))} />
                  <select value={member.role} onChange={e => setTeam(t => t.map((m, mi) => mi === i ? { ...m, role: e.target.value } : m))} style={{ ...inputStyle, width: 'auto', padding: '10px 8px' }}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {team.length > 1 && <button onClick={() => setTeam(t => t.filter((_, mi) => mi !== i))} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: '16px' }}>×</button>}
                </div>
              ))}
            </div>
            <button onClick={() => setTeam(t => [...t, { email: '', role: 'CIO', access: 'Full' }])} style={{ background: 'none', border: '1px dashed ' + T.border2, borderRadius: '8px', color: T.text3, padding: '10px 16px', cursor: 'pointer', fontSize: '13px', width: '100%', fontFamily: 'inherit' }}>+ Add team member</button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: T.text2, display: 'block', marginBottom: '12px' }}>Licensed Solutions *</label>
              <p style={{ fontSize: '13px', color: T.text3, marginBottom: '12px' }}>Design partner license ($500–750K) includes all solutions. Select the initial scope for this engagement.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {SOLUTIONS.map(s => (
                  <button key={s} onClick={() => setSolutions(sl => sl.includes(s) ? sl.filter(x => x !== s) : [...sl, s])} style={{ padding: '10px', background: solutions.includes(s) ? T.teal + '20' : T.surface2, color: solutions.includes(s) ? T.teal : T.text3, border: '1px solid ' + (solutions.includes(s) ? T.teal : T.border2), borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: T.text2, display: 'block', marginBottom: '8px' }}>Baseline Metrics</label>
              <p style={{ fontSize: '13px', color: T.text3, marginBottom: '12px' }}>Document starting metrics now. These become the outcome attribution baseline — required for outcome fee calculation.</p>

              {/* Pre-populated standard metrics for vertical */}
              {org.vertical && STANDARD_METRICS[org.vertical] && (
                <div style={{ background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Standard {org.vertical} Baseline Metrics</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {STANDARD_METRICS[org.vertical].map(sm => (
                      <button key={sm.metric} onClick={() => {
                        if (!baselines.some(b => b.metric === sm.metric)) {
                          setBaselines(prev => [...prev.filter(b => b.metric), { metric: sm.metric, current: '', target: '', source: sm.source }])
                        }
                      }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: baselines.some(b => b.metric === sm.metric) ? T.teal + '15' : T.surface, border: '1px solid ' + (baselines.some(b => b.metric === sm.metric) ? T.teal : T.border), borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <span style={{ fontSize: '12px', color: baselines.some(b => b.metric === sm.metric) ? T.teal : T.text2 }}>{sm.metric}</span>
                        <span style={{ fontSize: '10px', color: T.text3 }}>{baselines.some(b => b.metric === sm.metric) ? '✓ Added' : '+ Add'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual entry rows */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Entered Baselines</div>
              {baselines.filter(b => b.metric).map((b, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: T.text2, padding: '10px 12px', background: T.surface2, borderRadius: '8px', border: '1px solid ' + T.border }}>{b.metric}</div>
                  <input style={inputStyle} placeholder="Current value" value={b.current} onChange={e => setBaselines(bl => bl.map((x, bi) => bi === i ? { ...x, current: e.target.value } : x))} />
                  <input style={inputStyle} placeholder="Target value" value={b.target} onChange={e => setBaselines(bl => bl.map((x, bi) => bi === i ? { ...x, target: e.target.value } : x))} />
                  <input style={{ ...inputStyle, fontSize: '12px', color: T.text3 }} placeholder="Measurement source" value={(b as { source?: string }).source ?? ''} onChange={e => setBaselines(bl => bl.map((x, bi) => bi === i ? { ...x, source: e.target.value } : x))} />
                </div>
              ))}
              <button onClick={() => setBaselines(b => [...b, { metric: '', current: '', target: '', source: '' } as { metric: string; current: string; target: string; source: string }])} style={{ background: 'none', border: '1px dashed ' + T.border2, borderRadius: '8px', color: T.text3, padding: '8px 16px', cursor: 'pointer', fontSize: '12px', width: '100%', fontFamily: 'inherit', marginTop: '4px' }}>+ Add custom metric</button>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: T.text, marginBottom: '8px' }}>Ready to launch</div>
            <div style={{ fontSize: '14px', color: T.text3, marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
              <strong style={{ color: T.text }}>{org.name}</strong> — {org.vertical} — {org.size}<br />
              {categories.length} data categories · {solutions.length} solutions · {team.filter(t => t.email).length} team members
            </div>
            <a href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: T.teal, color: '#0D1117', textDecoration: 'none', borderRadius: '10px', padding: '14px 28px', fontSize: '15px', fontWeight: 800 }}>
              Launch Engagement →
            </a>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid ' + T.border }}>
            <button onClick={() => step > 1 && setStep(s => s - 1)} style={{ padding: '10px 20px', background: 'none', border: '1px solid ' + T.border2, borderRadius: '8px', color: step === 1 ? T.text3 : T.text, cursor: step === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'inherit', opacity: step === 1 ? 0.4 : 1 }}>← Back</button>
            <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} style={{ padding: '10px 24px', background: canNext ? T.teal : T.border2, color: canNext ? '#0D1117' : T.text3, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {step === 4 ? 'Review →' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
