"use client";

// EvidenceBasis · Sentinel/Nexus citation-hardening lane
//
// Renders the evidence the answer was grounded in, grouped by source class
// (client context / corpus patterns / industry & research). The server already
// retrieves these tenant-scoped sources (AskSource) and streams them as a
// `sources` event; this surfaces them under the answer so the response is
// visibly grounded instead of tripping the "Citation gap" warning.
//
// Executive-view discipline: internal ids are NEVER shown in the main prose —
// they appear only in the element title (hover/details), per the answer contract.

import { useState } from "react";
import type { AskSource } from "@/lib/intelligence/ask/types";
import { BrandColors, BrandTypography } from "@/lib/shell/brand-tokens";

const GROUPS: ReadonlyArray<{ label: string; types: ReadonlyArray<string> }> = [
  { label: "Client context", types: ["TENANT", "GRAPH"] },
  { label: "Corpus patterns", types: ["PATTERN"] },
  {
    label: "Industry & research",
    types: [
      "VENDOR",
      "RESEARCH",
      "BENCHMARK",
      "REGULATION",
      "WORLDVIEW",
      "TOPIC",
      "INSIGHT",
      "GENERAL",
    ],
  },
];

function groupLabelFor(type: string): string {
  return GROUPS.find((g) => g.types.includes(type))?.label ?? "Other evidence";
}

export function EvidenceBasis({ citations }: { citations?: AskSource[] }) {
  const [open, setOpen] = useState(false);
  if (!citations || citations.length === 0) return null;

  const grouped = new Map<string, AskSource[]>();
  for (const c of citations) {
    const label = groupLabelFor(c.type);
    const bucket = grouped.get(label);
    if (bucket) bucket.push(c);
    else grouped.set(label, [c]);
  }
  // Stable group order matching GROUPS, then any extras.
  const orderedLabels = [
    ...GROUPS.map((g) => g.label).filter((l) => grouped.has(l)),
    ...[...grouped.keys()].filter((l) => !GROUPS.some((g) => g.label === l)),
  ];

  return (
    <div
      data-testid="evidence-basis"
      style={{
        marginTop: 8,
        border: `1px solid ${BrandColors.stone}33`,
        borderRadius: 8,
        background: "#fff",
        fontFamily: BrandTypography.sans,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: BrandColors.signalBlue,
        }}
      >
        <span aria-hidden>{open ? "▾" : "▸"}</span>
        Evidence basis · {citations.length} source
        {citations.length === 1 ? "" : "s"}
      </button>
      {open && (
        <div style={{ padding: "0 10px 8px" }}>
          {orderedLabels.map((label) => (
            <div key={label} style={{ marginTop: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: BrandColors.stone,
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              {grouped.get(label)!.map((c, i) => (
                <div
                  key={`${label}-${i}`}
                  // Internal id surfaced only on hover/details — not in visible prose.
                  title={c.id ? `source id: ${c.id}` : undefined}
                  style={{
                    padding: "4px 0",
                    borderTop:
                      i === 0 ? "none" : `1px solid ${BrandColors.stone}1f`,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: BrandColors.inkBlack,
                      }}
                    >
                      {c.name}
                    </span>
                    {typeof c.confidence === "number" && (
                      <span
                        style={{
                          fontSize: 9,
                          color: BrandColors.stone,
                          fontFamily: BrandTypography.mono,
                        }}
                      >
                        {Math.round(c.confidence * 100)}% conf
                      </span>
                    )}
                    {c.url && (
                      <a
                        href={c.url}
                        style={{
                          fontSize: 9,
                          color: BrandColors.signalBlue,
                          textDecoration: "none",
                        }}
                      >
                        open ↗
                      </a>
                    )}
                  </div>
                  {c.detail && (
                    <div
                      style={{
                        fontSize: 10,
                        color: BrandColors.slate,
                        lineHeight: 1.4,
                        marginTop: 1,
                      }}
                    >
                      {c.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
