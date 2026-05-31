'use client'

import Image from 'next/image'
import Link from 'next/link'

import { AbarVaLogo } from '@/components/abarva/AbarVaLogo'
import { MarketingNav } from './MarketingNav'

type LoggedOutLandingPageProps = {
  signedOut?: boolean
}

const valueRows = [
  ['Avoid failed AI spend', 'Catch weak sponsorship, poor data readiness, unclear workflow ownership, and overbuilt ideas before money moves.'],
  ['Shape better moves', 'Turn AI ideas into scoped bets with sponsor, value model, risk logic, adoption plan, sourcing path, and approval gates.'],
  ['Buy with leverage', 'Frame RFPs, score vendors, pressure-test SI claims, and negotiate productivity, risk, data, and outcome commitments.'],
  ['Verify outcomes', 'Track projected, observed, and finance-validatable value in one operating view after launch.'],
]

const journey = [
  ['Context', 'Load client systems, vendors, initiatives, KPIs, contracts, risks, and operating facts.'],
  ['Intelligence', 'Ask Sentinel what is worth doing, what evidence is missing, and which failure modes matter.'],
  ['Moves', 'Use Nexus to shape the bet, pressure-test scope, sponsor, business case, adoption, and gates.'],
  ['Source', 'Run vendor and SI selection with evidence, not sales theater.'],
  ['Tower', 'Track realized value, blockers, dependencies, risk, and executive pressure.'],
]

const cockpitMetrics = [
  ['$ value', 'protected, created, and verified across AI moves'],
  ['Failure risk', 'caught before ideas become funded programs'],
  ['4 gates', 'evidence, value, risk, and adoption before funding'],
  ['1 trail', 'question to answer to artifact to value outcome'],
] as const

const successLoop = [
  ['Select', 'Fund the AI bets with real business value and readiness.'],
  ['De-risk', 'Detect weak sponsorship, data gaps, vendor traps, and adoption failure modes.'],
  ['Mobilize', 'Generate the artifacts, gates, sourcing packs, and operating model needed to execute.'],
  ['Prove', 'Track value realization, blockers, pressure, and finance-validatable outcomes.'],
] as const

export function LoggedOutLandingPage({ signedOut = false }: LoggedOutLandingPageProps) {
  return (
    <main className="logged-out-shell">
      <style jsx global>{`
        .logged-out-shell {
          min-height: 100vh;
          background:
            linear-gradient(90deg, rgba(17, 19, 24, 0.045) 1px, transparent 1px),
            linear-gradient(180deg, rgba(17, 19, 24, 0.035) 1px, transparent 1px),
            linear-gradient(180deg, #ffffff 0%, #f8f7f4 100%);
          background-size: 72px 72px, 72px 72px, auto;
          color: #0b1220;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .frame {
          width: min(100%, 1440px);
          margin: 0 auto;
          padding: 24px clamp(18px, 4vw, 56px) 42px;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          min-height: 58px;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(360px, 0.98fr);
          gap: clamp(28px, 5vw, 72px);
          align-items: center;
          padding: clamp(42px, 7vw, 88px) 0 48px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          width: fit-content;
          margin-bottom: 18px;
          border: 1px solid rgba(17, 19, 24, 0.14);
          border-radius: 999px;
          background: rgba(17, 19, 24, 0.06);
          color: #111318;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #111318;
          box-shadow: 0 0 0 5px rgba(17, 19, 24, 0.10);
        }

        h1 {
          max-width: 760px;
          margin: 0;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(42px, 7vw, 86px);
          line-height: 0.98;
          letter-spacing: -0.035em;
          font-weight: 650;
        }

        .lead {
          max-width: 710px;
          margin: 22px 0 0;
          color: #344054;
          font-size: clamp(17px, 1.2vw, 20px);
          line-height: 1.68;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 750;
        }

        .button-primary {
          background: #111318;
          color: #ffffff;
        }

        .button-secondary {
          border: 1px solid #d0d7e2;
          background: #ffffff;
          color: #0b1220;
        }

        .signed-out-note {
          margin-top: 20px;
          max-width: 620px;
          border-left: 3px solid #111318;
          background: #ffffff;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
          padding: 14px 16px;
          color: #475467;
          font-size: 13px;
          line-height: 1.55;
        }

        .console {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 28px;
          background: #05070b;
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
          padding: clamp(18px, 2vw, 28px);
        }

        .console::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(0, 102, 204, 0.28), transparent 34%),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.045) 0, rgba(255, 255, 255, 0.045) 1px, transparent 1px, transparent 48px);
          pointer-events: none;
        }

        .console > * {
          position: relative;
        }

        .console-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          padding-bottom: 18px;
          margin-bottom: 20px;
        }

        .hero-photo-wrap {
          position: relative;
          min-height: 262px;
          margin: -8px -8px 22px;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: #111318;
        }

        .hero-photo-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(5, 7, 11, 0.04), rgba(5, 7, 11, 0.68)),
            linear-gradient(90deg, rgba(5, 7, 11, 0.45), transparent 55%);
        }

        .photo-caption {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 16px;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          align-items: end;
        }

        .photo-caption strong {
          display: block;
          color: #ffffff;
          font-size: 16px;
          line-height: 1.25;
        }

        .photo-caption span {
          display: block;
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
          line-height: 1.45;
        }

        .photo-chip {
          border-radius: 999px;
          background: rgba(0, 102, 204, 0.84);
          color: #ffffff;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .console-title {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
        }

        .console-subtitle {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 12px;
          line-height: 1.4;
        }

        .badge {
          border-radius: 999px;
          background: rgba(0, 102, 204, 0.22);
          color: #b9dcff;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .architecture {
          display: grid;
          gap: 10px;
        }

        .layer {
          display: grid;
          grid-template-columns: 84px 1fr;
          gap: 14px;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          padding: 13px;
        }

        .layer strong {
          color: #8ac3ff;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .layer span {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          line-height: 1.45;
        }

        .outcomes {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .metric {
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
          padding: 16px;
        }

        .metric:first-child {
          background: linear-gradient(180deg, rgba(0, 102, 204, 0.34), rgba(255, 255, 255, 0.07));
        }

        .metric strong {
          display: block;
          font-family: Fraunces, Georgia, serif;
          font-size: 28px;
          line-height: 1;
        }

        .metric span {
          display: block;
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          line-height: 1.35;
        }

        .section-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: 28px;
          align-items: start;
          padding: 16px 0 52px;
        }

        .panel {
          border: 1px solid #e1e7ef;
          border-radius: 22px;
          background: #ffffff;
          padding: clamp(20px, 2.3vw, 28px);
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
        }

        h2 {
          margin: 0 0 12px;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1.08;
          letter-spacing: -0.02em;
        }

        .panel-copy {
          margin: 0;
          color: #475467;
          font-size: 15px;
          line-height: 1.65;
        }

        .rows {
          display: grid;
          gap: 10px;
        }

        .row {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 16px;
          border-bottom: 1px solid #edf1f6;
          padding: 14px 0;
        }

        .row:last-child {
          border-bottom: 0;
        }

        .row strong {
          color: #101828;
          font-size: 13px;
        }

        .row span {
          color: #475467;
          font-size: 13px;
          line-height: 1.55;
        }

        .mobile-note {
          margin-top: 14px;
          border-radius: 16px;
          background: #fbfaf7;
          border: 1px solid #d9d6cd;
          padding: 16px;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.55;
        }

        .journey-strip {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin: -18px 0 52px;
        }

        .journey-card {
          position: relative;
          min-height: 148px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.055);
          padding: 16px;
          overflow: hidden;
        }

        .journey-card:last-child {
          background: #111318;
          color: #ffffff;
        }

        .journey-card small {
          display: block;
          margin-bottom: 30px;
          color: #0066cc;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.1em;
        }

        .journey-card:last-child small {
          color: #8ac3ff;
        }

        .journey-card strong {
          display: block;
          font-size: 17px;
          margin-bottom: 8px;
        }

        .journey-card span {
          display: block;
          color: #475467;
          font-size: 12px;
          line-height: 1.45;
        }

        .journey-card:last-child span {
          color: rgba(255, 255, 255, 0.68);
        }

        .journey-card:not(:last-child)::after {
          content: "→";
          position: absolute;
          top: 16px;
          right: 16px;
          color: #0066cc;
          font-weight: 900;
        }

        @media (max-width: 920px) {
          .hero,
          .section-grid {
            grid-template-columns: 1fr;
          }

          .hero {
            padding-top: 30px;
          }
        }

        @media (max-width: 680px) {
          .frame {
            padding: 18px 16px 30px;
          }

          h1 {
            font-size: clamp(40px, 13vw, 58px);
            letter-spacing: -0.03em;
          }

          .lead {
            font-size: 16px;
            line-height: 1.6;
          }

          .actions,
          .button {
            width: 100%;
          }

          .button {
            min-height: 48px;
          }

          .console {
            border-radius: 22px;
          }

          .hero-photo-wrap {
            min-height: 198px;
          }

          .photo-caption {
            grid-template-columns: 1fr;
          }

          .console-top {
            align-items: flex-start;
          }

          .layer {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .outcomes {
            grid-template-columns: 1fr;
          }

          [aria-label='AI success loop'] {
            grid-template-columns: 1fr !important;
            margin-top: 0 !important;
          }

          .journey-strip {
            grid-template-columns: 1fr;
            margin-top: 0;
          }

          .row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
      `}</style>

      <div className="frame">
        <header className="nav">
          <Link href="/" aria-label="AbarVa home">
            <AbarVaLogo
              variant="wordmark"
              size="md"
              label="AbarVa"
              style={{ height: 26, width: 'auto' }}
            />
          </Link>
          <MarketingNav ctaHref="/contact/" ctaLabel="Request access" />
        </header>

        <section className="hero">
          <div>
            <div className="eyebrow"><span className="pulse" /> AI Success Platform</div>
            <h1>AbarVa turns AI ambition into verified business value.</h1>
            <p className="lead">
              AbarVa helps leaders select the right AI bets, avoid expensive failure modes,
              shape execution-ready Moves, source with leverage, and prove whether the value
              actually landed.
            </p>
            <div className="actions">
              <Link href="/contact/" className="button button-primary">Request access</Link>
              <Link href="/sign-in" className="button button-secondary">Sign in</Link>
            </div>
            {signedOut && (
              <div className="signed-out-note">
                You are signed out. The active workspace context has been cleared; use the private
                credentials from your invite to re-enter.
              </div>
            )}
          </div>

          <aside className="console" aria-label="AbarVa operating model">
            <div className="hero-photo-wrap" aria-label="Executive AI success platform workshop">
              <Image
                src="/marketing/ai-success-platform-boardroom.png"
                alt="Executives reviewing AI initiative outcomes, risk gates, sourcing decisions, and value realization metrics."
                fill
                priority
                sizes="(max-width: 920px) 100vw, 48vw"
                style={{ objectFit: 'cover' }}
              />
              <div className="photo-caption">
                <div>
                  <strong>From AI idea to funded, governed, value-tracked move.</strong>
                  <span>Human executives and agents working from the same evidence base.</span>
                </div>
                <div className="photo-chip">Failure avoidance</div>
              </div>
            </div>
            <div className="console-top">
              <div>
              <div className="console-title">Outcome cockpit</div>
              <div className="console-subtitle">Failure avoidance and value realization in one loop.</div>
              </div>
              <div className="badge">Private workspace</div>
            </div>
            <div className="architecture">
              <div className="layer"><strong>01 Context</strong><span>Client systems, vendors, initiatives, KPIs, contracts, risks, and evidence.</span></div>
              <div className="layer"><strong>02 Intel</strong><span>Agent reasoning grounded in client facts, relevant patterns, and missing evidence.</span></div>
              <div className="layer"><strong>03 Moves</strong><span>AI bets shaped through sponsor, scope, data, workflow, value, and gates.</span></div>
              <div className="layer"><strong>04 Source</strong><span>Vendor and SI decisions grounded in evidence, risk, economics, and fit.</span></div>
            </div>
            <div className="outcomes">
              {cockpitMetrics.map(([metric, label]) => (
                <div className="metric" key={label}>
                  <strong>{metric}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section
          aria-label="AI success loop"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            margin: '-18px 0 34px',
          }}
        >
          {successLoop.map(([title, body]) => (
            <div
              key={title}
              style={{
                border: '1px solid rgba(15, 23, 42, 0.12)',
                borderRadius: 18,
                background: 'rgba(255, 255, 255, 0.68)',
                boxShadow: '0 18px 44px rgba(15, 23, 42, 0.045)',
                padding: 18,
              }}
            >
              <strong style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>{title}</strong>
              <span style={{ display: 'block', color: '#475467', fontSize: 13, lineHeight: 1.5 }}>
                {body}
              </span>
            </div>
          ))}
        </section>

        <section className="journey-strip" aria-label="AbarVa value journey">
          {journey.map(([title, body], index) => (
            <div className="journey-card" key={title}>
              <small>0{index + 1}</small>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </section>

        <section className="section-grid">
          <div className="panel">
            <h2>What the public page should prove.</h2>
            <p className="panel-copy">
              AbarVa is not another chatbot or project tracker. It is a decision-grade operating
              system for enterprise AI: outcome-first, evidence-governed, human-approved, and
              designed to turn ambition into funded, sourced, adopted, and measured Moves.
            </p>
            <div className="mobile-note">
              Detailed training, corpus coverage, client primers, datasets, architecture, and
              generated artifacts stay inside authenticated or controlled-access workspaces.
            </div>
          </div>

          <div className="panel">
            <div className="rows">
              {valueRows.map(([title, body]) => (
                <div className="row" key={title}>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              ))}
              {journey.map(([title, body]) => (
                <div className="row" key={title}>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
