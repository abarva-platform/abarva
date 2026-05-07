// Entrypoint for write-mode scenarios. Run a single named scenario,
// or chain create-event → walk-canvas → promote-stage end-to-end with
// `e2e`. Audit trail + screenshots land in
// `tools/source-crawl/runs/<ts>-<scenario>/`.
//
// Unlike `crawl.ts`, this script intentionally permits non-GET
// requests — scenarios DRIVE the surface. Use only against tenants
// you own (AbarVa demo tenants). Do not point at a production
// sourcing platform you do not control.

import { chromium } from 'playwright';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { loadConfig, type CrawlConfig } from './config.js';
import {
  createEvent,
  makeLogger,
  makeRunDir,
  promoteStage,
  walkCanvas,
  type CreateEventOptions,
  type ScenarioContext,
  type ScenarioName,
} from './scenarios.js';

interface ParsedArgs {
  name: ScenarioName | 'e2e';
  eventUrl: string | null;
  useLastEvent: boolean;
  fixturePath: string | null;
  quick: boolean;
}

function parseArgs(): ParsedArgs {
  const argv = process.argv.slice(2);
  const name = argv[0] as ParsedArgs['name'];
  if (!name) {
    console.error(
      'Usage: tsx src/scenario.ts <create-event|walk-canvas|promote-stage|e2e> [--event <url>] [--fixture path/to/event.json] [--quick]',
    );
    process.exit(1);
  }
  const eventFlag = argv.indexOf('--event');
  const eventArg =
    eventFlag >= 0 && argv[eventFlag + 1] ? (argv[eventFlag + 1] ?? null) : null;
  const fixtureFlag = argv.indexOf('--fixture');
  const fixtureArg =
    fixtureFlag >= 0 && argv[fixtureFlag + 1] ? (argv[fixtureFlag + 1] ?? null) : null;

  return {
    name,
    eventUrl: eventArg,
    useLastEvent: !eventArg, // default behavior — auto-resolve from runs/
    fixturePath: fixtureArg,
    quick: argv.includes('--quick'),
  };
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const args = parseArgs();

  if (!existsSync(cfg.storageStatePath)) {
    console.error(
      `✗ Missing storage state at ${cfg.storageStatePath}. Run \`npm run save-session\` first.`,
    );
    process.exit(1);
  }

  const runDir = makeRunDir(cfg, args.name === 'e2e' ? 'create-event' : args.name);
  // For e2e we keep one parent run dir but each step appends to the same audit log.
  const log = makeLogger(runDir);

  log(`scenario: ${args.name}`);
  log(`tenant:   ${cfg.tenantUrl}`);
  log(`run dir:  ${runDir}`);

  // A6 — `--quick` overrides .env CRAWL_HEADED; useful for unattended
  // smoke runs. Default behavior (headed) preserved.
  const headless = args.quick ? true : !cfg.headed;
  if (args.quick) log(`quick mode: headless`);
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    storageState: cfg.storageStatePath,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const ctx: ScenarioContext = { page, context, cfg, runDir, log };
  const summary: ScenarioSummary = {
    scenario: args.name,
    tenantUrl: cfg.tenantUrl,
    runDir,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    success: false,
    steps: [],
  };

  try {
    const fixture = loadFixture(args.fixturePath, log);
    if (args.name === 'create-event') {
      summary.steps.push(await runCreateEvent(ctx, summary, fixture));
    } else if (args.name === 'walk-canvas') {
      const eventUrl = await resolveEventUrl(args, cfg, log);
      summary.steps.push(await runWalkCanvas(ctx, summary, eventUrl));
    } else if (args.name === 'promote-stage') {
      const eventUrl = await resolveEventUrl(args, cfg, log);
      summary.steps.push(await runPromoteStage(ctx, summary, eventUrl));
    } else if (args.name === 'e2e') {
      // create-event → walk-canvas → promote-stage in one shot.
      const created = await runCreateEvent(ctx, summary, fixture);
      summary.steps.push(created);
      const eventUrl = (created.result as { eventUrl?: string })?.eventUrl;
      if (!eventUrl) throw new Error('e2e: create-event did not return an eventUrl.');
      summary.steps.push(await runWalkCanvas(ctx, summary, eventUrl));
      summary.steps.push(await runPromoteStage(ctx, summary, eventUrl));
    } else {
      throw new Error(`unknown scenario: ${args.name}`);
    }
    summary.success = true;
    log(`✓ done`);
  } catch (err) {
    log(`✗ failed: ${(err as Error).message}`);
    summary.failure = (err as Error).message;
    await page
      .screenshot({ path: join(runDir, 'failure.png'), fullPage: false })
      .catch(() => {});
    process.exitCode = 1;
  } finally {
    summary.finishedAt = new Date().toISOString();
    writeSummary(runDir, summary);
    await browser.close();
    log(`summary: ${join(runDir, 'summary.md')}`);
  }
}

// ── Step runners ────────────────────────────────────────────────────────────

interface StepRecord {
  step: ScenarioName;
  ok: boolean;
  result: unknown;
  error?: string;
}

async function runCreateEvent(
  ctx: ScenarioContext,
  _summary: ScenarioSummary,
  fixture?: CreateEventOptions,
): Promise<StepRecord> {
  try {
    const result = await createEvent(ctx, fixture);
    writeFileSync(
      join(ctx.runDir, 'result.create-event.json'),
      JSON.stringify(result, null, 2),
    );
    return { step: 'create-event', ok: true, result };
  } catch (err) {
    return { step: 'create-event', ok: false, result: null, error: (err as Error).message };
  }
}

function loadFixture(
  fixturePath: string | null,
  log: (line: string) => void,
): CreateEventOptions | undefined {
  if (!fixturePath) return undefined;
  const resolved = resolve(process.cwd(), fixturePath);
  if (!existsSync(resolved)) {
    throw new Error(`fixture not found: ${resolved}`);
  }
  try {
    const parsed = JSON.parse(readFileSync(resolved, 'utf8')) as Partial<CreateEventOptions>;
    if (!parsed.trigger || typeof parsed.trigger !== 'string') {
      throw new Error('fixture must have a non-empty `trigger` field');
    }
    log(`fixture: ${relative(process.cwd(), resolved)}`);
    return parsed as CreateEventOptions;
  } catch (err) {
    throw new Error(`failed to load fixture ${resolved}: ${(err as Error).message}`);
  }
}

async function runWalkCanvas(
  ctx: ScenarioContext,
  _summary: ScenarioSummary,
  eventUrl: string,
): Promise<StepRecord> {
  try {
    const result = await walkCanvas(ctx, eventUrl);
    writeFileSync(
      join(ctx.runDir, 'result.walk-canvas.json'),
      JSON.stringify(result, null, 2),
    );
    return { step: 'walk-canvas', ok: true, result };
  } catch (err) {
    return { step: 'walk-canvas', ok: false, result: null, error: (err as Error).message };
  }
}

async function runPromoteStage(
  ctx: ScenarioContext,
  _summary: ScenarioSummary,
  eventUrl: string,
): Promise<StepRecord> {
  try {
    const result = await promoteStage(ctx, eventUrl);
    writeFileSync(
      join(ctx.runDir, 'result.promote-stage.json'),
      JSON.stringify(result, null, 2),
    );
    return { step: 'promote-stage', ok: true, result };
  } catch (err) {
    return { step: 'promote-stage', ok: false, result: null, error: (err as Error).message };
  }
}

// ── Auto-resolve eventUrl from prior runs ───────────────────────────────────
// A2 in EASE_OF_USE_BACKLOG: when --event is missing, default to the
// eventUrl from the most recent create-event (or e2e) run.

async function resolveEventUrl(
  args: ParsedArgs,
  cfg: CrawlConfig,
  log: (line: string) => void,
): Promise<string> {
  if (args.eventUrl) return args.eventUrl;
  if (!args.useLastEvent) {
    throw new Error('No event URL provided.');
  }

  const runsRoot = join(cfg.outputDir, '..', '..', 'runs');
  if (!existsSync(runsRoot)) {
    throw new Error(
      `No prior runs found at ${runsRoot}. Run \`npm run scenario:create-event\` first or pass --event explicitly.`,
    );
  }

  const dirs = readdirSync(runsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(runsRoot, d.name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  for (const dir of dirs) {
    const candidates = [
      join(dir, 'result.create-event.json'),
      join(dir, 'result.json'), // legacy single-step runs
    ];
    for (const path of candidates) {
      if (!existsSync(path)) continue;
      try {
        const parsed = JSON.parse(readFileSync(path, 'utf8')) as {
          eventUrl?: string;
        };
        if (parsed.eventUrl) {
          log(
            `auto-resolved eventUrl from ${relative(dirname(runsRoot), path)} → ${parsed.eventUrl}`,
          );
          return parsed.eventUrl;
        }
      } catch {
        // skip malformed result.json
      }
    }
  }

  throw new Error(
    `No prior eventUrl found under ${runsRoot}. Pass --event explicitly or run \`scenario:create-event\` first.`,
  );
}

// ── Summary writer (A4) ─────────────────────────────────────────────────────
// Per-run summary.md so a quick visual review is one open-file away,
// not 800 lines of JSON.

interface ScenarioSummary {
  scenario: ParsedArgs['name'];
  tenantUrl: string;
  runDir: string;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  failure?: string;
  steps: StepRecord[];
}

function writeSummary(runDir: string, summary: ScenarioSummary): void {
  const lines: string[] = [];
  lines.push(`# Run summary · ${summary.scenario}`);
  lines.push('');
  lines.push(
    `**Status:** ${summary.success ? '✓ success' : '✗ failed'}  `,
  );
  lines.push(`**Tenant:** ${summary.tenantUrl}  `);
  lines.push(`**Started:** ${summary.startedAt}  `);
  lines.push(`**Finished:** ${summary.finishedAt}  `);
  if (summary.failure) {
    lines.push(`**Failure:** ${summary.failure}`);
  }
  lines.push('');
  lines.push('## Steps');
  for (const step of summary.steps) {
    lines.push('');
    lines.push(`### ${step.ok ? '✓' : '✗'} ${step.step}`);
    if (!step.ok) {
      lines.push('');
      lines.push(`> ${step.error ?? 'unknown error'}`);
      continue;
    }
    if (step.result && typeof step.result === 'object') {
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(step.result, null, 2));
      lines.push('```');
    }
  }
  // Embed any screenshots present in the run dir at the end.
  const screenshots = readdirSync(runDir).filter((f) => f.endsWith('.png'));
  if (screenshots.length > 0) {
    lines.push('');
    lines.push('## Screenshots');
    for (const png of screenshots) {
      lines.push('');
      lines.push(`![${png}](./${png})`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('See `audit.log` for the full timestamped action trail.');
  writeFileSync(join(runDir, 'summary.md'), lines.join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
