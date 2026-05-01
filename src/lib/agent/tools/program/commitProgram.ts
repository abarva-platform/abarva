// commit_program tool · F0.4 first tool, used by Surface 1 (/programs/new)
//
// OV2-2b · Tenant-admin approval queue wiring (this file's redesign)
// ──────────────────────────────────────────────────────────────────────
// Investigation findings (pre-OV2-2b shape, for the audit trail):
//
//   • The pre-OV2-2b tool called `originateProgram(tenancy, …)` which
//     inserted an `engagements` row with `status='active'`,
//     `current_phase=0` — a program went LIVE the instant Steward
//     committed the brief. No tenant-admin signoff in between.
//   • The handler returned `{ program_id, program_name, redirect_to,
//     surface }`; Steward read the result and announced "Registered ✅"
//     with a redirect link. Idempotency guard: a same-name insert
//     within 5 minutes returned the existing row instead of double-
//     inserting.
//   • There was no "draft" mode — the tool always flipped to active.
//
// What changes in OV2-2b (per design doc §B.2 state machine + §D.0.5
// Gate 0b · Tenant Admin approval):
//
//   • The engagement is now created with `lifecycle_state =
//     'submitted_for_approval'` (NOT 'active'). The legacy `status`
//     column is set to 'draft' so old code paths that read `status`
//     don't treat the program as live.
//   • `current_phase` stays 0 to preserve existing read-path semantics
//     (queries/UI that read `current_phase ?? 0`); the gate for
//     "running vs. waiting" is `lifecycle_state`, not the phase
//     number. Per the slice spec: limbo, not phase 0 — but the phase
//     rail still has to render something coherent.
//   • Immediately after the engagement insert, we capture a brief
//     snapshot and call `submitForApproval(...)` from
//     `lib/programs/approval.ts`. That helper writes a row into
//     `program_approval_requests` and (per its contract) also flips
//     `engagements.lifecycle_state` to 'submitted_for_approval' (no-op
//     since we already set it, but the helper's invariant is
//     preserved).
//   • Rollback discipline: if EITHER the brief-snapshot step OR the
//     `submitForApproval` call throws, we DELETE the just-inserted
//     engagement so we never leave an orphan row. The
//     `program_approval_requests.program_id` FK is ON DELETE CASCADE
//     — rollback is safe even if a partial approval row exists
//     (which it shouldn't, since we only call submit once).
//   • The tool now returns `{ engagement_id, approval_request_id,
//     program_name, lifecycle_state, redirect_to, surface }` so
//     Steward can name what's pending. The natural-language line
//     Steward should read aloud is described in the tool
//     `description` field below.
//
// When the user confirms the program brief Steward has assembled, the
// agent emits a tool_use block with the structured fields. The route
// invokes this handler. Only after the engagement insert AND the
// approval-request insert both succeed does the agent generate the
// "submitted for approval" confirmation — this is the architectural
// mechanism that makes "Registered ✅ but DB write failed" structurally
// impossible.
//
// Per canvas-continuity doctrine, origination can run in the main
// portal canvas as well as the dedicated /programs/new page. Do not
// force a route change just to submit the brief.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { submitForApproval } from '@/lib/programs/approval';
import type { ArchetypeKey, OriginationForm } from '@/lib/programs/types.ui';
import type { OriginSource } from '@/lib/programs/types.db';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';
import { CLIENT_KEY_TO_INDUSTRY_CODE } from '@/lib/client-config';
import { markDraftCommitted } from '@/lib/programs/origination-drafts';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

// Postgres UUID v4 format (also matches v1/v3/v5 — sufficient for input
// validation before we attempt an `engagements.insert` that would
// otherwise throw an opaque uuid-cast error.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CommitProgramInput {
  program_name: string;
  problem_statement: string;
  target_outcome?: string;
  timeline?: string;
  sponsor_person_id: string;
  lead_person_id?: string;
  classification?: ArchetypeKey | null;
  matched_pattern_id?: string;
}

interface CommitProgramClassification {
  functionCode: 'FRONT_OFFICE' | 'MIDDLE_OFFICE' | 'BACK_OFFICE';
  objectiveCode: 'GROW' | 'OPTIMISE' | 'CONTROL';
  topicCode: string;
}

function slugifyTopicCode(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return slug || 'program_origination';
}

function classifyCommitProgram(input: CommitProgramInput): CommitProgramClassification {
  const text = [
    input.program_name,
    input.problem_statement,
    input.target_outcome ?? '',
    input.timeline ?? '',
    input.classification ?? '',
    input.matched_pattern_id ?? '',
  ]
    .join(' ')
    .toLowerCase();

  let functionCode: CommitProgramClassification['functionCode'] = 'MIDDLE_OFFICE';
  if (
    /\b(finance|financial close|hr|hcm|erp|procurement|supply chain|payroll|back[- ]office|revenue cycle|rcm)\b/.test(
      text,
    )
  ) {
    functionCode = 'BACK_OFFICE';
  } else if (
    /\b(customer|consumer|patient|member|sales|marketing|commerce|checkout|abandonment|store|portal|front door|front[- ]office)\b/.test(
      text,
    )
  ) {
    functionCode = 'FRONT_OFFICE';
  } else if (
    /\b(engineering|developer|sdlc|dora|application|platform|data|analytics|integration|cloud|digital|internal)\b/.test(
      text,
    )
  ) {
    functionCode = 'MIDDLE_OFFICE';
  }

  let objectiveCode: CommitProgramClassification['objectiveCode'] = 'OPTIMISE';
  if (/\b(risk|control|compliance|governance|audit|security|regulatory|privacy)\b/.test(text)) {
    objectiveCode = 'CONTROL';
  } else if (/\b(growth|grow|revenue|acquisition|retention|conversion|market share)\b/.test(text)) {
    objectiveCode = 'GROW';
  }

  return {
    functionCode,
    objectiveCode,
    topicCode: slugifyTopicCode(input.program_name),
  };
}

function briefProgressArtifact(input: {
  form: OriginationForm;
  classification: CommitProgramClassification;
  input: CommitProgramInput;
}): string {
  const fields = [
    { id: 'program-name', label: 'Program name', value: input.form.name },
    { id: 'problem-statement', label: 'Problem statement', value: input.form.useCase },
    { id: 'target-outcome', label: 'Target outcome', value: input.form.targetOutcome },
    { id: 'timeline', label: 'Timeline', value: input.input.timeline ?? '' },
    { id: 'sponsor', label: 'Sponsor', value: input.form.sponsorPersonId },
    { id: 'lead', label: 'Lead', value: input.form.leadPersonId },
    {
      id: 'classification',
      label: 'Classification',
      value: input.input.classification ?? input.classification.functionCode,
    },
    { id: 'topic', label: 'Topic code', value: input.classification.topicCode },
  ].map((field) => ({
    id: field.id,
    label: field.label,
    status: field.value.trim() ? 'filled' : 'empty',
    value: field.value.trim() || undefined,
  }));

  return `\n[[artifact:brief-progress]]${JSON.stringify({
    fieldsTotal: fields.length,
    fieldsFilled: fields.filter((field) => field.status === 'filled').length,
    fields,
  })}[[/artifact]]\n`;
}

/**
 * Best-effort cleanup: delete the just-inserted engagement so we never
 * leave a row in 'submitted_for_approval' without a matching approval
 * request. This is the manual transactional unit; Supabase doesn't give
 * us a single-statement BEGIN/ROLLBACK over the JS client, so we do the
 * compensating delete explicitly. CASCADE on
 * `program_approval_requests.program_id` ensures any partial child row
 * goes too. Errors during cleanup are swallowed and logged — the caller
 * already has the original failure to surface; we don't want to mask it.
 */
async function rollbackEngagement(programId: string): Promise<void> {
  try {
    const sb = getServerSupabase();
    await sb.from('engagements').delete().eq('id', programId);
  } catch (cleanupErr) {
    // We log but don't rethrow — the original error from
    // submitForApproval is the one Steward needs to recover from.
    console.error(
      '[commit_program] rollback delete failed for engagement',
      programId,
      cleanupErr,
    );
  }
}

async function resolvePersonName(personId: string): Promise<string> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('persons')
    .select('name')
    .eq('id', personId)
    .maybeSingle();
  return (data as { name?: string } | null)?.name ?? personId;
}

async function insertParticipant(input: {
  programId: string;
  personId: string;
  role: string;
  approvalAuthority: 'sponsor' | 'contributor';
}): Promise<void> {
  const sb = getServerSupabase();
  const userName = await resolvePersonName(input.personId);
  const basePayload = {
    engagement_id: input.programId,
    user_id: input.personId,
    user_name: userName,
    role: input.role,
    notify_on: ['phase_gate', 'approval'],
    approval_authority: input.approvalAuthority,
    last_touchpoint_at: new Date().toISOString(),
  };
  const { error } = await sb.from('engagement_participants').insert({
    ...basePayload,
    program_access_level: 'program_member',
    can_view_financial: false,
    can_upload: true,
    can_generate_deliverables: true,
    can_publish_deliverables: input.approvalAuthority === 'sponsor',
    can_approve_phase_gates: input.approvalAuthority === 'sponsor',
  });
  if (error && /program_access_level|can_view_financial|can_upload|can_generate_deliverables|can_publish_deliverables|can_approve_phase_gates/i.test(error.message)) {
    const { error: retryError } = await sb.from('engagement_participants').insert(basePayload);
    if (retryError) throw retryError;
    return;
  }
  if (error) throw error;
}

export const commitProgramTool: AgentTool<CommitProgramInput> = {
  name: 'commit_program',
  description:
    'Submit a new program brief for tenant-admin approval after the user has explicitly confirmed it. ' +
    'IMPORTANT: this tool no longer goes live immediately — per the OV2-2 redesign, the program enters ' +
    'the `submitted_for_approval` state and a row is added to the tenant-admin approval queue. The ' +
    'tenant admin reviews the brief and either approves (program flips to `approved` and Phase 0 unlocks) ' +
    'or rejects (returns to draft with rationale). Returns the engagement id AND the approval request id. ' +
    'On success, tell the user — in your own words — that the brief has been submitted for approval, ' +
    'name what happens next (a tenant admin will review and approve before Phase 0 unlocks), and let them ' +
    'know they can navigate to /programs/<engagement_id> to see the approval-pending state. Do NOT say ' +
    '"the program is now active" or "registered" — the program is QUEUED, not running. ' +
    'Call this only after the user says yes to your "Shall I submit this for approval?" question — never ' +
    'speculatively. ' +
    'IMPORTANT: sponsor_person_id and lead_person_id MUST be UUIDs from the persons table. ' +
    'If the user has named a role ("CIO") or a person ("Lin Martinez") without giving you a UUID, ' +
    'call the `lookup_person` tool FIRST to resolve them — do NOT ask the user to paste a UUID themselves. ' +
    'The seeded persons table for the active tenant has leadership records you can resolve against. Only ' +
    'after lookup_person returns a match should you call commit_program with the resulting person_id. ' +
    "DEFAULTING THE LEAD: when the user has named a sponsor but not a separate lead, ASK 'is " +
    "<sponsor name> also the day-to-day lead, or someone else?' If the user confirms or doesn't " +
    'name a separate lead after asking, default lead_person_id to the same UUID as sponsor_person_id. ' +
    'Most small programs have one person owning both roles; do not stall the flow because the user ' +
    "hasn't explicitly named a lead. " +
    'If this returns failure, report the failure honestly with recovery options; do not announce success.',
  surfaces: ['/programs/new', '/demo/programs/new', '/home', '/programs'],
  input_schema: {
    type: 'object',
    properties: {
      program_name: {
        type: 'string',
        description: 'The program name as confirmed by the user.',
      },
      problem_statement: {
        type: 'string',
        description: 'The use case / problem statement, as a natural-language paragraph.',
      },
      target_outcome: {
        type: 'string',
        description: 'The target outcome the user committed to (optional but encouraged).',
      },
      timeline: {
        type: 'string',
        description: 'Free-form timeline hint (e.g., "9 months", "BAFO by May").',
      },
      sponsor_person_id: {
        type: 'string',
        description:
          'UUID from persons table for the named program sponsor. If the user said a role ' +
          '("CIO") or a name without a UUID, call lookup_person FIRST to resolve them — do not ' +
          'ask the user to paste a UUID.',
      },
      lead_person_id: {
        type: 'string',
        description:
          'UUID from persons table for the program lead. Same rules as sponsor_person_id — ' +
          'use lookup_person to resolve roles or names into UUIDs before calling commit_program.',
      },
      classification: {
        type: 'string',
        description:
          'Archetype classification (e.g., AMS_CONSOLIDATION, CDP). Pass null when unsure.',
      },
      matched_pattern_id: {
        type: 'string',
        description: 'Pattern key matched during classification (e.g., PAT-PRG-AMS-CONSOLIDATION-001).',
      },
    },
    required: ['program_name', 'problem_statement', 'sponsor_person_id'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    // Pre-flight: validate UUID-shaped person ids BEFORE we attempt the
    // DB write. Without this the agent's first failure surface is an
    // opaque "invalid input syntax for type uuid: 'CTO'" Postgres
    // error, which Steward then translates to a generic "write error"
    // — not actionable for the user. Catching it here lets Steward
    // recover by asking for the actual person.
    if (!UUID_RE.test(input.sponsor_person_id.trim())) {
      return {
        success: false,
        error: `invalid_sponsor_person_id: "${input.sponsor_person_id}" is not a person id`,
        recovery:
          `I need the named sponsor as an actual person, not a role like "${input.sponsor_person_id}". ` +
          'Who specifically should own this — full name? (Ideally with their persons.id from your team list, ' +
          'but a name is a start; we can resolve from there.)',
      };
    }
    if (input.lead_person_id && !UUID_RE.test(input.lead_person_id.trim())) {
      return {
        success: false,
        error: `invalid_lead_person_id: "${input.lead_person_id}" is not a person id`,
        recovery:
          `Same issue with the program lead — "${input.lead_person_id}" is a role, not a person. ` +
          "Who's leading day-to-day? If it's the sponsor, I can default to that.",
      };
    }

    let tenancy;
    try {
      tenancy = await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError) {
        return {
          success: false,
          error: `auth:${err.code}`,
          recovery:
            err.code === 'unauthenticated'
              ? "Your session expired. Want me to take you back to sign-in, then we'll register the program?"
              : "There's no active client on this session. Set the active client and I'll try again.",
        };
      }
      throw err;
    }

    const accessPolicy = await loadUserProgramAccessPolicy(tenancy).catch(() => null);
    if (!accessPolicy?.canCreatePrograms) {
      return {
        success: false,
        error: 'forbidden:can_create_programs_required',
        recovery:
          'Your Programs access does not allow creating new programs for this client. Ask a client admin to grant can_create_programs before I submit this brief.',
      };
    }

    // Resolve the active client row again to recover the tenant_key
    // (TEXT, e.g. 'apexretail') alongside the clientId UUID. The
    // approval table keys by tenant_key; engagements key by client_id.
    // Both come from the same client lookup, but `requireTenancy` only
    // exposes the UUID, so we re-query for the key.
    const activeClient = await getActiveClientRow().catch(() => null);
    if (!activeClient || activeClient.id !== tenancy.clientId) {
      // Defensive: the active-client resolution should always agree
      // with requireTenancy. If it doesn't, something is off and we
      // refuse to write rather than guess.
      return {
        success: false,
        error: 'tenant_key_resolution_failed',
        recovery:
          "I can't pin the active client right now. Refresh the page and I'll try again — if this " +
          'persists, your session is in a weird state and a sign-out/sign-in will fix it.',
      };
    }
    const tenantKey = activeClient.key;
    const industryCode = (
      activeClient.industry_code?.trim() || CLIENT_KEY_TO_INDUSTRY_CODE[tenantKey]
    ).toUpperCase();

    const originationForm: OriginationForm = {
      name: input.program_name,
      useCase: input.problem_statement,
      targetOutcome: input.target_outcome ?? '',
      sponsorPersonId: input.sponsor_person_id,
      leadPersonId: input.lead_person_id ?? input.sponsor_person_id,
    };
    const derivedClassification = classifyCommitProgram(input);

    // Idempotency guard: if a program with the same name was created
    // for this client in the last 5 minutes, return that one instead
    // of inserting a duplicate. Defends against double-click on
    // confirm, network retry, or the agent calling commit_program
    // twice in the same conversation. (We also short-circuit for an
    // already-pending approval request on that engagement so we don't
    // double-queue.)
    const sb = getServerSupabase();
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data: existing } = await sb
        .from('engagements')
        .select('id, name, created_at, lifecycle_state')
        .eq('client_id', tenancy.clientId)
        .eq('name', originationForm.name)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        const row = existing as {
          id: string;
          name: string;
          lifecycle_state: string | null;
        };
        // Try to find the matching approval request so Steward can
        // reference it in the replay message. Best-effort: if we
        // can't find it (e.g. raced), we still return the engagement.
        const { data: existingApproval } = await sb
          .from('program_approval_requests')
          .select('id')
          .eq('program_id', row.id)
          .eq('request_status', 'pending')
          .order('requested_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        try {
          await markDraftCommitted(tenancy, ctx.surface, row.id);
        } catch {
          // ignore
        }
        // Use the existing `program-created` sentinel — the client's
        // StewardChat component watches for it specifically and
        // navigates to /programs/<id>. The wording is a hint to the
        // browser, not user-visible; renaming would break navigation.
        if (ctx.surface === '/programs/new' || ctx.surface === '/demo/programs/new') {
          ctx.writer?.write(`\n[[program-created:${row.id}]]`);
        }
        return {
          success: true,
          data: {
            engagement_id: row.id,
            approval_request_id:
              (existingApproval as { id: string } | null)?.id ?? null,
            program_name: row.name,
            lifecycle_state: row.lifecycle_state ?? 'submitted_for_approval',
            record_status: 'existing_recent_submission',
            phase_access: 'phase_0_pending_tenant_admin_approval',
            redirect_to: `/programs/${row.id}`,
            surface: ctx.surface,
            idempotent_replay: true,
          },
        };
      }
    } catch {
      // If the idempotency lookup itself fails, fall through to the
      // normal insert path. Safer to risk a duplicate than to block
      // a legitimate registration on a transient lookup error.
    }

    // ── Step 1 · insert the engagement in 'submitted_for_approval' ──
    //
    // NOTE: engagements has no `created_by` column on the current
    // schema — creator attribution is captured in module_state_log
    // (changed_by_user_id) and the approval-request row's
    // requested_by_user_id. Don't reintroduce a created_by write.
    let programId: string;
    let programName: string;
    try {
      const { data, error } = await sb
        .from('engagements')
        .insert({
          client_id: tenancy.clientId,
          industry_code: industryCode,
          function_code: derivedClassification.functionCode,
          objective_code: derivedClassification.objectiveCode,
          topic_code: derivedClassification.topicCode,
          name: originationForm.name,
          sponsor_person_id: originationForm.sponsorPersonId,
          // Legacy lifecycle: leave at 'draft' so old code paths that
          // still read `status` correctly see this program as not-yet-
          // running. New code paths read `lifecycle_state`.
          status: 'draft',
          lifecycle_state: 'submitted_for_approval',
          // Existing convention: keep current_phase = 0 so phase-rail
          // queries that read `current_phase ?? 0` continue to render.
          // The gate for "running vs. waiting" is lifecycle_state, not
          // the phase number.
          current_phase: 0,
          program_archetype: input.classification ?? null,
          // `engagements.origin_source` is guarded by a DB CHECK
          // constraint; in-canvas Nexus origination is a user-initiated
          // program seed, not a separate origin_source enum.
          origin_source: 'user_initiated' as OriginSource,
          origin_source_ref: null,
          maestro_oversight_level: 'partial',
          founder_approval_required: false,
          data_residency_region: null,
          retention_policy_years: 7,
        })
        .select('id, name')
        .single();
      if (error || !data) {
        const message = error?.message ?? 'unknown insert error';
        return {
          success: false,
          error: `engagement_insert_failed: ${message}`,
          recovery:
            "Couldn't write the program to the database — the API returned an error. " +
            'Want me to retry, or do you want me to capture this as a draft for review?',
        };
      }
      programId = (data as { id: string }).id;
      programName = (data as { name: string }).name;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `engagement_insert_failed: ${message}`,
        recovery:
          "Couldn't write the program to the database — the API returned an error. " +
          'Want me to retry, or do you want me to capture this as a draft for review?',
      };
    }

    // Build the brief snapshot. This is the audit-quality payload
    // the tenant admin will review and that is preserved verbatim
    // even if the engagement is later edited. Normalize: strip
    // optional fields with empty values so the JSONB stays clean.
    const briefSnapshot: Record<string, unknown> = {
      program_name: originationForm.name,
      problem_statement: originationForm.useCase,
      sponsor_person_id: originationForm.sponsorPersonId,
      lead_person_id: originationForm.leadPersonId,
      function_code: derivedClassification.functionCode,
      objective_code: derivedClassification.objectiveCode,
      topic_code: derivedClassification.topicCode,
      classification: input.classification ?? null,
      matched_pattern_id: input.matched_pattern_id ?? null,
      submitted_from_surface: ctx.surface,
      submitted_at: new Date().toISOString(),
    };
    if (input.target_outcome && input.target_outcome.trim()) {
      briefSnapshot.target_outcome = input.target_outcome.trim();
    }
    if (input.timeline && input.timeline.trim()) {
      briefSnapshot.timeline = input.timeline.trim();
    }

    // ── Step 2 · submit for approval (transactional with rollback) ──
    let approvalRequestId: string;
    try {
      ctx.writer?.write(
        briefProgressArtifact({
          form: originationForm,
          classification: derivedClassification,
          input,
        }),
      );
      const approval = await submitForApproval({
        tenantKey,
        programId,
        requestedByUserId: tenancy.userId,
        briefSnapshot,
      });
      approvalRequestId = approval.id;
    } catch (submitErr) {
      // Compensating rollback: delete the just-created engagement so
      // we never end up with a 'submitted_for_approval' row without a
      // matching approval request. This is the surrogate for a real
      // DB transaction; CASCADE handles any partial child row.
      await rollbackEngagement(programId);
      const message =
        submitErr instanceof Error ? submitErr.message : String(submitErr);
      return {
        success: false,
        error: `approval_submit_failed: ${message}`,
        recovery:
          "Couldn't queue the brief for tenant-admin approval — the approval-request write failed " +
          'and I rolled back the engagement so we don\'t have an orphan record. Want me to retry, ' +
          'or capture this as a local draft and you can submit later?',
      };
    }

    // ── Step 3 · best-effort post-write side effects ──
    // pattern_match_logs and module_state_log are useful audit trails
    // but not load-bearing for the approval queue. If they fail we log
    // and continue — rolling back here would lose a successful
    // approval submission.
    try {
      await insertParticipant({
        programId,
        personId: originationForm.sponsorPersonId,
        role: 'Sponsor',
        approvalAuthority: 'sponsor',
      });
      if (originationForm.leadPersonId !== originationForm.sponsorPersonId) {
        await insertParticipant({
          programId,
          personId: originationForm.leadPersonId,
          role: 'Program Lead',
          approvalAuthority: 'contributor',
        });
      }
      if (input.matched_pattern_id) {
        await sb.from('pattern_match_logs').insert({
          engagement_id: programId,
          pattern_key: input.matched_pattern_id,
          match_confidence: null,
          match_context_jsonb: {
            use_case: originationForm.useCase,
            accepted_at_origination: true,
          },
          suggested_action: 'pattern',
          acted_upon: true,
          acted_upon_at: new Date().toISOString(),
          acted_upon_by_user_id: tenancy.userId,
          matched_by_agent: 'classifier_v1',
        });
      }
      await sb.from('module_state_log').insert({
        engagement_id: programId,
        module_key: 'origination',
        previous_state: null,
        new_state: 'submitted_for_approval',
        changed_by_user_id: tenancy.userId,
        context_jsonb: {
          pattern_key: input.matched_pattern_id ?? null,
          origin: 'maestro_console',
          approval_request_id: approvalRequestId,
        },
      });
    } catch (sideEffectErr) {
      console.error(
        '[commit_program] post-submit side-effect log failed (non-fatal)',
        sideEffectErr,
      );
    }

    // Surface 1 PR3: dissociate the open origination draft on this
    // surface so a subsequent /programs/new visit starts fresh.
    // Best-effort — non-fatal if it fails.
    try {
      await markDraftCommitted(tenancy, ctx.surface, programId);
    } catch {
      // ignore
    }

    // Surface 1 navigation sentinel: tell the client the program is
    // ready to be navigated to. Reuses the existing `program-created`
    // sentinel — StewardChat watches for it specifically. The
    // sentinel is a navigation hint stripped client-side before
    // display; the user-visible message that Steward generates is
    // what carries the new "submitted for approval" semantics.
    if (ctx.surface === '/programs/new' || ctx.surface === '/demo/programs/new') {
      ctx.writer?.write(`\n[[program-created:${programId}]]`);
    }

    return {
      success: true,
      data: {
        engagement_id: programId,
        approval_request_id: approvalRequestId,
        program_name: programName,
        lifecycle_state: 'submitted_for_approval',
        record_status: 'created',
        phase_access: 'phase_0_pending_tenant_admin_approval',
        function_code: derivedClassification.functionCode,
        objective_code: derivedClassification.objectiveCode,
        topic_code: derivedClassification.topicCode,
        redirect_to: `/programs/${programId}`,
        surface: ctx.surface,
      },
    };
  },
};

// Self-register on first import. Routes import this module at startup
// (chat/agent route) so the tool is available when the surface matches.
registerTool(commitProgramTool);
