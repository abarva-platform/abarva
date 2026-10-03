import { buildCandidatePanelShortlistDraft } from "../candidate-panel-shortlist";
import type { AcceptedEventCandidate } from "../../candidate-suppliers/event-candidate-authority-repository";

const candidate = (
  overrides: Partial<AcceptedEventCandidate> = {},
): AcceptedEventCandidate => ({
  authorityId: "acceptance-1",
  supplierId: "supplier-1",
  legalEntityId: "supplier-1",
  legalName: "Cobalt Systems",
  acceptedByName: "Procurement Owner",
  acceptedAt: "2026-09-30T12:00:00Z",
  acceptanceRationale: "Candidate for service review",
  evidenceReference: "evidence-1",
  ...overrides,
});

it("drafts only event-accepted supplier identities with their acceptance evidence", () => {
  const body = buildCandidatePanelShortlistDraft([
    candidate(),
    candidate({
      authorityId: "acceptance-2",
      supplierId: "supplier-2",
      legalEntityId: "supplier-2",
      legalName: "Axiom Services",
      evidenceReference: "evidence-2",
    }),
  ]);

  expect(body.indexOf("Axiom Services")).toBeLessThan(body.indexOf("Cobalt Systems"));
  expect(body).toContain("supplier-1");
  expect(body).toContain("acceptance-1");
  expect(body).toContain("evidence-1");
  expect(body).toContain("No vendor is approved for invitation");
  expect(body).toContain("No exclusion decision is recorded");
  expect(body).toContain("DRAFT - INTERNAL REVIEW ONLY");
});

it("does not launder vendor-wide selection metadata or contacts into event authority", () => {
  const body = buildCandidatePanelShortlistDraft([
    candidate({
      selectionAuthority: {
        selectedByName: "Unrelated Selection Owner",
        selectedAt: "2026-09-29T12:00:00Z",
        evidenceReference: "global-selection-ref",
      },
      contacts: [{
        contactId: "contact-1",
        role: "sales",
        state: "active",
        email: "private@example.test",
      }],
    }),
  ]);

  expect(body).not.toContain("global-selection-ref");
  expect(body).not.toContain("Unrelated Selection Owner");
  expect(body).not.toContain("private@example.test");
  expect(body).toContain("Respondent selection, NDA coverage, legal terms, and release approval remain separate decisions");
});

it("escapes multiline and table syntax in authority text", () => {
  const body = buildCandidatePanelShortlistDraft([
    candidate({
      legalName: "Cobalt | Systems\nUnexpected row",
      acceptanceRationale: "Scoped | review\nNot an invitation",
    }),
  ]);

  expect(body).toContain("Cobalt \\| Systems Unexpected row");
  expect(body).toContain("Scoped \\| review Not an invitation");
  expect(body).not.toContain("Systems\nUnexpected row");
});

it("refuses incomplete identity or event-acceptance authority", () => {
  expect(() => buildCandidatePanelShortlistDraft([])).toThrow("accepted candidate");
  expect(() => buildCandidatePanelShortlistDraft([
    candidate({ evidenceReference: "" }),
  ])).toThrow("accepted candidate");
  expect(() => buildCandidatePanelShortlistDraft([
    candidate({ supplierId: "" }),
  ])).toThrow("accepted candidate");
});
