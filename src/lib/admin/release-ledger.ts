import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface ReleaseRecordView {
  slug: string;
  sourcePath: string;
  title: string;
  releaseId: string;
  status: string;
  summary: string;
  layerImpact: string[];
  clientApplicability: string[];
  changesIncluded: string[];
  qaValidation: string[];
  rolloutPlan: string;
  rollbackPlan: string;
  auditEvidence: string[];
  knownGaps: string;
  lanes: string[];
  dateLabel: string;
}

export interface ReleaseLedgerView {
  records: ReleaseRecordView[];
  total: number;
  released: number;
  candidates: number;
  drafts: number;
  rolledBack: number;
  latest: ReleaseRecordView | null;
  laneCounts: Array<{ lane: string; count: number }>;
}

const RECORDS_DIR = join(process.cwd(), 'docs/releases/records');

function sectionBody(markdown: string, section: string): string {
  const lines = markdown.split('\n');
  const heading = `## ${section}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) return '';

  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break;
    body.push(line);
  }

  return body.join('\n').trim();
}

function stripMarkdown(value: string): string {
  return sanitizeTenantNames(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeTenantNames(value: string): string {
  return value
    .replace(/\bgeneric tenant\b/gi, 'general workspace')
    .replace(/\bsample client\b/gi, 'sample workspace')
    .replace(/\bdemo tenant\b/gi, 'sample workspace')
    .replace(/\bApex\s+retail-v1\b/gi, 'retail overlay')
    .replace(/\bApex Retail Group\b/gi, 'a canonical retail tenant')
    .replace(/\bApex Retail\b/gi, 'a canonical retail tenant')
    .replace(/\bapex-retail\b/gi, 'a canonical retail tenant')
    .replace(/\bapexretail\b/gi, 'a canonical retail tenant')
    .replace(/\bApex\b/gi, 'a canonical retail tenant')
    .replace(/\bretail-v1\b/gi, 'retail overlay')
    .replace(/\bMeridian Health System\b/gi, 'a canonical healthcare tenant')
    .replace(/\bMeridian Health\b/gi, 'a canonical healthcare tenant')
    .replace(/\bmeridian-health\b/gi, 'a canonical healthcare tenant')
    .replace(/\bmeridian\b/gi, 'a canonical healthcare tenant')
    .replace(/\bFirst Capital Financial\b/gi, 'a canonical financial-services tenant')
    .replace(/\bFirst Capital\b/gi, 'a canonical financial-services tenant')
    .replace(/\bfirst-capital\b/gi, 'a canonical financial-services tenant')
    .replace(/\bfirstcapital\b/gi, 'a canonical financial-services tenant')
    .replace(new RegExp('\\bNorthstar\\s+Clinical\\s+Technologies\\b', 'gi'), 'a canonical clinical-technology tenant')
    .replace(/\bNorthstar\b/gi, 'a canonical clinical-technology tenant')
    .replace(/\bnorthstar-clinical\b/gi, 'a canonical clinical-technology tenant')
    .replace(/\bnorthstar\b/gi, 'a canonical clinical-technology tenant')
    .replace(/\bSkyHarbor Air\b/gi, 'a canonical airline tenant')
    .replace(/\bSkyHarbor Airlines\b/gi, 'a canonical airline tenant')
    .replace(/\bSkyHarbor\b/gi, 'a canonical airline tenant')
    .replace(/\bskyharbor-air\b/gi, 'a canonical airline tenant')
    .replace(/\bskyharbor\b/gi, 'a canonical airline tenant')
    .replace(/\bArcturus Financial Group\b/gi, 'a legacy financial-services workspace')
    .replace(/\bArcturus Financial\b/gi, 'a legacy financial-services workspace')
    .replace(/\bArcturus\b/gi, 'a legacy financial-services workspace')
    .replace(/\bBrindlemark Financial Group\b/gi, 'a legacy financial-services workspace')
    .replace(/\bBrindlemark Financial\b/gi, 'a legacy financial-services workspace')
    .replace(/\bBrindlemark\b/gi, 'a legacy financial-services workspace')
    .replace(new RegExp('\\bHeliara\\s+Health\\s+System\\b', 'gi'), 'a legacy healthcare workspace')
    .replace(new RegExp('\\bHeliara\\s+Health\\b', 'gi'), 'a legacy healthcare workspace')
    .replace(new RegExp('\\bHeliara\\b', 'gi'), 'a legacy healthcare workspace')
    .replace(/\bKeystone Energy Group\b/gi, 'a legacy energy workspace')
    .replace(/\bKeystone Energy\b/gi, 'a legacy energy workspace')
    .replace(/\bKeystone\b/gi, 'a legacy energy workspace');
}

function paragraph(value: string): string {
  return stripMarkdown(
    value
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .join(' '),
  );
}

function listItems(value: string): string[] {
  return value
    .split('\n')
    .map((line) => stripMarkdown(line.replace(/^\s*[-*]\s+/, '')))
    .filter(Boolean);
}

function firstCodeOrText(value: string): string {
  const codeMatch = value.match(/`([^`]+)`/);
  if (codeMatch) return codeMatch[1].trim();
  return stripMarkdown(value.split('\n').find((line) => line.trim()) ?? '');
}

function extractLanes(layerImpact: string[]): string[] {
  const lanes = new Set<string>();
  for (const line of layerImpact) {
    for (const match of line.matchAll(/\b([a-z][a-z0-9-]*-lane)\b/g)) {
      lanes.add(match[1]);
    }
  }
  return Array.from(lanes).sort();
}

function dateLabelFromSlug(slug: string): string {
  const match = slug.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return 'Undated';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function parseReleaseRecord(fileName: string, markdown: string): ReleaseRecordView {
  const slug = fileName.replace(/\.md$/, '');
  const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const layerImpact = listItems(sectionBody(markdown, 'Layer Impact'));
  const releaseId = firstCodeOrText(sectionBody(markdown, 'Release ID')) || slug;

  return {
    slug,
    sourcePath: `docs/releases/records/${fileName}`,
    title: stripMarkdown(h1 ?? releaseId),
    releaseId,
    status: firstCodeOrText(sectionBody(markdown, 'Status')) || 'unknown',
    summary: paragraph(sectionBody(markdown, 'Plain-English Summary')),
    layerImpact,
    clientApplicability: listItems(sectionBody(markdown, 'Client Applicability')),
    changesIncluded: listItems(sectionBody(markdown, 'Changes Included')),
    qaValidation: listItems(sectionBody(markdown, 'QA / Validation')),
    rolloutPlan: paragraph(sectionBody(markdown, 'Rollout Plan')),
    rollbackPlan: paragraph(sectionBody(markdown, 'Rollback Plan')),
    auditEvidence: listItems(sectionBody(markdown, 'Audit Evidence')),
    knownGaps: paragraph(sectionBody(markdown, 'Known Gaps')),
    lanes: extractLanes(layerImpact),
    dateLabel: dateLabelFromSlug(slug),
  };
}

export function buildReleaseLedgerView(recordsDir = RECORDS_DIR): ReleaseLedgerView {
  if (!existsSync(recordsDir)) {
    return {
      records: [],
      total: 0,
      released: 0,
      candidates: 0,
      drafts: 0,
      rolledBack: 0,
      latest: null,
      laneCounts: [],
    };
  }

  const records = readdirSync(recordsDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) =>
      parseReleaseRecord(fileName, readFileSync(join(recordsDir, fileName), 'utf8')),
    )
    .sort((a, b) => b.slug.localeCompare(a.slug));

  const laneCountMap = new Map<string, number>();
  for (const record of records) {
    for (const lane of record.lanes) {
      laneCountMap.set(lane, (laneCountMap.get(lane) ?? 0) + 1);
    }
  }

  const statusCount = (status: string) =>
    records.filter((record) => record.status.toLowerCase() === status).length;

  return {
    records,
    total: records.length,
    released: statusCount('released'),
    candidates: statusCount('candidate'),
    drafts: statusCount('draft'),
    rolledBack: statusCount('rolled-back'),
    latest: records[0] ?? null,
    laneCounts: Array.from(laneCountMap, ([lane, count]) => ({ lane, count })).sort((a, b) =>
      b.count === a.count ? a.lane.localeCompare(b.lane) : b.count - a.count,
    ),
  };
}
