/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { ClaimCard } from "../ClaimCard";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";

/**
 * The evidence-inspection affordance is the specific UX bar the workstream set: "every insight
 * should allow the user to inspect why Abarva believes it... elegant, not like an audit log". This
 * pins the elegant half mechanically -- collapsed by default, evidence text appears only after the
 * explicit click -- against real golden-snapshot claims, not a synthetic fixture, so a change to
 * either the claim shape or the signal packet shape breaks this test rather than shipping quietly.
 */
describe("ClaimCard", () => {
  const bundle = getHomeReviewBundle("meridian-health")!;
  const claim = bundle.chapters.flatMap((c) => c.key_insights).find((c) => c.evidence_ids.length > 0)!;

  it("does not show evidence text until expanded", () => {
    render(<ClaimCard claim={claim} signalPacket={bundle.thesis.signalPacket} />);
    expect(screen.getByText(claim.statement)).toBeInTheDocument();
    expect(screen.queryByText(claim.evidence_ids[0])).not.toBeInTheDocument();
  });

  it("reveals resolved evidence statements on click", () => {
    render(<ClaimCard claim={claim} signalPacket={bundle.thesis.signalPacket} />);
    fireEvent.click(screen.getByRole("button", { name: /why do we believe this/i }));
    expect(screen.getByText(claim.evidence_ids[0])).toBeInTheDocument();
    const firstEvidenceId = claim.evidence_ids[0];
    const resolvedStatement =
      bundle.thesis.signalPacket.signals.find((s) => s.id === firstEvidenceId)?.statement ??
      bundle.thesis.signalPacket.contextItems.find((c) => c.id === firstEvidenceId)?.statement;
    expect(resolvedStatement).toBeTruthy();
    expect(screen.getByText(resolvedStatement!)).toBeInTheDocument();
  });

  it("toggles back to hidden on a second click", () => {
    render(<ClaimCard claim={claim} signalPacket={bundle.thesis.signalPacket} />);
    const button = screen.getByRole("button", { name: /why do we believe this/i });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: /hide evidence/i }));
    expect(screen.queryByText(claim.evidence_ids[0])).not.toBeInTheDocument();
  });
});
