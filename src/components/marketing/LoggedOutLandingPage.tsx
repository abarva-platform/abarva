'use client'

import Image from 'next/image'
import Link from 'next/link'

import { MarketingNav } from './MarketingNav'

type LoggedOutLandingPageProps = {
  signedOut?: boolean
}

const valueRows = [
  ['Avoid failed AI spend', 'Catch weak sponsorship, poor data readiness, unclear workflow ownership, and overbuilt ideas before money moves.'],
  ['Shape better moves', 'Turn AI ideas into scoped bets with sponsor, value model, risk logic, adoption plan, sourcing path, and approval gates.'],
  ['Buy with leverage', 'Frame RFPs, score vendors, pressure-test SI claims, and negotiate productivity, risk, data, and outcome commitments.'],
  ['Verify outcomes', 'Track projected, observed, and finance-validatable value in one operating view after launch.'],
] as const

const journey = [
  ['Context', 'Load systems, vendors, initiatives, KPIs, contracts, risks, operating facts, and evidence templates.'],
  ['Intelligence', 'Ask Sentinel what is worth doing, what evidence is missing, and which failure modes matter.'],
  ['Moves', 'Use Nexus to shape the bet through sponsor, scope, workflow, value, risk, adoption, and approval gates.'],
  ['Source', 'Run vendor and SI decisions with leverage, not sales theater.'],
  ['Tower', 'Track realized value, blockers, dependencies, risk, and executive pressure.'],
] as const

const proofMetrics = [
  ['$ value', 'protected, created, and verified'],
  ['Failure risk', 'caught before funding'],
  ['4 gates', 'evidence, value, risk, adoption'],
  ['1 trail', 'question to artifact to outcome'],
] as const

const dashboardSignals = [
  ['Sourcing savings', '$9.8M vendor and SI leverage identified'],
  ['Failure exposure', '18 risks caught before funding'],
  ['Tower action', '7 moves redirected, cut, or advanced'],
] as const

const valueStages = ['Context', 'Intelligence', 'Moves', 'Source', 'Tower'] as const

const operatingSystem = [
  ['Select', 'Prioritize the AI bets where value, urgency, and readiness intersect.'],
  ['De-risk', 'Expose missing evidence, weak ownership, vendor traps, and adoption failure modes.'],
  ['Mobilize', 'Generate the artifacts, gates, sourcing packs, and operating model needed to execute.'],
  ['Prove', 'Measure value realization, pressure, blockers, and finance-validatable impact.'],
] as const

const decisionConstellation = [
  ['Sentinel', 'Intelligence', 'Finds the pressure, patterns, and evidence gaps.'],
  ['Nexus', 'Moves', 'Shapes the bet into an execution-ready decision.'],
  ['Atlas', 'Tower', 'Tracks value, risk, pressure, and portfolio movement.'],
  ['Source', 'Sourcing', 'Turns vendor choices into leverage and proof.'],
  ['Steward', 'Context', 'Guards provenance, readiness, and trust.'],
] as const

export function LoggedOutLandingPage({ signedOut = false }: LoggedOutLandingPageProps) {
  return (
    <main className="logged-out-shell">
      <style jsx global>{`
        .logged-out-shell {
          min-height: 100vh;
          background: #f7f6f2;
          color: #0b1220;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .public-nav {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          width: min(100%, 1520px);
          margin: 0 auto;
          padding: 28px clamp(18px, 4vw, 64px);
        }

        .public-nav .mkt-nav__signin {
          color: rgba(255, 255, 255, 0.82);
        }

        .public-nav .mkt-nav__signin:hover {
          color: #ffffff;
        }

        .public-nav .mkt-nav__hamburger {
          border-color: rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .public-nav .mkt-nav__hamburger-bar {
          background: #ffffff;
        }

        .hero-stage {
          position: relative;
          min-height: clamp(760px, 88vh, 980px);
          overflow: hidden;
          background: #05070b;
          color: #ffffff;
          isolation: isolate;
        }

        .hero-image {
          position: absolute;
          inset: 0;
          z-index: -3;
        }

        .hero-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 72% 38%, rgba(0, 102, 204, 0.10), transparent 34%),
            linear-gradient(90deg, rgba(5, 7, 11, 0.94) 0%, rgba(5, 7, 11, 0.74) 38%, rgba(5, 7, 11, 0.20) 74%, rgba(5, 7, 11, 0.66) 100%),
            linear-gradient(180deg, rgba(5, 7, 11, 0.18) 0%, rgba(5, 7, 11, 0.48) 62%, #f7f6f2 100%);
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.050) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
          background-size: 84px 84px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 78%);
        }

        .hero-product-overlay {
          position: absolute;
          right: clamp(26px, 5vw, 86px);
          top: clamp(206px, 26vh, 300px);
          z-index: -1;
          width: min(500px, 35vw);
          border: 1px solid rgba(255, 255, 255, 0.18);
          background:
            linear-gradient(135deg, rgba(9, 18, 34, 0.72), rgba(7, 12, 22, 0.36)),
            rgba(255, 255, 255, 0.07);
          box-shadow: 0 38px 110px rgba(0, 0, 0, 0.38);
          backdrop-filter: blur(18px);
          padding: 18px;
        }

        .hero-product-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.13);
        }

        .hero-product-title {
          display: block;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .hero-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border: 1px solid rgba(121, 189, 255, 0.34);
          background: rgba(121, 189, 255, 0.12);
          color: #bfe0ff;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-value-panel {
          margin-top: 16px;
          border: 1px solid rgba(121, 189, 255, 0.22);
          background:
            radial-gradient(circle at 18% 18%, rgba(121, 189, 255, 0.18), transparent 38%),
            rgba(0, 102, 204, 0.10);
          padding: 16px;
        }

        .hero-value-kicker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          color: rgba(255, 255, 255, 0.64);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .hero-value-number {
          display: block;
          margin-top: 10px;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(56px, 5.6vw, 86px);
          line-height: 0.92;
          font-weight: 650;
          letter-spacing: -0.04em;
        }

        .hero-value-caption {
          display: block;
          margin-top: 8px;
          max-width: 360px;
          color: rgba(255, 255, 255, 0.70);
          font-size: 12px;
          line-height: 1.5;
        }

        .hero-signal-list {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }

        .hero-signal {
          display: grid;
          grid-template-columns: 136px 1fr;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.065);
          padding: 10px 12px;
        }

        .hero-signal strong {
          color: rgba(255, 255, 255, 0.92);
          font-size: 12px;
          line-height: 1.2;
        }

        .hero-signal span {
          color: rgba(255, 255, 255, 0.64);
          font-size: 12px;
          line-height: 1.35;
        }

        .hero-product-flow {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          margin-top: 16px;
          border: 1px solid rgba(121, 189, 255, 0.16);
          background: rgba(5, 7, 11, 0.22);
        }

        .hero-flow-step {
          position: relative;
          min-height: 58px;
          border-right: 1px solid rgba(121, 189, 255, 0.16);
          color: rgba(255, 255, 255, 0.78);
          padding: 11px 8px;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }

        .hero-flow-step::after {
          content: "✓";
          display: block;
          margin: 0 auto 6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(121, 189, 255, 0.16);
          color: #bfe0ff;
          font-size: 11px;
          line-height: 18px;
        }

        .hero-flow-step:last-child {
          border-right: 0;
        }

        .hero-content {
          width: min(100%, 1520px);
          margin: 0 auto;
          padding: clamp(118px, 14vh, 170px) clamp(18px, 4vw, 64px) 220px;
        }

        .hero-copy {
          max-width: 1020px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.88);
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          backdrop-filter: blur(18px);
        }

        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #79bdff;
          box-shadow: 0 0 0 6px rgba(121, 189, 255, 0.16);
        }

        h1 {
          max-width: 880px;
          margin: 0;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(52px, 6.4vw, 108px);
          line-height: 0.92;
          letter-spacing: -0.035em;
          font-weight: 650;
        }

        .lead {
          max-width: 790px;
          margin: 28px 0 0;
          color: rgba(255, 255, 255, 0.76);
          font-size: clamp(18px, 1.28vw, 22px);
          line-height: 1.68;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 19px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
        }

        .button-primary {
          background: #ffffff;
          color: #07101f;
        }

        .button-secondary {
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          backdrop-filter: blur(18px);
        }

        .signed-out-note {
          margin-top: 22px;
          max-width: 690px;
          border-left: 3px solid #79bdff;
          background: rgba(255, 255, 255, 0.09);
          backdrop-filter: blur(18px);
          padding: 15px 17px;
          color: rgba(255, 255, 255, 0.76);
          font-size: 13px;
          line-height: 1.58;
        }

        .proof-band {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 4;
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(5, 7, 11, 0.66);
          backdrop-filter: blur(22px);
        }

        .proof-inner {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          width: min(100%, 1520px);
          margin: 0 auto;
          padding: 20px clamp(18px, 4vw, 64px);
        }

        .proof-item {
          min-height: 92px;
          border-left: 1px solid rgba(255, 255, 255, 0.14);
          padding: 10px 24px;
        }

        .proof-item:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.14);
        }

        .proof-item strong {
          display: block;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(30px, 3vw, 52px);
          line-height: 0.95;
          font-weight: 650;
          letter-spacing: -0.02em;
        }

        .proof-item span {
          display: block;
          margin-top: 10px;
          max-width: 220px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
          line-height: 1.45;
        }

        .content-band {
          width: min(100%, 1520px);
          margin: 0 auto;
          padding: 82px clamp(18px, 4vw, 64px);
        }

        .two-col {
          display: grid;
          grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
          gap: clamp(34px, 6vw, 96px);
          align-items: start;
        }

        .kicker {
          margin: 0 0 14px;
          color: #0066cc;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0;
          max-width: 680px;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(38px, 5vw, 76px);
          line-height: 0.96;
          letter-spacing: -0.035em;
          font-weight: 650;
        }

        .section-lead {
          max-width: 650px;
          margin: 24px 0 0;
          color: #475467;
          font-size: 17px;
          line-height: 1.72;
        }

        .value-list {
          display: grid;
          gap: 1px;
          border-top: 1px solid rgba(15, 23, 42, 0.12);
          border-bottom: 1px solid rgba(15, 23, 42, 0.12);
        }

        .value-row {
          display: grid;
          grid-template-columns: 210px 1fr;
          gap: 24px;
          padding: 24px 0;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }

        .value-row:first-child {
          border-top: 0;
        }

        .value-row strong {
          color: #101828;
          font-size: 15px;
        }

        .value-row span {
          color: #475467;
          font-size: 15px;
          line-height: 1.65;
        }

        .wide-panel {
          border-top: 1px solid rgba(15, 23, 42, 0.11);
          border-bottom: 1px solid rgba(15, 23, 42, 0.11);
          background: #ffffff;
        }

        .journey {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0;
          border-left: 1px solid rgba(15, 23, 42, 0.11);
        }

        .journey-card {
          min-height: 250px;
          border-right: 1px solid rgba(15, 23, 42, 0.11);
          padding: 24px;
          background:
            linear-gradient(180deg, rgba(0, 102, 204, 0.055), transparent 48%),
            #ffffff;
        }

        .journey-card:last-child {
          background: #111318;
          color: #ffffff;
        }

        .journey-card small {
          display: block;
          margin-bottom: 64px;
          color: #0066cc;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .journey-card:last-child small {
          color: #79bdff;
        }

        .journey-card strong {
          display: block;
          margin-bottom: 10px;
          font-size: 20px;
        }

        .journey-card span {
          display: block;
          color: #475467;
          font-size: 13px;
          line-height: 1.56;
        }

        .journey-card:last-child span {
          color: rgba(255, 255, 255, 0.70);
        }

        .loop-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-top: 42px;
        }

        .loop-card {
          min-height: 190px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.70);
          padding: 22px;
        }

        .loop-card strong {
          display: block;
          margin-bottom: 12px;
          font-size: 21px;
        }

        .loop-card span {
          display: block;
          color: #475467;
          font-size: 14px;
          line-height: 1.6;
        }

        .decision-band {
          margin-top: 58px;
          border: 1px solid rgba(15, 23, 42, 0.13);
          background:
            radial-gradient(circle at 24% 18%, rgba(0, 102, 204, 0.20), transparent 28%),
            radial-gradient(circle at 82% 80%, rgba(121, 189, 255, 0.16), transparent 34%),
            #101318;
          color: #ffffff;
          overflow: hidden;
        }

        .decision-stage {
          position: relative;
          min-height: 430px;
          padding: clamp(28px, 4vw, 52px);
        }

        .decision-stage::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255, 255, 255, 0.050) 1px, transparent 1px);
          background-size: 72px 72px;
          opacity: 0.55;
          pointer-events: none;
        }

        .decision-copy {
          position: relative;
          z-index: 2;
          max-width: 560px;
        }

        .decision-copy h3 {
          margin: 0;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(34px, 4vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.03em;
          font-weight: 650;
        }

        .decision-copy p {
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.68);
          font-size: 15px;
          line-height: 1.68;
        }

        .decision-orbit {
          position: absolute;
          inset: 24px 28px 28px min(48%, 650px);
          z-index: 1;
        }

        .decision-orbit::before,
        .decision-orbit::after {
          content: "";
          position: absolute;
          inset: 36px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          transform: rotate(-12deg);
        }

        .decision-orbit::after {
          inset: 90px 72px;
          border-color: rgba(121, 189, 255, 0.22);
          transform: rotate(18deg);
        }

        .decision-node {
          position: absolute;
          width: min(240px, 34vw);
          min-height: 104px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.09);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.20);
          padding: 14px;
        }

        .decision-node:nth-child(1) { top: 18px; left: 18%; }
        .decision-node:nth-child(2) { top: 126px; right: 4%; }
        .decision-node:nth-child(3) { bottom: 26px; left: 28%; }
        .decision-node:nth-child(4) { top: 180px; left: 0; }
        .decision-node:nth-child(5) { bottom: 84px; right: 22%; }

        .decision-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .decision-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(121, 189, 255, 0.34), rgba(0, 102, 204, 0.20));
          border: 1px solid rgba(121, 189, 255, 0.34);
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
        }

        .decision-name {
          display: block;
          font-size: 15px;
          font-weight: 850;
        }

        .decision-role {
          display: block;
          margin-top: 2px;
          color: #8ac3ff;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .decision-node p {
          margin: 0;
          color: rgba(255, 255, 255, 0.70);
          font-size: 12px;
          line-height: 1.46;
        }

        .access-note {
          margin-top: 34px;
          max-width: 850px;
          border-left: 3px solid #111318;
          background: #ffffff;
          padding: 18px 20px;
          color: #475467;
          font-size: 14px;
          line-height: 1.65;
        }

        @media (max-width: 980px) {
          .hero-stage {
            min-height: 860px;
          }

          .hero-content {
            padding-top: 132px;
          }

          .hero-product-overlay {
            right: 18px;
            left: 18px;
            top: auto;
            bottom: 168px;
            width: auto;
            z-index: 1;
          }

          .hero-signal {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          h1 {
            font-size: clamp(52px, 13vw, 84px);
          }

          .proof-inner,
          .loop-grid,
          .journey {
            grid-template-columns: 1fr 1fr;
          }

          .two-col {
            grid-template-columns: 1fr;
          }

          .decision-stage {
            min-height: auto;
          }

          .decision-orbit {
            position: relative;
            inset: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 30px;
          }

          .decision-orbit::before,
          .decision-orbit::after {
            display: none;
          }

          .decision-node,
          .decision-node:nth-child(n) {
            position: relative;
            inset: auto;
            width: auto;
          }
        }

        @media (max-width: 640px) {
          .public-nav {
            padding: 20px 16px;
          }

          .hero-stage {
            min-height: 1100px;
          }

          .hero-content {
            padding: 120px 16px 430px;
          }

          .hero-product-overlay {
            display: none;
          }

          h1 {
            font-size: clamp(46px, 16vw, 64px);
          }

          .lead {
            font-size: 16px;
          }

          .actions,
          .button {
            width: 100%;
          }

          .proof-inner,
          .loop-grid,
          .journey {
            grid-template-columns: 1fr;
          }

          .decision-orbit {
            grid-template-columns: 1fr;
          }

          .proof-item,
          .proof-item:last-child {
            border-left: 0;
            border-right: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.14);
          }

          .value-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .content-band {
            padding: 60px 16px;
          }

          .journey-card {
            min-height: 210px;
          }

          .journey-card small {
            margin-bottom: 40px;
          }
        }
      `}</style>

      <section className="hero-stage">
        <div className="hero-image" aria-hidden>
          <Image
            src="/marketing/ai-success-platform-boardroom.png"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div className="hero-grid" aria-hidden />
        <div className="hero-product-overlay" aria-hidden="true">
          <div className="hero-product-head">
            <span>
              <Image
                src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg"
                alt=""
                width={82}
                height={21}
                style={{ height: 21, width: 'auto', display: 'block' }}
              />
              <span className="hero-product-title">AI success metrics</span>
            </span>
            <span className="hero-status"><span className="pulse" /> Verified</span>
          </div>
          <div className="hero-value-panel">
            <span className="hero-value-kicker">
              Value command panel
              <span>$ verified</span>
            </span>
            <strong className="hero-value-number">$42M</strong>
            <span className="hero-value-caption">
              projected value protected through better AI bet selection, sourcing leverage,
              redirected spend, and Tower-backed outcome proof.
            </span>
          </div>
          <div className="hero-signal-list">
            {dashboardSignals.map(([label, value]) => (
              <div className="hero-signal" key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
          <div className="hero-product-flow">
            {valueStages.map((stage) => (
              <span className="hero-flow-step" key={stage}>{stage}</span>
            ))}
          </div>
        </div>

        <header className="public-nav">
          <Link href="/" aria-label="AbarVa home">
            <Image
              src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg"
              alt="AbarVa"
              width={85}
              height={22}
              priority
              style={{ height: 22, width: 'auto', display: 'block' }}
            />
          </Link>
          <MarketingNav ctaHref="/sign-in" ctaLabel="Request access" />
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse" /> AI Success Platform</div>
            <h1>Turn AI ambition into verified business value.</h1>
            <p className="lead">
              AbarVa helps leaders choose the right AI bets, avoid expensive failure modes,
              shape execution-ready Moves, source with leverage, and prove whether value actually landed.
            </p>
            <div className="actions">
              <Link href="/sign-in" className="button button-primary">Request access</Link>
              <Link href="/sign-in" className="button button-secondary">Sign in</Link>
            </div>
            {signedOut && (
              <div className="signed-out-note">
                You are signed out. The active workspace context has been cleared; use the private
                credentials from your invite to re-enter.
              </div>
            )}
          </div>
        </div>

        <div className="proof-band" aria-label="AbarVa outcome proof points">
          <div className="proof-inner">
            {proofMetrics.map(([metric, label]) => (
              <div className="proof-item" key={label}>
                <strong>{metric}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-band">
        <div className="two-col">
          <div>
            <p className="kicker">Not another chatbot</p>
            <h2>A decision-grade operating system for enterprise AI.</h2>
            <p className="section-lead">
              AbarVa gives leaders a disciplined path from AI idea to funded decision,
              sourced execution, adoption readiness, and value proof without exposing
              private methodology on the public surface.
            </p>
            <div className="access-note">
              AbarVa is designed to convert AI ambition into evidence-backed, value-tracked,
              execution-ready work. The product gets stronger as client context, industry patterns,
              sourcing history, and realized outcomes become part of the private context layer.
            </div>
          </div>
          <div className="value-list" aria-label="AbarVa value levers">
            {valueRows.map(([title, body]) => (
              <div className="value-row" key={title}>
                <strong>{title}</strong>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="loop-grid" aria-label="AI success loop">
          {operatingSystem.map(([title, body]) => (
            <div className="loop-card" key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>

        <section className="decision-band" aria-label="AbarVa decision intelligence system">
          <div className="decision-stage">
            <div className="decision-copy">
              <p className="kicker">Decision intelligence system</p>
              <h3>Specialist capabilities move with the decision, not beside it.</h3>
              <p>
                Behind every module is a specialist capability: one finds the signal, another
                shapes the move, another tracks value, and another guards trust. The work stays
                grounded in private context and human approval.
              </p>
            </div>
            <div className="decision-orbit" aria-hidden="true">
              {decisionConstellation.map(([name, role, body]) => (
                <div className="decision-node" key={name}>
                  <div className="decision-head">
                    <span className="decision-mark">{name.slice(0, 1)}</span>
                    <span>
                      <span className="decision-name">{name}</span>
                      <span className="decision-role">{role}</span>
                    </span>
                  </div>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="wide-panel" aria-label="AbarVa journey">
        <div className="content-band">
          <p className="kicker">How the work moves</p>
          <h2>From setup to context, intelligence, moves, source, and tower.</h2>
        </div>
        <div className="journey">
          {journey.map(([title, body], index) => (
            <div className="journey-card" key={title}>
              <small>0{index + 1}</small>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
