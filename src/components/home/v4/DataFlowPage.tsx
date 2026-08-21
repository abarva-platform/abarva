"use client";

import { useMemo } from "react";

import { renderArchitectureViewSvg } from "@/lib/visual-system/architecture-svg-renderer";
import { buildCurrentStateFlowView } from "@/lib/visual-system/projections/current-state-flow";
import type { TechRecordType } from "@/lib/home/preview/types";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * Current-state data flow: what moves data to what, through what.
 *
 * The estate landscape answers where technology is concentrated. This answers how it is wired --
 * the question a reader actually arrives with, and the one the record could always have answered.
 * The `sourceSystem -> targetSystem` rows sat unread while the page offered four tables and a fact
 * inventory.
 *
 * SVG rather than the HTML tile treatment used elsewhere, because this view's content is edges.
 * Connectors need real routing between lanes; boxes with counts do not.
 */
export function DataFlowPage({
  tenantKey,
  tenantDisplayName,
  integrations,
  applications,
  canonicalBuild,
}: {
  tenantKey: string;
  tenantDisplayName: string;
  integrations: TechRecordType;
  /** Required to resolve endpoints to named systems rather than raw recorded ids. */
  applications?: TechRecordType;
  canonicalBuild?: string;
}) {
  const view = useMemo(
    () => buildCurrentStateFlowView({ tenantKey, tenantDisplayName, integrations, applications, canonicalBuild }),
    [tenantKey, tenantDisplayName, integrations, applications, canonicalBuild],
  );
  const { svg } = useMemo(() => renderArchitectureViewSvg(view, { width: 1260 }), [view]);

  return (
    <div style={{ paddingBottom: 60 }}>
      <header style={{ padding: `46px ${PAGE_X}px 0` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={eyebrow(V4.blue)}>Current-state data flow · whole estate</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: V4.slate, letterSpacing: "-0.01em" }}>
            {view.primaryQuestion}
          </span>
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: "clamp(28px,2.5vw,40px)",
            lineHeight: 1.14,
            letterSpacing: "-0.027em",
            margin: "16px 0 0",
            maxWidth: "36ch",
            textWrap: "balance",
          }}
        >
          {view.title}
        </h1>
        <p style={{ margin: "14px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate }}>
          {view.contextLine}
        </p>
      </header>

      <figure style={{ margin: "28px 0 0", padding: `0 ${PAGE_X}px` }}>
        <div
          style={{ overflowX: "auto", border: `1px solid ${V4.rule}`, borderRadius: 10, background: V4.paper }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <figcaption
          style={{
            margin: "22px 0 0",
            paddingTop: 18,
            borderTop: `1px solid ${V4.rule}`,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(22rem,38%)),1fr))",
            gap: "clamp(18px,3vw,44px)",
          }}
        >
          <div>
            <div style={{ ...eyebrow(V4.slate), marginBottom: 9 }}>How to read this</div>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: V4.slate, maxWidth: "70ch" }}>
              Lanes are role in the flow — what originates data, what carries it, where it lands. A solid box is one
              recorded system; a stacked box stands for many and says how many. Connector weight is the number of
              recorded flows.
            </p>
          </div>
          <div>
            <div style={{ ...eyebrow(V4.slate), marginBottom: 9 }}>Evidence</div>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: V4.slate }}>
              {view.evidenceCoverage.aggregationSummary}
            </p>
          </div>
        </figcaption>
      </figure>

      {view.limitations.length > 0 ? (
        <div style={{ padding: `0 ${PAGE_X}px`, margin: "30px 0 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(19px,1.6vw,24px)",
                fontWeight: 500,
                letterSpacing: "-0.022em",
                margin: 0,
                color: V4.amber,
              }}
            >
              What this drawing does not establish
            </h2>
            <span style={{ flex: 1, height: 1, background: "rgba(186,117,23,0.35)" }} />
          </div>
          <ul
            style={{
              margin: "14px 0 0",
              paddingLeft: 20,
              fontFamily: SANS,
              fontSize: 14.5,
              lineHeight: 1.7,
              color: V4.inkSoft,
              maxWidth: "82ch",
            }}
          >
            {view.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
