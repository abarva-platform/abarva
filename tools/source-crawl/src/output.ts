// Stream-style writers for the crawl outputs. We append as we go so a
// crash mid-crawl still leaves a usable partial snapshot. CSV escaping
// is intentionally minimal — we control the data shape, so any
// embedded comma / newline gets quoted with doubled-quote escaping.

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AgentTouchpoint,
  CanaryCandidate,
  CrawlSummary,
  SnapshotRow,
  UrlInventoryRow,
} from './types.js';

export class CrawlOutput {
  private touchpoints: AgentTouchpoint[] = [];
  private candidates: CanaryCandidate[] = [];

  constructor(
    private readonly outputDir: string,
    private readonly vaultDir: string,
    private readonly screenshotDir: string,
  ) {
    mkdirSync(outputDir, { recursive: true });
    mkdirSync(screenshotDir, { recursive: true });
    mkdirSync(join(vaultDir, 'raw_html'), { recursive: true, mode: 0o700 });
    mkdirSync(join(vaultDir, 'screenshots_full'), {
      recursive: true,
      mode: 0o700,
    });

    // Reset URL inventory header on each run.
    writeFileSync(
      this.urlInventoryPath,
      'url,status,entity_type,depth,parent,captured_at,bytes,notes\n',
    );
    // Truncate the JSONL so this run starts clean. Old runs are
    // overwritten by design — a crawl is meant to be reproducible.
    writeFileSync(this.snapshotPath, '');
  }

  get snapshotPath(): string {
    return join(this.outputDir, 'snapshot.jsonl');
  }
  get urlInventoryPath(): string {
    return join(this.outputDir, 'url_inventory.csv');
  }
  get crawlSummaryPath(): string {
    return join(this.outputDir, 'crawl_summary.json');
  }
  get touchpointIndexPath(): string {
    return join(this.outputDir, 'agent_touchpoint_index.json');
  }
  get canaryCandidatesPath(): string {
    return join(this.outputDir, 'canary_candidates.json');
  }

  appendSnapshot(row: SnapshotRow): void {
    appendFileSync(this.snapshotPath, JSON.stringify(row) + '\n');
  }

  appendUrlInventory(row: UrlInventoryRow): void {
    const cells = [
      row.url,
      row.status?.toString() ?? '',
      row.entity_type,
      row.depth.toString(),
      row.parent ?? '',
      row.captured_at,
      row.bytes?.toString() ?? '',
      row.notes,
    ].map(csvEscape);
    appendFileSync(this.urlInventoryPath, cells.join(',') + '\n');
  }

  recordTouchpoint(touchpoint: AgentTouchpoint): void {
    // Dedupe by id — one touchpoint per (url, control_label).
    const existing = this.touchpoints.findIndex((t) => t.id === touchpoint.id);
    if (existing >= 0) {
      this.touchpoints[existing] = touchpoint;
    } else {
      this.touchpoints.push(touchpoint);
    }
  }

  recordCandidate(candidate: CanaryCandidate): void {
    this.candidates.push(candidate);
  }

  rawHtmlPath(pageId: string): string {
    return join(this.vaultDir, 'raw_html', `${pageId}.html`);
  }

  screenshotPath(pageId: string): string {
    return join(this.screenshotDir, `${pageId}.png`);
  }

  finalize(summary: CrawlSummary): void {
    writeFileSync(this.crawlSummaryPath, JSON.stringify(summary, null, 2));
    writeFileSync(
      this.touchpointIndexPath,
      JSON.stringify(this.touchpoints, null, 2),
    );
    writeFileSync(
      this.canaryCandidatesPath,
      JSON.stringify(this.candidates, null, 2),
    );
  }
}

function csvEscape(cell: string): string {
  if (/[,"\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}
