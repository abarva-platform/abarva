#!/usr/bin/env node
/**
 * Generate the guide that ships inside the intake workbook.
 *
 * The client instructions currently live in an engineering design document, which is the wrong place
 * for them. The person filling in a column is looking at the column, not at a design doc they were
 * never sent — so the guidance has to travel with the workbook or it does not exist.
 *
 * Two sheets are emitted:
 *
 *   00_GUIDE_how_to_use.csv     the rules, why each exists, and what breaks when it is ignored
 *   00_GUIDE_sheet_index.csv    every sheet, who owns it, what it answers, and where it surfaces
 *
 * The second is the one that saves time in practice. The most common intake failure is not a badly
 * filled column, it is a sheet routed to someone who cannot answer it — vendor commercial terms sent
 * to an architect, application criticality sent to procurement. An index naming the likely owner per
 * sheet fixes more than any amount of column-level guidance.
 *
 * Usage:
 *   node scripts/data/fixtures/generate-intake-guide.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const writeCsv = (file, header, rows) =>
  fs.writeFileSync(file, [header.join(","), ...rows.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n");

/**
 * The rules, in the order they cost the most when broken.
 *
 * Each carries a real example of what we received, because an abstract rule ("use consistent names")
 * is read and forgotten, while a concrete failure ("we got 'Epic Hyperspace' and 'Epic HyperSpace
 * (Prod)' and treated them as two systems") is understood immediately.
 */
const RULES = [
  {
    rule: "R1",
    title: "If you name it here, it must exist as a row on its own tab",
    why: "The workbook is a network, not a set of independent lists. A cell naming a system, owner, function or platform is a link to a row elsewhere. When that row is missing, we lose the connection between the two things while both still appear individually — which is what makes it hard to spot.",
    example_of_what_breaks: "We received 'Emergency Department Operations' referenced by several rows but never listed on the business functions tab. Everything about it — who owns it, what systems it uses, what it costs — was dropped.",
    how_to_check: "Filter each reference column and confirm every distinct value appears on the tab it belongs to.",
  },
  {
    rule: "R2",
    title: "Spell each name identically everywhere",
    why: "We match by name. Two spellings become two things, or one of them matches nothing at all.",
    example_of_what_breaks: "'Epic Hyperspace' on one tab and 'Epic HyperSpace (Prod)' on another became two separate systems, splitting their cost, ownership and risk.",
    how_to_check: "Copy names from the tab that owns them rather than retyping. Sort each reference column and look for near-duplicates.",
  },
  {
    rule: "R3",
    title: "A name column takes a name, never a description",
    why: "A reference column identifies a thing. A sentence about the thing identifies nothing, so the relationship cannot be recorded.",
    example_of_what_breaks: "We received \"Epic's SQL-Server-based operational reporting database\" in a column expecting a platform name. It should have been 'Epic Clarity' — the description belongs in the notes column, where it is valuable and kept.",
    how_to_check: "If the cell contains a verb, it is probably a description.",
  },
  {
    rule: "R4",
    title: "A category is not a thing",
    why: "Classifications describe how something is hosted or connected. They are useful and they belong in the hosting-model or integration-type column. In a reference column they name nothing.",
    example_of_what_breaks: "'Vendor SaaS', 'Direct point-to-point' and 'SQL Server (on-prem)' appeared where a specific platform was expected, so those relationships could not be recorded at all.",
    how_to_check: "If you could point at a screen or a contract and say 'that one', it is a thing. If it describes a whole class, it is a category.",
  },
  {
    rule: "R5",
    title: "Pick one owner convention and hold to it",
    why: "This is the single largest source of unresolved references. It is a decision, not a data-collection exercise, and it should be made on day one.",
    example_of_what_breaks: "'CMO' in one column and 'Chief Medical Officer' in another are two different owners to us. Abbreviations are fine — as long as they are the only form used.",
    how_to_check: "List org units and their leaders on the organisation tab first, then reference those exact labels everywhere else.",
  },
  {
    rule: "R6",
    title: "Separate multiple values with semicolons, not commas",
    why: "Names contain commas. 'Distribution, Sales & E-Commerce' is one function and we cannot reliably tell it from two.",
    example_of_what_breaks: "Comma-separated data domain lists were split mid-name, producing fragments that matched nothing.",
    how_to_check: "Use 'Claims; Clinical; Finance'.",
  },
  {
    rule: "R7",
    title: "If you reference by ID, define the ID once",
    why: "Referencing by ID is welcome and often better than by name. It only works if the ID appears in the ID column of the tab that owns the item.",
    example_of_what_breaks: "Integration rows referenced applications as 'APP-0003' where the applications tab had no such ID populated, so none of them resolved.",
    how_to_check: "Reference by ID or by name, but do not mix the two for the same kind of thing across tabs.",
  },
  {
    rule: "R8",
    title: "Leave it blank rather than filling it in",
    why: "A blank is honest and we report it as a gap you can decide to close. A placeholder looks like data, so we have to detect and discard it — which costs you a round trip.",
    example_of_what_breaks: "'TBD', 'N/A', 'various' and 'enterprise' were supplied in value columns and had to be stripped, with 1,708 placeholder values recorded as gaps.",
    how_to_check: "Empty cell, every time.",
  },
  {
    rule: "R9",
    title: "Where a number is an estimate, say so in the confidence column",
    why: "We will quote your numbers back to your executives. A figure marked high-confidence is treated as evidence; one marked estimated is labelled as directional. Both are useful — being unable to tell them apart is not.",
    example_of_what_breaks: "Unmarked estimates get presented with the same weight as audited figures, and the first person to challenge one undermines the whole page.",
    how_to_check: "Use the confidence column on every row carrying a number you did not take from a system.",
  },
  {
    rule: "R10",
    title: "For outcomes, tell us why you cannot claim it yet",
    why: "This is the only place we ask for a judgement rather than a fact, and it is the one that decides whether anything can be presented to a board. 'Missing actual' tells us a field is blank. 'The instrumentation was never funded' tells us who to call.",
    example_of_what_breaks: "Without it, we infer the reason from which fields are empty — technically accurate and nearly useless. In one review that inference made 80 of 102 outcomes look claimable when the client would stand behind 16.",
    how_to_check: "Fill claim_readiness, claim_blocked_reason, unblock_action and unblock_target_period on the metrics tab.",
  },
];

/** Sheet index: who to send it to, what it answers, where it shows up. */
const SHEETS = [
  ["00_enterprise_profile", "CIO office / Strategy", "Who the organisation is, its scale and segments", "Home executive summary", "critical"],
  ["01_business_functions", "COO / Function leads", "What the business does and what each function costs", "Home, Intelligence, Moves", "critical"],
  ["02_org_ownership", "HR / Chief of Staff", "Who owns what, and who decides", "Every ownership reference in the model", "critical"],
  ["03_workforce_roles", "HR / Workforce planning", "Roles, headcount and skills", "Intelligence workforce section", "high"],
  ["04_applications_systems", "Enterprise Architecture", "Every application, its owner, cost, lifecycle and criticality", "Home, Intelligence, Source, Tower", "critical"],
  ["05_data_assets_integrations", "Data / Integration lead", "Data assets and how systems exchange data", "Intelligence data section", "high"],
  ["06_infrastructure_platforms", "Infrastructure lead", "Platforms, hosting, utilisation and lifecycle", "Home, Intelligence, Tower", "high"],
  ["07_vendors_contracts", "Procurement / Vendor management", "Contracts, terms, renewal levers and exit cost", "Source, Tower", "critical"],
  ["08_spend_value", "Technology Finance", "Technology spend by category, prior year and forecast", "Home economics, Tower, Source", "critical"],
  ["09_programs_initiatives", "PMO / Portfolio", "What is in flight, its progress and expected value", "Moves, Tower", "critical"],
  ["10_ai_automation_use_cases", "AI / Innovation lead", "AI use cases and their deployment stage", "Intelligence, Tower, Moves", "high"],
  ["11_risks_controls", "Risk / Security", "Risks, controls, scores and test dates", "Home, Intelligence, Tower", "high"],
  ["12_relationships", "Enterprise Architecture", "How everything connects", "The graph behind every surface", "critical"],
  ["13_evidence_sources", "Engagement lead", "Where each dataset came from", "Provenance on every figure", "high"],
  ["14_metrics_outcomes", "Business Metric Owners + Finance", "Baselines, targets, actuals and claim readiness", "Tower value proof", "critical"],
  ["15_industry_context_patterns", "Engagement lead", "Outside-in industry context", "Intelligence benchmarks", "medium"],
  ["16_expert_lenses", "Engagement lead", "Analytical lenses applied to this client", "Intelligence benchmarks", "medium"],
  ["17_service_scope_managed_services", "Vendor management", "What is outsourced and to whom", "Source, Tower", "high"],
  ["18_operational_process_evidence", "Process owners", "Process volumes, error rates and unit cost", "Moves automation cases", "high"],
  ["19_data_analytics_platform_maturity", "Data lead", "Maturity of the data and analytics estate", "Intelligence, Home", "medium"],
  ["20_itsm_ticket_sla_performance", "Service management", "Incident and SLA performance", "Tower service quality", "high"],
  ["SA08_AI_Benefits_Realization", "AI lead + Finance", "Realised AI benefit and its evidence", "Tower value proof", "high"],
  ["SA09_AI_Tool_Usage_Feed", "AI lead / Platform admins", "AI adoption, consumption and acceptance", "Tower AI portfolio", "high"],
  ["SA10_AI_Value_Interview_Evidence", "Engagement lead", "What stakeholders said about AI value", "Intelligence, Tower", "medium"],
  ["SA11_AI_KPI_Operational_Outcome", "Business Metric Owners", "AI KPI baselines, targets and actuals", "Tower value proof", "high"],
  ["extracts/*", "Platform administrators", "Raw exports from Copilot, ServiceNow, Workday and coding assistants", "Tower AI portfolio, consumption reconciliation", "high"],
];

const summary = [];

for (const tenantKey of TENANTS) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  if (!fs.existsSync(dir)) continue;

  const guideRows = RULES.map((r) => ({
    rule_id: r.rule,
    rule: r.title,
    why_it_matters: r.why,
    what_breaks_without_it: r.example_of_what_breaks,
    how_to_check_before_sending: r.how_to_check,
  }));

  const indexRows = SHEETS.map(([sheet, owner, answers, surfaces, priority]) => ({
    sheet,
    likely_owner: owner,
    question_it_answers: answers,
    where_it_surfaces: surfaces,
    priority,
  }));

  summary.push({ tenantKey, rules: guideRows.length, sheets: indexRows.length });

  if (WRITE) {
    writeCsv(path.join(dir, "00_GUIDE_how_to_use.csv"),
      ["rule_id", "rule", "why_it_matters", "what_breaks_without_it", "how_to_check_before_sending"], guideRows);
    writeCsv(path.join(dir, "00_GUIDE_sheet_index.csv"),
      ["sheet", "likely_owner", "question_it_answers", "where_it_surfaces", "priority"], indexRows);
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) console.log(`\n${s.tenantKey}: ${s.rules} rules · ${s.sheets} sheets indexed`);
if (!WRITE) console.log("\ndry-run — pass --write to emit the guide sheets.");
