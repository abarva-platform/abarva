export type ProductUsageModule =
  | 'home'
  | 'setup'
  | 'moves'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'investor'
  | 'public'
  | 'unknown';

const TEXT_LIMIT = 96;

export function deriveProductUsageModule(pathname: string | null | undefined): ProductUsageModule {
  const path = pathname ?? '';
  if (!path || path === '/') return 'public';
  if (path.startsWith('/home') || path.startsWith('/dashboard')) return 'home';
  if (path.startsWith('/admin') || path.startsWith('/platform')) return 'setup';
  if (path.startsWith('/strategic-moves') || path.startsWith('/programs') || path.startsWith('/engagements')) return 'moves';
  if (path.startsWith('/source')) return 'source';
  if (path.startsWith('/intelligence')) return 'intelligence';
  if (path.startsWith('/tower')) return 'tower';
  if (path.startsWith('/investor')) return 'investor';
  if (path.startsWith('/sign-in') || path.startsWith('/invite') || path.startsWith('/product') || path.startsWith('/learn')) return 'public';
  return 'unknown';
}

export function normalizeTelemetryText(value: string | null | undefined): string | null {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.length > TEXT_LIMIT ? `${normalized.slice(0, TEXT_LIMIT - 3)}...` : normalized;
}

export function safePathFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const parsed = new URL(href, 'https://app.abarva.ai');
    return `${parsed.pathname}${parsed.search ? parsed.search : ''}${parsed.hash ? parsed.hash : ''}`;
  } catch {
    return null;
  }
}
