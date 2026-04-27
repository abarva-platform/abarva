import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { BuildSliceDetail } from '@/lib/admin/build-progress-page-view';

export interface SliceDetailDrawerProps {
  slice: BuildSliceDetail;
  closeHref: string;
}

/**
 * ADMIN15 — Slice drilldown drawer.
 *
 * Renders deterministic slice metadata: id, status, owner agent, dependencies,
 * synthesized PR link (only when status is merged/code_complete), branch, and
 * notes. URL-driven via `?slice=<id>`.
 */
export function SliceDetailDrawer({ slice, closeHref }: SliceDetailDrawerProps) {
  return (
    <aside
      data-component="SliceDetailDrawer"
      data-slice-id={slice.id}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}14`,
        padding: SPACING.xl,
        fontFamily: TYPOGRAPHY.sans,
        marginTop: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: SPACING.md,
          gap: SPACING.md,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.navy,
            }}
          >
            {slice.id}
          </span>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.ink,
              margin: `${SPACING.xs} 0 0`,
              letterSpacing: '-0.01em',
            }}
          >
            {slice.title}
          </h3>
        </div>
        <a
          href={closeHref}
          data-slice-close="true"
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Close
        </a>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: SPACING.md,
          margin: 0,
          fontSize: 13,
        }}
      >
        <Field label="Status" value={slice.status} mono />
        <Field label="Wave" value={slice.waveId} mono />
        <Field label="Owner agent" value={slice.ownerAgent} />
        <Field label="Completed at" value={slice.completedAt} mono />
        {slice.category ? <Field label="Category" value={slice.category} mono /> : null}
        {slice.risk ? <Field label="Risk" value={slice.risk} /> : null}
      </dl>

      <section style={{ marginTop: SPACING.lg }}>
        <h4
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: 0,
            color: `${COLORS.ink}80`,
            fontWeight: 700,
          }}
        >
          Dependencies
        </h4>
        {slice.dependsOn.length > 0 ? (
          <ul
            data-slice-deps="true"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: `${SPACING.sm} 0 0`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: SPACING.xs,
            }}
          >
            {slice.dependsOn.map((dep) => (
              <li
                key={dep}
                data-slice-dep={dep}
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: RADIUS.pill,
                  background: COLORS.skyPale,
                  color: COLORS.navy,
                }}
              >
                {dep}
              </li>
            ))}
          </ul>
        ) : (
          <p
            style={{
              margin: `${SPACING.xs} 0 0`,
              fontSize: 12,
              color: `${COLORS.ink}80`,
              fontStyle: 'italic',
            }}
          >
            No dependencies declared.
          </p>
        )}
      </section>

      <section style={{ marginTop: SPACING.lg }} data-slice-pr-section="true">
        <h4
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: 0,
            color: `${COLORS.ink}80`,
            fontWeight: 700,
          }}
        >
          Related PR
        </h4>
        {slice.prHref ? (
          <p style={{ margin: `${SPACING.xs} 0 0`, fontSize: 13 }}>
            <a
              href={slice.prHref}
              data-slice-pr-href={slice.prHref}
              rel="noreferrer noopener"
              target="_blank"
              style={{ color: COLORS.navy, textDecoration: 'underline', fontFamily: TYPOGRAPHY.mono }}
            >
              {slice.prHref}
            </a>
          </p>
        ) : (
          <p
            style={{
              margin: `${SPACING.xs} 0 0`,
              fontSize: 12,
              color: `${COLORS.ink}80`,
              fontStyle: 'italic',
            }}
          >
            No merged PR yet (synthesized link withheld until status flips to merged).
          </p>
        )}
        <p
          style={{
            margin: `${SPACING.xs} 0 0`,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}80`,
          }}
        >
          Branch: {slice.branch}
        </p>
      </section>

      {slice.notes ? (
        <section style={{ marginTop: SPACING.lg }}>
          <h4
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
              color: `${COLORS.ink}80`,
              fontWeight: 700,
            }}
          >
            Notes
          </h4>
          <p
            style={{
              margin: `${SPACING.xs} 0 0`,
              fontSize: 13,
              color: `${COLORS.ink}cc`,
              lineHeight: 1.5,
            }}
          >
            {slice.notes}
          </p>
        </section>
      ) : null}

      <p
        style={{
          marginTop: SPACING.lg,
          marginBottom: 0,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontStyle: 'italic',
          color: `${COLORS.ink}80`,
        }}
      >
        PR URL is deterministically synthesized for non-merged slices. Real GitHub
        integration is deferred to Wave 27.
      </p>
    </aside>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}80`,
          fontWeight: 700,
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: mono ? TYPOGRAPHY.mono : TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          fontWeight: 500,
        }}
      >
        {value}
      </dd>
    </div>
  );
}
