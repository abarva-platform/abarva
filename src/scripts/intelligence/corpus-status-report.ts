import fs from "node:fs";
import path from "node:path";

import { corpus, loadCorpus } from "@/lib/intelligence";
import type { LoadedCorpus } from "@/lib/intelligence/types";

interface ManifestPattern {
  id: string;
  slug?: string;
  sourceFile?: string;
}

interface CorpusStatusManifest {
  generatedAt: string;
  sourceDir: string;
  patternCount: number;
  patterns: ManifestPattern[];
}

interface StatResult {
  exists: boolean;
  mtimeMs?: number;
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function defaultStatFile(filePath: string): StatResult {
  try {
    const stat = fs.statSync(filePath);
    return { exists: true, mtimeMs: stat.mtimeMs };
  } catch {
    return { exists: false };
  }
}

function loadGeneratedManifest(): CorpusStatusManifest {
  const manifestPath = path.join(
    process.cwd(),
    "src/lib/intelligence/generated/pattern-manifest.json",
  );
  if (!fs.existsSync(manifestPath)) {
    return {
      generatedAt: new Date(0).toISOString(),
      sourceDir: "intelligence-pack",
      patternCount: 0,
      patterns: [],
    };
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as CorpusStatusManifest;
}

export function buildCorpusStatusReport(args: {
  corpus?: LoadedCorpus;
  generatedAt?: string;
  manifest?: CorpusStatusManifest;
  statFile?: (path: string) => StatResult;
} = {}) {
  const loaded = args.corpus ?? corpus;
  const manifest = args.manifest ?? loadGeneratedManifest();
  const statFile = args.statFile ?? defaultStatFile;
  const generatedManifestAt = Date.parse(manifest.generatedAt);
  const manifestPatterns = manifest.patterns ?? [];
  const corpusSlugs = new Set(loaded.patterns.map((pattern) => normalizeId(pattern.slug ?? pattern.id)));
  const manifestIds = new Set(manifestPatterns.map((pattern) => normalizeId(pattern.id)));
  const manifestSlugs = new Set(
    manifestPatterns.map((pattern) => normalizeId(pattern.slug ?? pattern.id)),
  );

  const staleCopyWarnings: Array<{ code: string; path: string }> = [];
  for (const pattern of manifestPatterns) {
    if (!pattern.sourceFile) continue;
    const sourcePath = path.join("docs/source-material", manifest.sourceDir, pattern.sourceFile);
    const stat = statFile(sourcePath);
    if (
      stat.exists &&
      typeof stat.mtimeMs === "number" &&
      stat.mtimeMs > generatedManifestAt
    ) {
      staleCopyWarnings.push({
        code: "manifest-source-newer-than-generated-copy",
        path: sourcePath,
      });
    }
  }
  for (const pattern of loaded.patterns) {
    for (const sourceDocument of pattern.sourceDocuments ?? []) {
      if (!statFile(sourceDocument).exists) {
        staleCopyWarnings.push({
          code: "missing-corpus-source-document-copy",
          path: sourceDocument,
        });
      }
    }
  }

  const slugMatches = loaded.patterns.filter((pattern) =>
    manifestSlugs.has(normalizeId(pattern.slug ?? pattern.id)),
  ).length;
  const normalizedManifestIdToCorpusSlugMatches = [...manifestIds].filter((id) =>
    corpusSlugs.has(id.replace(/^pattern-/, "")),
  ).length;

  return {
    counts: {
      patterns: loaded.patterns.length,
      signals: loaded.signals.length,
      solutions: loaded.solutions.length,
      contradictions: loaded.contradictions.length,
      total:
        loaded.patterns.length +
        loaded.signals.length +
        loaded.solutions.length +
        loaded.contradictions.length,
    },
    sourcing: {
      patternCount: loaded.patterns.filter((pattern) => pattern.domain === "sourcing").length,
    },
    generatedManifest: {
      actualPatternCount: manifestPatterns.length,
      declaredPatternCount: manifest.patternCount,
      generatedAt: manifest.generatedAt,
    },
    slugIdOverlap: {
      slugMatches,
      normalizedManifestIdToCorpusSlugMatches,
    },
    staleCopyWarnings,
  };
}

export { loadCorpus };
