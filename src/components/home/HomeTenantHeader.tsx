// Home tenant header · the client-grounded identity block at the top
// of /home (the Home Overview page).
//
// PR-H8 (2026-05-07): replaces the platform-voiced PageHead
// ("SETUP · MERIDIAN HEALTH" eyebrow + cold h1) with the tenant's
// own identity — a programmatic monogram in the tenant's
// industry-themed color, the tenant name as the page title, and a
// short tagline. When a real customer onboards, swap the monogram
// for their logo via clients.logo_url (not in this PR — TODO marker
// in the component).

import type { ClientKey } from '@/lib/client-config';
import { COLORS, FONT, SPACING, RADIUS } from '@/lib/design/abarva-theme';

interface TenantBrand {
  initials: string;
  bgColor: string;
  tagline: string;
}

// Per-tenant brand map. Color drawn from industry archetype.
// When clients.logo_url + clients.brand_color land, this map collapses
// to a fallback only.
const TENANT_BRAND: Record<ClientKey, TenantBrand> = {
  meridian: {
    initials: 'MH',
    bgColor: '#0F766E', // teal — healthcare
    tagline: 'Healthcare IDN · 8 hospitals · 142 clinics',
  },
  apexretail: {
    initials: 'AR',
    bgColor: '#C2410C', // burnt orange — retail
    tagline: 'Omnichannel retail · 412 stores · $4.2B revenue',
  },
  arcturus: {
    initials: 'FC',
    bgColor: '#1E3A8A', // navy — financial services
    tagline: 'Regional bank · $48B AUM · 142 branches',
  },
};

const FALLBACK_BRAND: TenantBrand = {
  initials: '·',
  bgColor: COLORS.navy,
  tagline: '',
};

interface Props {
  tenantName: string;
  clientKey: ClientKey | null;
  /** Optional override headline. Defaults to "Where you stand and what to do next." */
  headline?: string;
  /** Optional override sub-line. */
  subline?: string;
}

function fallbackInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? '') + (parts[1]![0] ?? '')).toUpperCase();
}

export function HomeTenantHeader({
  tenantName,
  clientKey,
  headline = 'Where you stand and what to do next.',
  subline = 'Eight panels do the work. This page orients you and routes you to the right one.',
}: Props) {
  // TODO: when clients.logo_url ships, prefer the live logo over the
  // monogram. For now, the monogram is the brand mark.
  const known = clientKey ? TENANT_BRAND[clientKey] : undefined;
  const brand: TenantBrand = known ?? {
    ...FALLBACK_BRAND,
    initials: fallbackInitials(tenantName),
  };

  return (
    <header
      data-home-tenant-header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: RADIUS.lg,
            background: brand.bgColor,
            color: COLORS.surface,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.02em',
            flexShrink: 0,
            // Subtle inner ring so the mark reads as a logo, not a chip
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
          }}
        >
          {brand.initials}
        </span>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: FONT.body,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {tenantName}
          </h1>
          {brand.tagline && (
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 13,
                color: COLORS.muted,
                marginTop: SPACING.xs,
              }}
            >
              {brand.tagline}
            </div>
          )}
        </div>
      </div>
      <div>
        <h2
          style={{
            fontFamily: FONT.body,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.body,
            margin: 0,
            marginBottom: SPACING.xs,
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            color: COLORS.muted,
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {subline}
        </p>
      </div>
    </header>
  );
}
