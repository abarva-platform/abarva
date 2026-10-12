import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const policy = "synthetic_demo_only_not_client_truth";
const endOfMonth = (month) =>
  new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);
const round = (n) => Math.round(n * 100) / 100;

export function buildSubscriptionEvidencePackage(config) {
  const ids = config.document_ids;
  const families = [
    "agreement",
    "scope",
    "usage",
    "invoices",
    "performance",
    "changes",
  ];
  check(
    families.every(
      (key) =>
        typeof ids?.[key] === "string" && /^[A-Za-z0-9._:-]+$/.test(ids[key]),
    ) && new Set(families.map((key) => ids[key])).size === families.length,
    "Six distinct declared document_ids required",
  );
  for (const field of [
    "tenant_key",
    "dataset_version",
    "contract_id",
    "vendor_ref",
    "vendor_name",
    "contract_name",
    "source_record_id",
    "application_id",
    "application_name",
    "business_owner",
    "it_owner",
    "reporting_cutoff",
    "first_month",
    "start_date",
    "end_date",
    "assumption_basis",
  ])
    check(
      typeof config[field] === "string" && config[field].trim(),
      `Missing ${field}`,
    );
  check(
    config.synthetic_policy === policy,
    "Explicit synthetic policy required",
  );
  check(
    config.archetype === "software_subscription" &&
      config.archetype_authority === "engineering_declared",
    "Explicit engineering archetype declaration required",
  );
  for (const field of [
    "entitled_seats",
    "minimum_seats",
    "monthly_unit_price",
    "notice_period_days",
  ])
    check(
      typeof config[field] === "number" &&
        Number.isFinite(config[field]) &&
        config[field] > 0,
      `Invalid ${field}`,
    );
  check(
    Number.isSafeInteger(config.entitled_seats) &&
      Number.isSafeInteger(config.minimum_seats) &&
      config.minimum_seats <= config.entitled_seats,
    "Invalid minimum_seats",
  );
  check(
    Number.isInteger(config.notice_period_days) &&
      Number.isSafeInteger(Math.round(config.monthly_unit_price * 100)),
    "Invalid rate or notice period",
  );
  check(
    Array.isArray(config.active_seats) &&
      config.active_seats.length === 12 &&
      config.active_seats.every(
        (n) =>
          typeof n === "number" &&
          Number.isInteger(n) &&
          n >= 0 &&
          n <= config.entitled_seats,
      ),
    "Invalid active_seats",
  );
  for (const field of ["reporting_cutoff", "start_date", "end_date"])
    check(
      /^\d{4}-\d{2}-\d{2}$/.test(config[field]) &&
        Number.isFinite(Date.parse(config[field])) &&
        new Date(config[field]).toISOString().slice(0, 10) === config[field],
      `Invalid ${field}`,
    );
  check(
    /^\d{4}-(0[1-9]|1[0-2])$/.test(config.first_month),
    "Invalid first_month",
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(
      Date.UTC(
        Number(config.first_month.slice(0, 4)),
        Number(config.first_month.slice(5)) - 1 + i,
        1,
      ),
    )
      .toISOString()
      .slice(0, 7),
  );
  check(
    endOfMonth(months.at(-1)) <= config.reporting_cutoff &&
      config.start_date <= `${months[0]}-01` &&
      config.end_date >= endOfMonth(months.at(-1)),
    "Reporting cutoff or contract period conflict",
  );
  const base = {
    tenant_key: config.tenant_key,
    dataset_version: config.dataset_version,
    contract_id: config.contract_id,
    vendor_ref: config.vendor_ref,
    vendor_name: config.vendor_name,
    synthetic_policy: policy,
    source_basis: "synthetic_modelled",
    assumption_basis: config.assumption_basis,
    generator_version: "subscription-evidence-v1",
    reporting_cutoff: config.reporting_cutoff,
  };
  const row = (id, values) => ({ ...base, source_row_id: id, ...values });
  const prefix = `subscription:${config.contract_id}`;
  const monthly = round(config.entitled_seats * config.monthly_unit_price);
  const annual = round(monthly * 12);
  const notice = new Date(`${config.end_date}T00:00:00Z`);
  notice.setUTCDate(notice.getUTCDate() - config.notice_period_days);
  const noticeDate = notice.toISOString().slice(0, 10);
  const tables = {};
  tables.contracts = [
    row(config.source_record_id, {
      source_record_id: config.source_record_id,
      source_row_number: 1,
      contract_name: config.contract_name,
      category: "Software subscription",
      archetype: config.archetype,
      archetype_review_state: "engineering_declared",
      annual_value_usd: annual,
      committed_annual_spend_usd: annual,
      actual_annual_spend_usd: annual,
      start_date: config.start_date,
      end_date: config.end_date,
      renewal_notice_date: noticeDate,
      notice_period_days: config.notice_period_days,
      auto_renew: "true",
      benchmarking_clause: "not_declared",
      termination_rights:
        "Synthetic scenario: reductions only at renewal and not below the declared minimum.",
      business_owner: config.business_owner,
      it_owner: config.it_owner,
      source_confidence: 0.8,
      source_file_id: ids.agreement,
    }),
  ];
  tables.cmdb_applications = [
    row(`${prefix}:application`, {
      application_id: config.application_id,
      application_name: config.application_name,
      business_unit: "Declared subscription scope",
      criticality: "tier2",
      owner_role: config.it_owner,
      source_file_id: ids.scope,
    }),
  ];
  tables.cmdb_application_scope = [
    row(`${prefix}:scope`, {
      application_id: config.application_id,
      scope_status: "included",
      scope_description:
        "Synthetic scenario: subscription administration and licensed platform access; no managed-service labor inferred.",
      source_file_id: ids.scope,
    }),
  ];
  tables.monthly_spend = months.map((month, i) =>
    row(`${prefix}:spend:${month}`, {
      month,
      period_start: `${month}-01`,
      period_end: endOfMonth(month),
      committed_base_amount_usd: monthly,
      invoice_amount_usd: monthly,
      paid_amount_usd: i === 11 ? 0 : monthly,
      actual_spend_usd: monthly,
      variance_to_committed_usd: 0,
      currency: "USD",
      invoice_ref: `SYN-INV-${config.contract_id}-${month}`,
      source_file_id: ids.invoices,
      formula_key: "licensed_quantity_times_monthly_unit_rate",
      formula_version: "1.0.0",
    }),
  );
  tables.saas_usage = months.map((month, i) =>
    row(`${prefix}:usage:${month}`, {
      month,
      period_start: `${month}-01`,
      period_end: endOfMonth(month),
      metric_name: "licensed_platform_accounts",
      entitled_quantity: config.entitled_seats,
      active_quantity: config.active_seats[i],
      unused_quantity: config.entitled_seats - config.active_seats[i],
      entitled_seats: config.entitled_seats,
      active_seats: config.active_seats[i],
      utilization_pct: config.active_seats[i] / config.entitled_seats,
      unit: "seats",
      annual_opportunity_usd: "",
      note: "Synthetic usage assumptions, not a client export or a savings calculation.",
      source_file_id: ids.usage,
    }),
  );
  tables.invoice_line_detail = months.map((month, i) =>
    row(`${prefix}:invoice:${month}`, {
      month,
      invoice_id: `SYN-INV-${config.contract_id}-${month}`,
      invoice_reference: `SYN-INV-${config.contract_id}-${month}`,
      invoice_line_id: `SYN-LINE-${month}`,
      payment_reference: i === 11 ? `SYN-UNPAID-${month}` : `SYN-PAY-${month}`,
      po_id: "SYN-PO-SUBSCRIPTION",
      quantity: config.entitled_seats,
      unit_price_usd: config.monthly_unit_price,
      line_amount_usd: monthly,
      line_type: "subscription",
      invoice_amount_usd: monthly,
      paid_amount_usd: i === 11 ? 0 : monthly,
      currency: "USD",
      description: "Synthetic licensed platform accounts",
      source_file_id: ids.invoices,
    }),
  );
  tables.sla_performance = months.map((month) =>
    row(`${prefix}:sla:${month}`, {
      month,
      period_start: `${month}-01`,
      period_end: endOfMonth(month),
      metric_name: "platform_availability_pct",
      service_id: config.application_id,
      target: 99.9,
      actual: 99.95,
      unit: "%",
      breach_state: "met",
      credit_amount_usd: "",
      credit_claimed: "false",
      source_file_id: ids.performance,
      source_confidence: 0.8,
    }),
  );
  const terms = [
    [
      "notice_period_days",
      "renewal",
      config.notice_period_days,
      `Synthetic scenario: written renewal notice is due ${config.notice_period_days} days before ${config.end_date}; deadline ${noticeDate}.`,
    ],
    [
      "auto_renew",
      "renewal",
      "",
      "Synthetic scenario: the subscription renews unless notice is delivered by the declared deadline.",
    ],
    [
      "unit_price_monthly",
      "pricing",
      config.monthly_unit_price,
      `Synthetic scenario: monthly price is USD ${config.monthly_unit_price} per licensed account.`,
    ],
    [
      "minimum_licensed_quantity",
      "pricing",
      config.minimum_seats,
      `Synthetic scenario: renewal quantity cannot fall below ${config.minimum_seats} licensed accounts.`,
    ],
    [
      "true_down_rights",
      "pricing",
      "",
      "Synthetic scenario: reduction is allowed only at renewal after the notice requirement is met; inactive accounts alone create no refund right.",
    ],
    [
      "scope_boundary",
      "scope",
      "",
      "Synthetic scenario: licensed access and platform administration only; no managed-services staffing or unrelated applications.",
    ],
    [
      "availability_target_pct",
      "service_level",
      99.9,
      "Synthetic scenario: monthly platform availability target is 99.9%; no credit formula is declared.",
    ],
  ];
  tables.contract_clauses = terms.map(([concept, family, numeric, text]) =>
    row(`${prefix}:term:${concept}`, {
      extraction_id: `${prefix}:term:${concept}`,
      concept_ref: concept,
      evidence_class: family,
      subject_kind: "contract",
      subject_ref: config.contract_id,
      value_text: text,
      value_num: numeric,
      value_bool: concept === "auto_renew" ? "true" : "",
      source_file_id:
        family === "scope"
          ? ids.scope
          : family === "service_level"
            ? ids.performance
            : ids.agreement,
      source_section: concept,
      source_page: 1,
      confidence: 0.8,
      review_state: "not_reviewed",
    }),
  );
  tables.optimization_opportunities = [
    row(`${prefix}:candidate:true-down`, {
      opportunity_id: `${prefix}:candidate:true-down`,
      opportunity_type: "avoided_cost",
      title: "Validate inactive licensed accounts before the renewal decision",
      annual_value_usd: "",
      confidence: 0.8,
      finance_confirmation_state: "not_confirmed",
      amount_state: "not_sized",
      stage: "signal",
      evidence_family: "usage_entitlement",
      evidence_rows: `${prefix}:usage:${months.at(-1)};${prefix}:term:minimum_licensed_quantity;${prefix}:term:true_down_rights;${prefix}:term:notice_period_days`,
      recommended_action: `Confirm which inactive accounts can be retired with ${config.it_owner}. Review the renewal terms and minimum before proposing a reduction; no current refund or savings is established.`,
      selected_for_action_state: "candidate",
      source_file_id: ids.usage,
      rule_key: "SUBSCRIPTION.UNUSED_ENTITLEMENT_DIAGNOSTIC",
      rule_version: "1.0.0",
    }),
  ];
  const docs = [
    [
      ids.agreement,
      "contract",
      "Synthetic CLM contract export",
      "Contract Ops",
      terms
        .filter((t) => !["scope", "service_level"].includes(t[1]))
        .map((t) => t[3])
        .join("\n"),
    ],
    [
      ids.scope,
      "sow",
      "Synthetic contract scope workbook",
      "Contract Ops / platform owner",
      terms.find((t) => t[0] === "scope_boundary")[3],
    ],
    [
      ids.usage,
      "usage",
      "Synthetic platform usage export",
      "Platform admin",
      `Synthetic scenario: entitlement is ${config.entitled_seats} seats; ${config.active_seats.at(-1)} active at ${months.at(-1)}. Monthly assumptions are declared in saas_usage.csv.`,
    ],
    [
      ids.invoices,
      "invoice_export",
      "Synthetic ERP AP invoice and payment export",
      "AP / Finance",
      "Synthetic scenario: each invoice line reconciles quantity times monthly unit price. Payment references are distinct; the last period is explicitly unpaid. This is not a connected ERP export.",
    ],
    [
      ids.performance,
      "sla_report",
      "Synthetic ITSM performance export",
      "Service delivery",
      terms.find((t) => t[0] === "availability_target_pct")[3],
    ],
    [
      ids.changes,
      "change_order_ledger",
      "Synthetic contract change register",
      "Contract Ops",
      "Synthetic scenario: the change ledger contains no approved changes within the fixed reporting period. No approval or signature is fabricated.",
    ],
  ];
  tables.evidence_manifest = docs.map(([id, type, system, owner]) =>
    row(`${prefix}:evidence:${id}`, {
      source_file_id: id,
      document_type: type,
      file_name: `${config.contract_id}-${id}.txt`,
      source_system: system,
      source_owner: owner,
      expected_layer: "doc.extraction",
      review_state: "not_reviewed",
    }),
  );
  tables.contract_page_text = docs.map(([id, , , , text]) =>
    row(`${prefix}:page:${id}:1`, {
      source_file_id: id,
      source_page: 1,
      page_text: `${text}\nSynthetic scenario only. No real agreement execution, approval or signature is asserted.`,
      page_text_sha256: hash(
        `${text}\nSynthetic scenario only. No real agreement execution, approval or signature is asserted.`,
      ),
      mapping_status: "not_reviewed",
      parser_version: "subscription-evidence-v1",
    }),
  );
  for (const name of [
    "change_orders",
    "ticket_volumetrics",
    "resource_model",
    "pricing_bridge",
    "batch_job_volumetrics",
    "qbr_scorecards",
    "negotiation_findings",
    "negotiation_levers",
  ])
    tables[name] = [];
  const unused = config.entitled_seats - config.active_seats.at(-1);
  const diagnostics = {
    rule_key: "SUBSCRIPTION.UNUSED_ENTITLEMENT_DIAGNOSTIC",
    rule_version: "1.0.0",
    period: months.at(-1),
    entitled_quantity: config.entitled_seats,
    active_quantity: config.active_seats.at(-1),
    unused_quantity: unused,
    unused_entitlement_share: unused / config.entitled_seats,
    maximum_renewal_reduction_quantity: Math.min(
      unused,
      config.entitled_seats - config.minimum_seats,
    ),
    candidate_savings_usd: null,
    source_basis: "synthetic_modelled",
    review_state: "not_reviewed",
    cited_rows: tables.optimization_opportunities[0].evidence_rows.split(";"),
    constraints: [
      "Renewal timing",
      "Minimum quantity",
      "Owner validates account retirement",
      "Terms remain unreviewed",
    ],
  };
  return {
    tables,
    diagnostics,
    documents: Object.fromEntries(
      tables.contract_page_text.map((r) => [
        `${config.contract_id}-${r.source_file_id}.txt`,
        r.page_text,
      ]),
    ),
    binding: {
      tenant_key: config.tenant_key,
      contract_id: config.contract_id,
      vendor_ref: config.vendor_ref,
      source_record_id: config.source_record_id,
    },
    row_counts: Object.fromEntries(
      Object.entries(tables).map(([name, rows]) => [name, rows.length]),
    ),
    reporting_cutoff: config.reporting_cutoff,
    assumption_basis: config.assumption_basis,
  };
}

function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const i = arg.indexOf("=");
      return [arg.slice(2, i), arg.slice(i + 1)];
    }),
  );
  check(
    args.config && args["out-dir"],
    "--config=<json> and --out-dir=<directory> required",
  );
  const config = JSON.parse(fs.readFileSync(args.config, "utf8"));
  const registry = JSON.parse(
    fs.readFileSync(
      "datasets/tenant-inputs/tenant-input-registry.json",
      "utf8",
    ),
  );
  check(
    registry.activeTenants.some(
      (t) =>
        t.tenantKey === config.tenant_key &&
        t.packets.length > 0 &&
        t.packets.every((p) => p.classification === "synthetic-demo"),
    ),
    "Registry-declared synthetic tenant required",
  );
  const pack = buildSubscriptionEvidencePackage(config);
  const out = path.resolve(args["out-dir"]);
  check(
    !fs.existsSync(out),
    "Output already exists; compare before replacing a package",
  );
  fs.mkdirSync(path.join(out, "source-files"), { recursive: true });
  fs.mkdirSync(path.join(out, "synthetic-evidence-documents"));
  for (const [name, rows] of Object.entries(pack.tables))
    fs.writeFileSync(
      path.join(out, "source-files", `${name}.csv`),
      `${rows.length ? Papa.unparse(rows) : "tenant_key,dataset_version,contract_id,source_row_id"}\n`,
    );
  for (const [name, text] of Object.entries(pack.documents))
    fs.writeFileSync(
      path.join(out, "synthetic-evidence-documents", name),
      `${text}\n`,
    );
  fs.writeFileSync(
    path.join(out, "diagnostics.json"),
    `${JSON.stringify(pack.diagnostics, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(out, "package-summary.json"),
    `${JSON.stringify({ dataset_version: config.dataset_version, binding: pack.binding, reporting_cutoff: pack.reporting_cutoff, assumption_basis: pack.assumption_basis, source_basis: "synthetic_modelled", review_state: "not_reviewed", data_plane_loaded_verified: false, row_counts: pack.row_counts }, null, 2)}\n`,
  );
  console.log(
    JSON.stringify({
      output: out,
      row_counts: pack.row_counts,
      diagnostics: pack.diagnostics,
      databaseWrites: false,
    }),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
