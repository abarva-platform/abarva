/**
 * Item T-495 · suite 4 of the claimable half.
 *
 * WHAT THIS REPLACES. Until 2026-09-28 this file held one case that read
 * `ask/index.ts` as TEXT, located the literal `const sourceContract360PromptBlock =`
 * and `conversationContextBlock:`, and required the substring
 * `sourceContract360PromptBlock,` to sit before `opts.conversationContextBlock,`
 * inside that slice. It was green, and it would have stayed green with the block
 * computed from the wrong context, filtered out before the join, or never passed
 * to the synthesizer at all, so long as the words stayed in that order. It would
 * have gone red on a rename or a reformat that changed nothing a reader sees.
 * It was DELETED rather than sharpened: a tighter pattern is the same defect with
 * a longer fuse.
 *
 * WHAT THE CASES BELOW ASSERT, BY EXECUTION. They drive the real
 * `askIntelligence` with a Source Contract 360 surface context and read what
 * actually reached the model through the synthesizer's own `onModelInput` hook:
 *
 *  1. a selected contract's block reaches the model's system input — both of
 *     the shapes `readSelectedSourceContractContext` accepts;
 *  2. it arrives AHEAD of the caller's own conversation context, which is the
 *     ordering the deleted case was trying to express;
 *  3. with no contract selected, no block is sent — the case that fails if the
 *     block is made unconditional.
 *
 * WHAT IS MOCKED AND WHAT IS NOT. Retrieval is mocked at the same module
 * boundaries `c412-ask-answer-mode-wiring.test.ts` uses, and the audited
 * Anthropic client is mocked, because both are I/O. `askIntelligence`, the
 * synthesizer, `buildSourceContract360PromptBlock` and the model-input cleaner
 * all run for real. Expected text is produced by calling the product's own
 * builder over the same surface context, so no literal in this file can drift
 * from it.
 *
 * The contract below is a synthetic fixture: its ids and names identify nothing.
 */

jest.mock("server-only", () => ({}));

jest.mock("../retrievers/ecl-serving-context", () => ({
  isEclProjectionProvider: () => false,
  retrieveEclServingContextSources: async () => [],
}));
jest.mock("../retrievers/curated-dossier", () => ({
  retrieveCuratedDossierSources: async () => ({ sources: [] }),
}));
jest.mock("@/lib/knowledge/tenant-enterprise-context", () => ({
  retrieveTenantEnterpriseSources: async () => [],
  retrieveTenantStructuredFacts: async () => [],
}));
jest.mock("@/lib/knowledge/tenant-technology-context", () => ({
  retrieveTenantTechnologySources: async () => [],
}));
jest.mock("../retrievers/retail-overlay", () => ({
  retrieveRetailOverlaySources: async () => [],
}));
jest.mock("../router", () => ({
  route: async () => ({ sources: [] }),
}));
jest.mock("../retrievers/worldview", () => ({
  retrieveWorldview: async () => ({ sources: [] }),
}));
jest.mock("../tenant-fact-fingerprint", () => ({
  getTenantFactFingerprint: async () => ({}),
  formatTenantFactAvailabilityBlock: () => "",
}));
jest.mock("../canonical-landscape-source", () => ({
  buildCanonicalLandscapeSource: async () => null,
}));
jest.mock("../client-grounding-packet", () => ({
  buildClientGroundingPacketSource: () => null,
}));

const getAuditedAnthropicClient = jest.fn();
jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

import { cleanIntelligenceModelInputText } from "@/lib/intelligence/model-input-cleaner";
import { buildSourceContract360PromptBlock } from "@/lib/source/ava/portfolio-fallback-answer";
import { askIntelligence } from "../index";
import type { AskSurfaceContext } from "../types";

/** The name `ask/index.ts` falls back to when neither a tenant nor an active client is given. */
const FALLBACK_TENANT_NAME = "the active tenant";

const QUESTION = "Should we renew this contract early?";

/** A caller-supplied context block, so its position relative to the Contract 360 block is checkable. */
const CALLER_CONTEXT = "T495 CALLER CONVERSATION CONTEXT SENTINEL";

/** The Contract 360 page's own shape: `sourceContract360Mode` with the contract fields inline. */
const DIRECT_CONTRACT_CONTEXT: AskSurfaceContext = {
  activeTab: "contract-360",
  module: "Source",
  sourceContract360Mode: true,
  contractId: "CT-T495-0001",
  contractName: "Managed network services",
  vendorName: "Example Network Vendor",
  annualValue: 1_250_000,
  endDate: "2027-03-31",
  evidencePosture: "contract book loaded, invoices not reconciled",
  nextAction: "confirm renewal notice window",
};

/** The Source workspace shape: the selected contract nested under `sourceV4.selectedContract`. */
const WORKSPACE_CONTRACT_CONTEXT: AskSurfaceContext = {
  activeTab: "portfolio",
  module: "Source",
  sourceV4: {
    selectedContract: {
      contractId: "CT-T495-0002",
      contractName: "Service desk outsourcing",
      vendorName: "Example Service Vendor",
      annualValueUsd: 640_000,
    },
  },
};

/** A Source surface with nothing selected. */
const NO_CONTRACT_CONTEXT: AskSurfaceContext = {
  activeTab: "portfolio",
  module: "Source",
  sourceContract360Mode: false,
};

/**
 * The block the product builds for a surface context, as the lines the model
 * should receive. Lines rather than one string because the synthesizer cleans
 * the whole system prompt at once, so the block is compared line by line after
 * the same cleaner. Asserted non-empty by the callers that expect a block.
 */
function expectedBlockLines(context: AskSurfaceContext): string[] {
  const block = buildSourceContract360PromptBlock(
    context as Record<string, unknown>,
    FALLBACK_TENANT_NAME,
  );
  return block
    .split("\n")
    .map((line) => cleanIntelligenceModelInputText(line).trim())
    .filter(Boolean);
}

/** The block's first line — present exactly when a block was built. */
function blockHeader(context: AskSurfaceContext): string {
  const lines = expectedBlockLines(context);
  expect(lines.length).toBeGreaterThan(1);
  return lines[0];
}

async function runAsk(args: {
  surfaceContext: AskSurfaceContext;
  conversationContextBlock?: string;
}): Promise<{
  modelInputs: { system: string; user: string }[];
  eventTypes: string[];
}> {
  getAuditedAnthropicClient.mockReset();
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-t495-c360",
    client: {
      messages: {
        create: async () => ({
          async *[Symbol.asyncIterator]() {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "Renewal read." },
            };
          },
        }),
      },
    },
  });

  const modelInputs: { system: string; user: string }[] = [];
  const eventTypes: string[] = [];
  for await (const event of askIntelligence(QUESTION, {
    // Required for the synthesizer to reach the model at all.
    tenantId: "tenant-t495",
    tenantClientKey: "skyharbor-air",
    richText: true,
    surfaceContext: args.surfaceContext,
    conversationContextBlock: args.conversationContextBlock,
    onModelInput: (parts) => modelInputs.push(parts),
  })) {
    eventTypes.push(event.type);
  }
  return { modelInputs, eventTypes };
}

/** One model call and a completed turn, so an empty capture cannot make a case vacuous. */
function expectOneCompletedCall(run: {
  modelInputs: unknown[];
  eventTypes: string[];
}) {
  expect({
    modelCalls: run.modelInputs.length,
    completed: run.eventTypes.includes("done"),
    refused: run.eventTypes.includes("error"),
  }).toEqual({ modelCalls: 1, completed: true, refused: false });
}

describe("T-495 · Source Contract 360 context reaches Ask synthesis", () => {
  // The synthesizer refuses before the behaviour under test when this is unset.
  // Restored afterwards: jest shares one process.env across a worker's suites.
  const ORIGINAL_API_KEY = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = "test-key-t495";
  });

  afterAll(() => {
    if (ORIGINAL_API_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIGINAL_API_KEY;
  });

  it.each([
    ["the Contract 360 page", DIRECT_CONTRACT_CONTEXT, "Example Network Vendor"],
    ["the Source workspace selection", WORKSPACE_CONTRACT_CONTEXT, "Example Service Vendor"],
  ])(
    "sends the selected contract's block to the model when it comes from %s",
    async (_label, surfaceContext, vendorName) => {
      const lines = expectedBlockLines(surfaceContext);
      // The block names the selected contract's vendor, so the lines below are
      // this contract's and not a generic header any context would produce. The
      // vendor rather than the contract id: the model-input cleaner rewrites
      // internal ids before any model call, which is its own control and not
      // this suite's subject.
      expect(lines.some((line) => line.includes(vendorName))).toBe(true);

      const run = await runAsk({ surfaceContext });
      expectOneCompletedCall(run);

      const { system } = run.modelInputs[0];
      for (const line of lines) {
        expect({ line, sent: system.includes(line) }).toEqual({
          line,
          sent: true,
        });
      }
    },
    30000,
  );

  it("places the Contract 360 block ahead of the caller's conversation context", async () => {
    const run = await runAsk({
      surfaceContext: DIRECT_CONTRACT_CONTEXT,
      conversationContextBlock: CALLER_CONTEXT,
    });
    expectOneCompletedCall(run);

    const { system } = run.modelInputs[0];
    const blockAt = system.indexOf(blockHeader(DIRECT_CONTRACT_CONTEXT));
    const callerAt = system.indexOf(CALLER_CONTEXT);
    // Both present, then ordered — an absent block would otherwise read as -1 < n.
    expect({ blockSent: blockAt >= 0, callerSent: callerAt >= 0 }).toEqual({
      blockSent: true,
      callerSent: true,
    });
    expect(blockAt).toBeLessThan(callerAt);
  }, 30000);

  it("sends no Contract 360 block when no contract is selected", async () => {
    // The header is read from a context that DOES build a block, because the
    // no-contract context builds none and so has no header of its own to look for.
    const header = blockHeader(DIRECT_CONTRACT_CONTEXT);
    expect(
      buildSourceContract360PromptBlock(
        NO_CONTRACT_CONTEXT as Record<string, unknown>,
        FALLBACK_TENANT_NAME,
      ),
    ).toBe("");

    const run = await runAsk({ surfaceContext: NO_CONTRACT_CONTEXT });
    expectOneCompletedCall(run);

    const { system, user } = run.modelInputs[0];
    expect({
      inSystem: system.includes(header),
      inUser: user.includes(header),
    }).toEqual({ inSystem: false, inUser: false });
  }, 30000);
});
