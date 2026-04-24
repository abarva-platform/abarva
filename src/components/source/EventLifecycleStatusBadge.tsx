import { getLifecycleStatusLabel, getLifecycleTone } from '@/lib/source/lifecycle';
import type { SourceLifecycleStatus } from '@/lib/source/types';
import { COMPONENTS, COLORS, FONTS } from '@/lib/design-system';

export function EventLifecycleStatusBadge({
  status,
  label,
}: {
  status: SourceLifecycleStatus;
  label?: string;
}) {
  const tone = getLifecycleTone(status);
  const styles =
    tone === 'critical'
      ? COMPONENTS.riskPill('high')
      : tone === 'warning'
        ? COMPONENTS.riskPill('medium')
        : tone === 'success'
          ? COMPONENTS.riskPill('low')
          : {
              fontFamily: FONTS.mono,
              fontSize: '9px',
              padding: '3px 8px',
              borderRadius: 20,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              background: tone === 'info' ? COLORS.tealDim : 'rgba(255,255,255,0.04)',
              color: COLORS.textPrimary,
              border: `1px solid ${tone === 'info' ? COLORS.tealBorder : COLORS.border}`,
            };

  return <span style={styles}>{label ?? getLifecycleStatusLabel(status)}</span>;
}
