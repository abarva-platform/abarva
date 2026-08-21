#!/usr/bin/env node
/**
 * Promotes a reviewed chapters plan-run into the checked-in golden snapshots.
 *
 * Promotion is deliberately a separate step from generation. The preview route reads these files
 * and never generates, so whatever lands here is what a reader will be shown as the current
 * reading of the record -- which is exactly why it should not happen as a side effect of a build.
 *
 * The gates below refuse rather than warn. A snapshot that is promoted with a stale hash, a
 * missing chapter or an empty absence band is worse than no promotion, because the page carries no
 * visible sign that anything is wrong: it renders confidently either way.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const planDir = process.argv[process.argv.indexOf("--plan-dir") + 1];
const SNAPSHOT_DIR = path.join(ROOT, "src/lib/home/preview/golden-snapshots");
const EXPECTED_CHAPTERS = 8;

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const activeKeys = (registry.activeTenants ?? []).map((t) => t.tenantKey);

let refused = 0, promoted = 0;
const summary = [];

for (const tenantKey of activeKeys) {
  const planFile = path.join(planDir, `${tenantKey}-home-chapters.json`);
  const snapFile = path.join(SNAPSHOT_DIR, `${tenantKey}.json`);
  const fail = (reason) => { console.error(`  REFUSED  ${tenantKey}: ${reason}`); refused += 1; };

  if (!fs.existsSync(planFile)) { fail(`no plan output at ${path.relative(ROOT, planFile)}`); continue; }
  const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));

  if (!plan.chapters) { fail("plan run produced no chapters -- the thesis behind it failed"); continue; }
  if (plan.chapters.length !== EXPECTED_CHAPTERS) { fail(`${plan.chapters.length} chapters, expected ${EXPECTED_CHAPTERS}`); continue; }
  if (!plan.provenance) { fail("no provenance block"); continue; }

  // The hash must be derived from the packet this run actually read, not carried over.
  const recomputed = crypto.createHash("sha256").update(JSON.stringify(plan.thesisResult.signalPacket)).digest("hex");
  if (recomputed !== plan.provenance.canonical_snapshot_hash) {
    fail("provenance hash does not match its own signal packet"); continue;
  }

  const prior = fs.existsSync(snapFile) ? JSON.parse(fs.readFileSync(snapFile, "utf8")) : null;
  if (prior && prior.provenance?.canonical_snapshot_hash === recomputed) {
    console.log(`  SKIP     ${tenantKey}: canonical hash unchanged, nothing to promote`);
    continue;
  }

  // Absence is a rendered band: a chapter with no limitations reads as "nothing is missing", which
  // is a claim, and one that has been wrong every time it was made by omission.
  //
  // The gate is no-regression rather than zero-tolerance. Requiring every chapter to carry a
  // limitation would demand something this pipeline has never produced -- gaps are assigned from
  // recorded evidence gaps, and some chapters genuinely have none to assign -- so an absolute rule
  // would block a strictly better snapshot than the one already live. What must not happen is
  // promoting a snapshot that says LESS about what is missing than the one it replaces.
  const emptyNow = plan.chapters.filter((c) => !(c.limitations ?? []).length).length;
  const totalNow = plan.chapters.reduce((n, c) => n + (c.limitations ?? []).length, 0);
  if (prior) {
    const emptyBefore = prior.chapters.filter((c) => !(c.limitations ?? []).length).length;
    const totalBefore = prior.chapters.reduce((n, c) => n + (c.limitations ?? []).length, 0);
    if (emptyNow > emptyBefore || totalNow < totalBefore) {
      fail(`absence coverage regressed: ${emptyBefore} -> ${emptyNow} chapters with no limitations, ${totalBefore} -> ${totalNow} total`);
      continue;
    }
  } else if (!totalNow) {
    fail("no chapter records any limitation, and there is no prior snapshot to compare against");
    continue;
  }
  const emptyHeadline = plan.chapters.filter((c) => !String(c.headline ?? "").trim());
  if (emptyHeadline.length) { fail(`${emptyHeadline.length} chapters have no headline`); continue; }

  const bundle = {
    tenantKey: plan.tenantKey,
    provenance: plan.provenance,
    chapters: plan.chapters,
    thesis: {
      signalPacket: plan.thesisResult.signalPacket,
      publishedGeneration: plan.thesisResult.publishedGeneration,
      verificationLedger: plan.thesisResult.verificationLedger,
      structuralIssues: plan.thesisResult.structuralIssues,
    },
    technologyEstate: plan.technologyEstate,
  };

  const recordCount = (bundle.technologyEstate?.recordTypes ?? []).reduce((n, r) => n + (Array.isArray(r.rows) ? r.rows.length : (r.rows ?? 0)), 0);
  summary.push({
    tenantKey,
    priorHash: prior?.provenance?.canonical_snapshot_hash?.slice(0, 16) ?? "none",
    newHash: recomputed.slice(0, 16),
    priorGenerated: prior?.provenance?.generated_at?.slice(0, 10) ?? "none",
    newGenerated: bundle.provenance.generated_at?.slice(0, 10),
    chapters: bundle.chapters.length,
    emptyLimitationChapters: emptyNow,
    totalLimitations: totalNow,
    estateRecordTypes: (bundle.technologyEstate?.recordTypes ?? []).length,
    estateRecords: recordCount,
  });

  if (APPLY) {
    fs.writeFileSync(snapFile, JSON.stringify(bundle, null, 2) + "\n", "utf8");
    console.log(`  PROMOTED ${tenantKey} -> ${path.relative(ROOT, snapFile)}`);
  }
  promoted += 1;
}

console.log("");
for (const s of summary) {
  console.log(`${s.tenantKey}`);
  console.log(`   canonical hash  ${s.priorHash} -> ${s.newHash}`);
  console.log(`   generated       ${s.priorGenerated} -> ${s.newGenerated}`);
  console.log(`   chapters ${s.chapters} | limitations ${s.totalLimitations} across ${s.chapters - s.emptyLimitationChapters}/${s.chapters} chapters`);
  console.log(`   estate record types ${s.estateRecordTypes} | estate records ${s.estateRecords}`);
}
console.log(`\n${promoted} to promote, ${refused} refused.`);
if (!APPLY) console.log("(dry run -- pass --apply to write)");
process.exit(refused ? 1 : 0);
