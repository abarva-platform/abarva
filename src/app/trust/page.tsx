'use client'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' } as React.CSSProperties,
}

const TRUST_SECTIONS = [
  {
    id: 'data-architecture',
    title: 'Data Architecture',
    icon: '🏗',
    items: [
      { label: 'Data residency', value: 'Client data never leaves your cloud environment. AbarVa operates in your VPC, not ours.' },
      { label: 'Three-layer model', value: 'Layer 1 (org master data), Layer 2 (engagement data), and Layer 3 (Transformation Genome) are strictly separated. Client data is never used to train the Genome without explicit consent and compensation.' },
      { label: 'Encryption', value: 'AES-256 at rest. TLS 1.3 in transit. Key management via your cloud KMS (Azure Key Vault / AWS KMS / GCP KMS).' },
      { label: 'No training on client data', value: 'Your data improves your intelligence. It does not improve the model for anyone else. This is contractual and technical.' },
    ],
  },
  {
    id: 'access-controls',
    title: 'Access Controls',
    icon: '🔐',
    items: [
      { label: 'Role-based access', value: 'CIO, CFO, COO, CMIO, CEO, CDO, CRO roles each see only what is relevant to their function. Access matrix is auditable and configurable.' },
      { label: 'Row-level security', value: 'Supabase RLS policies enforce per-organization and per-engagement data isolation at the database level — not the application layer.' },
      { label: 'Maestro access', value: 'Maestro consultants access client data only within their assigned engagement. Engagement scope is contractually and technically bounded.' },
      { label: 'Audit trail', value: 'Every data access, upload, and promotion is logged with timestamp, user, and action. Logs are immutable and retained for 24 months.' },
    ],
  },
  {
    id: 'referral-disclosure',
    title: 'Referral Relationships',
    icon: '📢',
    items: [
      { label: 'Full disclosure, always', value: 'AbarVa has referral relationships with a subset of vendors in the Marketplace. Every referral partner is marked on every recommendation card, every time.' },
      { label: 'Independence of scoring', value: 'Referral relationships do not affect scores or rankings. The scoring methodology runs the same algorithm regardless of vendor relationship status.' },
      { label: 'Auditable methodology', value: 'The scoring algorithm is available to any client on request. Weights, data sources, and calculation logic are fully documented.' },
      { label: 'Conflict of interest register', value: 'Active referral relationships are listed in the Admin → Trust Center section of every engagement. Updated quarterly.' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Certifications',
    icon: '📋',
    items: [
      { label: 'SOC 2 Type II', value: 'In progress — target certification Q3 2026. Current controls audit available under NDA.' },
      { label: 'HIPAA readiness', value: 'BAA executed with all healthcare clients. PHI handling procedures documented. Annual workforce training completed.' },
      { label: 'GDPR', value: 'Data processing agreements available. EU data residency supported via Azure EU regions.' },
      { label: 'EU AI Act', value: 'Transparency documentation prepared for high-risk AI system deployments. Human oversight mechanisms documented per Article 14.' },
    ],
  },
  {
    id: 'ai-governance',
    title: 'AI Governance',
    icon: '🤖',
    items: [
      { label: 'Model provenance', value: 'Every intelligence response includes the model version, context window used, and confidence tier. No black-box outputs.' },
      { label: 'Confidence calibration', value: 'Responses are calibrated against data completeness. Low-confidence responses are labeled and data gaps are disclosed.' },
      { label: 'Human oversight', value: 'All strategic recommendations are advisory. Every output includes the reasoning, the data source, and the conditions under which the recommendation should be revisited.' },
      { label: 'Override tracking', value: 'When client users override AI recommendations, the override is logged, timestamped, and surfaced in the AI Control Tower for governance review.' },
    ],
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    icon: '🚨',
    items: [
      { label: 'SLA', value: 'P1 (data breach, PHI exposure): 1-hour response. P2 (platform unavailability): 4-hour response. P3 (degraded service): 24-hour response.' },
      { label: 'Notification', value: 'Client notification within 2 hours of confirmed P1 incident. HIPAA breach notification within 60 days per regulatory requirement.' },
      { label: 'Post-incident review', value: 'RCA published within 5 business days for all P1 incidents. Client-specific review within 10 business days.' },
      { label: 'Contact', value: 'Security incidents: security@abarva.ai · Available 24/7 for P1.' },
    ],
  },
]

export default function TrustPage() {
  return (
    <div style={S.page}>
      <AbarvaNav />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '20px', background: '#F0FDF4', border: '1px solid #A7F3D0', marginBottom: '20px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'block' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trust Center</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px', lineHeight: 1.2 }}>How we handle your data</h1>
          <p style={{ fontSize: '16px', color: '#64748B', margin: '0 0 24px', maxWidth: '600px', lineHeight: 1.6 }}>
            AbarVa operates inside your environment, not outside it. Your data never trains our models for other clients. Every referral relationship is disclosed. Every recommendation is auditable.
          </p>

          {/* Referral policy statement — highlighted */}
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#3730A3', marginBottom: '8px' }}>Referral Disclosure Policy</div>
            <div style={{ fontSize: '14px', color: '#4338CA', lineHeight: 1.6 }}>
              Referral relationships are disclosed on every recommendation. Scoring methodology is independent and auditable. AbarVa earns a referral fee only when a client contracts with a referral partner — this is disclosed on the card, in the engagement, and in this Trust Center. A referral relationship never affects a vendor&apos;s score.
            </div>
          </div>
        </div>

        {/* Trust sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {TRUST_SECTIONS.map(section => (
            <div key={section.id} style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '20px' }}>{section.icon}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{section.title}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', paddingBottom: i < section.items.length - 1 ? '16px' : 0, borderBottom: i < section.items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Questions about data handling or security? <a href="mailto:security@abarva.ai" style={{ color: '#4DA3FF', textDecoration: 'none' }}>security@abarva.ai</a>
          </p>
          <p style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '8px' }}>Last updated: April 2026</p>
        </div>
      </div>
    </div>
  )
}
