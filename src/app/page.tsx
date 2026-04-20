import Link from 'next/link'
import {
  AMBER,
  BODY,
  BORDER,
  Copy,
  CREAM,
  DARK,
  DARK_BODY,
  Eyebrow,
  GREEN,
  INK,
  MarketingHeader,
  MarketingStyles,
  MONO,
  MUTED,
  RED,
  SERIF,
  TEAL,
  Title,
} from '@/components/marketing/site'

const heroStats = [
  {
    label: 'Global consulting spend',
    value: '$800B',
    body: 'Outcome-accountable displacement in progress',
  },
  {
    label: 'Enterprise AI with no verified ROI',
    value: '73%',
    body: 'Measurement and governance gap AbarVa closes',
  },
  {
    label: 'Fee only after outcomes verified',
    value: '0%',
    body: 'No retainer, no hourly — skin in the game',
  },
  {
    label: 'Time to first intelligence',
    value: '48h',
    body: 'From kickoff to your first situation brief',
  },
]

const problemCards = [
  {
    value: '$200B',
    color: RED,
    title: 'Consulting spend with no outcome accountability',
    body: 'Firms deliver decks and leave. No baseline locked. No outcome tracking. Same firm returns next year to clean up the mess they helped cause.',
  },
  {
    value: '73%',
    color: RED,
    title: 'AI spend with no verified outcome',
    body: 'The money was spent. The board has been briefed. Nobody can prove it worked. AbarVa closes the measurement, evidence, and governance gap.',
  },
  {
    value: '$400B',
    color: AMBER,
    title: 'Internal labor and staff-aug spend under pressure',
    body: 'Even companies that avoid consulting still run huge transformation teams. The analyst, diagnostic, and synthesis work is now pattern-matchable.',
  },
]

const products = [
  {
    name: 'AbarVa Engagements',
    body: 'The transformation workspace. Five-phase consultative engagements — charter, diagnose, design, execute, verify — delivered by Nexus. Outcome-based pricing ties us to verified results.',
  },
  {
    name: 'AbarVa Control Tower',
    body: 'The CIO cockpit. Live portfolio view of production, pilot, stalled, and shadow AI, with contradictions surfaced in real time across adoption, value, risk, and cost.',
  },
  {
    name: 'AbarVa Intelligence',
    body: 'The cross-client learning layer. Topics, patterns, vendors, regulations, benchmarks, and research surfaced through Ask Intelligence with citations and honest provenance.',
  },
]

const layers = [
  {
    name: 'L4 User profile',
    body: 'Role, history, focus areas, and preferences so Nexus knows who is asking and calibrates the answer.',
  },
  {
    name: 'L3 Engagement',
    body: 'Turn history, active topic, phase, and active patterns so continuity survives a six-month program.',
  },
  {
    name: 'L2 Client data',
    body: 'Tech stack, use cases, costs, and contradictions so every answer is grounded in the client’s real operating environment.',
  },
  {
    name: 'L1 Public knowledge',
    body: 'Topics, patterns, vendors, regulations, and research so cross-client learning compounds into each new answer.',
  },
]

const phases = [
  {
    num: 'Phase 0',
    title: 'Charter',
    body: 'Value case, scope, and sponsor alignment.',
  },
  {
    num: 'Phase 1',
    title: 'Diagnose',
    body: 'Quantified problem, opportunity size, and value at risk.',
  },
  {
    num: 'Phase 2',
    title: 'Design',
    body: 'Options with economics, peer comparables, and baseline locked.',
  },
  {
    num: 'Phase 3',
    title: 'Execute',
    body: 'Decisions logged, milestones tracked, and risk alerts surfaced.',
  },
  {
    num: 'Phase 4',
    title: 'Verify',
    body: 'Baseline versus actuals, then fee proposal tied to measurable outcome.',
  },
]

const towerLenses = [
  {
    name: 'Inventory',
    body: 'Every use case, including shadow AI discovered through network, SaaS admin, and expense signals.',
  },
  {
    name: 'Adoption',
    body: 'Who is actually using what, how often, and where the drop-off risk is forming.',
  },
  {
    name: 'Value',
    body: 'Baseline, target, and observed outcome lines with attribution confidence scored.',
  },
  {
    name: 'Risk',
    body: 'Data classification, governance posture, vendor posture, and escalation issues in one place.',
  },
  {
    name: 'Cost',
    body: 'LLM consumption, compute, licenses, and trajectory before spend drifts out of bounds.',
  },
]

const intelligenceModes = [
  {
    title: 'Library',
    body: 'Browse Topics, Genome patterns, vendors, regulations, frameworks, benchmarks, research, and news by industry or problem class.',
  },
  {
    title: 'Insights',
    body: 'Auto-detected meta-patterns across engagements, with evidence, confidence, and the conditions that make them true.',
  },
  {
    title: 'Live',
    body: 'Operational pulse of new contradictions, new sources, and new signals hitting the system in real time.',
  },
]

const agentRows = [
  ['Nexus', 'Engagement console', 'Consultative partner', 'Opus 4.7 · Sonnet · Haiku', '1.5–5s'],
  ['Ask Intelligence', 'Intelligence page', 'Stateless librarian', 'Opus 4.7 · Sonnet', '1.2–3s'],
  ['Onboarding Companion', 'Tower onboarding', 'Data upload helper', 'Haiku + Sonnet', '<2s'],
  ['Deliverable Engine', 'On demand', 'Structured deliverables', 'Opus 4.7', '15–45s'],
  ['Quality Reviewer', 'Paired with Deliverable', 'Rubric-based review', 'Opus 4.7', '5–15s'],
  ['Graph Extractor', 'Ingestion pipeline', 'Entity extraction', 'Opus 4.7', '30s–3m batch'],
  ['Insight Detector', 'Nightly worker', 'Cross-engagement meta-patterns', 'Haiku + Sonnet', 'Nightly batch'],
  ['Anticipation Worker', 'Inside Nexus', 'Next-turn chip generation', 'Haiku', '<300ms'],
  ['Upload Classifier', 'Inside Onboarding', 'File type detection', 'Haiku', '<800ms'],
  ['Intent Router', 'Inside Ask Intelligence', 'Query classification', 'Haiku', '<80ms'],
]

const proofPoints = [
  'Data residency — Postgres, Neo4j, and Pinecone stay inside the customer VPC.',
  'Audit retention — every platform update ships through a controlled deploy pipeline with customer-owned audit logs.',
  'Model flexibility — Claude, OpenAI, or self-hosted open-weight models via a configuration layer rather than a rebuild.',
]

const whyNow = [
  'Enterprise AI spend exploded — every Fortune 2000 has a meaningful AI budget now.',
  'Board pressure caught up — “what are we getting for AI spend?” is in every serious board pack.',
  'Models got good enough — the quality threshold for consultant-grade synthesis crossed in the last six months.',
]

const footerCtas = [
  {
    title: 'Request a demo',
    body: '30-minute walkthrough of Nexus, Control Tower, and Intelligence with your use case loaded in.',
    href: '/sign-in',
    label: 'Request →',
  },
  {
    title: 'Become a design partner',
    body: '90 minutes a month, direct product influence, and early access to shape the category.',
    href: 'mailto:partners@abarva.ai?subject=Design%20partner%20interest',
    label: 'Apply →',
  },
  {
    title: 'Investor relations',
    body: 'For warm-intro conversations and investor materials. Access is controlled and routed intentionally.',
    href: '/investors',
    label: 'Access →',
  },
]

export default function HomePage() {
  return (
    <div className="marketing-shell">
      <MarketingStyles />
      <MarketingHeader />

      <main>
        <section className="marketing-section">
          <div className="marketing-container marketing-grid-2" style={{ alignItems: 'center' }}>
            <div>
              <Eyebrow>Enterprise transformation · AI-native · Outcome-accountable</Eyebrow>
              <Title>
                Act on intelligence.
                <br />
                Before the window closes.
              </Title>
              <Copy style={{ maxWidth: 560, marginBottom: 28 }}>
                AbarVa is an AI-native enterprise transformation platform. We replace the $800B global consulting category and augment the internal labor teams that do not use consulting — with outcome-based engagements, private-cloud deployment, and a four-layer intelligence system that gets smarter with every engagement.
              </Copy>
              <div className="marketing-actions">
                <Link className="marketing-button marketing-button--primary" href="/sign-in">
                  Request demo →
                </Link>
                <a
                  className="marketing-button marketing-button--secondary"
                  href="mailto:partners@abarva.ai?subject=Meridian%20case%20request"
                >
                  Read Meridian case →
                </a>
              </div>
            </div>
            <div className="marketing-grid-4">
              {heroStats.map((item) => (
                <div className="marketing-card" key={item.label}>
                  <div className="marketing-eyebrow" style={{ marginBottom: 10 }}>{item.label}</div>
                  <div className="marketing-stat" style={{ marginBottom: 8 }}>{item.value}</div>
                  <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark">
          <div className="marketing-container">
            <Eyebrow>The problem</Eyebrow>
            <Title section>
              The economics of enterprise transformation are broken.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              {problemCards.map((card) => (
                <div className="marketing-card marketing-card--dark" key={card.title}>
                  <div className="marketing-stat" style={{ color: card.color, marginBottom: 12 }}>{card.value}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{card.title}</div>
                  <Copy>{card.body}</Copy>
                </div>
              ))}
            </div>
            <Copy style={{ color: 'rgba(255,255,255,0.72)', marginTop: 28, maxWidth: 960 }}>
              AbarVa was built because none of this should still be true in 2026. We replace the consulting category for organizations that use it. We augment the internal-labor intelligence layer for organizations that do not. Same outcome logic either way.
            </Copy>
          </div>
        </section>

        <section className="marketing-section" id="products">
          <div className="marketing-container">
            <Eyebrow>What AbarVa is</Eyebrow>
            <Title section>
              Not a consulting firm. Not an LLM wrapper. Three products, one compounding loop.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              {products.map((product) => (
                <div className="marketing-card" key={product.name}>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                    {product.name}
                  </div>
                  <Copy>{product.body}</Copy>
                </div>
              ))}
            </div>
            <div className="marketing-card" style={{ marginTop: 20 }}>
              <Copy>
                Tower surfaces contradictions. Engagements solve them. Intelligence learns from both. The customer becomes permanently sticky because every loop produces more evidence, more memory, and better future judgment.
              </Copy>
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark" id="architecture">
          <div className="marketing-container">
            <Eyebrow>Four-layer intelligence</Eyebrow>
            <Title section>
              Four layers. Every turn. No other platform does this.
            </Title>
            <Copy style={{ maxWidth: 980, marginBottom: 28 }}>
              Every response Nexus produces — every Ask Intelligence answer, every deliverable we generate — weaves four layers of context into a single prompt. Graph, vector, and structured queries fire in parallel across all four. The result is consultant-grade specificity with platform-scale memory.
            </Copy>
            <div className="marketing-grid-2" style={{ alignItems: 'start' }}>
              <img
                className="marketing-diagram"
                src="/assets/architecture/four-layer-intelligence-light.svg"
                alt="Four-layer intelligence architecture"
              />
              <div className="marketing-grid-2">
                {layers.map((layer) => (
                  <div className="marketing-card marketing-card--dark" key={layer.name}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
                      {layer.name}
                    </div>
                    <Copy>{layer.body}</Copy>
                  </div>
                ))}
              </div>
            </div>
            <Copy style={{ color: 'rgba(255,255,255,0.72)', marginTop: 24, maxWidth: 900 }}>
              The architecture enforces privacy. Ask Intelligence can stay scoped to public knowledge. Nexus can be scoped per engagement. There is no path between client data silos by default.
            </Copy>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>The engagement</Eyebrow>
            <Title section>
              Five phases. One agent. Zero decks.
            </Title>
            <div className="marketing-grid-4" style={{ marginTop: 28 }}>
              {phases.map((phase) => (
                <div className="marketing-card" key={phase.num}>
                  <div style={{ color: TEAL, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                    {phase.num}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{phase.title}</div>
                  <Copy>{phase.body}</Copy>
                </div>
              ))}
            </div>
            <div className="marketing-card" style={{ marginTop: 20 }}>
              <Copy>
                Nexus carries the engagement turn by turn. CXOs engage when judgment matters. The engagement itself is the product, and the pricing stays tied to the measured outcome, not the calendar.
              </Copy>
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark" id="customers">
          <div className="marketing-container">
            <Eyebrow>AbarVa Control Tower</Eyebrow>
            <Title section>
              A cockpit for every AI use case in your enterprise.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              {towerLenses.map((lens) => (
                <div className="marketing-card marketing-card--dark" key={lens.name}>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{lens.name}</div>
                  <Copy>{lens.body}</Copy>
                </div>
              ))}
            </div>
            <div className="marketing-card marketing-card--dark" style={{ marginTop: 20 }}>
              <Copy>
                Most tools track one dimension. AbarVa cross-checks. When Copilot is at $180K a month with 45% drop-off and no baseline, that is a contradiction. When claims triage claims $2M in savings but has no measurement, that is a contradiction. One click turns the contradiction into a governed engagement with the context already loaded.
              </Copy>
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>AbarVa Intelligence</Eyebrow>
            <Title section>
              Patterns, topics, vendors, regulations, and benchmarks — synthesized on demand.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              {intelligenceModes.map((mode) => (
                <div className="marketing-card" key={mode.title}>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{mode.title}</div>
                  <Copy>{mode.body}</Copy>
                </div>
              ))}
            </div>
            <div className="marketing-card" style={{ marginTop: 20 }}>
              <Copy>
                Ask Intelligence is not a chat toy. Type any question — vendor comparisons, pattern lookups, research synthesis — and it returns cited answers, provenance, and an honest boundary around what is still unknown.
              </Copy>
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark">
          <div className="marketing-container">
            <Eyebrow>Agent orchestration</Eyebrow>
            <Title section>
              Three agents you’ll use. Seven that work behind them.
            </Title>
            <Copy style={{ maxWidth: 900, marginBottom: 28 }}>
              AbarVa is not one LLM with a wrapper. It is a coordinated agent system, each with defined scope, model tier, latency budget, and access discipline.
            </Copy>
            <div className="marketing-card marketing-card--dark">
              <table className="marketing-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Where</th>
                    <th>Purpose</th>
                    <th>Model tier</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {agentRows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Copy style={{ color: 'rgba(255,255,255,0.72)', marginTop: 20 }}>
              Model tiers are matched to stakes. Opus only where reasoning quality is the product. Smaller models where the job is narrow and fast. Cost discipline, not cost theater.
            </Copy>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>Deployment</Eyebrow>
            <Title section>
              Your cloud. Your data. Your audit logs.
            </Title>
            <div className="marketing-grid-2" style={{ alignItems: 'start', marginTop: 28 }}>
              <img
                className="marketing-diagram"
                src="/assets/architecture/cloud-deployment-light.svg"
                alt="Cloud deployment architecture"
              />
              <div className="marketing-grid-3" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
                {proofPoints.map((point) => (
                  <div className="marketing-card" key={point}>
                    <Copy>{point}</Copy>
                  </div>
                ))}
                <div className="marketing-card">
                  <Copy>
                    Built for organizations that build internally. If your model relies on in-house engineering with offshore scale-out, AbarVa becomes your transformation intelligence capability, not another opaque vendor layer.
                  </Copy>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--dark">
          <div className="marketing-container marketing-grid-2" style={{ alignItems: 'start' }}>
            <div>
              <Eyebrow>Why now</Eyebrow>
              <Title section>
                The window for category creation is open now, not forever.
              </Title>
              <Copy>
                The next 18–24 months belong to the company that can turn enterprise AI noise into governed, measurable transformation. Someone will build this category. The question is who compounds the data first.
              </Copy>
            </div>
            <div className="marketing-grid-3" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
              {whyNow.map((item) => (
                <div className="marketing-card marketing-card--dark" key={item}>
                  <Copy>{item}</Copy>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container marketing-grid-2" style={{ alignItems: 'start' }}>
            <div>
              <Eyebrow>Who’s building this</Eyebrow>
              <Title section>
                Built by practitioners who have already run the work.
              </Title>
              <Copy>
                Anand Sundaram spent 15 years leading enterprise transformation and AI delivery inside a top consulting firm. AbarVa exists because the work is pattern-matchable, outcome-accountable, and too important to leave inside hourly-service economics.
              </Copy>
            </div>
            <div className="marketing-grid-3" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
              <div className="marketing-card">
                <Copy>
                  Founder-led, product-native, and shipping with unusual velocity across platform, data model, intelligence layer, and commercial narrative.
                </Copy>
              </div>
              <div className="marketing-card">
                <Copy>
                  Supported by warm design-partner conversations with a Fortune 40 CIO and a growing circle of operators who care about the category window.
                </Copy>
              </div>
              <div className="marketing-card">
                <Copy>
                  Small, senior team. Building the platform and the operating model together, not bolting one onto the other.
                </Copy>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-container">
            <Eyebrow>Next step</Eyebrow>
            <Title section>
              Three paths into AbarVa.
            </Title>
            <div className="marketing-grid-3" style={{ marginTop: 28 }}>
              {footerCtas.map((cta) => (
                <div className="marketing-card" key={cta.title}>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{cta.title}</div>
                  <Copy style={{ marginBottom: 18 }}>{cta.body}</Copy>
                  {cta.href.startsWith('mailto:') ? (
                    <a href={cta.href} className="marketing-button marketing-button--primary">
                      {cta.label}
                    </a>
                  ) : (
                    <Link href={cta.href} className="marketing-button marketing-button--primary">
                      {cta.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <footer className="marketing-footer">
              <div className="marketing-footer__meta">
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700 }}>
                  <span style={{ color: INK }}>Abar</span>
                  <span style={{ color: TEAL }}>Va</span>
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <a href="https://www.linkedin.com" style={{ color: BODY, fontSize: 13, textDecoration: 'none' }}>LinkedIn</a>
                  <a href="mailto:partners@abarva.ai?subject=Careers" style={{ color: BODY, fontSize: 13, textDecoration: 'none' }}>Careers</a>
                  <a href="mailto:anand@abarva.ai?subject=Privacy" style={{ color: BODY, fontSize: 13, textDecoration: 'none' }}>Privacy</a>
                  <a href="mailto:anand@abarva.ai?subject=Terms" style={{ color: BODY, fontSize: 13, textDecoration: 'none' }}>Terms</a>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
