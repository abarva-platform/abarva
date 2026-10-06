/**
 * Re-assemble the composer module from the saved batch responses.
 *
 * The code calls are the expensive part of the run; a defect in the deterministic
 * header or the assembler should not cost them again. This re-parses what the
 * model already returned and rebuilds the module.
 */
import fs from "node:fs";
import path from "node:path";
import { parseSlideFunctions } from "@/lib/deliverables/composer/parse-slide-functions";
import { assembleComposerModule } from "@/lib/deliverables/composer/assemble-module";
import { sha256 } from "@/lib/deliverables/composer/presentation-packet";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const LABEL = process.argv[3] ?? "A";
const plan = JSON.parse(fs.readFileSync(path.join(OUT, `slide-story-plan-${LABEL}.json`), "utf8"));

const functions = fs
  .readdirSync(OUT)
  .filter((f) => f.startsWith(`code-raw-${LABEL}-`) && f.endsWith(".txt"))
  .sort((a, b) => Number(a.match(/-(\d+)\.txt$/)![1]) - Number(b.match(/-(\d+)\.txt$/)![1]))
  .flatMap((f) => parseSlideFunctions(fs.readFileSync(path.join(OUT, f), "utf8")).functions);

const assembled = assembleComposerModule(plan.slideStoryPlan, functions, "abarva-v3");
fs.writeFileSync(path.join(OUT, `composer-${LABEL}.py`), assembled.source);
console.log(
  `${functions.length} functions -> ${assembled.source.split("\n").length} lines, sha ${sha256(assembled.source).slice(0, 16)}`,
);
console.log(`missing: ${assembled.missing.join(", ") || "none"} | malformed: ${assembled.malformed.join(", ") || "none"} | extra: ${assembled.extra.join(", ") || "none"}`);
