import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#14B8A6';
const PURPLE = '#9B6DFF';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';
const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];

interface TurnRow {
  id: string;
  phase: number;
  sender: 'agent' | 'user';
  text: string;
  mode_label: string | null;
  created_at: string;
}

async function searchTurns(args: {
  engagementId: string;
  q: string;
  phase: number | null;
  sender: 'agent' | 'user' | null;
  limit: number;
}): Promise<TurnRow[]> {
  let query = getServerSupabase()
    .from('turns')
    .select('id, phase, sender, text, mode_label, created_at')
    .eq('engagement_id', args.engagementId)
    .order('created_at', { ascending: false })
    .limit(args.limit);

  if (args.q) query = query.ilike('text', `%${args.q}%`);
  if (args.phase !== null) query = query.eq('phase', args.phase);
  if (args.sender) query = query.eq('sender', args.sender);

  const { data, error } = await query;
  if (error) {
    console.warn('[searchTurns]', error.message);
    return [];
  }
  return (data ?? []) as TurnRow[];
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text.slice(0, 600) + (text.length > 600 ? '…' : '');
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const snippet = text.length > 600 ? text.slice(0, 600) + '…' : text;
  return snippet.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} style={{ background: 'rgba(255,213,74,0.25)', color: INK, padding: '0 2px' }}>{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default async function TurnsPage({
  params,
  searchParams,
}: {
  params: Promise<{ engagementId: string }>;
  searchParams: Promise<{ q?: string; phase?: string; sender?: string }>;
}) {
  const { engagementId: graphId } = await params;
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const phaseRaw = sp.phase;
  const phase = phaseRaw != null && phaseRaw !== '' ? Number(phaseRaw) : null;
  const senderRaw = sp.sender;
  const sender = senderRaw === 'agent' || senderRaw === 'user' ? senderRaw : null;

  const engagement = await getEngagementByGraphId(graphId);
  if (!engagement) notFound();

  const turns = await searchTurns({
    engagementId: engagement.id,
    q,
    phase,
    sender,
    limit: 200,
  });

  return (
    <div
      style={{
        padding: '24px 32px 60px',
        maxWidth: 1200,
        margin: '0 auto',
        color: INK,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <Link
          href={`/engagements/${encodeURIComponent(graphId)}`}
          style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          ← engagement console
        </Link>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.14em', marginBottom: 4 }}>
          TURNS · {engagement.name}
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 400, margin: 0 }}>
          Conversation history
        </h1>
      </div>

      <form
        action={`/engagements/${encodeURIComponent(graphId)}/turns`}
        method="get"
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          padding: '12px 14px',
          background: PANEL_BG,
          border: BORDER,
          borderRadius: 10,
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search turn text…"
          style={{ flex: 1, background: 'transparent', border: 'none', color: INK, outline: 'none', fontSize: 14 }}
        />
        <select
          name="phase"
          defaultValue={phase !== null ? String(phase) : ''}
          style={{ background: '#0A0A0A', color: INK, border: BORDER, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontFamily: MONO }}
        >
          <option value="">All phases</option>
          {PHASE_LABELS.map((label, i) => (
            <option key={i} value={i}>Phase {i} · {label}</option>
          ))}
        </select>
        <select
          name="sender"
          defaultValue={sender ?? ''}
          style={{ background: '#0A0A0A', color: INK, border: BORDER, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontFamily: MONO }}
        >
          <option value="">All senders</option>
          <option value="user">Sponsor</option>
          <option value="agent">Nexus</option>
        </select>
        <button
          type="submit"
          style={{
            fontFamily: MONO,
            fontSize: 11,
            background: TEAL,
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 6,
            padding: '4px 14px',
            letterSpacing: '0.1em',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          SEARCH
        </button>
      </form>

      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em', marginBottom: 10 }}>
        {turns.length === 0
          ? 'NO MATCHES'
          : `${turns.length} turn${turns.length === 1 ? '' : 's'}${q ? ` matching "${q}"` : ''}${turns.length === 200 ? ' (first 200)' : ''}`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {turns.map((t) => (
          <div
            key={t.id}
            style={{
              padding: 14,
              background: t.sender === 'agent' ? 'rgba(20,184,166,0.04)' : 'rgba(255,255,255,0.02)',
              border: `0.5px solid ${t.sender === 'agent' ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  color: t.sender === 'agent' ? TEAL : MUTE,
                  letterSpacing: '0.14em',
                }}
              >
                {t.sender === 'agent' ? `NEXUS${t.mode_label ? ' · ' + t.mode_label : ''}` : 'SPONSOR'}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.1em' }}>
                PHASE {t.phase} {PHASE_LABELS[t.phase]?.toUpperCase()}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, marginLeft: 'auto' }}>
                {new Date(t.created_at).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {highlight(t.text, q)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
