/**
 * A clause row whose text was generated must not present itself as a reviewed,
 * page-cited extraction.
 *
 * Driven over the REAL governed package rather than a hand-built fixture,
 * because the defect is a property of that package's 56 rows and of the two
 * sinks that read them. A fixture would have proved the classifier and left
 * the package exactly as it was.
 *
 * Every count below is pinned. `expect(rows.filter(...).length).toBeGreaterThan(0)`
 * stays green when 55 of 56 regress, which is the assertion shape this suite
 * exists to avoid.
 */
import fs from "node:fs";
import path from "node:path";

import {
  DERIVED_CLAUSE_QUALITY_STATE,
  DERIVED_CLAUSE_REVIEW_STATE,
  DERIVED_CLAUSE_TEXT_BASIS,
  EXTRACTED_CLAUSE_TEXT_BASIS,
  classifyContractClauseTextBasis,
  contractTermGovernance,
  declaresDerivedText,
  describesNoClauseContent,
} from "../clause-text-basis";
import { projectContractDepthPackage } from "../projection";
import type { CsvRecord } from "../projection";

const REPO_ROOT = path.resolve(__dirname, "../../../../..");
const PACKAGE_DIR = path.join(
  REPO_ROOT,
  "datasets/source/contract-depth",
  "meridian-laams-new-event-rich-v2-20260908",
);
const SOURCE_DIR = path.join(PACKAGE_DIR, "source-files");

/** Total clause rows in the governed package. Pinned, not derived from itself. */
const CLAUSE_ROW_COUNT = 56;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((v) => v.length > 0));
}

function readCsv(fileName: string): CsvRecord[] {
  const full = path.join(SOURCE_DIR, fileName);
  if (!fs.existsSync(full)) return [];
  const rows = parseCsv(fs.readFileSync(full, "utf8"));
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((cells) => {
    const record: CsvRecord = {};
    header.forEach((key, column) => {
      record[key] = cells[column] ?? "";
    });
    return record;
  });
}

const clauseRows = readCsv("contract_clauses.csv");

/** The whole governed package, read from disk, with its real clause rows. */
function packageInput() {
  return {
    contracts: readCsv("contracts.csv"),
    applicationScope: readCsv("cmdb_application_scope.csv"),
    changeOrders: readCsv("change_orders.csv"),
    contractPageText: readCsv("contract_page_text.csv"),
    resourceModel: readCsv("resource_model.csv"),
    pricingBridge: readCsv("pricing_bridge.csv"),
    invoiceLineDetail: readCsv("invoice_line_detail.csv"),
    batchJobVolumetrics: readCsv("batch_job_volumetrics.csv"),
    qbrScorecards: readCsv("qbr_scorecards.csv"),
    monthlySpend: readCsv("monthly_spend.csv"),
    slaPerformance: readCsv("sla_performance.csv"),
    ticketVolumetrics: readCsv("ticket_volumetrics.csv"),
    contractClauses: clauseRows,
    evidenceManifest: readCsv("evidence_manifest.csv"),
    optimizationOpportunities: readCsv("optimization_opportunities.csv"),
  };
}

describe("contract clause text that no document produced", () => {
  it("reads the governed package's clause rows", () => {
    expect(clauseRows).toHaveLength(CLAUSE_ROW_COUNT);
  });

  it("classifies all of the package's clause rows as derived, not extracted", () => {
    const verdicts = clauseRows.map((clause) =>
      classifyContractClauseTextBasis(clause),
    );
    const derived = verdicts.filter(
      (verdict) => verdict.textBasis === DERIVED_CLAUSE_TEXT_BASIS,
    );
    expect(derived).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      verdicts.filter(
        (verdict) => verdict.textBasis === EXTRACTED_CLAUSE_TEXT_BASIS,
      ),
    ).toHaveLength(0);
  });

  it("leaves confidence and the page citation ABSENT on every derived row", () => {
    const verdicts = clauseRows.map((clause) =>
      classifyContractClauseTextBasis(clause),
    );
    expect(
      verdicts.filter((verdict) => verdict.confidence === null),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      verdicts.filter((verdict) => verdict.sourcePage === null),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      verdicts.filter((verdict) => verdict.sourceExcerpt === null),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      verdicts.filter((verdict) => verdict.extractorVersion === null),
    ).toHaveLength(CLAUSE_ROW_COUNT);
  });

  it("carries the declaration on the source file itself, not only in code", () => {
    expect(
      clauseRows.filter(
        (clause) => clause.review_state === DERIVED_CLAUSE_REVIEW_STATE,
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      clauseRows.filter((clause) => (clause.confidence ?? "").trim() === ""),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      clauseRows.filter((clause) => (clause.source_page ?? "").trim() === ""),
    ).toHaveLength(CLAUSE_ROW_COUNT);
  });

  it("does not let the contract-term write manufacture a review state or a score", () => {
    const governed = clauseRows.map((clause) => contractTermGovernance(clause));
    expect(
      governed.filter(
        (row) => row.qualityState === DERIVED_CLAUSE_QUALITY_STATE,
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(governed.filter((row) => row.confidence === null)).toHaveLength(
      CLAUSE_ROW_COUNT,
    );
    expect(governed.filter((row) => row.pageRef === null)).toHaveLength(
      CLAUSE_ROW_COUNT,
    );
    expect(
      governed.filter((row) => row.qualityState === "reviewed"),
    ).toHaveLength(0);
    expect(governed.filter((row) => row.confidence === 0.82)).toHaveLength(0);
  });

  it("projects every clause row without a page, a score, or an excerpt", () => {
    const projection = projectContractDepthPackage(packageInput());

    const projected = projection.contractPdfClauseExtractions;
    expect(projected).toHaveLength(CLAUSE_ROW_COUNT);

    const absent = (key: string) =>
      projected.filter((row) => {
        const raw = row[key];
        return raw === undefined || raw === null || String(raw).trim() === "";
      });

    expect(absent("confidence")).toHaveLength(CLAUSE_ROW_COUNT);
    expect(absent("source_page")).toHaveLength(CLAUSE_ROW_COUNT);
    expect(absent("source_excerpt")).toHaveLength(CLAUSE_ROW_COUNT);
    expect(absent("extractor_version")).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      projected.filter(
        (row) => row.clause_text_basis === DERIVED_CLAUSE_TEXT_BASIS,
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      projected.filter(
        (row) => row.review_state === DERIVED_CLAUSE_REVIEW_STATE,
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
  });

  /**
   * The real package now declares its rows, so reading `review_state` verbatim
   * and reading it from the verdict produce the same string over that input —
   * a mutation swapping one for the other survived every case above. This
   * drives the projection with a row that LIES: content-free text carrying
   * `synthetic_demo_reviewed`, `0.91` and a page. The classifier's override is
   * covered on its own; without this case the projection's use of it was not.
   */
  it("overrides a clause row that claims review, a score and a page", () => {
    const lying: CsvRecord = {
      ...clauseRows[0],
      review_state: "synthetic_demo_reviewed",
      confidence: "0.91",
      source_page: "2",
    };
    const projection = projectContractDepthPackage({
      ...packageInput(),
      contractClauses: [lying],
    });
    const [projected] = projection.contractPdfClauseExtractions;

    expect(projected.review_state).toBe(DERIVED_CLAUSE_REVIEW_STATE);
    expect(projected.review_state).not.toBe("synthetic_demo_reviewed");
    expect(projected.confidence).toBe("");
    expect(projected.source_page).toBe("");
    expect(projected.source_excerpt).toBe("");
    expect(projected.extractor_version).toBe("");
    expect(projected.extracted_at).toBe("");
    expect(projected.clause_text_basis).toBe(DERIVED_CLAUSE_TEXT_BASIS);
  });

  it("keeps the committed preview layers in step with the source file", () => {
    const adapterPreview = JSON.parse(
      fs.readFileSync(
        path.join(
          PACKAGE_DIR,
          "qa/layer-2-adapter-preview/contract_clause_adapter.json",
        ),
        "utf8",
      ),
    ) as CsvRecord[];
    const projectionPreview = JSON.parse(
      fs.readFileSync(
        path.join(
          PACKAGE_DIR,
          "qa/layer-projection-preview/source.contract_pdf_clause_extractions.json",
        ),
        "utf8",
      ),
    ) as CsvRecord[];

    expect(adapterPreview).toHaveLength(CLAUSE_ROW_COUNT);
    expect(projectionPreview).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      adapterPreview.filter(
        (row) => row.review_state === DERIVED_CLAUSE_REVIEW_STATE,
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      adapterPreview.filter(
        (row) => String(row.confidence ?? "").trim() === "",
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
    expect(
      projectionPreview.filter(
        (row) => String(row.source_excerpt ?? "").trim() === "",
      ),
    ).toHaveLength(CLAUSE_ROW_COUNT);
  });
});

describe("the absence pattern is derived from what the generator emits", () => {
  /**
   * Each case is a variant the package does not contain. A regex pinned to the
   * one sentence on disk would let all four through, and the next generated
   * batch would classify as extracted.
   */
  it.each([
    [
      "the sentence on disk",
      "base fee is governed by the 2024 managed-services agreement and mapped to Source evidence row TERM-LAAMS-001.",
    ],
    [
      "plural subject and plural rows",
      "renewal notices are governed by the 2024 managed-services agreement and mapped to Source evidence rows TERM-A and TERM-B.",
    ],
    [
      "a different year",
      "base fee is governed by the 2019 master agreement and mapped to Source evidence row TERM-9.",
    ],
    [
      "the markers re-ordered",
      "benchmarking right, mapped to Source evidence row TERM-7, is governed by the master services agreement.",
    ],
    [
      "past tense and a gerund",
      "termination for convenience was governed by the framework agreement, mapping to evidence row TERM-3.",
    ],
    ["an empty cell", "   "],
  ])("treats %s as content-free", (_label, text) => {
    expect(describesNoClauseContent(text)).toBe(true);
  });

  /**
   * The guardrails. An over-broad absence pattern that swallowed real clause
   * language would be the worse defect: it would mark genuine extractions
   * unreviewed and strip their page citations.
   */
  it.each([
    [
      "a real commercial clause",
      "Supplier shall invoice Customer monthly in arrears at the rates set out in Schedule 2, payable within forty-five (45) days of receipt.",
    ],
    [
      "a real termination clause",
      "Customer may terminate this Agreement for convenience on ninety (90) days' prior written notice without penalty.",
    ],
    [
      "a clause that mentions governance but states an obligation",
      "This Agreement is governed by the laws of the State of New York, and the parties submit to its exclusive jurisdiction.",
    ],
    [
      "a clause that cites an evidence row and still says something",
      "The annual escalator is capped at three percent (3%) of the then-current base fee; see evidence row TERM-2.",
    ],
  ])("leaves %s classified as extracted", (_label, text) => {
    expect(describesNoClauseContent(text)).toBe(false);
  });

  it("reads a row's own declaration as a second channel", () => {
    expect(declaresDerivedText(DERIVED_CLAUSE_REVIEW_STATE)).toBe(true);
    expect(declaresDerivedText("synthetic_demo_reviewed")).toBe(false);
    expect(declaresDerivedText("")).toBe(false);
  });

  it("classifies a genuine extraction as extracted and keeps its citation", () => {
    const verdict = classifyContractClauseTextBasis(
      {
        value_text:
          "Supplier shall maintain 99.5% availability measured monthly, with service credits as set out in Schedule 4.",
        confidence: "0.74",
        source_page: "17",
        review_state: "human_reviewed",
      },
      { extractorVersion: "synthetic-contract-depth-v1" },
    );
    expect(verdict.textBasis).toBe(EXTRACTED_CLAUSE_TEXT_BASIS);
    expect(verdict.confidence).toBe(0.74);
    expect(verdict.sourcePage).toBe("17");
    expect(verdict.extractorVersion).toBe("synthetic-contract-depth-v1");
    expect(verdict.qualityState).toBe("reviewed");
  });

  it("overrides a row that claims review and a score for content-free text", () => {
    const verdict = classifyContractClauseTextBasis({
      value_text:
        "base fee is governed by the 2024 managed-services agreement and mapped to Source evidence row TERM-LAAMS-001.",
      confidence: "0.91",
      source_page: "2",
      review_state: "synthetic_demo_reviewed",
    });
    expect(verdict.textBasis).toBe(DERIVED_CLAUSE_TEXT_BASIS);
    expect(verdict.confidence).toBeNull();
    expect(verdict.sourcePage).toBeNull();
  });
});
