// Entrypoint for write-mode scenarios. Run a single named scenario
// against AbarVa, capture an audit trail + screenshots in
// `tools/source-crawl/runs/<ts>-<scenario>/`.
//
// Unlike `crawl.ts`, this script intentionally permits non-GET
// requests — scenarios DRIVE the surface (create event, promote
// stage). Use it only against tenants you own (e.g. AbarVa demo
// tenants); do not run against a production sourcing platform you do
// not control.

import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './config.js';
import {
  createEvent,
  makeLogger,
  makeRunDir,
  promoteStage,
  walkCanvas,
  type ScenarioContext,
  type ScenarioName,
} from './scenarios.js';

function parseArgs(): { name: ScenarioName; eventUrl: string | null } {
  const argv = process.argv.slice(2);
  const name = argv[0] as ScenarioName;
  if (!name) {
    console.error(
      'Usage: tsx src/scenario.ts <create-event|walk-canvas|promote-stage> [--event <url>]',
    );
    process.exit(1);
  }
  const eventFlag = argv.indexOf('--event');
  const eventUrl =
    eventFlag >= 0 && argv[eventFlag + 1] ? argv[eventFlag + 1] ?? null : null;
  return { name, eventUrl };
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const { name, eventUrl } = parseArgs();

  if (!existsSync(cfg.storageStatePath)) {
    console.error(
      `✗ Missing storage state at ${cfg.storageStatePath}. Run \`npm run save-session\` first.`,
    );
    process.exit(1);
  }

  const runDir = makeRunDir(cfg, name);
  const log = makeLogger(runDir);

  log(`scenario: ${name}`);
  log(`tenant:   ${cfg.tenantUrl}`);
  log(`run dir:  ${runDir}`);

  const browser = await chromium.launch({ headless: !cfg.headed });
  const context = await browser.newContext({
    storageState: cfg.storageStatePath,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const ctx: ScenarioContext = { page, context, cfg, runDir, log };

  try {
    if (name === 'create-event') {
      const result = await createEvent(ctx);
      writeFileSync(join(runDir, 'result.json'), JSON.stringify(result, null, 2));
    } else if (name === 'walk-canvas') {
      if (!eventUrl) {
        throw new Error(
          'walk-canvas needs an event URL — pass --event https://app.abarva.ai/source/events/<id>',
        );
      }
      const result = await walkCanvas(ctx, eventUrl);
      writeFileSync(join(runDir, 'result.json'), JSON.stringify(result, null, 2));
    } else if (name === 'promote-stage') {
      if (!eventUrl) {
        throw new Error(
          'promote-stage needs an event URL — pass --event https://app.abarva.ai/source/events/<id>',
        );
      }
      const result = await promoteStage(ctx, eventUrl);
      writeFileSync(join(runDir, 'result.json'), JSON.stringify(result, null, 2));
    } else {
      throw new Error(`unknown scenario: ${name}`);
    }
    log(`✓ done`);
  } catch (err) {
    log(`✗ failed: ${(err as Error).message}`);
    await page
      .screenshot({ path: join(runDir, 'failure.png'), fullPage: false })
      .catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
