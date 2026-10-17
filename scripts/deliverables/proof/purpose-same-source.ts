/** Offline renderer comparison: frozen reviewed narrative, not a model-generation acceptance. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { createHash } from "node:crypto";
import { Packer } from "docx";
import { renderDeliverableDocx } from "@/lib/deliverables/orchestrator/renderers";
import {
  renderPurposeDeck,
  purposeDensity,
} from "@/lib/deliverables/orchestrator/purpose-page-renderer";
import {
  planPurposePages,
  type PurposeChart,
} from "@/lib/deliverables/orchestrator/purpose-page-plan";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";

async function main() {
  const [packageArg, storyArg, outArg] = process.argv.slice(2);
  if (!packageArg || !storyArg || !outArg)
    throw new Error(
      "Pass source package, reviewed storyline JSON, and external output directory.",
    );
  const root = resolve(packageArg),
    out = resolve(outArg);
  if (out === process.cwd() || out.startsWith(`${process.cwd()}/`))
    throw new Error("Keep proof artifacts outside the public repository.");
  const manifest = JSON.parse(
    readFileSync(join(root, "Evidence_Manifest.json"), "utf8"),
  );
  const sources = manifest.sources.map(
    (source: { id: string; file: string; sha256: string }) => {
      if (basename(source.file) !== source.file)
        throw new Error("Source path must be a package-local filename.");
      const actual = createHash("sha256")
        .update(readFileSync(join(root, "Sources", source.file)))
        .digest("hex");
      if (actual !== source.sha256)
        throw new Error(`Source hash mismatch: ${source.id}`);
      return { id: source.id, sha256: actual };
    },
  );
  const story: {
    basis: string;
    charter: RenderableDeliverable;
    discovery: RenderableDeliverable;
    charts: PurposeChart[];
  } = JSON.parse(readFileSync(resolve(storyArg), "utf8"));
  if (story.basis !== "frozen-reviewed-storyline")
    throw new Error("Declare the benchmark's frozen narrative basis.");
  const allowed = new Set(sources.map((s: { id: string }) => s.id));
  for (const doc of [story.charter, story.discovery])
    for (const ref of doc.sourceRegister) {
      if (!ref.referenceId || !allowed.has(ref.referenceId))
        throw new Error("Every reference must name a declared source.");
    }
  if (
    story.charter.sourceRegister.some(
      (source) =>
        !manifest.sources.find(
          (s: { id: string; phase: string }) =>
            s.id === source.referenceId && /^P[01]\b/.test(s.phase),
        ),
    )
  )
    throw new Error("Later evidence cannot backfill the Charter.");
  mkdirSync(out, { recursive: true });
  const deck = await renderPurposeDeck(story.discovery, story.charts);
  writeFileSync(join(out, "P2-Discovery.pptx"), deck);
  writeFileSync(
    join(out, "P1-Charter.docx"),
    await Packer.toBuffer(renderDeliverableDocx(story.charter)),
  );
  const pages = planPurposePages(story.discovery, story.charts);
  writeFileSync(
    join(out, "comparison-proof.json"),
    JSON.stringify(
      {
        basis:
          "Same source files and frozen reviewed narrative through product export code. No model call, database load, gate approval or fresh live generation.",
        sourceHashes: sources,
        charterSourceIds: story.charter.sourceRegister.map(
          (source) => source.referenceId,
        ),
        pages: pages.map((page, i) => ({
          index: i + 1,
          id: page.id,
          family: page.family,
          title: page.title,
          density: purposeDensity(page),
        })),
        physicalInspection: await inspectDeck(deck),
        pixelOccupancy:
          "Requires rendered-page assessment; not inferred from shape rectangles.",
        humanVisualAcceptance: "pending",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ sourceFiles: sources.length, slides: pages.length, out }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
