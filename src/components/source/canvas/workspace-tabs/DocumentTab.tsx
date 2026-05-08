import { useEffect, useState, type CSSProperties } from 'react';
import { specByCode, type SourceArtifactSpec } from '@/lib/source/canonical-specs';
import type {
  SourceEventArtifactState,
  SourceEventArtifactStatus,
} from '@/lib/source/canvas-substrate';
import type { SourceStageKey } from '@/lib/source/types';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import { CANVAS } from '../canvas-tokens';
import { VendorPricingSubmissionsPanel } from './VendorPricingSubmissionsPanel';

// Codes that surface the vendor-pricing-submissions panel below the
// body editor. Today only d19 (pricing); future variants would extend.
const VENDOR_SUBMISSIONS_CODES: ReadonlySet<string> = new Set([
  'd19_pricing_workbook',
]);

interface DocumentTabProps {
  /** Source event id; used by the vendor-submissions panel for API calls. */
  eventId?: string;
  stage: SourceStageKey;
  artifacts: SourceEventArtifactState[];
  /** Map of artifact code → markdown template body (server-loaded). */
  templateByCode: Record<string, string | null>;
  /** Currently focused artifact code; UI lets user switch. */
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
  /**
   * Status mutator. When omitted (e.g. SSR / read-only previews) the
   * Mark-complete button is hidden — the tab renders identically to
   * the read-only display it had before B1.
   */
  onChangeStatus?: (code: string, next: SourceEventArtifactStatus) => Promise<void>;
  /** Per-artifact pending flag — disables the button while the PATCH is in flight. */
  pendingByCode?: Record<string, boolean>;
  /**
   * Body mutator. When omitted the artifact body stays read-only —
   * the canvas falls back to the canonical template.
   */
  onSaveBody?: (code: string, body: string) => Promise<void>;
  /** Per-artifact body-pending flag (separate from status pending). */
  bodyPendingByCode?: Record<string, boolean>;
  /**
   * Trigger Claude generation for a specific artifact code.
   * Returns generation result so the caller can surface failure
   * states (missing upstream, etc.).
   */
  onGenerateFromClaude?: (code: string) => Promise<
    { ok: true } | { ok: false; error: string; detail: string; missingUpstream?: string[] }
  >;
  /** Set of codes the prompt registry knows how to generate. */
  generatableCodes?: ReadonlySet<string>;
  /** Per-artifact generation-pending flag. */
  generationPendingByCode?: Record<string, boolean>;
  /**
   * Set of codes that have an xlsx renderer wired. The card shows a
   * "Download xlsx template" button when its code is in this set.
   */
  xlsxGeneratableCodes?: ReadonlySet<string>;
  /**
   * Build the xlsx download URL for a given artifact code. Page passes
   * this so the button can deep-link directly to the GET endpoint —
   * no fetch + Blob plumbing on the client.
   */
  xlsxDownloadHref?: (code: string) => string;
  /**
   * Set of codes that have a comparison-mode xlsx renderer (e.g. d19
   * pricing-comparison aggregating vendor submissions). When a code is
   * in this set the card shows a second "Download comparison xlsx"
   * anchor alongside the standard template anchor.
   */
  xlsxComparisonCodes?: ReadonlySet<string>;
  /** Build the comparison xlsx download URL for a given artifact code. */
  xlsxComparisonDownloadHref?: (code: string) => string;
  /**
   * Set of codes that have a docx renderer wired. The card shows a
   * "Download docx" anchor when its code is in this set.
   */
  docxGeneratableCodes?: ReadonlySet<string>;
  /** Build the docx download URL for a given artifact code. */
  docxDownloadHref?: (code: string) => string;
  /**
   * Set of codes that have an HTML renderer wired. Card shows a
   * "View HTML" anchor (opens in a new tab, no attachment).
   */
  htmlGeneratableCodes?: ReadonlySet<string>;
  /** Build the HTML view URL for a given artifact code. */
  htmlViewHref?: (code: string) => string;
}

const STATUS_LABEL: Record<SourceEventArtifactStatus, string> = {
  not_started: 'Not started',
  drafting: 'Drafting',
  needs_review: 'Needs review',
  approved: 'Approved',
  locked: 'Locked',
  superseded: 'Superseded',
};

/**
 * The Document tab is the workspace's main surface — shows what's being
 * assembled at the current stage. Left rail of artifact slots, right side
 * renders the selected artifact's content (template body when stub, real
 * content when promoted).
 */
export function DocumentTab({
  eventId,
  stage,
  artifacts,
  templateByCode,
  selectedCode,
  onSelectCode,
  onChangeStatus,
  pendingByCode,
  onSaveBody,
  bodyPendingByCode,
  onGenerateFromClaude,
  generatableCodes,
  generationPendingByCode,
  xlsxGeneratableCodes,
  xlsxDownloadHref,
  xlsxComparisonCodes,
  xlsxComparisonDownloadHref,
  docxGeneratableCodes,
  docxDownloadHref,
  htmlGeneratableCodes,
  htmlViewHref,
}: DocumentTabProps) {
  if (artifacts.length === 0) {
    return (
      <div data-testid="source-canvas-document-tab" style={EMPTY_STYLE}>
        <p style={EMPTY_TITLE_STYLE}>No artifacts scaffolded for {SOURCE_STAGE_LABELS[stage]}.</p>
        <p style={EMPTY_BODY_STYLE}>
          The canvas substrate for this stage is empty. Either this is a
          legacy event missing scaffolding, or the canonical specs need to be
          extended. Run <code>npm run db:backfill:source-canvas</code>.
        </p>
      </div>
    );
  }

  // Resolve the active artifact (default to first required one).
  const required = artifacts.filter((a) => a.requirementLevel === 'required');
  const optional = artifacts.filter((a) => a.requirementLevel !== 'required');
  const ordered = [...required, ...optional];
  const active =
    ordered.find((a) => a.artifactCode === selectedCode) ?? ordered[0] ?? null;
  const activeSpec = active ? specByCode(active.artifactCode) : null;
  // Per-event authored body wins; falls back to the canonical template
  // when the user hasn't authored anything yet.
  const authoredBody = active?.body ?? null;
  const templateBody = active ? templateByCode[active.artifactCode] ?? null : null;
  const body = authoredBody ?? templateBody;
  const bodyIsAuthored = Boolean(authoredBody);

  return (
    <div data-testid="source-canvas-document-tab" style={CONTAINER_STYLE}>
      {/* Artifact list (left) */}
      <aside style={LIST_STYLE} aria-label={`Artifacts at ${SOURCE_STAGE_LABELS[stage]}`}>
        {required.length > 0 ? (
          <div>
            <div style={GROUP_LABEL_STYLE}>Required</div>
            <ul style={LIST_RESET_STYLE}>
              {required.map((a) => (
                <ArtifactRow
                  key={a.artifactCode}
                  artifact={a}
                  spec={specByCode(a.artifactCode)}
                  isActive={a.artifactCode === active?.artifactCode}
                  onClick={() => onSelectCode?.(a.artifactCode)}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {optional.length > 0 ? (
          <div>
            <div style={GROUP_LABEL_STYLE}>Optional</div>
            <ul style={LIST_RESET_STYLE}>
              {optional.map((a) => (
                <ArtifactRow
                  key={a.artifactCode}
                  artifact={a}
                  spec={specByCode(a.artifactCode)}
                  isActive={a.artifactCode === active?.artifactCode}
                  onClick={() => onSelectCode?.(a.artifactCode)}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      {/* Active artifact body (right) */}
      <article style={BODY_STYLE} aria-labelledby="active-artifact-title">
        {active && activeSpec ? (
          <>
            <header style={BODY_HEADER_STYLE}>
              <div style={BODY_EYEBROW_STYLE}>
                <span style={BODY_CODE_STYLE}>{active.artifactCode}</span>
                <span style={DOT_STYLE}>·</span>
                <span>Tier: {active.tier}</span>
              </div>
              <div style={BODY_TITLE_ROW_STYLE}>
                <h2 id="active-artifact-title" style={BODY_TITLE_STYLE}>
                  {activeSpec.name}
                </h2>
                <ArtifactStatusControls
                  artifact={active}
                  onChangeStatus={onChangeStatus}
                  pending={pendingByCode?.[active.artifactCode] ?? false}
                />
              </div>
              <p style={BODY_DESC_STYLE}>{activeSpec.description}</p>
            </header>
            <ArtifactBodyEditor
              artifact={active}
              templateBody={templateBody}
              authoredBody={authoredBody}
              bodyIsAuthored={bodyIsAuthored}
              onSaveBody={onSaveBody}
              pending={bodyPendingByCode?.[active.artifactCode] ?? false}
              stage={stage}
              onGenerateFromClaude={onGenerateFromClaude}
              isGeneratable={
                generatableCodes?.has(active.artifactCode) ?? false
              }
              generationPending={
                generationPendingByCode?.[active.artifactCode] ?? false
              }
              xlsxDownloadHref={
                xlsxGeneratableCodes?.has(active.artifactCode) && xlsxDownloadHref
                  ? xlsxDownloadHref(active.artifactCode)
                  : null
              }
              xlsxComparisonDownloadHref={
                xlsxComparisonCodes?.has(active.artifactCode) && xlsxComparisonDownloadHref
                  ? xlsxComparisonDownloadHref(active.artifactCode)
                  : null
              }
              docxDownloadHref={
                docxGeneratableCodes?.has(active.artifactCode) && docxDownloadHref
                  ? docxDownloadHref(active.artifactCode)
                  : null
              }
              htmlViewHref={
                htmlGeneratableCodes?.has(active.artifactCode) && htmlViewHref
                  ? htmlViewHref(active.artifactCode)
                  : null
              }
            />
            {eventId && VENDOR_SUBMISSIONS_CODES.has(active.artifactCode) ? (
              <VendorPricingSubmissionsPanel
                eventId={eventId}
                artifactCode={active.artifactCode}
              />
            ) : null}
            {body ? null : (
              <p style={MISSING_TEMPLATE_STYLE}>
                No template content found for this artifact code. Add a markdown
                file at{' '}
                <code>
                  src/content/source-templates/{stage}/{active.artifactCode}.md
                </code>
                .
              </p>
            )}
          </>
        ) : null}
      </article>
    </div>
  );
}

interface ArtifactBodyEditorProps {
  artifact: SourceEventArtifactState;
  templateBody: string | null;
  authoredBody: string | null;
  bodyIsAuthored: boolean;
  onSaveBody?: (code: string, body: string) => Promise<void>;
  pending: boolean;
  stage: SourceStageKey;
  onGenerateFromClaude?: (code: string) => Promise<
    { ok: true } | { ok: false; error: string; detail: string; missingUpstream?: string[] }
  >;
  isGeneratable: boolean;
  generationPending: boolean;
  /** When non-null the card shows a "Download xlsx template" anchor. */
  xlsxDownloadHref: string | null;
  /** When non-null the card shows a "Download comparison xlsx" anchor. */
  xlsxComparisonDownloadHref?: string | null;
  /** When non-null the card shows a "Download docx" anchor. */
  docxDownloadHref?: string | null;
  /** When non-null the card shows a "View HTML" anchor (target="_blank"). */
  htmlViewHref?: string | null;
}

function ArtifactBodyEditor({
  artifact,
  templateBody,
  authoredBody,
  bodyIsAuthored,
  onSaveBody,
  pending,
  onGenerateFromClaude,
  isGeneratable,
  generationPending,
  xlsxDownloadHref,
  xlsxComparisonDownloadHref,
  docxDownloadHref,
  htmlViewHref,
}: ArtifactBodyEditorProps) {
  const [editing, setEditing] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  // Seed the textarea: real authored content > template scaffold.
  const seed = authoredBody ?? templateBody ?? '';
  const [draft, setDraft] = useState(seed);

  // If the user navigates between artifacts the seed changes — sync.
  useEffect(() => {
    setDraft(seed);
    setEditing(false);
    setGenerationError(null);
  }, [seed]);

  const handleGenerate = async () => {
    if (!onGenerateFromClaude) return;
    setGenerationError(null);
    const result = await onGenerateFromClaude(artifact.artifactCode);
    if (!result.ok) {
      const detail =
        result.error === 'upstream_required' && result.missingUpstream
          ? `Author and approve these first: ${result.missingUpstream.join(', ')}`
          : result.detail;
      setGenerationError(detail);
    }
  };

  if (editing && onSaveBody) {
    return (
      <div style={EDITOR_WRAP_STYLE}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck
          rows={20}
          data-testid={`source-canvas-document-body-editor-${artifact.artifactCode}`}
          style={EDITOR_TEXTAREA_STYLE}
        />
        <div style={EDITOR_TOOLBAR_STYLE}>
          <span style={EDITOR_HINT_STYLE}>
            Markdown · per-event content · saves to{' '}
            <code>source_event_artifact_states.body</code>
          </span>
          <div style={EDITOR_BUTTONS_STYLE}>
            <button
              type="button"
              onClick={() => {
                setDraft(seed);
                setEditing(false);
              }}
              data-testid={`source-canvas-document-body-cancel-${artifact.artifactCode}`}
              style={GHOST_BUTTON_STYLE}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                await onSaveBody(artifact.artifactCode, draft);
                setEditing(false);
              }}
              data-testid={`source-canvas-document-body-save-${artifact.artifactCode}`}
              style={{ ...PRIMARY_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
            >
              {pending ? 'Saving…' : 'Save body'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isGenerated =
    artifact.bodyGenerationMetadata !== null && bodyIsAuthored;

  return (
    <div style={READER_WRAP_STYLE}>
      <div style={READER_HEADER_STYLE}>
        <span style={READER_BADGE_STYLE}>
          {isGenerated
            ? 'Generated by Sentinel · editable'
            : bodyIsAuthored
              ? 'Authored content'
              : 'Template scaffold (not yet authored)'}
        </span>
        <div style={READER_BUTTONS_STYLE}>
          {onGenerateFromClaude && isGeneratable ? (
            <button
              type="button"
              disabled={generationPending}
              onClick={handleGenerate}
              data-testid={`source-canvas-document-body-generate-${artifact.artifactCode}`}
              style={{
                ...PRIMARY_BUTTON_STYLE,
                opacity: generationPending ? 0.55 : 1,
                background: '#0c1a3a',
                color: '#faf7f1',
              }}
            >
              {generationPending
                ? 'Generating with Sentinel…'
                : isGenerated || bodyIsAuthored
                  ? 'Regenerate with Sentinel'
                  : 'Generate with Sentinel'}
            </button>
          ) : null}
          {onSaveBody ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              data-testid={`source-canvas-document-body-edit-${artifact.artifactCode}`}
              style={GHOST_BUTTON_STYLE}
            >
              {bodyIsAuthored ? 'Edit body' : 'Author content'}
            </button>
          ) : null}
          {xlsxDownloadHref ? (
            <a
              href={xlsxDownloadHref}
              data-testid={`source-canvas-document-body-download-xlsx-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: 'none' }}
              download
            >
              Download xlsx template
            </a>
          ) : null}
          {xlsxComparisonDownloadHref ? (
            <a
              href={xlsxComparisonDownloadHref}
              data-testid={`source-canvas-document-body-download-xlsx-comparison-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: 'none' }}
              download
              title="Side-by-side comparison of vendor pricing submissions (currently demo mode)."
            >
              Download comparison xlsx
            </a>
          ) : null}
          {docxDownloadHref ? (
            <a
              href={docxDownloadHref}
              data-testid={`source-canvas-document-body-download-docx-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: 'none' }}
              download
              title="Download as Word document — uses the authored body when present, canonical scaffold otherwise."
            >
              Download docx
            </a>
          ) : null}
          {htmlViewHref ? (
            <a
              href={htmlViewHref}
              data-testid={`source-canvas-document-body-view-html-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
              title="View as a browser-readable HTML document — useful for sharing as a link, or printing to PDF from the browser."
            >
              View HTML
            </a>
          ) : null}
        </div>
      </div>
      {generationError ? (
        <div
          role="alert"
          data-testid={`source-canvas-document-body-generation-error-${artifact.artifactCode}`}
          style={GENERATION_ERROR_STYLE}
        >
          Generation failed — {generationError}
        </div>
      ) : null}
      {(authoredBody ?? templateBody) ? (
        <pre style={MARKDOWN_BODY_STYLE} data-testid="source-canvas-document-body">
          {authoredBody ?? templateBody}
        </pre>
      ) : null}
    </div>
  );
}

interface ArtifactRowProps {
  artifact: SourceEventArtifactState;
  spec: SourceArtifactSpec | undefined;
  isActive: boolean;
  onClick: () => void;
}

function ArtifactRow({ artifact, spec, isActive, onClick }: ArtifactRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        data-testid={`source-canvas-artifact-${artifact.artifactCode}`}
        style={{
          ...ROW_BUTTON_STYLE,
          background: isActive ? 'rgba(10,10,11,0.05)' : 'transparent',
          color: CANVAS.INK,
        }}
      >
        <span style={ROW_NAME_STYLE}>{spec?.name ?? artifact.artifactCode}</span>
        <span style={ROW_META_STYLE}>
          <span style={ROW_CODE_STYLE}>{artifact.artifactCode}</span>
          <span style={DOT_STYLE}>·</span>
          <span style={tierStyle(artifact.tier)}>{artifact.tier}</span>
          <StatusPill status={artifact.status} />
          {artifact.gateDefining ? <span style={GATE_TAG_STYLE}>gate</span> : null}
        </span>
      </button>
    </li>
  );
}

function StatusPill({ status }: { status: SourceEventArtifactStatus }) {
  const tone = statusTone(status);
  return (
    <span
      data-testid={`source-canvas-artifact-status-${status}`}
      style={{
        ...PILL_STYLE,
        background: tone.bg,
        color: tone.fg,
        borderColor: tone.border,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

interface ArtifactStatusControlsProps {
  artifact: SourceEventArtifactState;
  onChangeStatus?: (
    code: string,
    next: SourceEventArtifactStatus,
  ) => Promise<void>;
  pending: boolean;
}

function ArtifactStatusControls({
  artifact,
  onChangeStatus,
  pending,
}: ArtifactStatusControlsProps) {
  const isTerminal = artifact.status === 'locked' || artifact.status === 'superseded';
  const isApproved = artifact.status === 'approved';
  return (
    <div style={STATUS_CONTROLS_STYLE}>
      <StatusPill status={artifact.status} />
      {onChangeStatus && !isTerminal ? (
        isApproved ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onChangeStatus(artifact.artifactCode, 'drafting')}
            data-testid={`source-canvas-artifact-reopen-${artifact.artifactCode}`}
            style={{ ...GHOST_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
          >
            {pending ? 'Reopening…' : 'Reopen'}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => onChangeStatus(artifact.artifactCode, 'approved')}
            data-testid={`source-canvas-artifact-mark-complete-${artifact.artifactCode}`}
            style={{ ...PRIMARY_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
          >
            {pending ? 'Saving…' : 'Mark complete'}
          </button>
        )
      ) : null}
    </div>
  );
}

function statusTone(status: SourceEventArtifactStatus): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (status) {
    case 'approved':
      return { bg: 'rgba(46,125,50,0.10)', fg: '#2E7D32', border: 'rgba(46,125,50,0.32)' };
    case 'drafting':
      return { bg: 'rgba(186,117,23,0.10)', fg: '#A66400', border: 'rgba(186,117,23,0.30)' };
    case 'needs_review':
      return { bg: 'rgba(211,84,0,0.10)', fg: '#B85B00', border: 'rgba(211,84,0,0.30)' };
    case 'locked':
      return { bg: 'rgba(10,10,11,0.06)', fg: CANVAS.INK, border: 'rgba(10,10,11,0.22)' };
    case 'superseded':
      return { bg: 'rgba(10,10,11,0.04)', fg: CANVAS.INK_SOFT, border: 'rgba(10,10,11,0.14)' };
    case 'not_started':
    default:
      return { bg: 'rgba(10,10,11,0.04)', fg: CANVAS.INK_SOFT, border: 'rgba(10,10,11,0.14)' };
  }
}

function tierStyle(tier: SourceEventArtifactState['tier']): CSSProperties {
  const color =
    tier === 'rich' ? CANVAS.ACTIVE : tier === 'outline' ? CANVAS.WAITING : CANVAS.GRAY_DK;
  return { color, fontWeight: 600 };
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
  gap: 28,
  alignItems: 'start',
};

const LIST_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  position: 'sticky',
  top: 0,
};

const GROUP_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  marginBottom: 6,
};

const LIST_RESET_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: 2,
};

const ROW_BUTTON_STYLE: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'grid',
  gap: 4,
  fontFamily: CANVAS.SANS,
  transition: 'background 120ms ease',
};

const ROW_NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 500,
  color: CANVAS.INK,
  lineHeight: 1.35,
};

const ROW_META_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  color: CANVAS.INK_SOFT,
};

const ROW_CODE_STYLE: CSSProperties = {
  letterSpacing: '0.04em',
};

const GATE_TAG_STYLE: CSSProperties = {
  marginLeft: 'auto',
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  color: CANVAS.WAITING,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
};

const BODY_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  minWidth: 0,
};

const BODY_HEADER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  paddingBottom: 14,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const BODY_EYEBROW_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
};

const BODY_CODE_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK,
};

const DOT_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const BODY_TITLE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
};

const BODY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.015em',
  color: CANVAS.INK,
  margin: 0,
  lineHeight: 1.15,
  flex: '1 1 auto',
  minWidth: 0,
};

const STATUS_CONTROLS_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  flex: '0 0 auto',
};

const PILL_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  padding: '3px 8px',
  borderRadius: 999,
  border: '1px solid transparent',
  whiteSpace: 'nowrap',
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '7px 12px',
  borderRadius: 6,
  border: 'none',
  background: CANVAS.INK,
  color: '#ffffff',
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const EDITOR_WRAP_STYLE: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 4,
};

const EDITOR_TEXTAREA_STYLE: CSSProperties = {
  width: '100%',
  minHeight: 360,
  padding: '14px 16px',
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  fontFamily: CANVAS.MONO,
  fontSize: 13,
  lineHeight: 1.6,
  color: CANVAS.INK,
  background: '#ffffff',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const EDITOR_TOOLBAR_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};

const EDITOR_HINT_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11.5,
  color: CANVAS.INK_SOFT,
  fontStyle: 'italic',
};

const EDITOR_BUTTONS_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const READER_WRAP_STYLE: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 4,
};

const READER_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 6,
  flexWrap: 'wrap',
};

const READER_BUTTONS_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const GENERATION_ERROR_STYLE: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: '1px solid rgba(186,117,23,0.30)',
  background: 'rgba(186,117,23,0.06)',
  padding: '10px 12px',
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: '#A66400',
  lineHeight: 1.5,
};

const READER_BADGE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.INK_SOFT,
  fontWeight: 600,
};

const GHOST_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 11px',
  borderRadius: 6,
  border: `1px solid ${CANVAS.RULE}`,
  background: 'transparent',
  color: CANVAS.INK,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const BODY_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.55,
  color: CANVAS.INK_SOFT,
  margin: 0,
};

const MARKDOWN_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13.5,
  lineHeight: 1.7,
  color: CANVAS.INK,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
};

const MISSING_TEMPLATE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  background: 'rgba(186,117,23,0.05)',
  border: `1px solid rgba(186,117,23,0.18)`,
  padding: '12px 14px',
  borderRadius: CANVAS.RADIUS_TIGHT,
};

const EMPTY_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: '32px 0',
};

const EMPTY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  fontWeight: 400,
  color: CANVAS.INK,
  margin: 0,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: CANVAS.INK_SOFT,
  margin: 0,
  maxWidth: 520,
};
