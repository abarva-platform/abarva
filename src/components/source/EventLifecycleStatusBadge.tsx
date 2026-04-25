import { getLifecycleStatusLabel, getLifecycleTone } from '@/lib/source/lifecycle';
import type { SourceLifecycleStatus } from '@/lib/source/types';
import { COMPONENTS, COLORS, FONTS } from '@/lib/design-system';

export function EventLifecycleStatusBadge({
  status,
  label,
  variant = 'dark',
}: {
  status: SourceLifecycleStatus;
  label?: string;
  variant?: 'dark' | 'light';
}) {
  const tone = getLifecycleTone(status);
  const isLight = variant === 'light';
  const styles =
    tone === 'critical'
      ? COMPONENTS.riskPill('high')
      : tone === 'warning'
        ? COMPONENTS.riskPill('medium')
        : tone === 'success'
          ? COMPONENTS.riskPill('low')
          : {
              display: 'inline-flex',
              alignItems: 'center',
              width: 'fit-content',
              fontFamily: FONTS.mono,
              fontSize: '9px',
              padding: '3px 8px',
              borderRadius: 20,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              fontWeight: 600,
              background: tone === 'info'
                ? (isLight ? 'rgba(15,118,110,0.10)' : COLORS.tealDim)
                : (isLight ? 'rgba(17,24,39,0.04)' : 'rgba(255,255,255,0.04)'),
              color: tone === 'info' && isLight ? '#0F766E' : (isLight ? '#101827' : COLORS.textPrimary),
              border: `1px solid ${tone === 'info' ? COLORS.tealBorder : COLORS.border}`,
            };

  return <span style={styles}>{label ?? getLifecycleStatusLabel(status)}</span>;
}
