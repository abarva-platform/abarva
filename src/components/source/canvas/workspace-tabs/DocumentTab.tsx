import type { CSSProperties } from 'react';
import { specByCode, type SourceArtifactSpec } from '@/lib/source/canonical-specs';
import type { SourceEventArtifactState } from '@/lib/source/canvas-substrate';
import type { SourceStageKey } from '@/lib/source/types';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import { CANVAS } from '../canvas-tokens';

interface DocumentTabProps {
  stage: SourceStageKey;
  artifacts: SourceEventArtifactState[];
  /** Map of artifact code → markdown template body (server-loaded). */
  templateByCode: Record<string, string | null>;
  /** Currently focused artifact code; UI lets user switch. */
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
}

/**
 * The Document tab is the workspace's main surface — shows what's being
 * assembled at the current stage. Left rail of artifact slots, right side
 * renders the selected artifact's content (template body when stub, real
 * content when promoted).
 */
export function DocumentTab({
  stage,
  artifacts,
  templateByCode,
  selectedCode,
  onSelectCode,
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
  const body = active ? templateByCode[active.artifactCode] ?? null : null;

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
                <span style={DOT_STYLE}>·</span>
                <span>Status: {active.status.replace(/_/g, ' ')}</span>
              </div>
              <h2 id="active-artifact-title" style={BODY_TITLE_STYLE}>
                {activeSpec.name}
              </h2>
              <p style={BODY_DESC_STYLE}>{activeSpec.description}</p>
            </header>
            {body ? (
              <pre style={MARKDOWN_BODY_STYLE} data-testid="source-canvas-document-body">
                {body}
              </pre>
            ) : (
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
          {artifact.gateDefining ? <span style={GATE_TAG_STYLE}>gate</span> : null}
        </span>
      </button>
    </li>
  );
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

const BODY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.015em',
  color: CANVAS.INK,
  margin: 0,
  lineHeight: 1.15,
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
