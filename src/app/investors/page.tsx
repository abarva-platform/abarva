import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import AbarvaNav from '@/components/AbarvaNav'
import {
  Copy,
  Eyebrow,
  MarketingStyles,
  SERIF,
  TEAL,
  Title,
} from '@/components/marketing/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AbarVa Investors',
  description: 'AbarVa investor materials for warm-intro conversations.',
  robots: {
    index: false,
    follow: false,
  },
}

const loopSteps = [
  {
    title: 'Tower surfaces contradictions',
    body: 'AbarVa Control Tower flags spend, adoption, and ownership gaps like AI copilots with drop-off and no measurable baseline.',
  },
  {
    title: 'Engagement opens preloaded',
    body: 'AbarVa Engagements inherits the contradiction context, sponsor lens, and working assumptions so diagnosis begins with facts already loaded.',
  },
  {
    title: 'Outcome returns to the platform',
    body: 'Verified savings, adoption recovery, and remediation patterns flow back into the customer record and strengthen the next recommendation.',
  },
]

const moatAssets = [
  {
    title: 'Transformation Genome',
    body: 'Patterns with trigger conditions, evidence templates, remediation paths, and the conditions that make them true.',
  },
  {
    title: 'Cross-client intelligence graph',
    body: 'Relationships across vendors, regulations, operating models, and delivery patterns observed through the engagement corpus.',
  },
  {
    title: 'Outcome Interpretability Layer',
    body: 'Attribution logic that ties recommended actions to measurable outcomes and improves with every verified engagement.',
  },
  {
    title: 'Vendor ecosystem data',
    body: 'Observed deployment signatures, pricing patterns, overlaps, and consolidation plays that do not exist in any public benchmark set.',
  },
]

const economicsRows = [
  ['Revenue per engagement (6-month, Meridian-scale)', '$800K–$2.0M', 'Outcome-share pricing tied to verified savings'],
  ['LLM cost', '$5K–$10K', 'About 0.5–1.0% of revenue'],
  ['Engagement lead labor', '$75K', '0.25 loaded FTE across six months'],
  ['Platform infrastructure allocation', '$8K', 'Share of fixed cloud and storage costs'],
  ['Engagement gross margin', '$700K–$1.9M', 'Roughly 90% gross margin'],
]

const tractionSignals = [
  'Meridian, First Capital, and Apex portfolio data now seeded at realistic enterprise depth.',
  'Control Tower, Engagements, and Intelligence all share one operating narrative in the product.',
  'Pack-based delivery velocity continues to compress product and services build time into days, not quarters.',
  'Warm design-partner conversations continue with a Fortune 40 technology executive and enterprise operators.',
]

const raiseRows = [
  ['Current round', '$8M at $25M pre-money', 'SAFE / convertible structure for this phase'],
  ['Primary use of proceeds', '3 engagement leads + platform buildout', 'Expand delivery capacity while deepening the moat'],
  ['Data advantage', 'Benchmark ingestion + Genome expansion', 'Bring Tier 1 / Tier 2 sources in house'],
  ['Series A trigger', '$5M ARR · 30 clients', 'Cross-client intelligence fully operational'],
]

const whyUs = [
  'Anand Sundaram spent 15 years inside enterprise transformation delivery and left because the work is now pattern-matchable, auditable, and outcome-accountable.',
  'The category window is 18–24 months: incumbent consultancies cannot disrupt themselves, and wrapper startups cannot build the data moat without years of engagements.',
  'AbarVa is building both the software and the operating model together, which is the only way the data layer compounds fast enough.',
]

type SearchParams = Promise<{ access?: string }>

export default async function InvestorsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { access } = await searchParams
  const expectedToken = process.env.INVESTOR_ACCESS_TOKEN?.trim()
  const tokenMatches = !!expectedToken && access === expectedToken

  // Signed-in investors and admins pass without the token. Warm-intro
  // prospects without an account use /investors?access=<token>.
  let roleUnlocks = false
  try {
    const user = await currentUser()
    const role = user?.publicMetadata?.role as string | undefined
    roleUnlocks = role === 'investor' || role === 'admin'
  } catch {
    // currentUser() can fail during static analysis; treat as not unlocked
  }

  if (!tokenMatches && !roleUnlocks) {
    notFound()
  }

  return (
    <div className="marketing-shell">
      <MarketingStyles />
      <AbarvaNav activePage="investor" />

      <main>
        <section className="marketing-section">
          <div className="marketing-container marketing-grid-2" style={{ alignItems: 'start' }}>
            <div>
              <Eyebrow>Warm-intro investor materials</Eyebrow>
              <Title>
                The Harvey-sized outcome,
                <br />
                with a larger market and a stronger moat.
              </Title>
              <Copy style={{ maxWidth: 620, marginBottom: 22 }}>
                Harvey proved a workflow-native AI system can become the operating layer for a high-value professional category. AbarVa applies that same thesis to enterprise transformation, but with a dual-product design and a compounding intelligence architecture aimed at a combined $1.3T category.
              </Copy>
              <div
                className="marketing-card"
                style={{
                  background: '#0C0C0C',
                  color: 'white',
                  borderColor: '#0C0C0C',
                  maxWidth: 540,
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, marginBottom: 8 }}>$1.3T</div>
                <div style={{ color: '#D1D5DB', lineHeight: 1.7 }}>
                  Combined target category: consulting displacement plus the control plane for enterprise AI value realization.
                </div>
              </div>
            </div>
            <div className="marketing-grid-3" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
              <div className="marketing-card">
                <div style={{ color: TEAL, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Anchor
                </div>
                <Copy>
                  Harvey built an $11B company by becoming the OS for legal work. AbarVa is targeting enterprise transformation, a larger category with a broader operational footprint.
                </Copy>
              </div>
              <div className="marketing-card">
                <div style={{ color: TEAL, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Product thesis
                </div>
                <Copy>
                  Engagements monetize contradiction resolution. Control Tower surfaces the buying signal. Intelligence compounds the corpus behind both.
                </Copy>
              </div>
              <div className="marketing-card">
                <div style={{ color: TEAL, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Access
                </div>
                <Copy>
                  This page is intentionally gated and not indexed. Warm intros only while the round is forming.
                </Copy>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark">
          <div className="marketing-container">
            <Eyebrow>Two-product compounding loop</Eyebrow>
            <Title section>
              Tower finds the problem. Engagement solves it. The system learns from both.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              {loopSteps.map((step, index) => (
                <div className="marketing-card marketing-card--dark" key={step.title}>
                  <div style={{ color: TEAL, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Step {index + 1}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                  <Copy>{step.body}</Copy>
                </div>
              ))}
            </div>
            <div className="marketing-card marketing-card--dark" style={{ marginTop: 20 }}>
              <Copy>
                This is a business model, not a feature: Tower creates the buying signal, Engagement monetizes the signal, and the verified outcome enriches both the Tower and the intelligence layer for every future account.
              </Copy>
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>Four-layer architecture as moat</Eyebrow>
            <Title section>
              The architectural advantage compounds faster than a prompt-wrapper competitor can catch up.
            </Title>
            <div className="marketing-grid-2" style={{ alignItems: 'start', marginTop: 28 }}>
              <img
                className="marketing-diagram"
                src="/assets/architecture/four-layer-intelligence-light.svg"
                alt="AbarVa four-layer intelligence architecture"
              />
              <div className="marketing-grid-2">
                {moatAssets.map((asset) => (
                  <div className="marketing-card" key={asset.title}>
                    <div style={{ color: TEAL, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                      Proprietary asset
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>{asset.title}</div>
                    <Copy>{asset.body}</Copy>
                  </div>
                ))}
              </div>
            </div>
            <Copy style={{ marginTop: 22, maxWidth: 980 }}>
              Every engagement enriches public knowledge, client data, and engagement memory. Over time, the structured dataset about how enterprise transformation actually works becomes the moat — not just the user interface sitting on top.
            </Copy>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark">
          <div className="marketing-container">
            <Eyebrow>Unit economics</Eyebrow>
            <Title section>
              Services-like revenue, software-like margin profile.
            </Title>
            <div className="marketing-card marketing-card--dark" style={{ marginTop: 28 }}>
              <table className="marketing-table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Value</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {economicsRows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="marketing-grid-2" style={{ marginTop: 20 }}>
              <div className="marketing-card marketing-card--dark">
                <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, marginBottom: 8 }}>25:1</div>
                <Copy>
                  Revenue-to-labor leverage target for one engagement lead running multiple concurrent enterprise programs.
                </Copy>
              </div>
              <div className="marketing-card marketing-card--dark">
                <Copy>
                  The economics improve with scale because the intelligence layer, orchestration patterns, and benchmark assets amortize across every new engagement instead of resetting like traditional consulting labor.
                </Copy>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>Traction signals</Eyebrow>
            <Title section>
              What is real today.
            </Title>
            <div className="marketing-grid-2" style={{ marginTop: 28 }}>
              {tractionSignals.map((signal) => (
                <div className="marketing-card" key={signal}>
                  <Copy>{signal}</Copy>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark">
          <div className="marketing-container">
            <Eyebrow>The raise</Eyebrow>
            <Title section>
              $8M at $25M pre to turn early product truth into repeatable enterprise scale.
            </Title>
            <div className="marketing-card marketing-card--dark" style={{ marginTop: 28 }}>
              <table className="marketing-table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Value</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {raiseRows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container marketing-grid-2" style={{ alignItems: 'start' }}>
            <div>
              <Eyebrow>Why us, why now</Eyebrow>
              <Title section>
                The category window is open, and the data moat compounds from day one.
              </Title>
            </div>
            <div className="marketing-grid-3" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
              {whyUs.map((item) => (
                <div className="marketing-card" key={item}>
                  <Copy>{item}</Copy>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>Contact</Eyebrow>
            <Title section>
              Warm intros preferred. Materials available on request.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              <div className="marketing-card">
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Investment inquiries</div>
                <Copy style={{ marginBottom: 14 }}>anand@abarva.ai</Copy>
                <a href="mailto:anand@abarva.ai?subject=AbarVa%20investor%20materials" className="marketing-button marketing-button--primary">
                  Request investor materials →
                </a>
              </div>
              <div className="marketing-card">
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Design partner track</div>
                <Copy style={{ marginBottom: 14 }}>partners@abarva.ai</Copy>
                <a href="mailto:partners@abarva.ai?subject=Design%20partner%20interest" className="marketing-button marketing-button--secondary">
                  Apply →
                </a>
              </div>
              <div className="marketing-card">
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Warm intro preference</div>
                <Copy>
                  Preferred via Shail Jain, Anthology Fund contacts, or existing design-partner relationships.
                </Copy>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
