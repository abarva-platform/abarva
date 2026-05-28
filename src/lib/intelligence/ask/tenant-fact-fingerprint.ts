import 'server-only';

import {
  createDefaultSession,
  type SqlRunner,
} from '@/lib/data-plane/read-adapters/azureSession';

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
  try {
    const clientId = await resolveFingerprintClientId(args);
    if (!clientId) return null;

    const fingerprint = await fingerprintSession(async (run) => {
      const [
        executiveChunks,
        applicationCount,
        vendorCount,
        initiativeCount,
        financialProfile,
        financialChunks,
        boardChunks,
      ] = await Promise.all([
        countContextChunks(run, clientId, ['org_structure'], 'cfo|ceo|cio|chief|executive|Maya|Daniel|Priya|Elena|Marcus|Amala'),
        countRows(run, 'applications', clientId),
        countRows(run, 'vendor_contracts', clientId),
        countRows(run, 'ai_initiatives', clientId),
        readClientFinancialPresence(run, clientId),
        countContextChunks(run, clientId, ['it_financials'], '\\$|budget|spend|financial|FY26|FY2026|value|realized|disputed'),
        countContextChunks(run, clientId, ['enterprise_profile'], 'board|activist|capital markets|earnings|margin target|modernization'),
      ]);

      return {
        hasExecutiveBios: executiveChunks > 0,
        hasApplicationPortfolio: applicationCount > 0,
        hasVendorContracts: vendorCount > 0,
        hasInitiatives: initiativeCount > 0,
        hasFinancials: financialProfile || financialChunks > 0,
        hasBoardMinutes: boardChunks > 0,
        namedEntityClasses: [] as string[],
      } satisfies TenantFactFingerprint;
    });
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

const fingerprintSession = createDefaultSession('tenant-fact-fingerprint');

const TENANT_KEY_ALIASES: Record<string, string[]> = {
  apex: ['apex-retail', 'apexretail'],
  'apex-retail': ['apex-retail', 'apexretail'],
  meridian: ['meridian-health', 'meridian'],
  'meridian-health': ['meridian-health', 'meridian'],
  northstar: ['northstar-medtech', 'northstar'],
  'northstar-medtech': ['northstar-medtech', 'northstar'],
  firstcapital: ['first-capital', 'firstcapital'],
  'first-capital': ['first-capital', 'firstcapital'],
  'first-capital-financial': ['first-capital', 'firstcapital'],
  arcturus: ['first-capital', 'firstcapital'],
  skyharbor: ['skyharbor-air', 'skyharbor'],
  'skyharbor-air': ['skyharbor-air', 'skyharbor'],
};

async function resolveFingerprintClientId(args: {
  tenantId?: string | null;
  tenantInventoryKey?: string | null;
}): Promise<string | null> {
  const tenantId = args.tenantId?.trim();
  if (tenantId) return tenantId;

  const key = args.tenantInventoryKey?.trim().toLowerCase();
  if (!key) return null;
  const aliases = TENANT_KEY_ALIASES[key] ?? [key];
  try {
    return await fingerprintSession(async (run) => {
      const rows = await run<{ id: string }>(
        `SELECT id
           FROM clients
          WHERE tenant_key = ANY($1::text[]) OR slug = ANY($1::text[])
          LIMIT 1`,
        [aliases],
      );
      return rows[0]?.id ?? null;
    });
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
  run: SqlRunner,
  table: string,
  tenantId: string,
): Promise<number> {
  try {
    const rows = await run<{ count: number | string }>(
      `SELECT count(*)::int AS count FROM ${table} WHERE client_id = $1`,
      [tenantId],
    );
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

async function countContextChunks(
  run: SqlRunner,
  tenantId: string,
  segments: string[],
  queryRegex: string,
): Promise<number> {
  try {
    const rows = await run<{ chunk_text: string | null }>(
      `SELECT chunk_text
         FROM enterprise_context_chunks
        WHERE client_id = $1
          AND source_segment_id = ANY($2::text[])
        LIMIT 180`,
      [tenantId, segments],
    );
    const re = new RegExp(queryRegex, 'i');
    return rows.filter((row) => re.test(row.chunk_text ?? '')).length;
  } catch {
    return 0;
  }
}

async function readClientFinancialPresence(
  run: SqlRunner,
  tenantId: string,
): Promise<boolean> {
  try {
    const rows = await run<{
      annual_revenue_usd: number | string | null;
      it_budget_usd: number | string | null;
      ai_budget_usd: number | string | null;
    }>(
      `SELECT annual_revenue_usd, it_budget_usd, ai_budget_usd
         FROM clients
        WHERE id = $1
        LIMIT 1`,
      [tenantId],
    );
    const row = rows[0];
    return Boolean(row && (row.annual_revenue_usd != null || row.it_budget_usd != null || row.ai_budget_usd != null));
  } catch {
    return false;
  }
}
