import { StateBadge } from "../state/StateBanner";
import type { RelationshipEdgeDetailRow } from "@/lib/knowledge/providers/read-models";

/** Table mirror of the graph's edges -- inherits the graph edges' own gate, so
 * it is never populated when the graph itself is withheld. */
export function RelationshipList({
  edges,
  onEdgeClick,
}: {
  readonly edges: readonly RelationshipEdgeDetailRow[];
  readonly onEdgeClick: (edge: RelationshipEdgeDetailRow) => void;
}) {
  if (edges.length === 0) return null;
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-[rgba(10,10,11,0.1)] text-xs uppercase tracking-wide text-[#888780]">
          <th className="px-2 py-1.5 text-left">From</th>
          <th className="px-2 py-1.5 text-left">Predicate</th>
          <th className="px-2 py-1.5 text-left">To</th>
          <th className="px-2 py-1.5 text-left">State</th>
        </tr>
      </thead>
      <tbody>
        {edges.map((edge) => (
          <tr
            key={edge.edgeId}
            onClick={() => onEdgeClick(edge)}
            className="cursor-pointer border-b border-[rgba(10,10,11,0.06)] hover:bg-[rgba(0,102,204,0.03)]"
          >
            <td className="px-2 py-1.5">{edge.fromNodeId}</td>
            <td className="px-2 py-1.5">
              {edge.relationshipTypeResolved
                ? edge.relationshipTypeRef
                : "relationship not typed"}
            </td>
            <td className="px-2 py-1.5">{edge.toNodeId}</td>
            <td className="px-2 py-1.5">
              <StateBadge
                tone={
                  edge.isGap || edge.isConflict
                    ? "gap"
                    : edge.authorityState === "candidate"
                      ? "candidate"
                      : "neutral"
                }
                label={
                  edge.isConflict
                    ? "Sources disagree"
                    : edge.isGap
                      ? "No accepted evidence"
                      : edge.authorityState
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
