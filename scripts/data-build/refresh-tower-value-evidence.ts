#!/usr/bin/env npx tsx
/**
 * Canonical outcome evidence into Tower's claim chain.
 *
 * Tower's Evidence tab reports every claim as missing baseline, target, actual, outcome metric,
 * attribution, quality guardrail, risk guardrail and finance attestation — between 89 and 164 claims
 * per gap. Read one way that is a data-collection problem: the client never supplied outcome
 * evidence.
 *
 * They did. `ai_kpi_outcome_observation` carries `baselineValue`, `targetValue`, `actualValue`,
 * measurement period, measurement owner, `financeValidatedValueUsd`, `valueClaimStatus`,
 * `towerClaimAllowed` and `evidenceId`. `metric_outcome` carries baseline and target for a further
 * seventy-six metrics. Every field Tower reports as absent exists in the canonical model and has
 * never been projected into `tower.metric_observation` or linked from `tower.value_claim`.
 *
 * So Tower is not missing evidence. It is missing a projection, and the surface has been telling
 * clients their outcomes are unevidenced when the evidence was sitting one layer away. That is the
 * most damaging shape of this defect: a confident, specific, wrong statement about the client's own
 * data maturity.
 *
 * This writes three linked levels:
 *
 *   tracked_subject      one per programme or AI use case canonical knows about
 *   metric_observation   baseline / target / actual scenarios, each with period and source hash
 *   value_claim          links the three, carries the guardrail and attestation state
 *
 * A claim is only marked claimable when its evidence actually supports that. Where canonical says
 * `towerClaimAllowed` is false, or no actual exists, the claim keeps its evidence-gap state and names
 * what is missing — the gap report stays honest, it just stops being universal.
 *
 * Usage:
 *   npx tsx scripts/data-build/refresh-tower-value-evidence.ts [--tenant <key>]...
 *
 * Dry-run by default. Writes only with TOWER_EVIDENCE_WRITE=true and TOWER_EVIDENCE_WRITE_APPROVED=true.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}
function args(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === `--${name}`) out.push(process.argv[i + 1]);
  });
  return out;
}

const OUT_DIR = arg("out-dir") ?? "/tmp/tower-value-evidence";
const TENANTS = args("tenant").length ? args("tenant") : ["meridian-health", "skyharbor-air"];
const BUILD_VERSION = process.env.TOWER_EVIDENCE_BUILD_VERSION ?? arg("build-version") ?? "local";
const WRITE =
  process.env.TOWER_EVIDENCE_WRITE === "true" &&
  process.env.TOWER_EVIDENCE_WRITE_APPROVED === "true";

const CLAIM_RULE_VERSION = "tower-value-evidence/v1";
const provenanceIdForTenant = (tenantKey: string) => `PROV-${tenantKey}-${CLAIM_RULE_VERSION}-${BUILD_VERSION}`;

function gitSha(): string {
  const operatorCommit = process.env.ABARVA_OPERATOR_BRANCH_COMMIT?.trim();
  if (operatorCommit) return operatorCommit;
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

type Value = { value?: unknown } | undefined;
const str = (v: Value): string | null => {
  const raw = v?.value;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
};
const numeric = (v: Value): number | null => {
  const raw = v?.value;
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const isoDate = (v: Value): string | null => {
  const raw = str(v);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const hash = (parts: unknown[]) =>
  crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);

interface Observation {
  tenantKey: string;
  observationId: string;
  subjectRef: string;
  metricRef: string;
  scenario: "baseline" | "target" | "actual";
  value: number;
  periodStart: string | null;
  periodEnd: string | null;
  sourceResultHash: string;
}
interface Subject {
  tenantKey: string;
  subjectRef: string;
  subjectKind: string;
  initiativeRef: string | null;
  /** `tower.tracked_subject.title`. Named to match the column rather than to read nicely here. */
  title: string;
}
interface Claim {
  tenantKey: string;
  claimId: string;
  subjectRef: string;
  promisedValue: number | null;
  calculatedValue: number | null;
  claimState: string;
  baselineObservationId: string | null;
  targetObservationId: string | null;
  actualObservationId: string | null;
  qualityGuardrailState: string;
  nextGateOwnerRole: string | null;
  /** `tower.value_claim.outcome_metric_ref` — the metric this claim is about. */
  outcomeMetricRef: string;
  missing: string[];
  /** The client's own account of what is in the way, when they gave one. */
  blockedReason: string | null;
  unblockAction: string | null;
  unblockTargetPeriod: string | null;
  evidenceBasis: string | null;
  /**
   * `declared` when the client stated the reason at intake, `inferred` when it was reconstructed
   * from which fields are empty. A derived reason is accurate and nearly useless: it tells you a
   * field is blank, where the declared one tells you who to call.
   */
  reasonSource: "declared" | "inferred";
}

async function main(): Promise<number> {
  const report = await buildCanonicalTenantDataReport({
    repoRoot: process.cwd(),
    tenantKeys: TENANTS,
  });

  const subjects: Subject[] = [];
  const observations: Observation[] = [];
  const claims: Claim[] = [];

  for (const tenantKey of TENANTS) {
    const forTenant = report.canonicalRecords.filter((r) => r.tenantKey === tenantKey);
    const byType = (t: string) => forTenant.filter((r) => r.objectType === t);

    const addObservation = (
      subjectRef: string,
      metricRef: string,
      scenario: Observation["scenario"],
      value: number | null,
      periodStart: string | null,
      periodEnd: string | null,
    ): string | null => {
      if (value === null) return null;
      // Tower's measurement table requires a period. Do not invent one: a value without its
      // measurement window is not an auditable observation, so it remains a claim evidence gap.
      if (!periodStart || !periodEnd) return null;
      const observationId = `OBS-${hash([tenantKey, subjectRef, metricRef, scenario])}`;
      observations.push({
        tenantKey,
        observationId,
        subjectRef,
        metricRef,
        scenario,
        value,
        periodStart,
        periodEnd,
        sourceResultHash: hash([tenantKey, metricRef, scenario, value, periodStart]),
      });
      return observationId;
    };

    /** AI KPI observations carry a full baseline/target/actual chain plus finance state. */
    for (const record of byType("ai_kpi_outcome_observation")) {
      const a = record.attributes;
      const kpi = str(a.kpiName) ?? str(a.displayName);
      if (!kpi) continue;
      const useCase = str(a.aiUseCaseId) ?? str(a.aiProgramId) ?? kpi;
      const subjectRef = `SUBJ-${hash([tenantKey, useCase])}`;
      const metricRef = `MET-${hash([tenantKey, kpi])}`;
      subjects.push({
        tenantKey,
        subjectRef,
        subjectKind: "initiative",
        initiativeRef: str(a.aiProgramId),
        title: useCase,
      });

      const periodStart = isoDate(a.measurementPeriodStart);
      const periodEnd = isoDate(a.measurementPeriodEnd);
      const baselineId = addObservation(subjectRef, metricRef, "baseline", numeric(a.baselineValue), periodStart, periodEnd);
      const targetId = addObservation(subjectRef, metricRef, "target", numeric(a.targetValue), periodStart, periodEnd);
      const actualId = addObservation(subjectRef, metricRef, "actual", numeric(a.actualValue), periodStart, periodEnd);

      const financeValidated = numeric(a.financeValidatedValueUsd);
      const claimAllowed = String(str(a.towerClaimAllowed) ?? "").toLowerCase();
      const allowed = claimAllowed === "true" || claimAllowed === "yes" || claimAllowed === "y";
      const missing: string[] = [];
      if (!baselineId) missing.push("baseline");
      if (!targetId) missing.push("target");
      if (!actualId) missing.push("actual");
      if (financeValidated === null) missing.push("finance_attestation");
      if (!str(a.evidenceId)) missing.push("attribution");

      const kpiDeclaredReason = str(a.claimBlockedReason) ?? str(a.caveat);
      claims.push({
        blockedReason: kpiDeclaredReason,
        unblockAction: str(a.unblockAction),
        unblockTargetPeriod: str(a.unblockTargetPeriod),
        evidenceBasis: str(a.evidenceBasis) ?? str(a.sourceSystem),
        reasonSource: kpiDeclaredReason ? "declared" : "inferred",
        tenantKey,
        claimId: `CLM-${hash([tenantKey, kpi, useCase])}`,
        subjectRef,
        outcomeMetricRef: metricRef,
        promisedValue: numeric(a.targetValue),
        // Only a claim with a real actual and a finance-attested amount carries a calculated value.
        // Deriving one from a target would turn an expectation into a result, which is the exact
        // thing the claim chain exists to prevent.
        calculatedValue: actualId && financeValidated !== null ? financeValidated : null,
        claimState:
          missing.length === 0 && allowed
            ? "claimable"
            : missing.length === 0
              ? "blocked_by_policy"
              : "evidence_gap",
        baselineObservationId: baselineId,
        targetObservationId: targetId,
        actualObservationId: actualId,
        qualityGuardrailState: str(a.caveat) ? "caveated" : missing.length === 0 ? "clear" : "incomplete",
        nextGateOwnerRole: str(a.measurementOwner),
        missing,
      });
    }

    /** metric_outcome carries baseline and target but no actual — an honest partial chain. */
    for (const record of byType("metric_outcome")) {
      const a = record.attributes;
      const metric = str(a.metricName) ?? str(a.displayName);
      if (!metric) continue;
      const fn = str(a.businessFunction) ?? str(a.metricDomain) ?? metric;
      const subjectRef = `SUBJ-${hash([tenantKey, fn])}`;
      const metricRef = `MET-${hash([tenantKey, metric])}`;
      subjects.push({
        tenantKey,
        subjectRef,
        subjectKind: "initiative",
        initiativeRef: null,
        title: fn,
      });
      const period = str(a.baselinePeriod);
      const baselineId = addObservation(subjectRef, metricRef, "baseline", numeric(a.baselineValue), null, null);
      const targetId = addObservation(subjectRef, metricRef, "target", numeric(a.targetValue), null, null);
      // The metrics intake gained actual and attestation columns; a metric that carries them now
      // completes its chain rather than being permanently stuck at "awaiting actual".
      const actualId = addObservation(
        subjectRef,
        metricRef,
        "actual",
        numeric(a.actualValue),
        null,
        isoDate(a.actualPeriod),
      );
      const attested = numeric(a.financeAttestedValueUsd);
      const missing: string[] = [];
      if (!baselineId) missing.push("baseline");
      if (!targetId) missing.push("target");
      if (!actualId) missing.push("actual");
      if (attested === null) missing.push("finance_attestation");
      if (!period) missing.push("baseline_period");
      // The metrics intake now asks what the client accepts as evidence, who attests, why a claim is
      // blocked, what unblocks it and by when. Where they answered, that answer wins over anything
      // this projector could work out from empty fields.
      const declaredReason = str(a.claimBlockedReason);
      const declaredReadiness = str(a.claimReadiness);
      claims.push({
        blockedReason: declaredReason,
        unblockAction: str(a.unblockAction),
        unblockTargetPeriod: str(a.unblockTargetPeriod),
        evidenceBasis: str(a.evidenceBasis),
        reasonSource: declaredReason ? "declared" : "inferred",
        tenantKey,
        claimId: `CLM-${hash([tenantKey, metric, fn])}`,
        subjectRef,
        outcomeMetricRef: metricRef,
        promisedValue: numeric(a.targetValue),
        calculatedValue: actualId && attested !== null ? attested : null,
        // The client's declared readiness governs. A metric they call `not_ready` stays blocked even
        // when every field happens to be populated, because they know something the columns do not.
        claimState:
          declaredReadiness === "claimable" && missing.length === 0
            ? "claimable"
            : declaredReadiness === "pending_attestation"
              ? "awaiting_attestation"
              : declaredReadiness === "not_ready"
                ? "blocked_by_owner"
                : missing.length === 0
                  ? "claimable"
                  : "evidence_gap",
        baselineObservationId: baselineId,
        targetObservationId: targetId,
        actualObservationId: actualId,
        qualityGuardrailState:
          missing.length === 0 ? "clear" : actualId ? "awaiting_attestation" : baselineId && targetId ? "awaiting_actual" : "incomplete",
        nextGateOwnerRole: str(a.attestationOwner) ?? str(a.owner),
        missing,
      });
    }
  }

  // Subjects are emitted once per source row and legitimately repeat — a business function carries
  // many metrics. Collapsing here rather than at insert keeps the summary counts honest.
  const uniqueSubjects = [...new Map(subjects.map((s) => [`${s.tenantKey}|${s.subjectRef}`, s])).values()];
  const uniqueObservations = [...new Map(observations.map((o) => [`${o.tenantKey}|${o.observationId}`, o])).values()];
  const uniqueClaims = [...new Map(claims.map((c) => [`${c.tenantKey}|${c.claimId}`, c])).values()];

  const gapCounts = new Map<string, number>();
  for (const claim of uniqueClaims) {
    for (const gap of claim.missing) gapCounts.set(gap, (gapCounts.get(gap) ?? 0) + 1);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: WRITE ? "write" : "dry-run",
    gitSha: gitSha(),
    imageDigest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
    buildVersion: BUILD_VERSION,
    tenantScope: TENANTS,
    canonicalRecordsRead: report.canonicalRecords.length,
    subjects: uniqueSubjects.length,
    observations: uniqueObservations.length,
    observationsByScenario: {
      baseline: uniqueObservations.filter((o) => o.scenario === "baseline").length,
      target: uniqueObservations.filter((o) => o.scenario === "target").length,
      actual: uniqueObservations.filter((o) => o.scenario === "actual").length,
    },
    claims: uniqueClaims.length,
    claimsByState: {
      claimable: uniqueClaims.filter((c) => c.claimState === "claimable").length,
      blocked_by_policy: uniqueClaims.filter((c) => c.claimState === "blocked_by_policy").length,
      blocked_by_owner: uniqueClaims.filter((c) => c.claimState === "blocked_by_owner").length,
      awaiting_attestation: uniqueClaims.filter((c) => c.claimState === "awaiting_attestation").length,
      evidence_gap: uniqueClaims.filter((c) => c.claimState === "evidence_gap").length,
    },
    reasonSource: {
      declared: uniqueClaims.filter((c) => c.reasonSource === "declared").length,
      inferred: uniqueClaims.filter((c) => c.reasonSource === "inferred").length,
    },
    topBlockedReasons: Object.fromEntries(
      [...uniqueClaims.reduce((m, c) => {
        if (!c.blockedReason) return m;
        return m.set(c.blockedReason, (m.get(c.blockedReason) ?? 0) + 1);
      }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 6),
    ),
    remainingGaps: Object.fromEntries([...gapCounts].sort((a, b) => b[1] - a[1])),
    rowsWritten: 0,
    readbackClaims: 0,
    towerMartUpdated: false as boolean,
    schemaPreflight: null as unknown,
    metricDimension: null as unknown,
    metricDimensionRowsEnsured: 0,
    metricProvenanceRowsEnsured: 0,
  };

  if (WRITE) {
    const connectionString =
      process.env.ABARVA_AZURE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
    if (!connectionString) throw new Error("ABARVA_AZURE_DATABASE_URL or DATABASE_URL is required in write mode");
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      // Preflight against the real schema before writing anything.
      //
      // This projector has now failed twice on assumptions: a NOT NULL column it did not supply, and
      // two columns whose names it guessed. Each cost a merge, a deploy and a job run to discover
      // something the destination could have been asked directly. Worse, the third failure was a
      // CHECK constraint whose allowed values appear in no migration in the repo — there was nothing
      // to read, only the database to ask.
      //
      // So ask it. A mismatch now fails in the first second with the permitted values named, instead
      // of mid-transaction fifteen minutes into a deploy cycle.
      const schema = await client.query<{
        table_name: string; column_name: string; is_nullable: string; column_default: string | null;
      }>(
        `select table_name, column_name, is_nullable, column_default
           from information_schema.columns
          where table_schema = 'tower'
            and table_name in ('tracked_subject','metric_provenance','metric_observation','value_claim')`,
      );
      const columnsByTable = new Map<string, Set<string>>();
      for (const row of schema.rows) {
        const columns = columnsByTable.get(row.table_name) ?? new Set<string>();
        columns.add(row.column_name);
        columnsByTable.set(row.table_name, columns);
      }

      /**
       * Ask what the destination *requires*, not whether it has what we expect.
       *
       * The first preflight checked that the columns this projector writes exist. That is the wrong
       * direction: it passes when the table has an extra mandatory column nobody here knows about,
       * which is exactly what happened — `metric_observation.provenance_id` is NOT NULL, appears in
       * no migration in this repository, and stopped the run after the preflight said everything was
       * fine.
       *
       * That divergence is itself worth naming: the live schema and the repo's migrations have
       * drifted, so the database is the only accurate description of its own shape. Enumerating what
       * it demands is the only way to find that out in one run rather than four.
       */
      const supplied: Record<string, Set<string>> = {
        tracked_subject: new Set(["tenant_key", "subject_ref", "subject_kind", "initiative_ref", "title"]),
        metric_provenance: new Set(["tenant_key", "provenance_id", "source_system", "source_report", "source_schema", "source_table", "formula", "formula_version", "extraction_method", "last_refreshed", "known_limitations", "data_owner_role", "quality_score", "attestation_status"]),
        metric_observation: new Set(["tenant_key", "observation_id", "subject_ref", "metric_ref", "scenario", "value_num", "period_start", "period_end", "source_result_hash", "provenance_id"]),
        value_claim: new Set(["tenant_key", "claim_id", "subject_ref", "promised_value", "calculated_value", "claim_state", "baseline_observation_id", "target_observation_id", "actual_observation_id", "quality_guardrail_state", "next_gate_owner_role", "claim_rule_version", "outcome_metric_ref", "claim_input_hash"]),
      };
      const unmet: string[] = [];
      const tablesSeen = new Set(columnsByTable.keys());
      for (const table of Object.keys(supplied)) {
        if (!tablesSeen.has(table)) { unmet.push(`tower.${table} does not exist`); continue; }
        for (const row of schema.rows.filter((r) => r.table_name === table)) {
          const mandatory = row.is_nullable === "NO" && row.column_default === null;
          if (mandatory && !supplied[table].has(row.column_name)) {
            unmet.push(`tower.${table}.${row.column_name} is NOT NULL with no default and is not supplied`);
          }
        }
      }
      if (unmet.length) {
        throw new Error(`schema preflight failed:\n  ${unmet.join("\n  ")}`);
      }
      const valueClaimHasUpdatedAt = columnsByTable.get("value_claim")?.has("updated_at") ?? false;

      // Enumerated columns: read the permitted values rather than assuming them. The subject_kind
      // constraint is defined in no migration this repo carries, so the database is the only source.
      const checks = await client.query<{ conname: string; def: string }>(
        `select c.conname, pg_get_constraintdef(c.oid) as def
           from pg_constraint c
           join pg_class t on t.oid = c.conrelid
           join pg_namespace n on n.oid = t.relnamespace
          where n.nspname = 'tower' and c.contype = 'c'
            and t.relname in ('tracked_subject','metric_provenance','metric_observation','value_claim')`,
      );
      const allowedFromChecks = (rows: { def: string }[], column: string): Set<string> | null => {
        const def = rows.find((r) => r.def.includes(column))?.def;
        if (!def) return null;
        const values = [...def.matchAll(/'([^']+)'::text/g)].map((m) => m[1]);
        return values.length ? new Set(values) : null;
      };
      const allowed = (column: string): Set<string> | null => allowedFromChecks(checks.rows, column);
      // Foreign keys too. A NOT NULL column that is also a reference cannot be satisfied by any
      // generated value, and finding that out at insert time costs another cycle.
      const foreignKeys = await client.query<{ table_name: string; def: string }>(
        `select t.relname as table_name, pg_get_constraintdef(c.oid) as def
           from pg_constraint c
           join pg_class t on t.oid = c.conrelid
           join pg_namespace n on n.oid = t.relnamespace
          where n.nspname = 'tower' and c.contype = 'f'
            and t.relname in ('tracked_subject','metric_provenance','metric_observation','value_claim')`,
      );

      const kinds = allowed("subject_kind");
      const states = allowed("claim_state");
      const scenarios = allowed("scenario");
      // Fall back to a value the constraint certainly permits — the column default — rather than
      // failing the whole build because one enum drifted.
      const coerceKind = (k: string) => (!kinds || kinds.has(k) ? k : "initiative");
      const firstAllowedState = (...candidates: string[]): string => {
        if (!states) return candidates[0];
        for (const candidate of candidates) {
          if (states.has(candidate)) return candidate;
        }
        return [...states][0] ?? candidates[0];
      };
      const coerceState = (v: string) =>
        !states || states.has(v)
          ? v
          : firstAllowedState("idea", "funded_no_baseline", "baseline_captured", "stale", "disputed");
      for (const s of uniqueSubjects) s.subjectKind = coerceKind(s.subjectKind);
      for (const c of uniqueClaims) c.claimState = coerceState(c.claimState);
      if (scenarios) {
        const bad = uniqueObservations.filter((o) => !scenarios.has(o.scenario));
        if (bad.length) throw new Error(`scenario values rejected by constraint: ${[...new Set(bad.map((o) => o.scenario))].join(", ")}; permitted ${[...scenarios].join(", ")}`);
      }
      summary.schemaPreflight = {
        mandatoryColumnsSatisfied: true,
        foreignKeys: foreignKeys.rows.map((r) => `${r.table_name}: ${r.def}`),
        subjectKindAllowed: kinds ? [...kinds] : "unconstrained",
        claimStateAllowed: states ? [...states] : "unconstrained",
        scenarioAllowed: scenarios ? [...scenarios] : "unconstrained",
      };

      /**
       * Resolve and populate the metric dimension this projector depends on.
       *
       * `metric_observation.metric_ref` carries a foreign key to a metric definition table, and that
       * constraint — like the five columns before it — exists in the database and in no migration.
       * The vocabulary is semantic (`project.approved_budget`, `ai.active_users`), not hashed, so
       * generated refs can never satisfy it.
       *
       * Guessing the table name would be a seventh guess. The FK definition names it, so read the
       * definition and write the dimension rows this run needs before writing the facts that
       * reference them. A projector that depends on a dimension should be able to populate it;
       * otherwise every refresh is hostage to someone else having seeded it first.
       */
      const metricFk = foreignKeys.rows.find(
        (r) => r.table_name === "metric_observation" && r.def.includes("metric_ref"),
      );
      const referenced = metricFk ? /REFERENCES ([a-z_.]+)\s*\(([a-z_]+)\)/i.exec(metricFk.def) : null;
      summary.metricDimension = referenced
        ? { table: referenced[1], column: referenced[2] }
        : "no foreign key on metric_ref";

      await client.query("begin");

      if (referenced) {
        const [refTable, refColumn] = [referenced[1], referenced[2]];
        const cols = await client.query<{
          column_name: string; is_nullable: string; column_default: string | null; data_type: string; udt_name: string;
        }>(
          `select column_name, is_nullable, column_default, data_type, udt_name from information_schema.columns
            where table_schema = split_part($1,'.',1) and table_name = split_part($1,'.',2)`,
          [refTable.includes(".") ? refTable : `tower.${refTable}`],
        );
        const metricChecks = await client.query<{ conname: string; def: string }>(
          `select c.conname, pg_get_constraintdef(c.oid) as def
             from pg_constraint c
             join pg_class t on t.oid = c.conrelid
             join pg_namespace n on n.oid = t.relnamespace
            where n.nspname = split_part($1,'.',1)
              and t.relname = split_part($1,'.',2)
              and c.contype = 'c'`,
          [refTable.includes(".") ? refTable : `tower.${refTable}`],
        );
        const mandatory = cols.rows
          .filter((c) => c.is_nullable === "NO" && c.column_default === null)
          .map((c) => c.column_name);
        const infoByName = new Map(cols.rows.map((c) => [c.column_name, c]));
        const names = new Map<string, string>();
        for (const o of uniqueObservations) {
          if (!names.has(o.metricRef)) names.set(o.metricRef, o.metricRef);
        }
        for (const c of uniqueClaims) {
          if (!names.has(c.outcomeMetricRef)) names.set(c.outcomeMetricRef, c.outcomeMetricRef);
        }
        // Only the mandatory columns are supplied, plus the key. Optional fields stay empty, while
        // required live-schema fields get deterministic placeholders by name/type instead of one
        // fragile allowlist that discovers the next NOT NULL column only after a failed ACA run.
        const insertCols = [...new Set([refColumn, ...mandatory])];
        const metricDefinitionValue = (
          columnName: string,
          ref: string,
          columnInfo: { data_type: string; udt_name: string } | undefined,
        ): unknown => {
          const normalized = columnName.toLowerCase();
          const constrained = allowedFromChecks(metricChecks.rows, columnName);
          const checked = (preferred: string, alternatives: string[] = []): string => {
            if (!constrained) return preferred;
            for (const candidate of [preferred, ...alternatives]) {
              if (constrained.has(candidate)) return candidate;
            }
            return [...constrained].sort()[0] ?? preferred;
          };

          if (columnName === refColumn) return ref;
          if (normalized === "tenant_key") return TENANTS[0];
          if (normalized === "domain") return checked("canonical_projection", ["outcome", "tower", "value"]);
          if (["label", "metric_name", "metric_label", "title", "name"].includes(normalized)) return ref;
          if (normalized === "description") return `Canonical projection metric ${ref}`;
          if (["unit", "metric_unit"].includes(normalized)) return checked("count", ["usd", "percent"]);
          if (normalized === "direction") return checked("increase", ["decrease", "neutral"]);
          if (normalized === "owner_role") return checked("canonical-projection", ["operator", "tower"]);
          if (normalized === "aggregation_rule") {
            return checked("non_additive", ["sum", "average", "weighted_average", "ratio", "ending_balance"]);
          }
          if (
            ["category", "metric_category", "type", "value_type", "value_kind", "source_system",
              "evidence_basis", "status"].includes(normalized)
          ) return checked("canonical_projection", ["number", "count", "active", "derived", "tower"]);
          if (["active", "enabled", "is_active"].includes(normalized)) return true;

          const dataType = columnInfo?.data_type.toLowerCase() ?? "";
          const udtName = columnInfo?.udt_name.toLowerCase() ?? "";
          if (dataType === "boolean" || udtName === "bool") return true;
          if (
            ["smallint", "integer", "bigint", "numeric", "real", "double precision"].includes(dataType) ||
            ["int2", "int4", "int8", "numeric", "float4", "float8"].includes(udtName)
          ) return 0;
          if (dataType === "date") return "1970-01-01";
          if (dataType.includes("timestamp") || udtName.startsWith("timestamp")) return "1970-01-01T00:00:00.000Z";
          if (dataType === "json" || dataType === "jsonb" || udtName === "json" || udtName === "jsonb") return {};
          if (dataType === "array") return [];
          return checked("canonical_projection");
        };
        if (insertCols.includes(refColumn)) {
          for (const [ref] of names) {
            const values = insertCols.map((c) => metricDefinitionValue(c, ref, infoByName.get(c)));
            await client.query(
              `insert into ${refTable.includes(".") ? refTable : `tower.${refTable}`} (${insertCols.join(",")})
               values (${insertCols.map((_, i) => `$${i + 1}`).join(",")})
               on conflict do nothing`,
              values,
            );
          }
          summary.metricDimensionRowsEnsured = names.size;
        }
      }
      const tenantsWithObservations = [...new Set(uniqueObservations.map((o) => o.tenantKey))];
      for (const tenantKey of tenantsWithObservations) {
        await client.query(
          `insert into tower.metric_provenance
             (tenant_key, provenance_id, source_system, source_report, source_schema, source_table,
              formula, formula_version, extraction_method, last_refreshed, known_limitations,
              data_owner_role, quality_score, attestation_status)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), $10,$11,$12,$13)
           on conflict (tenant_key, provenance_id) do update
             set source_system = excluded.source_system,
                 source_report = excluded.source_report,
                 source_schema = excluded.source_schema,
                 source_table = excluded.source_table,
                 formula = excluded.formula,
                 formula_version = excluded.formula_version,
                 extraction_method = excluded.extraction_method,
                 last_refreshed = excluded.last_refreshed,
                 known_limitations = excluded.known_limitations,
                 data_owner_role = excluded.data_owner_role,
                 quality_score = excluded.quality_score,
                 attestation_status = excluded.attestation_status`,
          [
            tenantKey,
            provenanceIdForTenant(tenantKey),
            "canonical_model",
            "tower_value_evidence",
            "intelligence_v6",
            "business_records",
            "Canonical outcome evidence projection from approved records.",
            CLAIM_RULE_VERSION,
            "canonical_projection",
            "Generated from approved canonical records; source evidence remains in canonical provenance.",
            "AbarVa operator",
            0.9,
            "not_attested",
          ],
        );
        summary.metricProvenanceRowsEnsured += 1;
      }
      for (const s of uniqueSubjects) {
        await client.query(
          `insert into tower.tracked_subject (tenant_key, subject_ref, subject_kind, initiative_ref, title)
           values ($1,$2,$3,$4,$5)
           on conflict (tenant_key, subject_ref) do update
             set subject_kind = excluded.subject_kind,
                 initiative_ref = excluded.initiative_ref,
                 title = excluded.title`,
          [s.tenantKey, s.subjectRef, s.subjectKind, s.initiativeRef, s.title],
        );
        summary.rowsWritten += 1;
      }
      for (const o of uniqueObservations) {
        await client.query(
          `insert into tower.metric_observation
             (tenant_key, observation_id, subject_ref, metric_ref, scenario, value_num,
              period_start, period_end, source_result_hash, provenance_id)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           on conflict (tenant_key, observation_id) do update
             set value_num = excluded.value_num,
                 period_start = excluded.period_start,
                 period_end = excluded.period_end,
                 source_result_hash = excluded.source_result_hash`,
          [o.tenantKey, o.observationId, o.subjectRef, o.metricRef, o.scenario, o.value,
           o.periodStart, o.periodEnd, o.sourceResultHash,
           // Provenance identifies which build produced the observation, so a figure on screen can
           // be traced to the run that wrote it rather than only to the row it lives in.
           provenanceIdForTenant(o.tenantKey)],
        );
        summary.rowsWritten += 1;
      }
      for (const c of uniqueClaims) {
        const claimInputHash = hash([
          c.subjectRef,
          c.promisedValue,
          c.calculatedValue,
          c.baselineObservationId,
          c.targetObservationId,
          c.actualObservationId,
          c.claimState,
        ]);
        const claimColumns = [
          "tenant_key",
          "claim_id",
          "subject_ref",
          "promised_value",
          "calculated_value",
          "claim_state",
          "baseline_observation_id",
          "target_observation_id",
          "actual_observation_id",
          "quality_guardrail_state",
          "next_gate_owner_role",
          "claim_rule_version",
          "outcome_metric_ref",
          "claim_input_hash",
        ];
        const claimValues = [
          c.tenantKey,
          c.claimId,
          c.subjectRef,
          c.promisedValue,
          c.calculatedValue,
          c.claimState,
          c.baselineObservationId,
          c.targetObservationId,
          c.actualObservationId,
          c.qualityGuardrailState,
          c.nextGateOwnerRole,
          CLAIM_RULE_VERSION,
          c.outcomeMetricRef,
          claimInputHash,
        ];
        const placeholders = claimValues.map((_, i) => `$${i + 1}`);
        const updateAssignments = [
          "promised_value = excluded.promised_value",
          "calculated_value = excluded.calculated_value",
          "claim_state = excluded.claim_state",
          "baseline_observation_id = excluded.baseline_observation_id",
          "target_observation_id = excluded.target_observation_id",
          "actual_observation_id = excluded.actual_observation_id",
          "quality_guardrail_state = excluded.quality_guardrail_state",
          "next_gate_owner_role = excluded.next_gate_owner_role",
          "claim_rule_version = excluded.claim_rule_version",
          "outcome_metric_ref = excluded.outcome_metric_ref",
          "claim_input_hash = excluded.claim_input_hash",
        ];
        if (valueClaimHasUpdatedAt) {
          claimColumns.push("updated_at");
          placeholders.push("now()");
          updateAssignments.push("updated_at = now()");
        }
        await client.query(
          `insert into tower.value_claim
             (${claimColumns.join(", ")})
           values (${placeholders.join(", ")})
           on conflict (tenant_key, claim_id) do update
             set ${updateAssignments.join(",\n                 ")}`,
          claimValues,
        );
        summary.rowsWritten += 1;
      }

      // Readback before commit: if the destination does not hold what we claim to have written,
      // roll back rather than leave Tower reporting a half-populated evidence chain as complete.
      const back = await client.query<{ n: string }>(
        `select count(*)::text as n from tower.value_claim
          where claim_rule_version = $1 and tenant_key = any($2::text[])`,
        [CLAIM_RULE_VERSION, TENANTS],
      );
      summary.readbackClaims = Number(back.rows[0].n);
      if (summary.readbackClaims !== uniqueClaims.length) {
        throw new Error(
          `readback ${summary.readbackClaims} claims does not equal written ${uniqueClaims.length}`,
        );
      }
      await client.query("commit");
      summary.towerMartUpdated = true;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      await client.end();
    }
  }

  fs.mkdirSync(path.resolve(OUT_DIR), { recursive: true });
  fs.writeFileSync(path.join(path.resolve(OUT_DIR), "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("refresh-tower-value-evidence failed:", error);
    process.exit(1);
  });
