/**
 * /admin landing skeletons · Wave 3 PR-7
 *
 * Static placeholder blocks that render synchronously while each
 * Trust Plane zone's data resolves. One skeleton per Suspense
 * boundary on `/admin`:
 *
 *   - TrustStripSkeleton    → Zone B (Trust strip, 56px)
 *   - ActionQueueSkeleton   → Zone C (Action queue, 3 rows)
 *   - PostureGridSkeleton   → Zone D (2×2 posture cards)
 *   - AuditRibbonSkeleton   → Zone E (6 audit rows)
 *   - StewardOrientationSkeleton → Zone F (Steward's read)
 *
 * Design contract per `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md`
 * §5.6 Loading state:
 *
 *   "Skeletal chips with the dots blank; numbers replaced by `···`.
 *    No spinners. The page renders the static masthead and Trust
 *    strip skeleton in <100ms; chip numbers stream in as the broker
 *    resolves. The action queue and posture grid each have their
 *    own suspense boundary. No full-page spinner anywhere — that's
 *    a founder principle and it should be visible here."
 *
 * Rules:
 *   - NO spinners.
 *   - NO `loading.gif`-style animations.
 *   - Placeholder text uses mono only (`···`).
 *   - Locked palette muted tones; matches the cream/ink register.
 *   - Same DOM shape as the resolved zone where possible so layout
 *     does not shift when content streams in.
 */

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
  surface2: '#FBFAF7',
  surface3: '#F5F3EE',
} as const;

const F_BODY =
  'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';
const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';

const PLACEHOLDER = '···';

// ── TrustStripSkeleton ──────────────────────────────────────────────
//
// Four hollow chips, ~56px tall. Blank dot, noun label, placeholder
// metric. No motion. Matches the resolved TrustStrip layout — four
// equal-width anchor-like blocks in a single row — so when the strip
// streams in there is no layout shift.

const TRUST_STRIP_NOUNS = ['Substrate', 'Isolation', 'Integrations', 'Governance'] as const;

export function TrustStripSkeleton() {
  return (
    <div
      data-testid="admin-trust-strip-skeleton"
      role="status"
      aria-label="Loading trust posture"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 10,
        height: 56,
        fontFamily: F_BODY,
      }}
    >
      {TRUST_STRIP_NOUNS.map((noun) => (
        <div
          key={noun}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            border: `1px dashed ${C.borderLight}`,
            background: C.surface,
            borderRadius: 6,
            minWidth: 0,
          }}
        >
          {/* Blank dot — hollow circle in faint border. */}
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: `1.5px solid ${C.borderLight}`,
              flex: '0 0 auto',
            }}
          />
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.faint,
              whiteSpace: 'nowrap',
            }}
          >
            {noun}
          </span>
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 11,
              color: C.borderLight,
              letterSpacing: '0.05em',
              marginLeft: 'auto',
            }}
          >
            {PLACEHOLDER}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── ActionQueueSkeleton ─────────────────────────────────────────────
//
// Three ghost rows that match the resolved action-queue row layout
// (32px severity column · label · open button slot). Replaces label
// and consequence with mono `···`.

export function ActionQueueSkeleton() {
  return (
    <div
      data-testid="admin-action-queue-skeleton"
      role="status"
      aria-label="Loading action queue"
      style={{ display: 'grid', gap: 10, fontFamily: F_BODY }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr auto',
            alignItems: 'center',
            gap: 16,
            padding: '14px 18px',
            border: `1px dashed ${C.borderLight}`,
            background: C.surface,
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 11,
              fontWeight: 700,
              color: C.borderLight,
              letterSpacing: '0.06em',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: F_MONO,
                fontSize: 12,
                color: C.borderLight,
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              {PLACEHOLDER}
            </div>
            <div
              style={{
                fontFamily: F_MONO,
                fontSize: 10.5,
                color: C.borderLight,
                letterSpacing: '0.04em',
              }}
            >
              {PLACEHOLDER}
            </div>
          </div>
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              border: `1px dashed ${C.borderLight}`,
              color: C.borderLight,
              background: C.surface,
              borderRadius: 4,
            }}
          >
            {PLACEHOLDER}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── PostureGridSkeleton ─────────────────────────────────────────────
//
// 2×2 muted cards. Each card mimics the PostureGrid card layout: mono
// eyebrow noun, body line placeholder, big serif stat placeholder, and
// a mono footer placeholder.

const POSTURE_NOUNS = [
  'Substrate readiness',
  'Connector health',
  'Auth & isolation',
  'Approvals & policy',
] as const;

export function PostureGridSkeleton() {
  return (
    <div
      data-testid="admin-posture-grid-skeleton"
      role="status"
      aria-label="Loading trust posture grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
        fontFamily: F_BODY,
      }}
    >
      {POSTURE_NOUNS.map((noun) => (
        <div
          key={noun}
          style={{
            border: `1px dashed ${C.borderLight}`,
            background: C.surface,
            borderRadius: 8,
            padding: 20,
            borderLeftWidth: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: 132,
          }}
        >
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: C.faint,
            }}
          >
            {noun}
          </div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 12,
              color: C.borderLight,
              letterSpacing: '0.05em',
            }}
          >
            {PLACEHOLDER}
          </div>
          <div
            style={{
              fontFamily: F_DISPLAY,
              fontSize: 26,
              fontWeight: 400,
              color: C.borderLight,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {PLACEHOLDER}
          </div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10.5,
              color: C.borderLight,
              letterSpacing: '0.04em',
              marginTop: 'auto',
            }}
          >
            {PLACEHOLDER}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AuditRibbonSkeleton ─────────────────────────────────────────────
//
// Six muted rows that match the resolved AuditRibbon row layout:
// timestamp column · source chip · actor · action · target. All
// replaced with mono `···`.

export function AuditRibbonSkeleton() {
  return (
    <div
      data-testid="admin-audit-ribbon-skeleton"
      role="status"
      aria-label="Loading audit ribbon"
      style={{
        display: 'grid',
        gap: 0,
        fontFamily: F_BODY,
        borderTop: `1px dashed ${C.borderLight}`,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 88px 1fr',
            alignItems: 'baseline',
            gap: 16,
            padding: '12px 0',
            borderBottom: `1px dashed ${C.borderLight}`,
          }}
        >
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 10.5,
              color: C.borderLight,
              letterSpacing: '0.05em',
            }}
          >
            {PLACEHOLDER}
          </span>
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 9.5,
              color: C.borderLight,
              letterSpacing: '0.05em',
              padding: '2px 8px',
              border: `1px dashed ${C.borderLight}`,
              borderRadius: 3,
              display: 'inline-block',
              textAlign: 'center',
            }}
          >
            {PLACEHOLDER}
          </span>
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 11,
              color: C.borderLight,
              letterSpacing: '0.04em',
            }}
          >
            {PLACEHOLDER}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── StewardOrientationSkeleton ──────────────────────────────────────
//
// Skeleton for the Zone F "Steward's read" block — the editorial
// orientation paragraph + two-column loaded/missing strip. Used when
// the steward data is wrapped in its own Suspense boundary.

export function StewardOrientationSkeleton() {
  return (
    <div
      data-testid="admin-steward-orientation-skeleton"
      role="status"
      aria-label="Loading Ava orientation"
      style={{
        border: `1px dashed ${C.borderLight}`,
        background: C.surface,
        borderRadius: 10,
        padding: '28px 28px 22px',
        fontFamily: F_BODY,
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.faint,
          marginBottom: 12,
        }}
      >
        Ava · Tenant orientation
      </div>
      <div
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 22,
          fontWeight: 400,
          color: C.borderLight,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          marginBottom: 18,
          maxWidth: '60ch',
        }}
      >
        {PLACEHOLDER}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          paddingTop: 18,
          borderTop: `1px dashed ${C.borderLight}`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.faint,
              marginBottom: 10,
            }}
          >
            Loaded · grounded
          </div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 13,
              color: C.borderLight,
              letterSpacing: '0.04em',
            }}
          >
            {PLACEHOLDER}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.faint,
              marginBottom: 10,
            }}
          >
            Missing · authored only
          </div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 13,
              color: C.borderLight,
              letterSpacing: '0.04em',
            }}
          >
            {PLACEHOLDER}
          </div>
        </div>
      </div>
    </div>
  );
}
