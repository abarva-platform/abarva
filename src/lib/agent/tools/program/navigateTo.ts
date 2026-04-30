// navigate_to tool · Surface 2 PR-Q · Wave 2 polish (founder feedback)
//
// Closes the founder-flagged gap: "[Nexus] does not help me navigate
// to phase 1 ... I don't have a navigation tool in my current
// session." Without a navigation primitive Nexus can only describe
// where to go — it can't take the user there. This tool emits a
// `navigate-to` artifact via ctx.writer; AtlasPageStateProvider
// intercepts the artifact post-stream and calls router.push(target).
//
// Same pattern as advance_phase emitting program-phase-changed for
// router.refresh() (PR-L). The tool itself is intentionally thin —
// validation lives in the artifact parser (target must be a relative
// path starting with `/` and not protocol-relative `//`).
//
// Surfaces: every entry surface so any agent can navigate. The
// surface filter still applies — Sentinel on /intelligence can
// navigate to /programs/<id> via this tool, but Steward on
// /programs/new is unaffected (Steward already has navigation via
// the program-created sentinel pattern).

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';

interface NavigateToInput {
  /** Relative path. Absolute URLs and protocol-relative `//` are rejected. */
  target: string;
  /** Optional one-line rationale rendered in chat by the agent. */
  rationale?: string;
  /** When true, replaces history instead of pushing. Default false. */
  replace?: boolean;
}

export const navigateToTool: AgentTool<NavigateToInput> = {
  name: 'navigate_to',
  description:
    'Navigate the user to a different page. Use when the user asks to be taken somewhere ' +
    '("take me to phase 1", "open the CDP program", "let\'s go to /programs/new") OR when the ' +
    "current surface isn't the right one for the user's intent (e.g. on /programs the user wants " +
    'to set up a NEW program — redirect to /programs/new where Steward owns origination). ' +
    'After calling this tool, briefly tell the user where they are going and why; the client ' +
    'will navigate when your turn ends. Target must be a relative path (starts with /); the tool ' +
    'rejects absolute URLs to keep the user on-app.',
  surfaces: [
    '/programs',
    '/programs/:id',
    '/programs/new',
    '/demo/programs/new',
    '/home',
    '/tower',
    '/intelligence',
    '/source',
  ],
  input_schema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description:
          'Relative path to navigate to. Examples: "/programs/apx-cdp-2026", "/programs/new", ' +
          '"/programs/apx-cdp-2026/report", "/intelligence". Absolute URLs are rejected.',
      },
      rationale: {
        type: 'string',
        description: 'Optional one-line rationale for telemetry / debugging. Not shown in chat.',
      },
      replace: {
        type: 'boolean',
        description:
          'When true, replaces the history entry instead of pushing. Use for "consolidating" ' +
          'navigations like origination → active program where the prior URL should not survive ' +
          'a back-button press. Default false.',
      },
    },
    required: ['target'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    const target = typeof input.target === 'string' ? input.target.trim() : '';
    if (!target.startsWith('/') || target.startsWith('//')) {
      return {
        success: false,
        error: 'invalid_target',
        recovery:
          'Target must be a relative path starting with `/` (e.g. `/programs/apx-cdp-2026`). ' +
          'Tell the user what page you wanted to take them to and ask if that path is correct.',
      };
    }

    const replace = input.replace === true;
    const payload = {
      target,
      rationale: input.rationale,
      replace,
    };
    ctx.writer?.write(
      `\n[[artifact:navigate-to]]${JSON.stringify(payload)}[[/artifact]]\n`,
    );

    return {
      success: true,
      data: {
        target,
        replace,
        note:
          'Navigation queued. The client will route on stream close. Tell the user briefly ' +
          'where they are heading.',
      },
    };
  },
};

registerTool(navigateToTool);
