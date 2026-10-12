"use client";

import type React from "react";

import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatCount } from "@/lib/tower/command-center/format";

type WorkAreaRow = {
  readonly functionId: string;
  readonly name: string;
  readonly programCount: number;
};

export type AffectedWorkAreaCoverage = {
  readonly rows: readonly WorkAreaRow[];
  readonly totalPrograms: number;
  readonly linkedPrograms: number;
  readonly multiAreaPrograms: number;
  readonly unlinkedPrograms: readonly { id: string; name: string }[];
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
};

export function buildAffectedWorkAreaCoverage(
  view: TowerCommandCenterView,
): AffectedWorkAreaCoverage {
  const areas = new Map<string, { name: string; programs: Set<string> }>();
  const unlinkedPrograms: { id: string; name: string }[] = [];
  let linkedPrograms = 0;
  let multiAreaPrograms = 0;

  for (const program of view.programs) {
    const distinctLinks = new Map(
      (program.affectedFunctions ?? [])
        .filter((link) => link.functionId.trim() && link.functionName.trim())
        .map((link) => [link.functionId, link.functionName] as const),
    );
    if (distinctLinks.size === 0) {
      unlinkedPrograms.push({ id: program.id, name: program.name });
      continue;
    }
    linkedPrograms += 1;
    if (distinctLinks.size > 1) multiAreaPrograms += 1;
    for (const [functionId, name] of distinctLinks) {
      const area = areas.get(functionId) ?? { name, programs: new Set<string>() };
      area.programs.add(program.id);
      areas.set(functionId, area);
    }
  }

  return {
    rows: [...areas.entries()]
      .map(([functionId, area]) => ({ functionId, name: area.name, programCount: area.programs.size }))
      .sort((a, b) => b.programCount - a.programCount || a.name.localeCompare(b.name)),
    totalPrograms: view.programs.length,
    linkedPrograms,
    multiAreaPrograms,
    unlinkedPrograms,
  };
}

export function BudgetDomainPanel({ view }: { view: TowerCommandCenterView }) {
  const coverage = buildAffectedWorkAreaCoverage(view);
  const missingCount = coverage.unlinkedPrograms.length;

  if (coverage.totalPrograms === 0) {
    return (
      <section style={{ ...PANEL, padding: "24px 26px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          Work areas affected by programs
        </h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
          No program rows are loaded, so Tower cannot show which work areas they affect. Approved funding by work area and the full IT budget split are not verified in this view.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26, lineHeight: 1.2 }}>
        {formatCount(coverage.linkedPrograms)} of {formatCount(coverage.totalPrograms)} loaded programs have an affected work area linked in the source.
      </h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-700)" }}>
        {missingCount === 0
          ? "Every loaded program has a work area link."
          : `${formatCount(missingCount)} ${missingCount === 1 ? "program needs" : "programs need"} a work area link.`}
        {" "}These links show where work may have an effect. They do not identify a funding category or an approved budget.
      </p>
      <div style={PANEL}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) 180px", gap: 14, padding: "12px 22px", borderBottom: "1px solid var(--canon-border-strong)", fontFamily: "var(--abarva-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--canon-gray-500)" }}>
          <span>Affected work area from source</span>
          <span style={{ textAlign: "right" }}>Programs linked</span>
        </div>
        {coverage.rows.map((row) => (
          <div key={row.functionId} style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) 180px", gap: 14, padding: "14px 22px", borderBottom: "1px solid var(--canon-border)", fontSize: 15 }}>
            <span>{row.name}</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>{formatCount(row.programCount)}</span>
          </div>
        ))}
        {missingCount > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) 180px", gap: 14, padding: "14px 22px", fontSize: 15 }}>
            <span>Work area not linked in source</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>{formatCount(missingCount)}</span>
          </div>
        ) : null}
      </div>
      {missingCount > 0 ? (
        <details style={{ ...PANEL, padding: "14px 22px", fontSize: 15 }}>
          <summary>See the {formatCount(missingCount)} programs without a work area link</summary>
          <ul>
            {coverage.unlinkedPrograms.map((program) => <li key={program.id}>{program.name}</li>)}
          </ul>
        </details>
      ) : null}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--canon-gray-500)" }}>
        Counting basis: each program counts once in each work area explicitly linked to it. A program linked to more than one work area appears in more than one row, so row counts may add up to more than {formatCount(coverage.totalPrograms)}. {coverage.multiAreaPrograms > 0 ? `${formatCount(coverage.multiAreaPrograms)} ${coverage.multiAreaPrograms === 1 ? "program has" : "programs have"} more than one linked area.` : "No loaded program has more than one linked area."} These links cannot show a funding split. Approved funding by work area and the full IT budget split are not verified here.
      </p>
    </section>
  );
}
