/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { HomeKnowAnswerRenderer } from "@/components/home/know/HomeKnowAnswerRenderer";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

const baseResponse: HomeKnowResponse = {
  mode: "KNOW",
  tenantKey: "apex-retail",
  question: "Who leads IT?",
  intent: "lookup",
  answerStatus: "answered",
  prose:
    "IT ownership is loaded by portfolio role. The loaded data provides owner roles and source rows.",
  dimensionsUsed: ["it_org_ownership"],
  facts: [],
  tables: [
    {
      id: "t1",
      title: "IT ownership",
      dimensionId: "it_org_ownership",
      columns: [
        { key: "portfolio", label: "Portfolio" },
        { key: "owner", label: "Owner role" },
      ],
      rows: [{ portfolio: "Data & Analytics", owner: "CDO" }],
      citationIds: ["c1"],
    },
  ],
  charts: [],
  graphs: [],
  gaps: [
    {
      id: "g1",
      dimensionId: "it_org_ownership",
      objectType: "portfolio",
      expectedField: "executive_owner_person_name",
      displayLabel: "Named portfolio lead",
      severity: "medium",
      message:
        "The loaded data provides owner roles, but named individuals are not loaded.",
      citationIds: ["c1"],
    },
  ],
  conflicts: [],
  citations: [
    {
      id: "c1",
      label: "IT Org Ownership",
      sourceClass: "tenant-fact",
      sourceFile: "F03_it-org-ownership.csv",
      sourceRowNumber: 7,
      excerpt: "Data & Analytics, CDO",
      confidence: "high",
    },
  ],
  handoff: null,
  safety: {
    serverValidated: true,
    blockedExperts: true,
    blockedDecisionFrames: true,
    blockedInternalCodes: true,
    unsupportedClaimsRemoved: 0,
    frontendTripwireShouldFire: false,
  },
};

describe("HomeKnowAnswerRenderer", () => {
  it("renders a sourced KNOW table and never renders experts", () => {
    const response = {
      ...baseResponse,
      contributingExperts: [{ id: "xp.retail", name: "Retail Expert" }],
    } as HomeKnowResponse & {
      contributingExperts: Array<{ id: string; name: string }>;
    };

    render(<HomeKnowAnswerRenderer response={response} />);

    expect(screen.getByText("aVa")).toBeInTheDocument();
    expect(
      screen.getByText("Answered from loaded context"),
    ).toBeInTheDocument();
    expect(screen.getByText("IT ownership")).toBeInTheDocument();
    expect(screen.getByText("Data & Analytics")).toBeInTheDocument();
    expect(screen.getByText("IT Org Ownership")).toBeInTheDocument();
    expect(screen.queryByText("Retail Expert")).not.toBeInTheDocument();
  });

  it("renders decision questions as handoff banners, not Home recommendations", () => {
    render(
      <HomeKnowAnswerRenderer
        response={{
          ...baseResponse,
          intent: "decision_handoff",
          answerStatus: "handoff",
          prose: "That is a decision question, not a context lookup.",
          tables: [],
          gaps: [],
          handoff: {
            target: "moves",
            label: "Take this to Moves",
            reason: "Home can show loaded facts; Moves evaluates what to do.",
          },
        }}
      />,
    );

    expect(screen.getByText("Take this to Moves")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open moves/i })).toHaveAttribute(
      "href",
      "/strategic-moves",
    );
    expect(screen.queryByText(/90-day pilot/i)).not.toBeInTheDocument();
  });

  it("suppresses internal phrases and raw codes in prose", () => {
    render(
      <HomeKnowAnswerRenderer
        response={{
          ...baseResponse,
          prose:
            "org_topology unavailable in local env for APEXRETAIL-INIT-0017 and the cited record.",
          tables: [],
          gaps: [],
          safety: {
            ...baseResponse.safety,
            frontendTripwireShouldFire: true,
            usableEvidence: true,
            evidenceStatus: "usable_dossier",
          },
        }}
      />,
    );

    expect(
      screen.getByText("This Home answer needs validation before it can be shown."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/org_topology unavailable/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/APEXRETAIL-INIT-0017/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/the cited record/i)).not.toBeInTheDocument();
  });

  it("renders no-data text only for a structured empty dossier", () => {
    render(
      <HomeKnowAnswerRenderer
        response={{
          ...baseResponse,
          answerStatus: "no_data",
          prose: "No source data returned.",
          facts: [],
          tables: [],
          charts: [],
          graphs: [],
          gaps: [],
          citations: [],
          safety: {
            ...baseResponse.safety,
            usableEvidence: false,
            evidenceStatus: "empty_dossier",
          },
        }}
      />,
    );

    expect(
      screen.getByText("I do not see that in the loaded data."),
    ).toBeInTheDocument();
  });

  it("does not convert usable evidence into no-data just because a backend tripwire fired", () => {
    render(
      <HomeKnowAnswerRenderer
        response={{
          ...baseResponse,
          prose: "A short answer with source-backed table support.",
          safety: {
            ...baseResponse.safety,
            frontendTripwireShouldFire: true,
            usableEvidence: true,
            evidenceStatus: "usable_dossier",
          },
        }}
      />,
    );

    expect(
      screen.queryByText("I do not see that in the loaded data."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("This Home answer needs validation before it can be shown."),
    ).toBeInTheDocument();
  });

  it("renders old answer scaffolds as clean client-facing copy", () => {
    render(
      <HomeKnowAnswerRenderer
        response={{
          ...baseResponse,
          prose:
            "Read: Data and analytics context exists.\nEvidence: The missing evidence path is the product registry.",
          tables: [],
          gaps: [
            {
              id: "g2",
              dimensionId: "data_analytics_estate",
              objectType: "home read model",
              expectedField: "product_registry",
              displayLabel: "Home read-model rows",
              severity: "high",
              message: "The missing evidence path did not return rows.",
              citationIds: ["c1"],
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByText(/Data and analytics context exists/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Source gaps/)).toBeInTheDocument();
    expect(screen.queryByText(/\bRead:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bEvidence:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bread-model\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bevidence\b/i)).not.toBeInTheDocument();
  });

  it("does not mangle consultant prose when replacing evidence language", () => {
    render(
      <HomeKnowAnswerRenderer
        response={{
          ...baseResponse,
          prose:
            "The loaded evidence supports a clear current-state picture of the organization.",
        }}
      />,
    );

    expect(
      screen.getByText(
        "The loaded source context supports a clear current-state picture of the organization.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/source support supports/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bevidence\b/i)).not.toBeInTheDocument();
  });
});
