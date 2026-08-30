#!/usr/bin/env node
/**
 * Proves the promotion gates refuse, by running the real script against fixture plan runs in a
 * throwaway root. The builder-vocabulary gate especially has to be observed failing: it is the one
 * that makes the raw-language check cover what ships rather than what a stale snapshot happens to
 * say, and a gate never seen failing is not a gate.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SCRIPT = path.resolve(import.meta.dirname, "../promote-golden-snapshots.mjs");
let failures = 0;

function assert(condition, message) {
  if (condition) { console.log(`  ok   ${message}`); return; }
  console.error(`  FAIL ${message}`);
  failures += 1;
}

function chapter(index, statement) {
  return {
    chapterId: `chapter_${index}`,
    headline: `Chapter ${index} headline`,
    executive_synthesis: statement,
    key_insights: [{ statement: `Insight ${index} stands on cited evidence.` }],
    tensions: [],
    what_to_watch: [],
    limitations: [`Limitation ${index}`],
  };
}

/** Builds a temp root with one active tenant and one plan run, and returns the run's output. */
function runPromotion(synthesisStatement) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "promote-gate-"));
  const planDir = path.join(root, "plan");
  fs.mkdirSync(planDir, { recursive: true });
  fs.mkdirSync(path.join(root, "src/lib/home/preview/golden-snapshots"), { recursive: true });
  fs.mkdirSync(path.join(root, "datasets/tenant-inputs"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "datasets/tenant-inputs/tenant-input-registry.json"),
    JSON.stringify({ activeTenants: [{ tenantKey: "fixture-tenant" }] }),
  );

  const signalPacket = { fixture: true };
  const plan = {
    tenantKey: "fixture-tenant",
    chapters: Array.from({ length: 8 }, (_, i) => chapter(i + 1, i === 0 ? synthesisStatement : `Chapter ${i + 1} reads cleanly.`)),
    provenance: {
      generated_at: "2026-08-30T00:00:00.000Z",
      canonical_snapshot_hash: crypto.createHash("sha256").update(JSON.stringify(signalPacket)).digest("hex"),
    },
    thesisResult: { signalPacket, publishedGeneration: {}, verificationLedger: [], structuralIssues: [] },
    technologyEstate: { recordTypes: [] },
  };
  fs.writeFileSync(path.join(planDir, "fixture-tenant-home-chapters.json"), JSON.stringify(plan));

  try {
    const stdout = execFileSync("node", [SCRIPT, "--plan-dir", planDir], { cwd: root, encoding: "utf8" });
    return { code: 0, output: stdout };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log("promote-golden-snapshots gates");

const clean = runPromotion("Margin exposure concentrates in one funded priority, and the board decision is overdue.");
assert(clean.code === 0, "a clean plan run promotes");
assert(/1 to promote, 0 refused/.test(clean.output), "clean run reports nothing refused");
assert(/builder vocabulary 0 \(gate passed\)/.test(clean.output), "clean run reports the builder-vocabulary gate passing");

// The planted failure. "adapter" has no laundering rule in the renderer, so this is precisely the
// wording that would reach a reader untouched if promotion did not refuse it.
const poisoned = runPromotion("The adapter re-ran after the projection was rebuilt, so the schema now matches.");
assert(poisoned.code === 1, "a plan run carrying builder vocabulary is refused");
assert(/REFUSED/.test(poisoned.output), "refusal is reported, not warned");
assert(/builder vocabulary/.test(poisoned.output), "the refusal names the builder-vocabulary gate");
assert(/adapter/.test(poisoned.output), "the refusal quotes the offending statement");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
