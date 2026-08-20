/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { HomePreviewApp } from "../HomePreviewApp";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

jest.mock("../HomeAvaChat", () => ({
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
      signalPacket: { visualDatasets: {} },
      publishedGeneration: {},
      verificationLedger: [],
      structuralIssues: [],
    },
  } as unknown as HomeReviewBundle;
}

describe("HomePreviewApp tenant isolation", () => {
  it("renders the demo-safe client name, never the physical source label", () => {
    render(<HomePreviewApp bundle={bundle()} tenantKey="skyharbor-air" />);
    expect(screen.getByText("SkyHarbor Global")).toBeInTheDocument();
    expect(screen.queryByText("SkyHarbor Air")).not.toBeInTheDocument();
  });

  it("marks the surface as a demo client with synthetic data", () => {
    render(<HomePreviewApp bundle={bundle()} tenantKey="skyharbor-air" />);
    expect(screen.getByText(/demo client/i)).toBeInTheDocument();
  });

  it("exposes no control that switches to another client", () => {
    render(<HomePreviewApp bundle={bundle()} tenantKey="skyharbor-air" />);
    // A client-facing surface must not imply another tenant's data is one click away.
    expect(screen.queryByText(/meridian/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skyharbor/i })).not.toBeInTheDocument();
  });
});
