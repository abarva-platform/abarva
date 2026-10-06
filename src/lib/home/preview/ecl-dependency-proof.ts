import type { HomeProjectionRow } from "./ecl-projection-bundle";
import { homeProjectionPayload } from "./projection-row-payload";

export interface EnterpriseDependencyNode {
  id: string;
  name: string;
  type: string;
}

export interface EnterpriseDependencyPath {
  primaryLinkKey: string;
  subject: EnterpriseDependencyNode;
  subjectKind: "risk" | "program";
  subjectState: string;
  asset: EnterpriseDependencyNode;
  supplier: EnterpriseDependencyNode | null;
  contract: EnterpriseDependencyNode | null;
  dataProduct: EnterpriseDependencyNode | null;
  platform: EnterpriseDependencyNode | null;
  sourceRefs: string[];
  asOf: string | null;
}

export interface EnterpriseDependencyProof {
  projectedLinks: number;
  riskPaths: EnterpriseDependencyPath[];
  programPaths: EnterpriseDependencyPath[];
  asOf: string | null;
}

type SourceRefsForRow = (row: HomeProjectionRow) => string[];
type Edge = {
  rowKey: string;
  from: EnterpriseDependencyNode;
  to: EnterpriseDependencyNode;
  type: string;
  asOf: string | null;
  sourceRefs: string[];
};

function value(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function node(id: unknown, name: unknown, type: unknown): EnterpriseDependencyNode | null {
  const nodeId = value(id);
  const nodeName = value(name);
  const nodeType = value(type);
  return nodeId && nodeName && nodeType
    ? { id: nodeId, name: nodeName, type: nodeType }
    : null;
}

/** Uses only projected canonical IDs and independently verified source links. */
export function buildHomeDependencyProof(
  rows: HomeProjectionRow[],
  sourceRefs: SourceRefsForRow,
): EnterpriseDependencyProof | null {
  const edges: Edge[] = rows.flatMap((row) => {
    if (row.page_key !== "relationships" || row.row_type !== "relationship") return [];
    const data = homeProjectionPayload(row.display_payload_json);
    if (value(data.scope) !== "risk_and_program_dependency_slice") return [];
    const from = node(data.from_object_id, data.from_object_name, data.from_object_type);
    const to = node(data.to_object_id, data.to_object_name, data.to_object_type);
    const refs = sourceRefs(row);
    const type = value(data.relationship_type);
    if (!from || !to || !refs.length || !type) return [];
    return [{ rowKey: row.row_key, from, to, type,
      asOf: value(data.source_as_of) || null, sourceRefs: refs }];
  });
  if (!edges.length) return null;
  const byFrom = new Map<string, Edge[]>();
  for (const edge of edges) {
    const list = byFrom.get(edge.from.id) ?? [];
    list.push(edge);
    byFrom.set(edge.from.id, list);
  }
  for (const list of byFrom.values()) {
    list.sort((a, b) => a.to.name.localeCompare(b.to.name) || a.type.localeCompare(b.type));
  }
  const one = (fromId: string, type: string): Edge | undefined =>
    byFrom.get(fromId)?.find((edge) => edge.type === type);
  const subjects = rows.filter((row) =>
    (row.row_type === "risk" || row.row_type === "program") &&
    row.primary_object_id && sourceRefs(row).length);
  const riskPaths: EnterpriseDependencyPath[] = [];
  const programPaths: EnterpriseDependencyPath[] = [];
  for (const row of subjects) {
    const data = homeProjectionPayload(row.display_payload_json);
    const isRisk = row.row_type === "risk";
    const severity = value(data.severity).toLowerCase();
    const control = value(data.control_state).toLowerCase();
    if (isRisk && (!["critical", "high"].includes(severity) ||
      !["partially_effective", "unknown"].includes(control))) continue;
    const primaryType = isRisk ? "APPLIES_TO" : "CHANGES";
    const primaryEdges = (byFrom.get(row.primary_object_id ?? "") ?? [])
      .filter((edge) => edge.type === primaryType);
    for (const primary of primaryEdges) {
      const supplier = one(primary.to.id, "SUPPLIED_BY");
      const contract = one(primary.to.id, "COVERED_BY");
      const feed = one(primary.to.id, "FEEDS");
      const hosting = feed ? one(feed.to.id, "HOSTED_ON") : undefined;
      const links = [primary, supplier, contract, feed, hosting].filter(
        (edge): edge is Edge => Boolean(edge),
      );
      const path: EnterpriseDependencyPath = {
        primaryLinkKey: primary.rowKey,
        subject: { id: row.primary_object_id!, name: row.title.replace(/\s+\(RISK-\d+\)$/, ""), type: row.row_type },
        subjectKind: isRisk ? "risk" : "program",
        subjectState: isRisk ? `${severity}; ${control}` : value(data.status) || "not recorded",
        asset: primary.to,
        supplier: supplier?.to ?? null,
        contract: contract?.to ?? null,
        dataProduct: feed?.to ?? null,
        platform: hosting?.to ?? null,
        sourceRefs: [...new Set([
          sourceRefs(row)[0],
          ...links.map((edge) => edge.sourceRefs[0]),
          ...sourceRefs(row),
          ...links.flatMap((edge) => edge.sourceRefs),
        ].filter(Boolean))],
        asOf: links.every((edge) => edge.asOf && edge.asOf === links[0].asOf)
          ? links[0].asOf : null,
      };
      (isRisk ? riskPaths : programPaths).push(path);
    }
  }
  const richness = (path: EnterpriseDependencyPath) =>
    Number(Boolean(path.supplier)) + Number(Boolean(path.dataProduct)) +
    Number(Boolean(path.platform)) + Number(Boolean(path.contract));
  riskPaths.sort((a, b) =>
    Number(b.subjectState.startsWith("critical")) - Number(a.subjectState.startsWith("critical")) ||
    Number(b.subjectState.endsWith("unknown")) - Number(a.subjectState.endsWith("unknown")) ||
    richness(b) - richness(a) || a.subject.name.localeCompare(b.subject.name));
  programPaths.sort((a, b) =>
    Number(b.subjectState === "at_risk") - Number(a.subjectState === "at_risk") ||
    richness(b) - richness(a) || a.subject.name.localeCompare(b.subject.name));
  if (!riskPaths.length && !programPaths.length) return null;
  const dates = edges.map((edge) => edge.asOf);
  return {
    projectedLinks: edges.length,
    riskPaths,
    programPaths,
    asOf: dates.length > 0 && dates.every((date) => date && date === dates[0]) ? dates[0] : null,
  };
}
