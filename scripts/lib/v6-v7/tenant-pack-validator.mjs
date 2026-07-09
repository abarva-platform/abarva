import fs from "node:fs";
import path from "node:path";
import { readCsv } from "./csv.mjs";
import { REL_TYPES, V7_FILES } from "./tenant-pack-builder.mjs";

const V6_FILES = Array.from({ length: 16 }, (_, i) => `V6_${String(i + 1).padStart(2, "0")}_`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const aa = new Set(normalize(a).split(" ").filter(Boolean));
  const bb = new Set(normalize(b).split(" ").filter(Boolean));
  const union = new Set([...aa, ...bb]);
  const intersection = [...aa].filter((token) => bb.has(token));
  return union.size ? intersection.length / union.size : 0;
}

function assertDistinct(rows, field, label, maxSimilarity = 0.92) {
  const seen = new Map();
  rows.forEach((row, i) => {
    const value = normalize(row[field]);
    assert(value, `${label}:${i + 2} missing ${field}`);
    assert(!/todo|tbd|placeholder|lorem|assign owner, request source extract/i.test(value), `${label}:${i + 2} has unresolved placeholder/boilerplate in ${field}`);
    if (seen.has(value)) {
      throw new Error(`${label} duplicate ${field}: rows ${seen.get(value)} and ${i + 2}`);
    }
    seen.set(value, i + 2);
  });
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const score = similarity(rows[i][field], rows[j][field]);
      if (score >= maxSimilarity) {
        throw new Error(`${label} near-duplicate ${field}: rows ${i + 2}/${j + 2} similarity ${score.toFixed(2)}`);
      }
    }
  }
}

export function validateTenantDataset(config, options = {}) {
  const outDir = options.outDir || path.join(process.cwd(), config.sourceDataset);
  const templateDir = path.join(outDir, "templates");
  const v7Dir = path.join(outDir, "v7");
  const derivedDir = path.join(outDir, "derived");
  assert(fs.existsSync(templateDir), `missing V6 template dir ${templateDir}`);
  assert(fs.existsSync(v7Dir), `missing V7 dir ${v7Dir}`);

  const v6Files = fs.readdirSync(templateDir).filter((file) => file.endsWith(".csv")).sort();
  assert(v6Files.length === 16, `expected 16 V6 files, found ${v6Files.length}`);
  for (const prefix of V6_FILES) {
    assert(v6Files.some((file) => file.startsWith(prefix)), `missing V6 file with prefix ${prefix}`);
  }
  const rowCounts = {};
  for (const file of v6Files) {
    const rows = readCsv(path.join(templateDir, file));
    rowCounts[`templates/${file}`] = rows.length;
    assert(rows.length > 0, `${file} has no rows`);
    for (const row of rows) {
      assert(row.tenant_key === config.tenantKey, `${file}:${row.__sourceRowNumber} wrong tenant_key ${row.tenant_key}`);
      assert(row.client_display_name === config.tenantName, `${file}:${row.__sourceRowNumber} wrong client_display_name ${row.client_display_name}`);
      assert(row.source_basis === config.sourceBasis, `${file}:${row.__sourceRowNumber} wrong source_basis`);
      assert(row.not_allowed_claims.includes("Do not claim"), `${file}:${row.__sourceRowNumber} missing not_allowed_claims`);
      assert(row.known_gaps.includes("Synthetic PHI-free"), `${file}:${row.__sourceRowNumber} missing synthetic boundary`);
    }
  }

  const relationships = readCsv(path.join(templateDir, "V6_12_relationships.csv"));
  assert(relationships.length >= 45, `expected at least 45 relationships, found ${relationships.length}`);
  for (const row of relationships) {
    assert(REL_TYPES.has(row.relationship_type), `unsupported relationship_type ${row.relationship_type}`);
    assert(row.evidence_basis, `relationship ${row.relationship_id} missing evidence_basis`);
  }

  const v7Files = fs.readdirSync(v7Dir).filter((file) => file.endsWith(".csv")).sort();
  assert(v7Files.length === V7_FILES.length, `expected ${V7_FILES.length} V7 files, found ${v7Files.length}`);
  for (const [file] of V7_FILES) {
    assert(v7Files.includes(file), `missing ${file}`);
    const rows = readCsv(path.join(v7Dir, file));
    rowCounts[`v7/${file}`] = rows.length;
    assert(rows.length > 0, `${file} has no rows`);
  }

  const findings = readCsv(path.join(derivedDir, "meridian_moves_current_state_findings.csv"));
  const golden = readCsv(path.join(derivedDir, "meridian_moves_golden_questions_scorecard.csv"));
  assert(findings.length >= 28, `expected at least 28 findings, found ${findings.length}`);
  assert(golden.length >= 42, `expected at least 42 golden questions, found ${golden.length}`);
  assertDistinct(findings, "business_implication", "findings");
  assertDistinct(findings, "recommended_next_step", "findings");
  assertDistinct(findings, "current_state_finding", "findings");
  assertDistinct(golden, "must_include", "golden questions");
  assertDistinct(golden, "must_not_claim", "golden questions", 0.98);
  assertDistinct(golden, "pass_criteria", "golden questions");

  const programs = readCsv(path.join(v7Dir, "V7_09_programs_initiatives_business_priorities.csv"));
  assertDistinct(programs, "value_hypothesis", "V7 programs", 0.9);
  for (const row of programs) {
    assert(row.value_hypothesis.includes("quantify") || row.value_hypothesis.includes("Quantify"), `value hypothesis lacks quantification boundary for ${row.priority_id}`);
    assert(!/\$[0-9]/.test(row.value_hypothesis), `value hypothesis contains unsupported dollar claim for ${row.priority_id}`);
  }

  const payloadFile = path.join(outDir, "azure/v7-tenant-load-payload.json");
  assert(fs.existsSync(payloadFile), "missing V7 payload");
  const payload = JSON.parse(fs.readFileSync(payloadFile, "utf8"));
  assert(payload.contractVersion === config.v7ContractVersion, `wrong contract version ${payload.contractVersion}`);
  assert(payload.tenantPacks?.[0]?.tenantKey === config.tenantKey, "payload tenant key mismatch");
  assert(payload.dimensions.length === V7_FILES.length, `payload dimensions expected ${V7_FILES.length}, found ${payload.dimensions.length}`);

  return {
    tenantKey: config.tenantKey,
    datasetId: config.datasetId,
    rowCounts,
    relationshipRows: relationships.length,
    findingRows: findings.length,
    goldenQuestionRows: golden.length,
    validation: "passed",
  };
}
