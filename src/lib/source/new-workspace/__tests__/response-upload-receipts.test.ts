import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { readSourceResponseUploadReceipts } from "../response-upload-receipts";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const getClient = getAzureReadFluentClient as jest.Mock;

const receiptRow = {
  event_id: "event-1",
  client_key: "tenant-1",
  action_type: "artifact_uploaded",
  stage_key: "responses",
  metadata: {
    responseSupplierId: "supplier-1",
    artifactId: "artifact-1",
    responseParseState: "parsed",
    originalName: "private-upload.xlsx",
  },
  occurred_at: "2026-10-10T12:00:00.000Z",
};

function serve(data: unknown, error: { message: string } | null = null) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    then: (resolve: (value: { data: unknown; error: typeof error }) => void) =>
      Promise.resolve({ data, error }).then(resolve),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  const from = jest.fn().mockReturnValue(query);
  getClient.mockReturnValue({ from });
  return { from, query };
}

describe("Source response upload receipts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads latest-first scoped receipts without exposing activity metadata", async () => {
    const { from, query } = serve([
      {
        ...receiptRow,
        metadata: { responseSupplierId: "supplier-2", artifactId: "artifact-2", responseParseState: "not_parsed" },
        occurred_at: "2026-10-10T11:00:00.000Z",
      },
      { ...receiptRow, metadata: { ...receiptRow.metadata, responseParseState: "failed" } },
    ]);

    await expect(readSourceResponseUploadReceipts({ eventId: "event-1", clientKey: "tenant-1" }))
      .resolves.toEqual([
        {
          supplierId: "supplier-1",
          artifactId: "artifact-1",
          parseState: "failed",
          recordedAt: "2026-10-10T12:00:00.000Z",
        },
        {
          supplierId: "supplier-2",
          artifactId: "artifact-2",
          parseState: "not_parsed",
          recordedAt: "2026-10-10T11:00:00.000Z",
        },
      ]);
    expect(from).toHaveBeenCalledWith("source_event_activity");
    expect(query.select).toHaveBeenCalledWith(
      "event_id,client_key,action_type,stage_key,metadata,occurred_at",
    );
    expect(query.eq).toHaveBeenCalledWith("event_id", "event-1");
    expect(query.eq).toHaveBeenCalledWith("client_key", "tenant-1");
    expect(query.eq).toHaveBeenCalledWith("action_type", "artifact_uploaded");
    expect(query.eq).toHaveBeenCalledWith("stage_key", "responses");
    expect(query.order).toHaveBeenCalledWith("occurred_at", { ascending: false });
  });

  it("drops malformed metadata and timestamps", async () => {
    serve([
      { ...receiptRow, metadata: null },
      { ...receiptRow, metadata: { ...receiptRow.metadata, responseSupplierId: "" } },
      { ...receiptRow, metadata: { artifactId: "artifact-1", responseParseState: "parsed" } },
      { ...receiptRow, metadata: { ...receiptRow.metadata, artifactId: 123 } },
      { ...receiptRow, metadata: { ...receiptRow.metadata, responseParseState: "pending" } },
      { ...receiptRow, occurred_at: "invalid" },
      receiptRow,
    ]);

    await expect(readSourceResponseUploadReceipts({ eventId: "event-1", clientKey: "tenant-1" }))
      .resolves.toEqual([{
        supplierId: "supplier-1",
        artifactId: "artifact-1",
        parseState: "parsed",
        recordedAt: "2026-10-10T12:00:00.000Z",
      }]);
  });

  it("rejects rows from another event or client even if a read client returns them", async () => {
    serve([
      { ...receiptRow, event_id: "event-2" },
      { ...receiptRow, client_key: "tenant-2" },
      { ...receiptRow, action_type: "artifact_accepted" },
      { ...receiptRow, stage_key: "rfp" },
      receiptRow,
    ]);

    await expect(readSourceResponseUploadReceipts({ eventId: "event-1", clientKey: "tenant-1" }))
      .resolves.toHaveLength(1);
  });

  it("throws on a read error instead of reporting no uploads", async () => {
    serve(null, { message: "activity read failed" });

    await expect(readSourceResponseUploadReceipts({ eventId: "event-1", clientKey: "tenant-1" }))
      .rejects.toThrow("activity read failed");
  });

  it("rejects a missing row set and blank scope", async () => {
    serve(null);
    await expect(readSourceResponseUploadReceipts({ eventId: "event-1", clientKey: "tenant-1" }))
      .rejects.toThrow("no row set");
    await expect(readSourceResponseUploadReceipts({ eventId: "", clientKey: "tenant-1" }))
      .rejects.toThrow("requires event and client keys");
  });
});
