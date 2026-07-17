import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports/candidate-invisibility-guard");

const runtimeFiles = [
  "src/lib/home/v7-context-browser.ts",
  "src/app/(maestro)/home/page.tsx",
  "src/lib/home/know/v7-home-ask.ts",
  "src/lib/intelligence/ask/retrievers/v7-dossier.ts",
  "src/lib/tower/v7-tower-projection.ts",
  "src/components/home/HomeSurface.tsx",
];

const tests = [
  {
    id: "default-active-pointer-home-browser",
    file: "src/lib/home/v7-context-browser.ts",
    check: (text) =>
      text.includes("join intelligence_v7.active_tenant_contract_versions active") &&
      text.includes("active.active_contract_version = run.contract_version") &&
      text.includes("active.promotion_status = 'active'"),
    evidence: "Home V7 default query joins active_tenant_contract_versions.",
  },
  {
    id: "default-home-route-no-preview-unless-flagged",
    file: "src/app/(maestro)/home/page.tsx",
    check: (text) =>
      text.includes("candidatePreviewEnabled") &&
      text.includes('mode: candidatePreviewEnabled ? "candidate_preview" : "active"'),
    evidence: "Home route defaults to active mode and only enters candidate preview from an intentional preview flag.",
  },
  {
    id: "candidate-preview-labels-visible",
    file: "src/components/home/HomeSurface.tsx",
    check: (text) =>
      text.includes("hx2-candidateBanner") &&
      text.includes("candidatePreviewEnabled") &&
      text.includes("Candidate preview") &&
      text.includes("not active tenant truth"),
    evidence: "HomeSurface renders candidate preview warning labels.",
  },
  {
    id: "home-know-active-pointer",
    file: "src/lib/home/know/v7-home-ask.ts",
    check: activePointerQuery,
    evidence: "Home/Knowledge ask reads active pointer directly.",
  },
  {
    id: "intelligence-dossier-active-pointer",
    file: "src/lib/intelligence/ask/retrievers/v7-dossier.ts",
    check: activePointerQuery,
    evidence: "Intelligence V7 dossier reads active pointer directly.",
  },
  {
    id: "tower-projection-active-pointer",
    file: "src/lib/tower/v7-tower-projection.ts",
    check: activePointerQuery,
    evidence: "Tower V7 projection reads active pointer directly.",
  },
  {
    id: "no-runtime-current-pack-view",
    file: "src",
    check: () => findRuntimeOccurrences("current_tenant_pack_runs").length === 0,
    evidence: "Runtime source does not depend on loader-defined current_tenant_pack_runs.",
  },
  {
    id: "no-default-latest-loaded-runtime-read",
    file: "src",
    check: () => unsafeLatestLoadedReads().length === 0,
    evidence: "Loaded/validated runtime reads are guarded by active pointer or explicit candidate preview.",
  },
];

function activePointerQuery(text) {
  if (!text.includes("tenant_pack_runs")) return true;
  return (
    text.includes("join intelligence_v7.active_tenant_contract_versions active") &&
    text.includes("active.active_contract_version = run.contract_version") &&
    text.includes("active.promotion_status = 'active'") &&
    text.includes("run.load_status in ('loaded', 'validated')")
  );
}

function walk(dir) {
  const entries = [];
  for (const entry of readdirSafe(dir)) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      entries.push(...walk(absolute));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      entries.push(absolute);
    }
  }
  return entries;
}

function readdirSafe(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function readRel(file) {
  const absolute = path.join(ROOT, file);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function findRuntimeOccurrences(pattern) {
  const regex = typeof pattern === "string" ? new RegExp(escapeRegex(pattern), "g") : pattern;
  return walk(path.join(ROOT, "src"))
    .filter((file) => !rel(file).includes("/__tests__/") && !/\.test\./.test(file))
    .flatMap((file) => {
      const text = readFileSync(file, "utf8");
      const matches = [];
      for (const match of text.matchAll(regex)) {
        matches.push({ file: rel(file), index: match.index ?? 0 });
      }
      return matches;
    });
}

function unsafeLatestLoadedReads() {
  return walk(path.join(ROOT, "src"))
    .filter((file) => !rel(file).includes("/__tests__/") && !/\.test\./.test(file))
    .flatMap((file) => {
      const text = readFileSync(file, "utf8");
      if (!text.includes("tenant_pack_runs") || !text.includes("load_status in ('loaded', 'validated')")) {
        return [];
      }
      const guardedByActive = text.includes("join intelligence_v7.active_tenant_contract_versions active");
      const explicitCandidatePreview =
        text.includes("join intelligence_v7.contract_versions cv") &&
        text.includes("cv.status = 'candidate'") &&
        text.includes("candidatePreview");
      return guardedByActive || explicitCandidatePreview
        ? []
        : [{ file: rel(file), index: text.indexOf("tenant_pack_runs") }];
    });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(fileName, rows) {
  const headers = Object.keys(rows[0] ?? { id: "", status: "", evidence: "" });
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeFileSync(path.join(REPORT_DIR, fileName), `${body}\n`);
}

function main() {
  mkdirSync(REPORT_DIR, { recursive: true });

  const readerRows = runtimeFiles.map((file) => {
    const text = readRel(file);
    return {
      file,
      reads_tenant_pack_runs: text.includes("tenant_pack_runs") ? "yes" : "no",
      joins_active_pointer: text.includes("active_tenant_contract_versions") ? "yes" : "no",
      exposes_candidate_preview: text.includes("candidatePreview") || text.includes("candidate-preview") ? "yes" : "no",
      status: "inspected",
    };
  });

  const testRows = tests.map((test) => {
    const text = test.file === "src" ? "" : readRel(test.file);
    const passed = test.check(text);
    return {
      id: test.id,
      file: test.file,
      status: passed ? "PASS" : "FAIL",
      evidence: test.evidence,
    };
  });

  const previewRows = testRows.filter((row) => row.id.includes("candidate") || row.id.includes("preview"));
  const failures = testRows.filter((row) => row.status !== "PASS");
  const status = failures.length ? "FAIL" : "PASS";

  writeCsv("reader-audit.csv", readerRows);
  writeCsv("default-read-tests.csv", testRows.filter((row) => !row.id.includes("preview")));
  writeCsv("candidate-preview-tests.csv", previewRows);

  const summary = `# Candidate Invisibility Guard

Status: ${status}

Generated: ${new Date().toISOString()}

## Result

- Default Home/Knowledge/module runtime reads must use \`intelligence_v7.active_tenant_contract_versions\`.
- Candidate rows are visible only through explicit candidate preview.
- Candidate preview labels required: Candidate preview; Not active tenant truth; Not used by default module runtime.
- Azure/Postgres mutation: none.
- Tenant promotion: none.

## Failures

${failures.length ? failures.map((row) => `- ${row.id}: ${row.file}`).join("\n") : "- None"}
`;
  writeFileSync(path.join(REPORT_DIR, "summary.md"), summary);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Candidate Invisibility Guard</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#161616;background:#fbfaf7}
    h1{margin-bottom:4px}
    .status{display:inline-block;padding:6px 10px;border-radius:6px;background:${status === "PASS" ? "#e8f7ee" : "#fee4e2"};color:${status === "PASS" ? "#14643d" : "#912018"};font-weight:800}
    table{border-collapse:collapse;width:100%;margin-top:18px;background:#fff}
    th,td{border:1px solid #e7e3da;padding:9px 10px;text-align:left;font-size:13px;vertical-align:top}
    th{background:#f6f3ed}
  </style>
</head>
<body>
  <h1>Candidate Invisibility Guard</h1>
  <div class="status">${status}</div>
  <p>No Azure/Postgres load, no tenant promotion, no deploy.</p>
  <table>
    <thead><tr><th>Check</th><th>Status</th><th>Evidence</th></tr></thead>
    <tbody>
      ${testRows.map((row) => `<tr><td>${row.id}</td><td>${row.status}</td><td>${row.evidence}</td></tr>`).join("\n")}
    </tbody>
  </table>
</body>
</html>
`;
  writeFileSync(path.join(REPORT_DIR, "proof.html"), html);

  if (failures.length) {
    console.error(`candidate invisibility guard failed: ${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log(`candidate invisibility guard passed; wrote ${path.relative(ROOT, REPORT_DIR)}`);
}

main();
