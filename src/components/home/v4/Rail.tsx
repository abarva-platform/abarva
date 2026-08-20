import type { CSSProperties } from "react";

import { MONO, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The left rail. It replaces the previous Home's tenant switcher and its "On this page" counts
 * nav, both of which were removed deliberately:
 *
 *  - A switcher on a client-facing surface implies another client's data is one click away. The
 *    route selects the tenant now, and only one tenant's bundle reaches the page.
 *  - Section counts ("What matters 5") are a builder's progress metric wearing a nav's clothes.
 *    Nobody reading this needs to know a band holds five items before they read it.
 *
 * What the rail does carry is state a reader genuinely needs: which chapters are drafted, which
 * are not, and when the record was compiled.
 */

export interface RailItem {
  id: string;
  label: string;
  /** Shown in mono after the label -- a record count, never a progress metric. */
  count?: number;
  drafted: boolean;
}

export interface RailGroup {
  title: string;
  /** e.g. "3 of 8 drafted" -- computed by the caller from the items. */
  progress: string;
  items: RailItem[];
}

function itemStyle(active: boolean, drafted: boolean): CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
    padding: "7px 10px",
    fontFamily: SANS,
    fontSize: 13.5,
    borderRadius: 5,
    textDecoration: "none",
    color: !drafted ? V4.stone : active ? V4.ink : V4.slate,
    background: active ? "rgba(255,255,255,0.85)" : "transparent",
    cursor: drafted ? "pointer" : "default",
  };
}

export function Rail({
  clientLabel,
  groups,
  activeId,
  onSelect,
  compiledLine,
}: {
  clientLabel: string;
  groups: RailGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  compiledLine: string[];
}) {
  return (
    <nav
      style={{
        borderRight: `1px solid ${V4.rule}`,
        background: V4.cream,
        padding: "26px 18px 20px",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        overflowY: "auto",
        scrollbarGutter: "stable",
      }}
    >
      <div>
        <div style={eyebrow(V4.slate)}>Composite reference tenant</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 7 }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: V4.paper,
              background: V4.navy,
              borderRadius: 3,
              padding: "4px 7px 3px",
              flexShrink: 0,
            }}
          >
            DEMO
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, letterSpacing: "-0.022em", lineHeight: 1.14 }}>
            {clientLabel}
          </span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 11,
            border: "1px solid rgba(186,117,23,0.32)",
            borderRadius: 999,
            padding: "4px 9px",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: V4.amber, flexShrink: 0 }} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: V4.amber,
              whiteSpace: "nowrap",
            }}
          >
            Candidate · unreviewed
          </span>
        </div>
        <p style={{ margin: "11px 0 0", fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: V4.slate }}>
          Synthetic portfolio. Not a customer, not a case study.
        </p>
      </div>

      {groups.map((group, gi) => (
        <div
          key={group.title}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderTop: gi === 0 ? undefined : `1px solid ${V4.rule}`,
            paddingTop: gi === 0 ? undefined : 15,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <span style={eyebrow(V4.slate)}>{group.title}</span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: V4.slate,
                whiteSpace: "nowrap",
              }}
            >
              {group.progress}
            </span>
          </div>
          {group.items.map((item) =>
            item.drafted ? (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(item.id);
                }}
                style={itemStyle(item.id === activeId, true)}
                aria-current={item.id === activeId ? "page" : undefined}
              >
                <span>
                  {item.label}
                  {typeof item.count === "number" ? (
                    <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}> {item.count}</span>
                  ) : null}
                </span>
              </a>
            ) : (
              <span key={item.id} style={itemStyle(false, false)}>
                <span>
                  {item.label}
                  {typeof item.count === "number" ? (
                    <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}> {item.count}</span>
                  ) : null}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: V4.stone, whiteSpace: "nowrap" }}>
                  NOT IN DRAFT
                </span>
              </span>
            ),
          )}
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 13 }}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 7 }}>Compiled</div>
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: V4.slate }}>
          {compiledLine.map((line, i) => (
            <span key={line}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>
      </div>
    </nav>
  );
}
