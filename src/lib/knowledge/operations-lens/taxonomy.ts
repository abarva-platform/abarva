/**
 * Operational capability taxonomy for the Operations & Vendor Intelligence lens.
 *
 * This is NAVIGATION SCAFFOLDING, not knowledge. The list of capabilities is a
 * fixed UI vocabulary (like the mode list or the lens list); it asserts nothing
 * about a tenant. WHICH systems, vendors, contracts, risks and programs belong to
 * each capability is resolved entirely from the active Knowledge Baseline (via the
 * governed consumption provider) — never hard-coded here. A capability with no
 * represented objects renders an explicit "not yet mapped in this baseline" state,
 * never a fabricated connection.
 *
 * An entity is attributed to a capability only when the governed projection carries
 * an explicit capability signal (an entity field keyed `capability` /
 * `operational_capability`, or a capability-typed relationship node). We never
 * infer capability from a name, owner string, or filename.
 */

export const OPERATIONS_CAPABILITY_KEYS = [
  "irops",
  "flight_operations",
  "crew_operations",
  "airport_operations",
  "maintenance",
  "customer_recovery",
  "data_integration",
] as const;

export type OperationsCapabilityKey = (typeof OPERATIONS_CAPABILITY_KEYS)[number];

export interface OperationsCapabilityDef {
  key: OperationsCapabilityKey;
  label: string;
  /** One-line description of the operational capability (UI copy, not a fact). */
  description: string;
  /**
   * Accepted governed values that map an entity to this capability. Matching is
   * exact (case/space/hyphen-normalized) against an entity's capability signal —
   * we do not fuzzy-match, so an unexpected value stays explicitly "unmapped".
   */
  aliases: string[];
}

export const OPERATIONS_CAPABILITIES: readonly OperationsCapabilityDef[] = [
  {
    key: "irops",
    label: "IROPS",
    description: "Irregular-operations command and disruption recovery.",
    aliases: ["irops", "irregular_operations", "disruption_recovery", "ops_control"],
  },
  {
    key: "flight_operations",
    label: "Flight operations",
    description: "Dispatch, flight planning and load control.",
    aliases: ["flight_operations", "flight_ops", "dispatch", "flightops"],
  },
  {
    key: "crew_operations",
    label: "Crew operations",
    description: "Crew scheduling, legality and recovery.",
    aliases: ["crew_operations", "crew_ops", "crew", "crew_scheduling"],
  },
  {
    key: "airport_operations",
    label: "Airport & station operations",
    description: "Turnaround, gating and station operations.",
    aliases: ["airport_operations", "airport_ops", "station_operations", "ground_ops"],
  },
  {
    key: "maintenance",
    label: "Maintenance & engineering",
    description: "Line and base maintenance and engineering records.",
    aliases: ["maintenance", "engineering", "mro", "maintenance_engineering"],
  },
  {
    key: "customer_recovery",
    label: "Customer recovery",
    description: "Rebooking, care and customer disruption recovery.",
    aliases: ["customer_recovery", "customer_care", "rebooking", "pax_recovery"],
  },
  {
    key: "data_integration",
    label: "Data & integration",
    description: "Operational data platform and system integration.",
    aliases: ["data_integration", "data_and_integration", "integration", "data_platform"],
  },
] as const;

const NORMALIZE = (v: string): string =>
  v.trim().toLowerCase().replace(/[\s-]+/g, "_");

const ALIAS_INDEX: Map<string, OperationsCapabilityKey> = (() => {
  const m = new Map<string, OperationsCapabilityKey>();
  for (const cap of OPERATIONS_CAPABILITIES) {
    m.set(NORMALIZE(cap.key), cap.key);
    for (const a of cap.aliases) m.set(NORMALIZE(a), cap.key);
  }
  return m;
})();

/**
 * Resolve one or more governed capability signal values to capability keys.
 * Unknown values are dropped (never coerced to a "default" capability), so an
 * entity carrying an unrecognized value stays unmapped rather than mis-attributed.
 * A single field value may carry several capabilities separated by `,` `;` or `|`.
 */
export function matchCapabilityKeys(signal: string | null | undefined): OperationsCapabilityKey[] {
  if (!signal) return [];
  const parts = signal.split(/[,;|]/).map(NORMALIZE).filter(Boolean);
  const out: OperationsCapabilityKey[] = [];
  for (const p of parts) {
    const key = ALIAS_INDEX.get(p);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

export function capabilityLabel(key: OperationsCapabilityKey): string {
  return OPERATIONS_CAPABILITIES.find((c) => c.key === key)?.label ?? key;
}
