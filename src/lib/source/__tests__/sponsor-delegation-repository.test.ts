const fromMock = jest.fn();
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

import {
  readCurrentScopeArtifactVersion,
  readAssignedSponsorUserId,
  isAssignedSponsorDelegate,
  hasVerifiedSponsorDelegation,
} from "../sponsor-delegation-repository";

const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tenantKey = "tenant-one";
const artifactId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function query(table: string) {
  const filters: Record<string, unknown> = {};
  const chain = {
    select: jest.fn(), eq: jest.fn(), in: jest.fn(), maybeSingle: jest.fn(),
    then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null }),
  };
  chain.select.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.eq.mockImplementation((column: string, value: unknown) => {
    filters[column] = value;
    return chain;
  });
  chain.maybeSingle.mockImplementation(async () => {
    if (table === "source_event_artifact_states") {
      const matched = filters.source_event_id === eventId && filters.tenant_key === tenantKey &&
        filters.artifact_code === "d05_scope_memo" && filters.stage_key === "scope";
      return { data: matched ? { id: "state-1", status: "approved", linked_artifact_id: artifactId } : null, error: null };
    }
    if (table === "source_artifacts") {
      const matched = filters.id === artifactId && filters.source_event_id === eventId && filters.tenant_key === tenantKey;
      return { data: matched ? { id: artifactId, blob_sha256: "a".repeat(64), sha256: null } : null, error: null };
    }
    return { data: null, error: null };
  });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY;
  fromMock.mockImplementation(query);
});

it("reads only the current approved Scope memo and its tenant-matched file digest", async () => {
  expect(await readCurrentScopeArtifactVersion(eventId, tenantKey)).toEqual({ id: artifactId, sha256: "a".repeat(64) });
  expect(await readCurrentScopeArtifactVersion(eventId, "other-tenant")).toBeNull();
  expect(await readCurrentScopeArtifactVersion("other-event", tenantKey)).toBeNull();
});

it("uses the legacy digest only when the blob digest is absent", async () => {
  fromMock.mockImplementation((table: string) => {
    const chain = query(table);
    if (table === "source_artifacts") {
      chain.maybeSingle.mockResolvedValue({ data: {
        id: artifactId, blob_sha256: null, sha256: "b".repeat(64),
      }, error: null });
    }
    return chain;
  });
  expect(await readCurrentScopeArtifactVersion(eventId, tenantKey)).toEqual({
    id: artifactId, sha256: "b".repeat(64),
  });
});

it("requires exactly one assigned sponsor", async () => {
  fromMock.mockImplementation((table: string) => {
    if (table !== "source_event_participants") return query(table);
    const chain = query(table);
    chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: [
      { user_id: "sponsor-1", role: "sponsor", can_approve_source_stages: true, approval_authority: "approver" },
      { user_id: "sponsor-2", role: "sponsor", can_approve_source_stages: true, approval_authority: "approver" },
    ], error: null });
    return chain;
  });
  expect(await readAssignedSponsorUserId(eventId, tenantKey)).toBeNull();
});

it("matches only a stage-authorized delegate across known actor identities", async () => {
  fromMock.mockImplementation((table: string) => {
    if (table !== "source_event_participants") return query(table);
    const chain = query(table);
    chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: [
      { user_id: "user_delegate", role: "sponsor_delegate", can_approve_source_stages: true },
    ], error: null });
    return chain;
  });
  expect(await isAssignedSponsorDelegate(eventId, tenantKey, ["canonical-person", "user_delegate"])).toBe(true);
  expect(fromMock.mock.results.at(-1)?.value.in).toHaveBeenCalledWith("user_id", [
    "canonical-person", "user_delegate",
  ]);
});

it("cannot verify a database approval row when the server receipt key is absent", async () => {
  expect(await hasVerifiedSponsorDelegation({ eventId, tenantKey })).toBe(false);
  expect(fromMock).not.toHaveBeenCalled();
});
