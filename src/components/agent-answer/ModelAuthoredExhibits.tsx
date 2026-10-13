"use client";

import { ModelAuthoredChart } from "./ModelAuthoredChart";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { graphPlot } from "@/lib/intelligence/answer/model-exhibit-layout";
import { sourceDisplayLabel } from "@/lib/intelligence/answer/source-display-label";

export function ModelAuthoredExhibits({
  answer,
  showSources = true,
}: {
  answer: AvaAnswerPacket;
  showSources?: boolean;
}) {
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
            <ModelAuthoredChart chart={a} />
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
        </section>
      ))}
      {showSources && <ModelAuthoredSources answer={answer} />}
    </div>
  );
}

export function ModelAuthoredSources({ answer }: { answer: AvaAnswerPacket }) {
  return answer.citations.length > 0 ? (
    <details className="text-sm">
      <summary>Sources</summary>
      <ul>
        {answer.citations.map((c) => (
          <li key={c.id}>
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer">
                {sourceDisplayLabel(c.label)}
              </a>
            ) : (
              sourceDisplayLabel(c.label)
            )}
            {c.recordId && (
              <p className="text-xs text-stone-600">
                Context record: {c.recordId}
              </p>
            )}
            {c.excerpt && (
              <details className="mt-1">
                <summary>Supplied context</summary>
                <p className="whitespace-pre-wrap text-xs">{c.excerpt}</p>
              </details>
            )}
          </li>
        ))}
      </ul>
    </details>
  ) : null;
}
