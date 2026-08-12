"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type {
  SourceEventShellView,
  SourceShellWorkspace,
} from "@/lib/source/source-event-shell-v2";
import { ANALYTICS } from "./analytics-tokens";

type CommercialLensKey =
  | "summary"
  | "pricing"
  | "bafo"
  | "risks"
  | "readiness"
  | "missions"
  | "signals"
  | "linked_program";

type CommercialLens = {
  key: CommercialLensKey;
  label: string;
  state: "active" | "ready" | "open" | "blocked";
  question: string;
  answer: string;
  nextAction: string;
  evidence: string;
  routeStage?: string;
  workspace?: SourceShellWorkspace;
};

const COMMERCIAL_STAGE_KEYS = new Set([
  "responses",
  "evaluation",
  "pricing",
  "bafo",
  "orals_bafo",
  "executive_decision",
  "selection",
]);

const WRAP_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
  maxWidth: 1120,
  marginBottom: 16,
  overflow: "hidden",
};

const TAB_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  borderBottom: `1px solid ${ANALYTICS.LINE}`,
};

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  gap: 22,
  padding: "16px 18px",
};

export function CommercialActiveCanvasStrip({
  view,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  const stageKey = view.stage.key;

  const lenses = buildCommercialLenses(view);
  const defaultLens =
    lenses.find((lens) => lens.state === "active") ?? lenses[0] ?? null;
  const [activeLensKey, setActiveLensKey] = useState<CommercialLensKey>(
    defaultLens?.key ?? "summary",
  );
  const activeLens =
    lenses.find((lens) => lens.key === activeLensKey) ?? defaultLens;

  if (!COMMERCIAL_STAGE_KEYS.has(stageKey) || !activeLens) return null;

  return (
    <section
      aria-label="Commercial active canvas"
      data-testid="source-commercial-active-canvas"
      style={WRAP_STYLE}
    >
      <div style={TAB_ROW_STYLE}>
        {lenses.map((lens) => {
          const selected = lens.key === activeLens.key;
          const tabStyle: CSSProperties = {
            display: "grid",
            gap: 5,
            minHeight: 58,
            alignContent: "center",
            border: "none",
            borderRight: `1px solid ${ANALYTICS.LINE_SOFT}`,
            borderBottom: selected
              ? `2px solid ${ANALYTICS.INK}`
              : "2px solid transparent",
            background: selected ? ANALYTICS.PAGE_BG : ANALYTICS.CARD,
            color: selected ? ANALYTICS.INK : ANALYTICS.INK_2,
            cursor: "pointer",
            fontFamily: ANALYTICS.SANS,
            fontSize: 12,
            fontWeight: selected ? 850 : 700,
            lineHeight: 1.12,
            padding: "9px 10px",
            textAlign: "left",
          };

          if (lens.routeStage && lens.routeStage !== stageKey) {
            return (
              <Link
                key={lens.key}
                href={`/source/events/${view.event.id}?stage=${lens.routeStage}`}
                data-testid={`source-commercial-nav-${lens.key}`}
                style={{ ...tabStyle, textDecoration: "none" }}
              >
                <span>{lens.label}</span>
                <CommercialStatePill state={lens.state} />
              </Link>
            );
          }

          return (
            <button
              key={lens.key}
              type="button"
              data-testid={`source-commercial-nav-${lens.key}`}
              aria-pressed={selected}
              onClick={() => {
                setActiveLensKey(lens.key);
                if (lens.workspace) onWorkspaceChange(lens.workspace);
              }}
              style={tabStyle}
            >
              <span>{lens.label}</span>
              <CommercialStatePill state={lens.state} />
            </button>
          );
        })}
      </div>
      <div data-testid="source-commercial-active-lens" style={PANEL_STYLE}>
        <div>
          <div
            style={{
              color: ANALYTICS.FAINT,
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.12em",
              marginBottom: 7,
              textTransform: "uppercase",
            }}
          >
            Active commercial lens
          </div>
          <h2
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 21,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {activeLens.question}
          </h2>
          <p
            style={{
              color: ANALYTICS.INK_2,
              fontSize: 13.5,
              lineHeight: 1.45,
              margin: "8px 0 0",
              maxWidth: 690,
            }}
          >
            {activeLens.answer}
          </p>
        </div>
        <div
          style={{
            borderLeft: `1px solid ${ANALYTICS.LINE_SOFT}`,
            display: "grid",
            gap: 9,
            paddingLeft: 18,
          }}
        >
          <CommercialMiniFact
            label="Next action"
            value={activeLens.nextAction}
          />
          <CommercialMiniFact label="Evidence" value={activeLens.evidence} />
        </div>
      </div>
    </section>
  );
}

function buildCommercialLenses(
  view: SourceEventShellView,
): readonly CommercialLens[] {
  const stageKey = view.stage.key;
  const ready = `${view.stage.ready}/${view.stage.total}`;
  const artifactBlockers = view.stage.artifactReadiness.blockerCount;
  const stageReady =
    view.stage.ready === view.stage.total && artifactBlockers === 0;
  const readinessState = stageReady
    ? "ready"
    : artifactBlockers > 0
      ? "blocked"
      : "open";

  return [
    {
      key: "summary",
      label: "Summary",
      state: "active",
      question: `Where are we commercially in ${view.stage.label}?`,
      answer: `${ready} stage inputs are complete. This lens keeps the current commercial work, required evidence, and approval path in one place.`,
      nextAction: stageReady
        ? "Open the approval gate"
        : "Complete the highlighted step below",
      evidence: "Stage checklist and artifact readiness",
    },
    {
      key: "pricing",
      label: "Pricing",
      state: stageKey === "pricing" ? "active" : "ready",
      question: "Are vendor prices comparable?",
      answer:
        "Use normalized pricing before BAFO so the team negotiates true TCO, not headline discounts.",
      nextAction:
        stageKey === "pricing"
          ? "Finish pricing normalization"
          : "Open the Pricing stage",
      evidence: "Pricing workbook, rate card, assumptions, transition cost",
      routeStage: "pricing",
    },
    {
      key: "bafo",
      label: "BAFO",
      state:
        stageKey === "bafo" || stageKey === "orals_bafo" ? "active" : "open",
      question: "What leverage can still be pulled?",
      answer:
        "BAFO should turn gaps into named asks, scenario upside, and concession evidence before final decision.",
      nextAction:
        stageKey === "bafo" || stageKey === "orals_bafo"
          ? "Prepare negotiation brief"
          : "Open BAFO when Pricing is decision-ready",
      evidence: "BAFO concession log, scenario compare, blocker list",
      routeStage: "bafo",
    },
    {
      key: "risks",
      label: "Risks",
      state: artifactBlockers > 0 ? "blocked" : "open",
      question: "What can distort the recommendation?",
      answer:
        artifactBlockers > 0
          ? `${artifactBlockers} artifact review gap${artifactBlockers === 1 ? "" : "s"} must be cleared or explicitly accepted before the gate.`
          : "No current-stage artifact blocker is open on this canvas. Keep exceptions visible through approval.",
      nextAction:
        artifactBlockers > 0
          ? "Review Files queue"
          : "Keep risk caveats in the decision memo",
      evidence: "Artifact lifecycle and gate blocker list",
      workspace: artifactBlockers > 0 ? "files" : undefined,
    },
    {
      key: "readiness",
      label: "Readiness",
      state: readinessState,
      question: "Can this move to a decision owner?",
      answer: stageReady
        ? "Stage inputs and gate artifacts are ready for the owner to review."
        : "Readiness is not final yet; finish required steps or clear artifact review gaps first.",
      nextAction: stageReady
        ? "Open Approvals"
        : "Resolve the blocking readiness item",
      evidence: "Required step completion and client-final artifact status",
      workspace: stageReady ? "approvals" : undefined,
    },
    {
      key: "missions",
      label: "Missions",
      state: view.guidebook.available ? "ready" : "open",
      question: "What meeting or workshop should the team run?",
      answer:
        "The guidebook turns this stage into a working session: attendees, prep, evidence to collect, and output needed for the next step.",
      nextAction: "Open the Guidebook",
      evidence: view.guidebook.available
        ? "Stage guidebook"
        : "Default stage playbook",
      workspace: "guidebook",
    },
    {
      key: "signals",
      label: "Signals",
      state: "open",
      question: "What intelligence changed the recommendation?",
      answer:
        "Use the Intelligence workspace to see produced insights, evidence used, missing inputs, and deterministic caveats.",
      nextAction: "Open Intelligence",
      evidence: "Stage insight, provenance, missing-input brief",
      workspace: "intelligence",
    },
    {
      key: "linked_program",
      label: "Linked Program",
      state: "open",
      question: "What downstream program must be prepared?",
      answer:
        "Keep transition, value capture, and governance handoffs visible before selection so the award does not become a dead-end document.",
      nextAction: "Carry open actions into the next stage",
      evidence: "Linked program placeholder and stage handoff notes",
    },
  ] as const;
}

function CommercialStatePill({ state }: { state: CommercialLens["state"] }) {
  const label =
    state === "active"
      ? "now"
      : state === "ready"
        ? "ready"
        : state === "blocked"
          ? "block"
          : "open";
  const color =
    state === "blocked"
      ? ANALYTICS.AMBER_TEXT
      : state === "ready"
        ? ANALYTICS.GREEN_TEXT
        : state === "active"
          ? ANALYTICS.INK
          : ANALYTICS.FAINT;

  return (
    <span
      style={{
        color,
        fontFamily: ANALYTICS.MONO,
        fontSize: 8.5,
        fontWeight: 900,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function CommercialMiniFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: ANALYTICS.FAINT,
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: ANALYTICS.INK,
          fontSize: 12.5,
          fontWeight: 750,
          lineHeight: 1.35,
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}
