import { SetupAuditPage, isAuditSourceFilter } from '@/components/setup/SetupAuditPage';

export const metadata = { title: 'Setup · Audit log · AbarVa' };

/**
 * Wave 1 PR-6: accept `?source=<source>` from the landing-page
 * AuditRibbon click and forward as a server-side filter into the
 * audit page. Unknown / missing values render the full list — no
 * 4xx, no redirect.
 *
 * Next 16: `searchParams` is now a Promise (per app-router stable
 * API). We await it before reading.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSource = params.source;
  const candidate = Array.isArray(rawSource) ? rawSource[0] : rawSource;
  const filterSource = isAuditSourceFilter(candidate) ? candidate : null;
  return <SetupAuditPage filterSource={filterSource} />;
}
