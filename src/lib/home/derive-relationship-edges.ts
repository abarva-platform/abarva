import type {
  HomeKnowledgeDataSet,
  HomeKnowledgeRecord,
} from "./home-knowledge-design-contract";

// =============================================================================
// Home relationship-edge derivation
// -----------------------------------------------------------------------------
// The Home Knowledge design-contract pack's "rel" (Relationships) dimension
// carries the same schema as Risks & Controls -- it has no real relationship
// fields (confirmed against datasets/tenant-inputs/meridian-health/...). But
// several OTHER dimensions already carry real, evidenced, semicolon-delimited
// cross-references that were never parsed into graph edges:
//   - apps.integrations / infra.integrations: "Epic Bridges; Clarity; Caboodle"
//   - vendors.linked_systems: "MER-SYS-EPIC-HYPERSPACE; MER-SYS-EPIC-CLARITY"
//   - data.systems: "Epic Clarity; Epic Caboodle; Claims administration platform"
// This module parses those fields into real (from, relationship, to) edges.
// No fabrication: an edge only exists here because a loaded row's own text
// says so.
//
// PURE, CLIENT-SAFE ONLY. This file must never import node:fs/node:path or
// anything else Node-only.
// =============================================================================

export interface HomeRelationshipEdge {
  from: string;
  fromType: string;
  relationship: string;
  to: string;
  sourceDimension: string;
  sourceField: string;
}

const EDGE_SOURCES: ReadonlyArray<{
  dimensionKey: string;
  field: string;
  relationship: string;
  fromType: string;
}> = [
  {
    dimensionKey: "apps",
    field: "integrations",
    relationship: "integrates with",
    fromType: "application",
  },
  {
    dimensionKey: "infra",
    field: "integrations",
    relationship: "integrates with",
    fromType: "application",
  },
  {
    dimensionKey: "vendors",
    field: "linked_systems",
    relationship: "supplies",
    fromType: "vendor",
  },
  {
    dimensionKey: "data",
    field: "systems",
    relationship: "runs on",
    fromType: "use case",
  },
];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isBusinessReadableRelationshipLabel(value: unknown): boolean {
  const label = asString(value);
  if (!label) return false;
  const normalized = label.toLowerCase();
  if (
    normalized === "not_loaded" ||
    normalized === "not loaded" ||
    normalized === "needs evidence"
  ) {
    return false;
  }
  if (normalized.includes("_to_confirm")) return false;
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(label)) return false;
  if (/^[a-z0-9-]+-v\d/i.test(label)) return false;
  if (/^(app|sys|data|ven|rel|ctx)-\d{2,}$/i.test(label)) return false;
  if (/^[A-Z]{2,}(?:-[A-Z0-9]+){1,}$/i.test(label)) return false;
  if (/^[a-z]{2,}-[a-z]+-[a-z0-9-]+-\d{2,}$/i.test(label)) return false;
  return true;
}

function addEdge(
  edges: HomeRelationshipEdge[],
  seen: Set<string>,
  edge: HomeRelationshipEdge,
) {
  const from = edge.from.trim();
  const to = edge.to.trim();
  if (
    !isBusinessReadableRelationshipLabel(from) ||
    !isBusinessReadableRelationshipLabel(to) ||
    from === to
  ) {
    return;
  }
  const key = `${from} ${edge.relationship} ${to}`;
  if (seen.has(key)) return;
  seen.add(key);
  edges.push({ ...edge, from, to });
}

function splitDelimited(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "needs evidence") return [];
  return trimmed
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function rowName(row: HomeKnowledgeRecord): string {
  const value = row.business_name ?? row.context_item;
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Derives real graph edges from the already-loaded DATA slots of a Home
 * Knowledge design-contract pack. Only rows whose source field carries a
 * real, non-empty, non-"Needs evidence" value produce edges. Deduplicates
 * identical (from, relationship, to) triples across dimensions that share
 * the same underlying schema (e.g. `apps`/`infra` both carry `integrations`
 * for the same systems in some tenant packs).
 */
export function deriveHomeRelationshipEdges(
  data: Record<string, HomeKnowledgeDataSet | undefined>,
): HomeRelationshipEdge[] {
  const seen = new Set<string>();
  const edges: HomeRelationshipEdge[] = [];

  for (const row of data.rel?.rows ?? []) {
    const explicitFrom = asString(row.from_object_name);
    const explicitTo = asString(row.to_object_name);
    if (explicitFrom && explicitTo) {
      addEdge(edges, seen, {
        from: explicitFrom,
        fromType: asString(row.from_object_type) || "entity",
        relationship:
          asString(row.relationship_type).replaceAll("_", " ") || "relates to",
        to: explicitTo,
        sourceDimension: "rel",
        sourceField: "from_object_name/to_object_name",
      });
      continue;
    }

    const businessName = asString(row.business_name);
    const useCase = asString(row.use_case);
    const from = businessName || useCase;
    for (const to of splitDelimited(row.affected_systems)) {
      addEdge(edges, seen, {
        from,
        fromType: useCase ? "use case" : "relationship",
        relationship: "depends on",
        to,
        sourceDimension: "rel",
        sourceField: "affected_systems",
      });
    }
  }

  for (const source of EDGE_SOURCES) {
    const rows = data[source.dimensionKey]?.rows ?? [];
    for (const row of rows) {
      const from = rowName(row);
      if (!from) continue;
      for (const to of splitDelimited(row[source.field])) {
        addEdge(edges, seen, {
          from,
          fromType: source.fromType,
          relationship: source.relationship,
          to,
          sourceDimension: source.dimensionKey,
          sourceField: source.field,
        });
      }
    }
  }

  return edges;
}
