import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ArchitecturePlane } from '@/lib/admin/architecture-page-view';

export interface ArchitecturePlaneStackProps {
  planes: ReadonlyArray<ArchitecturePlane>;
}

export function ArchitecturePlaneStack({ planes }: ArchitecturePlaneStackProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-architecture-plane-stack="true"
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.lg,
        }}
      >
        Architecture workflow
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        {planes.map((plane, idx) => (
          <li
            key={plane.id}
            style={{
              padding: `${SPACING.md} 0`,
              borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: SPACING.md,
              fontFamily: TYPOGRAPHY.sans,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: COLORS.ink,
              }}
            >
              {plane.label}
            </div>
            <div
              style={{
                fontSize: 13,
                color: `${COLORS.ink}cc`,
              }}
            >
              {plane.components.join(' · ')}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
