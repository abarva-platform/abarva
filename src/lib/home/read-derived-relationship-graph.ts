import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { HomeRelationshipEdge } from "./derive-relationship-edges";

// =============================================================================
// Derived relationship graph loader
// -----------------------------------------------------------------------------
// A separate, richer graph derivation job already runs for some tenants and
// writes datasets/tenant-inputs/<tenant>/derived/relationship-graph.json --
// a real, evidence-cited node/edge graph (confirmed for meridian-health:
// 1,668 nodes / 2,670 edges across 14 node types and 17 relationship types,
// generated 2026-07-17). This was never wired into the Home Knowledge
// cockpit. When present, it is dramatically richer than
// deriveHomeRelationshipEdges()'s field-parsing fallback and should be
// preferred.
//
// SERVER-ONLY. This module reads the filesystem, so it must only be
// imported from a Server Component (see home/page.tsx) and the result
// passed down as a prop -- never import this from
// HomeKnowledgeDesignContractSurface.tsx ("use client"), or Turbopack fails
// the client bundle with "the chunking context does not support external
// modules (request: node:fs)". This split exists specifically to prevent
// that: derive-relationship-edges.ts stays pure/client-safe, this file
// carries the node:fs/node:path dependency alone.
// =============================================================================

interface RawRelationshipGraphEdge {
  edge_id: string;
  relationship_type: string;
  from_object_type: string;
  from_object_id: string;
  to_object_type: string;
  to_object_id: string;
}

interface RawRelationshipGraphFile {
  tenant_key: string;
  generated_at?: string;
  nodes: unknown[];
  edges: RawRelationshipGraphEdge[];
}

/**
 * Reads the derived relationship-graph.json for a tenant, if it exists.
 * Filters self-referential edges (from_object_id === to_object_id — a small
 * data-quality artifact in the source file, ~1% of Meridian's edges) and
 * enforces that the file's own tenant_key matches the requested tenant
 * before using any of its content. Returns [] (never throws) when the file
 * is absent, unreadable, or tenant-mismatched -- callers should fall back
 * to `deriveHomeRelationshipEdges()` in that case.
 */
export function readDerivedRelationshipGraphEdges(
  tenantKey: string | null | undefined,
  opts: { rootDir?: string } = {},
): HomeRelationshipEdge[] {
  const normalizedTenant = tenantKey?.trim().toLowerCase();
  if (!normalizedTenant) return [];

  const rootDir = opts.rootDir ?? process.cwd();
  const source = path.join(
    rootDir,
    "datasets/tenant-inputs",
    normalizedTenant,
    "derived/relationship-graph.json",
  );
  if (!existsSync(source)) return [];

  try {
    const parsed = JSON.parse(
      readFileSync(source, "utf8"),
    ) as RawRelationshipGraphFile;
    if (parsed.tenant_key?.trim().toLowerCase() !== normalizedTenant) {
      return [];
    }
    return (parsed.edges ?? [])
      .filter(
        (edge) =>
          edge.from_object_id &&
          edge.to_object_id &&
          edge.from_object_id !== edge.to_object_id,
      )
      .map((edge) => ({
        from: edge.from_object_id,
        fromType: edge.from_object_type || "entity",
        relationship: (edge.relationship_type || "relates to").replaceAll(
          "_",
          " ",
        ),
        to: edge.to_object_id,
        sourceDimension: "derived_relationship_graph",
        sourceField: edge.relationship_type,
      }));
  } catch {
    return [];
  }
}
