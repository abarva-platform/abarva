/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SourceNewProspectiveSupplierForm } from "./SourceNewProspectiveSupplierForm";

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.clearAllMocks(); });

const eventId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";

describe("prospective supplier form", () => {
  it("shows no write control before the current Request is accepted", () => {
    render(<SourceNewProspectiveSupplierForm eventId={eventId} requestVersionId={null} canOriginate={false} />);
    expect(screen.queryByRole("button", { name: /add prospective supplier/i })).toBeNull();
  });

  it("enables the action only after identity, contact authority and rationale are complete", () => {
    const { container } = render(
      <SourceNewProspectiveSupplierForm eventId={eventId} requestVersionId={versionId} canOriginate />,
    );
    const submit = screen.getByRole("button", { name: /add prospective supplier/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(container.querySelector("form")?.getAttribute("action")).toBe(
      `/api/v1/source/${eventId}/candidate-suppliers/originate`,
    );
    expect(container.querySelector('input[name="eventVersionId"]')?.getAttribute("value")).toBe(versionId);

    fireEvent.change(screen.getByLabelText("Legal name"), { target: { value: "Northwind Services LLC" } });
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Test Contact" } });
    fireEvent.change(screen.getByLabelText("Contact email"), { target: { value: "test@example.test" } });
    fireEvent.change(screen.getByLabelText("Reason for adding"), {
      target: { value: "Add this prospective supplier to the event panel." },
    });
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/I confirm this contact may be recorded/i));
    expect(submit.disabled).toBe(false);
  });

  it("shows a failed authority write in place and does not refresh the panel", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, detail: "The current Request version changed." }),
    });
    const { container } = render(
      <SourceNewProspectiveSupplierForm eventId={eventId} requestVersionId={versionId} canOriginate />,
    );
    fireEvent.change(screen.getByLabelText("Legal name"), { target: { value: "Northwind Services LLC" } });
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Test Contact" } });
    fireEvent.change(screen.getByLabelText("Contact email"), { target: { value: "test@example.test" } });
    fireEvent.change(screen.getByLabelText("Reason for adding"), {
      target: { value: "Add this prospective supplier to the event panel." },
    });
    fireEvent.click(screen.getByLabelText(/I confirm this contact may be recorded/i));
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByRole("status")).toHaveProperty("textContent", "The current Request version changed.");
    expect(refreshMock).not.toHaveBeenCalled();
    await waitFor(() => expect((screen.getByRole("button", { name: /add prospective supplier/i }) as HTMLButtonElement).disabled).toBe(false));
  });
});
