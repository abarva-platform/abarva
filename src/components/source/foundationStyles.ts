import type { CSSProperties } from 'react';
import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';

export const sourcePageHeader: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 28,
};

export const sourceEyebrow: CSSProperties = {
  ...TEXT.productLabel,
};

export const sourceTitle: CSSProperties = {
  fontFamily: FONTS.serif,
  fontSize: '34px',
  lineHeight: 1.1,
  color: COLORS.textPrimary,
  margin: 0,
};

export const sourceSummary: CSSProperties = {
  ...TEXT.bodySecondary,
  maxWidth: 860,
  margin: 0,
};

export const sourceCard: CSSProperties = {
  ...COMPONENTS.card,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

export const sourceInsetCard: CSSProperties = {
  ...COMPONENTS.cardInset,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

export const sourceGrid: CSSProperties = {
  display: 'grid',
  gap: 16,
};

export const sourceSectionLabel: CSSProperties = {
  ...TEXT.sectionLabel,
  marginBottom: 0,
};

export const sourcePillRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

export const sourceMuted: CSSProperties = {
  ...TEXT.bodySecondary,
};

export const sourceMetricValue: CSSProperties = {
  ...TEXT.metricValue,
  fontSize: '24px',
};

export const sourceMetricLabel: CSSProperties = {
  ...TEXT.small,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

export const sourceMetricDetail: CSSProperties = {
  ...TEXT.bodySecondary,
  fontSize: '12px',
};

export const sourceTabLink = (active: boolean): CSSProperties => ({
  textDecoration: 'none',
  padding: '10px 14px',
  borderRadius: 999,
  border: `1px solid ${active ? COLORS.tealBorder : COLORS.border}`,
  background: active ? COLORS.tealDim : 'transparent',
  color: active ? COLORS.textPrimary : COLORS.textSecondary,
  fontFamily: FONTS.sans,
  fontSize: '13px',
  fontWeight: 600,
});

export const sourceTableCell: CSSProperties = {
  padding: '12px 14px',
  borderTop: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
};

export const sourceActionLink = (emphasis: 'primary' | 'secondary' = 'secondary'): CSSProperties => ({
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: emphasis === 'primary' ? '9px 12px' : '8px 11px',
  borderRadius: 999,
  border: `1px solid ${emphasis === 'primary' ? COLORS.tealBorder : COLORS.border}`,
  background: emphasis === 'primary' ? COLORS.tealDim : 'transparent',
  color: COLORS.textPrimary,
  fontFamily: FONTS.sans,
  fontSize: '12px',
  fontWeight: 600,
});

export const sourceTableHeaderCell: CSSProperties = {
  ...TEXT.small,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '0 14px 10px',
  borderBottom: `1px solid ${COLORS.border}`,
};

export const sourceAttentionItem = (tone: 'info' | 'warning' | 'critical'): CSSProperties => ({
  ...sourceInsetCard,
  gap: 8,
  borderColor:
    tone === 'critical'
      ? 'rgba(239,68,68,0.24)'
      : tone === 'warning'
        ? 'rgba(245,158,11,0.24)'
        : COLORS.border,
  background:
    tone === 'critical'
      ? 'rgba(239,68,68,0.06)'
      : tone === 'warning'
        ? 'rgba(245,158,11,0.06)'
        : 'rgba(255,255,255,0.02)',
});
