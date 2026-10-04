/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SourceNewNdaCapture } from "./SourceNewNdaCapture";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const eventId = "11111111-1111-4111-8111-111111111111";
const supplierName = "Fictional Aster Ridge Managed Services LLC";
const coverage: SourceNewStage05NdaCoverage = {
  status: "blocked", asOf: "2026-10-03", publishedTemplateVersions: ["synthetic-1.0"],
  suppliers: [{
    legalEntityId: "SYN-VENDOR-001", legalName: supplierName, state: "not_covered",
    reason: "No executed NDA", authorityReference: null, evidenceReference: "synthetic-candidate-001",
    evidenceCaveats: [],
  }],
  nextAction: { label: "Resolve NDA coverage", detail: "Record executed evidence." },
};

function status(contactAuthorityId: string | null, envelopeStatus: string | null = null, available = true) {
  return {
    available, fallback: "upload", suppliers: [{
      vendorId: "SYN-VENDOR-001", contactAuthorityId,
      contactName: contactAuthorityId ? "Fictional Contact" : null,
      envelopeId: envelopeStatus ? "33333333-3333-4333-8333-333333333333" : null,
      envelopeStatus, envelopeTemplateVersion: envelopeStatus ? "synthetic-1.0" : null,
    }],
  };
}

function response(body: object, code = 200) {
  return { ok: code < 400, status: code, json: async () => body } as Response;
}

const fetchMock = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
});
afterAll(() => { global.fetch = originalFetch; });

describe("Source New synthetic NDA send control", () => {
  it("shows lab template publication for the event page's app client key", () => {
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian" files={[]}
      coverage={{ ...coverage, publishedTemplateVersions: [] }} />);
    expect(screen.getByRole("form", { name: "Upload synthetic NDA template" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload PDF" })).toBeTruthy();
  });

  it("shows the guarded send control for the event page's app client key", async () => {
    fetchMock.mockResolvedValueOnce(response(status(null)));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian" files={[]} coverage={coverage} />);
    expect(await screen.findByRole("button", { name: `Send NDA for ${supplierName}` })).toBeTruthy();
  });

  it("does not offer a provider send in another tenant", () => {
    render(<SourceNewNdaCapture eventId={eventId} clientKey="another-tenant" files={[]} coverage={coverage} />);
    expect(screen.queryByRole("button", { name: `Send NDA for ${supplierName}` })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps upload fallback and blocks send while provider or contact authority is absent", async () => {
    fetchMock.mockResolvedValueOnce(response(status(null, null, false)));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Send NDA for ${supplierName}` });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(await screen.findByText(/Demo signing is unavailable; use the upload path/)).toBeTruthy();
    expect(screen.getByText(/Upload the executed NDA/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/source/${eventId}/nda/esign/status`, expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("keeps send disabled for a configured provider without an approved active contact", async () => {
    fetchMock.mockResolvedValueOnce(response(status(null)));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Send NDA for ${supplierName}` });
    expect(await screen.findByText("Approved active contact required")).toBeTruthy();
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByRole("combobox", { name: "Supplier-specific template" }), {
      target: { value: "synthetic-1.0" },
    });
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requires an approved contact, selected template and explicit confirmation before a demo send", async () => {
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001")));
    fetchMock.mockResolvedValueOnce(response({ ok: true, envelopeId: "33333333-3333-4333-8333-333333333333" }, 201));
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001", "sent")));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Send NDA for ${supplierName}` });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByRole("combobox", { name: "Supplier-specific template" }), {
      target: { value: "synthetic-1.0" },
    });
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`/api/v1/source/${eventId}/nda/esign/send`);
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("vendorId")).toBe("SYN-VENDOR-001");
    expect(body.get("contactAuthorityId")).toBe("SYN-CONTACT-001");
    expect(body.get("templateVersion")).toBe("synthetic-1.0");
    expect(body.get("deliveryMode")).toBe("email");
    expect(body.get("acknowledged")).toBe("on");
    expect(await screen.findByText(/Sent to the internal test inbox/)).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not treat a completed provider envelope as NDA coverage", async () => {
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001", "completed")));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Send NDA for ${supplierName}` });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(await screen.findByText(/Completed envelope; executed NDA review is still required/)).toBeTruthy();
  });

  it.each(["declined", "voided"])("permits a new confirmed send after a %s envelope", async (terminal) => {
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001", terminal)));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Resend NDA for ${supplierName}` });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByRole("combobox", { name: "Supplier-specific template" }), {
      target: { value: "synthetic-1.0" },
    });
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it.each(["created", "sent", "viewed", "completed"])("refuses another send while the envelope is %s", async (state) => {
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001", state)));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Send NDA for ${supplierName}` });
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByRole("combobox", { name: "Supplier-specific template" }), {
      target: { value: "synthetic-1.0" },
    });
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not allow a second retry while the new envelope readback is stale", async () => {
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001", "declined")));
    fetchMock.mockResolvedValueOnce(response({ ok: true, envelopeId: "44444444-4444-4444-8444-444444444444" }, 201));
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001", "declined")));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Resend NDA for ${supplierName}` });
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByRole("combobox", { name: "Supplier-specific template" }), {
      target: { value: "synthetic-1.0" },
    });
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect((within(form).getByRole("checkbox", { name: /test inbox/ }) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("disables retry when a provider send is not confirmed", async () => {
    fetchMock.mockResolvedValueOnce(response(status("SYN-CONTACT-001")));
    fetchMock.mockResolvedValueOnce(response({ ok: false, error: "provider_unavailable" }, 503));
    render(<SourceNewNdaCapture eventId={eventId} clientKey="meridian-health" files={[]} coverage={coverage} />);
    const button = await screen.findByRole("button", { name: `Send NDA for ${supplierName}` });
    const form = button.closest("form")!;
    fireEvent.change(within(form).getByRole("combobox", { name: "Supplier-specific template" }), {
      target: { value: "synthetic-1.0" },
    });
    fireEvent.click(within(form).getByRole("checkbox", { name: /test inbox/ }));
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Reconcile the provider envelope"));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
