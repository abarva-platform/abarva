export const CORPUS_INDUSTRY_SCOPE_ALIASES = {
  retail: ['retail'],
  healthcare: ['healthcare', 'healthcare_provider', 'healthcare_payer', 'healthcare_idn'],
  financial_services: ['financial_services', 'financial_services_banking', 'financial_services_insurance', 'finserv'],
  energy: ['energy'],
  airline: ['airline', 'global_network_airline', 'aviation'],
} as const;

type CorpusIndustry = keyof typeof CORPUS_INDUSTRY_SCOPE_ALIASES;

export interface CorpusIndustryScopeInput {
  tenantKey?: string | null;
  clientKey?: string | null;
  activeClient?: string | null;
  facts?: readonly string[] | null;
}

export function normalizeCorpusIndustryScope(value: string): string {
  return value.toLowerCase().replace(/[-\s]/g, '_');
}

export function inferCorpusIndustry(input: CorpusIndustryScopeInput): CorpusIndustry | null {
  const haystack = [
    input.tenantKey,
    input.clientKey,
    input.activeClient,
    ...(input.facts ?? []),
  ]
    .filter((item): item is string => Boolean(item))
    .join(' ')
    .toLowerCase();

  if (/\b(apex|apexretail|retail|merchandising|store|loyalty|inventory|assortment|sku)\b/.test(haystack)) return 'retail';
  if (/\b(meridian|northstar|helix|health|healthcare|clinical|patient|payer|provider|epic|ehr|medtech|med-tech|clinical[- ]?tech)\b/.test(haystack)) return 'healthcare';
  if (/\b(first[- ]?capital|firstcapital|brindlemark|arcturus|financial|bank|wealth|aml|kyc|underwriting|fraud)\b/.test(haystack)) return 'financial_services';
  if (/\b(keystone|energy|utility|utilities|grid)\b/.test(haystack)) return 'energy';
  if (/\b(skyharbor|airline|aviation|air)\b/.test(haystack)) return 'airline';
  return null;
}

export function allowedCorpusIndustryScopes(input: CorpusIndustryScopeInput): string[] | undefined {
  const industry = inferCorpusIndustry(input);
  if (!industry) return undefined;
  return Array.from(new Set([...CORPUS_INDUSTRY_SCOPE_ALIASES[industry], 'cross_industry']));
}

export function intersectCorpusIndustryScopes(
  requested: string[] | undefined,
  allowed: string[] | undefined,
): string[] | undefined {
  if (!allowed || allowed.length === 0) return requested;
  if (!requested || requested.length === 0) return allowed;
  const allowedSet = new Set(allowed.map(normalizeCorpusIndustryScope));
  const filtered = requested.filter((scope) => allowedSet.has(normalizeCorpusIndustryScope(scope)));
  return filtered.length > 0 ? filtered : allowed;
}

export function hasAllowedCorpusIndustryScope(
  scopes: readonly string[],
  allowed: string[] | undefined,
): boolean {
  if (!allowed || allowed.length === 0) return false;
  const allowedSet = new Set(allowed.map(normalizeCorpusIndustryScope));
  return scopes.some((scope) => allowedSet.has(normalizeCorpusIndustryScope(scope)));
}
