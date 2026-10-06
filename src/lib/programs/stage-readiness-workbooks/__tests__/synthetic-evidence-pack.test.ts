import JSZip from "jszip";

import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { buildStageReadinessWorkbookSpec } from "../resolver";
import {
  buildSyntheticStageReadinessEvidencePack,
  renderSyntheticStageReadinessEvidencePackZip,
  SYNTHETIC_EVIDENCE_PACK_MARKER,
} from "../synthetic-evidence-pack";

const readiness: DiscoveryEvidenceReadiness = {
  blueprintId: "test_blueprint",
  blueprintVersion: "2026-08-20",
  archetypeLabel: "Regulated Agent Assist",
  blueprintBasis: "declared",
  unknownDeclaredArchetype: null,
  requiredTotal: 2,
  requiredCovered: 0,
  requiredMissing: 2,
  optionalCovered: 0,
  readinessScore: 0,
  readyForP3: false,
  families: [
    {
      familyId: "current_state_workflow_map",
      label: "Current-state workflow map",
      required: true,
      status: "missing",
      evidenceIds: [],
      evidenceTitles: [],
    },
    {
      familyId: "phi_privacy_security_controls",
      label: "PHI, privacy, security, and audit controls",
      required: true,
      status: "missing",
      evidenceIds: [],
      evidenceTitles: [],
    },
  ],
  gapRegister: [],
};

function buildSpec() {
  const packets = buildMoveEvidenceNeedPackets({
    moveId: "move-1",
    moveName: "Sample Move",
    currentPhase: 1,
    readiness,
  });
  return buildStageReadinessWorkbookSpec({
    moveId: "move-1",
    moveName: "Sample Move",
    phase: 1,
    nextPhase: 2,
    archetype: readiness.archetypeLabel,
    readiness,
    evidenceNeedPackets: packets,
    generatedAt: "2026-08-20T00:00:00.000Z",
  });
}

describe("synthetic stage readiness evidence pack", () => {
  it("generates uploadable individual sample files mapped to workbook questions", () => {
    const spec = buildSpec();
    const pack = buildSyntheticStageReadinessEvidencePack(spec);

    expect(pack.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "README.md",
        "manifest.json",
        "workbook-question-map.csv",
        "business-and-process/interview-notes.md",
        "risk-security-and-controls/evidence-register.csv",
        "cross-functional/controls-and-decision-rights.csv",
        "cross-functional/baseline-metrics-template.csv",
      ]),
    );
    expect(pack.files.every((file) => file.content.includes(SYNTHETIC_EVIDENCE_PACK_MARKER))).toBe(
      true,
    );
    expect(pack.files.every((file) => !file.path.endsWith(".zip"))).toBe(true);
    expect(
      pack.files.find((file) => file.path === "workbook-question-map.csv")
        ?.content,
    ).toContain("q_current_state_workflow_map_current_state");
    expect(pack.files.find((file) => file.path === "README.md")?.content).toContain(
      "Upload the individual markdown, CSV, or JSON files",
    );
  });

  it("renders a zip that contains the marked sample files", async () => {
    const zipBytes = await renderSyntheticStageReadinessEvidencePackZip(
      buildSpec(),
    );

    expect(zipBytes.subarray(0, 2).toString("latin1")).toBe("PK");
    const zip = await JSZip.loadAsync(zipBytes);
    const readme = await zip.file("README.md")?.async("string");
    const manifest = await zip.file("manifest.json")?.async("string");

    expect(readme).toContain(SYNTHETIC_EVIDENCE_PACK_MARKER);
    expect(manifest).toContain("sample_not_client_attested");
  });
});
