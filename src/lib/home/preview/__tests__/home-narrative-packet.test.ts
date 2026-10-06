import { getHomeReviewBundle } from "../golden-snapshot";
import {
  createHomeNarrativePacketArtifact,
  homeNarrativeFactualRowsHash,
  verifiedHomeNarrativePacketArtifact,
  type HomeNarrativeBasisRow,
  type HomeVerifiedSourceRefs,
} from "../home-narrative-packet";

const row: HomeNarrativeBasisRow = {
  page_key: "vendor_contracts",
  row_key: "CTR-001",
  row_type: "contract",
  title: "Contract",
  summary: null,
  projection_entry_id: "entry-1",
  source_hash: "source-v1",
  source_refs_json: [{ source_record_id: "record-1" }],
  primary_object_id: null,
  admission_status: "admitted",
  display_payload_json: { contract_name: "Contract", annualized_value_usd: 100 },
};
const links: HomeVerifiedSourceRefs = new Map([
  ["entry-1", new Map([["source-v1", new Set(["record-1"])]])],
]);

describe("versioned Home narrative packet", () => {
  const reviewedPacket = getHomeReviewBundle("meridian-health")?.thesis.signalPacket;
  if (!reviewedPacket) throw new Error("fixture packet missing");
  const packet = { ...reviewedPacket, sourceSummaries: [], pagePromptContracts: [] };
  const args = { tenantKey: "meridian-health", assessmentId: "assessment-1", rows: [row], verifiedSourceRefs: links };
  const artifact = createHomeNarrativePacketArtifact({ ...args, packet });

  it("round-trips only with the exact tenant, assessment, row content and source links", () => {
    expect(verifiedHomeNarrativePacketArtifact(artifact, args)).toEqual(artifact);
    expect(verifiedHomeNarrativePacketArtifact(artifact, { ...args, tenantKey: "other" })).toBeNull();
    expect(verifiedHomeNarrativePacketArtifact(artifact, { ...args, assessmentId: "other" })).toBeNull();
    expect(verifiedHomeNarrativePacketArtifact(artifact, { ...args, rows: [{ ...row, title: "Changed" }] })).toBeNull();
    expect(verifiedHomeNarrativePacketArtifact(artifact, { ...args, rows: [{ ...row, display_payload_json: { contract_name: "Changed" } }] })).toBeNull();
    expect(verifiedHomeNarrativePacketArtifact(artifact, { ...args, verifiedSourceRefs: new Map() })).toBeNull();
    expect(verifiedHomeNarrativePacketArtifact({ ...artifact, packetHash: "wrong" }, args)).toBeNull();
    expect(verifiedHomeNarrativePacketArtifact({ ...artifact, packet: { ...packet, signals: [] } }, args)).toBeNull();
  });

  it("normalizes the serving view wrapper and excludes authored rows from the factual hash", () => {
    const writerRow = { ...row, quality_state: "passed", value_state: "known", basis_summary: "Source-backed" };
    const servingRow = {
      ...row,
      display_payload_json: { ...writerRow, display_payload_json: row.display_payload_json },
    };
    expect(homeNarrativeFactualRowsHash([servingRow])).toBe(homeNarrativeFactualRowsHash([writerRow]));
    expect(homeNarrativeFactualRowsHash([{
      ...servingRow,
      display_payload_json: { ...servingRow.display_payload_json, quality_state: "failed" },
    }])).not.toBe(homeNarrativeFactualRowsHash([writerRow]));
    expect(homeNarrativeFactualRowsHash([row, { ...row, row_type: "chapter_claim", row_key: "claim-1" }])).toBe(
      homeNarrativeFactualRowsHash([row]),
    );
  });
});
