import type { AnswerChart } from "@/lib/ava-answer/contract";
import { matrixPlot } from "@/lib/intelligence/answer/model-exhibit-layout";

export function ModelAuthoredMatrix({ chart }: { chart: AnswerChart }) {
  const p = matrixPlot(chart);
  return (
    <div
      data-chart-renderer="svg-matrix"
      role="group"
      aria-label={chart.title}
      className="w-full"
    >
      {chart.subtitle && (
        <p className="mb-3 text-sm text-slate-600">{chart.subtitle}</p>
      )}
      <svg
        viewBox={`0 0 ${p.width} ${p.height}`}
        role="img"
        aria-label={`${chart.title}: ${chart.xKey} and ${chart.yKey}`}
        className="w-full"
        style={{ fontFamily: "inherit" }}
      >
        {p.quadrants.map((q, i) => (
          <g key={i}>
            <rect
              x={q.x}
              y={q.y}
              width={p.cellWidth}
              height={p.rowHeight}
              fill={q.fill}
            />
            {q.items.map((item) => (
              <g key={item.index}>
                <circle
                  cx={item.x + 10}
                  cy={item.y + 1}
                  r={11}
                  fill="#214f4b"
                />
                <text
                  x={item.x + 10}
                  y={item.y + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="white"
                >
                  {item.index}
                </text>
                {item.lines.map((line, j) => (
                  <text
                    key={j}
                    x={item.x + 30}
                    y={item.y + 6 + j * 19}
                    fontSize={15}
                    fontWeight={600}
                    fill="#16343d"
                  >
                    {line}
                  </text>
                ))}
              </g>
            ))}
          </g>
        ))}
        <rect
          x={p.left}
          y={p.top}
          width={p.cellWidth * 2}
          height={p.rowHeight * 2}
          fill="none"
          stroke="#b6c5cb"
        />
        <line
          x1={p.left + p.cellWidth}
          x2={p.left + p.cellWidth}
          y1={p.top}
          y2={p.top + p.rowHeight * 2}
          stroke="#b6c5cb"
          strokeDasharray="5 5"
        />
        <line
          x1={p.left}
          x2={p.left + p.cellWidth * 2}
          y1={p.top + p.rowHeight}
          y2={p.top + p.rowHeight}
          stroke="#b6c5cb"
          strokeDasharray="5 5"
        />
        <g fill="#425b66" fontSize={13}>
          <text x={p.left - 12} y={p.top + p.rowHeight / 2} textAnchor="end">
            High
          </text>
          <text x={p.left - 12} y={p.top + p.rowHeight * 1.5} textAnchor="end">
            Low
          </text>
          <text
            x={p.left + p.cellWidth / 2}
            y={p.height - 43}
            textAnchor="middle"
          >
            Low
          </text>
          <text
            x={p.left + p.cellWidth * 1.5}
            y={p.height - 43}
            textAnchor="middle"
          >
            High
          </text>
        </g>
        <g fill="#16343d" fontSize={15} fontWeight={700}>
          <text x={p.left + p.cellWidth} y={p.height - 16} textAnchor="middle">
            {chart.xKey}
          </text>
          <text
            transform={`translate(22 ${p.top + p.rowHeight}) rotate(-90)`}
            textAnchor="middle"
          >
            {chart.yKey}
          </text>
        </g>
      </svg>
      <ol
        className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2"
        aria-label="Opportunity rationale and validation gates"
      >
        {p.entries.map((entry) => (
          <li key={entry.index} className="flex gap-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-900 text-xs font-semibold text-white"
              aria-hidden="true"
            >
              {entry.index}
            </span>
            <div>
              <p className="font-semibold text-slate-800">
                <span className="sr-only">{entry.index}. </span>
                {entry.label}
              </p>
              {entry.details.map((d) => (
                <p key={d.key} className="text-slate-600">
                  {["reason", "rationale"].includes(d.key.toLowerCase())
                    ? ""
                    : `${d.key}: `}
                  {d.value}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {chart.sourceNote && (
        <p className="mt-4 text-xs text-slate-500">{chart.sourceNote}</p>
      )}
    </div>
  );
}
