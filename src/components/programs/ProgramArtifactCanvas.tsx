// PDEL5 · Program Artifact Canvas.
//
// Server component that renders the deterministic deliverable / artifact
// canvas for a program. Two-region layout: left list + right canvas.
//
// Pure: reads only from the prebuilt view-model. No state, no effects,
// no model calls, no Date.now reads, no fetches. All actions are
// honestly disabled with deferred reasons (PDEL5b/PDEL6/PDEL7).
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import { EvidenceChip } from '@/components/abarva/EvidenceChip';
import { FileTypeChip } from '@/components/abarva/FileTypeChip';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';
import type {
  CanvasAction,
  CanvasRenderMode,
  ProgramArtifactCanvasListEntry,
  ProgramArtifactCanvasSelection,
  ProgramArtifactCanvasView,
} from '@/lib/programs/program-artifact-canvas-view';

export interface ProgramArtifactCanvasProps {
  view: ProgramArtifactCanvasView;
}

export function ProgramArtifactCanvas({ view }: ProgramArtifactCanvasProps) {
  return (
    <section
      data-program-artifact-canvas="pdel5"
      aria-label="Program deliverable artifact canvas"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        fontFamily: FONT.body,
        color: COLORS.ink,
      }}
    >
      <CanvasHeader view={view} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 320px) minmax(0, 1fr)',
          gap: 0,
          alignItems: 'stretch',
        }}
      >
        <CanvasList view={view} />
        <CanvasRightPane selected={view.selected} />
      </div>
      <footer
        style={{
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          borderTop: BORDER.hairlineSoft,
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        {view.honestDisclaimer}
      </footer>
    </section>
  );
}

// --- Header ---------------------------------------------------------

function CanvasHeader({ view }: { view: ProgramArtifactCanvasView }) {
  return (
    <header
      style={{
        padding: `${SPACING.md}px ${SPACING.lg}px`,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          PDEL5 · Deliverable / artifact canvas
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
          {view.programName ? view.programName : 'Program canvas'}
          {view.programCode ? ` · ${view.programCode}` : ''}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        <span>Artifacts · {view.artifactCount}</span>
        <span>Renderable · {view.renderableCount}</span>
      </div>
    </header>
  );
}

// --- Left list ------------------------------------------------------

function CanvasList({ view }: { view: ProgramArtifactCanvasView }) {
  if (view.list.length === 0) {
    return (
      <div
        style={{
          padding: SPACING.lg,
          borderRight: BORDER.hairlineSoft,
          fontSize: 13,
          color: COLORS.muted,
          fontStyle: 'italic',
          background: COLORS.surface2,
        }}
      >
        No artifacts seeded for this program yet.
      </div>
    );
  }
  return (
    <ol
      aria-label="Program artifacts"
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        borderRight: BORDER.hairlineSoft,
        background: COLORS.surface,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 720,
        overflowY: 'auto',
      }}
    >
      {view.list.map((entry) => (
        <li
          key={entry.artifactId}
          data-artifact-id={entry.artifactId}
          data-selected={entry.isSelected ? 'true' : 'false'}
          style={{
            padding: `${SPACING.sm + 2}px ${SPACING.md}px`,
            borderBottom: BORDER.hairlineSoft,
            background: entry.isSelected ? COLORS.navySoft : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              flexWrap: 'wrap',
            }}
          >
            <FileTypeChip type={entry.fileChip} />
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: COLORS.muted,
              }}
            >
              {entry.phase}
            </span>
          </div>
          <span style={{ fontSize: 13, color: COLORS.ink, fontWeight: 500 }}>
            {entry.title}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              flexWrap: 'wrap',
            }}
          >
            <RenderModePill mode={entry.renderMode} />
            <EvidenceUsableDot usable={entry.evidenceUsable} />
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: 11,
                color: COLORS.mutedSoft,
              }}
            >
              {entry.artifactType}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EvidenceUsableDot({ usable }: { usable: boolean }) {
  return (
    <EvidenceChip state={usable ? 'usable_as_evidence' : 'partial'} />
  );
}

// --- Right pane -----------------------------------------------------

function CanvasRightPane({
  selected,
}: {
  selected: ProgramArtifactCanvasSelection | null;
}) {
  if (!selected) {
    return (
      <div
        style={{
          padding: SPACING.xl,
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.muted,
          background: COLORS.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 320,
          fontStyle: 'italic',
        }}
        data-program-artifact-canvas-empty="true"
      >
        Select an artifact from the list to preview its deliverable here.
      </div>
    );
  }
  return (
    <article
      style={{
        padding: SPACING.lg,
        background: COLORS.card,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
      data-program-artifact-canvas-selected={selected.artifactId}
    >
      <SelectionHeader selection={selected} />
      <MissingInputsCallout missingInputs={selected.missingInputs} />
      <OriginRow origin={selected.origin} />
      <PreviewBody selection={selected} />
      <ActionsRow actions={selected.actions} />
    </article>
  );
}

function SelectionHeader({
  selection,
}: {
  selection: ProgramArtifactCanvasSelection;
}) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <FileTypeChip type={selection.fileChip} />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {selection.phase} · {selection.artifactType}
        </span>
        <RenderModePill mode={selection.renderMode} />
        <EvidenceChip
          state={selection.evidenceUsable ? 'usable_as_evidence' : 'partial'}
        />
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: COLORS.ink,
          lineHeight: 1.3,
        }}
      >
        {selection.title}
      </h3>
    </header>
  );
}

function MissingInputsCallout({ missingInputs }: { missingInputs: string[] }) {
  if (missingInputs.length === 0) return null;
  return (
    <aside
      role="note"
      aria-label="Missing inputs"
      style={{
        padding: `${SPACING.sm + 2}px ${SPACING.md}px`,
        background: COLORS.redSoft,
        border: `1px solid ${COLORS.red}33`,
        borderRadius: RADIUS.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      data-canvas-missing-inputs={missingInputs.length}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.red,
        }}
      >
        Missing inputs · {missingInputs.length}
      </span>
      <ul
        style={{
          listStyle: 'disc',
          paddingLeft: 18,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {missingInputs.map((entry, idx) => (
          <li
            key={idx}
            style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.45 }}
          >
            {entry}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function OriginRow({
  origin,
}: {
  origin: ProgramArtifactCanvasSelection['origin'];
}) {
  const label = (() => {
    switch (origin) {
      case 'generated':
        return 'Generated · deterministic seed';
      case 'uploaded':
        return 'Uploaded · placeholder (parser deferred)';
      case 'workshop_note':
        return 'Workshop note · captured in seed';
    }
  })();
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.muted,
      }}
      data-canvas-origin={origin}
    >
      Origin · {label}
    </div>
  );
}

function PreviewBody({
  selection,
}: {
  selection: ProgramArtifactCanvasSelection;
}) {
  const { preview } = selection;
  if (preview.mode === 'html') {
    return (
      <div
        data-canvas-preview-mode="html"
        style={{
          padding: SPACING.md,
          background: COLORS.surface2,
          border: BORDER.hairlineSoft,
          borderRadius: RADIUS.md,
          fontSize: 13,
          lineHeight: 1.55,
          color: COLORS.body,
        }}
        // Body is built deterministically from escaped seed text in the
        // view-model; never carries operator-supplied HTML.
        dangerouslySetInnerHTML={{ __html: preview.body }}
      />
    );
  }
  if (preview.mode === 'markdown') {
    return (
      <pre
        data-canvas-preview-mode="markdown"
        style={{
          margin: 0,
          padding: SPACING.md,
          background: COLORS.surface2,
          border: BORDER.hairlineSoft,
          borderRadius: RADIUS.md,
          fontFamily: FONT.mono,
          fontSize: 12,
          lineHeight: 1.5,
          color: COLORS.body,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {preview.body}
      </pre>
    );
  }
  return (
    <div
      data-canvas-preview-mode="placeholder"
      style={{
        padding: SPACING.md,
        background: COLORS.surface2,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        fontSize: 12,
        fontStyle: 'italic',
        color: COLORS.muted,
        textAlign: 'center',
      }}
    >
      {preview.body}
    </div>
  );
}

function ActionsRow({ actions }: { actions: CanvasAction[] }) {
  return (
    <div
      role="group"
      aria-label="Artifact actions (deferred)"
      style={{
        display: 'flex',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        paddingTop: SPACING.sm,
        borderTop: BORDER.hairlineSoft,
      }}
    >
      {actions.map((action) => (
        <ActionButton key={action.key} action={action} />
      ))}
    </div>
  );
}

function ActionButton({ action }: { action: CanvasAction }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
      }}
      data-canvas-action={action.key}
      data-canvas-action-enabled={action.enabled ? 'true' : 'false'}
    >
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={action.reason}
        style={{
          fontFamily: FONT.body,
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.muted,
          background: COLORS.surface2,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          padding: '6px 10px',
          cursor: 'not-allowed',
          opacity: 0.7,
        }}
      >
        {actionLabel(action.key)}
      </button>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        {action.reason}
      </span>
    </span>
  );
}

function actionLabel(key: CanvasAction['key']): string {
  switch (key) {
    case 'edit':
      return 'Edit';
    case 'regenerate':
      return 'Regenerate';
    case 'download':
      return 'Download';
    case 'approve':
      return 'Approve';
  }
}

// --- Render-mode pill -----------------------------------------------

function RenderModePill({ mode }: { mode: CanvasRenderMode }) {
  const tone = renderModeTone(mode);
  return (
    <span
      data-canvas-render-mode={mode}
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {renderModeLabel(mode)}
    </span>
  );
}

function renderModeTone(mode: CanvasRenderMode): {
  fg: string;
  bg: string;
  border: string;
} {
  if (mode === 'html' || mode === 'markdown') {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      border: `${COLORS.navy}33`,
    };
  }
  return {
    fg: COLORS.muted,
    bg: COLORS.surface2,
    border: COLORS.borderSoft,
  };
}

function renderModeLabel(mode: CanvasRenderMode): string {
  switch (mode) {
    case 'html':
      return 'HTML';
    case 'markdown':
      return 'Markdown';
    case 'pdf_export_later':
      return 'PDF · later';
    case 'docx_export_later':
      return 'DOCX · later';
    case 'ppt_export_later':
      return 'PPT · later';
  }
}
