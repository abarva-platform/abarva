/**
 * @jest-environment jsdom
 */

/**
 * What Home opens on, and what it must never say while doing it.
 *
 * Home is two rails: the briefing, then the evidence. A reader lands in the briefing at chapter
 * one. Nothing stands in front of it -- no readiness summary, no section counter, no state pill.
 * Those describe the build to the reader, and the reader is a client.
 *
 * Replaces the suite that guarded the executive-story page. The vocabulary rules it carried survive
 * here, because they were never that page's rules.
 */
import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";

import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { HomeV4App } from "../HomeV4App";
import {
  collectChapterRawClaimStatements,
  cxoText,
  findBuilderLanguage,
} from "../cxo-language";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const REPO_ROOT = process.cwd();

function bundle(): HomeReviewBundle {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        REPO_ROOT,
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  ) as HomeReviewBundle;
}

function open() {
  window.location.hash = "";
  return render(<HomeV4App bundle={bundle()} tenantKey="meridian-health" />);
}

describe("what Home opens on", () => {
  it("lands on the first chapter of the briefing", () => {
    open();
    const first = bundle().chapters[0];
    // The chapter leads with its thesis, not its own name -- a reader arriving cold gets the claim
    // first and the label second.
    expect(document.querySelector("h1")?.textContent).toBe(first.headline);
    expect(screen.getAllByText(first.title).length).toBeGreaterThan(0);
  });

  it("opens on the chapter's own question, not a summary of the build", () => {
    open();
    expect(
      screen.getByText(new RegExp(bundle().chapters[0].guidingQuestion, "i")),
    ).toBeInTheDocument();
  });

  it("keeps every chapter reachable from the rail", () => {
    open();
    for (const chapter of bundle().chapters) {
      expect(screen.getAllByText(chapter.title).length).toBeGreaterThan(0);
    }
  });

  it("keeps the evidence views available without putting them first", () => {
    open();
    for (const label of ["Current-state architecture", "Browse the record"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("what the landing surface must never say", () => {
  // A section counter, a readiness pill and a deferred badge all report the state of the build.
  // They belong to whoever is building it, and never to the client reading it.
  it.each([
    ["a section counter", /\d+ of \d+ sections/i],
    ["a readiness pill", /sections ready/i],
    ["a deferred badge", /\bdeferred\b/i],
    ["a terminal-state label", /terminal state/i],
  ])("carries no %s", (_label, pattern) => {
    open();
    expect(document.body.textContent ?? "").not.toMatch(pattern);
  });

  it.each([
    [/\bECL\b/],
    [/\bprojection\b/i],
    [/\bserving view\b/i],
    [/\bloaded rows?\b/i],
    [/\bcanonical entit(?:y|ies)\b/i],
    [/\bpayload\b/i],
    [/\bschema\b/i],
    [/\bsource room\b/i],
    [/\bprovider flag\b/i],
    [/not enough verified evidence yet/i],
    [/coverage gap in the build/i],
  ])("carries no implementation vocabulary matching %s", (pattern) => {
    open();
    expect(document.body.textContent ?? "").not.toMatch(pattern);
  });
});

describe("the vocabulary gate", () => {
  // Checked against the RAW claims, before render-time laundering. A renderer that quietly fixes
  // its inputs hides a generator that is still producing them, and the next term it invents will
  // have no replacement rule waiting for it.
  // The generator still emits intake tags into prose. The gate's job is to say so, not to be
  // satisfied. Laundering happens at render; this asserts the upstream defect is still visible.
  it("names every machine identifier the chapter claims still arrive with", () => {
    const raw = collectChapterRawClaimStatements(bundle().chapters);
    const identifiers = [
      ...new Set(findBuilderLanguage(raw).map((f) => f.term)),
    ].sort();
    expect(identifiers).toEqual([
      "ai_governance",
      "capability_gap",
      "data_trust",
      "finance_evidence",
      "governance_friction",
      "investment_priority",
      "value_realisation",
    ]);
    expect(raw.filter((s) => cxoText(s) !== s)).toHaveLength(7);
  });

  it("shows none of them to the reader", () => {
    open();
    document.querySelectorAll("style").forEach((n) => n.remove());
    const visible = document.body.textContent ?? "";
    // Matched by shape, so a key nobody has thought of yet fails this too.
    expect(visible.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? []).toEqual(
      [],
    );
  });

  it("catches a builder term the renderer does not launder", () => {
    expect(
      findBuilderLanguage([
        "The adapter hydration step completed after the executive claim was drafted.",
      ]),
    ).toEqual([
      {
        term: "adapter",
        statement:
          "The adapter hydration step completed after the executive claim was drafted.",
      },
      {
        term: "hydration step",
        statement:
          "The adapter hydration step completed after the executive claim was drafted.",
      },
    ]);
  });
});
