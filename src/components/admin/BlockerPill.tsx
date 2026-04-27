import { COLORS, RADIUS, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface BlockerPillProps {
  label: string;
}

export function BlockerPill({ label }: BlockerPillProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: RADIUS.pill,
        background: COLORS.coralSoft,
        color: COLORS.coralInk,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 600,
      }}
      data-blocker="true"
    >
      Blocker: {label}
    </span>
  );
}
