// commit_source_event tool · /source and /source-detail surfaces
//
// Sentinel uses this to persist a new sourcing event when the user
// completes the five-field intake floor (trigger, decision_owner,
// scope_boundary, baseline_evidence, stop_condition). The tool
// inserts a source_events row via the service-role Supabase client
// and emits two artifacts:
//   1. source-event-created — consumed by the reactive panel to
//      refresh the events list and show a confirmation card.
//   2. navigate-to — returns the user to the portfolio so the newly
//      persisted row is visible in the operating queue.
//
// Surfaces: /source (portfolio), /source-detail (single event page
//   where the user might be refining an existing event's scope before
//   creating a new linked one).

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { createSourcingEvent } from '@/lib/source/queries';

interface CommitSourceEventInput {
  event_name: string;
  event_type: 'managed_service' | 'software' | 'staffing' | 'infrastructure' | 'consulting' | 'other';
  trigger_description: string;
  decision_owner?: string;
  scope_description?: string;
  linked_program_id?: string;
  estimated_value_usd?: number;
}

export const commitSourceEventTool: AgentTool<CommitSourceEventInput> = {
  name: 'commit_source_event',
  description:
    'Persist a new sourcing event to the database after the user has confirmed the intake details. ' +
    'Call this ONLY when the user explicitly says to create/submit/start the event AND you have ' +
    'captured at minimum: event_name, event_type, and trigger_description. Do NOT call it ' +
    'speculatively — ask the user to confirm the event details first. After committing, ' +
    'tell the user the event has been created and it needs admin approval to proceed.',
  surfaces: ['/source', 'source', 'source-detail'],
  input_schema: {
    type: 'object',
    properties: {
      event_name: {
        type: 'string',
        description: 'Short descriptive name for the sourcing event (e.g. "AI Cloud Provider Consolidation 2026").',
      },
      event_type: {
        type: 'string',
        enum: ['managed_service', 'software', 'staffing', 'infrastructure', 'consulting', 'other'],
        description: 'Category of the sourcing event.',
      },
      trigger_description: {
        type: 'string',
        description: 'What triggered this sourcing event (contract expiry, cost pressure, new capability need, etc.).',
      },
      decision_owner: {
        type: 'string',
        description: 'Name or role of the person with final decision authority.',
      },
      scope_description: {
        type: 'string',
        description: 'What is in / out of scope for this sourcing event.',
      },
      linked_program_id: {
        type: 'string',
        description: 'Optional program ID this event is linked to (e.g. apx-cdp-2026).',
      },
      estimated_value_usd: {
        type: 'number',
        description: 'Estimated total contract value in USD (e.g. 2400000 for $2.4M).',
      },
    },
    required: ['event_name', 'event_type', 'trigger_description'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    if (!input.event_name?.trim()) {
      return { success: false, error: 'event_name is required', recovery: 'Ask the user for the event name.' };
    }

    const clientKey = ctx.clientKey ?? 'demo';

    try {
      const event = await createSourcingEvent({
        clientKey,
        eventName: input.event_name.trim(),
        eventType: input.event_type,
        triggerDescription: input.trigger_description.trim(),
        decisionOwner: input.decision_owner?.trim(),
        scopeDescription: input.scope_description?.trim(),
        linkedProgramId: input.linked_program_id?.trim(),
        estimatedValueUsd: input.estimated_value_usd,
      });

      // Emit source-event-created artifact for the reactive panel.
      const approvalAuthority =
        'Tenant admin reviews the intake record; S0 exit is co-signed by the decision owner and sourcing lead.';

      ctx.writer?.write(
        `\n[[artifact:source-event-created]]${JSON.stringify({
          eventId: event.id,
          eventCode: event.event_code,
          eventName: event.event_name,
          lifecycleState: event.lifecycle_state,
          approvalAuthority,
          approvalUrl: '/source/events',
        })}[[/artifact]]\n`,
      );

      // Navigate to the new event's detail page.
      ctx.writer?.write(
        `\n[[artifact:navigate-to]]${JSON.stringify({ target: '/source', rationale: 'New event created — returning to Source portfolio' })}[[/artifact]]\n`,
      );

      return {
        success: true,
        data: {
          event_id: event.id,
          event_code: event.event_code,
          event_name: event.event_name,
          lifecycle_state: event.lifecycle_state,
          approval_authority: approvalAuthority,
          approval_queue_url: '/source/events',
          note: 'Event created and pending tenant-admin approval. Tell the user the exact event code, that the record is visible in the Source operating queue and /source/events approval queue, and that S0 exit requires decision-owner plus sourcing-lead co-sign after admin approval.',
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `db_write_failed: ${message}`,
        recovery: 'Tell the user the event could not be saved due to a technical issue and ask them to try again.',
      };
    }
  },
};

registerTool(commitSourceEventTool);
