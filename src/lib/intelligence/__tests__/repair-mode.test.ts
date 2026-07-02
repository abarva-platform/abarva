import { isBlockingIntelligenceRepairEnabled } from "@/lib/intelligence/repair-mode";

describe("Intelligence live repair mode", () => {
  const oldRepairMode = process.env.INTELLIGENCE_LIVE_REPAIR_MODE;
  const oldDisableRepair = process.env.INTELLIGENCE_DISABLE_BLOCKING_REPAIR;

  afterEach(() => {
    if (oldRepairMode === undefined) {
      delete process.env.INTELLIGENCE_LIVE_REPAIR_MODE;
    } else {
      process.env.INTELLIGENCE_LIVE_REPAIR_MODE = oldRepairMode;
    }
    if (oldDisableRepair === undefined) {
      delete process.env.INTELLIGENCE_DISABLE_BLOCKING_REPAIR;
    } else {
      process.env.INTELLIGENCE_DISABLE_BLOCKING_REPAIR = oldDisableRepair;
    }
  });

  it("disables blocking repair by default for the live path", () => {
    delete process.env.INTELLIGENCE_LIVE_REPAIR_MODE;
    delete process.env.INTELLIGENCE_DISABLE_BLOCKING_REPAIR;

    expect(isBlockingIntelligenceRepairEnabled()).toBe(false);
  });

  it("allows old blocking repair only by explicit opt-in", () => {
    process.env.INTELLIGENCE_LIVE_REPAIR_MODE = "blocking";
    delete process.env.INTELLIGENCE_DISABLE_BLOCKING_REPAIR;

    expect(isBlockingIntelligenceRepairEnabled()).toBe(true);
  });

  it("lets the disable flag win over repair opt-in", () => {
    process.env.INTELLIGENCE_LIVE_REPAIR_MODE = "blocking";
    process.env.INTELLIGENCE_DISABLE_BLOCKING_REPAIR = "true";

    expect(isBlockingIntelligenceRepairEnabled()).toBe(false);
  });
});

