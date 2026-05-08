import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PAGE_BG = '#F6F1E8';
const PANEL_BG = '#FFFDFC';
const PANEL_ALT = '#F1E7DA';
const INK = '#171411';
const INK_SOFT = '#3A312A';
const INK_MUTED = '#5B4D43';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#0E9F8C';
const SKY = '#5AA6F8';
const WARM = '#D59B6A';
const DARK = '#111315';
const DARK_PANEL = '#171A1D';
const DARK_LINE = 'rgba(255,255,255,0.1)';
const CREAM = '#F7F2EA';
const SANS = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';

const programRows = [
  {
    title: 'Meridian operating model reset',
    phase: 'Diagnose',
    owner: 'Sarah Chen · CIO',
    note: 'Current state mapped to 19 systems, 6 contradictions, and 3 decision-right gaps.',
  },
  {
    title: 'Claims AI wave sequencing',
    phase: 'Design',
    owner: 'Elena Vasquez · CEO',
    note: 'Three-wave path sized against data readiness, value timing, and external vendor lock-in.',
  },
  {
    title: 'Executive sponsor cadence repair',
    phase: 'Execute',
    owner: 'Linda Chen-Winters · President',
    note: 'Decision logs, attestation trail, and weekly operating rhythm now visible in one surface.',
  },
];

const proofPoints = [
  { label: 'Programs in motion', value: '18', detail: 'with baselines, owners, and board-facing milestones' },
  { label: 'Verified evidence items', value: '1,247', detail: 'not uploaded files, but provenance-tagged working memory' },
  { label: 'Patterns promoted', value: '47', detail: 'cross-program observations that earned reuse status' },
  { label: 'First-read time', value: '48h', detail: 'from client context to an opinionated executive brief' },
];

const pillars = [
  {
    eyebrow: '01 · Product shell',
    title: 'Warm off-white canvas with darker ink, not gray UI sludge.',
    body:
      'The default state becomes calm, bright, and boardroom-readable. Typography does more of the work. Borders are quieter. Accent color becomes selective and valuable.',
  },
  {
    eyebrow: '02 · Contrast moments',
    title: 'Dark sections appear only where they increase focus.',
    body:
      'Use near-black bands for density, narrative pivots, control surfaces, and “decision mode” moments. That contrast creates rhythm as you scroll instead of one monotonous wash.',
  },
  {
    eyebrow: '03 · Information hierarchy',
    title: 'Larger margins, stronger headlines, fewer competing signals.',
    body:
      'Harvey gets this right in restraint. Snowflake gets this right in clarity. For AbarVa, the sweet spot is editorial spacing plus enterprise specificity.',
  },
];

export default function PlatformStylePreviewPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
      }}
    >
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 28px 96px' }}>
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 28,
            border: `1px solid ${LINE}`,
            background:
              `radial-gradient(circle at top left, rgba(90,166,248,0.22), transparent 34%),
               radial-gradient(circle at top right, rgba(14,159,140,0.16), transparent 28%),
               linear-gradient(180deg, ${PANEL_BG} 0%, ${PAGE_BG} 100%)`,
            padding: '56px 56px 48px',
            boxShadow: '0 24px 80px rgba(23,20,17,0.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              marginBottom: 48,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: INK_SOFT,
              }}
            >
              Platform style preview · warm canvas direction
            </div>
            <Link
              href="/platform"
              style={{
                textDecoration: 'none',
                color: INK,
                border: `1px solid ${LINE}`,
                borderRadius: 999,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Back to current platform
            </Link>
          </div>

          <div
            className="light-preview-hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
              gap: 36,
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  marginBottom: 18,
                }}
              >
                AbarVa light system sample
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: SERIF,
                  fontSize: 'clamp(44px, 6vw, 88px)',
                  lineHeight: 0.94,
                  letterSpacing: '-0.04em',
                  maxWidth: 840,
                }}
              >
                Off-white by default. Dark when the page needs gravity.
              </h1>
              <p
                style={{
                  margin: '22px 0 0',
                  fontSize: 'clamp(20px, 2vw, 30px)',
                  lineHeight: 1.38,
                  color: INK_SOFT,
                  maxWidth: 840,
                }}
              >
                This direction keeps the product executive and legible on a laptop, while using darker
                sections as deliberate control surfaces instead of painting the entire app near-black.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
                <button
                  style={{
                    border: 'none',
                    background: INK,
                    color: CREAM,
                    borderRadius: 999,
                    padding: '14px 22px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Roll this into one core surface
                </button>
                <button
                  style={{
                    border: `1px solid ${LINE}`,
                    background: 'transparent',
                    color: INK,
                    borderRadius: 999,
                    padding: '14px 22px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Compare against current dark theme
                </button>
              </div>
            </div>

            <div
              style={{
                borderRadius: 24,
                padding: 22,
                background: 'rgba(255,255,255,0.7)',
                border: `1px solid ${LINE}`,
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                  marginBottom: 16,
                }}
              >
                What changes
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  'Canvas moves from near-black to warm paper',
                  'Primary text becomes dark ink, not white or gray',
                  'Accent color becomes more selective and premium',
                  'Dense decision surfaces can still go dark mid-page',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: INK,
                    }}
                  >
                    <span style={{ color: TEAL, fontWeight: 800 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div
            className="light-preview-proof-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            {proofPoints.map((point) => (
              <div
                key={point.label}
                style={{
                  padding: 24,
                  borderRadius: 20,
                  background: PANEL_BG,
                  border: `1px solid ${LINE}`,
                  boxShadow: '0 10px 30px rgba(23,20,17,0.04)',
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 12,
                  }}
                >
                  {point.label}
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: 42,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    marginBottom: 10,
                  }}
                >
                  {point.value}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.55, color: INK_SOFT }}>{point.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="light-preview-principles-grid"
          style={{
            marginTop: 40,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 32,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: 28,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: TEAL,
                marginBottom: 14,
              }}
            >
              Design principles
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: 'clamp(34px, 4vw, 58px)',
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                maxWidth: 560,
              }}
            >
              Editorial warmth, enterprise discipline, and darker sections only when useful.
            </h2>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                style={{
                  padding: 22,
                  borderRadius: 18,
                  background: PANEL_BG,
                  border: `1px solid ${LINE}`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: WARM,
                    marginBottom: 10,
                  }}
                >
                  {pillar.eyebrow}
                </div>
                <div
                  style={{
                    fontSize: 25,
                    lineHeight: 1.18,
                    fontWeight: 700,
                    marginBottom: 10,
                    maxWidth: 620,
                  }}
                >
                  {pillar.title}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.6, color: INK_SOFT }}>{pillar.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 48,
            borderRadius: 28,
            background: `linear-gradient(180deg, ${DARK_PANEL} 0%, ${DARK} 100%)`,
            color: CREAM,
            padding: '34px 30px 30px',
            boxShadow: '0 28px 80px rgba(23,20,17,0.16)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 24,
              alignItems: 'end',
              flexWrap: 'wrap',
              marginBottom: 22,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  marginBottom: 12,
                }}
              >
                Dark interruption section
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: SERIF,
                  fontSize: 'clamp(30px, 3vw, 48px)',
                  lineHeight: 1.04,
                  letterSpacing: '-0.03em',
                }}
              >
                Use dark backgrounds for operating intensity, not for everything.
              </h3>
            </div>
            <div style={{ maxWidth: 420, fontSize: 16, lineHeight: 1.6, color: 'rgba(247,242,234,0.78)' }}>
              This is where live status, contradictions, or board-level program posture can sit. The contrast makes it feel
              like a control surface, not just another content block.
            </div>
          </div>

          <div
            className="light-preview-dark-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
              gap: 18,
            }}
          >
            <div
              style={{
                borderRadius: 22,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${DARK_LINE}`,
                padding: 22,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 18,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(247,242,234,0.72)',
                  }}
                >
                  Program posture
                </div>
                <div style={{ fontSize: 13, color: TEAL }}>3 active decisions</div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {programRows.map((program) => (
                  <div
                    key={program.title}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${DARK_LINE}`,
                      background: 'rgba(255,255,255,0.02)',
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 22, lineHeight: 1.2, fontWeight: 700 }}>{program.title}</div>
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: TEAL,
                        }}
                      >
                        {program.phase}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(247,242,234,0.72)', marginBottom: 8 }}>{program.owner}</div>
                    <div style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(247,242,234,0.88)' }}>{program.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: 22,
                background: 'linear-gradient(180deg, rgba(90,166,248,0.14), rgba(14,159,140,0.08))',
                border: `1px solid ${DARK_LINE}`,
                padding: 22,
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(247,242,234,0.72)',
                  marginBottom: 16,
                }}
              >
                Sample prompt surface
              </div>
              <div
                style={{
                  borderRadius: 18,
                  background: 'rgba(247,242,234,0.96)',
                  color: INK,
                  padding: 22,
                  boxShadow: 'inset 0 0 0 1px rgba(23,20,17,0.08)',
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1.18, fontWeight: 700, maxWidth: 360 }}>
                  Where are sponsor decisions lagging outcome commitments?
                </div>
                <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['Meridian Health', 'Board-ready', 'Evidence-backed', 'Operating cadence'].map((chip) => (
                    <span
                      key={chip}
                      style={{
                        borderRadius: 999,
                        padding: '8px 12px',
                        border: `1px solid ${LINE}`,
                        fontSize: 13,
                        color: INK_SOFT,
                        background: '#FFF8F0',
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 24, fontSize: 14, color: INK_MUTED }}>
                  A light theme lets the interaction surface feel more modern and open, while the darker band around it keeps the section from
                  feeling too soft.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="light-preview-bottom-grid"
          style={{
            marginTop: 42,
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.1fr)',
            gap: 22,
          }}
        >
          <div
            style={{
              borderRadius: 22,
              background: PANEL_ALT,
              border: `1px solid ${LINE}`,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_MUTED,
                marginBottom: 14,
              }}
            >
              Why this direction works
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                'Feels more premium and less “internal tool at midnight.”',
                'Improves readability for dense executive pages and 13-inch laptops.',
                'Lets dark sections feel special instead of constant.',
                'Makes charts, tables, and forms easier to parse in long sessions.',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: SKY, fontWeight: 800 }}>+</span>
                  <span style={{ fontSize: 15, lineHeight: 1.55, color: INK }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              background: PANEL_BG,
              border: `1px solid ${LINE}`,
              overflow: 'hidden',
              boxShadow: '0 14px 40px rgba(23,20,17,0.06)',
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: `1px solid ${LINE}`,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'baseline',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TEAL,
                    marginBottom: 8,
                  }}
                >
                  Sample list/table treatment
                </div>
                <div style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700 }}>Programs read cleaner on a light surface.</div>
              </div>
              <div style={{ fontSize: 14, color: INK_SOFT }}>4 active</div>
            </div>

            <div style={{ display: 'grid' }}>
              {programRows.map((row, index) => (
                <div
                  className="light-preview-program-row"
                  key={row.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) 140px 180px',
                    gap: 18,
                    padding: '18px 22px',
                    borderTop: index === 0 ? 'none' : `1px solid ${LINE}`,
                    alignItems: 'center',
                    background: index % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,241,232,0.65)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 20, lineHeight: 1.22, fontWeight: 700, marginBottom: 6 }}>{row.title}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: INK_SOFT }}>{row.note}</div>
                  </div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: TEAL,
                    }}
                  >
                    {row.phase}
                  </div>
                  <div style={{ fontSize: 14, color: INK_MUTED }}>{row.owner}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 28, fontSize: 14, color: INK_MUTED }}>
          Preview route: <code style={{ fontFamily: MONO, color: INK }}>/platform/style-preview</code>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 1100px) {
                .light-preview-hero-grid,
                .light-preview-principles-grid,
                .light-preview-dark-grid,
                .light-preview-bottom-grid {
                  grid-template-columns: 1fr !important;
                }
                .light-preview-proof-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 720px) {
                .light-preview-proof-grid,
                .light-preview-program-row {
                  grid-template-columns: 1fr !important;
                }
              }
            `,
          }}
        />
      </div>
    </div>
  );
}
