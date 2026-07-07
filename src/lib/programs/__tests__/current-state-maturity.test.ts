import {
  scoreMaturity,
  deriveCapabilityGaps,
  rankLeverage,
  buildCurrentStateRecommendation,
  type MaturitySignals,
  type DimensionScore,
} from "../current-state-maturity";
import { emptyProfile, type MoveProfile } from "../current-state-readiness";
import type { TenancyCtx } from "@/lib/programs/types.db";

// Mock read client: serves rows for tower_dora_metrics and counts for the rest.
const cfg: {
  doraRows: Record<string, unknown>[];
  counts: Record<string, number>;
} = { doraRows: [], counts: {} };

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from(table: string) {
      let head = false;
      const b: Record<string, unknown> = {};
      b.select = (_cols: string, opts?: { head?: boolean }) => {
        if (opts && opts.head) head = true;
        return b;
      };
      b.eq = () => b;
      b.limit = () => b;
      b.then = (res: (v: unknown) => unknown) =>
        res({
          data: head
            ? null
            : table === "tower_dora_metrics"
              ? cfg.doraRows
              : [],
          count: head ? (cfg.counts[table] ?? 0) : null,
          error: null,
        });
      return b;
    },
  }),
}));

const ctx: TenancyCtx = {
  clientId: "00000000-0000-4000-8000-0000000000aa",
  clientKey: "skyharbor-air",
  userId: "u",
  role: "maestro",
  email: "x@y.z",
} as TenancyCtx;

const profile = (over: Partial<MoveProfile>): MoveProfile => ({
  ...emptyProfile(),
  ...over,
});

const DORA_GOOD: MaturitySignals = {
  dora: {
    rows: 7,
    avgDeployFreq: 3.5,
    avgCfr: 12,
    avgMttr: 3,
    avgLeadTime: 18,
  },
};

beforeEach(() => {
  cfg.doraRows = [];
  cfg.counts = {};
});

describe("scoreMaturity", () => {
  it("returns all insufficient_evidence when no signals are committed", () => {
    const s = scoreMaturity(emptyProfile(), {});
    expect(s).toHaveLength(8);
    expect(s.every((d) => d.score === null)).toBe(true);
    expect(s.every((d) => d.confidence === "insufficient_evidence")).toBe(true);
  });

  it("scores platform + operating-model from DORA, cited to tower_dora_metrics", () => {
    const s = scoreMaturity(emptyProfile(), DORA_GOOD);
    const plat = s.find((d) => d.dimension === "platform_infrastructure");
    const ops = s.find((d) => d.dimension === "operating_model_process");
    expect(plat?.score).toBe(4); // 3.5/day >= 3
    expect(plat?.citation).toBe("tower_dora_metrics");
    expect(ops?.score).toBeGreaterThanOrEqual(3);
  });

  it("low deploy frequency lowers the platform score (no silent zero)", () => {
    const s = scoreMaturity(emptyProfile(), {
      dora: {
        rows: 2,
        avgDeployFreq: 0.3,
        avgCfr: 22,
        avgMttr: 10,
        avgLeadTime: 60,
      },
    });
    expect(
      s.find((d) => d.dimension === "platform_infrastructure")?.score,
    ).toBe(2);
  });

  it("data dimensions stay insufficient_evidence without data-estate evidence", () => {
    const s = scoreMaturity(emptyProfile(), DORA_GOOD);
    expect(s.find((d) => d.dimension === "data_governance")?.score).toBeNull();
  });
});

describe("deriveCapabilityGaps — two-gap model", () => {
  it("tags foundation vs use_case and assigns severity by delta", () => {
    const scores = scoreMaturity(emptyProfile(), DORA_GOOD);
    const gaps = deriveCapabilityGaps(scores, 4);
    const gov = gaps.find((g) => g.dimension === "data_governance");
    const ops = gaps.find((g) => g.dimension === "operating_model_process");
    expect(gov?.gapType).toBe("foundation");
    if (ops) expect(ops.gapType).toBe("use_case");
  });

  it("unassessed dimensions surface as honest gaps, not hidden", () => {
    const gaps = deriveCapabilityGaps(scoreMaturity(emptyProfile(), {}), 4);
    expect(gaps.length).toBeGreaterThan(0);
    expect(
      gaps.every((g) => g.currentScore === null || g.currentScore < 4),
    ).toBe(true);
  });
});

describe("rankLeverage — non-linear by archetype, explainable", () => {
  const scores = scoreMaturity(emptyProfile(), DORA_GOOD);
  const gaps = deriveCapabilityGaps(scores);

  it("ranks full-stack above mainframe at equal readiness/upside", () => {
    const r = rankLeverage(
      profile({ teamArchetypes: ["mainframe", "full_stack_cloud"] }),
      scores,
      gaps,
    );
    expect(r[0].teamArchetype).toBe("full_stack_cloud");
    expect(r[0].rank).toBe(1);
    expect(r[0].aiApplicability).toBeGreaterThan(r[1].aiApplicability);
    expect(r[0].score).toBeGreaterThan(r[1].score);
  });

  it("score equals applicability × readiness × gapUpside (auditable)", () => {
    const r = rankLeverage(
      profile({ teamArchetypes: ["full_stack_cloud"] }),
      scores,
      gaps,
    );
    const t = r[0];
    expect(t.score).toBeCloseTo(
      Number(
        (t.aiApplicability * t.normalizedReadiness * t.gapUpside).toFixed(4),
      ),
      4,
    );
  });

  it("every term carries a citation/basis string", () => {
    const r = rankLeverage(
      profile({ teamArchetypes: ["full_stack_cloud"] }),
      scores,
      gaps,
    );
    expect(r[0].aiApplicabilityBasis).toMatch(/AI-amenable/);
    expect(r[0].readinessBasis).toMatch(/readiness|scored/i);
    expect(r[0].gapUpsideBasis).toMatch(/use-case/);
  });

  it("empty profile yields an empty ranking", () => {
    expect(rankLeverage(emptyProfile(), scores, gaps)).toEqual([]);
  });

  it("flags insufficient_evidence confidence when no readiness dims are scored", () => {
    const noScores: DimensionScore[] = scoreMaturity(emptyProfile(), {});
    const r = rankLeverage(
      profile({ teamArchetypes: ["full_stack_cloud"] }),
      noScores,
      deriveCapabilityGaps(noScores),
    );
    expect(r[0].confidence).toBe("insufficient_evidence");
  });
});

describe("buildCurrentStateRecommendation — orchestration", () => {
  it("produces a where-to-start recommendation from committed DORA evidence", async () => {
    cfg.doraRows = [
      {
        deployment_frequency_per_day: 3.5,
        change_failure_rate_pct: 12,
        mttr_hours: 3,
        lead_time_for_changes_hours: 18,
      },
    ];
    const rec = await buildCurrentStateRecommendation(
      ctx,
      profile({ teamArchetypes: ["full_stack_cloud"] }),
    );
    expect(
      rec.maturity.find((d) => d.dimension === "platform_infrastructure")
        ?.score,
    ).toBe(4);
    expect(rec.ranking[0].teamArchetype).toBe("full_stack_cloud");
    expect(rec.whereToStart).toMatch(/Full-stack/);
    expect(rec.overallConfidence).not.toBe("insufficient_evidence");
  });

  it("says to collect more when nothing is committed", async () => {
    const rec = await buildCurrentStateRecommendation(ctx, emptyProfile());
    expect(rec.overallConfidence).toBe("insufficient_evidence");
    expect(rec.whereToStart).toMatch(/collect|under-evidenced|provisional/i);
  });
});
