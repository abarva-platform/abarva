import { composeOriginateFirstMessage } from "@/components/strategic-moves/composeOriginateFirstMessage";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { getOpenDraft, type OriginationDraftRow } from "@/lib/programs/origination-drafts";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

// Isolate the composer from the persistence layer (intelligence path never reads it).
jest.mock("@/lib/programs/origination-drafts", () => ({
  getOpenDraft: jest.fn(async () => null),
}));

const ctx = {} as TenancyCtx;

jest.mock("@/lib/auth/server-module-access", () => ({ requireProductModule: jest.fn(async () => undefined) }));
jest.mock("@/app/api/v1/programs/_auth", () => ({ requireTenancy: jest.fn(async () => ctx) }));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: jest.fn(async () => ({ key: "tenant-a", name: "Tenant A" })) }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: jest.fn() }));
jest.mock("@/lib/deliverables/orchestrator/briefs/archetype-declaration-surface", () => ({
  listEffectiveDiscoveryArchetypeOptions: () => [],
  resolveEffectiveDeclaredDiscoveryBlueprint: (id: string) => id === "governed_data_foundation" ? { blueprintId: id } : null,
}));
jest.mock("@/components/shell/AppShell", () => ({ AppShell: () => null }));
jest.mock("@/components/strategic-moves/StrategicMoveOriginateClient", () => ({ StrategicMoveOriginateClient: () => null }));

describe("origination saved-draft wiring", () => {
  const draft: OriginationDraftRow = {
    id: "draft-a", surface: "/strategic-moves/new", committed_engagement_id: null, updated_at: "2026-10-11T00:00:00Z",
    state: { turns: [{ id: "turn-a", role: "user", text: "Existing intake answer" }], patternMatch: null,
      brief: { programName: "Existing Intake", problemStatement: "An existing problem", targetOutcome: null,
        timeline: null, classification: null, discoveryArchetypeId: "governed_data_foundation",
        matchedPatternId: null, sponsor: null, lead: null, crossProgramDependencies: [],
        intakeFields: { "problem-statement": "An existing problem" }, sponsorProgressEmails: false } },
  };
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getOpenDraft).mockResolvedValue(draft);
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
  });
  const pageProps = async (params: Record<string, string> = {}) => {
    const Page = (await import("@/app/(maestro)/strategic-moves/new/page")).default;
    const tree = await Page({ searchParams: Promise.resolve(params) });
    return (tree.props as { children: { props: { initialDraftState: unknown; initialDraftUnavailable: boolean; initialDiscoveryArchetypeId: string | null } } }).children.props;
  };
  it("shares the single authenticated draft read between the opening and flagged canvas", async () => {
    const props = await pageProps();
    expect(getOpenDraft).toHaveBeenCalledTimes(1);
    expect(getOpenDraft).toHaveBeenCalledWith(ctx, "/strategic-moves/new", { failOnReadError: true });
    expect(props.initialDraftState).toEqual(draft.state);
    expect(props.initialDiscoveryArchetypeId).toBe("governed_data_foundation");
    expect(props.initialDraftUnavailable).toBe(false);
  });
  it("distinguishes an absent draft from an unavailable saved intake", async () => {
    jest.mocked(getOpenDraft).mockResolvedValueOnce(null);
    expect(await pageProps()).toEqual(expect.objectContaining({ initialDraftState: null, initialDraftUnavailable: false }));
    jest.mocked(getOpenDraft).mockRejectedValueOnce(new Error("read unavailable"));
    expect(await pageProps()).toEqual(expect.objectContaining({ initialDraftState: null, initialDraftUnavailable: true }));
  });
  it("retains flag-off reads and does not hydrate the extended intake", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(false);
    const props = await pageProps();
    expect(getOpenDraft).toHaveBeenCalledTimes(2);
    expect(props.initialDraftState).toBeNull();
    expect(props.initialDraftUnavailable).toBe(false);
  });
  it("does not mix a saved intake into a fresh initiative entry or a committed draft", async () => {
    expect((await pageProps({ fromInitiative: "1", fromId: "INIT-A" })).initialDraftState).toBeNull();
    jest.mocked(getOpenDraft).mockResolvedValueOnce({ ...draft, committed_engagement_id: "move-a" });
    expect((await pageProps()).initialDraftState).toBeNull();
  });
});

describe("composeOriginateFirstMessage — grounding guard", () => {
  it("cites a treasury pattern when the inbound id is in-namespace", async () => {
    const msg = await composeOriginateFirstMessage(ctx, null, {
      patternId: "LSH-TMS-002",
      patternName: "Bank connectivity matrix clears before rollout",
      useCaseName: "Kyriba global treasury rollout",
    });
    expect(msg.text).toContain("LSH-TMS-002");
    expect(msg.text).toContain("Binding pattern:");
  });

  it("drops an off-namespace corpus id and NEVER echoes it into the Move", async () => {
    const msg = await composeOriginateFirstMessage(ctx, null, {
      patternId: "PAT-LSH-D18-00479",
      patternName:
        "Prioritize City and State Procurement Calendars For Timing Local Bids",
      useCaseName: "Kyriba global treasury rollout",
    });
    // Acceptance: the off-namespace id must never appear in the Move text.
    expect(msg.text).not.toContain("PAT-LSH-D18-00479");
    expect(msg.text).not.toContain("Procurement Calendars");
    expect(msg.text.toLowerCase()).toContain("off-namespace");
    expect(msg.id).not.toContain("pat-lsh-d18-00479");
  });
});
