"use client";

// ContextCorpusTab · Corpus tab
//
// 3 sub-tabs: Relevant to you / Browse by taxonomy / Search
// Relevant: stub patterns matched to derived insights
// Browse: taxonomy drill + placeholder for 10k+ patterns
// Search: text search over stub patterns

import { useState } from "react";

const C = {
  panel: "#FFFFFF",
  ink: "#1B1A17",
  muted: "#6F6A61",
  line: "#E6E2DA",
  line2: "#EFECE5",
  chip: "#F1EEE7",
  fresh: "#3F7A5B",
  freshBg: "#3F7A5B14",
  attention: "#B5852A",
  attentionBg: "#B5852A18",
  blue: "#39627F",
  blueBg: "#39627F12",
};

type CorpusMode = "relevant" | "taxonomy" | "search";

interface CorpusPattern {
  h: string;
  c: string;
  conf: number;
  depth: number;
  x: string;
}

const CORPUS_PATTERNS: CorpusPattern[] = [
  {
    h: "AMS Vendor Consolidation Playbook",
    c: "Sourcing",
    conf: 0.86,
    depth: 9,
    x: "Consolidating fragmented AMS contracts; leverage windows and benchmarks.",
  },
  {
    h: "AMS Renewal Negotiation Canon",
    c: "Sourcing",
    conf: 0.82,
    depth: 8,
    x: "Levers for incumbent AMS renewals — benchmark anchoring, exit credibility.",
  },
  {
    h: "Copilot Value Realization Curve",
    c: "AI Value",
    conf: 0.78,
    depth: 7,
    x: "Adoption→productivity lag for code-assist tools.",
  },
  {
    h: "AI Initiative Stage-Gate Model",
    c: "Operating Model",
    conf: 0.8,
    depth: 8,
    x: "Pilot→Scale→Embed gates and the evidence each requires.",
  },
  {
    h: "ITSM AI Triage Pattern",
    c: "AI Value",
    conf: 0.74,
    depth: 6,
    x: "Where ML-assisted routing cuts MTTR.",
  },
];

const RELEVANT_MATCHES = [
  { p: CORPUS_PATTERNS[1], to: "AMS renewal insight", fit: "high" },
  { p: CORPUS_PATTERNS[0], to: "AMS renewal insight", fit: "high" },
  { p: CORPUS_PATTERNS[2], to: "Copilot value insight", fit: "high" },
  { p: CORPUS_PATTERNS[4], to: "Service-quality slide", fit: "medium" },
];

const CATEGORIES = [...new Set(CORPUS_PATTERNS.map((c) => c.c))];

function CorpusPatternCard({
  p,
  showCategory = false,
  fit,
}: {
  p: CorpusPattern;
  showCategory?: boolean;
  fit?: "high" | "medium";
}) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 7,
        padding: "13px 15px",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 13,
        }}
      >
        <div>
          <h4
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 15,
              fontWeight: 400,
              margin: "0 0 4px",
              color: C.ink,
            }}
          >
            {p.h}
          </h4>
          <p style={{ color: C.muted, fontSize: 12.5, margin: 0 }}>{p.x}</p>
        </div>
        {fit && (
          <span
            style={{
              fontSize: 10.5,
              padding: "2.5px 8px",
              borderRadius: 20,
              whiteSpace: "nowrap" as const,
              fontWeight: 500,
              background: fit === "high" ? C.freshBg : C.attentionBg,
              color: fit === "high" ? C.fresh : C.attention,
            }}
          >
            {fit} fit
          </span>
        )}
        {showCategory && !fit && (
          <span
            style={{
              fontSize: 10.5,
              padding: "2.5px 8px",
              borderRadius: 20,
              background: C.chip,
              color: C.muted,
              whiteSpace: "nowrap" as const,
            }}
          >
            {p.c}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginTop: 11,
          flexWrap: "wrap" as const,
        }}
      >
        {fit && (
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: "2px 8px",
              border: `1px solid ${C.line}`,
              background: "#fff",
              color: C.muted,
            }}
          >
            applies to →{" "}
            {RELEVANT_MATCHES.find((m) => m.p.h === p.h)?.to ?? "insight"}
          </span>
        )}
        <span
          style={{
            fontSize: 10.5,
            borderRadius: 20,
            padding: "2px 8px",
            border: `1px solid ${C.fresh}66`,
            color: C.fresh,
          }}
        >
          conf {p.conf}
        </span>
        <span
          style={{
            fontSize: 10.5,
            borderRadius: 20,
            padding: "2px 8px",
            border: `1px solid ${C.line}`,
            background: "#fff",
            color: C.muted,
          }}
        >
          depth {p.depth}/10
        </span>
        {fit && (
          <button
            type="button"
            style={{
              border: `1px solid ${C.ink}`,
              background: "none",
              color: C.ink,
              borderRadius: 7,
              padding: "4px 10px",
              fontSize: 11.5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Apply ›
          </button>
        )}
      </div>
    </div>
  );
}

export function ContextCorpusTab() {
  const [mode, setMode] = useState<CorpusMode>("relevant");
  const [searchQuery, setSearchQuery] = useState("");

  const SUBTABS: { key: CorpusMode; label: string }[] = [
    { key: "relevant", label: "Relevant to you" },
    { key: "taxonomy", label: "Browse by taxonomy" },
    { key: "search", label: "Search" },
  ];

  const searchResults = CORPUS_PATTERNS.filter(
    (p) =>
      !searchQuery ||
      (p.h + p.x).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <h2
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 21,
          fontWeight: 400,
          margin: "0 0 2px",
          color: C.ink,
        }}
      >
        Corpus
      </h2>
      <p
        style={{
          color: C.muted,
          fontSize: 12.5,
          margin: "0 0 14px",
          maxWidth: 720,
        }}
      >
        The global knowledge library. At 10k+ patterns it&apos;s never a flat
        list — enter by relevance to your insights, by taxonomy, or by search.
      </p>

      {/* Sub-tab strip */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: `1px solid ${C.line}`,
          marginBottom: 16,
        }}
      >
        {SUBTABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            style={{
              background: "none",
              border: "none",
              padding: "8px 13px",
              fontSize: 12.5,
              color: mode === t.key ? C.ink : C.muted,
              borderBottom:
                mode === t.key ? `2px solid ${C.ink}` : "2px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: mode === t.key ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Relevant to you */}
      {mode === "relevant" && (
        <div>
          <p style={{ fontSize: 12, color: C.muted, margin: "-4px 0 12px" }}>
            Pattern matches shown when derived insights are available, ranked by
            applicability.
          </p>
          {RELEVANT_MATCHES.map((r, idx) => (
            <CorpusPatternCard
              key={idx}
              p={r.p}
              fit={r.fit as "high" | "medium"}
            />
          ))}
        </div>
      )}

      {/* Browse by taxonomy */}
      {mode === "taxonomy" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 14,
          }}
        >
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: "14px 15px",
            }}
          >
            <h3
              style={{
                fontSize: 11.5,
                textTransform: "uppercase" as const,
                letterSpacing: "0.5px",
                color: C.muted,
                fontWeight: 600,
                margin: "0 0 11px",
              }}
            >
              Taxonomy · drill, don&apos;t scroll
            </h3>
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                style={{
                  padding: "8px 0",
                  borderTop: `1px solid ${C.line2}`,
                  fontSize: 13,
                }}
              >
                <strong style={{ color: C.ink }}>{cat}</strong>{" "}
                <span style={{ color: C.muted, fontSize: 11.5 }}>
                  · {CORPUS_PATTERNS.filter((p) => p.c === cat).length} patterns
                </span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
              Real library: 10,000+ patterns reached by category → sub-topic →
              cluster (via pattern relationships). Full list never rendered.
            </div>
          </div>

          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: "14px 15px",
            }}
          >
            <h3
              style={{
                fontSize: 11.5,
                textTransform: "uppercase" as const,
                letterSpacing: "0.5px",
                color: C.muted,
                fontWeight: 600,
                margin: "0 0 11px",
              }}
            >
              Coverage · confidence × depth
            </h3>
            <div style={{ fontSize: 12.5, color: C.muted }}>
              {CORPUS_PATTERNS.map((p) => (
                <div
                  key={p.h}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderTop: `1px solid ${C.line2}`,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: C.muted }}>{p.c}</span>
                  <span>
                    <span style={{ color: C.blue, fontWeight: 600 }}>
                      {p.conf}
                    </span>
                    <span style={{ color: C.muted }}> · depth {p.depth}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              Where the corpus is deep &amp; confident vs thin.
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {mode === "search" && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the corpus… e.g. AMS renewal, Copilot value"
              style={{
                width: "100%",
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontFamily: "inherit",
                fontSize: 13,
                outline: "none",
                background: "#fff",
                color: C.ink,
              }}
            />
          </div>
          {searchResults.length > 0 ? (
            searchResults.map((p, idx) => (
              <CorpusPatternCard key={idx} p={p} showCategory />
            ))
          ) : (
            <p style={{ color: C.muted, fontSize: 13 }}>No match.</p>
          )}
        </div>
      )}
    </div>
  );
}
