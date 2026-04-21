// Session context loader · pulls invoking user + tenant + recent
// engagements + VIP profile so the Nexus system prompt is
// personalization-aware without the user having to identify themselves.
//
// Used by orchestrator before Phase 5 composition (spec §8.3 context
// budget section).

import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from '@/lib/intelligence/types';

export interface SessionContext {
  user: {
    id: string;
    name: string | null;
    role: string | null;
    email: string | null;
    isVip: boolean;
    vipProfile?: Record<string, unknown> | null;
  };
  tenant: {
    clientId: string;
    clientName: string | null;
    industryCode: string | null;
  };
  recentEngagements: Array<{
    id: string;
    name: string;
    currentPhase: number | null;
    status: string | null;
    lastActivityAt: string | null;
  }>;
}

export async function loadSessionContext(ctx: TenancyCtx): Promise<SessionContext> {
  const sb = getServerSupabase();

  const [personR, clientR, engagementsR, vipR] = await Promise.all([
    sb.from('persons').select('id, name, role, email').eq('id', ctx.userId).maybeSingle(),
    sb.from('clients').select('id, name, industry_code').eq('id', ctx.clientId).maybeSingle(),
    sb
      .from('engagements')
      .select('id, name, current_phase, status, updated_at')
      .eq('client_id', ctx.clientId)
      .is('archived_at', null)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5),
    sb.from('vip_profiles').select('*').eq('person_id', ctx.userId).maybeSingle(),
  ]);

  const person = personR.data as { id: string; name: string | null; role: string | null; email: string | null } | null;
  const client = clientR.data as { id: string; name: string | null; industry_code: string | null } | null;
  const engagements = (engagementsR.data as Array<{ id: string; name: string; current_phase: number | null; status: string | null; updated_at: string | null }> | null) ?? [];
  const vip = vipR.data as Record<string, unknown> | null;

  return {
    user: {
      id: ctx.userId,
      name: person?.name ?? null,
      role: person?.role ?? null,
      email: person?.email ?? null,
      isVip: !!vip,
      vipProfile: vip ?? null,
    },
    tenant: {
      clientId: ctx.clientId,
      clientName: client?.name ?? null,
      industryCode: client?.industry_code ?? null,
    },
    recentEngagements: engagements.map((e) => ({
      id: e.id,
      name: e.name,
      currentPhase: e.current_phase,
      status: e.status,
      lastActivityAt: e.updated_at,
    })),
  };
}

/**
 * Render session context into a block that can be appended to the Nexus
 * system prompt. Keeps to a tight budget (~500 tokens typical).
 */
export function renderSessionContextBlock(sess: SessionContext): string {
  const lines: string[] = ['SESSION CONTEXT'];
  if (sess.user.name) {
    lines.push(`You are speaking with ${sess.user.name}${sess.user.role ? ` (${sess.user.role})` : ''}.`);
  } else {
    lines.push('The invoking user has not provided their name.');
  }
  if (sess.tenant.clientName) {
    lines.push(`Tenant: ${sess.tenant.clientName}${sess.tenant.industryCode ? ` · industry ${sess.tenant.industryCode}` : ''}.`);
  }
  if (sess.user.isVip && sess.user.vipProfile) {
    const vipCurrentTitle = sess.user.vipProfile.current_title as string | undefined;
    const vipCompany = sess.user.vipProfile.current_company as string | undefined;
    const vipAreas = (sess.user.vipProfile.areas_of_expertise as string[] | undefined) ?? [];
    lines.push(
      `VIP: ${vipCurrentTitle ?? sess.user.name}${vipCompany ? ` · ${vipCompany}` : ''}${vipAreas.length ? ` · expertise in ${vipAreas.slice(0, 3).join(', ')}` : ''}.`,
    );
    lines.push('When addressing a VIP, be senior-partner tone · cite patterns + dollar figures + cohort sizes · skip basics.');
  }
  if (sess.recentEngagements.length > 0) {
    lines.push('Recent active programs in this tenant:');
    for (const e of sess.recentEngagements.slice(0, 5)) {
      lines.push(`- ${e.name} · phase ${e.currentPhase ?? '—'} · ${e.status ?? 'unknown'}`);
    }
  }
  lines.push('Open with an implicit acknowledgment of the above · never ask the user to identify themselves or the tenant.');
  return lines.join('\n');
}
