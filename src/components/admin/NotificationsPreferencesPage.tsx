'use client';

/**
 * NotificationsPreferencesPage · W4-PR-4
 *
 * Per-user notification preferences matrix. Surfaced at
 * `/admin/users-access/notifications` under the Steward shell.
 *
 * Shape:
 *   - Header (eyebrow + title come from the page-level EditorialCanvas).
 *   - Tenant context strip.
 *   - One fieldset per source module (Setup, Moves, Source, Intelligence,
 *     Tower, System). Each row in a fieldset corresponds to one event
 *     type and shows: name, description, channel segmented control,
 *     frequency dropdown, default chip, and (when mandatory) a lock
 *     icon plus "mandatory · cannot disable" copy.
 *   - Quiet hours + daily cap + timezone pickers below the matrix.
 *   - Per-channel "Send test" buttons (email · in-app) that dispatch a
 *     scoped test event via the `sendTest` server action.
 *   - Save / Cancel footer with the last-saved timestamp.
 *
 * Empty state:
 *   - When `existingPreferences` is empty, the matrix renders read-only
 *     with the registry defaults and a single primary "Apply defaults
 *     for my role" button. Clicking it calls `seedDefaultsAction` (a
 *     server action passed in via `actions`) and reloads.
 *
 * Design system:
 *   - Locked palette only: ink / navy / cream / white / skyPale /
 *     mintSoft / amberSoft / coralSoft.
 *   - Georgia (TYPOGRAPHY.serif) for the matrix headings, DM Sans
 *     (sans) for body, JetBrains Mono (mono) for the eyebrow + event
 *     type code.
 *   - No emoji. No teal / purple / magenta (banned).
 *
 * Boundary:
 *   - This component never imports from `@/lib/data-plane`. All reads
 *     are handed in via props from the server page; all writes go
 *     through the server actions imported from `_actions/*`.
 */

import { useMemo, useState, useTransition } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  NotificationChannel,
  NotificationFrequency,
  NotificationPreferenceRow,
  NotificationSourceModule,
} from '@/lib/admin/broker/notifications-types';
import type { NotificationRegistryEntry } from '@/lib/admin/broker/notifications-registry';

const MODULE_LABELS: Record<NotificationSourceModule, string> = {
  setup: 'Setup',
  moves: 'Moves',
  source: 'Source',
  intelligence: 'Intelligence',
  tower: 'Tower',
  system: 'System',
};

const MODULE_SUBTITLES: Record<NotificationSourceModule, string> = {
  setup: 'Substrate, auth, governance',
  moves: 'Programs, gates, approvals',
  source: 'Sentinel evidence',
  intelligence: 'Patterns and moves',
  tower: 'Operations and DORA',
  system: 'Digests and platform health',
};

const CHANNEL_OPTIONS: ReadonlyArray<{
  value: NotificationChannel;
  label: string;
}> = [
  { value: 'email', label: 'Email' },
  { value: 'in_app', label: 'In-app' },
  { value: 'none', label: 'None' },
];

const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: NotificationFrequency;
  label: string;
}> = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'digest_daily', label: 'Daily digest' },
  { value: 'digest_weekly', label: 'Weekly digest' },
  { value: 'none', label: 'Off' },
];

export interface NotificationsPreferencesPageProps {
  tenantName: string;
  tenantSlug: string;
  /** Clerk user id of the viewer. Used by the server actions. */
  userId: string;
  /** Persona label (e.g. "CIO at Apex Retail"). */
  personaLabel: string;
  /** Registry grouped by source module. Server-resolved. */
  registryByModule: ReadonlyArray<{
    module: NotificationSourceModule;
    entries: readonly NotificationRegistryEntry[];
  }>;
  /** Existing preference rows for the viewer (may be empty). */
  existingPreferences: readonly NotificationPreferenceRow[];
  /** Mandatory event types pinned on the viewer by admins. */
  mandatoryEventTypes: readonly string[];
  /** ISO timestamp of the most recent updated_at, or null if no rows exist yet. */
  lastSavedAt: string | null;
  /** Server-action callbacks. */
  actions: {
    savePreferences: (input: SavePreferencesInput) => Promise<SavePreferencesResult>;
    seedDefaults: () => Promise<SeedDefaultsResult>;
    sendTest: (channel: 'email' | 'in_app') => Promise<SendTestResult>;
  };
}

export interface PreferenceFormRow {
  event_type: string;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  daily_cap: number;
}

export interface SavePreferencesInput {
  rows: PreferenceFormRow[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  dailyCap: number;
}

export type SavePreferencesResult =
  | { ok: true; savedAt: string; count: number }
  | { ok: false; code: string; message: string };

export type SeedDefaultsResult =
  | { ok: true; count: number }
  | { ok: false; message: string };

export type SendTestResult =
  | { ok: true; status: 'queued' | 'sent' | 'suppressed' }
  | { ok: false; message: string };

type RowState = {
  channel: NotificationChannel;
  frequency: NotificationFrequency;
};

export function NotificationsPreferencesPage(props: NotificationsPreferencesPageProps) {
  const {
    tenantName,
    personaLabel,
    registryByModule,
    existingPreferences,
    mandatoryEventTypes,
    lastSavedAt,
    actions,
  } = props;

  const hasPreferences = existingPreferences.length > 0;

  // Build initial form state from existing rows OR registry defaults.
  const initialRows = useMemo(() => {
    const map: Record<string, RowState> = {};
    for (const group of registryByModule) {
      for (const entry of group.entries) {
        const existing = existingPreferences.find((p) => p.event_type === entry.eventType);
        if (existing) {
          map[entry.eventType] = {
            channel: existing.channel,
            frequency: existing.frequency,
          };
        } else {
          map[entry.eventType] = {
            channel: entry.defaultChannel,
            frequency: entry.defaultFrequency,
          };
        }
      }
    }
    return map;
  }, [registryByModule, existingPreferences]);

  const [rows, setRows] = useState<Record<string, RowState>>(initialRows);

  const firstRow = existingPreferences[0];
  const [quietStart, setQuietStart] = useState<string>(
    firstRow?.quiet_hours_start ? firstRow.quiet_hours_start.slice(0, 5) : '',
  );
  const [quietEnd, setQuietEnd] = useState<string>(
    firstRow?.quiet_hours_end ? firstRow.quiet_hours_end.slice(0, 5) : '',
  );
  const [timezone, setTimezone] = useState<string>(firstRow?.timezone ?? 'UTC');
  const [dailyCap, setDailyCap] = useState<number>(firstRow?.daily_cap ?? 20);

  const [savedAt, setSavedAt] = useState<string | null>(lastSavedAt);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});

  function setChannel(eventType: string, channel: NotificationChannel) {
    setRows((prev) => ({
      ...prev,
      [eventType]: {
        ...(prev[eventType] ?? { channel, frequency: 'immediate' }),
        channel,
        // If user sets channel to 'none', clamp frequency to 'none'.
        frequency: channel === 'none' ? 'none' : prev[eventType]?.frequency ?? 'immediate',
      },
    }));
  }

  function setFrequency(eventType: string, frequency: NotificationFrequency) {
    setRows((prev) => ({
      ...prev,
      [eventType]: {
        ...(prev[eventType] ?? { channel: 'in_app', frequency }),
        frequency,
      },
    }));
  }

  function handleSave() {
    setFeedback(null);
    const payload: SavePreferencesInput = {
      rows: Object.entries(rows).map(([event_type, r]) => ({
        event_type,
        channel: r.channel,
        frequency: r.frequency,
        quiet_hours_start: quietStart ? `${quietStart}:00` : null,
        quiet_hours_end: quietEnd ? `${quietEnd}:00` : null,
        timezone: timezone || 'UTC',
        daily_cap: dailyCap,
      })),
      quietHoursStart: quietStart ? `${quietStart}:00` : null,
      quietHoursEnd: quietEnd ? `${quietEnd}:00` : null,
      timezone: timezone || 'UTC',
      dailyCap,
    };
    startTransition(async () => {
      const result = await actions.savePreferences(payload);
      if (result.ok) {
        setSavedAt(result.savedAt);
        setFeedback({ tone: 'ok', message: `Saved ${result.count} preferences.` });
      } else {
        setFeedback({ tone: 'error', message: result.message });
      }
    });
  }

  function handleApplyDefaults() {
    setFeedback(null);
    startTransition(async () => {
      const result = await actions.seedDefaults();
      if (result.ok) {
        setFeedback({ tone: 'ok', message: `Defaults applied (${result.count} rows). Refresh to see them.` });
      } else {
        setFeedback({ tone: 'error', message: result.message });
      }
    });
  }

  function handleTest(channel: 'email' | 'in_app') {
    setTestStatus((prev) => ({ ...prev, [channel]: 'sending…' }));
    startTransition(async () => {
      const result = await actions.sendTest(channel);
      if (result.ok) {
        setTestStatus((prev) => ({ ...prev, [channel]: `dispatched (${result.status})` }));
      } else {
        setTestStatus((prev) => ({ ...prev, [channel]: `failed: ${result.message}` }));
      }
    });
  }

  return (
    <div data-notifications-preferences-page="true" style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>
      <TenantContextStrip tenantName={tenantName} personaLabel={personaLabel} />

      {!hasPreferences && (
        <EmptyStateBanner pending={pending} onApply={handleApplyDefaults} />
      )}

      {registryByModule.map((group) => (
        <ModuleFieldset
          key={group.module}
          module={group.module}
          entries={group.entries}
          rows={rows}
          mandatoryEventTypes={mandatoryEventTypes}
          onChannel={setChannel}
          onFrequency={setFrequency}
          readOnly={!hasPreferences}
        />
      ))}

      <QuietHoursAndCap
        quietStart={quietStart}
        quietEnd={quietEnd}
        timezone={timezone}
        dailyCap={dailyCap}
        onQuietStart={setQuietStart}
        onQuietEnd={setQuietEnd}
        onTimezone={setTimezone}
        onDailyCap={setDailyCap}
        disabled={!hasPreferences}
      />

      <TestSendStrip onTest={handleTest} statuses={testStatus} disabled={!hasPreferences || pending} />

      <PreferencesFooter
        savedAt={savedAt}
        feedback={feedback}
        onSave={handleSave}
        onCancel={() => {
          setRows(initialRows);
          setFeedback({ tone: 'ok', message: 'Reverted unsaved changes.' });
        }}
        pending={pending}
        disabled={!hasPreferences}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TenantContextStrip({ tenantName, personaLabel }: { tenantName: string; personaLabel: string }) {
  return (
    <section
      data-tenant-context-strip="true"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        gap: SPACING.lg,
        alignItems: 'center',
        flexWrap: 'wrap',
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <Eyebrow>Workspace</Eyebrow>
      <div style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 20, color: COLORS.ink, fontWeight: 700 }}>
        {tenantName}
      </div>
      <div style={{ fontSize: 13, color: `${COLORS.ink}99`, fontFamily: TYPOGRAPHY.mono }}>
        {personaLabel}
      </div>
    </section>
  );
}

function EmptyStateBanner({ pending, onApply }: { pending: boolean; onApply: () => void }) {
  return (
    <section
      data-empty-state-banner="true"
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <Eyebrow tone="amber">No preferences set</Eyebrow>
      <p style={{ margin: 0, fontFamily: TYPOGRAPHY.serif, fontSize: 22, color: COLORS.ink, lineHeight: 1.3 }}>
        You haven&apos;t configured notification preferences yet.
      </p>
      <p style={{ margin: 0, fontSize: 14, color: `${COLORS.ink}cc`, lineHeight: 1.55, maxWidth: 720 }}>
        The matrix below shows the registry defaults per Spine §3. Apply the role defaults to start
        receiving notifications, then fine-tune each row.
      </p>
      <div>
        <button
          type="button"
          onClick={onApply}
          disabled={pending}
          data-action="apply-defaults"
          style={primaryButtonStyle(pending)}
        >
          {pending ? 'Applying…' : 'Apply defaults for my role'}
        </button>
      </div>
    </section>
  );
}

function ModuleFieldset({
  module,
  entries,
  rows,
  mandatoryEventTypes,
  onChannel,
  onFrequency,
  readOnly,
}: {
  module: NotificationSourceModule;
  entries: readonly NotificationRegistryEntry[];
  rows: Record<string, RowState>;
  mandatoryEventTypes: readonly string[];
  onChannel: (eventType: string, channel: NotificationChannel) => void;
  onFrequency: (eventType: string, frequency: NotificationFrequency) => void;
  readOnly: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <section
      data-module-fieldset={module}
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
        <Eyebrow>{MODULE_SUBTITLES[module]}</Eyebrow>
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 26,
            color: COLORS.ink,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {MODULE_LABELS[module]}
        </h2>
      </header>
      <ul
        data-module-rows
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}
      >
        {entries.map((entry, idx) => {
          const state = rows[entry.eventType] ?? {
            channel: entry.defaultChannel,
            frequency: entry.defaultFrequency,
          };
          const mandatory = mandatoryEventTypes.includes(entry.eventType);
          return (
            <li
              key={entry.eventType}
              data-event-row={entry.eventType}
              data-mandatory={mandatory ? 'true' : 'false'}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 2fr) minmax(220px, 1.4fr) minmax(160px, 1fr)',
                gap: SPACING.md,
                padding: `${SPACING.md} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                alignItems: 'flex-start',
                fontFamily: TYPOGRAPHY.sans,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: COLORS.navy,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {entry.eventType}
                  </span>
                  {mandatory && <LockChip />}
                  <SeverityChip severity={entry.severity} />
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 18,
                    color: COLORS.ink,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {entry.label}
                </div>
                <div style={{ fontSize: 13, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}>
                  {entry.description}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                  }}
                  data-default-hint
                >
                  default: {channelLabel(entry.defaultChannel)} · {frequencyLabel(entry.defaultFrequency)}
                </div>
              </div>

              <div data-channel-control>
                <ChannelSegmented
                  value={state.channel}
                  mandatory={mandatory}
                  disabled={readOnly}
                  onChange={(next) => onChannel(entry.eventType, next)}
                />
                {mandatory && (
                  <p
                    style={{
                      margin: `${SPACING.xs} 0 0`,
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: `${COLORS.ink}88`,
                      fontStyle: 'italic',
                    }}
                  >
                    mandatory · cannot disable
                  </p>
                )}
              </div>

              <div data-frequency-control>
                {state.channel !== 'none' ? (
                  <FrequencyDropdown
                    value={state.frequency}
                    disabled={readOnly}
                    onChange={(next) => onFrequency(entry.eventType, next)}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      color: `${COLORS.ink}66`,
                    }}
                  >
                    n/a · channel disabled
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ChannelSegmented({
  value,
  mandatory,
  disabled,
  onChange,
}: {
  value: NotificationChannel;
  mandatory: boolean;
  disabled: boolean;
  onChange: (next: NotificationChannel) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Channel"
      data-channel-segmented
      style={{
        display: 'inline-flex',
        borderRadius: RADIUS.pill,
        border: `1px solid ${COLORS.ink}22`,
        overflow: 'hidden',
        background: COLORS.cream,
      }}
    >
      {CHANNEL_OPTIONS.map((opt) => {
        const active = opt.value === value;
        // For mandatory rows the 'none' option is locked out (the broker
        // also rejects it; we just shouldn't let the user click it).
        const locked = mandatory && opt.value === 'none';
        return (
          <button
            type="button"
            key={opt.value}
            data-channel-option={opt.value}
            aria-pressed={active}
            disabled={disabled || locked}
            onClick={() => onChange(opt.value)}
            style={{
              padding: `${SPACING.xs} ${SPACING.md}`,
              border: 'none',
              borderRight: opt.value !== 'none' ? `1px solid ${COLORS.ink}11` : 'none',
              background: active ? COLORS.ink : 'transparent',
              color: active ? COLORS.white : COLORS.ink,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              cursor: disabled || locked ? 'not-allowed' : 'pointer',
              opacity: locked ? 0.45 : 1,
              letterSpacing: '0.02em',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FrequencyDropdown({
  value,
  disabled,
  onChange,
}: {
  value: NotificationFrequency;
  disabled: boolean;
  onChange: (next: NotificationFrequency) => void;
}) {
  return (
    <select
      data-frequency-dropdown
      aria-label="Frequency"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as NotificationFrequency)}
      style={{
        appearance: 'none',
        padding: `${SPACING.xs} ${SPACING.md}`,
        border: `1px solid ${COLORS.ink}22`,
        borderRadius: RADIUS.md,
        background: COLORS.white,
        color: COLORS.ink,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        minWidth: 160,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {FREQUENCY_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function QuietHoursAndCap({
  quietStart,
  quietEnd,
  timezone,
  dailyCap,
  onQuietStart,
  onQuietEnd,
  onTimezone,
  onDailyCap,
  disabled,
}: {
  quietStart: string;
  quietEnd: string;
  timezone: string;
  dailyCap: number;
  onQuietStart: (v: string) => void;
  onQuietEnd: (v: string) => void;
  onTimezone: (v: string) => void;
  onDailyCap: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <section
      data-quiet-hours-and-cap="true"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header>
        <Eyebrow>Cadence guardrails</Eyebrow>
        <h2
          style={{
            margin: `${SPACING.xs} 0 0`,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            fontWeight: 700,
          }}
        >
          Quiet hours and daily cap
        </h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: SPACING.md,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <Field label="Quiet hours start">
          <input
            type="time"
            data-input="quiet-start"
            value={quietStart}
            disabled={disabled}
            onChange={(e) => onQuietStart(e.target.value)}
            style={inputStyle(disabled)}
          />
        </Field>
        <Field label="Quiet hours end">
          <input
            type="time"
            data-input="quiet-end"
            value={quietEnd}
            disabled={disabled}
            onChange={(e) => onQuietEnd(e.target.value)}
            style={inputStyle(disabled)}
          />
        </Field>
        <Field label="Timezone">
          <input
            type="text"
            data-input="timezone"
            value={timezone}
            disabled={disabled}
            placeholder="UTC"
            onChange={(e) => onTimezone(e.target.value)}
            style={inputStyle(disabled)}
          />
        </Field>
        <Field label="Daily cap (1–200)">
          <input
            type="number"
            data-input="daily-cap"
            min={1}
            max={200}
            value={dailyCap}
            disabled={disabled}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isFinite(n)) onDailyCap(n);
            }}
            style={inputStyle(disabled)}
          />
        </Field>
      </div>
    </section>
  );
}

function TestSendStrip({
  onTest,
  statuses,
  disabled,
}: {
  onTest: (channel: 'email' | 'in_app') => void;
  statuses: Record<string, string>;
  disabled: boolean;
}) {
  return (
    <section
      data-test-send-strip="true"
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header>
        <Eyebrow tone="navy">Test send</Eyebrow>
        <h2
          style={{
            margin: `${SPACING.xs} 0 0`,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            fontWeight: 700,
          }}
        >
          Confirm a channel reaches you
        </h2>
        <p style={{ margin: `${SPACING.xs} 0 0`, fontSize: 13, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}>
          Dispatches a scoped <code style={{ fontFamily: TYPOGRAPHY.mono }}>system.health_alert</code> test
          event only to you. No other users receive it.
        </p>
      </header>
      <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap', fontFamily: TYPOGRAPHY.sans }}>
        {(['email', 'in_app'] as const).map((ch) => (
          <div
            key={ch}
            data-test-channel={ch}
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}
          >
            <button
              type="button"
              onClick={() => onTest(ch)}
              disabled={disabled}
              data-action={`test-${ch}`}
              style={ghostButtonStyle(disabled)}
            >
              Test {channelLabel(ch)}
            </button>
            <span
              data-test-status={ch}
              style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}99` }}
            >
              {statuses[ch] ?? 'idle'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreferencesFooter({
  savedAt,
  feedback,
  onSave,
  onCancel,
  pending,
  disabled,
}: {
  savedAt: string | null;
  feedback: { tone: 'ok' | 'error'; message: string } | null;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <footer
      data-preferences-footer="true"
      style={{
        display: 'flex',
        gap: SPACING.md,
        alignItems: 'center',
        flexWrap: 'wrap',
        paddingTop: SPACING.lg,
        borderTop: `1px solid ${COLORS.ink}10`,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
          Last saved
        </span>
        <span data-last-saved style={{ fontSize: 13, color: COLORS.ink }}>
          {savedAt ? new Date(savedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—'}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        {feedback && (
          <div
            data-feedback={feedback.tone}
            role="status"
            style={{
              padding: `${SPACING.xs} ${SPACING.md}`,
              borderRadius: RADIUS.pill,
              background: feedback.tone === 'ok' ? COLORS.mintSoft : COLORS.coralSoft,
              color: feedback.tone === 'ok' ? COLORS.mintInk : COLORS.coralInk,
              fontSize: 12,
              fontFamily: TYPOGRAPHY.mono,
              display: 'inline-block',
            }}
          >
            {feedback.message}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={pending || disabled}
        data-action="cancel"
        style={ghostButtonStyle(pending || disabled)}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={pending || disabled}
        data-action="save"
        style={primaryButtonStyle(pending || disabled)}
      >
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
    </footer>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function Eyebrow({ children, tone = 'navy' }: { children: React.ReactNode; tone?: 'navy' | 'amber' }) {
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: tone === 'amber' ? COLORS.amberInk : COLORS.navy,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function LockChip() {
  return (
    <span
      data-lock-chip
      title="Mandatory subscription"
      aria-label="Mandatory subscription"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 8px',
        borderRadius: RADIUS.pill,
        background: `${COLORS.ink}11`,
        color: COLORS.ink,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      LOCKED
    </span>
  );
}

function SeverityChip({ severity }: { severity: 'info' | 'warn' | 'critical' }) {
  const map: Record<'info' | 'warn' | 'critical', { bg: string; fg: string }> = {
    info: { bg: COLORS.skyPale, fg: COLORS.navy },
    warn: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
    critical: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
  };
  const palette = map[severity];
  return (
    <span
      data-severity-chip={severity}
      style={{
        padding: '1px 8px',
        borderRadius: RADIUS.pill,
        background: palette.bg,
        color: palette.fg,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {severity}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}99`,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: `${SPACING.xs} ${SPACING.md}`,
    border: `1px solid ${COLORS.ink}22`,
    borderRadius: RADIUS.md,
    background: COLORS.white,
    color: COLORS.ink,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    opacity: disabled ? 0.6 : 1,
  };
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: `${SPACING.sm} ${SPACING.lg}`,
    border: 'none',
    borderRadius: RADIUS.md,
    background: COLORS.ink,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.02em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  };
}

function ghostButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: `${SPACING.sm} ${SPACING.lg}`,
    border: `1px solid ${COLORS.ink}33`,
    borderRadius: RADIUS.md,
    background: 'transparent',
    color: COLORS.ink,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  };
}

function channelLabel(ch: NotificationChannel): string {
  switch (ch) {
    case 'email':
      return 'Email';
    case 'in_app':
      return 'In-app';
    case 'slack':
      return 'Slack';
    case 'teams':
      return 'Teams';
    case 'pagerduty':
      return 'PagerDuty';
    case 'webhook':
      return 'Webhook';
    case 'none':
      return 'None';
  }
}

function frequencyLabel(f: NotificationFrequency): string {
  switch (f) {
    case 'immediate':
      return 'Immediate';
    case 'digest_daily':
      return 'Daily digest';
    case 'digest_weekly':
      return 'Weekly digest';
    case 'none':
      return 'Off';
  }
}
