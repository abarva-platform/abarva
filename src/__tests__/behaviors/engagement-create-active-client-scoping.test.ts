/**
 * U-513 · `/api/engagements/create/turn` must not scope sponsor candidates by
 * an account it never resolved.
 *
 * This is the third of the three guard-class call sites U-512 classified and
 * left as repair-owed; the classification of all 40 is
 * `docs/governance/unresolved-client-fallback-classification.md`.
 *
 * It is the one whose consequence is not a label. The route computes
 *
 * ```ts
 * const activeClientDisplayName =
 *   canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
 *   activeClient?.name ??
 *   null;
 * ```
 *
 * and then takes the **first token** of that name as an organization keyword and
 * filters the sponsor candidate list by it. `canonicalClientDisplayName` can
 * never return `null` -- it resolves anything unrecognised through
 * `getClientOption`, which answers the DEFAULT_CLIENT_KEY option -- so the
 * declared `null` end is unreachable, and a request whose tenant did not resolve
 * filters candidates by the *default account's* first token. Whoever that leaves
 * is then offered to the model as the set of people who could sponsor the
 * engagement.
 *
 * So the assertion that matters here is the candidate list, not the displayed
 * name. This is a POST harness against the real route: every collaborator is
 * stubbed at the module boundary, the response stream is drained, and the
 * candidate set handed to the prompt assembler is read back out.
 */

/** The keyword-scoped filter is at route.ts:62; the writes it feeds are :252 and :259. */
import {
  DEFAULT_CLIENT_KEY,
  getClientOption,
} from "@/lib/client-config";

const DEFAULT_ACCOUNT_NAME = getClientOption(DEFAULT_CLIENT_KEY).name;
/** "Retail Demo" -> "retail". The token the unresolved path filters by today. */
const DEFAULT_ACCOUNT_KEYWORD = DEFAULT_ACCOUNT_NAME.split(/\s+/)[0];

/** A key that reads successfully and resolves to no registered client. */
const UNREGISTERED_KEY = "not-a-registered-tenant";

// ---------------------------------------------------------------------------
// Module boundary. Every collaborator is stubbed so the case exercises the
// route's own logic and nothing else reaches a database, a graph or a model.
// ---------------------------------------------------------------------------

let assembledPrompt: {
  knownPersons?: Array<{ name: string; organization: string | null }>;
  activeClient?: { name: string; industryCode: string } | null;
} = {};
jest.mock("@/lib/agent/prompts/engagement-create", () => ({
  assembleEngagementCreateSystemPrompt: (args: Record<string, unknown>) => {
    assembledPrompt = args as typeof assembledPrompt;
    return "system prompt";
  },
}));

let streamedText = "no engagement block in this turn";
jest.mock("@/lib/agent/stream", () => ({
  streamAgentTurn: async function* () {
    yield streamedText;
  },
}));

const getAllPersons = jest.fn();
jest.mock("@/lib/db/person", () => ({
  getAllPersons: () => getAllPersons(),
  createPerson: jest.fn(),
}));

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRow(),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentMaestro: async () => ({ id: "maestro-1", graph_node_id: "m1" }),
}));
jest.mock("@/lib/db/engagement", () => ({
  createEngagement: jest.fn(async () => ({
    id: "e1",
    graph_node_id: "eg1",
    name: "An engagement",
    industry_code: "HEALTHCARE_IDN",
    function_code: "FRONT_OFFICE",
    objective_code: "GROW",
    topic_code: "T1",
    sponsor_person_id: "p-meridian",
  })),
  getEngagementByGraphId: jest.fn(async () => ({
    id: "e1",
    graph_node_id: "eg1",
    name: "An engagement",
    industry_code: "HEALTHCARE_IDN",
  })),
}));
jest.mock("@/lib/graph/engagement-sync", () => ({
  syncEngagementToGraph: jest.fn(async () => undefined),
}));
jest.mock("@/lib/graph/mutations", () => ({
  syncPersonToGraph: jest.fn(async () => undefined),
}));
jest.mock("@/lib/audit/log", () => ({ logAudit: jest.fn(async () => undefined) }));
jest.mock("@/lib/topics/db", () => ({ assignTopic: jest.fn(async () => undefined) }));

import { POST } from "@/app/api/engagements/create/turn/route";

/**
 * Two candidates in different organizations. Neither belongs to the default
 * account, so a correctly-unscoped run offers both and a run scoped by the
 * default account's keyword offers neither.
 */
const PERSONS = [
  {
    id: "p-meridian",
    graph_node_id: "g-meridian",
    name: "A Sponsor",
    role: "CFO",
    organization: "Meridian Health System",
    communication_style: { title: "CFO" },
  },
  {
    id: "p-apex",
    graph_node_id: "g-apex",
    name: "Another Sponsor",
    role: "COO",
    organization: "Apex Retail Group",
    communication_style: { title: "COO" },
  },
];

/** A turn that reaches the engagement-ready path, where `active_client` is emitted. */
const READY_BLOCK_TURN = `done <engagement_ready>${JSON.stringify({
  name: "An engagement",
  sponsor_graph_node_id: "g-meridian",
  industry_code: "HEALTHCARE_IDN",
  function_code: "FRONT_OFFICE",
  objective_code: "GROW",
  topic_code: "T1",
})}</engagement_ready>`;

async function postTurn(): Promise<Array<Record<string, unknown>>> {
  const response = await POST(
    new Request("http://localhost/api/engagements/create/turn", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }) as never,
  );
  const body = await response.text();
  return body
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function candidateOrganizations(): string[] {
  return (assembledPrompt.knownPersons ?? []).map((p) => p.organization ?? "");
}

beforeEach(() => {
  jest.clearAllMocks();
  assembledPrompt = {};
  streamedText = "no engagement block in this turn";
  getAllPersons.mockResolvedValue(PERSONS);
});

describe("POST /api/engagements/create/turn · sponsor scoping", () => {
  it("does not filter sponsor candidates when the client row carries an unregistered key", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "c1",
      key: UNREGISTERED_KEY,
      industry_code: "HEALTHCARE_IDN",
    });

    await postTurn();

    // The consequence, asserted where it lands: an unresolved tenant must not
    // narrow the candidate set by the default account's organization keyword.
    expect(candidateOrganizations()).toEqual([
      "Meridian Health System",
      "Apex Retail Group",
    ]);
  });

  it("does not filter sponsor candidates when the client row is absent", async () => {
    getActiveClientRow.mockResolvedValue(null);

    await postTurn();

    expect(candidateOrganizations()).toEqual([
      "Meridian Health System",
      "Apex Retail Group",
    ]);
  });

  it("emits no active_client for a blank row name, which is not nullish", async () => {
    // The second hole, the same shape U-512 found in `transformers.ts`: once the
    // resolver above can answer `null`, a blank row name reaches the next link,
    // and `"   "` is not nullish. Asserted on the emitted `active_client` at
    // route.ts:252 rather than on the candidate list, because that is the only
    // place the two spellings differ -- a blank keyword is falsy, so scoping is
    // already unfiltered either way.
    getActiveClientRow.mockResolvedValue({
      id: "c1",
      key: UNREGISTERED_KEY,
      name: "   ",
      industry_code: "HEALTHCARE_IDN",
    });
    streamedText = READY_BLOCK_TURN;

    const lines = await postTurn();
    const created = lines.find((line) => line.type === "engagement_created");

    expect(created).toBeDefined();
    expect(created?.active_client).toBeNull();
    expect(candidateOrganizations()).toEqual([
      "Meridian Health System",
      "Apex Retail Group",
    ]);
  });

  it("still scopes to a registered client, so the repair is not a blanket unscoping", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "c2",
      key: "meridian",
      name: "Meridian Health",
      industry_code: "HEALTHCARE_IDN",
    });

    await postTurn();

    expect(candidateOrganizations()).toEqual(["Meridian Health System"]);
  });

  it("names no account in the emitted active_client when the tenant is unresolved", async () => {
    // route.ts:252 writes `active_client` into the response the client renders,
    // and :259 logs it. Reached only on the engagement-ready path.
    getActiveClientRow.mockResolvedValue({
      id: "c1",
      key: UNREGISTERED_KEY,
      industry_code: "HEALTHCARE_IDN",
    });
    streamedText = READY_BLOCK_TURN;

    const lines = await postTurn();
    const created = lines.find((line) => line.type === "engagement_created");

    expect(created).toBeDefined();
    expect(created?.active_client).toBeNull();
    expect(created?.active_client).not.toBe(DEFAULT_ACCOUNT_NAME);
  });

  it("keeps the default account's keyword out of the scoping decision entirely", async () => {
    // A guard against a repair that happens to pass the cases above because the
    // default account's first token matches nothing in this fixture. Give a
    // candidate that organization and it must still not be selected for.
    getAllPersons.mockResolvedValue([
      ...PERSONS,
      {
        id: "p-default",
        graph_node_id: "g-default",
        name: "Default Account Sponsor",
        role: "CIO",
        organization: `${DEFAULT_ACCOUNT_KEYWORD} Holdings`,
        communication_style: { title: "CIO" },
      },
    ]);
    getActiveClientRow.mockResolvedValue({
      id: "c1",
      key: UNREGISTERED_KEY,
      industry_code: "HEALTHCARE_IDN",
    });

    await postTurn();

    expect(candidateOrganizations()).toHaveLength(3);
  });
});
