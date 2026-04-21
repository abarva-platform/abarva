// POST /api/v1/programs/originate/from-thread
// Intelligence → Programs handoff (Packet 2 §2.9 Path 1 · ~50% of originations).
//
// Given an intelligence_threads.id, pull the thread summary, extract
// intent via the same 3-stage classifier, and return a pre-loaded
// origination form + top pattern matches. Client side can then render
// the shape-proposer with top match pre-selected and POST to
// /api/v1/programs when the user accepts.

import { NextRequest } from 'next/server';
import { classifyOrigination } from '@/lib/programs/classifier';
import { classifierMatchToViewModel } from '@/lib/programs/transformers';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import type { ArchetypeKey, OriginationForm, PatternMatch } from '@/lib/programs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

interface ThreadRow {
  id: string;
  user_id: string;
  client_id: string;
  title: string | null;
}

interface TurnRow {
  role: string;
  payload_jsonb: Record<string, unknown> | null;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const body = (await req.json()) as { threadId?: string; sponsorPersonId?: string; leadPersonId?: string };
    if (!body?.threadId) {
      return Response.json({ error: 'bad_request', detail: 'threadId required' }, { status: 400 });
    }

    const sb = getServerSupabase();
    const { data: thread, error: tErr } = await sb
      .from('intelligence_threads')
      .select('id, user_id, client_id, title')
      .eq('id', body.threadId)
      .eq('client_id', ctx.clientId)
      .maybeSingle();
    if (tErr) throw tErr;
    const threadRow = thread as ThreadRow | null;
    if (!threadRow) return Response.json({ error: 'thread_not_found' }, { status: 404 });

    // Assemble use-case text from thread turns (last 5 user turns)
    const { data: turns } = await sb
      .from('intelligence_thread_turns')
      .select('role, payload_jsonb')
      .eq('thread_id', body.threadId)
      .order('index', { ascending: false })
      .limit(10);
    const turnRows = (turns as TurnRow[] | null) ?? [];
    const userTurns = turnRows
      .filter((t) => t.role === 'user')
      .slice(0, 5)
      .reverse()
      .map((t) => (t.payload_jsonb?.answer as string | undefined) ?? (t.payload_jsonb?.hero as string | undefined) ?? '')
      .filter(Boolean);
    const useCase = userTurns.length > 0 ? userTurns.join(' · ') : (threadRow.title ?? 'Program scoped from Intelligence');

    const output = await classifyOrigination({
      useCase,
      tenancy: ctx,
    });

    // Enrich matches with catalog data
    const keys = output.matches.map((m) => m.patternKey);
    const catalogByKey = new Map<string, Record<string, unknown>>();
    if (keys.length > 0) {
      const { data: catalog } = await sb
        .from('engagement_topics')
        .select('topic_key, title, canonical_shape_json, deployment_count, successful_deployment_count')
        .in('topic_key', keys);
      for (const row of (catalog as Array<Record<string, unknown>> | null) ?? []) {
        catalogByKey.set(row.topic_key as string, row);
      }
    }
    const viewMatches: PatternMatch[] = output.matches.map((m, i) =>
      classifierMatchToViewModel(
        m,
        (catalogByKey.get(m.patternKey) ?? null) as Parameters<typeof classifierMatchToViewModel>[1],
        i === 0,
      ),
    );

    // Pre-load origination form
    const form: OriginationForm = {
      name: threadRow.title ?? `${(output.extracted.archetype ?? 'Strategic').replace(/_/g, ' ')} program`,
      useCase,
      targetOutcome: '',
      sponsorPersonId: body.sponsorPersonId ?? '',
      leadPersonId: body.leadPersonId ?? ctx.userId,
      industryHint: output.extracted.industry ?? undefined,
    };

    return Response.json({
      originationForm: form,
      matches: viewMatches,
      extracted: {
        archetype: output.extracted.archetype as ArchetypeKey | null,
        industry: output.extracted.industry,
        entities: output.extracted.entities,
        objectives: output.extracted.objectives,
      },
      sourceThreadId: threadRow.id,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/originate/from-thread]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
