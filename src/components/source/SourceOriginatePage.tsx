'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { ResizableSplitter } from '@/components/source/canvas/ResizableSplitter';
import { SourceOnboardingTour } from '@/components/source/onboarding/SourceOnboardingTour';
import { SHELL } from '@/lib/shell/shell-tokens';

type IntakeFieldId = 'trigger' | 'decisionOwner' | 'scopeBoundary' | 'valueTarget' | 'baselineOwner';
type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

interface IntakeFieldDefinition {
  id: IntakeFieldId;
  label: string;
  prompt: string;
  placeholder: string;
  agent: 'Steward' | 'Sentinel' | 'Atlas';
}

type IntakeState = Record<IntakeFieldId, string>;

interface SourceOriginatePageProps {
  clientName?: string;
  clientShortName?: string;
  clientKey?: string;
}

const INTAKE_FIELDS: IntakeFieldDefinition[] = [
  {
    id: 'trigger',
    label: 'Why now / trigger',
    prompt: 'What event makes this sourcing work necessary now?',
    placeholder: 'Renewal date, spend pressure, service issue, merger, cloud-cost spike...',
    agent: 'Sentinel',
  },
  {
    id: 'decisionOwner',
    label: 'Decision owner',
    prompt: 'Who can make or sponsor the technology sourcing decision?',
    placeholder: 'CIO, CTO, VP Infrastructure, app owner, procurement sponsor...',
    agent: 'Steward',
  },
  {
    id: 'scopeBoundary',
    label: 'Scope boundary',
    prompt: 'Which IT services, platforms, software, cloud, data, or delivery towers are in and out?',
    placeholder: 'In: AMS for SAP and eCommerce. Out: security operations and deskside support.',
    agent: 'Sentinel',
  },
  {
    id: 'valueTarget',
    label: 'Value or savings target',
    prompt: 'What commercial outcome justifies standing up the event?',
    placeholder: '$4M run-rate savings, 15% unit-cost reduction, risk reduction, SLA uplift...',
    agent: 'Atlas',
  },
  {
    id: 'baselineOwner',
    label: 'Minimum data / baseline owner',
    prompt: 'Who owns the minimum baseline Source can use without pretending evidence is ready?',
    placeholder: 'Finance owns spend baseline; ServiceNow owner owns ticket volume extract by May 8.',
    agent: 'Sentinel',
  },
];

// ─── T02 — Category definitions ───────────────────────────────────────────────

type CategoryEventType = 'managed_service' | 'infrastructure' | 'software' | 'consulting' | 'staffing' | 'other';

interface SourceCategory {
  id: string;
  label: string;
  description: string;
  artifactPack: string[];
  inferredEventType: CategoryEventType;
}

const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    id: 'ams',
    label: 'Application Managed Services',
    description: 'End-to-end AMS for enterprise applications — SAP, eCommerce, ERP, custom platforms.',
    artifactPack: ['RFP package', 'Scorecard matrix', 'TCO model', 'Transition plan', 'BAFO brief'],
    inferredEventType: 'managed_service',
  },
  {
    id: 'cloud_infra',
    label: 'Cloud & Infrastructure',
    description: 'Cloud operations, hosting, network, platform, and infrastructure management services.',
    artifactPack: ['Cloud assessment', 'Cost comparison', 'Migration plan', 'Vendor brief'],
    inferredEventType: 'infrastructure',
  },
  {
    id: 'data_analytics',
    label: 'Data, Analytics & AI',
    description: 'Data platforms, analytics pipelines, AI/ML services, and BI tooling.',
    artifactPack: ['Platform evaluation', 'Vendor maturity', 'TCO model', 'Architecture review'],
    inferredEventType: 'other',
  },
  {
    id: 'enterprise_software',
    label: 'Enterprise Software',
    description: 'SaaS, license optimization, enterprise application selection and renegotiation.',
    artifactPack: ['License audit', 'Vendor comparison', 'Negotiation brief'],
    inferredEventType: 'software',
  },
  {
    id: 'custom',
    label: 'Custom / Multi-tower',
    description: 'Bespoke or cross-category events. Artifact pack built during strategy phase.',
    artifactPack: ['Scope specification', 'Custom artifact pack (strategy-derived)'],
    inferredEventType: 'other',
  },
];

function CategoryCard({
  category,
  selected,
  onSelect,
}: {
  category: SourceCategory;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 11px 9px',
        background: selected ? SHELL.INK : SHELL.CARD_WHITE,
        border: `1.5px solid ${selected ? SHELL.INK : SHELL.CARD_LINE}`,
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
      }}
      aria-pressed={selected}
    >
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 700, color: selected ? SHELL.CARD_WHITE : SHELL.INK, lineHeight: 1.3 }}>
        {category.label}
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 10.5, lineHeight: 1.45, color: selected ? 'rgba(255,255,255,0.65)' : SHELL.INK_MUTED }}>
        {category.description}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
        {category.artifactPack.map((artifact) => (
          <span
            key={artifact}
            style={{
              fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.05em',
              borderRadius: 3, padding: '2px 4px',
              background: selected ? 'rgba(255,255,255,0.14)' : SHELL.PAPER_SOFT,
              border: `1px solid ${selected ? 'rgba(255,255,255,0.22)' : SHELL.CARD_LINE}`,
              color: selected ? 'rgba(255,255,255,0.8)' : SHELL.INK_MUTED,
              whiteSpace: 'nowrap',
            }}
          >
            {artifact}
          </span>
        ))}
      </div>
    </button>
  );
}

function GuidanceCard({ agent, label, body }: { agent: string; label: string; body: string }) {
  return (
    <div style={{ border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, background: SHELL.CARD_WHITE, padding: '9px 11px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK, letterSpacing: '0.08em', fontWeight: 700 }}>{agent}</span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>{label}</span>
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 11.5, lineHeight: 1.45, color: SHELL.INK_SOFT }}>{body}</div>
    </div>
  );
}

const AGENT_GUIDANCE = [
  { agent: 'Sentinel', label: 'Sourcing lead', body: 'Use tenant context to frame the event, then ask only for trigger, owner, boundary, value basis, and baseline owner.' },
  { agent: 'Steward', label: 'Intake floor', body: 'Do not stand up the event until trigger, owner, scope, value basis, and baseline owner are named.' },
  { agent: 'Sentinel', label: 'Evidence caution', body: 'Loaded or promised data is not usable evidence yet; name the baseline owner and confidence limits.' },
];

const initialIntakeState: IntakeState = { trigger: '', decisionOwner: '', scopeBoundary: '', valueTarget: '', baselineOwner: '' };

// B6 — autosave intake to localStorage so closing the tab doesn't lose
// work. Per-tenant key so two clients drafting events on the same
// browser don't collide.
const AUTOSAVE_KEY_PREFIX = 'abarva.source.originate.intake';
function autosaveKey(clientKey: string): string {
  return `${AUTOSAVE_KEY_PREFIX}.${clientKey}`;
}

interface AutosavedDraft {
  intake: IntakeState;
  categoryId: string | null;
  savedAt: string;
}

function readAutosavedDraft(clientKey: string): AutosavedDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(autosaveKey(clientKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AutosavedDraft>;
    if (!parsed.intake) return null;
    // Validate shape — every key must be a string.
    const safe: IntakeState = { ...initialIntakeState };
    for (const key of Object.keys(initialIntakeState) as IntakeFieldId[]) {
      const value = parsed.intake[key];
      if (typeof value === 'string') safe[key] = value;
    }
    return {
      intake: safe,
      categoryId: typeof parsed.categoryId === 'string' ? parsed.categoryId : null,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    };
  } catch {
    return null;
  }
}

function clearAutosavedDraft(clientKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(autosaveKey(clientKey));
  } catch {
    /* swallow — incognito + no quota */
  }
}

function isIntakeDirty(state: IntakeState): boolean {
  return Object.values(state).some((v) => v.trim().length > 0);
}

function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 'just now';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function inferEventType(scopeBoundary: string, selectedCategory?: SourceCategory | null): CategoryEventType {
  if (selectedCategory) return selectedCategory.inferredEventType;
  const normalized = scopeBoundary.toLowerCase();
  if (/\bams\b|managed service|managed services|outsourcing|run operation|application support/.test(normalized)) return 'managed_service';
  if (/cloud|infrastructure|hosting|network|platform operations/.test(normalized)) return 'infrastructure';
  if (/software|saas|license|enterprise application/.test(normalized)) return 'software';
  if (/systems integrator|implementation|consulting|si partner/.test(normalized)) return 'consulting';
  if (/staff augmentation|staffing|contractor|contingent/.test(normalized)) return 'staffing';
  return 'other';
}

function extractEstimatedValue(valueTarget: string): number | undefined {
  const normalized = valueTarget.toLowerCase().replace(/,/g, '');
  const match = normalized.match(/\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  if (!match) return undefined;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw)) return undefined;
  const suffix = match[2];
  if (suffix === 'm' || suffix === 'million') return Math.round(raw * 1_000_000);
  if (suffix === 'k' || suffix === 'thousand') return Math.round(raw * 1_000);
  return Math.round(raw);
}

function buildEventName(clientShortName: string, intake: IntakeState, selectedCategory?: SourceCategory | null): string {
  if (selectedCategory) return `${clientShortName} ${selectedCategory.label} Sourcing Event`.slice(0, 120);
  const scope = intake.scopeBoundary.trim();
  if (/\bams\b|managed service|outsourcing/i.test(scope)) return `${clientShortName} AMS Sourcing Event`;
  if (/prior.?authorization|prior auth/i.test(scope)) return `${clientShortName} Prior Authorization Automation Sourcing`;
  if (/fraud/i.test(scope)) return `${clientShortName} Fraud Detection AI Sourcing`;
  const firstClause = scope.split(/[.;\n]/)[0]?.trim();
  if (firstClause) return `${clientShortName} ${firstClause} Sourcing Event`.slice(0, 120);
  const triggerClause = intake.trigger.split(/[.;\n]/)[0]?.trim();
  return `${clientShortName} ${triggerClause || 'Technology'} Sourcing Event`.slice(0, 120);
}

const SENTINEL_INTAKE_AGENT = { initials: 'Se', name: 'Sentinel', role: 'Source Orchestrator' } as const;

export function SourceOriginatePage({
  clientName = 'Apex Retail Group',
  clientShortName = 'Apex Retail',
  clientKey = 'apexretail',
}: SourceOriginatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourActive = searchParams?.get('tour') === '1';
  // Hydrate intake + category from localStorage if a draft exists for
  // this tenant. Lazy initializer keeps SSR safe — typeof window check
  // inside the helper.
  const [intake, setIntake] = useState<IntakeState>(() => {
    const draft = readAutosavedDraft(clientKey);
    return draft?.intake ?? initialIntakeState;
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    const draft = readAutosavedDraft(clientKey);
    return draft?.categoryId ?? null;
  });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });
  const [restoredAt, setRestoredAt] = useState<string | null>(() => {
    const draft = readAutosavedDraft(clientKey);
    return draft && isIntakeDirty(draft.intake) ? draft.savedAt || 'unknown' : null;
  });

  // Persist intake + category on every change so a tab close doesn't
  // lose progress. Only writes when there's actually content to save —
  // we don't want to overwrite a real draft with an empty default.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isIntakeDirty(intake) && !selectedCategoryId) {
      // Nothing to save — clear any stale draft so an empty form
      // doesn't pretend to have one on next mount.
      clearAutosavedDraft(clientKey);
      return;
    }
    try {
      const payload: AutosavedDraft = {
        intake,
        categoryId: selectedCategoryId,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(autosaveKey(clientKey), JSON.stringify(payload));
    } catch {
      /* swallow */
    }
  }, [clientKey, intake, selectedCategoryId]);

  const selectedCategory = SOURCE_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;
  const completedCount = useMemo(
    () => INTAKE_FIELDS.filter((field) => intake[field.id].trim().length > 0).length,
    [intake]
  );
  const canCreate = intake.trigger.trim().length > 0 && submitState.status !== 'submitting';

  function patchIntake(fieldId: IntakeFieldId, value: string) {
    setSubmitState({ status: 'idle' });
    setIntake((current) => ({ ...current, [fieldId]: value }));
  }

  async function createEvent() {
    if (!canCreate) return;
    setSubmitState({ status: 'submitting' });

    const eventName = buildEventName(clientShortName, intake, selectedCategory);
    const response = await fetch('/api/v1/source/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventType: inferEventType(intake.scopeBoundary, selectedCategory),
        triggerDescription: intake.trigger,
        decisionOwner: intake.decisionOwner || undefined,
        scopeDescription: [
          intake.scopeBoundary && `Scope boundary: ${intake.scopeBoundary}`,
          intake.valueTarget && `Value basis: ${intake.valueTarget}`,
          intake.baselineOwner && `Baseline owner: ${intake.baselineOwner}`,
          selectedCategory && `Category: ${selectedCategory.label}`,
        ].filter(Boolean).join('\n') || undefined,
        estimatedValueUsd: extractEstimatedValue(intake.valueTarget),
      }),
    });

    const payload = await response.json().catch(() => null) as null | {
      event?: { id?: string };
      eventUrl?: string;
      detail?: string;
      error?: string;
    };

    if (!response.ok || !payload?.event?.id) {
      setSubmitState({ status: 'error', message: payload?.detail ?? payload?.error ?? 'Source event creation failed.' });
      return;
    }

    // Submission succeeded — clear the autosaved draft so the next
    // visit starts clean, and drop the "restored from" hint.
    clearAutosavedDraft(clientKey);
    setRestoredAt(null);
    const eventUrl = payload.eventUrl ?? `/source/events/${payload.event.id}?stage=Strategy`;
    // Forward the tour into the canvas as step 3 if it's active.
    const finalUrl =
      tourActive
        ? eventUrl + (eventUrl.includes('?') ? '&tour=1' : '?tour=1')
        : eventUrl;
    router.push(finalUrl);
  }

  return (
    <AppShell
      surface="source"
      surfaceContext={{ sourceIntakeMode: true, clientKey, clientName, context: 'New IT sourcing event intake — Sentinel guided' }}
      topBarProps={{ tenantName: clientName, showLocked: true, context: 'Source · New sourcing event' }}
      onArtifact={() => undefined}
    >
      <main data-testid="source-originate-canvas" style={MAIN_STYLE}>
        <ResizableSplitter
          defaultLeftPercent={45}
          minLeftPx={340}
          minRightPx={480}
          storageKey="abarva.source.originate.splitter"
          left={
            <div style={CHAT_PANE_STYLE}>
              <AtlasDrawer
                embedded
                isOpen={true}
                onClose={() => undefined}
                agent={SENTINEL_INTAKE_AGENT}
                quote={`Ready to stand up a new IT sourcing event for ${clientName}. Tell me the trigger and I'll help you scope and open the event on the canvas.`}
                surface="/source"
                onArtifact={() => undefined}
                composerPlacement="afterHeader"
              />
            </div>
          }
          right={
            <aside style={INTAKE_PANE_STYLE}>
              <section aria-label="New sourcing event intake" style={INTAKE_PANEL}>
                {/* Context strip */}
              <div style={CONTEXT_STRIP}>
                <span style={STRIP_TOKEN}>{clientName.length > 26 ? clientName.slice(0, 24) + '…' : clientName}</span>
                <span style={STRIP_DOT}>·</span>
                <span style={STRIP_TOKEN}>New sourcing event</span>
                <span style={STRIP_DOT}>·</span>
                <span style={STRIP_TOKEN}>{completedCount} of {INTAKE_FIELDS.length} captured</span>
              </div>

              {/* Header */}
              <div>
                <div style={EYEBROW}>Step 0 · Sentinel</div>
                <h2 style={HEADING}>Sourcing event intake</h2>
                <p style={SUBHEAD}>Trigger is required. Category and remaining fields can be refined via Sentinel after the event opens.</p>
                {restoredAt ? (
                  <div data-testid="source-originate-draft-restored" style={DRAFT_RESTORED_STYLE}>
                    <span>
                      Draft restored from autosave
                      {restoredAt !== 'unknown' ? ` · ${formatRelativeTime(restoredAt)}` : ''}.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearAutosavedDraft(clientKey);
                        setIntake(initialIntakeState);
                        setSelectedCategoryId(null);
                        setRestoredAt(null);
                        setSubmitState({ status: 'idle' });
                      }}
                      data-testid="source-originate-draft-discard"
                      style={DRAFT_DISCARD_STYLE}
                    >
                      Discard draft
                    </button>
                  </div>
                ) : null}
              </div>

              {/* T02 — Category picker */}
              <div style={{ display: 'grid', gap: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={SECTION_LABEL}>IT sourcing category</div>
                  {selectedCategory ? (
                    <span style={{ ...STATUS_CHIP, background: SHELL.MINT_BG, borderColor: SHELL.MINT_LINE, color: SHELL.MINT_TEXT }}>
                      {selectedCategory.label}
                    </span>
                  ) : (
                    <span style={{ ...STATUS_CHIP, background: SHELL.PAPER_SOFT, borderColor: SHELL.CARD_LINE, color: SHELL.INK_MUTED }}>
                      Optional
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {SOURCE_CATEGORIES.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      selected={selectedCategoryId === category.id}
                      onSelect={() => {
                        setSelectedCategoryId((prev) => prev === category.id ? null : category.id);
                        setSubmitState({ status: 'idle' });
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Intake fields */}
              <div style={{ display: 'grid', gap: 0 }}>
                <div style={{ ...SECTION_LABEL, marginBottom: 4 }}>Event facts</div>
                {INTAKE_FIELDS.map((field) => {
                  const value = intake[field.id];
                  const complete = value.trim().length > 0;
                  const isRequired = field.id === 'trigger';
                  return (
                    <label
                      key={field.id}
                      style={{ display: 'grid', gap: 6, borderTop: `1px solid ${SHELL.CARD_LINE}`, padding: '11px 0' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <div>
                          <div style={FIELD_LABEL}>
                            {field.label}{isRequired && <span style={{ color: SHELL.PEACH_TEXT }}> *</span>}
                          </div>
                          <div style={FIELD_PROMPT}>{field.prompt}</div>
                        </div>
                        <span style={{
                          flex: '0 0 auto', ...STATUS_CHIP,
                          background: complete ? SHELL.MINT_BG : (isRequired ? SHELL.PEACH_BG : SHELL.PAPER_SOFT),
                          borderColor: complete ? SHELL.MINT_LINE : (isRequired ? SHELL.PEACH_LINE : SHELL.CARD_LINE),
                          color: complete ? SHELL.MINT_TEXT : (isRequired ? SHELL.PEACH_TEXT : SHELL.INK_MUTED),
                        }}>
                          {complete ? 'Captured' : (isRequired ? 'Required' : `${field.agent} needs`)}
                        </span>
                      </div>
                      <textarea
                        value={value}
                        onChange={(e) => patchIntake(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: `1px solid ${complete ? SHELL.CARD_LINE : (isRequired ? SHELL.PEACH_LINE : SHELL.CARD_LINE)}`,
                          borderRadius: 8, background: SHELL.PAPER, color: SHELL.INK,
                          fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.45,
                          padding: '8px 10px', resize: 'vertical', outline: 'none',
                        }}
                      />
                    </label>
                  );
                })}
              </div>

              {/* Submit */}
              <div style={{ display: 'grid', gap: 7 }}>
                <button
                  type="button"
                  onClick={createEvent}
                  disabled={!canCreate}
                  style={{
                    border: 'none', borderRadius: 10,
                    background: canCreate ? SHELL.INK : SHELL.GRAY_BG,
                    color: canCreate ? SHELL.PAPER : SHELL.GRAY_TEXT,
                    cursor: canCreate ? 'pointer' : 'not-allowed',
                    fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontWeight: 700, padding: '11px 14px',
                  }}
                >
                  {submitState.status === 'submitting' ? 'Opening event canvas…' : 'Open sourcing event →'}
                </button>

                {submitState.status === 'error' && (
                  <div
                    role="alert"
                    style={{
                      borderRadius: 8, border: `1px solid ${SHELL.PEACH_LINE}`, background: SHELL.PEACH_BG,
                      padding: '8px 10px', fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.PEACH_TEXT,
                    }}
                  >
                    {submitState.message}
                  </div>
                )}

                <a
                  href="/source"
                  style={{
                    textAlign: 'center', fontFamily: SHELL.MONO, fontSize: 9,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: SHELL.INK_MUTED, textDecoration: 'none',
                  }}
                >
                  ← Back to Source portfolio
                </a>
              </div>
            </section>

              {/* Guidance cards */}
              <section style={{ display: 'grid', gap: 6 }}>
                <div style={SECTION_LABEL}>Agent guidance</div>
                {AGENT_GUIDANCE.map((item) => (
                  <GuidanceCard key={item.label} {...item} />
                ))}
              </section>
            </aside>
          }
        />
        <SourceOnboardingTour
          active={tourActive}
          config={{
            step: 2,
            title: 'Sentinel just needs the trigger.',
            body: (
              <>
                Fill the <strong>Why now / trigger</strong> field — that&rsquo;s
                the only required intake fact. Everything else can be refined
                later through the chat. When you click <strong>Open sourcing
                event</strong> the tour follows you to the canvas.
              </>
            ),
            awaitingUserAction: true,
          }}
        />
      </main>
    </AppShell>
  );
}

// Full-bleed flex shell — no max-width cap; chat lane and intake pane share
// the viewport horizontally and the user can drag the splitter to redistribute.
const MAIN_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  height: 'calc(100vh - 64px)',
  overflow: 'hidden',
  background: SHELL.PAPER,
};

const CHAT_PANE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
};

const INTAKE_PANE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  padding: '12px 16px 24px',
};

const INTAKE_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`, borderRadius: 16,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: '13px 14px', display: 'grid', gap: 12,
  boxShadow: '0 14px 32px rgba(12, 26, 58, 0.06)',
};

const CONTEXT_STRIP: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5,
  paddingBottom: 10, borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const STRIP_TOKEN: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_SOFT, fontWeight: 600,
};

const STRIP_DOT: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, lineHeight: 1,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const HEADING: CSSProperties = {
  margin: '2px 0 0', fontFamily: SHELL.SERIF, fontSize: 22,
  lineHeight: 1.1, color: SHELL.INK, letterSpacing: '-0.02em',
};

const SUBHEAD: CSSProperties = {
  margin: '5px 0 0', fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.42, color: SHELL.INK_SOFT,
};

const DRAFT_RESTORED_STYLE: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  marginTop: 9,
  padding: '6px 9px',
  borderRadius: 6,
  border: `1px solid ${SHELL.MINT_LINE}`,
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
  fontFamily: SHELL.SANS, fontSize: 11.5, lineHeight: 1.35,
};

const DRAFT_DISCARD_STYLE: CSSProperties = {
  border: 'none', background: 'transparent', color: SHELL.MINT_TEXT,
  fontFamily: SHELL.MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
  textTransform: 'uppercase', cursor: 'pointer', padding: 0,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const STATUS_CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', border: '1px solid', borderRadius: 4, padding: '2px 6px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap',
};

const FIELD_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const FIELD_PROMPT: CSSProperties = {
  marginTop: 2, fontFamily: SHELL.SANS, fontSize: 11, lineHeight: 1.35, color: SHELL.INK_SOFT,
};
