/**
 * Carried over from the surface this one replaced. Tenant isolation is a property of Home, not of
 * whichever component happened to draw it, so the test moves with the surface rather than being
 * deleted alongside the old one.
 *
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { HomeV4App } from "../HomeV4App";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function bundle(): HomeReviewBundle {
  return {
    tenantKey: "skyharbor-air",
    provenance: {
      generated_at: "2026-08-19T00:00:00.000Z",
      home_synthesis_contract_version: "home-chapters-v1",
      model: "claude-sonnet-5",
    },
    chapters: [],
    thesis: {
      signalPacket: { visualDatasets: {}, signals: [], contextItems: [] },
      publishedGeneration: {},
      verificationLedger: [],
      structuralIssues: [],
    },
  } as unknown as HomeReviewBundle;
}

describe("Home tenant isolation", () => {
  it("renders the demo-safe client name, never the physical source label", () => {
    render(<HomeV4App bundle={bundle()} tenantKey="skyharbor-air" />);
    expect(screen.getByText("SkyHarbor Global")).toBeInTheDocument();
    expect(screen.queryByText("SkyHarbor Air")).not.toBeInTheDocument();
  });

  it("marks the surface as a demo client with synthetic data", () => {
    render(<HomeV4App bundle={bundle()} tenantKey="skyharbor-air" />);
    expect(screen.getByText(/demo/i)).toBeInTheDocument();
  });

  it("exposes no control that switches to another client", () => {
    render(<HomeV4App bundle={bundle()} tenantKey="skyharbor-air" />);
    // A client-facing surface must not imply another tenant's data is one click away.
    expect(screen.queryByText(/meridian/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /skyharbor/i }),
    ).not.toBeInTheDocument();
  });
});
