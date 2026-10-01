import { readRfpClausePresentLeverKeys } from "../event-facts-reader";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const mockedClient = getAzureWriteFluentClient as jest.Mock;

function setRows(rows: unknown[]) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockResolvedValue({ data: rows, error: null });
  mockedClient.mockReturnValue({ from: jest.fn(() => query) });
  return query;
}

describe("RFP clause fact readback", () => {
  it("retains a zero decision as an assessed lever and fences the event and tenant", async () => {
    const query = setRows([
      { entity_ref: "LEVER.A", value_numeric: "0" },
      { entity_ref: "LEVER.B", value_numeric: "1" },
    ]);

    const result = await readRfpClausePresentLeverKeys({
      eventId: "event-a",
      clientKey: "tenant-a",
    });

    expect(query.eq).toHaveBeenCalledWith("source_event_id", "event-a");
    expect(query.eq).toHaveBeenCalledWith("client_key", "tenant-a");
    expect(query.eq).toHaveBeenCalledWith("is_stale", false);
    expect(result.signalPresent).toBe(true);
    expect(result.presentLeverKeys).toEqual(new Set(["LEVER.B"]));
    expect(result.assessedLeverKeys).toEqual(new Set(["LEVER.A", "LEVER.B"]));
  });

  it("does not let an invalid newest decision borrow an older valid decision", async () => {
    setRows([
      { entity_ref: "LEVER.A", value_numeric: null },
      { entity_ref: "LEVER.A", value_numeric: "1" },
      { entity_ref: "LEVER.B", value_numeric: "2" },
    ]);

    const result = await readRfpClausePresentLeverKeys({
      eventId: "event-a",
      clientKey: "tenant-a",
    });

    expect(result.assessedLeverKeys).toEqual(new Set());
    expect(result.presentLeverKeys).toEqual(new Set());
  });
});
