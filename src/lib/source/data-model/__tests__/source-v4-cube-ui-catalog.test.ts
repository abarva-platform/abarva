import fs from "node:fs";
import yaml from "js-yaml";
import {
  SOURCE_V4_CUBE_UI_LENSES,
  sourceV4CubeLensesForDomain,
  type SourceV4QuestionDomain,
} from "../source-v4-cube-ui-catalog";

interface CubeModel {
  cubes?: Array<{
    name: string;
    hierarchies?: Array<{
      name: string;
      levels?: string[];
    }>;
  }>;
  views?: Array<{
    name: string;
    cubes?: Array<{
      join_path: string;
      includes?: string[];
    }>;
  }>;
}

interface QuestionBank {
  rows?: Array<{ domain: SourceV4QuestionDomain }>;
  questions?: Array<{ domain: SourceV4QuestionDomain }>;
}

const cubeModel = yaml.load(
  fs.readFileSync("cube/model/source_sourcing_v4.yml", "utf8"),
) as CubeModel;
const questionBank = JSON.parse(
  fs.readFileSync(
    "docs/source/skyharbor-v4/source_v4_question_bank.json",
    "utf8",
  ),
) as QuestionBank;

function includesForView(viewName: string): Set<string> {
  const view = cubeModel.views?.find(
    (candidate) => candidate.name === viewName,
  );
  return new Set((view?.cubes ?? []).flatMap((cube) => cube.includes ?? []));
}

function hierarchyLevelsByName(): Map<string, string[]> {
  const levels = new Map<string, string[]>();

  for (const cube of cubeModel.cubes ?? []) {
    for (const hierarchy of cube.hierarchies ?? []) {
      levels.set(hierarchy.name, hierarchy.levels ?? []);
    }
  }

  return levels;
}

describe("Source v4 Cube UI catalog", () => {
  it("points every UI lens at a deployed v4 Cube view and exposed include list", () => {
    const viewNames = new Set((cubeModel.views ?? []).map((view) => view.name));

    for (const lens of SOURCE_V4_CUBE_UI_LENSES) {
      expect(viewNames).toContain(lens.cubeView);

      const exposedIncludes = includesForView(lens.cubeView);
      for (const include of lens.requiredIncludes) {
        expect(exposedIncludes).toContain(include);
      }
      for (const hierarchy of lens.requiredHierarchies) {
        expect(exposedIncludes).toContain(hierarchy);
      }
      expect(lens.requiredHierarchies).toContain(lens.defaultHierarchy);
    }
  });

  it("backs every default drill path with an ordered Cube hierarchy", () => {
    const hierarchyLevels = hierarchyLevelsByName();

    for (const lens of SOURCE_V4_CUBE_UI_LENSES) {
      expect(hierarchyLevels.has(lens.defaultHierarchy)).toBe(true);
      expect(hierarchyLevels.get(lens.defaultHierarchy)).toEqual(
        lens.defaultDrillPath,
      );
    }
  });

  it("covers every domain in the 150-question Source v4 evidence bank", () => {
    const questions = questionBank.rows ?? questionBank.questions ?? [];
    const domains = new Set(questions.map((row) => row.domain));
    expect(domains.size).toBe(13);

    for (const domain of domains) {
      const lenses = sourceV4CubeLensesForDomain(domain);
      expect(lenses.length).toBeGreaterThan(0);
      expect(lenses.every((lens) => lens.defaultDrillPath.length > 0)).toBe(
        true,
      );
      expect(lenses.every((lens) => lens.defaultHierarchy.length > 0)).toBe(
        true,
      );
      expect(lenses.every((lens) => lens.sourceDomains.length > 0)).toBe(true);
    }
  });

  it("keeps AI-tool value proof honest instead of converting adoption into value", () => {
    const aiLens = SOURCE_V4_CUBE_UI_LENSES.find(
      (lens) => lens.id === "ai_usage_value_proof",
    );

    expect(aiLens).toBeDefined();
    expect(aiLens?.requiredIncludes).toEqual(
      expect.arrayContaining([
        "assigned_seats",
        "active_users",
        "actual_cost",
        "claimable_rows",
        "baseline_metric_state",
        "finance_validation_state",
        "claimable_value_state",
      ]),
    );
    expect(aiLens?.prohibitedOverstatements.join(" ")).toMatch(
      /productivity improved/i,
    );
    expect(aiLens?.prohibitedOverstatements.join(" ")).toMatch(
      /unknown or unvalidated value as zero/i,
    );
    expect(aiLens?.prohibitedOverstatements.join(" ")).toMatch(
      /baseline and finance validation/i,
    );
  });
});
