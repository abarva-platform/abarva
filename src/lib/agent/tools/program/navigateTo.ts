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
// navigate to /programs/<id> via this tool. New-program origination is
// intentionally NOT an auto-navigation trigger; it must stay in the
// current canvas unless the user explicitly opens another page.

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
    'Navigate the user to a different page. ONLY call this when the user explicitly asks to be ' +
    'taken somewhere (e.g. "take me to /programs/new", "open the portfolio view", "let\'s go to ' +
    'the intelligence surface") OR when the current surface is genuinely wrong for their stated ' +
    'intent. DO NOT call this tool merely because the user wants to start, scope, or create a new ' +
    'program; collect the setup details in the current canvas instead. DO NOT call this tool when ' +
    'the user asks a question that can be answered ' +
    'in chat (e.g. "give me the discovery brief", "walk me through what I need for phase 2", ' +
    '"what are the entry criteria" — these are informational requests, not navigation requests; ' +
    'answer them in the conversation). ONLY use routes that are known to exist: /programs, ' +
    '/programs/new, /programs/<id> (e.g. /programs/apx-cdp-2026), /home, /tower, /intelligence, ' +
    '/source, /admin. Sub-routes like /programs/<id>/discovery or /programs/<id>/synthesis do ' +
    'NOT exist — navigating there will 404. After calling this tool, briefly tell the user where ' +
    'they are going and why. Target must be a relative path (starts with /); absolute URLs are ' +
    'rejected.',
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
          'Relative path to navigate to. Must be one of: "/programs", "/programs/new", ' +
          '"/programs/<id>" (e.g. "/programs/apx-cdp-2026"), "/home", "/tower", ' +
          '"/intelligence", "/source", "/admin". Sub-routes like ' +
          '"/programs/<id>/discovery" do not exist. Absolute URLs are rejected.',
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

    // Founder UX rule: program origination must not eject the user
    // from the current canvas. The agent may still navigate to an
    // existing program detail page, but `/programs/new` is no longer a
    // tool-driven auto-route from Home/Tower/Programs. Users can still
    // open the page through normal UI links; the model cannot surprise
    // them mid-conversation.
    if (
      target === '/programs/new' &&
      ctx.surface !== '/programs/new' &&
      ctx.surface !== '/demo/programs/new'
    ) {
      return {
        success: false,
        error: 'origination_canvas_continuity_required',
        recovery:
          'Do not navigate to /programs/new. Continue the program setup in the current canvas: ' +
          'confirm the intent, collect sponsor/lead/outcome/timeline, and use the origination tools available on this surface.',
      };
    }

    // Validate against known routes. Reject invented sub-routes like
    // /programs/<id>/discovery which 404. Valid patterns:
    //   /programs, /programs/new, /programs/<id> (two segments max)
    //   /home, /tower, /intelligence, /source, /admin (and sub-paths)
    const KNOWN_TOP_LEVEL = ['/home', '/tower', '/intelligence', '/source', '/admin', '/programs'];
    const segments = target.split('/').filter(Boolean); // ['programs', 'apx-cdp-2026']
    const isProgramsSubRoute = segments[0] === 'programs' && segments.length > 2 && segments[1] !== 'new';
    if (isProgramsSubRoute) {
      return {
        success: false,
        error: 'route_not_found',
        recovery:
          `The route "${target}" does not exist — /programs/<id> sub-routes like ` +
          '/discovery, /synthesis, /design are not standalone pages. ' +
          'Answer the user\'s question in chat instead of navigating.',
      };
    }
    const isKnownRoute = KNOWN_TOP_LEVEL.some((p) => target === p || target.startsWith(p + '/'));
    if (!isKnownRoute) {
      return {
        success: false,
        error: 'route_not_found',
        recovery:
          `The route "${target}" is not a known AbarVa route. Known top-level routes: ` +
          KNOWN_TOP_LEVEL.join(', ') + '. Answer the user\'s question in chat.',
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
