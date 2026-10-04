import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validatePackage } from "../validate-moves-adaptive-e2e-kit.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FIXTURE = path.join(REPO_ROOT, "tests/fixtures/moves-adaptive-e2e-kit");
const GOVERNANCE = path.join(
  REPO_ROOT,
  "docs/governance/dataset-manifests/nexus-moves-adaptive-e2e-synthetic-20260927.json",
);

function withMutablePackage(run) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "moves-adaptive-kit-"));
  const packageRoot = path.join(temp, "package");
  const governancePath = path.join(temp, "governance.json");
  fs.cpSync(FIXTURE, packageRoot, { recursive: true });
  fs.copyFileSync(GOVERNANCE, governancePath);
  try {
    run(packageRoot, governancePath);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("validates the reviewed upload boundary, adaptive cases, and reconciled estimate", () => {
  assert.deepEqual(validatePackage(FIXTURE, GOVERNANCE), []);
});

test("rejects adding a future-phase output to primary evidence uploads", () => {
  withMutablePackage((root, governancePath) => {
    const file = path.join(root, "00_demo/upload_manifest.json");
    const manifest = readJson(file);
    manifest.primary_uploads[0].path = "04_p4_roadmap_estimate/roadmap.csv";
    manifest.primary_uploads[0].phase = 4;
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
    assert.match(validatePackage(root, governancePath).join("\n"), /14-file P1\/P2 allowlist/);
  });
});

test("rejects a tenant-pinned dataset manifest", () => {
  withMutablePackage((root, governancePath) => {
    const manifest = readJson(governancePath);
    manifest.client_key = "tenant-from-fixture-name";
    fs.writeFileSync(governancePath, JSON.stringify(manifest));
    assert.match(validatePackage(root, governancePath).join("\n"), /must not pin a tenant identity/);
  });
});

test("rejects workshop or session inputs mislabeled as structured evidence", () => {
  withMutablePackage((root, governancePath) => {
    const file = path.join(root, "00_demo/upload_manifest.json");
    const manifest = readJson(file);
    const workshop = manifest.primary_uploads.find((item) => item.path.includes("operations_workshop"));
    assert.ok(workshop);
    workshop.evidence_type = "uploaded_evidence";
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
    assert.match(validatePackage(root, governancePath).join("\n"), /Upload type should be session_artifact/);
  });
});

test("rejects sponsor approval authority in the P1 decision record", () => {
  withMutablePackage((root, governancePath) => {
    const file = path.join(root, "01_p1_charter/charter_decisions.md");
    const contents = fs.readFileSync(file, "utf8");
    fs.writeFileSync(
      file,
      contents.replace(
        /The listed sponsor is an informational contact[^\n]*/,
        "Sponsor approves scope/funding/phase advancement.",
      ),
    );
    assert.match(validatePackage(root, governancePath).join("\n"), /P1 decision rights must keep sponsors informational/);
  });
});

test("P1 sponsor contact is synthetic, non-deliverable, and progress-only", () => {
  const file = path.join(FIXTURE, "01_p1_charter/charter_decisions.md");
  const contents = fs.readFileSync(file, "utf8");
  assert.match(contents, /Synthetic Member Services Sponsor \(role alias; not a real person\)/);
  assert.match(contents, /member\.services\.sponsor@example\.invalid/);
  assert.match(contents, /no external email delivery in this smoke/i);
  assert.match(contents, /no in-product approval action is assigned to this contact/i);
});

test("rejects sponsor approval authority in the P5 handoff RACI", () => {
  withMutablePackage((root, governancePath) => {
    const file = path.join(root, "05_p5_mobilize/raci.csv");
    const contents = fs.readFileSync(file, "utf8");
    assert.ok(contents.includes("Authorized workspace user records phase decision; sponsor receives progress update only"));
    fs.writeFileSync(
      file,
      contents.replace(
        "Authorized workspace user records phase decision; sponsor receives progress update only",
        "Sponsor approves phase advancement",
      ),
    );
    assert.match(validatePackage(root, governancePath).join("\n"), /P5 approval evidence must not assign an in-product approval to a sponsor/);
  });
});

test("rejects a changed estimate formula result", () => {
  withMutablePackage((root, governancePath) => {
    const file = path.join(root, "04_p4_roadmap_estimate/internal_vs_vendor_estimate.csv");
    const contents = fs.readFileSync(file, "utf8");
    assert.ok(contents.includes(",7040,"));
    fs.writeFileSync(file, contents.replace(",7040,", ",7041,"));
    assert.match(validatePackage(root, governancePath).join("\n"), /base_cost_usd does not match/);
  });
});

test("rejects a summary that no longer reconciles to role rows", () => {
  withMutablePackage((root, governancePath) => {
    const file = path.join(root, "04_p4_roadmap_estimate/estimate_summary.csv");
    const contents = fs.readFileSync(file, "utf8");
    assert.ok(contents.includes(",170708,"));
    fs.writeFileSync(file, contents.replace(",170708,", ",160708,"));
    assert.match(validatePackage(root, governancePath).join("\n"), /vendor summary base_planning_cost_usd/);
  });
});
