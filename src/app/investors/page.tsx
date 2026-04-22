import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import AbarvaNav from '@/components/AbarvaNav'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AbarVa Investors',
  description: 'AbarVa investor materials for warm-intro conversations.',
  robots: {
    index: false,
    follow: false,
  },
}

type SearchParams = Promise<{ access?: string }>

const PAGE_BG = '#F6F0E7'
const PAGE_BG_ALT = '#EFE4D5'
const PAGE_CARD = '#FFFDFC'
const PAGE_CARD_SOFT = '#F2E7DA'
const PAGE_INK = '#171411'
const PAGE_SOFT = '#3D342E'
const PAGE_MUTED = '#6E6259'
const PAGE_LINE = 'rgba(23, 20, 17, 0.12)'
const PAGE_TEAL = '#14B8A6'
const PAGE_AMBER = '#D9863D'
const PAGE_SKY = '#5CA3F6'
const PAGE_DARK = '#0E1217'
const PAGE_DARK_PANEL = '#171D24'
const PAGE_DARK_SOFT = '#B6C0CD'
const PAGE_DARK_LINE = 'rgba(255, 255, 255, 0.1)'
const SERIF = '"Fraunces", Georgia, serif'
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const MONO = '"JetBrains Mono", "Fira Code", monospace'

const investorSignals = [
  {
    label: 'Category surface',
    value: '$1.3T',
    detail: 'consulting displacement plus the control plane for AI value realization',
  },
  {
    label: 'Programs modeled',
    value: '4',
    detail: 'Meridian, First Capital, Apex, and Keystone seeded at enterprise depth',
  },
  {
    label: 'Promoted patterns',
    value: '47',
    detail: 'observed across the transformation Genome and reusable across programs',
  },
  {
    label: 'First read time',
    value: '48h',
    detail: 'from context load to an opinionated executive brief',
  },
]

const loopSteps = [
  {
    step: '01',
    title: 'Tower finds the contradiction.',
    body: 'Control Tower surfaces spend drift, ownership gaps, and stalled adoption before a client formally commissions a program.',
  },
  {
    step: '02',
    title: 'Programs open preloaded.',
    body: 'AbarVa Engagements inherits sponsor context, contradictions, and working hypotheses so diagnosis starts with facts already loaded.',
  },
  {
    step: '03',
    title: 'The system learns on the way out.',
    body: 'Evidence, decisions, and verified outcomes flow back into the customer record and strengthen the next recommendation.',
  },
]

const architectureAssets = [
  {
    name: 'Transformation Genome',
    counter: '47',
    unit: 'promoted patterns',
    body: 'Observed patterns with trigger conditions, evidence templates, intervention paths, and the conditions that make them true.',
    stat: '1,247 anonymized observations',
  },
  {
    name: 'Cross-client intelligence graph',
    counter: '19',
    unit: 'pattern matches today',
    body: 'Relationships across vendors, regulations, operating models, and execution signatures observed through the engagement corpus.',
    stat: '14 contradictions surfaced this week',
  },
  {
    name: 'Outcome Interpretability Layer',
    counter: '187',
    unit: 'audit-grade evidence items',
    body: 'Attribution logic tying actions to measurable outcomes, with chain-of-custody and evidence weighting built in.',
    stat: '100% provenance completeness across active programs',
  },
  {
    name: 'Vendor ecosystem data',
    counter: '156',
    unit: 'systems mapped',
    body: 'Observed deployment signatures, pricing patterns, overlaps, and consolidation plays that do not exist in public benchmark sets.',
    stat: '71 connected sources feeding intelligence',
  },
]

const tiers = [
  {
    name: 'Starter',
    fee: '$350K',
    hours: '240 hours',
    fit: 'First program · proof of value',
    deployment: 'AbarVa-managed tenant',
    assignment: 'On-demand maestro · standard queue',
    seniority: 'Mostly junior-to-mid',
  },
  {
    name: 'Growth',
    fee: '$800K',
    hours: '520 hours',
    fit: '2-4 programs · cross-functional portfolio',
    deployment: 'AbarVa-managed or client-tenant with support',
    assignment: 'Named maestro + priority queue',
    seniority: 'Balanced junior-mid-senior',
  },
  {
    name: 'Enterprise',
    fee: '$1.6M',
    hours: '1,040 hours',
    fit: 'Enterprise-wide portfolio · strategic transformations',
    deployment: 'Client-tenant deployment end-to-end',
    assignment: 'Dedicated maestro team + priority expert scheduling',
    seniority: 'Senior-weighted · principal access',
    featured: true,
  },
]

const lifecycleAllocation = [
  ['Phase 0 · charter, scope, sponsor alignment', '~60 hours'],
  ['Phase 1 · diagnosis, hypotheses, interviews', '~180 hours'],
  ['Phase 2 · option generation, decision, design', '~200 hours'],
  ['Phase 3 · execution orchestration, weekly rhythm', '~420 hours'],
  ['Phase 4 · measurement, learning, Genome contribution', '~120 hours'],
  ['Reserve', '~60 hours'],
]

const morrisonCostRows = [
  ['AbarVa annual platform fee', '$1.6M', 'Enterprise tier · full platform access + 1,040 bundled maestro hours'],
  ['Vendor fees', '~$620K', 'pricing engine, freight consolidation, attribution · paid direct by client'],
  ['Compute + LLM', '~$220K', 'billed at cost by provider · no AbarVa surcharge'],
  ['Client analyst capacity', '~$1.15M', "client's own staff allocation"],
  ['Total program cost to client Y1', '~$3.6M', 'platform fee + non-AbarVa costs'],
]

const revenueCharacteristics = [
  'Predictable ARR. Platform fees anchor revenue rather than contingent outcome settlements.',
  'High gross margin per subscription. Bundled maestro hours represent 25-31% of platform fee; the balance is platform and IP access.',
  'Clear upsell path. Starter expands to Growth as portfolio count rises; Growth expands to Enterprise as clients deploy into their own tenant.',
  'No usage-based margin compression. Compute and LLM usage are billed at cost by the provider, not metered or surcharged by AbarVa.',
]

const whyNow = [
  'Anand Sundaram spent 15 years inside enterprise transformation delivery and left because the work is now pattern-matchable, auditable, and productizable.',
  'The category window is 18-24 months: incumbent consultancies cannot disrupt themselves, and AI wrappers cannot build the data moat without years of live programs.',
  'AbarVa is building software, operating model, and evidence discipline together, which is the only way the intelligence layer compounds fast enough.',
]

function SectionEyebrow({ children }: { children: string }) {
  return <div className="investor-eyebrow">{children}</div>
}

function SectionTitle({
  children,
  dark,
}: {
  children: string
  dark?: boolean
}) {
  return <h2 className={`investor-title ${dark ? 'investor-title--dark' : ''}`}>{children}</h2>
}

function InvestorStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .investor-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(92, 163, 246, 0.14), transparent 28%),
          linear-gradient(180deg, ${PAGE_BG} 0%, ${PAGE_BG_ALT} 100%);
        color: ${PAGE_INK};
        font-family: ${SANS};
      }

      .investor-container {
        width: min(1380px, calc(100vw - 56px));
        margin: 0 auto;
      }

      .investor-section {
        padding: 92px 0;
      }

      .investor-section--tight {
        padding-top: 64px;
      }

      .investor-section--dark {
        background:
          radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 32%),
          linear-gradient(180deg, ${PAGE_DARK} 0%, #12161C 100%);
        color: white;
      }

      .investor-card {
        background: ${PAGE_CARD};
        border: 1px solid ${PAGE_LINE};
        border-radius: 28px;
        box-shadow: 0 24px 80px rgba(23, 20, 17, 0.06);
      }

      .investor-card--soft {
        background: ${PAGE_CARD_SOFT};
      }

      .investor-card--dark {
        background: ${PAGE_DARK_PANEL};
        border: 1px solid ${PAGE_DARK_LINE};
        box-shadow: none;
      }

      .investor-eyebrow {
        margin-bottom: 18px;
        font-family: ${MONO};
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: ${PAGE_TEAL};
      }

      .investor-title {
        margin: 0;
        font-family: ${SERIF};
        font-size: clamp(38px, 4.6vw, 74px);
        line-height: 0.98;
        letter-spacing: -0.045em;
        color: ${PAGE_INK};
      }

      .investor-title--dark {
        color: #f7f1e9;
      }

      .investor-body {
        margin: 0;
        font-size: clamp(18px, 1vw + 13px, 22px);
        line-height: 1.68;
        color: ${PAGE_SOFT};
      }

      .investor-section--dark .investor-body {
        color: ${PAGE_DARK_SOFT};
      }

      .investor-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
        gap: 36px;
        align-items: start;
      }

      .investor-hero-copy {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .investor-pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 6px;
      }

      .investor-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        border: 1px solid rgba(23, 20, 17, 0.14);
        background: rgba(255, 255, 255, 0.7);
        padding: 10px 14px;
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${PAGE_SOFT};
      }

      .investor-pill::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: ${PAGE_TEAL};
      }

      .investor-action-row {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .investor-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }

      .investor-button--primary {
        border: none;
        background: ${PAGE_INK};
        color: #fffaf4;
      }

      .investor-button--secondary {
        border: 1px solid ${PAGE_LINE};
        background: transparent;
        color: ${PAGE_INK};
      }

      .investor-hero-panel {
        position: relative;
        overflow: hidden;
        padding: 28px;
        min-height: 520px;
      }

      .investor-hero-panel::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at top left, rgba(92, 163, 246, 0.18), transparent 22%),
          radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.16), transparent 32%);
        pointer-events: none;
      }

      .architecture-shell {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 18px;
      }

      .architecture-band {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(10, 14, 18, 0.72);
        padding: 18px 20px;
      }

      .architecture-band__label {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.66);
        margin-bottom: 10px;
      }

      .architecture-band__name {
        font-family: ${SERIF};
        font-size: 30px;
        line-height: 1;
        color: #fff8ef;
        margin-bottom: 6px;
      }

      .architecture-band__body {
        font-size: 15px;
        line-height: 1.55;
        color: ${PAGE_DARK_SOFT};
      }

      .architecture-band__metric {
        min-width: 120px;
        text-align: right;
        font-family: ${SERIF};
        font-size: 52px;
        line-height: 0.88;
        color: ${PAGE_TEAL};
      }

      .architecture-flow {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        color: rgba(255, 255, 255, 0.38);
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .architecture-flow::before,
      .architecture-flow::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.12);
      }

      .signal-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-top: 28px;
      }

      .signal-card {
        padding: 22px;
      }

      .signal-card__label {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: ${PAGE_MUTED};
        margin-bottom: 14px;
      }

      .signal-card__value {
        font-family: ${SERIF};
        font-size: clamp(34px, 3vw, 50px);
        line-height: 0.95;
        color: ${PAGE_INK};
        margin-bottom: 8px;
      }

      .signal-card__detail {
        font-size: 15px;
        line-height: 1.6;
        color: ${PAGE_SOFT};
      }

      .loop-grid,
      .asset-grid,
      .pricing-grid,
      .characteristics-grid,
      .contact-grid {
        display: grid;
        gap: 22px;
      }

      .loop-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 30px;
      }

      .asset-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 34px;
      }

      .pricing-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 30px;
      }

      .characteristics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 24px;
      }

      .contact-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 28px;
      }

      .loop-card,
      .asset-card,
      .pricing-card,
      .characteristic-card,
      .contact-card,
      .morrison-panel {
        padding: 26px;
      }

      .loop-card__step,
      .asset-card__meta,
      .pricing-card__meta,
      .morrison-meta,
      .contact-meta {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: ${PAGE_TEAL};
        margin-bottom: 14px;
      }

      .loop-card__title,
      .asset-card__name,
      .pricing-card__name,
      .contact-title {
        font-size: clamp(22px, 1.1vw + 18px, 30px);
        line-height: 1.14;
        font-weight: 700;
        margin-bottom: 12px;
        color: inherit;
      }

      .loop-card__body,
      .asset-card__body,
      .pricing-card__detail,
      .contact-copy {
        font-size: 16px;
        line-height: 1.65;
        color: inherit;
      }

      .asset-card__counter,
      .pricing-card__fee,
      .morrison-hero {
        font-family: ${SERIF};
        font-size: clamp(44px, 4vw, 70px);
        line-height: 0.92;
        letter-spacing: -0.04em;
        margin-bottom: 12px;
      }

      .asset-card__unit,
      .pricing-card__hours,
      .morrison-subhero {
        font-family: ${MONO};
        font-size: 12px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: ${PAGE_MUTED};
        margin-bottom: 16px;
      }

      .investor-section--dark .asset-card__unit,
      .investor-section--dark .pricing-card__hours,
      .investor-section--dark .morrison-subhero {
        color: rgba(255, 255, 255, 0.52);
      }

      .asset-card__stat {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid ${PAGE_LINE};
        font-family: ${MONO};
        font-size: 12px;
        color: ${PAGE_SOFT};
      }

      .investor-section--dark .asset-card__stat {
        border-top-color: ${PAGE_DARK_LINE};
        color: ${PAGE_DARK_SOFT};
      }

      .pricing-card {
        position: relative;
        overflow: hidden;
      }

      .pricing-card--featured {
        border-color: rgba(20, 184, 166, 0.46);
        box-shadow: 0 26px 90px rgba(20, 184, 166, 0.16);
      }

      .pricing-card--featured::before {
        content: 'Investor anchor tier';
        position: absolute;
        top: 18px;
        right: 18px;
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(20, 184, 166, 0.12);
        color: ${PAGE_TEAL};
        font-family: ${MONO};
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .pricing-list {
        display: grid;
        gap: 12px;
        margin-top: 22px;
      }

      .pricing-list__item {
        display: grid;
        gap: 4px;
        padding-top: 12px;
        border-top: 1px solid ${PAGE_LINE};
      }

      .investor-section--dark .pricing-list__item {
        border-top-color: ${PAGE_DARK_LINE};
      }

      .pricing-list__label {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: ${PAGE_MUTED};
      }

      .investor-section--dark .pricing-list__label {
        color: rgba(255, 255, 255, 0.48);
      }

      .pricing-list__value {
        font-size: 15px;
        line-height: 1.5;
      }

      .commercial-note {
        margin-top: 18px;
        padding: 18px 20px;
        border-radius: 20px;
        border: 1px solid rgba(20, 184, 166, 0.2);
        background: rgba(20, 184, 166, 0.08);
        font-size: 16px;
        line-height: 1.66;
      }

      .morrison-layout {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 24px;
        margin-top: 34px;
      }

      .morrison-stack {
        display: grid;
        gap: 16px;
      }

      .timeline-list,
      .characteristic-list,
      .why-list {
        display: grid;
        gap: 14px;
      }

      .timeline-item,
      .characteristic-item,
      .why-item {
        display: grid;
        gap: 6px;
        padding-bottom: 14px;
        border-bottom: 1px solid ${PAGE_LINE};
      }

      .timeline-item:last-child,
      .characteristic-item:last-child,
      .why-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .timeline-item__row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: baseline;
      }

      .timeline-item__label {
        font-size: 15px;
        line-height: 1.5;
        color: ${PAGE_SOFT};
      }

      .timeline-item__value {
        font-family: ${MONO};
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: ${PAGE_TEAL};
        white-space: nowrap;
      }

      .morrison-table {
        width: 100%;
        border-collapse: collapse;
      }

      .morrison-table th,
      .morrison-table td {
        text-align: left;
        vertical-align: top;
        padding: 16px 0;
        border-bottom: 1px solid ${PAGE_LINE};
      }

      .morrison-table th {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: ${PAGE_MUTED};
      }

      .morrison-table td {
        font-size: 15px;
        line-height: 1.56;
        color: ${PAGE_SOFT};
      }

      .morrison-table tr:last-child td {
        border-bottom: none;
      }

      .morrison-table__value {
        font-family: ${SERIF};
        font-size: 28px;
        line-height: 1;
        color: ${PAGE_INK};
      }

      .why-layout {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 26px;
        align-items: start;
      }

      .deferred-card {
        padding: 28px;
        border-radius: 28px;
        border: 1px solid rgba(217, 134, 61, 0.28);
        background: linear-gradient(180deg, rgba(255, 250, 244, 0.98) 0%, rgba(242, 231, 218, 0.92) 100%);
      }

      .deferred-card__meta {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: ${PAGE_AMBER};
        margin-bottom: 14px;
      }

      .deferred-card__title {
        font-family: ${SERIF};
        font-size: clamp(30px, 2.4vw, 44px);
        line-height: 0.98;
        letter-spacing: -0.04em;
        margin: 0 0 14px;
      }

      .deferred-card__body {
        font-size: 16px;
        line-height: 1.68;
        color: ${PAGE_SOFT};
      }

      .contact-anchor {
        color: ${PAGE_INK};
        text-decoration: none;
      }

      @media (max-width: 1120px) {
        .investor-hero,
        .morrison-layout,
        .why-layout {
          grid-template-columns: 1fr;
        }

        .signal-strip,
        .loop-grid,
        .pricing-grid,
        .contact-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 860px) {
        .investor-container {
          width: min(100vw - 32px, 100%);
        }

        .investor-section {
          padding: 72px 0;
        }

        .signal-strip,
        .loop-grid,
        .asset-grid,
        .pricing-grid,
        .characteristics-grid,
        .contact-grid {
          grid-template-columns: 1fr;
        }

        .architecture-band {
          grid-template-columns: 1fr;
        }

        .architecture-band__metric {
          text-align: left;
        }

        .timeline-item__row {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .investor-shell,
        .investor-section--dark,
        .investor-hero-panel::before {
          scroll-behavior: auto;
        }
      }
    `,
      }}
    />
  )
}

export default async function InvestorsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { access } = await searchParams
  const expectedToken = process.env.INVESTOR_ACCESS_TOKEN?.trim()
  const tokenMatches = !!expectedToken && access === expectedToken

  let hasSession = false
  try {
    const user = await currentUser()
    hasSession = !!user
  } catch {
    hasSession = false
  }

  if (!tokenMatches && !hasSession) {
    notFound()
  }

  return (
    <div className="investor-shell">
      <InvestorStyles />
      <AbarvaNav activePage="investor" />

      <main>
        <section className="investor-section investor-section--tight">
          <div className="investor-container">
            <div className="investor-hero">
              <div className="investor-hero-copy">
                <SectionEyebrow>Warm-intro investor materials</SectionEyebrow>
                <h1 className="investor-title">
                  A transformation-intelligence platform with software margins and consulting gravity.
                </h1>
                <p className="investor-body">
                  Harvey proved a workflow-native AI system can become the operating layer for a high-value
                  professional category. AbarVa applies that same thesis to enterprise transformation, but with
                  a dual-product model: Control Tower creates the buying signal, Engagements monetize the
                  contradiction, and the intelligence layer compounds underneath both.
                </p>
                <div className="investor-pill-row">
                  <span className="investor-pill">Investor-only access</span>
                  <span className="investor-pill">Architecture + pricing in one surface</span>
                  <span className="investor-pill">Platform fee model · no usage surcharge</span>
                </div>
                <div className="investor-action-row">
                  <a className="investor-button investor-button--primary" href="#commercial-model">
                    See commercial model
                  </a>
                  <a
                    className="investor-button investor-button--secondary"
                    href="mailto:anand@abarva.ai?subject=AbarVa%20investor%20materials"
                  >
                    Request diligence package
                  </a>
                </div>
              </div>

              <div className="investor-card investor-card--dark investor-hero-panel">
                <div className="architecture-shell">
                  <div className="architecture-band">
                    <div>
                      <div className="architecture-band__label">Layer 1 · Genome</div>
                      <div className="architecture-band__name">Observed patterns with reuse rights.</div>
                      <div className="architecture-band__body">
                        Cross-tenant, anonymized, curated intelligence with intervention success rates and
                        promotion thresholds.
                      </div>
                    </div>
                    <div className="architecture-band__metric">47</div>
                  </div>

                  <div className="architecture-flow">patterns promote upward</div>

                  <div className="architecture-band">
                    <div>
                      <div className="architecture-band__label">Layer 2 · Client contributed</div>
                      <div className="architecture-band__name">Evidence, decisions, and stakeholder memory.</div>
                      <div className="architecture-band__body">
                        Per-tenant working memory with provenance, sensitivity controls, and source-of-record
                        discipline.
                      </div>
                    </div>
                    <div className="architecture-band__metric">187</div>
                  </div>

                  <div className="architecture-flow">agents orchestrate above the spine</div>

                  <div className="architecture-band">
                    <div>
                      <div className="architecture-band__label">Agent layer · Nexus · Sentinel · Atlas · Steward</div>
                      <div className="architecture-band__name">Capability with refusals.</div>
                      <div className="architecture-band__body">
                        Four specialist agents coordinate program execution, pattern detection, tower oversight,
                        and provenance enforcement without freelancing outside governance.
                      </div>
                    </div>
                    <div className="architecture-band__metric">4</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="signal-strip">
              {investorSignals.map((signal) => (
                <div className="investor-card signal-card" key={signal.label}>
                  <div className="signal-card__label">{signal.label}</div>
                  <div className="signal-card__value">{signal.value}</div>
                  <div className="signal-card__detail">{signal.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="investor-section investor-section--dark">
          <div className="investor-container">
            <SectionEyebrow>Two-product compounding loop</SectionEyebrow>
            <SectionTitle dark>
              Tower creates the buying signal. Engagements monetize it. The data moat compounds from both.
            </SectionTitle>
            <div className="loop-grid">
              {loopSteps.map((step) => (
                <div className="investor-card investor-card--dark loop-card" key={step.step}>
                  <div className="loop-card__step">Step {step.step}</div>
                  <div className="loop-card__title">{step.title}</div>
                  <div className="loop-card__body">{step.body}</div>
                </div>
              ))}
            </div>
            <div className="commercial-note">
              This is the business model in plain English: Tower makes the contradiction legible, Engagements
              turns it into a live program, and verified evidence enriches the platform so the next client starts
              ahead of the last one.
            </div>
          </div>
        </section>

        <section className="investor-section">
          <div className="investor-container">
            <SectionEyebrow>Architecture as moat</SectionEyebrow>
            <SectionTitle>
              The defensibility is not the prompt. It is the observed system underneath the interface.
            </SectionTitle>
            <div className="asset-grid">
              {architectureAssets.map((asset) => (
                <div className="investor-card asset-card" key={asset.name}>
                  <div className="asset-card__meta">Proprietary asset</div>
                  <div className="asset-card__counter">{asset.counter}</div>
                  <div className="asset-card__unit">{asset.unit}</div>
                  <div className="asset-card__name">{asset.name}</div>
                  <div className="asset-card__body">{asset.body}</div>
                  <div className="asset-card__stat">{asset.stat}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="investor-section investor-section--dark" id="commercial-model">
          <div className="investor-container">
            <SectionEyebrow>Commercial model · tiered platform fees</SectionEyebrow>
            <SectionTitle dark>How AbarVa earns revenue.</SectionTitle>
            <p className="investor-body" style={{ maxWidth: 980, marginTop: 20 }}>
              AbarVa is sold as a tiered annual platform subscription. Every tier includes full platform access:
              unlimited business units, unlimited programs, complete Genome library, all four agents, the full
              Evidence Ledger, and the Decision Archive. Pricing scales with bundled maestro hours and deployment
              depth, not with platform capability.
            </p>
            <p className="investor-body" style={{ maxWidth: 980, marginTop: 16 }}>
              Compute and LLM usage are direct-billed to the client by the underlying provider at cost. AbarVa
              does not meter consumption or surcharge usage. Third-party software or specialist vendor fees remain
              paid direct by the client to the vendor of record.
            </p>

            <div className="pricing-grid">
              {tiers.map((tier) => (
                <div
                  className={`investor-card investor-card--dark pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}
                  key={tier.name}
                >
                  <div className="pricing-card__meta">{tier.name}</div>
                  <div className="pricing-card__fee">{tier.fee}</div>
                  <div className="pricing-card__hours">{tier.hours} bundled maestro time</div>
                  <div className="pricing-card__name">{tier.fit}</div>
                  <div className="pricing-list">
                    <div className="pricing-list__item">
                      <div className="pricing-list__label">Deployment</div>
                      <div className="pricing-list__value">{tier.deployment}</div>
                    </div>
                    <div className="pricing-list__item">
                      <div className="pricing-list__label">Assignment</div>
                      <div className="pricing-list__value">{tier.assignment}</div>
                    </div>
                    <div className="pricing-list__item">
                      <div className="pricing-list__label">Seniority mix</div>
                      <div className="pricing-list__value">{tier.seniority}</div>
                    </div>
                    <div className="pricing-list__item">
                      <div className="pricing-list__label">Platform access</div>
                      <div className="pricing-list__value">Full platform · unlimited BUs + programs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="commercial-note" style={{ marginTop: 24 }}>
              Overage maestro time beyond the bundled allocation is billed at <strong>$350-$495 per hour</strong>,
              depending on seniority of the expert assigned. Specialist industry advisors and additional tenant
              deployments are priced separately.
            </div>
          </div>
        </section>

        <section className="investor-section">
          <div className="investor-container">
            <SectionEyebrow>Morrison worked example · Enterprise tier</SectionEyebrow>
            <SectionTitle>
              Enterprise pricing is legible when you map the actual program lifecycle, not just the sticker price.
            </SectionTitle>

            <div className="morrison-layout">
              <div className="morrison-stack">
                <div className="investor-card morrison-panel">
                  <div className="morrison-meta">Composite program</div>
                  <div className="morrison-hero">Morrison</div>
                  <div className="morrison-subhero">Owned Brand Margin Recovery · Enterprise tier</div>
                  <div className="timeline-list">
                    {lifecycleAllocation.map(([label, value]) => (
                      <div className="timeline-item" key={label}>
                        <div className="timeline-item__row">
                          <div className="timeline-item__label">{label}</div>
                          <div className="timeline-item__value">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="investor-card morrison-panel investor-card--soft">
                <div className="morrison-meta">Year 1 cost structure</div>
                <table className="morrison-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Value</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {morrisonCostRows.map(([line, value, notes]) => (
                      <tr key={line}>
                        <td>{line}</td>
                        <td className="morrison-table__value">{value}</td>
                        <td>{notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="investor-section investor-section--dark">
          <div className="investor-container">
            <SectionEyebrow>Revenue characteristics</SectionEyebrow>
            <SectionTitle dark>Predictable ARR first. Outcome-share optionality later.</SectionTitle>
            <div className="characteristics-grid">
              {revenueCharacteristics.map((item) => (
                <div className="investor-card investor-card--dark characteristic-card" key={item}>
                  <div className="characteristic-item">
                    <div className="loop-card__step">Investor read</div>
                    <div className="loop-card__body">{item}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="investor-section">
          <div className="investor-container">
            <div className="why-layout">
              <div>
                <SectionEyebrow>Why not outcome-share right now</SectionEyebrow>
                <div className="deferred-card">
                  <div className="deferred-card__meta">Deferred, not denied</div>
                  <h3 className="deferred-card__title">Current design preserves the option without forcing it.</h3>
                  <div className="deferred-card__body">
                    The product-market logic supports outcome-share pricing at scale, but the current attribution
                    chain is not yet mature enough to support it contractually across every new customer. Predictable
                    ARR is the right bet for years 1-3. Outcome-share becomes a premium option once Genome
                    calibration is tighter, Evidence Ledger discipline is proven across 20+ completed programs,
                    and at least one settlement has been executed under contract.
                  </div>
                </div>
              </div>

              <div>
                <SectionEyebrow>Why us, why now</SectionEyebrow>
                <div className="investor-card morrison-panel">
                  <div className="why-list">
                    {whyNow.map((item, index) => (
                      <div className="why-item" key={item}>
                        <div className="loop-card__step">Signal {index + 1}</div>
                        <div className="loop-card__body">{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="investor-section">
          <div className="investor-container">
            <SectionEyebrow>Contact</SectionEyebrow>
            <SectionTitle>Warm intros preferred. Diligence materials available on request.</SectionTitle>
            <div className="contact-grid">
              <div className="investor-card contact-card">
                <div className="contact-meta">Investment inquiries</div>
                <div className="contact-title">anand@abarva.ai</div>
                <a
                  className="investor-button investor-button--primary"
                  href="mailto:anand@abarva.ai?subject=AbarVa%20investor%20materials"
                >
                  Request investor materials
                </a>
              </div>
              <div className="investor-card contact-card">
                <div className="contact-meta">Design partner track</div>
                <div className="contact-title">partners@abarva.ai</div>
                <a
                  className="investor-button investor-button--secondary"
                  href="mailto:partners@abarva.ai?subject=Design%20partner%20interest"
                >
                  Apply
                </a>
              </div>
              <div className="investor-card contact-card">
                <div className="contact-meta">Warm intro preference</div>
                <div className="contact-copy">
                  Preferred via Shail Jain, Anthology Fund contacts, or existing design-partner relationships.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
