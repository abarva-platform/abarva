// Pure Layer 2 adapter for one registered synthetic Finance intake tab.
// It retains every source amount and never asserts independent Finance approval.

export const FINANCE_BUDGET_SOURCE_FILE = "SA02_IT_Finance_Budget_Spend_Extract.csv";
export const FINANCE_BUDGET_MONEY_FIELDS = Object.freeze([
  "budget_amount_usd", "actual_spend_usd", "forecast_spend_usd",
  "committed_spend_usd", "invoice_amount_usd", "variance_usd",
]);

function sourceNumber(value, signed = false) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) && (signed || number >= 0) ? number : null;
}

export function adaptRegisteredSyntheticFinanceBudget({ rows, selection, metadata }) {
  if (selection?.sourceFile !== FINANCE_BUDGET_SOURCE_FILE ||
      selection?.sourceSha256 !== metadata?.sha256 ||
      selection?.fiscalYear !== "FY26" ||
      selection?.selectionStatus !== "approved_for_synthetic_demo" ||
      selection?.independentFinanceAttestation !== false) {
    throw new Error("Synthetic demo Finance source selection does not match the exact registered file");
  }
  if (rows.length !== 70) throw new Error("Synthetic demo Finance source row count changed");
  const ids = new Set();
  const split = { run: { amount_usd: 0, source_refs: [], line_item_count: 0 },
    change: { amount_usd: 0, source_refs: [], line_item_count: 0 } };
  const lineItems = rows.map((row) => {
    const id = row.source_record_id?.trim();
    if (!id || ids.has(id) || !Number.isInteger(row.__source_row) || row.__source_row < 2 ||
        row.fiscal_year !== "FY26" || row.period !== "FY26-Q2-YTD" ||
        row.active_candidate_status !== "active" ||
        row.source_system !== "synthetic_it_finance_budget_spend_extract" ||
        !Object.hasOwn(split, row.run_change_flag)) {
      throw new Error("Synthetic demo Finance source identity, period, or source status changed");
    }
    ids.add(id);
    const amounts = Object.fromEntries(FINANCE_BUDGET_MONEY_FIELDS.map((field) =>
      [field, sourceNumber(row[field], field === "variance_usd")]));
    if (Object.values(amounts).some((value) => value === null) ||
        amounts.variance_usd !== amounts.forecast_spend_usd - amounts.budget_amount_usd) {
      throw new Error(`Synthetic demo Finance amounts or variance changed: ${id}`);
    }
    const sourceRef = { source_file: FINANCE_BUDGET_SOURCE_FILE, source_row: row.__source_row,
      source_record_id: id, source_sha256: metadata.sha256 };
    split[row.run_change_flag].amount_usd += amounts.budget_amount_usd;
    split[row.run_change_flag].source_refs.push(sourceRef);
    split[row.run_change_flag].line_item_count += 1;
    return {
      source_record_id: id,
      source_ref: sourceRef,
      source_system: row.source_system,
      run_change_flag: row.run_change_flag,
      value_source_by_field: Object.fromEntries(FINANCE_BUDGET_MONEY_FIELDS.map((field) =>
        [field, `${FINANCE_BUDGET_SOURCE_FILE}:${row.__source_row}:${field}`])),
      ...amounts,
    };
  });
  const amountUsd = lineItems.reduce((sum, item) => sum + item.budget_amount_usd, 0);
  if (amountUsd !== 650000000 || split.run.amount_usd + split.change.amount_usd !== amountUsd ||
      split.run.line_item_count !== 31 || split.change.line_item_count !== 39) {
    throw new Error("Synthetic demo Finance source budget and run/change split no longer match the reviewed line-item sum");
  }
  return {
    amount_usd: amountUsd,
    fiscal_year: "FY26", extract_period: "FY26-Q2-YTD",
    selection_status: "approved_for_synthetic_demo_by_user",
    independent_finance_attestation: false,
    source_basis: "synthetic_finance_extract_line_items",
    source_refs: lineItems.map((item) => item.source_ref),
    run_change_split: split,
    line_items: lineItems,
  };
}
