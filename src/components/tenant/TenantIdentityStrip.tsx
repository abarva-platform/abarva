import { demoSafeClientText } from "@/lib/client-config";

type TenantIdentityStripProps = {
  clientName: string | null | undefined;
  surface: string;
};

const stripStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid rgba(26,22,18,0.12)',
  borderRadius: 999,
  background: '#fff',
  color: '#1a1612',
  padding: '7px 11px',
  fontSize: 12,
  fontWeight: 760,
} as const;

const labelStyle = {
  fontFamily: 'var(--font-body-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#6d625a',
  fontSize: 10,
  fontWeight: 820,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as const;

export function TenantIdentityStrip({ clientName, surface }: TenantIdentityStripProps) {
  const displayName = clientName?.trim()
    ? demoSafeClientText(clientName.trim())
    : 'Tenant context unavailable';

  return (
    <div style={stripStyle} aria-label={`${surface} tenant identity`}>
      <span style={labelStyle}>Client</span>
      <span>{displayName}</span>
    </div>
  );
}
