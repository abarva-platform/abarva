/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { VendorResponsePackPanel } from "../canvas/workspace-tabs/VendorResponsePackPanel";

describe("VendorResponsePackPanel", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("uploads a vendor response pack through the Source artifact upload route", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: {
          id: "artifact-1",
          originalName: "Vendor A Response.docx",
          sourceFormat: "docx",
          parseStatus: "uploaded",
        },
        parseWarnings: [],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const onUploaded = jest.fn();

    render(
      <VendorResponsePackPanel
        eventId="apex-retail-ams-outsourcing-2026"
        onUploaded={onUploaded}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/vendor name/i), {
      target: { value: "Northstar Managed Services" },
    });
    fireEvent.change(screen.getByLabelText(/response file/i), {
      target: {
        files: [
          new File(["response"], "Vendor A Response.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /upload response pack/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/apex-retail-ams-outsourcing-2026/artifacts/upload",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("stageKey")).toBe("responses");
    expect(body.get("artifactCode")).toBe("d13_vendor_responses");
    expect(body.get("artifactFamily")).toBe("proposal");
    expect(body.get("artifactKind")).toBe("vendor_response_pack");
    expect(body.get("vendorName")).toBe("Northstar Managed Services");
    expect(await screen.findByTestId("source-vendor-response-pack-success")).toHaveTextContent(
      "parser uploaded",
    );
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });
});
