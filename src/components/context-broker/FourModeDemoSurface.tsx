'use client';

/**
 * FourModeDemoSurface · CB-5 + CB-4 wired together
 *
 * The user-facing demo page: type a question, pick a tenant,
 * click Run, see four `ContextAssembledPanel`s side-by-side
 * — generic / corpus / tenant / full. Each panel is the
 * receipt for what the broker assembled in that mode.
 *
 * This is the "60-second value demonstration" called out in
 * the founder's CONTEXT_BROKER_DESIGN.md premise — without an
 * LLM running, the panels prove the retrieval pipeline is
 * real.
 */

import { useEffect, useRef, useState } from 'react';

import type { ContextBundle } from '@/lib/knowledge/context-broker';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

import { ContextAssembledPanel } from './ContextAssembledPanel';

type TenantOption = 'apex-retail' | 'meridian-health' | '';

interface ModeBundles {
  generic: ContextBundle;
  corpus: ContextBundle;
  tenant: ContextBundle | null;
  full: ContextBundle | null;
}

interface DemoApiResponse {
  bundles: ModeBundles;
  summaries?: unknown;
  error?: string;
}

const SAMPLE_QUERIES: ReadonlyArray<{ label: string; tenant: TenantOption; query: string }> = [
  {
    label: 'Why is Apex CDP at risk?',
    tenant: 'apex-retail',
    query: 'Why is the Apex CDP program at risk right now?',
  },
  {
    label: "Why is Meridian's prior-auth risky?",
    tenant: 'meridian-health',
    query: "Why is Meridian's prior-authorization program high-risk right now?",
  },
  {
    label: 'Cold CIO (no tenant)',
    tenant: '',
    query: 'Why do AI pilots fail to scale?',
  },
];

export function FourModeDemoSurface() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0]!.query);
  const [tenant, setTenant] = useState<TenantOption>(SAMPLE_QUERIES[0]!.tenant);
  const [bundles, setBundles] = useState<ModeBundles | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function runDemo() {
    setError(null);
    setLoading(true);
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await fetch('/api/context/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          tenantKey: tenant || undefined,
          mode: 'all',
        }),
        signal: ctl.signal,
      });
      const json = (await res.json()) as DemoApiResponse;
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setBundles(null);
        return;
      }
      setBundles(json.bundles);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : String(err));
      setBundles(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="four-mode-demo-surface"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
        padding: SPACING.lg,
        background: COLORS.cream,
        minHeight: '100vh',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Context broker · four-mode comparison
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 32,
            color: COLORS.ink,
            fontWeight: 400,
            lineHeight: 1.2,
          }}
        >
          The same question, assembled four ways.
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: `${COLORS.ink}aa`,
            lineHeight: 1.5,
            maxWidth: '720px',
          }}
        >
          Each panel below is the <em>receipt</em> for what the broker
          retrieved. Generic mode answers from the model alone. Corpus
          adds the AbarVa pattern catalog. Tenant adds your data. Full
          composes everything. The visible difference between panels is
          the moat made legible.
        </p>
      </header>

      <Form
        query={query}
        tenant={tenant}
        loading={loading}
        onQueryChange={setQuery}
        onTenantChange={setTenant}
        onRun={runDemo}
      />

      {error ? (
        <div
          data-testid="four-mode-demo-error"
          style={{
            background: COLORS.coralSoft,
            border: `1px solid ${COLORS.coralInk}33`,
            borderRadius: RADIUS.sm,
            padding: SPACING.md,
            color: COLORS.coralInk,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <PanelGrid bundles={bundles} loading={loading} />
    </div>
  );
}

function Form({
  query,
  tenant,
  loading,
  onQueryChange,
  onTenantChange,
  onRun,
}: {
  query: string;
  tenant: TenantOption;
  loading: boolean;
  onQueryChange: (q: string) => void;
  onTenantChange: (t: TenantOption) => void;
  onRun: () => void;
}) {
  return (
    <section
      data-testid="four-mode-demo-form"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
        <label
          htmlFor="four-mode-demo-query"
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Question
        </label>
        <textarea
          id="four-mode-demo-query"
          data-testid="four-mode-demo-query"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          rows={3}
          placeholder="Ask Sentinel anything…"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: COLORS.ink,
            background: COLORS.cream,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: RADIUS.sm,
            padding: SPACING.sm,
            resize: 'vertical',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
          <label
            htmlFor="four-mode-demo-tenant"
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}99`,
              fontWeight: 600,
            }}
          >
            Tenant
          </label>
          <select
            id="four-mode-demo-tenant"
            data-testid="four-mode-demo-tenant"
            value={tenant}
            onChange={(e) => onTenantChange(e.target.value as TenantOption)}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: COLORS.ink,
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}22`,
              borderRadius: RADIUS.sm,
              padding: `${SPACING.xs} ${SPACING.sm}`,
            }}
          >
            <option value="">(none — cold visitor)</option>
            <option value="apex-retail">Apex Retail Group</option>
            <option value="meridian-health">Meridian Health System</option>
          </select>
        </div>

        <button
          type="button"
          data-testid="four-mode-demo-run"
          onClick={onRun}
          disabled={loading || query.trim().length === 0}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.white,
            background: loading ? `${COLORS.navy}88` : COLORS.navy,
            border: 'none',
            borderRadius: RADIUS.sm,
            padding: `${SPACING.sm} ${SPACING.lg}`,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Assembling…' : 'Run all four modes'}
        </button>
      </div>

      <SampleQueryRow
        onPick={(s) => {
          onQueryChange(s.query);
          onTenantChange(s.tenant);
        }}
      />
    </section>
  );
}

function SampleQueryRow({
  onPick,
}: {
  onPick: (sample: typeof SAMPLE_QUERIES[number]) => void;
}) {
  return (
    <div
      data-testid="four-mode-demo-samples"
      style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}77`,
          alignSelf: 'center',
        }}
      >
        Try:
      </p>
      {SAMPLE_QUERIES.map((s, i) => (
        <button
          key={i}
          type="button"
          data-testid={`four-mode-demo-sample-${i}`}
          onClick={() => onPick(s)}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.navy,
            background: 'transparent',
            border: `1px solid ${COLORS.navy}55`,
            borderRadius: RADIUS.pill,
            padding: `2px ${SPACING.sm}`,
            cursor: 'pointer',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function PanelGrid({
  bundles,
  loading,
}: {
  bundles: ModeBundles | null;
  loading: boolean;
}) {
  if (!bundles) {
    return (
      <section
        data-testid="four-mode-demo-grid-empty"
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: `${COLORS.ink}99`,
            fontStyle: 'italic',
          }}
        >
          {loading
            ? 'Assembling four modes in parallel…'
            : 'Run a question to see the four-mode comparison.'}
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="four-mode-demo-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: SPACING.md,
        alignItems: 'start',
      }}
    >
      <ModeColumn label="Generic" bundle={bundles.generic} testid="four-mode-demo-generic" />
      <ModeColumn label="Corpus" bundle={bundles.corpus} testid="four-mode-demo-corpus" />
      <ModeColumn
        label="Tenant"
        bundle={bundles.tenant}
        testid="four-mode-demo-tenant-col"
        emptyHint="Pick a tenant to see this column."
      />
      <ModeColumn
        label="Full (corpus + tenant)"
        bundle={bundles.full}
        testid="four-mode-demo-full-col"
        emptyHint="Pick a tenant to see this column."
      />
    </section>
  );
}

function ModeColumn({
  label,
  bundle,
  testid,
  emptyHint,
}: {
  label: string;
  bundle: ContextBundle | null;
  testid: string;
  emptyHint?: string;
}) {
  return (
    <div
      data-testid={testid}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          fontWeight: 400,
          lineHeight: 1.3,
        }}
      >
        {label}
      </h2>
      {bundle ? (
        <ContextAssembledPanel bundle={bundle} />
      ) : (
        <div
          data-testid={`${testid}-empty`}
          style={{
            background: COLORS.cream,
            border: `1px dashed ${COLORS.ink}33`,
            borderRadius: RADIUS.sm,
            padding: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {emptyHint ?? 'No bundle for this mode.'}
        </div>
      )}
    </div>
  );
}
