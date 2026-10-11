"use client";

import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  chartPlot,
  graphPlot,
} from "@/lib/intelligence/answer/model-exhibit-layout";

export function ModelAuthoredExhibits({ answer }: { answer: AvaAnswerPacket }) {
  return (
    <div className="space-y-4" aria-label="Claude exhibits">
      {answer.artifacts.map((a) => (
        <section
          key={a.id}
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          {a.title && <h3 className="mb-3 font-semibold">{a.title}</h3>}
          {a.artifact === "table" ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      {a.columns.map((c) => (
                        <th className="border-b p-2" key={c.key}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.rows.map((r, i) => (
                      <tr key={i}>
                        {a.columns.map((c) => (
                          <td className="border-b p-2 align-top" key={c.key}>
                            {r[c.key] === null ? "" : String(r[c.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {a.note && <p className="mt-2 text-sm">{a.note}</p>}
            </>
          ) : a.artifact === "chart" ? (
            (() => {
              const p = chartPlot(a);
              return (
                <>
                  {a.subtitle && <p>{a.subtitle}</p>}
                  <svg
                    viewBox={`0 0 ${p.width} ${p.height}`}
                    role="img"
                    aria-label={a.title ?? "Chart"}
                    className="w-full"
                  >
                    <line
                      x1={p.horizontal ? p.baselineX : 30}
                      x2={p.horizontal ? p.baselineX : 470}
                      y1={p.horizontal ? 10 : p.baseline}
                      y2={p.horizontal ? 200 : p.baseline}
                      stroke="#a8a29e"
                    />
                    {a.kind === "line" && (
                      <polyline
                        points={p.points.map((v) => `${v.x},${v.y}`).join(" ")}
                        fill="none"
                        stroke="#166534"
                        strokeWidth="2"
                      />
                    )}
                    {p.points.map((v, i) => (
                      <g key={i}>
                        {a.kind === "line" ? (
                          <circle cx={v.x} cy={v.y} r="4" fill="#166534" />
                        ) : (
                          <rect
                            x={
                              p.horizontal
                                ? Math.min(v.x, p.baselineX)
                                : v.x - 12
                            }
                            y={
                              p.horizontal ? v.y - 7 : Math.min(v.y, p.baseline)
                            }
                            width={
                              p.horizontal ? Math.abs(v.x - p.baselineX) : 24
                            }
                            height={
                              p.horizontal ? 14 : Math.abs(v.y - p.baseline)
                            }
                            fill="#166534"
                          />
                        )}
                        <text
                          x={p.horizontal ? v.x + 8 : v.x}
                          y={p.horizontal ? v.y + 3 : v.y - 8}
                          textAnchor="middle"
                          fontSize="10"
                        >
                          {String(v.value)}
                        </text>
                        <text
                          x={p.horizontal ? 18 : v.x}
                          y={p.horizontal ? v.y + 3 : 193}
                          textAnchor="middle"
                          fontSize="10"
                        >
                          {i + 1}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <p className="text-sm">{a.unit}</p>
                  <ol className="list-inside list-decimal text-sm">
                    {p.points.map((v, i) => (
                      <li key={i}>
                        {v.label}: {String(v.value)}
                      </li>
                    ))}
                  </ol>
                  {a.sourceNote && (
                    <p className="mt-2 text-sm">{a.sourceNote}</p>
                  )}
                </>
              );
            })()
          ) : (
            (() => {
              const p = graphPlot(a);
              return (
                <>
                  <svg
                    viewBox={`0 0 ${p.width} ${p.height}`}
                    role="img"
                    aria-label={a.title ?? "Dependency graph"}
                    className="w-full"
                  >
                    {p.edges.map((e, i) => {
                      const angle = Math.atan2(
                        e.toNode.y - e.fromNode.y,
                        e.toNode.x - e.fromNode.x,
                      );
                      const x = e.toNode.x - Math.cos(angle) * 16,
                        y = e.toNode.y - Math.sin(angle) * 16;
                      return (
                        <g key={i}>
                          <line
                            x1={e.fromNode.x}
                            y1={e.fromNode.y}
                            x2={x}
                            y2={y}
                            stroke="#78716c"
                          />
                          <polygon
                            points={`${x},${y} ${x - Math.cos(angle - 0.5) * 9},${y - Math.sin(angle - 0.5) * 9} ${x - Math.cos(angle + 0.5) * 9},${y - Math.sin(angle + 0.5) * 9}`}
                            fill="#78716c"
                          />
                        </g>
                      );
                    })}
                    {p.nodes.map((n) => (
                      <g key={n.id}>
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="16"
                          fill="#dcfce7"
                          stroke="#166534"
                        />
                        <text
                          x={n.x}
                          y={n.y + 4}
                          textAnchor="middle"
                          fontSize="12"
                        >
                          {n.index}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <ol className="list-inside list-decimal text-sm">
                    {p.nodes.map((n) => (
                      <li key={n.id}>{n.label}</li>
                    ))}
                  </ol>
                  <ul className="mt-2 text-sm">
                    {p.edges.map((e, i) => (
                      <li key={i}>
                        {e.fromNode.label} → {e.toNode.label}
                        {e.label ? `: ${e.label}` : ""}
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()
          )}
          {a.citationIds?.length ? (
            <p className="mt-2 text-xs text-stone-500">
              {a.citationIds.map((id) => `[${id}]`).join(" ")}
            </p>
          ) : null}
        </section>
      ))}
      {answer.citations.length > 0 && (
        <details className="text-sm">
          <summary>Sources cited by Claude</summary>
          <ul>
            {answer.citations.map((c) => (
              <li key={c.id}>
                [{c.id}] {c.label}
                {c.url && (
                  <>
                    {" "}
                    —{" "}
                    <a href={c.url} target="_blank" rel="noreferrer">
                      Source
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
