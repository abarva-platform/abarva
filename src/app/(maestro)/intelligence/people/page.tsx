import Link from 'next/link';
import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { getActiveClientRow } from '@/lib/active-client';
import { getServerSupabase } from '@/lib/supabase-server';

const TEAL = '#14B8A6';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL = 'rgba(255,255,255,0.03)';
const MUTED = 'rgba(245, 245, 240, 0.72)';

interface PersonCardRow {
  name: string;
  title: string | null;
  focus: string | null;
  organization: string | null;
  familiarity: string | null;
  tier: 'vip' | 'roster';
}

async function loadPeople(): Promise<{ clientName: string | null; people: PersonCardRow[] }> {
  const activeClient = await getActiveClientRow();
  if (!activeClient) return { clientName: null, people: [] };

  const sb = getServerSupabase();
  const [vipQ, peopleQ] = await Promise.all([
    sb
      .from('vip_profiles')
      .select('display_name, current_title, current_company, demo_tier, known_concerns, emphasize_topics')
      .ilike('current_company', `%${activeClient.name}%`)
      .order('display_name', { ascending: true })
      .limit(16),
    sb
      .from('persons')
      .select('name, role, organization, familiarity, communication_style')
      .ilike('organization', `%${activeClient.name}%`)
      .order('name', { ascending: true })
      .limit(24),
  ]);

  const vipRows = ((vipQ.data as Array<{
    display_name: string;
    current_title: string | null;
    current_company: string | null;
    demo_tier: string | null;
    known_concerns: string[] | null;
    emphasize_topics: string[] | null;
  }> | null) ?? []).map((row) => ({
    name: row.display_name,
    title: row.current_title,
    focus: row.known_concerns?.[0] ?? row.emphasize_topics?.[0] ?? null,
    organization: row.current_company,
    familiarity: row.demo_tier,
    tier: 'vip' as const,
  }));

  const rosterRows = ((peopleQ.data as Array<{
    name: string;
    role: string | null;
    organization: string | null;
    familiarity: string | null;
    communication_style: Record<string, unknown> | null;
  }> | null) ?? []).map((row) => ({
    name: row.name,
    title:
      typeof row.communication_style?.title === 'string'
        ? (row.communication_style.title as string)
        : row.role,
    focus:
      typeof row.communication_style?.primary_focus === 'string'
        ? (row.communication_style.primary_focus as string)
        : null,
    organization: row.organization,
    familiarity: row.familiarity,
    tier: 'roster' as const,
  }));

  const seen = new Set<string>();
  const people = [...vipRows, ...rosterRows].filter((row) => {
    const key = row.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { clientName: activeClient.name, people };
}

export default async function IntelligencePeoplePage() {
  const { clientName, people } = await loadPeople();

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEAL,
              marginBottom: 10,
            }}
          >
            People intelligence
          </div>
          <SectionHeading size="lg" style={{ marginBottom: 12 }}>
            Stakeholders the system can already reason about
          </SectionHeading>
          <Body size="lg" style={{ maxWidth: 760, marginBottom: 12 }}>
            This surface gives a lightweight people view for the active tenant so the route resolves cleanly and the
            user can see named executives, sponsors, and roster depth instead of a 404.
          </Body>
          <Body tone="secondary" size="sm" style={{ maxWidth: 760 }}>
            {clientName
              ? `Current tenant: ${clientName}. VIP profiles and roster entries are merged here, with VIPs shown first when present.`
              : 'No active tenant is selected, so this surface cannot scope people yet.'}
          </Body>
        </div>

        {people.length === 0 ? (
          <div
            style={{
              padding: 22,
              borderRadius: 18,
              border: BORDER,
              background: PANEL,
            }}
          >
            <SectionHeading size="md" style={{ marginBottom: 10 }}>
              No scoped people yet
            </SectionHeading>
            <Body tone="secondary" size="sm">
              Set an active tenant, then revisit this route. The same client context also improves the briefing, ask,
              and library surfaces.
            </Body>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {people.map((person) => (
              <div
                key={`${person.tier}:${person.name}`}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  border: BORDER,
                  background: PANEL,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: person.tier === 'vip' ? TEAL : MUTED,
                    }}
                  >
                    {person.tier === 'vip' ? 'VIP profile' : 'Roster profile'}
                  </div>
                  {person.familiarity ? (
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        color: MUTED,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {person.familiarity.replace(/_/g, ' ')}
                    </div>
                  ) : null}
                </div>
                <SectionHeading size="md" style={{ marginBottom: 8 }}>
                  {person.name}
                </SectionHeading>
                <Body weight={500} size="sm" style={{ marginBottom: 6 }}>
                  {person.title ?? 'Role not yet mapped'}
                </Body>
                <Body tone="secondary" size="sm" style={{ marginBottom: 10 }}>
                  {person.organization ?? clientName ?? 'Organization not available'}
                </Body>
                <Body tone="secondary" size="sm">
                  {person.focus ?? 'Profile is present, but a sharper working focus has not been attached yet.'}
                </Body>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: BORDER,
            background: 'rgba(20,184,166,0.08)',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: TEAL,
              marginBottom: 8,
            }}
          >
            Next best paths
          </div>
          <Body tone="secondary" size="sm" style={{ marginBottom: 10 }}>
            Use this people context alongside the live briefing and the topic library when a sponsor or executive asks
            for a point of view grounded in their operating world.
          </Body>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/home" style={{ color: TEAL, textDecoration: 'none', fontSize: 14 }}>
              Home briefing
            </Link>
            <Link href="/intelligence/library?category=topic" style={{ color: TEAL, textDecoration: 'none', fontSize: 14 }}>
              Topic library
            </Link>
            <Link href="/intelligence/ask" style={{ color: TEAL, textDecoration: 'none', fontSize: 14 }}>
              Ask intelligence
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
