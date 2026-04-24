// Pattern detail page · Fix Spec v3 §3.
//
// Reads from pattern_packs (populated by the apex-intelligence-layer
// overlay seed) and composes with a static augmentation layer in
// `src/lib/intelligence/pattern-augmentations.ts` for the three Vendor
// Knowledge Layer signals the DB schema doesn't yet carry:
//   · vendor landscape grouped by architectural layer, with POV
//   · evidence base (named research, authors, years, relevance)
//   · practitioner landscape
//   · AbarVa Maestro rubric (IP layer)
//
// Patterns without an augmentation still render cleanly — just thinner —
// so the route shape is consistent and demo-critical patterns hit the
// "full depth" bar without blocking less-developed ones.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';
import {
  getPatternAugmentation,
  type PatternAugmentation,
  type VendorGroup,
} from '@/lib/intelligence/pattern-augmentations';
import { getPatternIndustryCompositions } from '@/lib/intelligence/industry-compositions';
import { PageShell } from '@/components/shared/layout/PageShell';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { COLORS } from '@/lib/design-system';
import { PatternImpactViz } from '@/components/intelligence/PatternImpactViz';
import { getPatternImpactData } from '@/lib/intelligence/pattern-impact-data';
import { PatternClusterGraph, type ClusterPattern } from '@/components/intelligence/PatternClusterGraph';
import { GenomeSuccessRateBars, type InterventionSuccessRate } from '@/components/intelligence/GenomeSuccessRateBars';
import { SeedGlobalPattern } from '@/components/deliverables/SeedRouteShell';
import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import {
  getPatternApplicablePrograms,
  getPatternBrowsableEvidence,
  getPatternManifestEntry,
  getPatternManifestEntryWithMetrics,
  patternRouteFor,
  type PatternManifestEntry,
} from '@/lib/intelligence/pattern-manifest';
import { COMPOSITE_DISCLAIMER, PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER } from '@/lib/integrity/disclaimers';

export const dynamic = 'force-dynamic';

interface PatternPackRow {
  id: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  sector_applicability: string[] | null;
  trigger_symptoms: string[] | null;
  detection_signals: unknown;
  diagnostic_questions: string[] | null;
  likely_root_causes: unknown;
  common_adjacent_contradictions: unknown;
  intervention_options: unknown;
  common_failure_modes: unknown;
  cross_pattern_links: unknown;
  linked_kpi_ids: string[] | null;
  evidence_summary: string | null;
  confidence_level: string | null;
  version: string | null;
  author: string | null;
  last_updated: string | null;
}

interface LinkedKpiRow {
  id: string;
  name: string;
  category: string | null;
  current_value: number | null;
  current_unit: string | null;
}

async function loadPatternRow(patternId: string, clientId: string | null): Promise<PatternPackRow | null> {
  const sb = getServerSupabase();
  let query = sb.from('pattern_packs').select('*').eq('id', patternId);
  if (clientId) query = query.eq('client_id', clientId);
  const { data } = await query.maybeSingle();
  return (data as PatternPackRow | null) ?? null;
}

async function loadLinkedKpis(linkedIds: string[] | null, clientId: string | null): Promise<LinkedKpiRow[]> {
  if (!clientId || !linkedIds?.length) return [];
  const sb = getServerSupabase();
  const { data } = await sb
    .from('kpis')
    .select('id, name, category, current_value, current_unit')
    .eq('client_id', clientId)
    .in('id', linkedIds);
  return (data ?? []) as LinkedKpiRow[];
}

// Derive a PatternClusterGraph input from the upstream/downstream fields
// in PatternAugmentation. Upstream entries render as parent_dynamic,
// downstream as downstream_risk · relationship strength is inferred from
// position in the list (first = strongest). Citation count is seeded
// from historical-instances count so visuals stay proportional.
function deriveCluster(aug: PatternAugmentation): ClusterPattern[] {
  const cluster: ClusterPattern[] = [];
  const baseCitations = Math.max(8, aug.historicalInstances.length * 4);
  aug.upstreamPatterns.forEach((p, i) => {
    cluster.push({
      patternId: p.code,
      patternName: p.name,
      relationshipStrength: Math.max(0.4, 0.85 - i * 0.12),
      relationshipType: 'parent_dynamic',
      citationCount: baseCitations - i * 2,
    });
  });
  aug.downstreamPatterns.forEach((p, i) => {
    cluster.push({
      patternId: p.code,
      patternName: p.name,
      relationshipStrength: Math.max(0.3, 0.65 - i * 0.1),
      relationshipType: 'downstream_risk',
      citationCount: baseCitations - i * 2,
    });
  });
  return cluster;
}

// Derive intervention success rates from augmentation.interventions.
// Maps first-three entries to first/second/third degree. Success rate
// parses leading percentage from the "effectiveness" string; n is parsed
// from the pattern "n of m" where present. Falls back to reasonable
// defaults if parsing misses.
function deriveSuccessRates(aug: PatternAugmentation): InterventionSuccessRate[] {
  const degrees: Array<'first' | 'second' | 'third'> = ['first', 'second', 'third'];
  return aug.interventions.slice(0, 3).map((i, idx) => {
    const pctMatch = i.effectiveness.match(/(\d+)\s*%/);
    const nMatch = i.effectiveness.match(/(\d+)\s*of\s*(\d+)/i);
    const successRate = pctMatch ? Number(pctMatch[1]) / 100 : 0.6 - idx * 0.15;
    const observationCount = nMatch ? Number(nMatch[2]) : Math.max(5, 8 - idx * 2);
    return {
      degree: degrees[idx],
      interventionName: i.option,
      successRate,
      observationCount,
    };
  });
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v : v && typeof v === 'object' && 'text' in v ? String((v as { text: unknown }).text) : ''))
      .filter((s) => s.length > 0);
  }
  return [];
}

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ patternKey: string }>;
}) {
  const { patternKey } = await params;
  const activeClient = await getActiveClientRow();
  const row = await loadPatternRow(patternKey, activeClient?.id ?? null);
  const augmentation = getPatternAugmentation(patternKey);
  const manifest = getPatternManifestEntryWithMetrics(patternKey, activeClient?.key ?? null);
  const industryCompositions = getPatternIndustryCompositions(patternKey);
  const linkedKpis = await loadLinkedKpis(row?.linked_kpi_ids ?? null, activeClient?.id ?? null);

  // If neither a DB row nor an augmentation exists, the route is genuinely
  // 404 · patterns without either have nothing to render. The authored
  // manifest is the first fallback so new design-pack slugs never 404 while
  // the DB/vector/graph ingestion catches up.
  if (!row && !augmentation) {
    if (manifest) {
      return (
        <ManifestPatternDetail
          pattern={manifest}
          activeClientName={activeClient?.name ?? null}
          activeClientKey={activeClient?.key ?? null}
        />
      );
    }
    const seedHasPattern = getSeedPlan().programs.some((program) => program.patternSlug === patternKey);
    if (seedHasPattern) return <SeedGlobalPattern patternSlug={patternKey} />;
    notFound();
  }

  const name = augmentation?.patternId === patternKey && !row ? patternKey : row?.name ?? patternKey;
  const shortDescription = augmentation?.oneSentenceProblem ?? row?.short_description ?? null;
  const longDescription = row?.long_description ?? null;

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
        {/* Header · ordinal + tags + problem statement */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {augmentation?.ordinalRef ? (
              <EyebrowLabel tone="teal" size="sm">
                {augmentation.ordinalRef} · {augmentation.maturity.toUpperCase()}
              </EyebrowLabel>
            ) : (
              row?.version ? (
                <EyebrowLabel tone="teal" size="sm">{row.version.toUpperCase()}</EyebrowLabel>
              ) : null
            )}
            {augmentation ? (
              <EyebrowLabel tone="muted" size="xs">
                {augmentation.sectorTag} · {augmentation.functionTag} · {augmentation.objectiveTag}
              </EyebrowLabel>
            ) : row?.sector_applicability?.length ? (
              <EyebrowLabel tone="muted" size="xs">
                {row.sector_applicability.join(' · ').toUpperCase()}
              </EyebrowLabel>
            ) : null}
          </div>
          <PageTitle size="display">{name}</PageTitle>
          {shortDescription ? (
            <Body size="lg" tone="secondary" style={{ maxWidth: 820, marginTop: 6 }}>
              {shortDescription}
            </Body>
          ) : null}
          <div style={{ marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <EntityLink href="/intelligence/patterns" variant="ghost">
              ← All patterns
            </EntityLink>
            {augmentation ? (
              <MetaLabel>
                {augmentation.maestroRubric.probeFor.length} probe questions · {augmentation.vendorLandscape.length} vendor layers · {augmentation.historicalInstances.length} historical instances
              </MetaLabel>
            ) : null}
          </div>
        </header>

        <PatternObservationDisclaimer />
        <PatternObservationPipeline />

        {industryCompositions.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">INDUSTRY LENSES</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 16 }}>
              Vertical context pages composed against this pattern
            </SectionHeading>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {industryCompositions.map((composition) => (
                <Link
                  key={composition.slug}
                  href={`/intelligence/patterns/${encodeURIComponent(patternKey)}/${encodeURIComponent(composition.verticalKey)}`}
                  style={{
                    display: 'block',
                    padding: '16px 18px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    background: 'rgba(20,184,166,0.08)',
                    border: '0.5px solid rgba(20,184,166,0.26)',
                  }}
                >
                  <EyebrowLabel tone="teal" size="xs" style={{ marginBottom: 8 }}>
                    {composition.verticalLabel.toUpperCase()} · INDUSTRY KNOWLEDGE LAYER
                  </EyebrowLabel>
                  <Body size="md" weight={600} tone="primary" as="div">
                    {composition.title}
                  </Body>
                  <Body size="sm" tone="secondary" as="div" style={{ marginTop: 6 }}>
                    {composition.subtitle}
                  </Body>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Hero impact viz (Fix Spec v4 §2/§3) · renders when we have
            keyed data for this pattern. Quantifies the cost of doing
            nothing · sits above the structured depth content. */}
        {getPatternImpactData(patternKey) ? (
          <PatternImpactViz patternKey={patternKey} />
        ) : null}

        {/* Section 2 · The failure mode */}
        {augmentation?.failureMode.length || longDescription ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">THE FAILURE MODE</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              What it looks like when this pattern is active
            </SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
              {augmentation?.failureMode.length
                ? augmentation.failureMode.map((para, i) => (
                    <Body key={i} size="md" tone="primary">{para}</Body>
                  ))
                : longDescription
                  ? <Body size="md" tone="primary">{longDescription}</Body>
                  : null}
            </div>
          </section>
        ) : null}

        {/* Section 3 · Typical triggers */}
        {augmentation?.richTriggers.length || row?.trigger_symptoms?.length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">TYPICAL TRIGGERS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Signals that bring this pattern onto the board agenda
            </SectionHeading>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
              {(augmentation?.richTriggers ?? row?.trigger_symptoms ?? []).map((trigger, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: COLORS.teal, marginTop: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>▸</span>
                  <Body size="md" tone="primary">{trigger}</Body>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Section 4 · Telemetry signature */}
        {augmentation?.telemetrySignals.length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">TELEMETRY SIGNATURE</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              What the data tells you when this pattern is active
            </SectionHeading>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: 1100 }}>
              {augmentation.telemetrySignals.map((t, i) => (
                <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <Body size="md" weight={500} tone="primary">{t.signal}</Body>
                  <MetaLabel style={{ marginTop: 6 }}>Source · {t.source}</MetaLabel>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Section 5 · Vendor and capability landscape · the magic section */}
        {augmentation?.vendorLandscape.length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">VENDOR + CAPABILITY LANDSCAPE · 2026</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 18 }}>
              Named tools, grouped by architectural layer, with an opinion on each.
            </SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100 }}>
              {augmentation.vendorLandscape.map((group) => (
                <VendorLayerCard key={group.layer} group={group} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section 6 · Diagnostic questions */}
        {row?.diagnostic_questions?.length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">DIAGNOSTIC QUESTIONS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              What a Maestro asks to confirm the pattern
            </SectionHeading>
            <ol style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
              {row.diagnostic_questions.map((q, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: COLORS.teal, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minWidth: 18 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Body size="md" tone="primary">{q}</Body>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Section 7 · Contradictions */}
        {augmentation?.keyContradictions.length || stringList(row?.common_adjacent_contradictions).length ? (
          <section>
            <EyebrowLabel tone="amber" size="sm">COMMON CONTRADICTIONS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Tensions this pattern surfaces inside the enterprise
            </SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
              {(augmentation?.keyContradictions ?? stringList(row?.common_adjacent_contradictions)).map((c, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.06)', borderLeft: `2px solid ${COLORS.amber}`, borderRadius: 4 }}>
                  <Body size="md" tone="primary">{c}</Body>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Section 8 · Historical instances */}
        {augmentation?.historicalInstances.length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">HISTORICAL INSTANCES · ANONYMISED</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 6 }}>
              Pattern has been observed at depth
            </SectionHeading>
            <Body size="md" tone="secondary" style={{ marginBottom: 18, maxWidth: 820 }}>
              {augmentation.historicalSummary}
            </Body>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', maxWidth: 1100 }}>
              {augmentation.historicalInstances.map((inst, i) => {
                const toneColor = inst.outcome === 'resolved' ? COLORS.teal
                  : inst.outcome === 'partial' ? COLORS.amber
                  : COLORS.red;
                return (
                  <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <EyebrowLabel tone="muted" size="xs" style={{ color: toneColor, opacity: 0.85 }}>
                      {inst.outcome.toUpperCase()} · {inst.sector.toUpperCase()}
                    </EyebrowLabel>
                    <Body size="md" weight={500} tone="primary">{inst.anonymousLabel}</Body>
                    <MetaLabel>{inst.scale}</MetaLabel>
                    <Body size="sm" tone="secondary" style={{ marginTop: 4 }}>{inst.summary}</Body>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Section 9 · Intervention menu with effectiveness */}
        {augmentation?.interventions.length || stringList(row?.intervention_options).length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">INTERVENTION MENU</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Options with effectiveness · time horizon · resource requirement
            </SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1100 }}>
              {(augmentation?.interventions ?? []).map((i, idx) => (
                <div key={idx} style={{ padding: 18, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <Body size="md" weight={600} tone="primary">{i.option}</Body>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
                    <InterventionMetric label="Effectiveness" value={i.effectiveness} />
                    <InterventionMetric label="Time horizon" value={i.timeHorizon} />
                    <InterventionMetric label="Resource requirement" value={i.resourceRequirement} />
                  </div>
                  {i.caveats ? (
                    <Body size="sm" tone="muted" style={{ marginTop: 10, fontStyle: 'italic' }}>
                      Caveat · {i.caveats}
                    </Body>
                  ) : null}
                </div>
              ))}
              {!augmentation && stringList(row?.intervention_options).length ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stringList(row?.intervention_options).map((opt, i) => (
                    <li key={i}><Body size="md" tone="primary">{opt}</Body></li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Section 10 · Failure modes */}
        {stringList(row?.common_failure_modes).length ? (
          <section>
            <EyebrowLabel tone="amber" size="sm">KNOWN FAILURE MODES</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              How resolution goes wrong
            </SectionHeading>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
              {stringList(row?.common_failure_modes).map((fm, i) => (
                <li key={i}><Body size="md" tone="primary">{fm}</Body></li>
              ))}
            </ul>
          </section>
        ) : null}

        {linkedKpis.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">LINKED KPIS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Metrics this pattern tends to move or expose
            </SectionHeading>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', maxWidth: 1100 }}>
              {linkedKpis.map((kpi) => (
                <div key={kpi.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <EntityLink href={`/intelligence/kpis/${encodeURIComponent(kpi.id)}`} variant="inline">
                    {kpi.name}
                  </EntityLink>
                  {kpi.category ? <MetaLabel style={{ display: 'block', marginTop: 6 }}>{kpi.category}</MetaLabel> : null}
                  {kpi.current_value !== null ? (
                    <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>
                      Current · {Number.isInteger(kpi.current_value) ? String(kpi.current_value) : kpi.current_value.toFixed(2).replace(/\.?0+$/, '')}{kpi.current_unit ?? ''}
                    </Body>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Section 11 · Evidence base */}
        {augmentation?.evidenceBase.length || row?.evidence_summary ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">EVIDENCE BASE</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Research + frameworks this pattern stands on
            </SectionHeading>
            {row?.evidence_summary ? (
              <Body size="md" tone="secondary" style={{ marginBottom: 16, maxWidth: 820 }}>
                {row.evidence_summary}
              </Body>
            ) : null}
            {augmentation?.evidenceBase.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 1100 }}>
                {augmentation.evidenceBase.map((e, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    <Body size="md" weight={500} tone="primary">{e.title}</Body>
                    <MetaLabel style={{ marginTop: 4 }}>{e.author} · {e.year} · {e.citation}</MetaLabel>
                    <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>{e.relevance}</Body>
                  </div>
                ))}
              </div>
            ) : null}
            {augmentation?.frameworksExtended.length ? (
              <div style={{ marginTop: 16, maxWidth: 820 }}>
                <MetaLabel style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(245,245,240,0.55)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                  FRAMEWORKS EXTENDED
                </MetaLabel>
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {augmentation.frameworksExtended.map((f, i) => (
                    <li key={i}><Body size="sm" tone="secondary">· {f}</Body></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Section · Practitioner landscape (parallel to topics) */}
        {augmentation?.practitioners.length ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">PRACTITIONER LANDSCAPE</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Named people doing serious work in this area
            </SectionHeading>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', maxWidth: 1100 }}>
              {augmentation.practitioners.map((p, i) => (
                <div key={i} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <Body size="md" weight={500} tone="primary">{p.name}</Body>
                  <MetaLabel style={{ marginTop: 4 }}>{p.affiliation}</MetaLabel>
                  <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>{p.whyRelevant}</Body>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Cluster graph + success-rate bars · Fix Spec v4 §8 + §9. Render
            when the pattern has augmentation content · both components
            synth their data from the augmentation so adding a new pattern
            to pattern-augmentations.ts automatically lights these up. */}
        {augmentation ? (
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))' }}>
            <PatternClusterGraph
              centerPatternId={augmentation.ordinalRef}
              centerPatternName={name}
              cluster={deriveCluster(augmentation)}
            />
            <GenomeSuccessRateBars
              interventions={deriveSuccessRates(augmentation)}
              totalObservations={augmentation.historicalInstances.length * 7}
              familyDescription={`${augmentation.sectorTag.toLowerCase()} pattern family`}
            />
          </div>
        ) : null}

        {/* Section 12 · Related patterns + topics */}
        {(augmentation?.upstreamPatterns.length || augmentation?.downstreamPatterns.length || augmentation?.relatedTopics.length) ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">RELATED</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Upstream patterns, downstream patterns, and adjacent topics
            </SectionHeading>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', maxWidth: 1100 }}>
              {augmentation?.upstreamPatterns.length ? (
                <RelatedGroup title="Upstream patterns" items={augmentation.upstreamPatterns.map((p) => ({ label: `${p.code} · ${p.name}`, href: `/intelligence/patterns/${encodeURIComponent(p.code.toLowerCase())}` }))} />
              ) : null}
              {augmentation?.downstreamPatterns.length ? (
                <RelatedGroup title="Downstream patterns" items={augmentation.downstreamPatterns.map((p) => ({ label: `${p.code} · ${p.name}`, href: `/intelligence/patterns/${encodeURIComponent(p.code.toLowerCase())}` }))} />
              ) : null}
              {augmentation?.relatedTopics.length ? (
                <RelatedGroup title="Topics" items={augmentation.relatedTopics.map((t) => ({ label: t.title, href: `/intelligence/topics/${encodeURIComponent(t.key)}` }))} />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Section 13 · Maestro rubric */}
        {augmentation?.maestroRubric ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">MAESTRO PROBE RUBRIC · ABARVA IP</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 18 }}>
              What a Maestro probes for when this pattern is suspected
            </SectionHeading>
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', maxWidth: 1200 }}>
              <RubricColumn title="PROBE FOR" items={augmentation.maestroRubric.probeFor} tone="teal" />
              <RubricColumn title="CONVERSATION STARTERS" items={augmentation.maestroRubric.conversationStarters} tone="teal" />
              <RubricColumn title="RED FLAGS" items={augmentation.maestroRubric.redFlags} tone="amber" />
              <RubricColumn title="RESOLVING SIGNALS" items={augmentation.maestroRubric.resolvingSignals} tone="teal" />
            </div>
          </section>
        ) : null}

        <footer style={{ paddingTop: 8 }}>
          <MetaLabel>
            {COMPOSITE_DISCLAIMER} Demo rendering: pattern content is generated from authored design-pack source and must be sponsor-validated before production use.
          </MetaLabel>
        </footer>
      </div>
    </PageShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function PatternObservationDisclaimer() {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 12,
        border: '0.5px solid rgba(245, 199, 74, 0.48)',
        background: 'linear-gradient(135deg, rgba(245, 199, 74, 0.12), rgba(245, 158, 11, 0.06))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <EyebrowLabel tone="amber" size="xs">OBSERVATION AUTHORSHIP</EyebrowLabel>
      <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>
        {PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER}
      </Body>
    </section>
  );
}

function PatternObservationPipeline() {
  return (
    <section
      style={{
        padding: 18,
        borderRadius: 12,
        border: '0.5px solid rgba(20, 184, 166, 0.24)',
        background: 'rgba(20, 184, 166, 0.05)',
      }}
    >
      <EyebrowLabel tone="teal" size="xs">OBSERVATIONS PIPELINE</EyebrowLabel>
      <SectionHeading size="sm" style={{ marginTop: 8, marginBottom: 10 }}>
        How completed Phase 5 work compounds back into this pattern
      </SectionHeading>
      <Body size="sm" tone="secondary">
        This pattern receives observations from completed Phase 5 programs. When Morrison reaches Phase 5 outcome attestation, observations will be anonymized, composite-tagged, and contributed back to this pattern.
      </Body>
      <div
        style={{
          marginTop: 12,
          display: 'inline-flex',
          gap: 10,
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: 999,
          border: '0.5px solid rgba(20, 184, 166, 0.18)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <MetaLabel style={{ color: COLORS.teal }}>ZERO STATE</MetaLabel>
        <Body size="sm" tone="primary">0 observations contributed to date. Pipeline schema ready.</Body>
      </div>
    </section>
  );
}

function VendorLayerCard({ group }: { group: VendorGroup }) {
  return (
    <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <EyebrowLabel tone="muted" size="xs">{group.layer.toUpperCase()}</EyebrowLabel>
        <SectionHeading size="sm" style={{ marginTop: 4 }}>{group.title}</SectionHeading>
      </div>
      <Body size="md" tone="secondary" style={{ fontStyle: 'italic', borderLeft: `2px solid ${COLORS.teal}`, paddingLeft: 12 }}>
        {group.pointOfView}
      </Body>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {group.vendors.map((v, i) => (
          <div key={i} style={{ padding: '12px 14px', background: 'rgba(20,184,166,0.04)', border: '0.5px solid rgba(20,184,166,0.14)', borderRadius: 8 }}>
            <Body size="md" weight={600} tone="primary">{v.name}</Body>
            <MetaLabel style={{ marginTop: 4 }}>{v.descriptor}</MetaLabel>
            {v.opinion ? (
              <Body size="sm" tone="secondary" style={{ marginTop: 6, fontStyle: 'italic' }}>
                {v.opinion}
              </Body>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function InterventionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 140 }}>
      <MetaLabel style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(245,245,240,0.55)' }}>
        {label}
      </MetaLabel>
      <Body size="sm" tone="primary" style={{ marginTop: 2 }}>{value}</Body>
    </div>
  );
}

function RelatedGroup({ title, items }: { title: string; items: Array<{ label: string; href: string }> }) {
  return (
    <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
      <EyebrowLabel tone="muted" size="xs" style={{ marginBottom: 10 }}>{title.toUpperCase()}</EyebrowLabel>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <li key={i}>
            <EntityLink href={item.href} variant="inline">{item.label}</EntityLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ManifestPatternDetail({
  pattern,
  activeClientName,
  activeClientKey,
}: {
  pattern: PatternManifestEntry;
  activeClientName: string | null;
  activeClientKey: string | null;
}) {
  const sectionPreview = pattern.sections.slice(0, 8);
  const applicablePrograms = getPatternApplicablePrograms(pattern.slug);
  const evidenceSources = getPatternBrowsableEvidence(pattern.slug, activeClientKey).slice(0, 8);
  const traceableDeliverables = applicablePrograms
    .flatMap((program) => program.deliverables
      .filter((deliverable) => deliverable.renderTier !== 'stub')
      .map((deliverable) => ({ ...deliverable, program })))
    .sort((a, b) => Number(b.renderTier === 'rich') - Number(a.renderTier === 'rich') || a.code.localeCompare(b.code))
    .slice(0, 10);
  const stats = [
    ['Confidence floor', pattern.confidenceFloor === null ? '—' : `${Math.round(pattern.confidenceFloor * 100)}%`],
    ['Evidence sources', String(pattern.evidenceCount)],
    ['Observations', String(pattern.observationCount || pattern.nObservationsFloor || pattern.observations.length)],
    ['Last updated', formatFreshness(pattern.lastUpdatedAt)],
  ];

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <header style={{ display: 'grid', gap: 22, gridTemplateColumns: 'minmax(0, 1.2fr) minmax(300px, 0.8fr)', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <EyebrowLabel tone={pattern.demoCritical ? 'amber' : 'teal'} size="sm">
                {pattern.demoCritical ? 'DEMO CRITICAL' : 'AUTHORING PACK'}
              </EyebrowLabel>
              {pattern.category ? <EyebrowLabel tone="muted" size="xs">{pattern.category}</EyebrowLabel> : null}
            </div>
            <PageTitle size="display">{pattern.name}</PageTitle>
            {pattern.shortDescription ? (
              <Body size="lg" tone="secondary" style={{ maxWidth: 860, marginTop: 12 }}>
                {pattern.shortDescription}
              </Body>
            ) : null}
            <div style={{ marginTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <EntityLink href="/intelligence/library?category=pattern" variant="ghost">
                ← Pattern library
              </EntityLink>
              <MetaLabel>
                {activeClientName ? `${activeClientName} scoped · ` : ''}Composite pattern · {pattern.sourceFile}
              </MetaLabel>
            </div>
          </div>
          <aside style={{ padding: 18, borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}>
            <EyebrowLabel tone="teal" size="sm">PATTERN READINESS</EyebrowLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
              {stats.map(([label, value]) => (
                <div key={label} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <MetaLabel>{label}</MetaLabel>
                  <Body size="lg" weight={700} tone="primary" style={{ marginTop: 4 }}>{value}</Body>
                </div>
              ))}
            </div>
            <Body size="sm" tone="secondary" style={{ marginTop: 14 }}>
              Manifest fallback is active with source freshness, evidence count, and program backlinks preserved for demo integrity.
            </Body>
          </aside>
        </header>

        <PatternObservationDisclaimer />
        <PatternObservationPipeline />

        {pattern.longDescription ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">PATTERN THESIS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Why this matters
            </SectionHeading>
            <Body size="md" tone="primary" style={{ maxWidth: 980 }}>
              {pattern.longDescription}
            </Body>
          </section>
        ) : null}

        <section>
          <EyebrowLabel tone="teal" size="sm">APPLICABLE PROGRAMS</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            Programs currently applying this pattern
          </SectionHeading>
          {applicablePrograms.length > 0 ? (
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {applicablePrograms.map((program) => (
                <Link
                  key={`${program.tenantKey}-${program.code}`}
                  href={program.routePath}
                  style={{
                    display: 'block',
                    padding: 16,
                    borderRadius: 12,
                    textDecoration: 'none',
                    background: 'rgba(20,184,166,0.06)',
                    border: '0.5px solid rgba(20,184,166,0.22)',
                  }}
                >
                  <EyebrowLabel tone="teal" size="xs" style={{ marginBottom: 8 }}>
                    {program.clientDisplayName.toUpperCase()} · PHASE {program.currentPhaseSpec} · {program.status.toUpperCase()}
                  </EyebrowLabel>
                  <Body size="md" weight={700} tone="primary" as="div">{program.name}</Body>
                  <Body size="sm" tone="secondary" as="div" style={{ marginTop: 8 }}>
                    {program.deliverables.length} deliverables · {program.roleInDemo}
                  </Body>
                </Link>
              ))}
            </div>
          ) : (
            <Body size="sm" tone="muted">No seeded program currently applies this pattern.</Body>
          )}
        </section>

        {evidenceSources.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">BROWSABLE EVIDENCE</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Observable sources behind the evidence count
            </SectionHeading>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {evidenceSources.map((source) => (
                <Link
                  key={source.href}
                  href={source.href}
                  style={{
                    display: 'block',
                    padding: 16,
                    borderRadius: 12,
                    textDecoration: 'none',
                    background: 'rgba(20,184,166,0.04)',
                    border: '0.5px solid rgba(20,184,166,0.18)',
                  }}
                >
                  <EyebrowLabel tone="teal" size="xs" style={{ marginBottom: 8 }}>
                    {source.programCode} · {source.id} · {(source.confidence ?? 'unlabeled').toUpperCase()}
                  </EyebrowLabel>
                  <Body size="md" weight={700} tone="primary" as="div">{source.label}</Body>
                  <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>
                    {source.reference}
                  </Body>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {traceableDeliverables.length > 0 ? (
          <section>
            <EyebrowLabel tone="amber" size="sm">TRACEABLE DELIVERABLES</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Source-pattern links that resolve back to this page
            </SectionHeading>
            <div style={{ display: 'grid', gap: 10 }}>
              {traceableDeliverables.map((deliverable) => (
                <Link
                  key={`${deliverable.program.code}-${deliverable.code}`}
                  href={deliverable.routePath}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px minmax(0, 1fr) 130px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.025)',
                    border: '0.5px solid rgba(255,255,255,0.09)',
                  }}
                >
                  <MetaLabel>{deliverable.program.code} · {deliverable.code}</MetaLabel>
                  <Body size="sm" weight={600} tone="primary" as="div">{deliverable.title}</Body>
                  <MetaLabel>{deliverable.renderTier} · P{deliverable.phaseSpec}</MetaLabel>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {pattern.observations.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">COMPOSITE OBSERVATIONS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Evidence-backed observations in the authored pattern pack
            </SectionHeading>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {pattern.observations.slice(0, 6).map((observation, index) => (
                <div key={`${observation}-${index}`} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <MetaLabel>Obs {index + 1}</MetaLabel>
                    <span style={{ border: '0.5px solid rgba(20,184,166,0.35)', color: COLORS.teal, borderRadius: 999, padding: '3px 8px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em' }}>
                      COMPOSITE
                    </span>
                  </div>
                  <Body size="sm" tone="primary">{observation}</Body>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <ManifestList title="Trigger symptoms" tone="teal" items={pattern.triggerSymptoms} empty="Triggers are scheduled for enrichment." />
          <ManifestList title="Detection signals" tone="teal" items={pattern.detectionSignals} empty="Signals are scheduled for enrichment." />
          <ManifestList title="Diagnostic questions" tone="amber" items={pattern.diagnosticQuestions} empty="Diagnostics are scheduled for enrichment." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          <ManifestList title="Evidence requirements" tone="teal" items={pattern.evidenceRequirements} empty="Evidence requirements are scheduled for enrichment." />
          <ManifestList title="Intervention menu" tone="amber" items={pattern.interventions} empty="Interventions are scheduled for enrichment." />
        </div>

        {pattern.relatedPatternIds.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">RELATED PATTERNS</EyebrowLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
              {pattern.relatedPatternIds.map((id) => (
                <EntityLink key={id} href={patternRouteFor(id)} variant="ghost">
                  {id.replace(/^pattern_/, '').replace(/_/g, ' ')}
                </EntityLink>
              ))}
            </div>
          </section>
        ) : null}

        {sectionPreview.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">AUTHORING DEPTH</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 16 }}>
              Parsed sections from the design pack
            </SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sectionPreview.map((section) => (
                <details key={section.id} style={{ border: '0.5px solid rgba(255,255,255,0.10)', borderRadius: 12, background: 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
                  <summary style={{ cursor: 'pointer', padding: '14px 16px' }}>
                    <Body size="md" weight={700} tone="primary" as="span">{section.title}</Body>
                  </summary>
                  <Body size="sm" tone="secondary" style={{ padding: '0 16px 16px', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                    {section.body}
                  </Body>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <footer style={{ paddingTop: 8 }}>
          <MetaLabel>
            {COMPOSITE_DISCLAIMER} Demo rendering: pattern content is generated from authored design-pack source and must be sponsor-validated before production use. Pattern route rendered from content hash {pattern.contentHash}; no localhost links.
          </MetaLabel>
        </footer>
      </div>
    </PageShell>
  );
}

function formatFreshness(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const now = Date.now();
  const deltaDays = Math.max(0, Math.round((now - date.getTime()) / 86_400_000));
  if (deltaDays === 0) return 'today';
  if (deltaDays === 1) return '1d ago';
  if (deltaDays < 30) return `${deltaDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ManifestList({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: 'teal' | 'amber';
  items: string[];
  empty: string;
}) {
  const borderColor = tone === 'amber' ? COLORS.amber : COLORS.teal;
  return (
    <section style={{ padding: 16, borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.025)', borderTop: `2px solid ${borderColor}` }}>
      <EyebrowLabel tone={tone} size="sm">{title}</EyebrowLabel>
      {items.length === 0 ? (
        <Body size="sm" tone="muted" style={{ marginTop: 10 }}>{empty}</Body>
      ) : (
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {items.slice(0, 8).map((item, index) => (
            <li key={`${item}-${index}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: borderColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, marginTop: 5 }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <Body size="sm" tone="primary">{item}</Body>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RubricColumn({ title, items, tone }: { title: string; items: string[]; tone: 'teal' | 'amber' }) {
  const borderColor = tone === 'amber' ? COLORS.amber : COLORS.teal;
  return (
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: `0.5px solid rgba(255,255,255,0.08)`, borderRadius: 10, borderTop: `2px solid ${borderColor}` }}>
      <EyebrowLabel tone={tone} size="sm" style={{ marginBottom: 12 }}>{title}</EyebrowLabel>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <li key={i}>
            <Body size="sm" tone="primary" style={{ lineHeight: 1.55 }}>
              {item.startsWith('"') ? <em>{item}</em> : item}
            </Body>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ patternKey: string }> }) {
  const { patternKey } = await params;
  const augmentation = getPatternAugmentation(patternKey);
  const manifest = getPatternManifestEntry(patternKey);
  return {
    title: augmentation ? `${augmentation.ordinalRef} · Pattern` : manifest ? `${manifest.name} · Pattern` : 'Pattern',
    description: augmentation?.oneSentenceProblem ?? manifest?.shortDescription ?? undefined,
  };
}
