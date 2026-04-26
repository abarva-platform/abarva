// PDEL7 · Deliverable Canvas Viewer.
//
// Server component that renders a single deliverable in the program
// canvas. Reads only from the prebuilt PDEL7 view-model. Pure: no
// state, no effects, no model calls, no Date.now reads, no fetches,
// no live edit, no live regenerate, no live download. All future
// actions are honestly disabled.
//
// IMPORTANT: This component never injects raw HTML. Every preview
// body is rendered as escaped text inside a <pre> or paragraph; HTML
// mode is presented as inspect-only source so operator-supplied HTML
// can never execute.
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
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';
import type {
  DeliverableViewerAction,
  DeliverableViewerActionKey,
  DeliverableViewerEvidenceStatus,
  DeliverableViewerRenderMode,
  DeliverableViewerView,
} from '@/lib/programs/deliverable-canvas-view';

export interface DeliverableCanvasViewerProps {
  view: DeliverableViewerView;
}

export function DeliverableCanvasViewer({ view }: DeliverableCanvasViewerProps) {
  return (
    <article
      data-deliverable-canvas-viewer="pdel7"
      data-deliverable-artifact-id={view.artifactId}
      data-deliverable-render-mode={view.renderMode}
      data-deliverable-generation-label={view.generationLabel}
      aria-label="Deliverable canvas viewer"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        fontFamily: FONT.body,
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ViewerHeader view={view} />
      <ViewerMetaRow view={view} />
      <MissingInputsCallout missingInputs={view.missingInputs} />
      <PreviewBody view={view} />
      <ActionsRow actions={view.disabledActions} />
      <ViewerFooter disclaimer={view.honestDisclaimer} />
    </article>
  );
}

// --- Header ---------------------------------------------------------

function ViewerHeader({ view }: { view: DeliverableViewerView }) {
  return (
    <header
      style={{
        padding: `${SPACING.md}px ${SPACING.lg}px`,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
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
        PDEL7 · Deliverable canvas viewer
      </span>
      <h3
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: COLORS.ink,
          lineHeight: 1.3,
        }}
      >
        {view.title}
      </h3>
    </header>
  );
}

// --- Meta row -------------------------------------------------------

function ViewerMetaRow({ view }: { view: DeliverableViewerView }) {
  return (
    <div
      style={{
        padding: `${SPACING.sm + 2}px ${SPACING.lg}px`,
        borderBottom: BORDER.hairlineSoft,
        background: COLORS.surface,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap',
      }}
    >
      <MonoChip label={view.phase} />
      <MonoChip label={view.artifactType} />
      <RenderModePill mode={view.renderMode} />
      <StatusPill status={view.status} />
      <GenerationPill label={view.generationLabel} />
      <EvidenceStatusBadge status={view.evidenceStatus} />
      <VersionLabel versionLabel={view.versionLabel} />
    </div>
  );
}

function MonoChip({ label }: { label: string }) {
  return (
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
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: DeliverableViewerView['status'] }) {
  return (
    <span
      data-deliverable-status={status}
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.navy,
        background: COLORS.navySoft,
        border: `1px solid ${COLORS.navy}33`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

function statusLabel(status: DeliverableViewerView['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'in_review':
      return 'In review';
    case 'signed_off':
      return 'Signed off';
    case 'archived':
      return 'Archived';
    case 'pending':
      return 'Pending';
  }
}

function GenerationPill({
  label,
}: {
  label: DeliverableViewerView['generationLabel'];
}) {
  const text = label === 'generated' ? 'Generated' : 'Uploaded';
  return (
    <span
      data-deliverable-generation={label}
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        background: COLORS.surface2,
        border: `1px solid ${COLORS.borderSoft}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function EvidenceStatusBadge({
  status,
}: {
  status: DeliverableViewerEvidenceStatus;
}) {
  const chipState =
    status === 'usable' ? 'usable_as_evidence' : 'partial';
  return (
    <span data-deliverable-evidence-status={status}>
      <EvidenceChip state={chipState} />
    </span>
  );
}

function VersionLabel({ versionLabel }: { versionLabel: string | null }) {
  if (!versionLabel) {
    return (
      <span
        data-deliverable-version="none"
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Version · not yet tracked
      </span>
    );
  }
  return (
    <span
      data-deliverable-version="present"
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.muted,
      }}
    >
      Version · {versionLabel}
    </span>
  );
}

// --- Missing-inputs callout -----------------------------------------

function MissingInputsCallout({ missingInputs }: { missingInputs: string[] }) {
  if (missingInputs.length === 0) {
    return (
      <div
        data-deliverable-missing-inputs="0"
        style={{
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        Missing inputs · none
      </div>
    );
  }
  return (
    <aside
      role="note"
      aria-label="Missing inputs for this deliverable"
      data-deliverable-missing-inputs={missingInputs.length}
      style={{
        padding: `${SPACING.sm + 2}px ${SPACING.lg}px`,
        background: COLORS.redSoft,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
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

// --- Preview body ---------------------------------------------------
//
// IMPORTANT: We never inject raw HTML into the DOM. The HTML render mode
// surfaces the deterministic seed body as inspect-only escaped source so
// operator-supplied content can never execute. The markdown render mode
// renders the seed body as a <pre> block. The rich-text placeholder
// renders a single italic caption.

function PreviewBody({ view }: { view: DeliverableViewerView }) {
  if (view.renderMode === 'html') {
    return (
      <section
        data-deliverable-preview-mode="html"
        style={{
          padding: SPACING.lg,
          background: COLORS.surface2,
          borderBottom: BORDER.hairlineSoft,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          HTML source · escaped (live HTML render is deferred)
        </span>
        <pre
          style={{
            margin: 0,
            padding: SPACING.md,
            background: COLORS.card,
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
          {view.previewBody}
        </pre>
      </section>
    );
  }
  if (view.renderMode === 'markdown') {
    return (
      <section
        data-deliverable-preview-mode="markdown"
        style={{
          padding: SPACING.lg,
          background: COLORS.surface2,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: SPACING.md,
            background: COLORS.card,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.md,
            fontFamily: FONT.mono,
            fontSize: 12,
            lineHeight: 1.55,
            color: COLORS.body,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {view.previewBody}
        </pre>
      </section>
    );
  }
  return (
    <section
      data-deliverable-preview-mode="rich_text_placeholder"
      style={{
        padding: SPACING.lg,
        background: COLORS.surface2,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          padding: SPACING.md,
          background: COLORS.card,
          border: `1px dashed ${COLORS.border}`,
          borderRadius: RADIUS.md,
          fontSize: 12,
          fontStyle: 'italic',
          color: COLORS.muted,
          textAlign: 'center',
        }}
      >
        {view.previewBody}
      </div>
    </section>
  );
}

// --- Actions --------------------------------------------------------

function ActionsRow({ actions }: { actions: DeliverableViewerAction[] }) {
  return (
    <div
      role="group"
      aria-label="Deliverable actions (deferred — not yet available)"
      style={{
        padding: `${SPACING.sm + 2}px ${SPACING.lg}px`,
        display: 'flex',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        borderBottom: BORDER.hairlineSoft,
      }}
    >
      {actions.map((action) => (
        <ActionButton key={action.key} action={action} />
      ))}
    </div>
  );
}

function ActionButton({ action }: { action: DeliverableViewerAction }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
      }}
      data-deliverable-action={action.key}
      data-deliverable-action-enabled={action.enabled ? 'true' : 'false'}
      data-deliverable-action-future-label={action.futureLabel}
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
        {actionLabel(action.key)} · not yet available
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
        {action.futureLabel} · {action.reason}
      </span>
    </span>
  );
}

function actionLabel(key: DeliverableViewerActionKey): string {
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

function RenderModePill({ mode }: { mode: DeliverableViewerRenderMode }) {
  const tone = renderModeTone(mode);
  return (
    <span
      data-deliverable-render-mode-pill={mode}
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

function renderModeTone(mode: DeliverableViewerRenderMode): {
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

function renderModeLabel(mode: DeliverableViewerRenderMode): string {
  switch (mode) {
    case 'html':
      return 'HTML';
    case 'markdown':
      return 'Markdown';
    case 'rich_text_placeholder':
      return 'Rich text · later';
  }
}

// --- Footer ---------------------------------------------------------

function ViewerFooter({ disclaimer }: { disclaimer: string }) {
  return (
    <footer
      data-deliverable-canvas-viewer-disclaimer="deterministic_deliverable_view_seed"
      style={{
        padding: `${SPACING.sm}px ${SPACING.lg}px`,
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.mutedSoft,
      }}
    >
      {disclaimer}
    </footer>
  );
}
