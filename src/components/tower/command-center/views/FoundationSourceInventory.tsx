"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TowerMartFoundationInventory, TowerMartFoundationRecord } from "@/lib/tower/current-layer-view-model";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const FILTERS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "all", label: "All records" },
  { key: "profile", label: "Organization profile and teams" },
  { key: "functions", label: "Business functions" },
  { key: "workforce", label: "Workforce roles" },
  { key: "operations", label: "Systems, data, infrastructure, and processes" },
  { key: "services", label: "Managed services" },
];

const TYPE_LABELS: Record<string, string> = {
  enterprise_profile: "Organization profile",
  profile: "Organization profile",
  organization: "Teams and ownership",
  function: "Business functions",
  business_function: "Business functions",
  workforce: "Workforce roles",
  workforce_role: "Workforce roles",
  managed_service_scope: "Managed services",
  application: "Applications and systems",
  data_flow: "Data assets and integrations",
  infrastructure: "Infrastructure and platforms",
  process: "Operating processes",
  managed_service: "Managed services",
};

// A small set of business-readable fields for each source record. The underlying source fields
// remain in the governed projection; this view avoids dumping source notes and metadata.
const DISPLAY_FIELDS: Record<string, readonly string[]> = {
  enterprise_profile: ["industry", "headquarters", "operating_regions", "business_model", "revenue_usd", "employee_count", "strategic_priorities"],
  business_function: ["executive_owner", "criticality", "function_type", "business_segment_key", "annual_budget_usd", "cost_to_serve_usd", "fte_count", "expected_value_archetype"],
  workforce_role: ["function_name", "role_count", "employment_type", "skills", "pain_points", "automation_opportunity"],
  managed_service_scope: ["service_tower", "scope_description", "in_scope_functions", "in_scope_systems", "current_provider", "service_volume", "sla_or_kpi", "run_cost_usd", "target_state_option"],
  organization: ["parent_org_unit", "leader_name_or_role", "owned_functions", "budget_authority_usd"],
  application: ["system_type", "business_function", "lifecycle_state", "business_owner", "technology_owner", "annual_cost_usd", "annual_cost_basis"],
  data_flow: ["data_domain", "source_system", "target_system", "quality_status", "regulated_data_flag"],
  infrastructure: ["platform_type", "hosting_model", "operational_owner", "criticality", "annual_cost_usd", "utilization_pct"],
  process: ["business_function", "process_owner", "systems_used", "volume_metric", "automation_candidate", "transaction_volume", "error_rate_pct"],
};

const FIELD_LABELS: Record<string, string> = {
  industry: "Industry stated in source",
  headquarters: "Headquarters stated in source",
  operating_regions: "Regions listed in source",
  business_model: "Business model stated in source",
  revenue_usd: "Source revenue figure (year unverified)",
  employee_count: "Employees stated in source",
  strategic_priorities: "Priorities listed in source",
  executive_owner: "Executive owner stated in source",
  function_type: "Function type stated in source",
  business_segment_key: "Business segment key stated in source",
  annual_budget_usd: "Source planning budget (year and approval unknown)",
  cost_to_serve_usd: "Source cost to serve (period unverified)",
  fte_count: "Staffing stated in source (FTE)",
  expected_value_archetype: "Expected benefit kind stated in source",
  function_name: "Function stated in source",
  role_count: "Roles counted in source",
  employment_type: "Employment type stated in source",
  skills: "Skills listed in source",
  pain_points: "Pain points listed in source",
  automation_opportunity: "Automation opportunity stated in source",
  service_tower: "Service area stated in source",
  scope_description: "Service scope stated in source",
  in_scope_functions: "Functions listed in scope",
  in_scope_systems: "Systems listed in scope",
  current_provider: "Provider stated in source",
  service_volume: "Service volume stated in source",
  sla_or_kpi: "Service target stated in source",
  run_cost_usd: "Source run cost (period and approval unknown)",
  target_state_option: "Future option stated in source",
  parent_org_unit: "Parent team stated in source",
  leader_name_or_role: "Leader or role stated in source",
  decision_rights: "Decisions this team can make",
  owned_functions: "Functions listed as owned",
  location_scope: "Where it operates",
  budget_authority_usd: "Source budget authority (year and approval unknown)",
  business_function: "Business function stated in source",
  business_owner: "Business owner stated in source",
  technology_owner: "Technology owner stated in source",
  process_owner: "Process owner stated in source",
  operational_owner: "Operating owner stated in source",
  system_type: "Type of system",
  platform_type: "Type of platform",
  hosting_model: "Where it runs",
  lifecycle_state: "Lifecycle status stated in source",
  criticality: "Importance stated in source",
  annual_cost_usd: "Source yearly cost (year unverified)",
  annual_cost_basis: "Cost basis in source",
  data_domain: "Kind of data",
  source_system: "Source system named in file",
  target_system: "Target system named in file",
  integration_type: "Type of integration",
  quality_status: "Data quality stated in source",
  regulated_data_flag: "Regulated data stated in source",
  capacity_or_scale: "Capacity or size stated in source",
  utilization_pct: "Use rate stated in source",
  systems_used: "Systems listed as used",
  volume_metric: "Volume measure stated in source",
  control_points: "Controls listed in source",
  automation_candidate: "Automation possibility stated in source",
  transaction_volume: "Transactions stated in source",
  error_rate_pct: "Error rate stated in source",
  rework_pct: "Rework rate stated in source",
  automation_pct: "Automation rate stated in source",
  cost_per_transaction: "Cost per transaction stated in source",
};

function plainLabel(code: string): string {
  return TYPE_LABELS[code] ?? code.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function fieldLabel(code: string): string {
  return FIELD_LABELS[code] ?? plainLabel(code);
}

function fieldValue(code: string, value: string | number): string {
  if (code === "annual_cost_basis" && value === "synthetic_modeled") return "Modeled estimate";
  if (code === "expected_value_archetype") {
    const kinds: Record<string, string> = {
      yield_leakage_or_regulatory_exposure: "Less lost value or regulatory exposure",
      cost_productivity_or_cycle_time: "Lower cost, higher productivity, or faster work",
      revenue_uplift_or_experience: "More revenue or a better experience",
    };
    return kinds[String(value)] ?? String(value).replaceAll("_", " ");
  }
  if (code === "regulated_data_flag" && /^(true|false)$/i.test(String(value))) {
    return String(value).toLowerCase() === "true" ? "Yes" : "No";
  }
  if (code.endsWith("_usd")) {
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(amount)) return usd.format(amount);
  }
  if (code.endsWith("_pct") && /^-?\d+(?:\.\d+)?$/.test(String(value))) return `${value}%`;
  if (["employee_count", "role_count", "fte_count", "transaction_volume"].includes(code) &&
      /^-?\d+(?:\.\d+)?$/.test(String(value))) {
    return Number(value).toLocaleString("en-US");
  }
  return String(value);
}

function FoundationRecord({ record }: { record: TowerMartFoundationRecord }) {
  const selected = (DISPLAY_FIELDS[record.objectType] ?? [])
    .flatMap((field) => record.sourceFields[field] === undefined ? [] : [[field, record.sourceFields[field]] as const]);
  return (
    <details style={{ border: "1px solid var(--canon-border)", borderRadius: 8, padding: "12px 16px" }}>
      <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
        {record.name} · {plainLabel(record.objectType)}
      </summary>
      <p style={{ fontSize: 13, color: "var(--canon-gray-700)" }}>
        Source ID: {record.sourceObjectId} · {record.qualityLabel}
      </p>
      {record.segmentIdentityStatus === "not_reconciled" ? (
        <p style={{ fontSize: 13, fontWeight: 600 }}>Segment not reconciled. This function is not included in a segment rollup.</p>
      ) : null}
      {record.segmentIdentityStatus === "source_key_present_mapping_pending" ? (
        <p style={{ fontSize: 13 }}>The source names a business segment, but its link to the segment list has not been checked. Tower does not include this record in a segment total.</p>
      ) : null}
      <dl style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(200px, 2fr)", gap: "8px 16px", fontSize: 13 }}>
        {selected.map(([field, value]) => (
          <div key={field} style={{ display: "contents" }}>
            <dt>{fieldLabel(field)}</dt>
            <dd style={{ margin: 0 }}>{fieldValue(field, value)}</dd>
          </div>
        ))}
      </dl>
      {selected.length === 0 ? <p>No selected business details are recorded for this source row.</p> : null}
      <p style={{ fontSize: 12, color: "var(--canon-gray-600)" }}>
        Source: {record.sourceFile}, row {record.sourceRow} · Review status: {record.reviewState.replaceAll("_", " ")}
      </p>
      <p style={{ fontSize: 11, color: "var(--canon-gray-500)", overflowWrap: "anywhere" }}>
        Audit trail: item ID {record.canonicalObjectId} · original row ID {record.sourceRecordId} · file hash {record.sourceSha256}
      </p>
    </details>
  );
}

export function FoundationSourceInventory({ inventory }: { inventory: TowerMartFoundationInventory }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(inventory.search);
  useEffect(() => setSearch(inventory.search), [inventory.search]);
  const first = (inventory.page - 1) * inventory.pageSize + 1;
  const last = Math.min(inventory.page * inventory.pageSize, inventory.matchingRecords);
  const navigate = (next: { filter?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", "foundations");
    params.set("foundationFilter", next.filter ?? inventory.filter);
    params.set("foundationSearch", next.search ?? inventory.search);
    params.set("foundationPage", String(next.page ?? 1));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <section aria-label="Source inventory" style={{ border: "1px solid var(--canon-border)", background: "var(--canon-bg-surface)", padding: 22 }}>
      <h2 style={{ marginTop: 0, fontFamily: "var(--abarva-serif)", fontSize: 25 }}>What the source says the organization runs on</h2>
      <p>{inventory.totalRecords.toLocaleString("en-US")} projected records with declared IDs can be browsed here. These are source descriptions, not a verified map of connections, approved spending, or measured benefit.</p>
      {inventory.unreadableRowCount > 0 ? (
        <p role="status">{inventory.unreadableRowCount} records on this page cannot be shown because their identity or source reference is incomplete.</p>
      ) : null}
      {inventory.rawMaturityRowsWithoutId !== null && inventory.rawMaturityRowsWithoutId > 0 ? (
        <p>{inventory.rawMaturityRowsWithoutId} source rows describe maturity but have no individual record ID. Tower cannot attach a maturity level to any one item from those rows.</p>
      ) : null}
      {inventory.rawRelationshipRows !== null && inventory.rawRelationshipRows > 0 ? (
        <p>{inventory.rawRelationshipRows.toLocaleString("en-US")} source rows describe possible connections. They have not been checked as links between these items, so Tower shows no verified connections.</p>
      ) : null}
      {inventory.itsmExtractAvailable === false ? <p>An IT service workflow extract is not supplied in this source set.</p> : null}
      {inventory.records.some((row) => row.segmentIdentityStatus === "source_key_present_mapping_pending") ? (
        <p>Business segment keys appear in source records, but the segment mapping is pending. No segment spending or staffing total is shown.</p>
      ) : null}
      <p>Any dollar fields inside a record are source statements only. They are not added to approved funding or benefit totals.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "18px 0" }}>
        <label>Browse{" "}
          <select aria-label="Browse source records" value={inventory.filter} onChange={(event) => navigate({ filter: event.target.value })}>
            {FILTERS.map((filter) => <option key={filter.key} value={filter.key}>{filter.label}</option>)}
          </select>
        </label>
        <form onSubmit={(event) => { event.preventDefault(); navigate({ search: search.trim() }); }}>
          <label>Find a record{" "}
            <input aria-label="Find a record" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or source ID" />
          </label>{" "}<button type="submit">Search</button>
        </form>
      </div>
      <p aria-live="polite">{inventory.matchingRecords === 0 ? "No matching records." : `Showing ${first}–${last} of ${inventory.matchingRecords} matching records.`}</p>
      <div style={{ display: "grid", gap: 8 }}>
        {inventory.records.map((record) => <FoundationRecord key={record.id} record={record} />)}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        {inventory.page > 1 ? <button type="button" onClick={() => navigate({ page: inventory.page - 1 })}>Previous page</button> : null}
        {last < inventory.matchingRecords ? <button type="button" onClick={() => navigate({ page: inventory.page + 1 })}>Next page</button> : null}
      </div>
    </section>
  );
}
