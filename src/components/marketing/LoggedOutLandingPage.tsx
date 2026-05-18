'use client'

import Image from 'next/image'
import Link from 'next/link'

import { MarketingNav } from './MarketingNav'

type LoggedOutLandingPageProps = {
  signedOut?: boolean
}

const valueRows = [
  ['Avoid failed AI spend', 'Catch weak sponsorship, poor data readiness, and overbuilt ideas before money moves.'],
  ['Shape better moves', 'Turn AI ideas into scoped bets with owner, workflow, evidence, sourcing path, and value model.'],
  ['Verify outcomes', 'Track projected, observed, and finance-validatable value in one operating view.'],
]

const journey = [
  ['Intelligence', 'Ask Sentinel what is worth doing and why.'],
  ['Moves', 'Create the bet, pressure-test scope, sponsor, business case, and gates.'],
  ['Source', 'Run vendor and SI selection with evidence, not sales theater.'],
]

export function LoggedOutLandingPage({ signedOut = false }: LoggedOutLandingPageProps) {
  return (
    <main className="logged-out-shell">
      <style jsx global>{`
        .logged-out-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at 82% 8%, rgba(17, 19, 24, 0.07), transparent 30%),
            linear-gradient(180deg, #ffffff 0%, #f8f7f4 100%);
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
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
          padding: clamp(18px, 2vw, 28px);
        }

        .console-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-bottom: 1px solid #e6ebf2;
          padding-bottom: 18px;
          margin-bottom: 20px;
        }

        .console-title {
          font-size: 13px;
          font-weight: 800;
          color: #101828;
        }

        .console-subtitle {
          margin-top: 3px;
          color: #667085;
          font-size: 12px;
          line-height: 1.4;
        }

        .badge {
          border-radius: 999px;
          background: #ecfdf3;
          color: #027a48;
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
          border: 1px solid #e6ebf2;
          border-radius: 14px;
          background: #fbfcfe;
          padding: 13px;
        }

        .layer strong {
          color: #111318;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .layer span {
          color: #344054;
          font-size: 13px;
          line-height: 1.45;
        }

        .outcomes {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .metric {
          border-radius: 16px;
          background: #07111f;
          color: #ffffff;
          padding: 16px;
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

          .row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
      `}</style>

      <div className="frame">
        <header className="nav">
          <Link href="/" aria-label="AbarVa home">
            <Image
              src="/brand/abarva-logo-lockup-v2.svg"
              alt="AbarVa"
              width={166}
              height={36}
              priority
              style={{ display: 'block' }}
            />
          </Link>
          <MarketingNav ctaHref="/sign-in" ctaLabel="Request demo" />
        </header>

        <section className="hero">
          <div>
            <div className="eyebrow"><span className="pulse" /> Private CXO preview</div>
            <h1>AbarVa turns AI ambition into verified enterprise value.</h1>
            <p className="lead">
              It is a working AI Success Platform for leaders deciding which AI bets to fund,
              how to shape them, who should sponsor them, which vendors to trust, and whether
              the value actually landed.
            </p>
            <div className="actions">
              <Link href="/sign-in" className="button button-primary">Enter client workspace</Link>
              <Link href="/product" className="button button-secondary">Review product story</Link>
            </div>
            {signedOut && (
              <div className="signed-out-note">
                You are signed out. The active workspace context has been cleared; use the private
                credentials from your invite to re-enter.
              </div>
            )}
          </div>

          <aside className="console" aria-label="AbarVa operating model">
            <div className="console-top">
              <div>
                <div className="console-title">Human maestro + agent system</div>
                <div className="console-subtitle">Strategy, moves, sourcing, and value tracking in one loop.</div>
              </div>
              <div className="badge">Live product</div>
            </div>
            <div className="architecture">
              <div className="layer"><strong>01 Intel</strong><span>Tenant context, industry corpus, graph, vectors, and operating facts.</span></div>
              <div className="layer"><strong>02 Moves</strong><span>AI bets shaped through sponsor, scope, data, workflow, and gate discipline.</span></div>
              <div className="layer"><strong>03 Source</strong><span>Vendor and SI decisions grounded in evidence, risk, economics, and fit.</span></div>
              <div className="layer"><strong>04 Tower</strong><span>Outcome tracking, portfolio signals, spend, adoption, and contradictions.</span></div>
            </div>
            <div className="outcomes">
              <div className="metric"><strong>$18M+</strong><span>Illustrative annual value potential from reduced failure and rework.</span></div>
              <div className="metric"><strong>2x</strong><span>Faster path from idea to decision-ready Move.</span></div>
              <div className="metric"><strong>1</strong><span>Evidence trail from question to funded outcome.</span></div>
            </div>
          </aside>
        </section>

        <section className="section-grid">
          <div className="panel">
            <h2>What the preview should prove.</h2>
            <p className="panel-copy">
              This is not demoware. The product runs as a real multi-tenant application with
              authenticated client workspaces, Postgres-backed operating data, graph and vector
              retrieval, and agent surfaces for Intelligence, Moves, Source, and Tower.
            </p>
            <div className="mobile-note">
              On mobile, invited users should see this crisp product promise, sign in, and scan
              the story. The full boardroom demo should still happen on desktop for workbench flows.
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
