import type { CSSProperties, ReactNode } from 'react';

const DARK = '#080A0C';
const DARK_PANEL = '#111418';
const DARK_SOFT = '#1A2026';
const LIGHT = '#FBFAF7';
const LIGHT_PANEL = '#FFFFFF';
const INK = '#151719';
const MUTED = '#68717B';
const LINE = 'rgba(21,23,25,0.12)';
const DARK_LINE = 'rgba(255,255,255,0.11)';
const TEAL = '#14B8A6';
const BLUE = '#5A8DEE';
const GOLD = '#C79A48';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';

type LogoTone = 'dark' | 'light' | 'accent';

type IconProps = {
  size?: number;
  tone?: LogoTone;
};

type Concept = {
  id: string;
  name: string;
  bestFor: string;
  rationale: string;
  useCase: string;
  strength: string;
  risk: string;
  smallReadability: string;
  trust: string;
  distinctiveness: string;
  score: string;
  icon: (props: IconProps) => ReactNode;
  wordmarkVariant?: 'classic' | 'mono' | 'tight';
};

function palette(tone: LogoTone = 'dark') {
  if (tone === 'light') {
    return {
      primary: '#F7F4ED',
      secondary: 'rgba(247,244,237,0.74)',
      accent: TEAL,
      surface: 'rgba(255,255,255,0.08)',
    };
  }

  if (tone === 'accent') {
    return {
      primary: TEAL,
      secondary: BLUE,
      accent: GOLD,
      surface: 'rgba(20,184,166,0.08)',
    };
  }

  return {
    primary: INK,
    secondary: '#56616C',
    accent: TEAL,
    surface: '#F2F6F5',
  };
}

function Wordmark({ tone = 'dark', variant = 'classic', compact = false }: { tone?: LogoTone; variant?: Concept['wordmarkVariant']; compact?: boolean }) {
  const colors = palette(tone);
  const isMono = variant === 'mono';
  const isTight = variant === 'tight';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        letterSpacing: isTight ? '-0.045em' : '-0.03em',
        fontFamily: isMono ? SANS : SERIF,
        fontSize: compact ? 22 : 32,
        fontWeight: isMono ? 760 : 760,
        color: colors.primary,
        whiteSpace: 'nowrap',
      }}
    >
      <span>Abar</span>
      <span
        style={{
          marginLeft: isTight ? 1 : 2,
          color: tone === 'light' ? colors.primary : TEAL,
          fontSize: compact ? 25 : 37,
          fontWeight: 900,
        }}
      >
        Va
      </span>
    </span>
  );
}

function WordmarkOnlyIcon({ size = 48, tone = 'dark' }: IconProps) {
  const colors = palette(tone);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="6" y="6" width="36" height="36" rx="10" fill={colors.surface} stroke={tone === 'light' ? DARK_LINE : LINE} />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={SERIF}
        fontSize="16"
        fontWeight="900"
        letterSpacing="-1"
        fill={tone === 'light' ? colors.primary : TEAL}
      >
        Va
      </text>
    </svg>
  );
}

function GeometricAVIcon({ size = 48, tone = 'dark' }: IconProps) {
  const colors = palette(tone);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M9 38L23.8 9L39 38" fill="none" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 38L24 22L32.5 38" fill="none" stroke={tone === 'light' ? colors.secondary : TEAL} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 31H30" stroke={colors.secondary} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function PatternFabricIcon({ size = 48, tone = 'dark' }: IconProps) {
  const colors = palette(tone);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M14 15H33L38 25L28 36H15L10 26L14 15Z" fill="none" stroke={colors.primary} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M14 15L28 36M33 15L15 36M10 26H38" stroke={colors.secondary} strokeWidth="1.8" strokeLinecap="round" />
      {[['14', '15'], ['33', '15'], ['38', '25'], ['28', '36'], ['15', '36'], ['10', '26'], ['24', '25']].map(([cx, cy], index) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index === 6 ? '3.2' : '2.4'} fill={index === 6 ? colors.accent : colors.primary} />
      ))}
    </svg>
  );
}

function AgentCompassIcon({ size = 48, tone = 'dark' }: IconProps) {
  const colors = palette(tone);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M24 6L40 24L24 42L8 24L24 6Z" fill="none" stroke={colors.primary} strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 31L23 15L30 24L18 31Z" fill={tone === 'light' ? colors.primary : TEAL} />
      <path d="M23 15L30 24L34 17" fill="none" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="3" fill={colors.accent} />
    </svg>
  );
}

function ValueLedgerIcon({ size = 48, tone = 'dark' }: IconProps) {
  const colors = palette(tone);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="10" y="9" width="28" height="30" rx="5" fill="none" stroke={colors.primary} strokeWidth="3" />
      <path d="M16 18H32M16 25H29M16 32H26" stroke={colors.secondary} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 33L34 37L40 28" fill="none" stroke={tone === 'light' ? colors.primary : TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 9V39" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" opacity="0.42" />
    </svg>
  );
}

function EnterpriseOSIcon({ size = 48, tone = 'dark' }: IconProps) {
  const colors = palette(tone);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="9" y="9" width="30" height="30" rx="7" fill="none" stroke={colors.primary} strokeWidth="3" />
      <path d="M17 9V39M31 9V39M9 17H39M9 31H39" stroke={colors.secondary} strokeWidth="2" />
      <rect x="18" y="18" width="12" height="12" rx="3" fill={tone === 'light' ? colors.primary : TEAL} />
      <path d="M24 14V18M24 30V34M14 24H18M30 24H34" stroke={colors.accent} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const concepts: Concept[] = [
  {
    id: 'wordmark',
    name: 'Wordmark Only',
    bestFor: 'Investor decks and professional-services trust',
    rationale: 'A restrained wordmark makes the brand feel serious, editorial, and executive without asking a symbol to carry too much meaning.',
    useCase: 'Primary corporate mark when the audience needs clarity and confidence first.',
    strength: 'Most timeless and least trendy.',
    risk: 'Less distinctive as an app icon unless the Va monogram is accepted.',
    smallReadability: 'Medium',
    trust: 'Very high',
    distinctiveness: 'Medium',
    score: '8.2',
    icon: WordmarkOnlyIcon,
    wordmarkVariant: 'classic',
  },
  {
    id: 'av',
    name: 'Geometric A/V Mark',
    bestFor: 'Product nav, favicon, app icon',
    rationale: 'A compact A/V construction gives AbarVa a precise symbol that can hold up in dense product chrome.',
    useCase: 'Best candidate for replacing the current nav mark after review.',
    strength: 'Sharp, memorable, and readable at 24px.',
    risk: 'Needs careful spacing so it does not feel too monogram-like.',
    smallReadability: 'High',
    trust: 'High',
    distinctiveness: 'High',
    score: '9.0',
    icon: GeometricAVIcon,
    wordmarkVariant: 'tight',
  },
  {
    id: 'fabric',
    name: 'Pattern Fabric Mark',
    bestFor: 'Pattern intelligence and decision fabric story',
    rationale: 'A sparse lattice communicates connected evidence and reusable enterprise patterns without becoming a generic AI network graphic.',
    useCase: 'Best for intelligence-layer pages and pattern fabric narratives.',
    strength: 'Strategically expressive.',
    risk: 'More detail means weaker favicon performance than the A/V mark.',
    smallReadability: 'Medium',
    trust: 'High',
    distinctiveness: 'High',
    score: '8.4',
    icon: PatternFabricIcon,
    wordmarkVariant: 'classic',
  },
  {
    id: 'compass',
    name: 'Agent Compass Mark',
    bestFor: 'Nexus-led workflows and decision guidance',
    rationale: 'The compass form positions AbarVa as a guide through sourcing, transformation, and executive decision paths.',
    useCase: 'Best for Nexus-forward surfaces and workflow orchestration modules.',
    strength: 'Clear metaphor without feeling playful.',
    risk: 'Compass symbols are familiar, so distinctiveness depends on execution.',
    smallReadability: 'High',
    trust: 'High',
    distinctiveness: 'Medium',
    score: '8.0',
    icon: AgentCompassIcon,
    wordmarkVariant: 'classic',
  },
  {
    id: 'ledger',
    name: 'Value Ledger Mark',
    bestFor: 'Outcome tracking and board-level accountability',
    rationale: 'A structured ledger mark makes measurement and realized value visible without drifting into bank or finance-app territory.',
    useCase: 'Best for value realization collateral and outcome governance surfaces.',
    strength: 'Directly tied to ROI and accountability.',
    risk: 'Could narrow the brand too much around measurement.',
    smallReadability: 'Medium',
    trust: 'Very high',
    distinctiveness: 'Medium',
    score: '7.7',
    icon: ValueLedgerIcon,
    wordmarkVariant: 'mono',
  },
  {
    id: 'os',
    name: 'Enterprise OS Mark',
    bestFor: 'Platform story and enterprise workflow layer',
    rationale: 'A compact system grid suggests AbarVa as an operating layer connecting workflows, agents, evidence, and value.',
    useCase: 'Best for platform positioning and architecture pages.',
    strength: 'Scales across product modules.',
    risk: 'May feel more infrastructural than decision-intelligent.',
    smallReadability: 'High',
    trust: 'High',
    distinctiveness: 'Medium-high',
    score: '8.3',
    icon: EnterpriseOSIcon,
    wordmarkVariant: 'mono',
  },
];

const cardStyle: CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${LINE}`,
  background: LIGHT_PANEL,
  boxShadow: '0 18px 50px rgba(21,23,25,0.06)',
  overflow: 'hidden',
};

function LogoLockup({ concept, tone = 'dark', compact = false }: { concept: Concept; tone?: LogoTone; compact?: boolean }) {
  const Icon = concept.icon;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 8 : 12 }}>
      {concept.id === 'wordmark' && !compact ? null : <Icon size={compact ? 24 : 38} tone={tone} />}
      <Wordmark tone={tone} variant={concept.wordmarkVariant} compact={compact} />
    </div>
  );
}

function ConceptCard({ concept }: { concept: Concept }) {
  const Icon = concept.icon;

  return (
    <article style={cardStyle}>
      <div style={{ padding: 22, display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: TEAL,
                marginBottom: 7,
              }}
            >
              {concept.id}
            </div>
            <h3 style={{ margin: 0, color: INK, fontSize: 24, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{concept.name}</h3>
          </div>
          <div
            aria-label={`${concept.name} icon-only version`}
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              border: `1px solid ${LINE}`,
              background: '#F5F7F7',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={38} tone="dark" />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              minHeight: 78,
              borderRadius: 8,
              border: `1px solid ${LINE}`,
              background: '#F8F8F5',
              display: 'flex',
              alignItems: 'center',
              padding: '16px 18px',
            }}
          >
            <LogoLockup concept={concept} />
          </div>

          <div
            className="logo-exploration-preview-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 84px',
              gap: 10,
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                borderRadius: 8,
                background: DARK,
                border: `1px solid ${DARK_LINE}`,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                minHeight: 52,
              }}
            >
              <LogoLockup concept={concept} tone="light" compact />
            </div>

            <div
              style={{
                borderRadius: 8,
                background: LIGHT,
                border: `1px solid ${LINE}`,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                minHeight: 52,
              }}
            >
              <LogoLockup concept={concept} compact />
            </div>

            <div
              style={{
                borderRadius: 8,
                background: DARK_PANEL,
                border: `1px solid ${DARK_LINE}`,
                display: 'grid',
                placeItems: 'center',
              }}
              aria-label={`${concept.name} 24 pixel preview`}
            >
              <Icon size={24} tone="light" />
            </div>
          </div>
        </div>

        <p style={{ margin: 0, color: '#38414A', fontSize: 15, lineHeight: 1.55 }}>{concept.rationale}</p>

        <div
          style={{
            borderTop: `1px solid ${LINE}`,
            paddingTop: 14,
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED }}>
            Recommended use
          </div>
          <div style={{ color: INK, fontSize: 15, lineHeight: 1.45, fontWeight: 650 }}>{concept.useCase}</div>
        </div>
      </div>
    </article>
  );
}

export function AbarVaLogoExploration() {
  return (
    <section
      style={{
        borderRadius: 8,
        border: `1px solid ${LINE}`,
        background: LIGHT,
        color: INK,
        padding: 28,
        marginBottom: 36,
        boxShadow: '0 24px 80px rgba(21,23,25,0.06)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.86fr) minmax(320px, 0.64fr)',
          gap: 28,
          alignItems: 'end',
          marginBottom: 28,
        }}
        className="logo-exploration-header"
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: TEAL,
              marginBottom: 12,
            }}
          >
            Internal brand exploration
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 'clamp(36px, 4.6vw, 64px)',
              lineHeight: 0.98,
              letterSpacing: '-0.045em',
              maxWidth: 760,
            }}
          >
            Six compact logo directions for AbarVa.
          </h2>
        </div>
        <p style={{ margin: 0, color: '#3C454E', fontSize: 17, lineHeight: 1.58 }}>
          These are vector-only explorations for review. They are built to survive product navigation, favicons,
          investor decks, and enterprise UI without becoming flashy or generic.
        </p>
      </div>

      <div
        className="logo-exploration-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 18,
        }}
      >
        {concepts.map((concept) => (
          <ConceptCard key={concept.id} concept={concept} />
        ))}
      </div>

      <div
        style={{
          marginTop: 26,
          borderRadius: 8,
          border: `1px solid ${LINE}`,
          background: '#FFFFFF',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              {['Concept', 'Best for', 'Strength', 'Risk', 'Small-size readability', 'Enterprise trust', 'Distinctiveness', 'Recommendation score'].map((heading) => (
                <th
                  key={heading}
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    padding: '14px 14px 12px',
                    borderBottom: `1px solid ${LINE}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {concepts.map((concept) => {
              const Icon = concept.icon;

              return (
                <tr key={`row-${concept.id}`}>
                  <td style={tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 164 }}>
                      <Icon size={24} tone="dark" />
                      <span style={{ fontWeight: 750, color: INK }}>{concept.name}</span>
                    </div>
                  </td>
                  <td style={tableCell}>{concept.bestFor}</td>
                  <td style={tableCell}>{concept.strength}</td>
                  <td style={tableCell}>{concept.risk}</td>
                  <td style={tableCell}>{concept.smallReadability}</td>
                  <td style={tableCell}>{concept.trust}</td>
                  <td style={tableCell}>{concept.distinctiveness}</td>
                  <td style={{ ...tableCell, fontFamily: MONO, fontWeight: 800, color: TEAL }}>{concept.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 20,
          borderRadius: 8,
          background: DARK_SOFT,
          color: '#F7F4ED',
          padding: 20,
          display: 'grid',
          gridTemplateColumns: '72px minmax(0, 1fr)',
          gap: 18,
          alignItems: 'center',
        }}
        className="logo-exploration-recommendation"
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            border: `1px solid ${DARK_LINE}`,
            display: 'grid',
            placeItems: 'center',
            background: '#090C0F',
          }}
        >
          <GeometricAVIcon size={42} tone="light" />
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 7 }}>
            Current recommendation
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.3, fontWeight: 750 }}>
            Lead with the Geometric A/V Mark: it is the strongest balance of nav readability, favicon utility,
            enterprise restraint, and enough distinctiveness to become ownable.
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 1180px) {
              .logo-exploration-grid {
                grid-template-columns: 1fr !important;
              }
            }
            @media (max-width: 820px) {
              .logo-exploration-header,
              .logo-exploration-recommendation {
                grid-template-columns: 1fr !important;
              }
              .logo-exploration-preview-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `,
        }}
      />
    </section>
  );
}

const tableCell: CSSProperties = {
  padding: '15px 14px',
  borderBottom: `1px solid ${LINE}`,
  color: '#3D464F',
  fontSize: 14,
  lineHeight: 1.42,
  verticalAlign: 'top',
};
