import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DemoProgramsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; threadId?: string }>
}) {
  const params = await searchParams

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08111f',
        color: '#f8fafc',
        padding: '48px 24px',
        fontFamily: '"Anthropic Sans", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          border: '0.5px solid rgba(148, 163, 184, 0.28)',
          borderRadius: 24,
          background: 'rgba(15, 23, 42, 0.92)',
          padding: 32,
          boxShadow: '0 28px 90px rgba(2, 6, 23, 0.48)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 999,
            border: '0.5px solid rgba(45, 212, 191, 0.35)',
            color: '#5eead4',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Demo handoff
        </div>

        <h1 style={{ marginTop: 18, fontSize: 32, lineHeight: 1.1 }}>
          Intelligence would launch Programs origination here.
        </h1>

        <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: 'rgba(226, 232, 240, 0.82)' }}>
          This public demo route preserves the handoff intent without depending on the protected Programs surface during Playwright smoke runs.
        </p>

        <dl
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 12,
            fontSize: 14,
          }}
        >
          <dt style={{ color: 'rgba(148, 163, 184, 0.9)' }}>source</dt>
          <dd style={{ margin: 0 }}>{params.source ?? 'n/a'}</dd>
          <dt style={{ color: 'rgba(148, 163, 184, 0.9)' }}>threadId</dt>
          <dd style={{ margin: 0 }}>{params.threadId ?? 'n/a'}</dd>
        </dl>

        <div style={{ marginTop: 28 }}>
          <Link
            href="/demo/intelligence"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 42,
              padding: '0 16px',
              borderRadius: 999,
              border: '0.5px solid rgba(94, 234, 212, 0.28)',
              color: '#e2e8f0',
              textDecoration: 'none',
            }}
          >
            Back to Intelligence demo
          </Link>
        </div>
      </div>
    </main>
  )
}
