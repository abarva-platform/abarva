// POST /api/v1/source/:eventId/facts/ingest-file — behavior tests.
//
// Mirrors the /facts/ingest route test: flag-OFF → 404 (no write); happy path
// parses a real CSV via papaparse and writes typed facts; unknown template → 400;
// a tenant-fenced event miss → 404; an unparseable file → 400 (no write). All
// dependencies injected — no live backend. The request carries a real multipart
// FormData with a File so the parse step runs for real.

/**
 * @jest-environment node
 */

const tenancy = {
  clientId: "client-1",
  clientKey: "lakeshore",
  userId: "person-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "cxo@lakeshore.example",
  name: "CXO",
  primaryRole: "maestro",
  metadataClientKey: "lakeshore",
};

let flagEnabled = true;
let eventClientKey = "lakeshore";
const insertFacts = jest.fn(async (facts: unknown[]) => ({
  ok: true,
  data: { inserted: facts.length },
}));
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ error: "unauthenticated" }, { status: 401 }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ id: "client-1", key: "lakeshore" })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => flagEnabled),
}));

jest.mock("@/lib/source/queries", () => ({
  resolveSourceEventUuidForClient: jest.fn(async () => "evt-1"),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceFactWriteAdapter", () => ({
  selectSourceFactWriteAdapter: jest.fn(() => ({ insertFacts })),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fakeFluentClient()),
}));

jest.mock("@/lib/source/artifact-registry", () => ({
  updateSourceArtifactProcessingState: jest.fn(async () => ({
    id: "artifact-1",
  })),
}));

import { POST } from "../route";
import { updateSourceArtifactProcessingState } from "@/lib/source/artifact-registry";
import { hydrateTaskEvidenceState } from "@/lib/source/facts/view/task-evidence-hydration";
import type { StageTaskView } from "@/components/source/canvas/analytics/view-model";

function fakeFluentClient() {
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () =>
          table === "source_events"
            ? { data: { id: "evt-1", client_key: eventClientKey }, error: null }
            : { data: null, error: null },
      };
      return chain;
    },
  };
}

const VOLUMETRICS_CSV = [
  "Service Tower,Annual Change-Order Spend (USD),Recurring/Avoidable Share (%),Projected Volume Decline (%),Automatable Effort Pool (USD),Chronic SLA Miss Rate (%),Notes",
  "End User Compute,1200000,35,12,450000,4,steady",
].join("\n");

/** Build a real NextRequest-like object with a multipart FormData body. */
function fileRequest(args: {
  csv?: string;
  filename?: string;
  mimeType?: string;
  templateCode?: string | null;
  artifactId?: string | null;
  omitFile?: boolean;
}): import("next/server").NextRequest {
  const form = new FormData();
  if (!args.omitFile) {
    const blob = new Blob([args.csv ?? VOLUMETRICS_CSV], {
      type: args.mimeType ?? "text/csv",
    });
    const file = new File([blob], args.filename ?? "volumetrics.csv", {
      type: args.mimeType ?? "text/csv",
    });
    form.append("file", file);
  }
  if (args.templateCode !== null) {
    form.append("templateCode", args.templateCode ?? "VOLUMETRICS_V1");
  }
  if (args.artifactId !== undefined && args.artifactId !== null) {
    form.append("artifactId", args.artifactId);
  }
  return {
    formData: async () => form,
  } as unknown as import("next/server").NextRequest;
}

const ctx = { params: Promise.resolve({ eventId: "evt-1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  flagEnabled = true;
  eventClientKey = "lakeshore";
});

describe("POST facts/ingest-file — flag gating", () => {
  it("returns 404 and writes nothing when source_analytics is OFF", async () => {
    flagEnabled = false;
    const res = await POST(fileRequest({}), ctx);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("not_found");
    expect(insertFacts).not.toHaveBeenCalled();
  });
});

describe("POST facts/ingest-file — happy path", () => {
  it("parses a VOLUMETRICS CSV and writes its 5 typed facts", async () => {
    const res = await POST(fileRequest({}), ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      templateCode: string;
      factsWritten: number;
      unmappedColumns: string[];
    };
    expect(json.ok).toBe(true);
    expect(json.templateCode).toBe("VOLUMETRICS_V1");
    expect(json.factsWritten).toBe(5);
    expect(json.unmappedColumns).toContain("Notes");
    expect(insertFacts).toHaveBeenCalledTimes(1);
  });

  it("writes facts that hydrate the matching workflow upload task on readback", async () => {
    const res = await POST(fileRequest({ artifactId: "artifact-1" }), ctx);
    expect(res.status).toBe(200);

    const writtenFacts = insertFacts.mock.calls[0][0] as Array<{
      fact_key: string;
      value_numeric: number | null;
    }>;
    const factInputs = writtenFacts.reduce<Record<string, number>>((acc, fact) => {
      if (typeof fact.value_numeric === "number") {
        acc[fact.fact_key] = fact.value_numeric;
      }
      return acc;
    }, {});
    const volumetricsTask: StageTaskView = {
      id: "scope.volumetrics",
      title: "Provide the volumetrics",
      subtitle: "Ticket history",
      type: "provide",
      state: "todo",
      guide: "Upload service-tower volumetrics.",
      cta: "Upload volumetrics",
      factTemplateCode: "VOLUMETRICS_V1",
    };

    const [hydrated] = hydrateTaskEvidenceState({
      tasks: [volumetricsTask],
      factInputs,
      stageKey: "scope",
    });

    expect(hydrated.evidenceComplete).toBe(true);
  });

  it("marks the uploaded artifact parsed only when typed facts are written", async () => {
    const res = await POST(fileRequest({ artifactId: "artifact-1" }), ctx);
    const json = (await res.json()) as { factsWritten: number };

    expect(res.status).toBe(200);
    expect(json.factsWritten).toBe(5);
    expect(jest.mocked(updateSourceArtifactProcessingState)).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      parseStatus: "parsed",
      evidenceState: "parsed_uncited",
      validatedBy: "person-1",
    });
  });

  it("marks the uploaded artifact failed when the template writes zero typed facts", async () => {
    const res = await POST(
      fileRequest({
        artifactId: "artifact-1",
        csv: "metric,period,value,unit,source\nTickets,2026-07,10,count,test",
      }),
      ctx,
    );
    const json = (await res.json()) as { factsWritten: number };

    expect(res.status).toBe(200);
    expect(json.factsWritten).toBe(0);
    expect(jest.mocked(updateSourceArtifactProcessingState)).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      parseStatus: "failed",
      evidenceState: "unparsed",
      validatedBy: "person-1",
    });
  });
});

describe("POST facts/ingest-file — validation + fencing", () => {
  it("returns 400 when the file is missing", async () => {
    const res = await POST(fileRequest({ omitFile: true }), ctx);
    expect(res.status).toBe(400);
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("returns 400 when templateCode is missing", async () => {
    const res = await POST(fileRequest({ templateCode: null }), ctx);
    expect(res.status).toBe(400);
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("returns 400 unknown_template for a bad template code", async () => {
    const res = await POST(fileRequest({ templateCode: "NOPE" }), ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("unknown_template");
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("returns 400 for an unparseable / unsupported file", async () => {
    const res = await POST(
      fileRequest({
        artifactId: "artifact-1",
        csv: "not really tabular",
        filename: "notes.pdf",
        mimeType: "application/pdf",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("unparseable_file");
    expect(insertFacts).not.toHaveBeenCalled();
    expect(jest.mocked(updateSourceArtifactProcessingState)).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      parseStatus: "failed",
      evidenceState: "unparsed",
      validatedBy: "person-1",
    });
  });

  it("returns 404 when the event belongs to a different tenant", async () => {
    eventClientKey = "apexretail";
    const res = await POST(fileRequest({}), ctx);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("not_found");
    expect(insertFacts).not.toHaveBeenCalled();
  });
});
