export const VALUE_OFFICE_COLORS = {
  bg: '#F4EFE6',
  pageBg: '#F6F1E8',
  panel: '#FFFCF6',
  shell: '#F9F4EC',
  ink: '#171411',
  muted: '#6E655C',
  line: '#DDCFBD',
  teal: '#127C72',
  red: '#A43D34',
  gold: '#B0721E',
} as const

export function valueOfficeBannerStyle(background: string, border: string, color: string) {
  return {
    background,
    border: `1px solid ${border}`,
    borderRadius: 18,
    padding: '14px 18px',
    fontFamily: 'DM Sans, sans-serif',
    color,
    lineHeight: 1.55,
  } as const
}

export function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}
