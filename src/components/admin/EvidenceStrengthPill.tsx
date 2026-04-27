import { COLORS, RADIUS, TYPOGRAPHY } from '@/lib/design/design-tokens';

export type EvidenceStrength = 'strong' | 'partial' | 'thin';

export interface EvidenceStrengthPillProps {
  strength: EvidenceStrength;
  label?: string;
}

const STRENGTH_STYLES: Record<EvidenceStrength, { bg: string; fg: string; defaultLabel: string }> = {
  strong: { bg: COLORS.mintSoft, fg: COLORS.mintInk, defaultLabel: 'Evidence: Strong' },
  partial: { bg: COLORS.amberSoft, fg: COLORS.amberInk, defaultLabel: 'Evidence: Partial' },
  thin: { bg: COLORS.amberSoft, fg: COLORS.amberInk, defaultLabel: 'Evidence: Thin' },
};

export function EvidenceStrengthPill({ strength, label }: EvidenceStrengthPillProps) {
  const styles = STRENGTH_STYLES[strength];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: RADIUS.pill,
        background: styles.bg,
        color: styles.fg,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 600,
      }}
      data-evidence-strength={strength}
    >
      {label ?? styles.defaultLabel}
    </span>
  );
}
