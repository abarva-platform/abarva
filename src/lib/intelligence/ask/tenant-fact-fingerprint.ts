import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';

export interface TenantFactFingerprint {
  hasExecutiveBios: boolean;
  hasApplicationPortfolio: boolean;
  hasVendorContracts: boolean;
  hasInitiatives: boolean;
  hasFinancials: boolean;
  hasBoardMinutes: boolean;
  namedEntityClasses: string[];
}

export async function getTenantFactFingerprint(args: {
  tenantId?: string | null;
  tenantInventoryKey?: string | null;
}): Promise<TenantFactFingerprint | null> {
  if (!args.tenantId) return null;

  try {
    const sb = getServerSupabase();
    const [
      executiveChunks,
      applicationCount,
      vendorCount,
      initiativeCount,
      financialProfile,
      financialChunks,
      boardChunks,
    ] = await Promise.all([
      countContextChunks(sb, args.tenantId, ['org_structure'], 'cfo|ceo|cio|chief|executive|Maya|Daniel|Priya|Elena|Marcus'),
      countRows(sb, 'applications', args.tenantId),
      countRows(sb, 'vendor_contracts', args.tenantId),
      countRows(sb, 'ai_initiatives', args.tenantId),
      readClientFinancialPresence(sb, args.tenantId),
      countContextChunks(sb, args.tenantId, ['it_financials'], '$|budget|spend|financial|FY26|FY2026'),
      countContextChunks(sb, args.tenantId, ['enterprise_profile'], 'board|activist|capital markets|earnings|margin target'),
    ]);

    const fingerprint: TenantFactFingerprint = {
      hasExecutiveBios: executiveChunks > 0,
      hasApplicationPortfolio: applicationCount > 0,
      hasVendorContracts: vendorCount > 0,
      hasInitiatives: initiativeCount > 0,
      hasFinancials: financialProfile || financialChunks > 0,
      hasBoardMinutes: boardChunks > 0,
      namedEntityClasses: [],
    };
    if (fingerprint.hasExecutiveBios) fingerprint.namedEntityClasses.push('executives');
    if (fingerprint.hasApplicationPortfolio) fingerprint.namedEntityClasses.push('apps');
    if (fingerprint.hasVendorContracts) fingerprint.namedEntityClasses.push('vendors');
    if (fingerprint.hasInitiatives) fingerprint.namedEntityClasses.push('initiatives');
    if (fingerprint.hasFinancials) fingerprint.namedEntityClasses.push('financials');
    if (fingerprint.hasBoardMinutes) fingerprint.namedEntityClasses.push('board');
    return fingerprint;
  } catch {
    return null;
  }
}

export function formatTenantFactAvailabilityBlock(fingerprint: TenantFactFingerprint | null): string {
  if (!fingerprint) return '';

  return [
    'FACT AVAILABILITY (current session):',
    `- Executive bios:        ${String(fingerprint.hasExecutiveBios)}`,
    `- Application portfolio: ${String(fingerprint.hasApplicationPortfolio)}`,
    `- Vendor contracts:      ${String(fingerprint.hasVendorContracts)}`,
    `- Initiatives:           ${String(fingerprint.hasInitiatives)}`,
    `- Financial figures:     ${String(fingerprint.hasFinancials)}`,
    `- Board / investor facts: ${String(fingerprint.hasBoardMinutes)}`,
    `- Named entity classes:  ${fingerprint.namedEntityClasses.length > 0 ? fingerprint.namedEntityClasses.join(', ') : 'none'}`,
    '',
    'When the user asks for a fact in a class marked false, you MUST refuse the specific named-entity request and offer either a pattern-based answer with an explicit "this is a pattern, not your data" caveat or explain which data needs to be ingested first.',
    'Never fabricate names, dollars, dates, vendors, systems, executives, renewals, initiatives, or other named entities for classes marked false.',
    'When a class is true, prefer TENANT structured sources and tenant chunks over industry-pattern sources.',
  ].join('\n');
}

async function countRows(
  sb: ReturnType<typeof getServerSupabase>,
  table: string,
  tenantId: string,
): Promise<number> {
  const { count, error } = await sb
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('client_id', tenantId);
  if (error) return 0;
  return count ?? 0;
}

async function countContextChunks(
  sb: ReturnType<typeof getServerSupabase>,
  tenantId: string,
  segments: string[],
  queryRegex: string,
): Promise<number> {
  const { data, error } = await sb
    .from('enterprise_context_chunks')
    .select('chunk_id,chunk_text,source_segment_id')
    .eq('client_id', tenantId)
    .in('source_segment_id', segments)
    .limit(120);
  if (error || !data) return 0;
  const re = new RegExp(queryRegex, 'i');
  return (data as Array<{ chunk_text?: string | null }>).filter((row) => re.test(row.chunk_text ?? '')).length;
}

async function readClientFinancialPresence(
  sb: ReturnType<typeof getServerSupabase>,
  tenantId: string,
): Promise<boolean> {
  const { data, error } = await sb
    .from('clients')
    .select('annual_revenue_usd,it_budget_usd,ai_budget_usd')
    .eq('id', tenantId)
    .maybeSingle();
  if (error || !data) return false;
  const row = data as Record<string, unknown>;
  return row.annual_revenue_usd != null || row.it_budget_usd != null || row.ai_budget_usd != null;
}
