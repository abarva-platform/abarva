// AgentMarkdown · F0.1 of Programs Strict Completion v1.2
//
// Closes Crawl Obs #3, #28: agent responses currently render markdown as
// raw text (asterisks, pipe tables, hash symbols visible as literal
// characters). This component renders agent text through react-markdown +
// remark-gfm with brand-aligned styling and custom resolution of:
//   - Pattern IDs (PAT-…, T#-…) → /source/patterns/[id]
//   - Program IDs (APX-…) → /programs/[id]
//   - Source event IDs (SRC-…) → /source/[id]
//   - Citation tags ([user-context: …], [tenant-specific: …], [PAT-…: …])
//     → inline chips per the synthesis instruction layer (F0.3)
//
// Pure tokenization (regexes, citation chip, ID-link, tokenize helpers)
// lives in `markdownTokens.tsx` so it can be unit-tested without pulling
// in react-markdown's ESM (which next/jest can't transpile by default).
//
// Coexistence with `{{cite:type:id}}` placeholders in AgentResponse.tsx:
// AgentResponse builds an `inlineNodes` map keyed by placeholder string
// and passes it through. This component substitutes those placeholders
// inline before any other tokenization runs.

"use client";

import { useMemo, useState, useEffect } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BrandColors, BrandTypography } from "@/lib/shell/brand-tokens";
import {
  GENERAL_PRACTICE_PREFACE,
  normalizeAbarvaAgentMarkup,
  tokenizeChildren,
} from "./markdownTokens";

// ── Inline chart renderer ─────────────────────────────────────────────────────

interface ChartHint {
  type: "bar" | "horizontal-bar" | "line" | "area" | "pie";
  title?: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  yKey2?: string;
  color?: string;
  color2?: string;
  unit?: string;
  note?: string;
}

function renderChartBody(
  hint: ChartHint,
  fmtVal: (v: unknown) => string,
): ReactNode {
  const { type, data, xKey, yKey, yKey2 } = hint;
  const color = hint.color ?? "#218553";
  const color2 = hint.color2 ?? "#E07A34";
  const tStyle = { fontSize: 11, borderRadius: 6, border: "1px solid #E5E5E2" };
  const tickSm = { fontSize: 10, fill: "#6d675f" };

  if (type === "horizontal-bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 44, bottom: 0, left: 4 }}
          barSize={18}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#EBEBEA"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={tickSm}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtVal(v)}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            tick={{ fontSize: 10, fill: "#404040", fontWeight: 500 }}
            width={106}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: unknown) => [fmtVal(v), ""]}
            contentStyle={tStyle}
          />
          <Bar
            dataKey={yKey}
            fill={color}
            radius={[0, 3, 3, 0]}
            label={{
              position: "right" as const,
              fontSize: 10,
              fill: "#404040",
              fontWeight: 600,
              formatter: (v: unknown) => fmtVal(v),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#EBEBEA"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={tickSm}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={tickSm}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtVal(v)}
            width={36}
          />
          <Tooltip
            formatter={(v: unknown) => [fmtVal(v), ""]}
            contentStyle={tStyle}
          />
          <Bar dataKey={yKey} fill={color} radius={[3, 3, 0, 0]} />
          {yKey2 && <Bar dataKey={yKey2} fill={color2} radius={[3, 3, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#EBEBEA"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={tickSm}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={tickSm}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtVal(v)}
            width={36}
          />
          <Tooltip
            formatter={(v: unknown) => [fmtVal(v), ""]}
            contentStyle={tStyle}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
          {yKey2 && (
            <Line
              type="monotone"
              dataKey={yKey2}
              stroke={color2}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="icg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
            {yKey2 && (
              <linearGradient id="icg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color2} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color2} stopOpacity={0.02} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#EBEBEA"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={tickSm}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={tickSm}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtVal(v)}
            width={36}
          />
          <Tooltip
            formatter={(v: unknown) => [fmtVal(v), ""]}
            contentStyle={tStyle}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill="url(#icg1)"
            dot={false}
          />
          {yKey2 && (
            <Area
              type="monotone"
              dataKey={yKey2}
              stroke={color2}
              strokeWidth={2}
              strokeDasharray="5 3"
              fill="url(#icg2)"
              dot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie") {
    const PIE_COLORS = [
      color,
      color2,
      "#1A6B8A",
      "#7B4F9E",
      "#C84A1E",
      "#857B6F",
    ];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={72}
            innerRadius={34}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: unknown) => [fmtVal(v), ""]}
            contentStyle={tStyle}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return null;
}

function ChartLightbox({
  hint,
  onClose,
}: {
  hint: ChartHint;
  onClose: () => void;
}) {
  const { title, subtitle, unit = "", note } = hint;
  const fmtVal = (v: unknown) => (unit ? `${unit}${String(v)}` : String(v));
  const chartH =
    hint.type === "horizontal-bar"
      ? Math.max(260, hint.data.length * 38)
      : hint.type === "pie"
        ? 320
        : 340;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Chart"}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,18,40,0.55)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAFAF8",
          borderRadius: 12,
          padding: "24px 28px 18px",
          width: "min(860px, 92vw)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close chart"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#6d675f",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        {title && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#161411",
              marginBottom: subtitle ? 3 : 14,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 11, color: "#6d675f", marginBottom: 14 }}>
            {subtitle}
          </div>
        )}
        <div style={{ height: chartH }}>{renderChartBody(hint, fmtVal)}</div>
        {note && (
          <div style={{ fontSize: 10, color: "#8d8680", marginTop: 10 }}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
}
ChartLightbox.displayName = "ChartLightbox";

function InlineChart({ raw }: { raw: string }) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  let hint: ChartHint;
  try {
    hint = JSON.parse(raw) as ChartHint;
  } catch {
    return null;
  }
  if (!Array.isArray(hint.data) || hint.data.length === 0) return null;

  const { title, subtitle, unit = "", note } = hint;
  const fmtVal = (v: unknown) => (unit ? `${unit}${String(v)}` : String(v));
  const chartH =
    hint.type === "horizontal-bar"
      ? Math.max(140, hint.data.length * 32)
      : hint.type === "pie"
        ? 180
        : 190;

  return (
    <>
      {expanded && mounted && (
        <ChartLightbox hint={hint} onClose={() => setExpanded(false)} />
      )}
      <div
        style={{
          margin: "10px 0",
          background: "rgba(12,26,58,0.02)",
          border: "1px solid rgba(12,26,58,0.1)",
          borderRadius: 8,
          padding: "12px 12px 8px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          onClick={() => setExpanded(true)}
          aria-label="Expand chart"
          title="Expand chart"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 3,
            color: "#8d8680",
            fontSize: 13,
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          ⤢
        </button>
        {title && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#161411",
              marginBottom: subtitle ? 2 : 8,
              lineHeight: 1.3,
              paddingRight: 20,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 10, color: "#6d675f", marginBottom: 8 }}>
            {subtitle}
          </div>
        )}
        <div style={{ height: mounted ? chartH : 0 }}>
          {mounted && renderChartBody(hint, fmtVal)}
        </div>
        {note && (
          <div style={{ fontSize: 10, color: "#8d8680", marginTop: 6 }}>
            {note}
          </div>
        )}
      </div>
    </>
  );
}
InlineChart.displayName = "InlineChart";

// ── Component overrides ───────────────────────────────────────────────────────
//
// Each markdown element override is bound to the caller's `inlineNodes`
// map via closure. AgentMarkdown builds the components map per-call so
// that overrides see the current inline substitutions without going
// through React context (which would force hooks inside lowercase-named
// callbacks and trip rules-of-hooks lint).

type MdComponents = NonNullable<
  ComponentPropsWithoutRef<typeof ReactMarkdown>["components"]
>;

function buildComponents(
  inlineNodes: ReadonlyMap<string, ReactNode> | undefined,
): MdComponents {
  return {
    p: ({ children }) => {
      // Layer-3 fallback preface: italicize the literal preface phrase
      if (
        typeof children === "string" &&
        children.trim().startsWith(GENERAL_PRACTICE_PREFACE)
      ) {
        const rest = children.trim().slice(GENERAL_PRACTICE_PREFACE.length);
        return (
          <p
            style={{
              margin: "0.6em 0",
              fontStyle: "italic",
              color: BrandColors.slate,
              borderLeft: `2px solid ${BrandColors.stone}`,
              paddingLeft: 10,
            }}
          >
            <span style={{ fontWeight: 500 }}>{GENERAL_PRACTICE_PREFACE}</span>
            {rest}
          </p>
        );
      }
      return (
        <p style={{ margin: "0.6em 0" }}>
          {tokenizeChildren(children, "p", inlineNodes)}
        </p>
      );
    },

    li: ({ children }) => (
      <li style={{ margin: "0.2em 0" }}>
        {tokenizeChildren(children, "li", inlineNodes)}
      </li>
    ),

    h1: ({ children }) => (
      <h1
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: "1.4em",
          fontWeight: 400,
          margin: "0.8em 0 0.4em",
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, "h1", inlineNodes)}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: "1.2em",
          fontWeight: 400,
          margin: "0.7em 0 0.35em",
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, "h2", inlineNodes)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        style={{
          fontSize: "1.05em",
          fontWeight: 600,
          margin: "0.6em 0 0.3em",
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, "h3", inlineNodes)}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        style={{
          fontSize: "0.95em",
          fontWeight: 600,
          margin: "0.5em 0 0.25em",
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, "h4", inlineNodes)}
      </h4>
    ),

    strong: ({ children }) => (
      <strong style={{ fontWeight: 600 }}>
        {tokenizeChildren(children, "strong", inlineNodes)}
      </strong>
    ),
    em: ({ children }) => (
      <em>{tokenizeChildren(children, "em", inlineNodes)}</em>
    ),

    code: ({ children, className }) => {
      if (className === "language-chart") {
        return <InlineChart raw={String(children ?? "").trim()} />;
      }
      // Block code (fenced) gets a className like `language-…`; inline code does not.
      const isBlock =
        typeof className === "string" && className.startsWith("language-");
      if (isBlock) {
        return (
          <code
            className={className}
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: "0.88em",
            }}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: "0.88em",
            background: "rgba(12,26,58,0.06)",
            padding: "1px 5px",
            borderRadius: 3,
          }}
        >
          {children}
        </code>
      );
    },
    pre: ({ node, children }) => {
      const first = (
        node as {
          children?: Array<{
            tagName?: string;
            properties?: { className?: unknown };
          }>;
        }
      )?.children?.[0];
      const cls = Array.isArray(first?.properties?.className)
        ? (first.properties.className as string[])
        : [];
      if (cls.includes("language-chart")) return <>{children}</>;
      return (
        <pre
          style={{
            background: "rgba(12,26,58,0.04)",
            border: `1px solid rgba(12,26,58,0.12)`,
            borderRadius: 6,
            padding: "10px 12px",
            margin: "0.7em 0",
            overflowX: "auto",
            fontFamily: BrandTypography.mono,
            fontSize: "0.85em",
            lineHeight: 1.55,
            color: BrandColors.inkBlack,
          }}
        >
          {children}
        </pre>
      );
    },

    a: ({ children, href }) => (
      <a
        href={href}
        style={{
          color: BrandColors.signalBlue,
          textDecoration: "underline",
          textUnderlineOffset: 2,
        }}
      >
        {children}
      </a>
    ),

    ul: ({ children }) => (
      <ul style={{ margin: "0.4em 0", paddingLeft: "1.4em" }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ margin: "0.4em 0", paddingLeft: "1.4em" }}>{children}</ol>
    ),

    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: "0.6em 0",
          padding: "4px 12px",
          borderLeft: `3px solid ${BrandColors.stone}`,
          color: BrandColors.slate,
          fontStyle: "italic",
        }}
      >
        {children}
      </blockquote>
    ),

    hr: () => (
      <hr
        style={{
          border: 0,
          borderTop: `1px solid rgba(12,26,58,0.12)`,
          margin: "1em 0",
        }}
      />
    ),

    table: ({ children }) => (
      <div style={{ overflowX: "auto", margin: "0.8em 0" }}>
        <table
          style={{
            borderCollapse: "collapse",
            background: BrandColors.paper,
            border: `1px solid rgba(12,26,58,0.18)`,
            fontSize: "0.92em",
            width: "100%",
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ background: "rgba(12,26,58,0.04)" }}>{children}</thead>
    ),
    th: ({ children }) => (
      <th
        style={{
          textAlign: "left",
          padding: "6px 10px",
          borderBottom: `1px solid rgba(12,26,58,0.18)`,
          fontWeight: 600,
          color: BrandColors.inkBlack,
          fontSize: "0.86em",
          letterSpacing: "0.02em",
        }}
      >
        {tokenizeChildren(children, "th", inlineNodes)}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          padding: "6px 10px",
          borderBottom: `1px solid rgba(12,26,58,0.08)`,
          verticalAlign: "top",
        }}
      >
        {tokenizeChildren(children, "td", inlineNodes)}
      </td>
    ),
  };
}

// ── Public component ──────────────────────────────────────────────────────────

export interface AgentMarkdownProps {
  /** Raw text emitted by the agent. May contain markdown, IDs, citation tags. */
  text: string;
  /**
   * Optional placeholder→React-node substitutions applied before any
   * other tokenization. Use this to embed pre-built nodes (e.g.
   * <AgentCitation> pills resolved from `{{cite:type:id}}` placeholders)
   * inline in the rendered markdown.
   */
  inlineNodes?: ReadonlyMap<string, ReactNode>;
}

/**
 * Renders agent-emitted text with markdown formatting plus inline
 * resolution of pattern/program/source IDs and synthesis citation tags.
 *
 * XSS is mitigated by `rehype-sanitize` running over the parsed AST
 * before our component overrides see it.
 */
export function AgentMarkdown({ text, inlineNodes }: AgentMarkdownProps) {
  const components = useMemo(() => buildComponents(inlineNodes), [inlineNodes]);
  const normalizedText = useMemo(
    () => normalizeAbarvaAgentMarkup(text),
    [text],
  );
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={components}
    >
      {normalizedText}
    </ReactMarkdown>
  );
}
