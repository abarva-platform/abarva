import {
  evaluateTenantUsageCap,
  extractUsageTotalsFromMetadata,
} from "../tenant-usage-cap-policy";

const baseConfig = {
  tenantId: "client-apex",
  period: "weekly" as const,
  alertAtPercent: 80,
  blockAtPercent: 100,
  tokenCap: 10_000,
  costCapUsd: 25,
};

describe("tenant usage cap policy", () => {
  it("allows usage below configured token and cost alert thresholds", () => {
    expect(
      evaluateTenantUsageCap({
        config: baseConfig,
        current: { inputTokens: 1_000, outputTokens: 500, costUsd: 1 },
        pending: { inputTokens: 2_000, outputTokens: 500, costUsd: 2 },
      }),
    ).toMatchObject({
      decision: "allow",
      reason: "below_alert_threshold",
      tokensAfter: 4_000,
      tokenPercentAfter: 40,
      costAfterUsd: 3,
      costPercentAfter: 12,
      auditMetadata: {
        usage_cap_decision: "allow",
        usage_cap_blocks_model_call: false,
      },
    });
  });

  it("returns alert when pending usage crosses the token alert threshold", () => {
    expect(
      evaluateTenantUsageCap({
        config: baseConfig,
        current: { inputTokens: 6_000, outputTokens: 500, costUsd: 1 },
        pending: { inputTokens: 1_000, outputTokens: 600, costUsd: 1 },
      }),
    ).toMatchObject({
      decision: "alert",
      reason: "token_alert_threshold_reached",
      tokensAfter: 8_100,
      tokenPercentAfter: 81,
    });
  });

  it("blocks when pending usage reaches the hard token cap", () => {
    expect(
      evaluateTenantUsageCap({
        config: baseConfig,
        current: { inputTokens: 8_000, outputTokens: 1_000, costUsd: 2 },
        pending: { inputTokens: 900, outputTokens: 100, costUsd: 1 },
      }),
    ).toMatchObject({
      decision: "block",
      reason: "token_block_threshold_reached",
      tokensAfter: 10_000,
      tokenPercentAfter: 100,
      auditMetadata: {
        usage_cap_blocks_model_call: true,
      },
    });
  });

  it("blocks when cost reaches the hard cost cap even if tokens are under cap", () => {
    expect(
      evaluateTenantUsageCap({
        config: baseConfig,
        current: { inputTokens: 1_000, outputTokens: 500, costUsd: 24 },
        pending: { inputTokens: 100, outputTokens: 50, costUsd: 1 },
      }),
    ).toMatchObject({
      decision: "block",
      reason: "cost_block_threshold_reached",
      tokenPercentAfter: 16.5,
      costAfterUsd: 25,
      costPercentAfter: 100,
    });
  });

  it("fails closed when cap configuration is invalid", () => {
    expect(
      evaluateTenantUsageCap({
        config: {
          ...baseConfig,
          alertAtPercent: 95,
          blockAtPercent: 90,
        },
        current: { inputTokens: 1, outputTokens: 1 },
      }),
    ).toMatchObject({
      decision: "block",
      reason: "invalid_cap_configuration",
    });
  });

  it("extracts usage totals from flat or nested provider metadata", () => {
    expect(
      extractUsageTotalsFromMetadata({
        usage: {
          input_tokens: 1_200,
          output_tokens: 300,
          cost_usd: 0.0045,
        },
      }),
    ).toEqual({
      inputTokens: 1_200,
      outputTokens: 300,
      costUsd: 0.0045,
    });

    expect(
      extractUsageTotalsFromMetadata({
        promptTokens: 50,
        completionTokens: 10,
        estimatedCostUsd: 0.001,
      }),
    ).toEqual({
      inputTokens: 50,
      outputTokens: 10,
      costUsd: 0.001,
    });
  });
});
