/**
 * One-off, deterministic backfill: routes each golden snapshot's already-verified thesis-level
 * `evidence_gaps` into the chapters they bear on, filling `ChapterView.limitations[]`.
 *
 * Why a backfill rather than a regeneration: the routing is pure -- `assignEvidenceGaps` reads
 * only text already present and approved in the snapshot's own thesis -- so re-running the full
 * chapter build (which makes a model call per chapter) would risk changing verified prose to
 * achieve a change that requires no model at all. Every other field is written back byte-identical.
 *
 * Idempotent: re-running replaces the routed gaps rather than appending them, so `limitations`
 * cannot accumulate duplicates across runs. Limitations the build script derives for other reasons
 * (an empty chapter, the segment-economics note) are preserved.
 */

import fs from "node:fs";
import path from "node:path";

import { assignEvidenceGaps, type ChapterId, type ChapterView } from "./build-home-chapters";

const SNAPSHOT_DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
const APPLY = process.argv.includes("--apply");

for (const file of fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json"))) {
  const filePath = path.join(SNAPSHOT_DIR, file);
  const bundle = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const thesis = bundle.thesis?.publishedGeneration;
  if (!thesis) {
    console.log(`  ! ${file}: no publishedGeneration -- skipped`);
    continue;
  }

  const gaps = assignEvidenceGaps(thesis);
  const allGaps = new Set<string>(thesis.evidence_gaps ?? []);
  let filled = 0;

  for (const chapter of bundle.chapters as ChapterView[]) {
    // Drop any previously-routed gap, keep everything else, then re-route. Order is
    // gaps-first so the chapter's own derived limitations read as the tail, not the lede.
    const derived = (chapter.limitations ?? []).filter((l) => !allGaps.has(l));
    chapter.limitations = [...gaps[chapter.chapterId as ChapterId], ...derived];
    if (gaps[chapter.chapterId as ChapterId].length) filled += 1;
  }

  const routed = new Set(Object.values(gaps).flat());
  const unrouted = [...allGaps].filter((g) => !routed.has(g));
  console.log(
    `  ${file}: ${allGaps.size} gaps -> ${filled}/${bundle.chapters.length} chapters` +
      (unrouted.length ? ` (${unrouted.length} unrouted -- BUG, every gap must land somewhere)` : ""),
  );
  for (const chapter of bundle.chapters as ChapterView[]) {
    console.log(`      ${chapter.chapterId}: ${chapter.limitations.length}`);
  }

  if (APPLY) fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2) + "\n");
}

console.log(APPLY ? "\nWritten." : "\nDry run -- pass --apply to write.");
