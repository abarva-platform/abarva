/**
 * Model-facing schema subjects — one check over the whole tool registry.
 *
 * `toAnthropicToolDefinition` hands `description` and `input_schema`
 * verbatim to the model, so prose written there is an instruction, not a
 * comment. When that prose names a subject — another tool, a corpus id, a
 * route, an enum member — the model will act on it. Nothing checked that
 * the named subject still resolves, and a worked example that had been
 * retired from the pattern corpus was still being offered to the model
 * months later.
 *
 * The unit is the registry, not the tool: a per-tool test only covers the
 * tool someone remembered to write it for, which is how the first instance
 * survived. Every check below resolves the named subject against its real
 * source — the registry itself, the live pattern manifest, the tool's own
 * declared enum, the tool's own route handler, the App Router file tree —
 * rather than against a list restated here.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Registration is by import side effect, exactly as
// `src/app/api/chat/agent/route.ts` does it.
import '../program/commitProgram';
import '../program/lookupPerson';
import '../program/registerPlaceholderPerson';
import '../program/advancePhase';
import '../program/completeDeliverable';
import '../program/completeDeliverables';
import '../program/navigateTo';
import '../program/createMilestones';
import '../program/completeModule';
import '../program/assignSponsor';
import '../program/completeProgram';
import '../program/draftArtifact';
import '../source/commitSourceEvent';
import '../intelligence/searchPatterns';
import '../intelligence/patternNeighborhood';
import '../intelligence/evidenceLookup';
import '../intelligence/validateSynthesis';

import {
  __testing__,
  getRelevantTools,
  type AgentTool,
  type ToolContext,
} from '../registry';
import { CANONICAL_TENANTS } from '@/config/tenants/CANONICAL_TENANTS';
import { getPatternManifestEntry } from '@/lib/intelligence/pattern-manifest';

const TOOLS_DIR = path.join(process.cwd(), 'src/lib/agent/tools');
const APP_DIR = path.join(process.cwd(), 'src/app');

/** One piece of prose the model is shown, with where it came from. */
interface ProseField {
  tool: string;
  /** `description`, or the dotted path of a nested `input_schema` description. */
  path: string;
  text: string;
  surfaces: ReadonlyArray<string>;
}

function registeredTools(): AgentTool[] {
  return __testing__.list();
}

/**
 * Every string the model reads: the tool description plus every nested
 * `description` anywhere in `input_schema` (array items and sub-objects
 * included — `complete_deliverables` keeps its per-item prose two levels
 * down).
 */
function modelFacingProse(): ProseField[] {
  const fields: ProseField[] = [];
  for (const tool of registeredTools()) {
    fields.push({
      tool: tool.name,
      path: 'description',
      text: tool.description,
      surfaces: tool.surfaces,
    });
    const walk = (node: unknown, at: string): void => {
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (key === 'description' && typeof value === 'string') {
          fields.push({ tool: tool.name, path: `${at}.description`, text: value, surfaces: tool.surfaces });
        } else if (value && typeof value === 'object') {
          walk(value, `${at}.${key}`);
        }
      }
    };
    walk(tool.input_schema, 'input_schema');
  }
  return fields;
}

/**
 * A surface pattern turned into a concrete surface key so it can be run
 * through the real `getRelevantTools`. `new` is deliberately avoided:
 * `surfaceMatches` refuses to let `:id` capture that sibling literal.
 */
function concreteSurface(pattern: string): string {
  if (pattern === '*') return '/home';
  return pattern
    .split('/')
    .map((segment) => (segment.startsWith(':') ? 'resolved-id' : segment))
    .join('/');
}

describe('model-facing tool schema subjects', () => {
  it('covers every tool that registers itself, so a new tool cannot escape these checks', () => {
    // Registration is by import side effect. If someone adds a tool and
    // does not import it above, every check in this file silently skips
    // it — the exact shape of gate this lane refuses to ship. Count the
    // modules that call registerTool on disk and require the registry to
    // hold that many.
    const modules: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__tests__') continue;
          walk(full);
        } else if (entry.name.endsWith('.ts')) {
          if (/(^|\W)registerTool\(/.test(fs.readFileSync(full, 'utf8'))) modules.push(full);
        }
      }
    };
    walk(TOOLS_DIR);

    // registry.ts declares registerTool; it does not call it on itself.
    const registering = modules.filter((m) => !m.endsWith(`${path.sep}registry.ts`));
    expect(registeredTools()).toHaveLength(registering.length);
  });

  it('names no tool the model cannot actually call from the surface it reads that instruction on', () => {
    // "use lookup_person first" is an instruction. The model only sees
    // the tools `getRelevantTools` returned for its current surface, and
    // `executeTool` fails closed on anything else, so a cross-tool
    // instruction is only actionable where both tools are registered.
    const names = registeredTools().map((tool) => tool.name);
    const unreachable: string[] = [];

    for (const field of modelFacingProse()) {
      for (const named of names) {
        if (named === field.tool) continue;
        if (!new RegExp(`\\b${named}\\b`).test(field.text)) continue;
        const reachable = field.surfaces.some((surface) =>
          getRelevantTools(concreteSurface(surface)).some((tool) => tool.name === named),
        );
        if (!reachable) unreachable.push(`${field.tool} @ ${field.path} -> ${named}`);
      }
    }

    expect(unreachable).toEqual([]);
  });

  it('offers no pattern id the live corpus cannot resolve', () => {
    // The corpus was re-keyed from `pattern_<name>` slugs to `PAT-<code>`
    // codes. An id written here is a worked example the model will copy;
    // `commit_program` writes its `matched_pattern_id` straight into
    // `pattern_match_logs.pattern_key`, so an unresolvable one does not
    // merely fail a lookup, it lands in an audit row. Naming no id at all
    // is the other acceptable answer.
    const toolNames = new Set(registeredTools().map((tool) => tool.name));
    const unresolvable: string[] = [];

    for (const field of modelFacingProse()) {
      const candidates = field.text.match(/\b(?:PAT-[A-Z][A-Z0-9-]*|pattern_[a-z][a-z0-9_]*)\b/g) ?? [];
      for (const candidate of candidates) {
        // `pattern_neighborhood` is a tool, not a corpus entry.
        if (toolNames.has(candidate)) continue;
        if (!getPatternManifestEntry(candidate)) {
          unresolvable.push(`${field.tool} @ ${field.path} -> ${candidate}`);
        }
      }
    }

    expect(unresolvable).toEqual([]);
  });

  it('uses no active tenant identity as a worked example in model-facing prose', () => {
    const identities = new Set(
      CANONICAL_TENANTS.flatMap((tenant) => [
        tenant.key,
        tenant.name,
        tenant.key.split('-')[0],
      ])
        .map((identity) => identity.toLowerCase())
        .filter((identity) => identity.length >= 6),
    );
    const exposed: string[] = [];

    for (const field of modelFacingProse()) {
      const prose = field.text.toLowerCase();
      for (const identity of identities) {
        if (prose.includes(identity)) {
          exposed.push(`${field.tool} @ ${field.path} -> ${identity}`);
        }
      }
    }

    expect(exposed).toEqual([]);
  });

  it('names no enum member that its own property does not declare', () => {
    // Where a property declares an `enum`, the schema already carries the
    // accepted set; prose that names a value alongside it is a second,
    // unchecked copy. Tool names and the schema's own property names are
    // excluded — those are subjects of a different kind, checked above.
    const toolNames = new Set(registeredTools().map((tool) => tool.name));
    const mismatched: string[] = [];

    for (const tool of registeredTools()) {
      const propertyNames = new Set<string>();
      const collectNames = (node: unknown): void => {
        if (!node || typeof node !== 'object') return;
        const record = node as Record<string, unknown>;
        if (record.properties && typeof record.properties === 'object') {
          for (const key of Object.keys(record.properties as Record<string, unknown>)) propertyNames.add(key);
        }
        for (const value of Object.values(record)) if (value && typeof value === 'object') collectNames(value);
      };
      collectNames(tool.input_schema);

      const walk = (node: unknown, at: string): void => {
        if (!node || typeof node !== 'object') return;
        const record = node as Record<string, unknown>;
        const items = record.items as Record<string, unknown> | undefined;
        const declared = (Array.isArray(record.enum) ? record.enum : undefined)
          ?? (items && Array.isArray(items.enum) ? items.enum : undefined);
        const prose = typeof record.description === 'string' ? record.description : '';
        if (declared && prose) {
          const members = new Set(declared.map(String));
          const named = [
            // snake_case values, e.g. `contract_optimization`
            ...(prose.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? []),
            // single-quoted values, e.g. `'all'`
            ...(prose.match(/'[a-z][a-z0-9_-]*'/g) ?? []).map((q) => q.slice(1, -1)),
          ];
          for (const value of named) {
            if (toolNames.has(value) || propertyNames.has(value)) continue;
            if (!members.has(value)) mismatched.push(`${tool.name} @ ${at} -> ${value}`);
          }
        }
        for (const [key, value] of Object.entries(record)) {
          if (value && typeof value === 'object') walk(value, `${at}.${key}`);
        }
      };
      walk(tool.input_schema, 'input_schema');
    }

    expect(mismatched).toEqual([]);
  });

  describe('route claims', () => {
    // A quoted `/`-path in model-facing prose is a navigation instruction.
    // Unquoted slashes in this corpus are prose alternations (`P4=roadmap/
    // execution_plan`, `sign/submit`), so the quoted form is the one that
    // can be read unambiguously — that limit is real and stated rather
    // than papered over. The App Router check below does not depend on
    // it, so a rename is still caught however the prose is written.
    function quotedRouteClaims(): Array<{ tool: string; path: string; route: string }> {
      const claims: Array<{ tool: string; path: string; route: string }> = [];
      for (const field of modelFacingProse()) {
        for (const match of field.text.match(/"(\/[^"\s]*)"/g) ?? []) {
          claims.push({ tool: field.tool, path: field.path, route: match.slice(1, -1) });
        }
      }
      return claims;
    }

    it('requires route claims to be double-quoted so every claim reaches the resolver checks', () => {
      const unquoted: string[] = [];
      for (const field of modelFacingProse()) {
        const outsideQuotes = field.text.replace(/"[^"\n]*"/g, '');
        const claims = outsideQuotes.match(/(?<![a-z0-9_>])\/[a-z][a-z0-9_-]*(?:\/(?:<[a-z][a-z0-9_-]*>|[a-z0-9_-]+))*/gi) ?? [];
        for (const route of claims) {
          unquoted.push(`${field.tool} @ ${field.path} -> ${route}`);
        }
      }

      expect(unquoted).toEqual([]);
    });

    /** Route strings the App Router actually serves, dynamic segments as `:dyn`. */
    function routableePaths(): Set<string> {
      const routes = new Set<string>();
      const walk = (dir: string, segments: string[]): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'api') continue;
            // `(maestro)` and friends are route groups: they organise
            // files without appearing in the URL.
            const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
            const isDynamic = entry.name.startsWith('[');
            walk(full, isGroup ? segments : [...segments, isDynamic ? ':dyn' : entry.name]);
          } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
            routes.add(`/${segments.join('/')}`);
          }
        }
      };
      walk(APP_DIR, []);
      return routes;
    }

    async function runNavigateTo(route: string) {
      const navigate = registeredTools().find((tool) => tool.name === 'navigate_to');
      if (!navigate) throw new Error('navigate_to is not registered');
      const ctx: ToolContext = {
        request: new Request('http://localhost/'),
        // `/programs/new` is only accepted from the origination canvas
        // itself, so the claim is judged from a surface that can reach
        // every route the prose offers.
        surface: '/programs/new',
      };
      return navigate.handler({ target: route } as never, ctx);
    }

    it('offers only routes its own handler accepts, and refuses exactly the ones it warns about', async () => {
      const accepted: string[] = [];
      const refused: string[] = [];
      for (const claim of quotedRouteClaims()) {
        const result = await runNavigateTo(claim.route);
        (result.success ? accepted : refused).push(claim.route);
      }

      // The prose names one route in order to say it does NOT exist. It
      // has to keep being refused, or the warning is stale in the
      // direction that 404s the user.
      expect([...new Set(refused)]).toEqual([
        '/programs/<id>/discovery',
        '/programs/<id>/synthesis',
      ]);
      expect(accepted.length).toBeGreaterThan(0);
    });

    it('offers only routes the App Router actually serves', async () => {
      const routes = routableePaths();
      const missing: string[] = [];

      for (const claim of quotedRouteClaims()) {
        const result = await runNavigateTo(claim.route);
        if (!result.success) continue;
        // `<id>` in prose and a concrete example id both stand for the
        // dynamic segment the router declares as `[id]`.
        const concrete = `/${claim.route
          .split('/')
          .filter(Boolean)
          .map((segment, index, all) => {
            const literal = `/${all.slice(0, index + 1).join('/')}`;
            if (segment.startsWith('<') || (!routes.has(literal) && !hasPrefix(routes, literal))) return ':dyn';
            return segment;
          })
          .join('/')}`;
        if (!routes.has(concrete)) missing.push(`${claim.tool} @ ${claim.path} -> ${claim.route}`);
      }

      expect(missing).toEqual([]);
    });

    function hasPrefix(routes: Set<string>, prefix: string): boolean {
      for (const route of routes) if (route === prefix || route.startsWith(`${prefix}/`)) return true;
      return false;
    }
  });
});
