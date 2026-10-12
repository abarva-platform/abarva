import {
  normalizeSpendSourceRow,
  normalizeUsageSourceRow,
  preserveSourceFile,
  normalizeBatchSourceRow,
} from "../../../src/lib/source/contract-depth-package/source-row-normalization";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import Papa from "papaparse";

function readThroughLoader(
  packageDirectory?: string,
  tenantKey?: string,
  datasetVersion?: string,
) {
  const file = path.resolve(__dirname, "../load-contract-depth-package.ts");
  const parsed = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const functions = parsed.statements
    .filter(ts.isFunctionDeclaration)
    .map((s) => s.getText(parsed))
    .join("\n");
  const compiled = ts.transpileModule(functions, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const read = vm.runInNewContext(`${compiled}\nreadSourceFiles`, {
    fs,
    path,
    normalizeSpendSourceRow,
    normalizeUsageSourceRow,
    preserveSourceFile,
    normalizeBatchSourceRow,
  });
  const dir =
    packageDirectory ??
    path.resolve(
      __dirname,
      "../../../datasets/source/contract-depth/demo-subscription-contract-evidence-20261012",
    );
  const summary = !tenantKey
    ? JSON.parse(
        fs.readFileSync(path.join(dir, "package-summary.json"), "utf8"),
      )
    : null;
  return read(
    dir,
    tenantKey ?? summary.binding.tenant_key,
    datasetVersion ?? summary.dataset_version,
  );
}

describe("contract depth source row normalization", () => {
  it("preserves nonzero batch measurements through the actual historical loader", () => {
    const dir = path.resolve(
      __dirname,
      "../../../datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908",
    );
    const raw = Papa.parse<Record<string, string>>(
      fs.readFileSync(
        path.join(dir, "source-files/batch_job_volumetrics.csv"),
        "utf8",
      ),
      { header: true, skipEmptyLines: true },
    );
    expect(raw.errors).toHaveLength(0);
    const measured = raw.data.find(
      (r) =>
        Number(r.failed_jobs) > 0 ||
        Number(r.late_completion_count) > 0 ||
        Number(r.manual_restarts) > 0,
    );
    expect(measured).toBeDefined();
    const loaded = readThroughLoader(
      dir,
      "meridian-health",
      "meridian-laams-new-event-rich-v2-20260908",
    ).batchJobVolumetrics.find(
      (r: Record<string, string>) =>
        r.source_row_id === measured!.source_row_id,
    );
    expect(loaded).toMatchObject({
      failed_jobs: measured!.failed_jobs,
      late_completion_count: measured!.late_completion_count,
      manual_restarts: measured!.manual_restarts,
      source_file_id: measured!.source_file_id,
    });
  });
  it("retains authored opportunity amounts as source payload, not financial facts", () => {
    expect(
      normalizeUsageSourceRow(
        {
          entitled_quantity: "100",
          active_quantity: "75",
          annual_opportunity_usd: "1957800",
        },
        "F1",
      ),
    ).toMatchObject({
      annual_opportunity_usd: "",
      source_annual_opportunity_usd: "1957800",
    });
  });
  it("preserves measured batch counts and does not convert absent counts to zero", () => {
    expect(
      normalizeBatchSourceRow({
        failed_jobs: "2",
        late_completion_count: "3",
        manual_restarts: "0",
      }),
    ).toMatchObject({
      failed_jobs: "2",
      late_completion_count: "3",
      manual_restarts: "0",
    });
    expect(normalizeBatchSourceRow({})).toMatchObject({
      failed_jobs: "",
      late_completion_count: "",
      manual_restarts: "",
    });
    expect(() => normalizeBatchSourceRow({ failed_jobs: "bad" })).toThrow(
      /Invalid/,
    );
  });
  it("reaches the real loader with financial identity, zero payments and usage intact", () => {
    const loaded = readThroughLoader();
    expect(loaded.monthlySpend[11]).toMatchObject({
      source_file_id: "SYN-DOC-SUBSCRIPTION-20261012-INVOICES",
      paid_amount_usd: "0",
      invoice_ref: expect.stringMatching(/^SYN-INV-/),
    });
    expect(loaded.saasUsage[11]).toMatchObject({
      source_file_id: "SYN-DOC-SUBSCRIPTION-20261012-USAGE",
      metric_name: "licensed_platform_accounts",
      entitled_quantity: "2500",
      active_quantity: "1800",
      unused_quantity: "700",
    });
    expect(loaded.invoiceLineDetail[11].source_file_id).toBe(
      "SYN-DOC-SUBSCRIPTION-20261012-INVOICES",
    );
  });
  it("preserves explicit financial amounts, zero payment, invoice identity and source file", () => {
    const input = {
      committed_base_amount_usd: "100",
      invoice_amount_usd: "90",
      paid_amount_usd: "0",
      actual_spend_usd: "80",
      spend_usd: "999",
      invoice_ref: "invoice-declared",
      currency: "GBP",
      source_file_id: "finance-file",
    };
    expect(normalizeSpendSourceRow(input, "fallback")).toEqual(input);
  });
  it("leaves an absent invoice reference unknown instead of inventing another contract's prefix", () => {
    expect(
      normalizeSpendSourceRow({ month: "2026-01" }, "fallback").invoice_ref,
    ).toBe("");
  });
  it("uses declared legacy aliases only for absent canonical fields", () => {
    expect(
      normalizeSpendSourceRow(
        { spend_usd: "42", commitment_run_rate_usd: "50", invoice_id: "I1" },
        "F1",
      ),
    ).toMatchObject({
      actual_spend_usd: "42",
      invoice_amount_usd: "",
      paid_amount_usd: "",
      committed_base_amount_usd: "50",
      source_file_id: "F1",
      invoice_ref: "I1",
    });
  });
  it("does not fill an explicitly missing payment or actual from spend", () => {
    expect(
      normalizeSpendSourceRow(
        { paid_amount_usd: "", actual_spend_usd: "", spend_usd: "42" },
        "F1",
      ),
    ).toMatchObject({ paid_amount_usd: "", actual_spend_usd: "" });
  });
  it("preserves canonical usage measurements, units, metric and source", () => {
    const input = {
      entitled_quantity: "100",
      active_quantity: "75",
      unused_quantity: "25",
      utilization_pct: "0.75",
      metric_name: "licensed_accounts",
      unit: "accounts",
      source_file_id: "usage-file",
    };
    expect(normalizeUsageSourceRow(input, "fallback")).toMatchObject(input);
  });
  it("derives a quantity gap from complete aliases rather than stamping zero", () => {
    expect(
      normalizeUsageSourceRow(
        { entitled_seats: "100", active_seats: "75" },
        "F1",
      ),
    ).toMatchObject({
      entitled_quantity: "100",
      active_quantity: "75",
      unused_quantity: "25",
      utilization_pct: "0.75",
      unit: "seats",
    });
  });
  it("preserves recorded zero and withholds missing usage", () => {
    expect(
      normalizeUsageSourceRow(
        { entitled_quantity: "100", active_quantity: "0" },
        "F1",
      ).unused_quantity,
    ).toBe("100");
    expect(
      normalizeUsageSourceRow({ entitled_quantity: "100" }, "F1"),
    ).toMatchObject({
      active_quantity: "",
      unused_quantity: "",
      utilization_pct: "",
      unit: "",
    });
  });
  it("refuses quantity conflicts", () => {
    expect(() =>
      normalizeUsageSourceRow(
        { entitled_quantity: "100", active_quantity: "101" },
        "F1",
      ),
    ).toThrow(/exceeds/);
    expect(() =>
      normalizeUsageSourceRow(
        {
          entitled_quantity: "100",
          active_quantity: "75",
          unused_quantity: "0",
        },
        "F1",
      ),
    ).toThrow(/Conflicting/);
    expect(() =>
      normalizeUsageSourceRow(
        { entitled_quantity: "100", active_quantity: "bad" },
        "F1",
      ),
    ).toThrow(/Invalid/);
  });
  it("does not replace a declared source file", () => {
    expect(
      preserveSourceFile({ source_file_id: "declared-file" }, "fallback"),
    ).toBe("declared-file");
  });
});
