// ProductMarketingPage · investor-grade Product surface.
//
// This is the signed-in product story, not the internal product manual. It is
// intentionally visual and outcome-led: what AbarVa is, why now, where the
// economic value comes from, and why the product is defensible.

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

function AbarvaWordmark({
  height = '0.78em',
  inverse = false,
}: {
  height?: string | number;
  inverse?: boolean;
}) {
  return (
    <Image
      src={inverse ? '/brand/abarva-logo-inverse.svg' : '/brand/abarva-logo.svg'}
      alt="AbarVa"
      width={130}
      height={42}
      style={{
        height,
        width: 'auto',
        display: 'inline-block',
        verticalAlign: '-0.13em',
        margin: '0 0.05em',
      }}
      unoptimized
    />
  );
}

const F_SANS = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const F_SERIF = "'Fraunces', Georgia, serif";
const F_MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace";

const C = {
  ink: '#15151A',
  inkSoft: '#424550',
  inkMute: '#70747F',
  surface: '#FFFFFF',
  canvas: '#F6F7FA',
  line: '#DDE3EC',
  lineSoft: '#EBEFF5',
  blue: '#0066CC',
  blueDeep: '#0B3A75',
  green: '#007A3D',
  warm: '#B8651B',
  warmSoft: '#F8EFE8',
  greenSoft: '#EEF9F2',
  blueSoft: '#EEF5FF',
  shadow: '0 24px 80px rgba(11, 31, 61, 0.10)',
};

interface ProductMarketingSpotlight {
  clientName: string;
  clientShortName: string;
}

const DEFAULT_SPOTLIGHT: ProductMarketingSpotlight = {
  clientName: 'your active client',
  clientShortName: 'your client',
};

const valueLevers = [
  { label: 'Avoid failed AI spend', value: '$5M-$12M', detail: 'Weak or stalled initiatives redirected before scale.' },
  { label: 'Improve solution design', value: '$3M-$6M', detail: 'Avoid overbuild, under-design, and late rework.' },
  { label: 'Optimize sourcing', value: '$2M-$4M', detail: 'Vendor/SI scope, rates, role mix, and terms normalized.' },
  { label: 'Pull value forward', value: '$3M-$8M', detail: 'Decision cycles compressed from months to weeks.' },
  { label: 'Lift realized ROI', value: '$5M-$15M', detail: 'Adoption, finance proof, and verified outcomes tracked.' },
];

const surfaces = [
  {
    name: 'Intelligence',
    agent: 'Sentinel',
    promise: 'Decide the right AI bets',
    body: 'Answers executive questions against tenant facts, industry patterns, systems, KPIs, and unresolved ownership tensions.',
    href: '/intelligence',
    color: C.blue,
  },
  {
    name: 'Moves',
    agent: 'Nexus',
    promise: 'Shape bets into funded journeys',
    body: 'Turns a promising signal into sponsor, scope, evidence, gates, architecture, business case, and value path.',
    href: '/strategic-moves',
    color: C.green,
  },
  {
    name: 'Source',
    agent: 'Source',
    promise: 'Select vendors and SIs with discipline',
    body: 'Guides intake, shortlist, RFP/proposal logic, commercial comparison, and decision records.',
    href: '/source',
    color: C.warm,
  },
  {
    name: 'Tower',
    agent: 'Atlas',
    promise: 'Run the AI portfolio',
    body: 'Makes value, risk, readiness, dependencies, and ownership visible before the steering committee.',
    href: '/tower',
    color: C.blueDeep,
  },
];

const architectureLayers = [
  ['Experience layer', 'Home, Intelligence, Moves, Source, Tower'],
  ['Agent layer', 'Sentinel, Nexus, Source, Atlas, Maestro'],
  ['Knowledge layer', 'Tenant profile, org, budget, systems, KPIs, corpus'],
  ['Retrieval layer', 'Postgres/Supabase, graph context, Pinecone vectors'],
  ['Control layer', 'Gates, evidence ledger, provenance, value verification'],
];

export function ProductMarketingPage({
  spotlight = DEFAULT_SPOTLIGHT,
}: {
  spotlight?: ProductMarketingSpotlight;
}) {
  return (
    <div
      data-testid="product-marketing-page"
      style={{
        minHeight: '100vh',
        background: C.canvas,
        color: C.ink,
        fontFamily: F_SANS,
        fontSize: 16,
        lineHeight: 1.6,
      }}
    >
      <Hero spotlight={spotlight} />
      <EconomicValue />
      <OperatingSystem spotlight={spotlight} />
      <MoveAndSourceJourneys />
      <Architecture />
      <WhyNow />
      <Cta spotlight={spotlight} />
    </div>
  );
}

function Hero({ spotlight }: { spotlight: ProductMarketingSpotlight }) {
  return (
    <section style={{ padding: '72px clamp(24px, 5vw, 72px) 48px', background: C.surface }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 42,
          alignItems: 'center',
        }}
      >
        <div>
          <Eyebrow>Seed funding narrative</Eyebrow>
          <h1
            style={{
              margin: '0 0 22px',
              maxWidth: 820,
              fontFamily: F_SERIF,
              fontSize: 'clamp(44px, 6vw, 82px)',
              fontWeight: 520,
              lineHeight: 0.98,
              letterSpacing: 0,
            }}
          >
            The AI operating system for C-suite decisions.
          </h1>
          <p style={{ maxWidth: 760, margin: '0 0 26px', color: C.inkSoft, fontSize: 20, lineHeight: 1.48 }}>
            <AbarvaWordmark /> helps executives decide which AI bets to fund, shape them into governed Strategic Moves,
            select the right vendor/SI path, and prove whether value is actually realized.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <PrimaryLink href="/home">See it on {spotlight.clientShortName}</PrimaryLink>
            <SecondaryLink href="/intelligence">Open Intelligence on {spotlight.clientShortName}</SecondaryLink>
          </div>
        </div>
        <HeroGraphic />
      </div>
      <div
        style={{
          maxWidth: 1320,
          margin: '46px auto 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <ProofStat label="Working product" value="Real app" detail="Next.js / React, Node.js runtime, Postgres/Supabase, graph context, Pinecone retrieval." />
        <ProofStat label="Executive workflow" value="4 surfaces" detail="Intelligence, Moves, Source, Tower tied to one tenant knowledge layer." />
        <ProofStat label="Value thesis" value="$18M-$45M+" detail="Illustrative annual value on a $100M AI/transformation portfolio." />
      </div>
    </section>
  );
}

function EconomicValue() {
  return (
    <section style={{ padding: '72px clamp(24px, 5vw, 72px)', background: C.surface, borderTop: `1px solid ${C.lineSoft}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Eyebrow>Economic value</Eyebrow>
        <SectionTitle>Value comes from removing the reasons enterprise AI fails.</SectionTitle>
        <p style={{ maxWidth: 820, color: C.inkSoft, fontSize: 18, margin: '0 0 30px' }}>
          AbarVa does not create value by making AI sound exciting. It creates value by reducing failed spend, improving design,
          optimizing sourcing, accelerating time-to-value, and increasing realized ROI.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 12,
            alignItems: 'stretch',
          }}
        >
          {valueLevers.map((lever, index) => (
            <div
              key={lever.label}
              style={{
                position: 'relative',
                padding: 18,
                minHeight: 172,
                borderRadius: 16,
                background: index === valueLevers.length - 1 ? C.greenSoft : C.blueSoft,
                border: `1px solid ${index === valueLevers.length - 1 ? '#BCE7C9' : '#CFE2FF'}`,
              }}
            >
              <div style={{ fontFamily: F_MONO, color: index === valueLevers.length - 1 ? C.green : C.blue, fontSize: 11, fontWeight: 800 }}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div style={{ marginTop: 12, color: C.ink, fontSize: 30, fontWeight: 820, lineHeight: 1 }}>{lever.value}</div>
              <div style={{ marginTop: 8, color: C.ink, fontWeight: 760 }}>{lever.label}</div>
              <p style={{ margin: '7px 0 0', color: C.inkMute, fontSize: 13, lineHeight: 1.45 }}>{lever.detail}</p>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            padding: 22,
            borderRadius: 18,
            color: C.surface,
            background: `linear-gradient(120deg, ${C.blueDeep}, ${C.green})`,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontFamily: F_MONO, fontSize: 11, fontWeight: 800, opacity: 0.72, textTransform: 'uppercase' }}>
              Illustrative enterprise case
            </div>
            <div style={{ fontSize: 18, fontWeight: 680, marginTop: 4 }}>
              On a $100M AI/transformation portfolio, the target value pool is meaningful enough for board-level attention.
            </div>
          </div>
          <div style={{ fontSize: 38, fontWeight: 860, whiteSpace: 'nowrap' }}>$18M-$45M+</div>
        </div>
      </div>
    </section>
  );
}

function OperatingSystem({ spotlight }: { spotlight: ProductMarketingSpotlight }) {
  return (
    <section style={{ padding: '72px clamp(24px, 5vw, 72px)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Eyebrow>The product</Eyebrow>
        <SectionTitle>One operating model, four executive surfaces.</SectionTitle>
        <div
          style={{
            marginTop: 30,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {surfaces.map((surface) => (
            <Link
              key={surface.name}
              href={surface.href}
              style={{
                display: 'grid',
                minHeight: 280,
                padding: 22,
                borderRadius: 18,
                background: C.surface,
                border: `1px solid ${C.line}`,
                textDecoration: 'none',
                color: C.ink,
                boxShadow: '0 14px 42px rgba(11, 31, 61, 0.06)',
              }}
            >
              <SurfaceMark color={surface.color} />
              <div style={{ alignSelf: 'end' }}>
                <div style={{ fontFamily: F_MONO, color: surface.color, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                  {surface.agent}
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: 28, lineHeight: 1.05, letterSpacing: 0 }}>{surface.name}</h3>
                <div style={{ color: C.ink, fontWeight: 740 }}>{surface.promise}</div>
                <p style={{ margin: '10px 0 0', color: C.inkMute, fontSize: 14, lineHeight: 1.52 }}>{surface.body}</p>
              </div>
            </Link>
          ))}
        </div>
        <p style={{ margin: '18px 0 0', color: C.inkMute, fontSize: 14 }}>
          The live page is tenant-aware: this session is loaded for <strong>{spotlight.clientName}</strong>.
        </p>
      </div>
    </section>
  );
}

function MoveAndSourceJourneys() {
  return (
    <section style={{ padding: '72px clamp(24px, 5vw, 72px)', background: C.surface }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Eyebrow>Journey discipline</Eyebrow>
        <SectionTitle>Ideas become journeys, not forms.</SectionTitle>
        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 18,
          }}
        >
          <JourneyCard
            label="One Move"
            title="From rough idea to execution-ready investment"
            body="P0 to P5 forces sponsor clarity, diagnosis, future-state design, business case, and mobilization before the bet becomes another unowned pilot."
            graphic={<MoveArc />}
          />
          <JourneyCard
            label="One Source event"
            title="From vendor noise to decision record"
            body="Source captures context through conversation, normalizes vendor/SI evidence, and produces a defensible selection package for procurement, finance, and legal."
            graphic={<SourceFlow />}
          />
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section style={{ padding: '72px clamp(24px, 5vw, 72px)' }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 34,
          alignItems: 'center',
        }}
      >
        <DecisionFabric />
        <div>
          <Eyebrow>Architecture and defensibility</Eyebrow>
          <SectionTitle>AbarVa is a decision fabric, not a chatbot beside documents.</SectionTitle>
          <p style={{ color: C.inkSoft, fontSize: 17, margin: '0 0 20px' }}>
            The moat is not one prompt. It is the combination of tenant data, industry corpus, graph and vector retrieval,
            phase-gated journeys, Source decision artifacts, and value verification.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {architectureLayers.map(([label, detail]) => (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px minmax(0, 1fr)',
                  gap: 14,
                  padding: 14,
                  borderRadius: 14,
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                }}
              >
                <strong style={{ color: C.ink, fontSize: 14 }}>{label}</strong>
                <span style={{ color: C.inkMute, fontSize: 14 }}>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyNow() {
  return (
    <section style={{ padding: '72px clamp(24px, 5vw, 72px)', background: C.surface }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Eyebrow>Why now</Eyebrow>
        <SectionTitle>Enterprises are moving from AI experimentation to AI portfolio discipline.</SectionTitle>
        <div
          style={{
            marginTop: 26,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          <WhyCard title="The pain changed" body="The question is no longer whether executives can find AI ideas. The question is which ones deserve capital, workflow change, and senior sponsorship." />
          <WhyCard title="The buyer is exposed" body="CIOs, CFOs, CEOs, and business presidents are being asked to defend AI investments before value is proven." />
          <WhyCard title="The category is open" body="Dashboards show activity. Chatbots answer questions. AbarVa connects decision, journey, sourcing, and value realization." />
        </div>
      </div>
    </section>
  );
}

function Cta({ spotlight }: { spotlight: ProductMarketingSpotlight }) {
  return (
    <section style={{ padding: '80px clamp(24px, 5vw, 72px)', background: C.ink, color: C.surface }}>
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <Eyebrow light>See it work</Eyebrow>
        <h2 style={{ margin: '0 0 18px', fontSize: 'clamp(34px, 5vw, 62px)', lineHeight: 1, letterSpacing: 0 }}>
          Ask Sentinel. Shape a Move. Start Source. Track value.
        </h2>
        <p style={{ margin: '0 auto 28px', maxWidth: 700, color: 'rgba(255,255,255,0.74)', fontSize: 18 }}>
          The strongest proof is not a product tour. It is a CXO asking real questions about {spotlight.clientShortName} and watching the system turn answers into governed action.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <PrimaryLink href="/intelligence" inverse>Open Intelligence on {spotlight.clientShortName}</PrimaryLink>
          <SecondaryLink href="/strategic-moves" inverse>Shape a Move</SecondaryLink>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div
      style={{
        marginBottom: 12,
        color: light ? 'rgba(255,255,255,0.68)' : C.blue,
        fontFamily: F_MONO,
        fontSize: 11,
        fontWeight: 820,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        maxWidth: 880,
        margin: 0,
        color: C.ink,
        fontSize: 'clamp(34px, 4.8vw, 58px)',
        lineHeight: 1.03,
        letterSpacing: 0,
      }}
    >
      {children}
    </h2>
  );
}

function PrimaryLink({ href, children, inverse = false }: { href: string; children: ReactNode; inverse?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 46,
        padding: '12px 20px',
        borderRadius: 999,
        background: inverse ? C.surface : C.ink,
        color: inverse ? C.ink : C.surface,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 760,
      }}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children, inverse = false }: { href: string; children: ReactNode; inverse?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 46,
        padding: '12px 20px',
        borderRadius: 999,
        background: 'transparent',
        color: inverse ? C.surface : C.ink,
        border: `1px solid ${inverse ? 'rgba(255,255,255,0.42)' : C.ink}`,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 760,
      }}
    >
      {children}
    </Link>
  );
}

function ProofStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 16, background: C.surface, border: `1px solid ${C.line}`, boxShadow: '0 10px 30px rgba(11, 31, 61, 0.04)' }}>
      <div style={{ fontFamily: F_MONO, color: C.inkMute, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 8, color: C.ink, fontSize: 28, fontWeight: 860 }}>{value}</div>
      <p style={{ margin: '6px 0 0', color: C.inkMute, fontSize: 13, lineHeight: 1.45 }}>{detail}</p>
    </div>
  );
}

function JourneyCard({ label, title, body, graphic }: { label: string; title: string; body: string; graphic: ReactNode }) {
  return (
    <article style={{ padding: 24, borderRadius: 20, background: C.canvas, border: `1px solid ${C.line}` }}>
      <div style={{ fontFamily: F_MONO, color: C.blue, fontSize: 11, fontWeight: 820, textTransform: 'uppercase' }}>{label}</div>
      <h3 style={{ margin: '8px 0 8px', color: C.ink, fontSize: 28, lineHeight: 1.08, letterSpacing: 0 }}>{title}</h3>
      <p style={{ margin: '0 0 18px', color: C.inkMute, fontSize: 15 }}>{body}</p>
      {graphic}
    </article>
  );
}

function WhyCard({ title, body }: { title: string; body: string }) {
  return (
    <article style={{ minHeight: 184, padding: 22, borderRadius: 18, background: C.canvas, border: `1px solid ${C.line}` }}>
      <h3 style={{ margin: '0 0 8px', color: C.ink, fontSize: 22, letterSpacing: 0 }}>{title}</h3>
      <p style={{ margin: 0, color: C.inkMute, fontSize: 15 }}>{body}</p>
    </article>
  );
}

function HeroGraphic() {
  return (
    <svg viewBox="0 0 560 440" width="100%" style={{ display: 'block' }} role="img" aria-label="AbarVa turns scattered AI bets into governed decisions">
      <defs>
        <radialGradient id="pmHeroGlow" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#D89762" stopOpacity="0.36" />
          <stop offset="65%" stopColor="#0066CC" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="560" height="440" rx="32" fill="url(#pmHeroGlow)" />
      <line x1="54" y1="220" x2="506" y2="220" stroke={C.blue} strokeWidth="2" strokeOpacity="0.42" />
      <text x="58" y="204" fill={C.blue} fontFamily={F_MONO} fontSize="11" fontWeight="800">ABOVE THE FUNDING LINE</text>
      <text x="58" y="244" fill={C.inkMute} fontFamily={F_MONO} fontSize="11" fontWeight="800">PILOT NOISE</text>
      {[
        [280, 142, 25, C.blue, 'Workforce'],
        [220, 186, 18, C.green, 'Demand'],
        [345, 188, 16, C.warm, 'Loyalty'],
      ].map(([x, y, r, color, label]) => (
        <g key={label as string}>
          <circle cx={x as number} cy={y as number} r={r as number} fill={color as string} />
          <circle cx={x as number} cy={y as number} r={(r as number) + 10} fill="none" stroke={color as string} strokeOpacity="0.26" />
          <text x={x as number} y={(y as number) - (r as number) - 14} textAnchor="middle" fill={C.ink} fontFamily={F_SANS} fontSize="13" fontWeight="760">{label as string}</text>
        </g>
      ))}
      {[100, 158, 230, 320, 396, 458].map((x, i) => (
        <circle key={x} cx={x} cy={292 + (i % 2) * 32} r={9} fill="none" stroke={i % 2 ? C.warm : C.inkMute} strokeWidth="2" opacity="0.72" />
      ))}
      <path d="M280 142 Q250 164 220 186" fill="none" stroke={C.blue} strokeDasharray="4 6" strokeOpacity="0.46" />
      <path d="M280 142 Q312 164 345 188" fill="none" stroke={C.blue} strokeDasharray="4 6" strokeOpacity="0.46" />
      <rect x="156" y="354" width="248" height="48" rx="16" fill={C.ink} />
      <text x="280" y="383" textAnchor="middle" fill={C.surface} fontFamily={F_SANS} fontSize="15" fontWeight="760">Decide · Shape · Source · Track</text>
    </svg>
  );
}

function SurfaceMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 120" width="100%" height="120" role="img" aria-hidden="true">
      <circle cx="110" cy="60" r="42" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.34" />
      <circle cx="110" cy="60" r="22" fill={color} fillOpacity="0.9" />
      <circle cx="110" cy="60" r="7" fill={C.surface} />
      <path d="M30 60 H80 M140 60 H190 M110 15 V38 M110 82 V106" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.58" />
    </svg>
  );
}

function MoveArc() {
  const phases = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];
  return (
    <svg viewBox="0 0 640 220" width="100%" role="img" aria-label="P0 to P5 Move journey">
      <path d="M58 164 C148 40 492 40 582 164" fill="none" stroke={C.line} strokeWidth="18" strokeLinecap="round" />
      <path d="M58 164 C148 40 492 40 582 164" fill="none" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
      {phases.map((phase, index) => {
        const points = [
          [58, 164],
          [158, 88],
          [270, 58],
          [370, 58],
          [482, 88],
          [582, 164],
        ][index]!;
        return (
          <g key={phase}>
            <circle cx={points[0]} cy={points[1]} r="18" fill={index < 3 ? C.blue : C.green} />
            <text x={points[0]} y={points[1] + 4} textAnchor="middle" fill={C.surface} fontFamily={F_MONO} fontSize="12" fontWeight="800">{phase}</text>
          </g>
        );
      })}
      <circle cx="320" cy="96" r="27" fill={C.ink} />
      <circle cx="320" cy="84" r="8" fill={C.surface} />
      <path d="M300 114 C308 100 332 100 340 114" fill="none" stroke={C.surface} strokeWidth="3" strokeLinecap="round" />
      <text x="320" y="142" textAnchor="middle" fill={C.ink} fontSize="14" fontWeight="760">Human Maestro</text>
    </svg>
  );
}

function SourceFlow() {
  return (
    <svg viewBox="0 0 640 220" width="100%" role="img" aria-label="Source event streams converging into a decision record">
      {['Vendor evidence', 'SI model', 'Commercials', 'Tenant constraints'].map((label, index) => {
        const y = 34 + index * 44;
        return (
          <g key={label}>
            <rect x="20" y={y - 17} width="158" height="34" rx="12" fill={C.surface} stroke={C.line} />
            <text x="38" y={y + 4} fill={C.ink} fontSize="13" fontWeight="740">{label}</text>
            <path d={`M190 ${y} C310 ${y} 392 110 480 110`} fill="none" stroke={index % 2 ? C.green : C.blue} strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.72" />
          </g>
        );
      })}
      <circle cx="492" cy="110" r="38" fill={C.ink} />
      <circle cx="492" cy="110" r="22" fill={C.blue} />
      <circle cx="492" cy="110" r="7" fill={C.surface} />
      <rect x="548" y="72" width="74" height="76" rx="14" fill={C.surface} stroke={C.line} />
      <line x1="564" y1="94" x2="606" y2="94" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      <line x1="564" y1="112" x2="596" y2="112" stroke={C.warm} strokeWidth="3" strokeLinecap="round" />
      <line x1="564" y1="130" x2="604" y2="130" stroke={C.inkMute} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function DecisionFabric() {
  return (
    <svg viewBox="0 0 560 420" width="100%" role="img" aria-label="AbarVa layered decision fabric">
      <rect x="8" y="8" width="544" height="404" rx="28" fill={C.surface} stroke={C.line} />
      <circle cx="280" cy="210" r="150" fill="none" stroke={C.inkMute} strokeOpacity="0.26" strokeDasharray="5 8" />
      <circle cx="280" cy="210" r="106" fill="none" stroke={C.warm} strokeOpacity="0.62" />
      <circle cx="280" cy="210" r="70" fill={C.blueSoft} stroke={C.blue} strokeWidth="2" />
      <text x="280" y="201" textAnchor="middle" fill={C.blue} fontFamily={F_MONO} fontSize="12" fontWeight="820">TENANT</text>
      <text x="280" y="226" textAnchor="middle" fill={C.ink} fontSize="22" fontWeight="820">Knowledge layer</text>
      {[
        [94, 76, 'Intelligence'],
        [466, 76, 'Moves'],
        [94, 344, 'Source'],
        [466, 344, 'Tower'],
      ].map(([x, y, label]) => (
        <g key={label as string}>
          <rect x={(x as number) - 70} y={(y as number) - 22} width="140" height="44" rx="14" fill={C.surface} stroke={C.line} />
          <text x={x as number} y={(y as number) + 5} textAnchor="middle" fill={C.ink} fontSize="14" fontWeight="760">{label as string}</text>
          <path d={`M${x} ${y} C${x} 210 280 210 280 210`} fill="none" stroke={C.blue} strokeOpacity="0.26" strokeDasharray="4 7" />
        </g>
      ))}
      <text x="280" y="40" textAnchor="middle" fill={C.inkMute} fontSize="12">Industry corpus + graph + vector retrieval</text>
      <text x="280" y="386" textAnchor="middle" fill={C.inkMute} fontSize="12">Phase gates + evidence ledger + verified value</text>
    </svg>
  );
}
