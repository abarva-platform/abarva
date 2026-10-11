import type { PodRateBasis } from "@/lib/pricing/effort-engine/pod-pricer";
import { formatConsultantCents } from "@/lib/programs/value-engine/format-money";
import type { RangePolicyInputs } from "@/lib/pricing/effort-engine/types";
import {
  ROM_DRIVERS,
  ROM_DRIVER_LABELS,
  type RomDriver,
} from "@/lib/pricing/moves-workflow/rom-drivers";
// Types only: the service's rate resolver reaches the data plane, so a client
// surface must never load it. Every number comes from the preview route.
import type {
  RomConfidence,
  RomDesignStatus,
  RomResult,
  RomStructure,
  RomUnitHours,
} from "@/lib/pricing/moves-workflow/rom-service";
import type { AssumptionStatus } from "@/lib/programs/assumption-register/model";
import type { StepDepth } from "@/lib/programs/phase-workflow-registry";
import {
  resolveStepNextAction,
  type StepNextAction,
  type StepRow,
} from "@/lib/programs/step-page-model";

/**
 * P3 Step 4, "Estimate the work bottom-up": the inputs of the bottom-up ROM
 * and the snapshot a person approved.
 *
 * Stored in the P3 `rom_estimate` step record as JSON with an explicit kind
 * marker. The record holds INPUTS only — counts per use case, a reference
 * for each driver's unit hours, the pod, the delivery factors and the
 * release grouping — each with its source and status. Every number the page
 * shows is computed by the ROM service (`rom-service.ts`) through the
 * read-only preview route; nothing here prices, sums or rounds an estimate.
 *
 * No defaults. A driver's unit hours are a REFERENCE: a register assumption
 * (`[A:DL3]`) whose answer supplies the figure once it is confirmed or
 * corrected, or an approved benchmark. An open register row's working figure
 * may feed a PROVISIONAL preview, and the page says so; it never becomes the
 * unit hours. A driver with neither is "Not set", and nothing is computed
 * from it.
 *
 * Approval stores who, when, a fingerprint of the inputs it saw, the unit
 * hours it used, and the computed result. The step is done only while the
 * inputs still match that fingerprint.
 */

export const ROM_ESTIMATE_KIND = "rom_estimate";

/** The singular noun of each driver: "24 h per data source". */
export const ROM_DRIVER_UNITS: Readonly<Record<RomDriver, string>> = {
  data_source_count: "data source",
  source_table_count: "source table",
  standard_data_entity_count: "standard data entity",
  dashboard_view_count: "dashboard view",
  design_row_count: "design row",
  validation_row_count: "validation row",
};

export { ROM_DRIVERS, ROM_DRIVER_LABELS };
export type { RomDriver };

export type RomCountSource =
  | { kind: "team" }
  | { kind: "session_notes"; citation: string; excerpt: string }
  | { kind: "evidence"; citation: string };

/** A use case, or the shared foundation: counts per driver and who confirmed them. */
export interface RomCountBlock {
  code: string;
  name: string;
  counts: Partial<Record<RomDriver, number>>;
  source: RomCountSource;
  /** Drivers a person typed. A notes fill never overwrites them. */
  typed?: RomDriver[];
  confirmedBy?: string;
  confirmedAt?: string;
}

export type RomUnitHoursRef =
  | { kind: "register"; registerId: string }
  | {
      kind: "benchmark";
      benchmarkId: string;
      value: number;
      confidence: RomConfidence;
      approvedBy: string;
      approvedAt: string;
    };

export interface RomPodMember {
  roleCode: string;
  roleLabel: string;
  levelCode: string;
  levelLabel: string;
  fte: number;
  /** A role code proposed from another role name; unapproved until a person approves it. */
  proposedMapping?: { from: string; approvedBy?: string; approvedAt?: string };
  /** The level the rate foundation could price, and why it differs. Informational. */
  levelClamp?: { from: string; reason: string };
}

export interface RomPod {
  /** A pod template code from the pod library, or `members`; never both. */
  templateCode?: string;
  templateName?: string;
  members?: RomPodMember[];
  locationCode: string;
  locationLabel?: string;
  providerClassCode: string | null;
  providerClassLabel?: string;
  rateBasis: PodRateBasis;
}

export interface RomFactor {
  value: number;
  source: string;
}

export interface RomRelease {
  code: string;
  name: string;
  useCaseCodes: string[];
  designStatus: RomDesignStatus;
  /** Required for a designed release: the five range inputs. */
  rangeInputs?: RangePolicyInputs;
  /** The one release the shared foundation is counted in. */
  carriesFoundation?: boolean;
}

export interface RomReleaseGrouping {
  items: RomRelease[];
  source: RomCountSource;
  acceptedBy?: string;
  acceptedAt?: string;
}

export interface RomBlockFigures {
  code: string;
  name: string;
  hours: number;
  weeks: number;
  lowCents: number;
  planCents: number;
  highCents: number;
}

/** What a person approved: the computed result, and the inputs behind it. */
export interface RomSnapshot {
  version: number;
  approvedBy: string;
  approvedAt: string;
  inputsFingerprint: string;
  unitHours: Partial<Record<RomDriver, { value: number; source: string }>>;
  releases: RomBlockFigures[];
  foundation: (RomBlockFigures & { releaseCode: string }) | null;
  combined: Omit<RomBlockFigures, "code" | "name">;
}

export interface RomEstimate {
  kind: typeof ROM_ESTIMATE_KIND;
  version: 1;
  useCases: RomCountBlock[];
  foundation: RomCountBlock | null;
  unitHours: Partial<Record<RomDriver, RomUnitHoursRef>>;
  pod: RomPod | null;
  friction: RomFactor | null;
  productiveShare: RomFactor | null;
  hoursPerFteWeek: RomFactor | null;
  releases: RomReleaseGrouping | null;
  approval: RomSnapshot | null;
  /** How many snapshots were ever approved; the next one is this + 1. */
  snapshotsIssued: number;
}

export function emptyRomEstimate(): RomEstimate {
  return {
    kind: ROM_ESTIMATE_KIND,
    version: 1,
    useCases: [],
    foundation: null,
    unitHours: {},
    pod: null,
    friction: null,
    productiveShare: null,
    hoursPerFteWeek: null,
    releases: null,
    approval: null,
    snapshotsIssued: 0,
  };
}

// ── Parsing ─────────────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
function text(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const CONFIDENCES: readonly RomConfidence[] = ["low", "medium", "high"];
const BASES: readonly PodRateBasis[] = [
  "loaded_cost",
  "scarcity_adjusted_cost",
  "bill_rate",
];
const isDriver = (v: unknown): v is RomDriver =>
  (ROM_DRIVERS as readonly unknown[]).includes(v);

function parseSource(v: unknown): RomCountSource {
  if (isObj(v) && v.kind === "session_notes" && text(v.citation)) {
    return {
      kind: "session_notes",
      citation: text(v.citation) as string,
      excerpt: text(v.excerpt) ?? "",
    };
  }
  if (isObj(v) && v.kind === "evidence" && text(v.citation)) {
    return { kind: "evidence", citation: text(v.citation) as string };
  }
  return { kind: "team" };
}

function parseCounts(v: unknown): Partial<Record<RomDriver, number>> {
  const out: Partial<Record<RomDriver, number>> = {};
  if (!isObj(v)) return out;
  for (const driver of ROM_DRIVERS) {
    const n = v[driver];
    if (finite(n) && n >= 0 && Number.isInteger(n)) out[driver] = n;
  }
  return out;
}

function parseBlock(v: unknown): RomCountBlock | null {
  if (!isObj(v)) return null;
  const code = text(v.code);
  const name = text(v.name);
  if (!code || !name) return null;
  const typed = Array.isArray(v.typed) ? v.typed.filter(isDriver) : [];
  return {
    code,
    name,
    counts: parseCounts(v.counts),
    source: parseSource(v.source),
    ...(typed.length ? { typed } : {}),
    ...(text(v.confirmedBy) && text(v.confirmedAt)
      ? {
          confirmedBy: text(v.confirmedBy),
          confirmedAt: text(v.confirmedAt),
        }
      : {}),
  };
}

function parseRef(v: unknown): RomUnitHoursRef | null {
  if (!isObj(v)) return null;
  if (v.kind === "register" && text(v.registerId)) {
    return { kind: "register", registerId: text(v.registerId) as string };
  }
  if (
    v.kind === "benchmark" &&
    text(v.benchmarkId) &&
    finite(v.value) &&
    v.value >= 0 &&
    CONFIDENCES.includes(v.confidence as RomConfidence) &&
    text(v.approvedBy) &&
    text(v.approvedAt)
  ) {
    return {
      kind: "benchmark",
      benchmarkId: text(v.benchmarkId) as string,
      value: v.value,
      confidence: v.confidence as RomConfidence,
      approvedBy: text(v.approvedBy) as string,
      approvedAt: text(v.approvedAt) as string,
    };
  }
  return null;
}

function parseMember(v: unknown): RomPodMember | null {
  if (!isObj(v)) return null;
  const roleCode = text(v.roleCode);
  const levelCode = text(v.levelCode);
  if (!roleCode || !levelCode || !finite(v.fte) || v.fte < 0) return null;
  const mapping = isObj(v.proposedMapping) ? v.proposedMapping : null;
  const clamp = isObj(v.levelClamp) ? v.levelClamp : null;
  return {
    roleCode,
    roleLabel: text(v.roleLabel) ?? roleCode,
    levelCode,
    levelLabel: text(v.levelLabel) ?? levelCode,
    fte: v.fte,
    ...(mapping && text(mapping.from)
      ? {
          proposedMapping: {
            from: text(mapping.from) as string,
            ...(text(mapping.approvedBy) && text(mapping.approvedAt)
              ? {
                  approvedBy: text(mapping.approvedBy),
                  approvedAt: text(mapping.approvedAt),
                }
              : {}),
          },
        }
      : {}),
    ...(clamp && text(clamp.from) && text(clamp.reason)
      ? {
          levelClamp: {
            from: text(clamp.from) as string,
            reason: text(clamp.reason) as string,
          },
        }
      : {}),
  };
}

function parsePod(v: unknown): RomPod | null {
  if (!isObj(v)) return null;
  const locationCode = text(v.locationCode);
  if (!locationCode || !BASES.includes(v.rateBasis as PodRateBasis)) {
    return null;
  }
  const templateCode = text(v.templateCode);
  const members = Array.isArray(v.members)
    ? v.members.map(parseMember).filter((m): m is RomPodMember => m !== null)
    : [];
  if (Boolean(templateCode) === members.length > 0) return null;
  return {
    ...(templateCode ? { templateCode } : { members }),
    ...(templateCode && text(v.templateName)
      ? { templateName: text(v.templateName) }
      : {}),
    locationCode,
    ...(text(v.locationLabel) ? { locationLabel: text(v.locationLabel) } : {}),
    providerClassCode: text(v.providerClassCode) ?? null,
    ...(text(v.providerClassLabel)
      ? { providerClassLabel: text(v.providerClassLabel) }
      : {}),
    rateBasis: v.rateBasis as PodRateBasis,
  };
}

function parseFactor(v: unknown): RomFactor | null {
  if (!isObj(v) || !finite(v.value) || !text(v.source)) return null;
  return { value: v.value, source: text(v.source) as string };
}

const TIERS = ["low", "medium", "high"];
function parseRange(v: unknown): RangePolicyInputs | undefined {
  if (
    !isObj(v) ||
    !TIERS.includes(v.scopeMaturity as string) ||
    !TIERS.includes(v.evidenceQuality as string) ||
    !TIERS.includes(v.deliveryNovelty as string) ||
    !TIERS.includes(v.quantityUncertainty as string) ||
    !finite(v.rateCardCoveragePct)
  ) {
    return undefined;
  }
  return {
    scopeMaturity: v.scopeMaturity as RangePolicyInputs["scopeMaturity"],
    evidenceQuality: v.evidenceQuality as RangePolicyInputs["evidenceQuality"],
    deliveryNovelty: v.deliveryNovelty as RangePolicyInputs["deliveryNovelty"],
    quantityUncertainty:
      v.quantityUncertainty as RangePolicyInputs["quantityUncertainty"],
    rateCardCoveragePct: v.rateCardCoveragePct,
  };
}

function parseRelease(v: unknown): RomRelease | null {
  if (!isObj(v)) return null;
  const code = text(v.code);
  const name = text(v.name);
  const designStatus = v.designStatus;
  if (
    !code ||
    !name ||
    (designStatus !== "designed" && designStatus !== "not_designed")
  ) {
    return null;
  }
  const rangeInputs = parseRange(v.rangeInputs);
  return {
    code,
    name,
    useCaseCodes: Array.isArray(v.useCaseCodes)
      ? v.useCaseCodes.map(text).filter((c): c is string => Boolean(c))
      : [],
    designStatus,
    ...(rangeInputs ? { rangeInputs } : {}),
    ...(v.carriesFoundation === true ? { carriesFoundation: true } : {}),
  };
}

function parseFigures(v: unknown): RomBlockFigures | null {
  if (!isObj(v) || !text(v.code) || !text(v.name)) return null;
  const nums = ["hours", "weeks", "lowCents", "planCents", "highCents"];
  if (!nums.every((k) => finite(v[k]))) return null;
  return {
    code: text(v.code) as string,
    name: text(v.name) as string,
    hours: v.hours as number,
    weeks: v.weeks as number,
    lowCents: v.lowCents as number,
    planCents: v.planCents as number,
    highCents: v.highCents as number,
  };
}

function parseSnapshot(v: unknown): RomSnapshot | null {
  if (!isObj(v)) return null;
  const approvedBy = text(v.approvedBy);
  const approvedAt = text(v.approvedAt);
  const fingerprint = text(v.inputsFingerprint);
  const combined = isObj(v.combined)
    ? parseFigures({ ...v.combined, code: "combined", name: "combined" })
    : null;
  if (
    !finite(v.version) ||
    !approvedBy ||
    !approvedAt ||
    !fingerprint ||
    !combined ||
    !Array.isArray(v.releases)
  ) {
    return null;
  }
  const unitHours: RomSnapshot["unitHours"] = {};
  if (isObj(v.unitHours)) {
    for (const driver of ROM_DRIVERS) {
      const u = v.unitHours[driver];
      if (isObj(u) && finite(u.value) && text(u.source)) {
        unitHours[driver] = {
          value: u.value,
          source: text(u.source) as string,
        };
      }
    }
  }
  const foundation =
    isObj(v.foundation) && text(v.foundation.releaseCode)
      ? parseFigures(v.foundation)
      : null;
  return {
    version: v.version,
    approvedBy,
    approvedAt,
    inputsFingerprint: fingerprint,
    unitHours,
    releases: v.releases
      .map(parseFigures)
      .filter((r): r is RomBlockFigures => r !== null),
    foundation:
      foundation && isObj(v.foundation)
        ? {
            ...foundation,
            releaseCode: text(v.foundation.releaseCode) as string,
          }
        : null,
    combined: {
      hours: combined.hours,
      weeks: combined.weeks,
      lowCents: combined.lowCents,
      planCents: combined.planCents,
      highCents: combined.highCents,
    },
  };
}

export function parseRomEstimate(
  raw: string | null | undefined,
): RomEstimate | null {
  const value = (raw ?? "").trim();
  if (!value.startsWith("{")) return null;
  let o: unknown;
  try {
    o = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isObj(o) || o.kind !== ROM_ESTIMATE_KIND || o.version !== 1) {
    return null;
  }
  const seen = new Set<string>();
  const useCases = (Array.isArray(o.useCases) ? o.useCases : [])
    .map(parseBlock)
    .filter((b): b is RomCountBlock => {
      if (!b || seen.has(b.code)) return false;
      seen.add(b.code);
      return true;
    });
  const unitHours: RomEstimate["unitHours"] = {};
  if (isObj(o.unitHours)) {
    for (const driver of ROM_DRIVERS) {
      const ref = parseRef(o.unitHours[driver]);
      if (ref) unitHours[driver] = ref;
    }
  }
  const releases =
    isObj(o.releases) && Array.isArray(o.releases.items)
      ? {
          items: o.releases.items
            .map(parseRelease)
            .filter((r): r is RomRelease => r !== null),
          source: parseSource(o.releases.source),
          ...(text(o.releases.acceptedBy) && text(o.releases.acceptedAt)
            ? {
                acceptedBy: text(o.releases.acceptedBy),
                acceptedAt: text(o.releases.acceptedAt),
              }
            : {}),
        }
      : null;
  return {
    kind: ROM_ESTIMATE_KIND,
    version: 1,
    useCases,
    foundation: parseBlock(o.foundation),
    unitHours,
    pod: parsePod(o.pod),
    friction: parseFactor(o.friction),
    productiveShare: parseFactor(o.productiveShare),
    hoursPerFteWeek: parseFactor(o.hoursPerFteWeek),
    releases,
    approval: parseSnapshot(o.approval),
    snapshotsIssued:
      finite(o.snapshotsIssued) && o.snapshotsIssued >= 0
        ? o.snapshotsIssued
        : 0,
  };
}

export function serializeRomEstimate(value: RomEstimate): string {
  return JSON.stringify(value);
}

// ── The inputs fingerprint ──────────────────────────────────────────────────

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isObj(value)) {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * A stable fingerprint of everything approval depends on: every input and
 * its status, never the approval itself. FNV-1a over the canonical JSON.
 */
export function romInputsFingerprint(record: RomEstimate): string {
  const inputs: Partial<RomEstimate> = { ...record };
  delete inputs.approval;
  delete inputs.snapshotsIssued;
  const body = canonical(inputs);
  let hash = 0x811c9dc5;
  for (let i = 0; i < body.length; i += 1) {
    hash ^= body.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a:${hash.toString(16).padStart(8, "0")}:${body.length}`;
}

// ── The register, as unit hours read it ─────────────────────────────────────

/** The register fields this step reads (`GET /api/v1/programs/:id/assumptions`). */
export interface RomRegisterRow {
  registerId: string;
  status: AssumptionStatus;
  statement: string;
  whyItMatters: string | null;
  workingFigure: string | null;
  workingValue: number | null;
  source: string;
  confidence: number;
  ownerRole: string;
  answer: string | null;
  answerFigure: string | null;
  answerValue: number | null;
  answerSource: string | null;
}

const CONFIDENCE_BY_SCORE: Readonly<Record<number, RomConfidence>> = {
  1: "low",
  3: "medium",
  5: "high",
};

export type RomUnitHoursState =
  /** A figure the estimate may use. */
  | {
      state: "confirmed";
      value: number;
      confidence: RomConfidence;
      /** `[A:DL1] confirmed · Delivery lead`, or `Approved benchmark BM-ENT-01`. */
      sourceLabel: string;
      registerId?: string;
    }
  /** A register row still open: its working figure may only feed a provisional preview. */
  | {
      state: "open";
      registerId: string;
      ownerRole: string;
      workingFigure: string | null;
      workingValue: number | null;
      confidence: RomConfidence;
    }
  /** A reference that can supply nothing: proposed, superseded, rejected, gone, or no number. */
  | {
      state: "unusable";
      registerId: string;
      reason: "proposed" | "superseded" | "rejected" | "missing" | "no_value";
    }
  | { state: "unset" }
  /** The register could not be read, so the reference cannot be resolved. */
  | { state: "unread"; registerId: string };

export function resolveRomUnitHours(
  ref: RomUnitHoursRef | undefined,
  register: readonly RomRegisterRow[] | null,
): RomUnitHoursState {
  if (!ref) return { state: "unset" };
  if (ref.kind === "benchmark") {
    return {
      state: "confirmed",
      value: ref.value,
      confidence: ref.confidence,
      sourceLabel: `Approved benchmark ${ref.benchmarkId}`,
    };
  }
  if (register === null) return { state: "unread", registerId: ref.registerId };
  const row = register.find((r) => r.registerId === ref.registerId);
  if (!row) {
    return { state: "unusable", registerId: ref.registerId, reason: "missing" };
  }
  const confidence = CONFIDENCE_BY_SCORE[row.confidence] ?? "low";
  if (row.status === "confirmed" || row.status === "corrected") {
    // A correction replaces the working figure; a confirmation keeps it
    // unless the answer restated it.
    const value =
      row.status === "corrected"
        ? row.answerValue
        : (row.answerValue ?? row.workingValue);
    if (value === null || !Number.isFinite(value) || value < 0) {
      return {
        state: "unusable",
        registerId: row.registerId,
        reason: "no_value",
      };
    }
    return {
      state: "confirmed",
      value,
      confidence,
      sourceLabel: `[A:${row.registerId}] ${row.status} · ${row.ownerRole}`,
      registerId: row.registerId,
    };
  }
  if (row.status === "open") {
    return {
      state: "open",
      registerId: row.registerId,
      ownerRole: row.ownerRole,
      workingFigure: row.workingFigure,
      workingValue: row.workingValue,
      confidence,
    };
  }
  return {
    state: "unusable",
    registerId: row.registerId,
    reason: row.status,
  };
}

/** Drivers that anything counts above zero, in display order. */
export function countedDrivers(record: RomEstimate): RomDriver[] {
  const blocks = [
    ...record.useCases,
    ...(record.foundation ? [record.foundation] : []),
  ];
  return ROM_DRIVERS.filter((d) => blocks.some((b) => (b.counts[d] ?? 0) > 0));
}

/** Register ids this estimate relies on: unit-hour references, then `[A:id]` cites in factor sources. */
export function romReliedRegisterIds(record: RomEstimate): string[] {
  const ids: string[] = [];
  for (const driver of ROM_DRIVERS) {
    const ref = record.unitHours[driver];
    if (ref?.kind === "register") ids.push(ref.registerId);
  }
  for (const factor of [
    record.friction,
    record.productiveShare,
    record.hoursPerFteWeek,
  ]) {
    for (const match of factor?.source.matchAll(/\[A:([A-Z]{1,2}\d+)\]/g) ??
      []) {
      ids.push(match[1]);
    }
  }
  return [...new Set(ids)];
}

// ── Categories, rows and the next action ────────────────────────────────────

export interface RomGroupingProblem {
  unassigned: string[];
  inTwo: string[];
  /** The foundation exists but no release, or more than one, carries it. */
  foundationCarriers: number | null;
}

export function releaseGroupingProblem(
  record: RomEstimate,
): RomGroupingProblem | null {
  const items = record.releases?.items ?? [];
  const seen = new Map<string, number>();
  for (const r of items) {
    for (const code of r.useCaseCodes)
      seen.set(code, (seen.get(code) ?? 0) + 1);
  }
  const unassigned = record.useCases
    .map((u) => u.code)
    .filter((c) => !seen.has(c));
  const inTwo = [...seen.entries()].filter(([, n]) => n > 1).map(([c]) => c);
  const carriers = items.filter((r) => r.carriesFoundation).length;
  const foundationCarriers =
    record.foundation && carriers !== 1
      ? carriers
      : !record.foundation && carriers > 0
        ? carriers
        : null;
  return unassigned.length || inTwo.length || foundationCarriers !== null
    ? { unassigned, inTwo, foundationCarriers }
    : null;
}

export interface RomCategories {
  counts: boolean;
  unitHours: boolean;
  pod: boolean;
  releases: boolean;
  /** Friction, productive share and hours per FTE-week, each with a source. Not one of the four. */
  factors: boolean;
}

export function unapprovedMappings(record: RomEstimate): RomPodMember[] {
  return (record.pod?.members ?? []).filter(
    (m) => m.proposedMapping && !m.proposedMapping.approvedAt,
  );
}

export function romCategories(
  record: RomEstimate,
  register: readonly RomRegisterRow[] | null,
): RomCategories {
  const blocks = [
    ...record.useCases,
    ...(record.foundation ? [record.foundation] : []),
  ];
  const counted = countedDrivers(record);
  return {
    counts:
      record.useCases.length > 0 && blocks.every((b) => Boolean(b.confirmedAt)),
    unitHours:
      counted.length > 0 &&
      counted.every(
        (d) =>
          resolveRomUnitHours(record.unitHours[d], register).state ===
          "confirmed",
      ),
    pod: record.pod !== null && unapprovedMappings(record).length === 0,
    releases:
      (record.releases?.items.length ?? 0) > 0 &&
      Boolean(record.releases?.acceptedAt) &&
      releaseGroupingProblem(record) === null,
    factors:
      record.friction !== null &&
      record.productiveShare !== null &&
      record.hoursPerFteWeek !== null,
  };
}

/** "{n} of 4 inputs confirmed": counts, unit hours, the pod mapping, the releases. */
export function romConfirmedInputCount(categories: RomCategories): number {
  return [
    categories.counts,
    categories.unitHours,
    categories.pod,
    categories.releases,
  ].filter(Boolean).length;
}

/** The unconfirmed categories, as "Provisional until …" names them. */
export function romProvisionalBecause(categories: RomCategories): string[] {
  return [
    !categories.counts && "counts",
    !categories.unitHours && "unit hours",
    !categories.pod && "the pod mapping",
    !categories.releases && "the release grouping",
    !categories.factors && "the delivery factors",
  ].filter((c): c is string => Boolean(c));
}

function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "Provisional until counts, unit hours and the pod mapping are confirmed." */
export function provisionalSentence(because: readonly string[]): string | null {
  if (!because.length) return null;
  return `Provisional until ${joinAnd(because)} ${because.length > 1 ? "are" : "is"} confirmed.`;
}

/** The approval stands: approved, inputs unchanged, and (when readable) the same unit hours. */
export function isRomApprovalCurrent(
  record: RomEstimate,
  register?: readonly RomRegisterRow[] | null,
): boolean {
  const approval = record.approval;
  if (!approval) return false;
  if (approval.inputsFingerprint !== romInputsFingerprint(record)) return false;
  if (!register) return true;
  return countedDrivers(record).every((d) => {
    const now = resolveRomUnitHours(record.unitHours[d], register);
    return (
      now.state === "confirmed" && approval.unitHours[d]?.value === now.value
    );
  });
}

/** Step 4 is done: approved, and nothing it was approved on has changed. */
export function isRomEstimateDone(record: RomEstimate | null): boolean {
  return record !== null && isRomApprovalCurrent(record);
}

export type RomRowId = "CNT" | "UNIT" | "POD" | "FAC" | "REL";

/** A null register that is not a failed read. */
export type RomRegisterUnreadReason = "loading" | "withheld";

/** One row's place in the page: its group, and its clause or draft name. */
export interface RomRowState extends StepRow {
  id: RomRowId;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Each input row's state and clause, in row order. The page renders these
 * rows; the next action reads the same states, so a clause can never name a
 * row the page shows as settled.
 */
export function romRowStates(
  record: RomEstimate,
  register: readonly RomRegisterRow[] | null,
  /**
   * Why `register` is null when it is not a failed read: still loading, or
   * withheld from a viewer without financial visibility.
   */
  unreadBecause?: RomRegisterUnreadReason,
): RomRowState[] {
  const categories = romCategories(record, register);
  const rows: RomRowState[] = [];

  const openUseCases = record.useCases.filter((u) => !u.confirmedAt);
  const foundationOpen = Boolean(
    record.foundation && !record.foundation.confirmedAt,
  );
  const countParts = [
    openUseCases.length ? plural(openUseCases.length, "use case") : null,
    foundationOpen ? "the shared foundation" : null,
  ].filter((p): p is string => Boolean(p));
  rows.push({
    id: "CNT",
    rank: 1,
    subject: categories.counts
      ? "What each use case builds"
      : "Confirm what each use case builds",
    state: categories.counts ? "settled" : "decision",
    clause: record.useCases.length
      ? `confirm counts for ${countParts.join(" and ")}`
      : "add the use cases and their counts",
  });

  const counted = countedDrivers(record);
  const states = counted.map((d) => ({
    driver: d,
    resolved: resolveRomUnitHours(record.unitHours[d], register),
  }));
  const open = states.filter((s) => s.resolved.state === "open");
  const unread = states.some((s) => s.resolved.state === "unread");
  const unsourced = states.filter(
    (s) => s.resolved.state === "unset" || s.resolved.state === "unusable",
  );
  const unitParts = [
    open.length
      ? `answer ${joinAnd(open.map((s) => `A:${(s.resolved as { registerId: string }).registerId}`))} to set ${joinAnd(open.map((s) => ROM_DRIVER_UNITS[s.driver]))} hours`
      : null,
    unsourced.length
      ? `source the ${joinAnd(unsourced.map((s) => ROM_DRIVER_UNITS[s.driver]))} hours`
      : null,
  ].filter((p): p is string => Boolean(p));
  rows.push({
    id: "UNIT",
    rank: 2,
    subject: categories.unitHours
      ? "Hours behind each component"
      : "Set the hours behind each component",
    state: categories.unitHours ? "settled" : "decision",
    clause: unread
      ? unreadBecause === "loading"
        ? "check the unit hours once the register loads"
        : unreadBecause === "withheld"
          ? "ask someone with financial visibility to confirm the unit hours"
          : "read the assumptions register again"
      : unitParts.length
        ? unitParts.join(" and ")
        : "count something before setting unit hours",
  });

  const mappings = unapprovedMappings(record).length;
  rows.push({
    id: "POD",
    rank: 3,
    subject: record.pod ? "Delivery pod" : "Set the delivery pod",
    state: categories.pod ? "settled" : "decision",
    clause: record.pod
      ? `approve ${plural(mappings, "pod role mapping")}`
      : "set the delivery pod",
  });

  rows.push({
    id: "FAC",
    rank: 4,
    subject: "Friction and productive share",
    state: categories.factors ? "settled" : "decision",
    clause: "source the delivery factors",
  });

  const grouping = record.releases;
  const problem = releaseGroupingProblem(record);
  const hasReleases = (grouping?.items.length ?? 0) > 0;
  rows.push({
    id: "REL",
    rank: 5,
    subject: "How the use cases ship",
    state: categories.releases
      ? "settled"
      : !hasReleases || problem
        ? "decision"
        : "draft",
    clause: !hasReleases
      ? "group the use cases into releases"
      : problem?.unassigned.length
        ? `put ${joinAnd(problem.unassigned)} in a release`
        : "fix the release grouping",
    draftName: "the release grouping",
  });
  return rows;
}

export interface RomNextAction {
  nextAction: StepNextAction;
  /** "{n} of 4 inputs confirmed". */
  countLabel: string;
  categories: RomCategories;
  /** Every input is confirmed and sourced: the estimate may be approved. */
  approvable: boolean;
  approvalCurrent: boolean;
}

/**
 * The NextAction region for Step 4. Clauses follow row order — counts, unit
 * hours, pod, factors, releases — and "approve the estimate" joins only once
 * every input is confirmed. Ready needs the approval. The footer's open count
 * is the open input items plus the approval.
 */
export function romEstimateNextAction(input: {
  record: RomEstimate;
  register: readonly RomRegisterRow[] | null;
  depth: StepDepth;
  blockedBy?: string | null;
  /** The ROM service refused the confirmed inputs: approval waits on that. */
  estimateRefused?: boolean;
  /** Rows the page leads with (evidence to review, a refused change); each is open. */
  leadingRows?: readonly StepRow[];
  registerUnreadBecause?: RomRegisterUnreadReason;
}): RomNextAction {
  const { record, register } = input;
  const categories = romCategories(record, register);
  const leading = input.leadingRows ?? [];
  const rows: StepRow[] = [
    ...leading,
    ...romRowStates(record, register, input.registerUnreadBecause),
  ];
  const inputsDone =
    categories.counts &&
    categories.unitHours &&
    categories.pod &&
    categories.releases &&
    categories.factors;
  const approvalCurrent = isRomApprovalCurrent(record, register);
  if (inputsDone) {
    rows.push({
      id: "EST",
      rank: 6,
      subject: "Approve the estimate",
      state: approvalCurrent ? "settled" : "decision",
      clause: input.estimateRefused
        ? "resolve what the estimate refuses"
        : "approve the estimate",
    });
  }
  const resolved = resolveStepNextAction({
    depth: input.depth,
    rows,
    blockedBy: input.blockedBy,
    readySentence: `Every input is confirmed and the estimate is approved. P4 plans from snapshot v${record.approval?.version ?? 1}. Continue to Gate readiness`,
    emptySentence: "Add the use cases and their counts",
  });
  // Open items: each unconfirmed count row, each unsourced counted driver,
  // each unapproved mapping (or the missing pod), the grouping, the factors,
  // and the approval itself.
  const counted = countedDrivers(record);
  const open =
    leading.filter((r) => r.state !== "settled" && r.state !== "set_aside")
      .length +
    record.useCases.filter((u) => !u.confirmedAt).length +
    (record.foundation && !record.foundation.confirmedAt ? 1 : 0) +
    (record.useCases.length ? 0 : 1) +
    counted.filter(
      (d) =>
        resolveRomUnitHours(record.unitHours[d], register).state !==
        "confirmed",
    ).length +
    (record.pod ? unapprovedMappings(record).length : 1) +
    (categories.factors ? 0 : 1) +
    (categories.releases ? 0 : 1) +
    (approvalCurrent ? 0 : 1);
  return {
    nextAction: { ...resolved, settled: 0, total: open },
    countLabel: `${romConfirmedInputCount(categories)} of 4 inputs confirmed`,
    categories,
    approvable: inputsDone && !input.estimateRefused,
    approvalCurrent,
  };
}

// ── The ROM structure the service prices ────────────────────────────────────

export type RomStructureBuild =
  | {
      ok: true;
      structure: RomStructure;
      /** Drivers priced from an open register row's working figure. */
      workingFigureDrivers: RomDriver[];
      unitHoursUsed: RomSnapshot["unitHours"];
    }
  | {
      ok: false;
      reason:
        | "no_use_cases"
        | "no_releases"
        | "grouping"
        | "no_pod"
        | "no_factors"
        | "unit_hours_missing";
      drivers?: RomDriver[];
    };

/**
 * The structure for the preview route, mapped field for field from the
 * record. Unit hours come from a confirmed reference; an OPEN register row
 * lends its working figure to a provisional preview only. A counted driver
 * with neither stops the build: there is no default.
 */
export function buildRomStructure(
  record: RomEstimate,
  register: readonly RomRegisterRow[] | null,
): RomStructureBuild {
  if (!record.useCases.length) return { ok: false, reason: "no_use_cases" };
  const items = record.releases?.items ?? [];
  if (!items.length) return { ok: false, reason: "no_releases" };
  if (releaseGroupingProblem(record)) return { ok: false, reason: "grouping" };
  if (!record.pod) return { ok: false, reason: "no_pod" };
  if (!record.friction || !record.productiveShare || !record.hoursPerFteWeek) {
    return { ok: false, reason: "no_factors" };
  }
  const unitHours: Partial<Record<RomDriver, RomUnitHours>> = {};
  const unitHoursUsed: RomSnapshot["unitHours"] = {};
  const workingFigureDrivers: RomDriver[] = [];
  const missing: RomDriver[] = [];
  for (const driver of countedDrivers(record)) {
    const s = resolveRomUnitHours(record.unitHours[driver], register);
    if (s.state === "confirmed") {
      unitHours[driver] = {
        value: s.value,
        source: s.sourceLabel,
        confidence: s.confidence,
      };
      unitHoursUsed[driver] = { value: s.value, source: s.sourceLabel };
    } else if (s.state === "open" && s.workingValue !== null) {
      unitHours[driver] = {
        value: s.workingValue,
        source: `[A:${s.registerId}] open · working figure, provisional`,
        confidence: s.confidence,
      };
      workingFigureDrivers.push(driver);
    } else {
      missing.push(driver);
    }
  }
  if (missing.length) {
    return { ok: false, reason: "unit_hours_missing", drivers: missing };
  }
  const carrier = items.find((r) => r.carriesFoundation);
  const pod = record.pod;
  const structure: RomStructure = {
    useCases: record.useCases.map((u) => ({
      code: u.code,
      name: u.name,
      counts: { ...u.counts },
    })),
    unitHours,
    releases: items.map((r) => ({
      code: r.code,
      name: r.name,
      designStatus: r.designStatus,
      useCaseCodes: [...r.useCaseCodes],
      ...(r.rangeInputs ? { rangeInputs: { ...r.rangeInputs } } : {}),
    })),
    foundation:
      record.foundation && carrier
        ? {
            code: record.foundation.code,
            name: record.foundation.name,
            counts: { ...record.foundation.counts },
            designStatus: carrier.designStatus,
            ...(carrier.rangeInputs
              ? { rangeInputs: { ...carrier.rangeInputs } }
              : {}),
            sharedByReleaseCodes: [carrier.code],
          }
        : null,
    pod: {
      ...(pod.templateCode
        ? { templateCode: pod.templateCode }
        : {
            members: (pod.members ?? []).map((m) => ({
              roleCode: m.roleCode,
              levelCode: m.levelCode,
              fte: m.fte,
              ...(m.proposedMapping && !m.proposedMapping.approvedAt
                ? { proposedMapping: true }
                : {}),
            })),
          }),
      locationCode: pod.locationCode,
      providerClassCode: pod.providerClassCode,
      rateBasis: pod.rateBasis,
    },
    friction: { ...record.friction },
    productiveShare: { ...record.productiveShare },
    hoursPerFteWeek: { ...record.hoursPerFteWeek },
  };
  return { ok: true, structure, workingFigureDrivers, unitHoursUsed };
}

/** The figures of one priced block, as the page and the snapshot read them. */
export function romResultFigures(rom: RomResult): {
  releases: RomBlockFigures[];
  foundation: (RomBlockFigures & { releaseCode: string }) | null;
  combined: Omit<RomBlockFigures, "code" | "name">;
} {
  const figures = (
    code: string,
    name: string,
    b: RomResult["releases"][number]["own"],
  ): RomBlockFigures => ({
    code,
    name,
    hours: b.hours,
    weeks: b.weeks,
    lowCents: b.range.lowCents,
    planCents: b.range.planCents,
    highCents: b.range.highCents,
  });
  return {
    releases: rom.releases.map((r) => figures(r.code, r.name, r.own)),
    foundation: rom.foundation
      ? {
          ...figures(
            rom.foundation.priced.code,
            rom.foundation.priced.name,
            rom.foundation.priced,
          ),
          releaseCode: rom.foundation.sharedByReleaseCodes[0] ?? "",
        }
      : null,
    combined: {
      hours: rom.total.hours,
      weeks: rom.total.weeks,
      lowCents: rom.total.lowCents,
      planCents: rom.total.planCents,
      highCents: rom.total.highCents,
    },
  };
}

// ── Edits (pure) ────────────────────────────────────────────────────────────

export type RomEdit =
  | { ok: true; value: RomEstimate }
  | { ok: false; reason: string };

const okEdit = (value: RomEstimate): RomEdit => ({ ok: true, value });

function nextCode(prefix: string, codes: readonly string[]): string {
  let max = 0;
  for (const code of codes) {
    const m = new RegExp(`^${prefix}-?(\\d+)$`).exec(code);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${prefix === "UC" ? "-" : ""}${max + 1}`;
}

export function addUseCase(record: RomEstimate, name: string): RomEdit {
  const clean = name.trim();
  if (!clean) return { ok: false, reason: "A use case needs a name." };
  const code = nextCode(
    "UC",
    record.useCases.map((u) => u.code),
  );
  return okEdit({
    ...record,
    useCases: [
      ...record.useCases,
      { code, name: clean, counts: {}, source: { kind: "team" } },
    ],
  });
}

export function addFoundation(record: RomEstimate): RomEdit {
  if (record.foundation) {
    return { ok: false, reason: "The shared foundation is already listed." };
  }
  return okEdit({
    ...record,
    foundation: {
      code: "FOUNDATION",
      name: "Shared foundation",
      counts: {},
      source: { kind: "team" },
    },
  });
}

function editBlock(
  record: RomEstimate,
  code: string,
  edit: (block: RomCountBlock) => RomCountBlock,
): RomEdit {
  if (record.foundation?.code === code) {
    return okEdit({ ...record, foundation: edit(record.foundation) });
  }
  if (!record.useCases.some((u) => u.code === code)) {
    return { ok: false, reason: `There is no use case ${code}.` };
  }
  return okEdit({
    ...record,
    useCases: record.useCases.map((u) => (u.code === code ? edit(u) : u)),
  });
}

/** A typed count: a whole number of 0 or more, or blank for none. */
export function setCount(
  record: RomEstimate,
  code: string,
  driver: RomDriver,
  raw: string,
): RomEdit {
  const trimmed = raw.trim();
  if (trimmed && !/^\d+$/.test(trimmed)) {
    return { ok: false, reason: "A count is a whole number of 0 or more." };
  }
  return editBlock(record, code, (b) => {
    if (b.confirmedAt) return b;
    const counts = { ...b.counts };
    if (trimmed) counts[driver] = Number(trimmed);
    else delete counts[driver];
    const typed = [...new Set([...(b.typed ?? []), driver])];
    return { ...b, counts, typed };
  });
}

export function confirmCounts(
  record: RomEstimate,
  code: string,
  by: string,
  at: string,
): RomEdit {
  const block =
    record.foundation?.code === code
      ? record.foundation
      : record.useCases.find((u) => u.code === code);
  if (block && !ROM_DRIVERS.some((d) => (block.counts[d] ?? 0) > 0)) {
    return {
      ok: false,
      reason: `${block.name} counts nothing yet. Give it at least one count above zero.`,
    };
  }
  return editBlock(record, code, (b) => ({
    ...b,
    confirmedBy: by,
    confirmedAt: at,
  }));
}

export function reopenCounts(record: RomEstimate): RomEstimate {
  const reopen = (b: RomCountBlock): RomCountBlock => {
    const next = { ...b };
    delete next.confirmedBy;
    delete next.confirmedAt;
    return next;
  };
  return {
    ...record,
    useCases: record.useCases.map(reopen),
    foundation: record.foundation ? reopen(record.foundation) : null,
  };
}

export function setUnitHoursRef(
  record: RomEstimate,
  driver: RomDriver,
  registerId: string,
): RomEdit {
  const id = registerId.trim();
  if (!/^(DL|V|D|A)[1-9]\d*$/.test(id)) {
    return { ok: false, reason: "Choose a register row such as DL3." };
  }
  return okEdit({
    ...record,
    unitHours: {
      ...record.unitHours,
      [driver]: { kind: "register", registerId: id },
    },
  });
}

export function setPod(record: RomEstimate, pod: RomPod): RomEdit {
  if (!pod.locationCode.trim()) {
    return { ok: false, reason: "The pod needs a delivery location code." };
  }
  if (Boolean(pod.templateCode?.trim()) === Boolean(pod.members?.length)) {
    return {
      ok: false,
      reason: "The pod needs a template code or a list of members, not both.",
    };
  }
  return okEdit({ ...record, pod });
}

export function approveMapping(
  record: RomEstimate,
  roleCode: string,
  by: string,
  at: string,
): RomEdit {
  if (
    !record.pod?.members?.some(
      (m) => m.roleCode === roleCode && m.proposedMapping,
    )
  ) {
    return { ok: false, reason: "That pod member has no proposed mapping." };
  }
  return okEdit({
    ...record,
    pod: {
      ...record.pod,
      members: record.pod.members.map((m) =>
        m.roleCode === roleCode && m.proposedMapping
          ? {
              ...m,
              proposedMapping: {
                from: m.proposedMapping.from,
                approvedBy: by,
                approvedAt: at,
              },
            }
          : m,
      ),
    },
  });
}

export function setFactors(
  record: RomEstimate,
  factors: {
    friction: RomFactor;
    productiveShare: RomFactor;
    hoursPerFteWeek: RomFactor;
  },
): RomEdit {
  const { friction, productiveShare, hoursPerFteWeek } = factors;
  if (
    ![friction, productiveShare, hoursPerFteWeek].every((f) => f.source.trim())
  ) {
    return { ok: false, reason: "Each factor needs a source." };
  }
  if (!(friction.value > 0)) {
    return { ok: false, reason: "Friction must be above 0." };
  }
  if (!(productiveShare.value > 0 && productiveShare.value <= 1)) {
    return {
      ok: false,
      reason: "Productive share must be above 0 and at most 1.",
    };
  }
  if (!(hoursPerFteWeek.value > 0)) {
    return { ok: false, reason: "Hours per FTE-week must be above 0." };
  }
  const clean = (f: RomFactor): RomFactor => ({
    value: f.value,
    source: f.source.trim(),
  });
  return okEdit({
    ...record,
    friction: clean(friction),
    productiveShare: clean(productiveShare),
    hoursPerFteWeek: clean(hoursPerFteWeek),
  });
}

export function addRelease(
  record: RomEstimate,
  release: Omit<RomRelease, "code">,
): RomEdit {
  const name = release.name.trim();
  if (!name) return { ok: false, reason: "A release needs a name." };
  if (!release.useCaseCodes.length) {
    return { ok: false, reason: "A release groups at least one use case." };
  }
  if (release.designStatus === "designed" && !release.rangeInputs) {
    return {
      ok: false,
      reason: "A designed release needs its five range inputs.",
    };
  }
  const items = record.releases?.items ?? [];
  const code = nextCode(
    "R",
    items.map((r) => r.code),
  );
  return okEdit({
    ...record,
    releases: {
      items: [
        ...items
          .map((r) =>
            release.carriesFoundation
              ? { ...r, carriesFoundation: undefined }
              : r,
          )
          .map((r) => {
            const copy = { ...r };
            if (!copy.carriesFoundation) delete copy.carriesFoundation;
            return copy;
          }),
        { ...release, name, code },
      ],
      source: { kind: "team" },
    },
  });
}

export function removeRelease(record: RomEstimate, code: string): RomEdit {
  const items = record.releases?.items ?? [];
  if (!items.some((r) => r.code === code)) {
    return { ok: false, reason: `There is no release ${code}.` };
  }
  const rest = items.filter((r) => r.code !== code);
  return okEdit({
    ...record,
    releases: rest.length
      ? { items: rest, source: record.releases?.source ?? { kind: "team" } }
      : null,
  });
}

export function acceptReleases(
  record: RomEstimate,
  by: string,
  at: string,
): RomEdit {
  if (!record.releases?.items.length) {
    return { ok: false, reason: "There is no release grouping to accept." };
  }
  if (releaseGroupingProblem(record)) {
    return {
      ok: false,
      reason:
        "Put every use case in exactly one release, and the shared foundation in one, before accepting.",
    };
  }
  return okEdit({
    ...record,
    releases: { ...record.releases, acceptedBy: by, acceptedAt: at },
  });
}

export function reopenReleases(record: RomEstimate): RomEstimate {
  if (!record.releases) return record;
  const releases = { ...record.releases };
  delete releases.acceptedBy;
  delete releases.acceptedAt;
  return { ...record, releases };
}

/**
 * Approve the estimate: allowed only when every input is confirmed and
 * sourced, and only for a result the ROM service computed from exactly
 * these confirmed inputs.
 */
export function approveRomEstimate(
  record: RomEstimate,
  register: readonly RomRegisterRow[] | null,
  rom: RomResult,
  by: string,
  at: string,
): RomEdit {
  const c = romCategories(record, register);
  if (!(c.counts && c.unitHours && c.pod && c.releases && c.factors)) {
    return {
      ok: false,
      reason: `${provisionalSentence(romProvisionalBecause(c))} Approve once they are.`,
    };
  }
  const build = buildRomStructure(record, register);
  if (!build.ok || build.workingFigureDrivers.length) {
    return {
      ok: false,
      reason: "The estimate was not computed from confirmed inputs.",
    };
  }
  if (canonical(build.structure) !== canonical(rom.structure)) {
    return {
      ok: false,
      reason:
        "The inputs changed after this estimate was computed. Wait for it to update, then approve.",
    };
  }
  const version = record.snapshotsIssued + 1;
  return okEdit({
    ...record,
    snapshotsIssued: version,
    approval: {
      version,
      approvedBy: by,
      approvedAt: at,
      inputsFingerprint: romInputsFingerprint(record),
      unitHours: build.unitHoursUsed,
      ...romResultFigures(rom),
    },
  });
}

export function reopenRomApproval(record: RomEstimate): RomEstimate {
  return { ...record, approval: null };
}

// ── Display (formatting only; no estimate arithmetic) ───────────────────────

/** Shared consultant-facing cents formatter; pricing stays at engine precision. */
export function formatRomMoney(cents: number): string {
  return formatConsultantCents(cents);
}

export function formatRomHours(hours: number): string {
  return `${Math.round(hours).toLocaleString("en-US")} h`;
}

export function formatRomWeeks(weeks: number): string {
  return `${weeks} ${weeks === 1 ? "wk" : "wks"}`;
}

/** 0.25 → "25%", 2 → "2 FTE". */
export function formatAllocation(fte: number): string {
  return fte >= 1 ? `${fte} FTE` : `${Math.round(fte * 100)}%`;
}

/** 1.1 → "×1.10"; a share 0.65 → "65%". */
export function formatFactor(
  kind: "friction" | "share" | "week",
  value: number,
): string {
  if (kind === "friction") return `×${value.toFixed(2)}`;
  if (kind === "share") return `${Math.round(value * 100)}%`;
  return `${value} h per FTE-week`;
}

// ── Text readers ────────────────────────────────────────────────────────────

function sourceText(
  source: RomCountSource,
  confirmedBy?: string,
  confirmedAt?: string,
): string {
  const from =
    source.kind === "session_notes"
      ? `from session notes (${source.citation})`
      : source.kind === "evidence"
        ? `from evidence (${source.citation})`
        : "from the team";
  return confirmedAt
    ? `${from}, confirmed by ${confirmedBy} on ${confirmedAt}`
    : `${from}, not yet confirmed`;
}

function countsText(block: RomCountBlock): string {
  const parts = ROM_DRIVERS.filter((d) => block.counts[d] !== undefined).map(
    (d) => `${block.counts[d]} ${ROM_DRIVER_LABELS[d].toLowerCase()}`,
  );
  return parts.length ? parts.join(", ") : "no counts";
}

/**
 * The record as ranked plain text, in row order: counts, unit hours, pod,
 * factors, releases, then the approved snapshot. Every figure is labelled an
 * ESTIMATE; a register reference is cited as [A:id], never as a value.
 */
export function romEstimateText(record: RomEstimate): string {
  const lines: string[] = ["Bottom-up estimate (ROM) inputs, in order:"];
  lines.push("1. Counts (planned components per use case):");
  for (const u of record.useCases) {
    lines.push(
      `   ${u.code} ${u.name}: ${countsText(u)} (${sourceText(u.source, u.confirmedBy, u.confirmedAt)})`,
    );
  }
  if (record.foundation) {
    const carrier = record.releases?.items.find((r) => r.carriesFoundation);
    lines.push(
      `   ${record.foundation.name}, counted once${carrier ? ` in ${carrier.code}` : ""}: ${countsText(record.foundation)} (${sourceText(record.foundation.source, record.foundation.confirmedBy, record.foundation.confirmedAt)})`,
    );
  }
  lines.push("2. Unit hours (no defaults):");
  for (const d of ROM_DRIVERS) {
    const ref = record.unitHours[d];
    if (!ref) continue;
    lines.push(
      `   ${ROM_DRIVER_LABELS[d]}: ${
        ref.kind === "register"
          ? `[A:${ref.registerId}] from the assumptions register`
          : `ESTIMATE ${ref.value} h per ${ROM_DRIVER_UNITS[d]}, approved benchmark ${ref.benchmarkId}`
      }`,
    );
  }
  if (record.pod) {
    const p = record.pod;
    const where = `${p.locationLabel ?? p.locationCode}${p.providerClassCode ? `, ${p.providerClassLabel ?? p.providerClassCode}` : ""}`;
    lines.push(
      p.templateCode
        ? `3. Delivery pod: template ${p.templateName ?? p.templateCode} (${where})`
        : `3. Delivery pod (${where}): ${(p.members ?? [])
            .map(
              (m) =>
                `${m.roleLabel}, ${m.levelLabel}, ${formatAllocation(m.fte)}${
                  m.proposedMapping
                    ? m.proposedMapping.approvedAt
                      ? ` (mapped from ${m.proposedMapping.from}, approved by ${m.proposedMapping.approvedBy})`
                      : ` (proposed mapping from ${m.proposedMapping.from}, unapproved)`
                    : ""
                }`,
            )
            .join("; ")}`,
    );
  }
  const factor = (label: string, f: RomFactor | null, shown: string) =>
    f ? `${label} ESTIMATE ${shown} (${f.source})` : null;
  const factors = [
    factor(
      "friction",
      record.friction,
      record.friction ? formatFactor("friction", record.friction.value) : "",
    ),
    factor(
      "productive share",
      record.productiveShare,
      record.productiveShare
        ? formatFactor("share", record.productiveShare.value)
        : "",
    ),
    factor(
      "capacity",
      record.hoursPerFteWeek,
      record.hoursPerFteWeek
        ? formatFactor("week", record.hoursPerFteWeek.value)
        : "",
    ),
  ].filter(Boolean);
  if (factors.length) lines.push(`4. Factors: ${factors.join("; ")}`);
  if (record.releases?.items.length) {
    lines.push(
      `5. Releases (${record.releases.acceptedAt ? `accepted by ${record.releases.acceptedBy} on ${record.releases.acceptedAt}` : "grouping not yet accepted"}):`,
    );
    for (const r of record.releases.items) {
      lines.push(
        `   ${r.code} ${r.name}: ${r.useCaseCodes.join(", ")}; ${r.designStatus === "designed" ? "designed" : "not designed"}${r.carriesFoundation ? "; carries the shared foundation" : ""}`,
      );
    }
  }
  const a = record.approval;
  if (a) {
    const money = (f: {
      lowCents: number;
      planCents: number;
      highCents: number;
    }) =>
      `${formatRomMoney(f.lowCents)} / ${formatRomMoney(f.planCents)} / ${formatRomMoney(f.highCents)}`;
    lines.push(
      `Approved estimate: snapshot v${a.version}, approved by ${a.approvedBy} on ${a.approvedAt}${isRomApprovalCurrent(record) ? "" : " (inputs changed since; not current)"}. ESTIMATE, low / plan / high:`,
    );
    for (const r of a.releases) {
      lines.push(
        `   ${r.code} ${r.name}: ${formatRomHours(r.hours)}, ${formatRomWeeks(r.weeks)}, ${money(r)}`,
      );
    }
    if (a.foundation) {
      lines.push(
        `   ${a.foundation.name} (counted once, in ${a.foundation.releaseCode}): ${formatRomHours(a.foundation.hours)}, ${formatRomWeeks(a.foundation.weeks)}, ${money(a.foundation)}`,
      );
    }
    lines.push(
      `   Combined, foundation counted once: ${formatRomHours(a.combined.hours)}, ${formatRomWeeks(a.combined.weeks)}, ${money(a.combined)}`,
    );
  } else {
    lines.push("Estimate not yet approved.");
  }
  return lines.join("\n");
}

/** Only the team's own words, for the gate's phrase checks: the names it gave. */
export function romEstimateGateText(record: RomEstimate): string {
  return [
    ...record.useCases.map((u) => u.name),
    ...(record.foundation ? [record.foundation.name] : []),
    ...(record.releases?.items.map((r) => r.name) ?? []),
  ].join("\n");
}
