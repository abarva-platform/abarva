import { phaseAssignmentForArtifact } from "../strategic-moves-artifact-standard";
import { artifactHonestyDiscipline } from "../orchestrator/prompt-builder";
import {
  ROADMAP_SO_OPEN,
  ROADMAP_SO_CLOSE,
} from "../roadmap-structured-output";

describe("both pipelines wire the SAME structured-output instruction into the roadmap prompt", () => {
  it("golden-bar: execution_roadmap assignment carries the structured block markers", () => {
    const prompt = phaseAssignmentForArtifact({
      artifact: "execution_roadmap",
      phase: 4,
    });
    expect(prompt).toContain(ROADMAP_SO_OPEN);
    expect(prompt).toContain(ROADMAP_SO_CLOSE);
  });

  it("orchestrator: the moves roadmap honesty discipline (fed into every generation pass) carries the markers", () => {
    const req = {
      module: "moves",
      deliverableType: "execution_roadmap",
    } as unknown as Parameters<typeof artifactHonestyDiscipline>[0];
    const discipline = artifactHonestyDiscipline(req);
    expect(discipline).toContain(ROADMAP_SO_OPEN);
    expect(discipline).toContain(ROADMAP_SO_CLOSE);
  });

  it("orchestrator: a non-roadmap moves artifact does NOT carry the roadmap block", () => {
    const req = {
      module: "moves",
      deliverableType: "business_case",
    } as unknown as Parameters<typeof artifactHonestyDiscipline>[0];
    expect(artifactHonestyDiscipline(req)).not.toContain(ROADMAP_SO_OPEN);
  });

  it("a non-roadmap artifact does NOT carry the roadmap structured block", () => {
    const prompt = phaseAssignmentForArtifact({
      artifact: "charter",
      phase: 1,
    });
    expect(prompt).not.toContain(ROADMAP_SO_OPEN);
  });
});
