// /programs/expert-kernel/expert-review — the Moves Expert Review Console.
//
// A design-partner reviewer's directive: do not build more broad surfaces —
// build the console where real finance / delivery / sourcing / domain experts
// read the kernel's generated business case and calibrate it. This page is
// that console.
//
// The kernel is now proven on THREE tenant anchors — Apex Retail, Meridian
// Health System, First Capital Financial. The console is tenant-switchable: a
// `?case=` searchParam (defaulting to Apex) selects which grounded case the
// kernel renders, resolved through the `expert-review-cases` registry.
//
// It surfaces, per the spec:
//   1 the generated business case (kernel skeleton)
//   2 missing evidence — baseline seed gaps
//   3 assumptions + sensitivity (top movers)
//   4 critic challenges
//   5 a verdict form that produces an ExpertReviewInput
//   6 reviewer notes captured back into the assumption ledger
//   7 the running ExpertCalibrationResult
//
// The kernel does the analysis; this server component reads the persisted
// reviews through the data-plane seam, runs the pure console view-model, and
// renders. No fabrication — every figure is the selected tenant's audited
// substrate.

import Link from 'next/link';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/lib/design/design-tokens';
import {
  buildExpertReviewConsole,
  EXPERT_REVIEW_VERDICTS,
  EXPERT_REVIEW_CASE_IDS,
  EXPERT_REVIEW_CASES,
  resolveExpertReviewCase,
} from '@/lib/programs/expert-kernel';
import { selectExpertReviewsReadAdapter } from '@/lib/data-plane/read-adapters/expertReviewsReadAdapter';
import { ExpertReviewForm } from '@/components/programs/ExpertReviewForm';
import { recordExpertReviewAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Expert Review Console · Moves Expert Kernel · AbarVa',
};

const usd = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 19,
  fontWeight: 600,
  color: COLORS.ink,
  margin: 0,
  marginBottom: SPACING.sm,
  letterSpacing: '-0.01em',
};

function Pill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'bad' }) {
  const bg =
    tone === 'good'
      ? COLORS.mintSoft
      : tone === 'warn'
        ? COLORS.amberSoft
        : COLORS.coralSoft;
  const color =
    tone === 'good'
      ? COLORS.mintInk
      : tone === 'warn'
        ? COLORS.amberInk
        : COLORS.coralInk;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: SPACING.xl }}>
      <h2 style={SECTION_TITLE}>
        <span style={{ color: COLORS.navy, marginRight: 8 }}>{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const CARD: React.CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}22`,
  borderRadius: RADIUS.md,
  padding: SPACING.md,
  marginBottom: SPACING.sm,
};

const META: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  letterSpacing: '0.04em',
  color: COLORS.ink,
  opacity: 0.7,
};

const BODY: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  lineHeight: 1.55,
  color: COLORS.ink,
  margin: 0,
};

const VERDICT_TONE: Record<string, 'good' | 'warn' | 'bad'> = Object.fromEntries(
  EXPERT_REVIEW_VERDICTS.map((v) => [v.verdict, v.tone]),
);
const VERDICT_LABEL: Record<string, string> = Object.fromEntries(
  EXPERT_REVIEW_VERDICTS.map((v) => [v.verdict, v.label]),
);

export default async function ExpertReviewConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  // Resolve the tenant case from the `?case=` selector (defaults to Apex).
  const { case: caseParam } = await searchParams;
  const reviewCase = resolveExpertReviewCase(caseParam);

  // 1 — the generated business case for the selected tenant.
  const { skeleton } = reviewCase.buildCase();

  // Persisted reviews — read through the data-plane seam, fail-soft to [].
  const reviews = await selectExpertReviewsReadAdapter().listForMove(
    reviewCase.tenantKey,
    reviewCase.moveRef,
  );

  // The pure console view-model: annotation + calibration in one pass.
  const view = buildExpertReviewConsole(skeleton, reviews);
  const cal = view.calibration;
  const calTone =
    cal.verdict === 'accepted'
      ? 'good'
      : cal.verdict === 'conditional'
        ? 'warn'
        : 'bad';

  return (
    <main
      style={{
        background: COLORS.cream,
        color: COLORS.ink,
        maxWidth: '8.5in',
        margin: '0 auto',
        padding: `${SPACING.xl} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <header
        style={{
          borderBottom: `2px solid ${COLORS.ink}`,
          paddingBottom: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          AbarVa · Moves Expert Review Console · Kernel calibration loop
        </div>
        <h1
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            margin: 0,
            marginBottom: 6,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {view.moveName}
        </h1>
        <div style={{ ...META, marginBottom: SPACING.sm }}>
          {reviewCase.tenantLabel} · {view.tenantKey} · {reviewCase.moveRef} · the
          kernel generated this case; experts calibrate it below.
        </div>
        {/* Tenant switcher — three kernel-anchored cases, locked design. */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.xs,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ ...META, marginRight: 4 }}>TENANT CASE</span>
          {EXPERT_REVIEW_CASE_IDS.map((id) => {
            const entry = EXPERT_REVIEW_CASES[id];
            const active = id === reviewCase.id;
            return (
              <Link
                key={id}
                href={`?case=${id}`}
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${active ? COLORS.ink : `${COLORS.ink}55`}`,
                  background: active ? COLORS.ink : 'transparent',
                  color: active ? COLORS.white : COLORS.ink,
                }}
              >
                {entry.tenantLabel}
              </Link>
            );
          })}
        </div>
      </header>

      {/* 7 — running calibration result (surfaced first: it is the verdict) */}
      <Section n="7" title="Calibration verdict">
        <div style={CARD}>
          <div
            style={{
              display: 'flex',
              gap: SPACING.sm,
              alignItems: 'center',
              marginBottom: SPACING.sm,
              flexWrap: 'wrap',
            }}
          >
            <Pill label={cal.verdict.replace('_', ' ')} tone={calTone} />
            <span style={META}>
              {cal.reviewCount} review{cal.reviewCount === 1 ? '' : 's'} ·
              roles covered: {cal.rolesCovered.length > 0
                ? cal.rolesCovered.join(', ')
                : 'none yet'}
            </span>
          </div>
          {cal.findings.length > 0 && (
            <ul style={{ ...BODY, paddingLeft: 18, marginTop: SPACING.xs }}>
              {cal.findings.map((f) => (
                <li key={f.code} style={{ marginBottom: 2 }}>
                  <Pill
                    label={f.severity}
                    tone={
                      f.severity === 'blocker'
                        ? 'bad'
                        : f.severity === 'condition'
                          ? 'warn'
                          : 'good'
                    }
                  />{' '}
                  {f.message}
                </li>
              ))}
            </ul>
          )}
          {cal.requiredActions.length > 0 && (
            <div style={{ marginTop: SPACING.sm }}>
              <div style={{ ...META, marginBottom: 2 }}>
                REQUIRED ACTIONS BEFORE PROMOTION
              </div>
              <ul style={{ ...BODY, paddingLeft: 18 }}>
                {cal.requiredActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* 1 — the generated business case */}
      <Section n="1" title="Generated business case">
        <div style={CARD}>
          <div
            style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.sm }}
          >
            <Pill
              label={skeleton.recommendation}
              tone={
                skeleton.recommendation === 'fund'
                  ? 'good'
                  : skeleton.recommendation === 'shape'
                    ? 'warn'
                    : 'bad'
              }
            />
            {skeleton.critic.hasBlocker && (
              <Pill label="critic blocker open" tone="bad" />
            )}
          </div>
          <p style={BODY}>{skeleton.recommendationRationale}</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING.sm,
              marginTop: SPACING.md,
            }}
          >
            <div>
              <div style={META}>NET VALUE (POST-HAIRCUT, 3YR)</div>
              <div style={BODY}>
                {usd(skeleton.valueRange.low)} – {usd(skeleton.valueRange.high)}
              </div>
            </div>
            <div>
              <div style={META}>COST / EFFORT</div>
              <div style={BODY}>
                {usd(skeleton.effortRange.low)} – {usd(skeleton.effortRange.high)}
              </div>
            </div>
            <div>
              <div style={META}>NET RETURN</div>
              <div style={BODY}>
                {usd(skeleton.economics.netReturn.low)} –{' '}
                {usd(skeleton.economics.netReturn.high)}
              </div>
            </div>
            <div>
              <div style={META}>PAYBACK</div>
              <div style={BODY}>
                {skeleton.economics.monetisable &&
                skeleton.economics.paybackMonths !== null
                  ? `${skeleton.economics.paybackMonths} months`
                  : 'Not monetisable — blocked on a baseline seed gap.'}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 2 — missing evidence */}
      <Section n="2" title="Missing evidence — baseline seed gaps">
        {view.missingEvidence.length === 0 ? (
          <p style={BODY}>No seed gaps — the baseline is fully recorded.</p>
        ) : (
          view.missingEvidence.map((m) => (
            <div key={m.key} style={CARD}>
              <div style={{ ...BODY, fontWeight: 700 }}>
                {m.label}{' '}
                <code style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
                  {m.key}
                </code>
              </div>
              <p style={{ ...BODY, marginTop: 2 }}>{m.seedGapReason}</p>
            </div>
          ))
        )}
      </Section>

      {/* 3 — assumptions + sensitivity + reviewer-note annotations */}
      <Section n="3" title="Assumptions, sensitivity & reviewer notes">
        <div style={{ ...META, marginBottom: SPACING.xs }}>
          TOP MOVERS — the assumptions that move ~80% of the case:{' '}
          {view.topMovers.map((a) => a.key).join(', ')}
        </div>
        <div style={{ ...META, marginBottom: SPACING.sm }}>
          SENSITIVITY · {skeleton.sensitivity.whatBreaksTheCase}
        </div>
        {view.assumptions.map(({ assumption, reviewerNotes }) => {
          const isMover = view.topMovers.some((m) => m.key === assumption.key);
          return (
            <div
              key={assumption.key}
              style={{
                ...CARD,
                borderLeft: isMover
                  ? `3px solid ${COLORS.navy}`
                  : CARD.border as string,
              }}
            >
              <div style={{ ...BODY, fontWeight: 700 }}>
                <code style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
                  {assumption.key}
                </code>
                {isMover && (
                  <span style={{ marginLeft: 8 }}>
                    <Pill label="top mover" tone="warn" />
                  </span>
                )}
              </div>
              <p style={{ ...BODY, marginTop: 2 }}>{assumption.statement}</p>
              <div style={{ ...META, marginTop: 4 }}>
                owner: {assumption.owner} · confidence: {assumption.confidence} ·
                impact: {assumption.sensitivityImpact}
                {assumption.isSeedGapProxy ? ' · SEED-GAP PROXY' : ''}
              </div>
              {reviewerNotes.length > 0 && (
                <div
                  style={{
                    marginTop: SPACING.sm,
                    paddingTop: SPACING.sm,
                    borderTop: `1px solid ${COLORS.ink}18`,
                  }}
                >
                  <div style={{ ...META, marginBottom: 2 }}>
                    REVIEWER NOTES ON THIS ASSUMPTION
                  </div>
                  {reviewerNotes.map((rn, i) => (
                    <p key={`${rn.reviewerId}-${i}`} style={{ ...BODY, fontSize: 12 }}>
                      <Pill
                        label={VERDICT_LABEL[rn.verdict] ?? rn.verdict}
                        tone={VERDICT_TONE[rn.verdict] ?? 'warn'}
                      />{' '}
                      <strong>
                        {rn.reviewerId} ({rn.role})
                      </strong>
                      : {rn.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Section>

      {/* 4 — critic challenges */}
      <Section n="4" title="Critic challenges">
        {view.criticChallenges.length === 0 ? (
          <p style={BODY}>The critic raised no findings.</p>
        ) : (
          view.criticChallenges.map((f) => (
            <div key={f.code} style={CARD}>
              <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: 2 }}>
                <Pill
                  label={f.severity}
                  tone={
                    f.severity === 'blocker'
                      ? 'bad'
                      : f.severity === 'concern'
                        ? 'warn'
                        : 'good'
                  }
                />
                <span style={META}>{f.lens} lens</span>
              </div>
              <p style={BODY}>{f.message}</p>
            </div>
          ))
        )}
      </Section>

      {/* 6 — reviews accumulated so far */}
      <Section n="6" title="Reviews on file">
        {view.reviews.length === 0 ? (
          <p style={BODY}>
            No expert reviews yet. The calibration verdict is{' '}
            <strong>not ready</strong> until at least two experts — one a CFO,
            one a delivery or transformation lead — have reviewed.
          </p>
        ) : (
          view.reviews.map((r, i) => (
            <div key={`${r.reviewerId}-${i}`} style={CARD}>
              <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: 2 }}>
                <Pill
                  label={VERDICT_LABEL[r.verdict] ?? r.verdict}
                  tone={VERDICT_TONE[r.verdict] ?? 'warn'}
                />
                <span style={META}>
                  {r.reviewerId} · {r.role}
                </span>
              </div>
              <p style={BODY}>{r.note}</p>
              {(r.assumptionKeys ?? []).length > 0 && (
                <div style={{ ...META, marginTop: 4 }}>
                  touches: {(r.assumptionKeys ?? []).join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </Section>

      {/* 5 — the verdict form */}
      <Section n="5" title="Mark a verdict">
        <ExpertReviewForm
          assumptions={view.assumptions.map(({ assumption }) => ({
            key: assumption.key,
            statement: assumption.statement,
          }))}
          action={recordExpertReviewAction}
          caseId={reviewCase.id}
        />
      </Section>

      <footer style={{ ...META, marginTop: SPACING.xl }}>
        Reviews persist to the tenant-scoped, RLS-protected{' '}
        <code style={{ fontFamily: TYPOGRAPHY.mono }}>expert_reviews</code> table
        (append-only). The calibration engine re-runs on every render.
      </footer>
    </main>
  );
}
