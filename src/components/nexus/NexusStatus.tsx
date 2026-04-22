'use client';

export function NexusStatus({
  mode: _mode,
  format: _format,
  progress: _progress,
}: {
  mode: string | null;
  format: string | null;
  progress: Array<{ phase: string; status: string; latencyMs?: number }>;
}) {
  return (
    <div className="intel-status-panel intel-section" aria-live="polite">
      <div className="intel-eyebrow">Nexus</div>
      <div className="intel-subtle" style={{ marginTop: 10, fontSize: 13 }}>
        Responding…
      </div>
    </div>
  );
}
