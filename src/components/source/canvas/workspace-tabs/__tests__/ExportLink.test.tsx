/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportLink } from "../ExportLink";
import type { ArtifactBlockerLike } from "@/lib/source/contracts/blocker-copy";

describe("ExportLink", () => {
  let onBlocked: jest.Mock<void, [ArtifactBlockerLike[]]>;
  let onSuccess: jest.Mock<void, []>;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    onBlocked = jest.fn();
    onSuccess = jest.fn();
    global.fetch = jest.fn();
    // jsdom's URL has neither method at all — define them before spying.
    if (!("createObjectURL" in URL)) {
      (URL as unknown as { createObjectURL: () => string }).createObjectURL =
        () => "";
    }
    if (!("revokeObjectURL" in URL)) {
      (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL =
        () => {};
    }
    createObjectURLSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = jest
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("on a real 200 byte response, downloads the blob and does not report any blocker", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ["content-disposition", 'attachment; filename="scope-memo.docx"'],
      ]),
      blob: async () => new Blob(["fake docx bytes"]),
    });
    render(
      <ExportLink
        href="/api/v1/source/event-1/artifacts/d05_scope_memo/render?format=docx"
        mode="download"
        dataTestId="export-docx"
        onBlocked={onBlocked}
        onSuccess={onSuccess}
      >
        Download docx
      </ExportLink>,
    );
    fireEvent.click(screen.getByTestId("export-docx"));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(onBlocked).toHaveBeenLastCalledWith([]);
  });

  it("on a real 409 export_not_eligible response, reports the full blocker list and never creates a download", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      headers: new Map(),
      json: async () => ({
        error: "export_not_eligible",
        detail: "d05_scope_memo cannot be exported yet: ...",
        governanceStage: "human_review",
        blockers: [
          { code: "not_accepted", detail: "Not accepted yet." },
          {
            code: "governance_stage_below_export_minimum",
            detail: "Below the required minimum.",
          },
        ],
      }),
    });
    render(
      <ExportLink
        href="/api/v1/source/event-1/artifacts/d05_scope_memo/render?format=docx"
        mode="download"
        dataTestId="export-docx"
        onBlocked={onBlocked}
        onSuccess={onSuccess}
      >
        Download docx
      </ExportLink>,
    );
    fireEvent.click(screen.getByTestId("export-docx"));
    await waitFor(() =>
      expect(onBlocked).toHaveBeenLastCalledWith([
        { code: "not_accepted", detail: "Not accepted yet." },
        {
          code: "governance_stage_below_export_minimum",
          detail: "Below the required minimum.",
        },
      ]),
    );
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("in view mode, opens the blob URL in a new tab instead of downloading", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map(),
      blob: async () => new Blob(["<html></html>"]),
    });
    render(
      <ExportLink
        href="/api/v1/source/event-1/artifacts/d05_scope_memo/render?format=html"
        mode="view"
        dataTestId="view-html"
        onBlocked={onBlocked}
        onSuccess={onSuccess}
      >
        View HTML
      </ExportLink>,
    );
    fireEvent.click(screen.getByTestId("view-html"));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(openSpy).toHaveBeenCalledWith(
      "blob:mock-url",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("reports a network-error blocker when fetch itself throws, without crashing", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    render(
      <ExportLink
        href="/api/v1/source/event-1/artifacts/d05_scope_memo/render?format=docx"
        mode="download"
        dataTestId="export-docx"
        onBlocked={onBlocked}
        onSuccess={onSuccess}
      >
        Download docx
      </ExportLink>,
    );
    fireEvent.click(screen.getByTestId("export-docx"));
    await waitFor(() =>
      expect(onBlocked).toHaveBeenLastCalledWith([
        {
          code: "network_error",
          detail: "Could not reach the server to complete this export.",
        },
      ]),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("revokes the object URL after a delay rather than leaking it forever", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map(),
      blob: async () => new Blob(["bytes"]),
    });
    render(
      <ExportLink
        href="/api/v1/source/event-1/artifacts/d05_scope_memo/render?format=docx"
        mode="download"
        dataTestId="export-docx"
        onBlocked={onBlocked}
      >
        Download docx
      </ExportLink>,
    );
    fireEvent.click(screen.getByTestId("export-docx"));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalledTimes(1));
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(30_000);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });
});
