"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  PhaseIntelligenceItem,
  PhaseIntelligenceSummary,
} from "@/lib/programs/phase-intelligence-summary";

interface PhaseIntelligencePanelProps {
  moveId: string;
  phase: number;
}

function itemClass(item: PhaseIntelligenceItem): string {
  return `mxw-intel-item ${item.tone}`;
}

export function PhaseIntelligencePanel({ moveId, phase }: PhaseIntelligencePanelProps) {
  const [summary, setSummary] = useState<PhaseIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/programs/${moveId}/phase-intelligence?phase=${phase}`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Phase Intelligence failed (${response.status})`);
        return (await response.json()) as PhaseIntelligenceSummary;
      })
      .then((payload) => {
        if (!active) return;
        setSummary(payload);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Phase Intelligence failed");
        setSummary(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [moveId, phase]);

  if (loading) {
    return (
      <section className="mxw-intel-panel" aria-busy="true">
        <div className="mxw-intel-empty">Loading phase intelligence…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mxw-intel-panel">
        <div className="mxw-intel-empty">
          <strong>Phase Intelligence is unavailable.</strong>
          <span>{error}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mxw-intel-panel" aria-label="Phase Intelligence summary">
      <div className="mxw-intel-kicker">Phase Intelligence</div>
      <h2>Three things worth knowing before the next decision.</h2>
      <p>
        This view only summarizes existing governed state: decision records,
        function-pack intelligence, and the same gate/evidence readiness used by
        aVa and Approve &amp; Build.
      </p>
      <div className="mxw-intel-grid">
        {(summary?.items ?? []).map((item) => (
          <article className={itemClass(item)} key={item.id}>
            <div className="mxw-intel-item-top">
              <span>{item.eyebrow}</span>
              <em>{item.sourceLabel}</em>
            </div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            {item.facts.length > 0 ? (
              <ul>
                {item.facts.slice(0, 3).map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            ) : null}
            {item.href && item.hrefLabel ? (
              <Link className="mxw-intel-link" href={item.href}>
                {item.hrefLabel} →
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
