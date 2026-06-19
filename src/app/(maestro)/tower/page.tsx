import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow, hasLockedTenantSession } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata = { title: 'Tower Replacement Pending · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TowerPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function TowerPage({ searchParams }: TowerPageProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession()) ? rawRequestedClient : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'AbarVa Client';

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName,
        showLocked: Boolean(client?.key),
        context: `Tower · replacement pending · ${tenantName}`,
      }}
      hasTenantKey={Boolean(client?.key)}
    >
      <main
        style={{
          minHeight: 'calc(100vh - 72px)',
          background: '#f8f7f2',
          color: '#171717',
          padding: '48px',
          fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
        }}
      >
        <section
          style={{
            maxWidth: 960,
            border: '1px solid #ded9ce',
            background: '#fffefa',
            borderRadius: 8,
            padding: '32px',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              color: '#6a655c',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Tower surface removed
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.08,
              fontWeight: 760,
              letterSpacing: 0,
            }}
          >
            The previous Tower page has been retired.
          </h1>
          <p style={{ margin: '14px 0 0', maxWidth: 720, color: '#4f4b44', fontSize: 16, lineHeight: 1.55 }}>
            This route is intentionally holding a neutral shell until the approved HTML design is supplied and rendered exactly as provided.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
