import { findCurrentAcceptedClientFinal } from "../current-client-final";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";

jest.mock("@/lib/source/file-cabinet/repository", () => ({
  listSourceArtifacts: jest.fn(),
}));
jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: jest.fn(() => "canonical-tenant"),
}));

const list = jest.mocked(listSourceArtifacts);
const appTenantKey = "synthetic-tenant";
const scope = { tenantKey: "canonical-tenant" };
const accepted = {
  id: "final-1",
  sourceEventId: "event-1",
  tenantKey: scope.tenantKey,
  artifactType: "d01_strategy_memo",
  artifactGroup: "approval",
  status: "client_final",
  lifecycleState: "current",
  isClientFinal: true,
  isCurrentAuthoritative: true,
  clientFinalAcceptedBy: "owner-1",
  clientFinalAcceptedAt: "2026-09-29T14:55:28Z",
};

beforeEach(() => list.mockReset());

it("returns only an event- and tenant-scoped accepted current Client Final", async () => {
  list.mockResolvedValue([accepted] as never);
  await expect(findCurrentAcceptedClientFinal("event-1", appTenantKey, "d01_strategy_memo"))
    .resolves.toMatchObject({ id: "final-1" });
  expect(list).toHaveBeenCalledWith("event-1", scope, {}, expect.anything());
});

it.each([
  ["draft", { status: "draft" }],
  ["not a final", { isClientFinal: false }],
  ["not current authority", { isCurrentAuthoritative: false }],
  ["superseded", { lifecycleState: "superseded" }],
  ["missing actor", { clientFinalAcceptedBy: null }],
  ["missing timestamp", { clientFinalAcceptedAt: null }],
  ["other tenant", { tenantKey: "other-tenant" }],
  ["other event", { sourceEventId: "event-2" }],
  ["other artifact", { artifactType: "d02_value_target" }],
])("does not promote %s", async (_label, change) => {
  list.mockResolvedValue([{ ...accepted, ...change }] as never);
  await expect(findCurrentAcceptedClientFinal("event-1", appTenantKey, "d01_strategy_memo"))
    .resolves.toBeNull();
});

it("fails closed when two current finals claim the same authority", async () => {
  list.mockResolvedValue([accepted, { ...accepted, id: "final-2" }] as never);
  await expect(findCurrentAcceptedClientFinal("event-1", appTenantKey, "d01_strategy_memo"))
    .rejects.toThrow(/multiple current Client Finals/i);
});
