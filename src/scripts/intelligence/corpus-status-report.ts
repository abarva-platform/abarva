import { existsSync, statSync } from 'fs';
import { join } from 'path';

import manifestJson from '@/lib/intelligence/generated/pattern-manifest.json';
import { corpus as loadedCorpus } from '@/lib/intelligence/loader';
import type { LoadedCorpus } from '@/lib/intelligence/types';

interface PatternManifestEntry {
  id: string;
  slug: string;
  sourceFile?: string | null;
}

interface PatternManifestPayload {
  generatedAt: string;
  sourceDir: string;
  patternCount: number;
  patterns: PatternManifestEntry[];
}

interface FileStatus {
  exists: boolean;
  mtimeMs?: number;
  mtime?: string;
}

export interface CorpusStatusWarning {
  code: string;
  message: string;
  count?: number;
  examples?: string[];
}

export interface CorpusStatusReport {
  generatedAt: string;
  counts: {
    patterns: number;
    signals: number;
    solutions: number;
    contradictions: number;
    total: number;
  };
  sourcing: {
    patternCount: number;
    percentOfPatterns: number;
  };
  generatedManifest: {
    generatedAt: string;
    sourceDir: string;
    declaredPatternCount: number;
    actualPatternCount: number;
  };
  slugIdOverlap: {
    corpusPatternCount: number;
    manifestPatternCount: number;
    exactIdMatches: number;
    slugMatches: number;
    normalizedManifestIdToCorpusSlugMatches: number;
    manifestOnlySlugs: string[];
    corpusOnlySlugsSample: string[];
  };
  staleCopyWarnings: CorpusStatusWarning[];
}

export interface CorpusStatusReportOptions {
  corpus?: LoadedCorpus;
  manifest?: PatternManifestPayload;
  cwd?: string;
  generatedAt?: string;
  statFile?: (path: string) => FileStatus;
}

const DEFAULT_CWD = process.cwd();
const DEFAULT_MANIFEST = manifestJson as PatternManifestPayload;

function defaultStatFile(path: string): FileStatus {
  if (!existsSync(path)) {
    return { exists: false };
  }

  const stats = statSync(path);
  return {
    exists: true,
    mtimeMs: stats.mtimeMs,
    mtime: stats.mtime.toISOString(),
  };
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/^pattern[-_]/, '').replace(/_/g, '-');
}

function roundPercent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function sample(values: string[], limit = 12): string[] {
  return values.slice(0, limit);
}

function resolveManifestSourcePath(cwd: string, sourceFile: string): string {
  return join(cwd, 'docs', 'source-material', 'intelligence-pack', sourceFile);
}

function buildStaleCopyWarnings(
  corpus: LoadedCorpus,
  manifest: PatternManifestPayload,
  cwd: string,
  statFile: (path: string) => FileStatus,
): CorpusStatusWarning[] {
  const warnings: CorpusStatusWarning[] = [];

  if (manifest.patternCount !== manifest.patterns.length) {
    warnings.push({
      code: 'manifest-count-mismatch',
      message: 'Generated manifest patternCount does not match the manifest patterns array length.',
      count: manifest.patterns.length,
    });
  }

  const manifestGeneratedMs = Date.parse(manifest.generatedAt);
  if (Number.isFinite(manifestGeneratedMs)) {
    const staleManifestSources = uniqueSorted(
      manifest.patterns
        .map((pattern) => pattern.sourceFile)
        .filter((sourceFile): sourceFile is string => Boolean(sourceFile))
        .filter((sourceFile) => {
          const status = statFile(resolveManifestSourcePath(cwd, sourceFile));
          return status.exists && typeof status.mtimeMs === 'number' && status.mtimeMs > manifestGeneratedMs;
        }),
    );

    if (staleManifestSources.length > 0) {
      warnings.push({
        code: 'manifest-source-newer-than-generated-copy',
        message: 'One or more manifest source files are newer than the generated manifest timestamp.',
        count: staleManifestSources.length,
        examples: sample(staleManifestSources),
      });
    }
  }

  const missingCorpusSources = uniqueSorted(
    corpus.patterns
      .flatMap((pattern) => pattern.sourceDocuments)
      .filter((sourceDocument) => sourceDocument.startsWith('docs/'))
      .filter((sourceDocument) => !statFile(join(cwd, sourceDocument)).exists),
  );

  if (missingCorpusSources.length > 0) {
    warnings.push({
      code: 'missing-corpus-source-document-copy',
      message: 'One or more corpus sourceDocuments point at docs/ paths that are not present in this checkout.',
      count: missingCorpusSources.length,
      examples: sample(missingCorpusSources),
    });
  }

  return warnings;
}

export function buildCorpusStatusReport(options: CorpusStatusReportOptions = {}): CorpusStatusReport {
  const corpus = options.corpus ?? loadedCorpus;
  const manifest = options.manifest ?? DEFAULT_MANIFEST;
  const cwd = options.cwd ?? DEFAULT_CWD;
  const statFile = options.statFile ?? defaultStatFile;
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const counts = {
    patterns: corpus.patterns.length,
    signals: corpus.signals.length,
    solutions: corpus.solutions.length,
    contradictions: corpus.contradictions.length,
    total: corpus.patterns.length + corpus.signals.length + corpus.solutions.length + corpus.contradictions.length,
  };

  const sourcingPatternCount = corpus.patterns.filter((pattern) => pattern.domain === 'sourcing').length;
  const corpusPatternIds = new Set(corpus.patterns.map((pattern) => pattern.id));
  const corpusSlugs = new Set(corpus.patterns.map((pattern) => normalizeKey(pattern.slug)));
  const manifestSlugs = new Set(manifest.patterns.map((pattern) => normalizeKey(pattern.slug)));
  const normalizedManifestIds = new Set(manifest.patterns.map((pattern) => normalizeKey(pattern.id)));
  const manifestOnlySlugs = uniqueSorted(
    manifest.patterns
      .map((pattern) => pattern.slug)
      .filter((slug) => !corpusSlugs.has(normalizeKey(slug))),
  );
  const corpusOnlySlugs = uniqueSorted(
    corpus.patterns
      .map((pattern) => pattern.slug)
      .filter((slug) => !manifestSlugs.has(normalizeKey(slug)) && !normalizedManifestIds.has(normalizeKey(slug))),
  );

  return {
    generatedAt,
    counts,
    sourcing: {
      patternCount: sourcingPatternCount,
      percentOfPatterns: roundPercent(sourcingPatternCount, counts.patterns),
    },
    generatedManifest: {
      generatedAt: manifest.generatedAt,
      sourceDir: manifest.sourceDir,
      declaredPatternCount: manifest.patternCount,
      actualPatternCount: manifest.patterns.length,
    },
    slugIdOverlap: {
      corpusPatternCount: corpus.patterns.length,
      manifestPatternCount: manifest.patterns.length,
      exactIdMatches: manifest.patterns.filter((pattern) => corpusPatternIds.has(pattern.id)).length,
      slugMatches: manifest.patterns.filter((pattern) => corpusSlugs.has(normalizeKey(pattern.slug))).length,
      normalizedManifestIdToCorpusSlugMatches: manifest.patterns.filter((pattern) => corpusSlugs.has(normalizeKey(pattern.id))).length,
      manifestOnlySlugs,
      corpusOnlySlugsSample: sample(corpusOnlySlugs),
    },
    staleCopyWarnings: buildStaleCopyWarnings(corpus, manifest, cwd, statFile),
  };
}

export function printCorpusStatusReport(): void {
  console.log(JSON.stringify(buildCorpusStatusReport(), null, 2));
}

if (require.main === module) {
  printCorpusStatusReport();
}
