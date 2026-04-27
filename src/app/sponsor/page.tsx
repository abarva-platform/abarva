import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AbarVaLogo } from '@/components/brand';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';

export default async function SponsorHomePage() {
  const person = await getCurrentPerson();
  if (!person) {
    redirect('/sign-in');
  }

  const { data } = await getServerSupabase()
    .from('engagements')
    .select('id, graph_node_id, name, industry_code, current_phase, status')
    .eq('sponsor_person_id', person.id)
    .order('updated_at', { ascending: false });

  const engagements = (data ?? []) as Array<{
    graph_node_id: string;
    name: string;
    industry_code: string;
    current_phase: number;
    status: string;
  }>;

  if (engagements.length === 1) {
    redirect(`/sponsor/${encodeURIComponent(engagements[0].graph_node_id)}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: FONT_BODY }}>
      <div style={{ padding: '20px 24px', borderBottom: BORDER_SOFT, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <AbarVaLogo
          size="sm"
          height={22}
          style={{ filter: 'brightness(0) invert(1)' }}
          aria-hidden={false}
        />
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase' }}>
          Sponsor · {person.name}
        </div>
      </div>

      <div style={{ padding: '24px 24px 40px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Your engagements</div>
        <div style={{ fontSize: 13, color: MUTE, marginBottom: 20 }}>
          {engagements.length === 0
            ? 'No engagements yet. Your Maestro will get you set up.'
            : `${engagements.length} engagement${engagements.length === 1 ? '' : 's'} in flight.`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {engagements.map((e) => (
            <Link
              key={e.graph_node_id}
              href={`/sponsor/${encodeURIComponent(e.graph_node_id)}`}
              style={{
                display: 'block',
                padding: 16,
                background: 'rgba(255,255,255,0.03)',
                border: BORDER_SOFT,
                borderRadius: 10,
                textDecoration: 'none',
                color: INK,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{e.name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase' }}>
                  Phase {e.current_phase}
                </div>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em' }}>{e.industry_code}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
