import type { CSSProperties } from "react";

import type {
  HomeRecordRenderSource,
  HomeRecordSourceKind,
} from "@/lib/home/preview/types";
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
  /**
   * Position in a reading order. The briefing is sequential and the evidence is not; a number is
   * how the rail says which of the two a reader is looking at.
   */
  index?: number;
  /**
   * The item's own sections, revealed only while it is the active one.
   *
   * Twenty flat entries make the briefing and the evidence look like one list of equal things. They
   * are not: eight are a reading order, twelve are a reference shelf. Nesting the sections under the
   * chapter being read puts the second level one click deep without lengthening the list for
   * everyone else.
   */
  sections?: Array<{ id: string; label: string }>;
  /** A single mark, carried only where the record rates something high. */
  flagged?: boolean;
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
    padding: "8px 10px",
    fontFamily: SANS,
    fontSize: 13.5,
    borderRadius: 7,
    border: `1px solid ${active ? "rgba(0,102,204,0.3)" : "transparent"}`,
    borderLeft: `3px solid ${active ? V4.green : "transparent"}`,
    textDecoration: "none",
    color: !drafted ? V4.stone : active ? V4.ink : V4.slate,
    background: active ? V4.surface : "transparent",
    boxShadow: active ? "0 8px 18px rgba(12,26,58,0.06)" : undefined,
    cursor: drafted ? "pointer" : "default",
  };
}

const railLabelStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const indexStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  color: V4.stone,
  marginRight: 8,
};

const flagStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: V4.red,
  flexShrink: 0,
};

const sectionListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  margin: "2px 0 6px 26px",
};

const sectionLinkStyle: CSSProperties = {
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: V4.blue,
  textDecoration: "none",
  padding: "3px 0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const RECORD_SOURCE_LABELS: Record<HomeRecordSourceKind, string> = {
  ecl_serving_projection: "Live governed record",
  reviewed_snapshot: "Reviewed stored record",
  reviewed_snapshot_fallback: "Reviewed stored record fallback",
};

export function Rail({
  clientLabel,
  groups,
  activeId,
  onSelect,
  compiledLine,
  recordSource,
}: {
  clientLabel: string;
  groups: RailGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  compiledLine: string[];
  recordSource: HomeRecordRenderSource;
}) {
  return (
    <nav
      style={{
        borderRight: `1px solid ${V4.rule}`,
        background: V4.cream,
        padding: "22px 14px 20px",
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0,1fr)",
            alignItems: "baseline",
            gap: 8,
            marginTop: 7,
          }}
        >
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
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 21,
              fontWeight: 500,
              letterSpacing: "-0.022em",
              lineHeight: 1.14,
              minWidth: 0,
            }}
          >
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
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: V4.amber,
              flexShrink: 0,
            }}
          />
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
        <p
          style={{
            margin: "11px 0 0",
            fontFamily: SANS,
            fontSize: 12,
            lineHeight: 1.5,
            color: V4.slate,
          }}
        >
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
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
            }}
          >
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
          {group.items.map((item) => {
            const active = item.id === activeId;
            return (
              <div key={item.id}>
                {item.drafted ? (
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(item.id);
                    }}
                    style={itemStyle(active, true)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span style={railLabelStyle}>
                      {typeof item.index === "number" ? (
                        <span style={indexStyle}>{item.index}</span>
                      ) : null}
                      {item.label}
                      {typeof item.count === "number" ? (
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color: V4.slate,
                          }}
                        >
                          {" "}
                          {item.count}
                        </span>
                      ) : null}
                    </span>
                    {item.flagged ? (
                      <span
                        aria-label="the record rates something here as high"
                        data-home-rail-flag
                        style={flagStyle}
                      />
                    ) : null}
                  </a>
                ) : (
                  <span style={itemStyle(false, false)}>
                    <span style={railLabelStyle}>
                      {typeof item.index === "number" ? (
                        <span style={indexStyle}>{item.index}</span>
                      ) : null}
                      {item.label}
                      {typeof item.count === "number" ? (
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color: V4.slate,
                          }}
                        >
                          {" "}
                          {item.count}
                        </span>
                      ) : null}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: V4.stone,
                        whiteSpace: "nowrap",
                      }}
                    >
                      NOT IN DRAFT
                    </span>
                  </span>
                )}
                {active && item.sections?.length ? (
                  <div
                    data-home-rail-sections={item.sections.length}
                    style={sectionListStyle}
                  >
                    {item.sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        style={sectionLinkStyle}
                      >
                        {section.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 13 }}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 7 }}>
          Record on screen
        </div>
        <p
          data-home-record-source={recordSource.kind}
          data-home-canonical-snapshot-hash={recordSource.canonicalSnapshotHash}
          title={`canonical_snapshot_hash: ${recordSource.canonicalSnapshotHash}`}
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 1.75,
            color: V4.slate,
          }}
        >
          <span>{RECORD_SOURCE_LABELS[recordSource.kind]}</span>
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 13 }}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 7 }}>Compiled</div>
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 1.75,
            color: V4.slate,
          }}
        >
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
