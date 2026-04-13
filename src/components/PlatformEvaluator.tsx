'use client'

export interface Platform {
  id: string
  name: string
  vendor: string
  isReferralPartner?: boolean
  scores: {
    ecosystemFit: number   // 1-5
    compliance: number     // 1-5
    cost: number           // 1-5 (5 = cheapest/best value)
    skills: number         // 1-5 (5 = easiest to hire for)
    risk: number           // 1-5 (5 = lowest risk)
  }
}

interface PlatformEvaluatorProps {
  platforms: Platform[]
  clientName: string
  context?: string
}

const CRITERIA = [
  { key: 'ecosystemFit' as const, label: 'Ecosystem fit' },
  { key: 'compliance' as const, label: 'Compliance posture' },
  { key: 'cost' as const, label: 'Cost / value' },
  { key: 'skills' as const, label: 'Skills availability' },
  { key: 'risk' as const, label: 'Implementation risk' },
]

function totalScore(p: Platform) {
  const s = p.scores
  return s.ecosystemFit + s.compliance + s.cost + s.skills + s.risk
}

function Circles({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', fontFamily: 'monospace', fontSize: '13px' }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < value ? '#2DD4C8' : '#D1D5DB' }}>●</span>
      ))}
    </span>
  )
}

export default function PlatformEvaluator({ platforms, clientName, context }: PlatformEvaluatorProps) {
  const sorted = [...platforms].sort((a, b) => totalScore(b) - totalScore(a))
  const bestFitId = sorted[0]?.id

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {context && (
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0' }}>{context}</p>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', minWidth: '160px' }}>
                Platform
              </th>
              {CRITERIA.map(c => (
                <th key={c.key} style={{ padding: '8px 12px', textAlign: 'center', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {c.label}
                </th>
              ))}
              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#6B7280', fontWeight: 600 }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((platform) => {
              const isBest = platform.id === bestFitId
              return (
                <tr
                  key={platform.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: isBest ? '#F0FFFE' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: isBest ? 700 : 500, color: isBest ? '#0F172A' : '#374151' }}>
                          {platform.name}
                        </span>
                        {platform.isReferralPartner && (
                          <span style={{ color: '#D97706', fontSize: '11px' }} title="AbarVa referral partner — disclosed, does not affect scoring">★</span>
                        )}
                        {isBest && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', background: '#E0FDFA', border: '1px solid #2DD4C8', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                            Best fit for {clientName}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{platform.vendor}</span>
                    </div>
                  </td>
                  {CRITERIA.map(c => (
                    <td key={c.key} style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <Circles value={platform.scores[c.key]} />
                    </td>
                  ))}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isBest ? '#059669' : '#374151',
                    }}>
                      {totalScore(platform)}/25
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Disclosure */}
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#D97706' }}>★</span>
        <span>
          AbarVa earns referral fees from vendors marked ★. Referral relationships do not affect scores. Methodology is auditable.{' '}
          <a href="/methodology" style={{ color: '#6B7280', textDecoration: 'underline' }}>View methodology →</a>
        </span>
      </div>
    </div>
  )
}

// Pre-built platform sets for each context
export const CLOUD_AI_PLATFORMS: Platform[] = [
  {
    id: 'aws-claude',
    name: 'AWS + Claude',
    vendor: 'Amazon Web Services / Anthropic',
    isReferralPartner: true,
    scores: { ecosystemFit: 4, compliance: 5, cost: 4, skills: 4, risk: 4 },
  },
  {
    id: 'azure-openai',
    name: 'Azure + OpenAI',
    vendor: 'Microsoft',
    isReferralPartner: true,
    scores: { ecosystemFit: 5, compliance: 4, cost: 3, skills: 5, risk: 4 },
  },
  {
    id: 'gcp-gemini',
    name: 'GCP + Gemini',
    vendor: 'Google Cloud',
    scores: { ecosystemFit: 3, compliance: 4, cost: 4, skills: 3, risk: 3 },
  },
  {
    id: 'snowflake',
    name: 'Snowflake Cortex',
    vendor: 'Snowflake',
    isReferralPartner: true,
    scores: { ecosystemFit: 3, compliance: 4, cost: 3, skills: 3, risk: 3 },
  },
  {
    id: 'databricks',
    name: 'Databricks Mosaic',
    vendor: 'Databricks',
    scores: { ecosystemFit: 3, compliance: 3, cost: 4, skills: 2, risk: 3 },
  },
]

// Client-adjusted scores for Meridian (Azure is dominant — Microsoft shop)
export const MERIDIAN_PLATFORMS: Platform[] = CLOUD_AI_PLATFORMS.map(p => {
  if (p.id === 'azure-openai') return { ...p, scores: { ...p.scores, ecosystemFit: 5, skills: 5 } }
  if (p.id === 'aws-claude') return { ...p, scores: { ...p.scores, ecosystemFit: 3, compliance: 5 } }
  return p
})

// Client-adjusted scores for First Capital (Compliance-first, existing AWS infra)
export const FIRSTCAPITAL_PLATFORMS: Platform[] = CLOUD_AI_PLATFORMS.map(p => {
  if (p.id === 'aws-claude') return { ...p, scores: { ...p.scores, ecosystemFit: 5, compliance: 5, risk: 5 } }
  if (p.id === 'azure-openai') return { ...p, scores: { ...p.scores, compliance: 3 } }
  return p
})

// Client-adjusted scores for Apex Retail (Salesforce ecosystem, existing Einstein)
export const APEXRETAIL_PLATFORMS: Platform[] = CLOUD_AI_PLATFORMS.map(p => {
  if (p.id === 'aws-claude') return { ...p, scores: { ...p.scores, ecosystemFit: 4, compliance: 4 } }
  if (p.id === 'azure-openai') return { ...p, scores: { ...p.scores, ecosystemFit: 3 } }
  return p
})
