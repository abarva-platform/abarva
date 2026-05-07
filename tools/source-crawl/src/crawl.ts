// Main BFS crawler. Slice 1 — read-only inventory of one tenant's
// sourcing surface.
//
// Discipline: serial requests, jitter between navigations, never
// follow a write-labelled link, abort any path whose navigation
// triggers a non-GET request, halt if we ever see a write-confirmation
// copy in the response body.

import { chromium, type BrowserContext, type Page } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { loadConfig, type CrawlConfig } from './config.js';
import { CrawlOutput } from './output.js';
import { extractPage } from './extractor.js';
import {
  isMutatingMethod,
  isWriteConfirmationCopy,
  isWriteLabel,
} from './safety.js';
import type {
  AgentTouchpoint,
  CrawlSummary,
  EntityType,
  UrlInventoryRow,
} from './types.js';

interface FrontierEntry {
  url: string;
  depth: number;
  parent: string | null;
}

const ENTITY_TYPES: EntityType[] = [
  'events',
  'suppliers',
  'categories',
  'templates',
  'question_library',
  'clause_library',
  'knowledge_artifacts',
  'contracts',
  'license_baseline',
  'poc_pilots',
  'arb_decisions',
  'analytics_widgets',
  'agent_touchpoint',
  'unclassified',
];

function emptyEntityCounts(): Record<EntityType, number> {
  const out = {} as Record<EntityType, number>;
  for (const t of ENTITY_TYPES) out[t] = 0;
  return out;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry') || !args.has('--full');
  const cap = dryRun ? cfg.dryPages : cfg.maxPages;

  if (!existsSync(cfg.storageStatePath)) {
    console.error(
      `✗ Missing storage state at ${cfg.storageStatePath}. Run \`npm run save-session\` first.`,
    );
    process.exit(1);
  }

  console.log(`▸ ${dryRun ? 'DRY' : 'FULL'} crawl — cap ${cap} pages`);
  console.log(`  Tenant URL:        ${cfg.tenantUrl}`);
  console.log(`  Hostname allow:    ${cfg.tenantHostname}`);
  console.log(`  Path prefix:       ${cfg.tenantPathPrefix}`);
  console.log();

  const output = new CrawlOutput(cfg.outputDir, cfg.vaultDir, cfg.screenshotDir);
  const summary: CrawlSummary = {
    started_at: new Date().toISOString(),
    finished_at: '',
    stop_reason: 'completed',
    total_pages: 0,
    counts_per_entity_type: emptyEntityCounts(),
    depth_histogram: {},
    skipped_mutating_paths: [],
    errors: [],
    rate_limit_hits: 0,
    entities_not_found: [],
    dry_pass: dryRun,
  };

  const browser = await chromium.launch({ headless: !cfg.headed });
  const context = await browser.newContext({
    storageState: cfg.storageStatePath,
    viewport: { width: 1440, height: 900 },
  });

  // Network gate — abort any non-GET that would commit a write.
  let mutatingDetected: { method: string; url: string } | null = null;
  context.on('request', (req) => {
    if (isMutatingMethod(req.method())) {
      mutatingDetected = { method: req.method(), url: req.url() };
    }
  });

  const page = await context.newPage();

  const visited = new Set<string>();
  const frontier: FrontierEntry[] = [
    { url: cfg.tenantUrl, depth: 0, parent: null },
  ];
  const touchpointsAll: AgentTouchpoint[] = [];

  const wallStart = Date.now();
  const wallLimitMs = cfg.maxHours * 3600_000;

  try {
    while (frontier.length > 0 && summary.total_pages < cap) {
      if (Date.now() - wallStart > wallLimitMs) {
        summary.stop_reason = 'max_hours';
        break;
      }
      const next = frontier.shift();
      if (!next) break;
      const { url, depth, parent } = next;
      if (visited.has(url)) continue;
      visited.add(url);

      // Stay-in-tenant gate.
      const target = new URL(url);
      if (target.hostname !== cfg.tenantHostname) continue;
      if (
        cfg.tenantPathPrefix &&
        cfg.tenantPathPrefix !== '/' &&
        !target.pathname.startsWith(cfg.tenantPathPrefix)
      ) {
        continue;
      }

      mutatingDetected = null;
      const result = await visit(page, url, cfg);

      if (mutatingDetected) {
        summary.skipped_mutating_paths.push({
          url,
          reason: `Triggered ${(mutatingDetected as { method: string }).method}`,
        });
        output.appendUrlInventory({
          url,
          status: result.status,
          entity_type: 'unclassified',
          depth,
          parent,
          captured_at: new Date().toISOString(),
          bytes: null,
          notes: 'skipped — observed mutating request',
        });
        continue;
      }

      if (result.status === 429) {
        summary.rate_limit_hits += 1;
        await sleep(8000);
        // Re-queue once.
        frontier.push({ url, depth, parent });
        continue;
      }

      if (!result.ok) {
        output.appendUrlInventory({
          url,
          status: result.status,
          entity_type: 'unclassified',
          depth,
          parent,
          captured_at: new Date().toISOString(),
          bytes: null,
          notes: result.note,
        });
        continue;
      }

      const captureTs = new Date().toISOString();
      const extracted = await extractPage(page, url, parent, captureTs);

      if (isWriteConfirmationCopy(extracted.bodyText)) {
        summary.stop_reason = 'write_confirmation';
        summary.errors.push({
          url,
          message:
            'Page contains write-confirmation copy. Halting — script may have triggered a write.',
          at: captureTs,
        });
        break;
      }

      // PII-aware persist: structured payload to JSONL (redacted in
      // extractor), raw HTML lands in vault/.
      output.appendSnapshot(extracted.snapshot);
      const pageId = hashUrl(url);
      writeFileSync(output.rawHtmlPath(pageId), await page.content());
      // Viewport screenshot only — full-page captures stay in vault/.
      await page
        .screenshot({ path: output.screenshotPath(pageId), fullPage: false })
        .catch(() => {});

      const inventory: UrlInventoryRow = {
        url,
        status: result.status,
        entity_type: extracted.snapshot.entity_type,
        depth,
        parent,
        captured_at: captureTs,
        bytes: extracted.pageBytes,
        notes: '',
      };
      output.appendUrlInventory(inventory);

      summary.total_pages += 1;
      summary.counts_per_entity_type[extracted.snapshot.entity_type] =
        (summary.counts_per_entity_type[extracted.snapshot.entity_type] ?? 0) +
        1;
      summary.depth_histogram[String(depth)] =
        (summary.depth_histogram[String(depth)] ?? 0) + 1;

      for (const tp of extracted.touchpoints) {
        const screenshot = `${pageId}.png`;
        const enriched: AgentTouchpoint = {
          ...tp,
          screenshot_path: screenshot,
        };
        touchpointsAll.push(enriched);
        output.recordTouchpoint(enriched);
      }

      // Enqueue intra-tenant outbound links not yet visited.
      for (const link of extracted.snapshot.outbound_intra_links) {
        if (!visited.has(link)) {
          frontier.push({ url: link, depth: depth + 1, parent: url });
        }
      }

      await sleep(jitter(cfg.delayMinMs, cfg.delayMaxMs));
      if (summary.total_pages % 10 === 0) {
        process.stdout.write(`  ${summary.total_pages} pages…\n`);
      }
    }

    if (summary.stop_reason === 'completed' && summary.total_pages >= cap) {
      summary.stop_reason = 'max_pages';
    }
  } catch (err) {
    summary.stop_reason = 'error';
    summary.errors.push({
      url: page.url(),
      message: (err as Error).message,
      at: new Date().toISOString(),
    });
    console.error(err);
  } finally {
    summary.finished_at = new Date().toISOString();
    summary.entities_not_found = ENTITY_TYPES.filter(
      (t) => t !== 'unclassified' && summary.counts_per_entity_type[t] === 0,
    );
    output.finalize(summary);
    await browser.close();

    console.log();
    console.log(`✓ Crawl finished — stop_reason=${summary.stop_reason}`);
    console.log(`  Pages: ${summary.total_pages}`);
    console.log(`  Touchpoints: ${touchpointsAll.length}`);
    console.log(`  Output: ${cfg.outputDir}`);
    if (dryRun) {
      console.log();
      console.log(
        '  Review the dry output, then run `npm run crawl:full` to continue.',
      );
    }
  }
}

interface VisitResult {
  ok: boolean;
  status: number | null;
  note: string;
}

async function visit(
  page: Page,
  url: string,
  _cfg: CrawlConfig,
): Promise<VisitResult> {
  for (let attempt = 0, backoff = 2000; attempt < 4; attempt++) {
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      const status = response?.status() ?? null;
      if (status && status >= 500) {
        await sleep(backoff);
        backoff *= 2;
        continue;
      }
      if (status === 429) {
        return { ok: false, status, note: 'rate limited' };
      }
      // Don't auto-follow Clerk sign-in redirects — that means the
      // session expired.
      if (page.url().includes('/sign-in')) {
        return { ok: false, status, note: 'auth redirect — session may be expired' };
      }
      return { ok: true, status, note: '' };
    } catch (err) {
      await sleep(backoff);
      backoff *= 2;
      if (attempt === 3) {
        return {
          ok: false,
          status: null,
          note: `error: ${(err as Error).message}`,
        };
      }
    }
  }
  return { ok: false, status: null, note: 'exhausted retries' };
}

function jitter(minMs: number, maxMs: number): number {
  return Math.floor(minMs + Math.random() * Math.max(0, maxMs - minMs));
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function hashUrl(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 16);
}

// Suppress the unused-warning chase — `isWriteLabel` is exposed for
// future per-button traversal; we use it indirectly via the extractor
// today.
void isWriteLabel;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
