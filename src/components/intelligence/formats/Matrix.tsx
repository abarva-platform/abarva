'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function Matrix({ payload }: { payload: NexusTurnPayload }) {
  const dimensions = payload.dimensions ?? [];
  return (
    <div className="intel-format-block">
      {payload.hero ? <div className="intel-title" style={{ fontSize: 30 }}>{payload.hero}</div> : null}
      {payload.answer ? <div style={{ fontSize: 14, lineHeight: 1.6 }}>{payload.answer}</div> : null}
      <table className="intel-matrix">
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dimension) => (
            <tr key={dimension.name}>
              <td>{dimension.name}</td>
              <td>
                <div className="intel-inline-list">
                  {dimension.values.map((entry) => (
                    <span key={`${dimension.name}-${entry.option}`} className={`intel-chip ${entry.winner ? 'teal' : ''}`}>
                      {entry.option}: {entry.value}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payload.crux ? <div className="intel-crux"><strong>The crux.</strong> {payload.crux}</div> : null}
      {payload.tiebreaker ? (
        <div className="intel-tiebreaker">
          <strong>Tiebreaker.</strong> {payload.tiebreaker.question} · {payload.tiebreaker.resolver}
        </div>
      ) : null}
    </div>
  );
}
