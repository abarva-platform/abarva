jest.mock("server-only", () => ({}));
jest.mock("../../../../scripts/ecl/synthetic_enterprise_home_job", () => ({
  blobProofStore: jest.fn(),
}));
import { createHash } from "node:crypto";
import {
  RepairInput,
  verifyOriginalRepairSource,
} from "@/scripts/moves-source-original-repair";
import { moveSourceRevision } from "../move-agent-admission";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fixture() {
  const bytes = Buffer.from("Synthetic original passage.\n"),
    hash = createHash("sha256").update(bytes).digest("hex");
  const file = "scripts/moves/fixtures/example/source.md";
  const source = {
    evidenceId: uuid(1),
    reviewId: uuid(2),
    beforeHash: "0".repeat(64),
    sourceFile: file,
    sourceSha256: hash,
  };
  const input = RepairInput.parse({
    version: 1,
    moveId: uuid(3),
    clientId: uuid(4),
    clientKey: "test",
    nativeTenantKey: "test",
    expectedPhase: 3,
    datasetId: "test",
    sourceSetHash: "a".repeat(64),
    sources: [source],
  });
  const common = {
    synthetic: true,
    client_attested: false,
    governance_dataset_id: input.datasetId,
    source_set_hash: input.sourceSetHash,
  };
  const evidence: Record<string, unknown> = {
    id: source.evidenceId,
    program_id: input.moveId,
    tenant_key: "test",
    phase: 2,
    attachment_id: null,
    extracted_text: bytes.toString(),
    extracted_structured: common,
  };
  const review: Record<string, unknown> = {
    id: source.reviewId,
    evidence_id: source.evidenceId,
    program_id: input.moveId,
    tenant_key: "test",
    phase: 2,
    decision: "approved",
    source_ref: { ...common, source_file: file, source_file_sha256: hash },
  };
  source.beforeHash = moveSourceRevision({ evidence, review });
  return { bytes, input, source, evidence, review };
}
it("accepts only the exact preflight and unchanged declared original bytes", () => {
  const f = fixture();
  expect(() =>
    verifyOriginalRepairSource(
      f.input,
      f.source,
      f.evidence,
      f.review,
      f.bytes,
    ),
  ).not.toThrow();
});
it.each([
  "bytes",
  "text",
  "tenant",
  "move",
  "review",
  "phase",
  "binding",
  "synthetic",
  "path",
  "snapshot",
])("refuses changed %s before mutation", (kind) => {
  const f = fixture();
  if (kind === "bytes") f.bytes = Buffer.from("Changed");
  if (kind === "text") f.evidence.extracted_text = "Changed";
  if (kind === "tenant") f.evidence.tenant_key = "other";
  if (kind === "move") f.review.program_id = uuid(9);
  if (kind === "review") f.review.decision = "pending";
  if (kind === "phase") f.input.expectedPhase = 1;
  if (kind === "binding")
    (f.review.source_ref as Record<string, unknown>).move_artifact_id = uuid(9);
  if (kind === "synthetic")
    (f.review.source_ref as Record<string, unknown>).client_attested = true;
  if (kind === "path")
    f.source.sourceFile = "scripts/moves/fixtures/../secret.md";
  if (kind === "snapshot") f.source.beforeHash = "f".repeat(64);
  // Match the captured snapshot for semantic guard tests: the guards must still reject.
  if (!["snapshot", "text"].includes(kind))
    f.source.beforeHash = moveSourceRevision({
      evidence: f.evidence,
      review: f.review,
    });
  expect(() =>
    verifyOriginalRepairSource(
      f.input,
      f.source,
      f.evidence,
      f.review,
      f.bytes,
    ),
  ).toThrow();
});
