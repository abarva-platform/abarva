'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = 'vendor-selection' | 'renewal' | 'consolidation' | 'spot-buy';

interface VendorRow {
  name: string;
  contact: string;
  notes: string;
}

interface FormState {
  eventName: string;
  eventType: EventType | '';
  linkedProgram: string;
  estimatedValue: string;
  vendors: VendorRow[];
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: '1 · Event details' },
  { label: '2 · Vendors' },
  { label: '3 · Confirm' },
];

function StepPill({ label, status }: { label: string; status: 'active' | 'complete' | 'pending' }) {
  const style: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 11,
    borderRadius: 999,
    padding: '4px 12px',
    whiteSpace: 'nowrap',
    ...(status === 'active'
      ? { background: SHELL.INK, color: SHELL.PAPER }
      : status === 'complete'
      ? { background: SHELL.MINT_BG, color: SHELL.MINT_TEXT }
      : { background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT }),
  };
  return <span style={style}>{label}</span>;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? undefined : 1 }}>
          <StepPill
            label={step.label}
            status={i < currentStep ? 'complete' : i === currentStep ? 'active' : 'pending'}
          />
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: SHELL.GRAY_LINE, margin: '0 8px', minWidth: 16 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Nexus advisory box ─────────────────────────────────────────────────────────

function NexusAdvisory() {
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        borderRadius: 8,
        padding: '12px 16px',
        maxWidth: 280,
        float: 'right',
        marginLeft: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK, letterSpacing: '0.12em', marginBottom: 6 }}>
        NEXUS
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        A new source event will open at Stage 1: Plan. You can link it to a program to align vendor decisions with CDP scope.
      </div>
    </div>
  );
}

// ── Field components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: SHELL.INK_MUTED,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 6,
  padding: '8px 12px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  color: SHELL.INK,
};

function TextInput({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputBase, border: `1px solid ${hasError ? SHELL.RUST_TEXT : SHELL.CARD_LINE}` }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hasError?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputBase, border: `1px solid ${hasError ? SHELL.RUST_TEXT : SHELL.CARD_LINE}` }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RequiredMessage() {
  return (
    <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.RUST_TEXT, marginTop: 4 }}>
      Required
    </div>
  );
}

// ── Event type button group ────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'vendor-selection', label: 'Vendor selection' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'consolidation', label: 'Consolidation' },
  { value: 'spot-buy', label: 'Spot buy' },
];

function EventTypeGroup({
  value,
  onChange,
  hasError,
}: {
  value: EventType | '';
  onChange: (v: EventType) => void;
  hasError?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {EVENT_TYPE_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                padding: '6px 14px',
                borderRadius: 6,
                border: active ? 'none' : `1px solid ${hasError ? SHELL.RUST_TEXT : SHELL.CARD_LINE}`,
                background: active ? SHELL.INK : SHELL.CARD_WHITE,
                color: active ? SHELL.PAPER : SHELL.INK_SOFT,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hasError && <RequiredMessage />}
    </div>
  );
}

// ── Nav buttons ────────────────────────────────────────────────────────────────

function NavButton({
  children,
  onClick,
  variant = 'filled',
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'filled' | 'ghost' | 'link';
}) {
  if (variant === 'link') {
    return (
      <a
        href="/source"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          textDecoration: 'none',
          padding: '8px 0',
          cursor: 'pointer',
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 11,
        padding: '9px 20px',
        borderRadius: 6,
        border: variant === 'filled' ? 'none' : `1px solid ${SHELL.CARD_LINE}`,
        background: variant === 'filled' ? SHELL.INK : 'transparent',
        color: variant === 'filled' ? SHELL.PAPER : SHELL.INK_SOFT,
        cursor: 'pointer',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </button>
  );
}

// ── Step 1: Event details ──────────────────────────────────────────────────────

interface Step1Errors {
  eventName?: boolean;
  eventType?: boolean;
}

function Step1(props: {
  form: FormState;
  errors: Step1Errors;
  onChange: (patch: Partial<FormState>) => void;
  onContinue: () => void;
}) {
  const { form, errors, onChange, onContinue } = props;

  const PROGRAM_OPTIONS = [
    { value: '', label: '— None —' },
    { value: 'APX-CDP-2026', label: 'APX-CDP-2026' },
    { value: 'APX-CC-2026', label: 'APX-CC-2026' },
    { value: 'APX-SAP-2026', label: 'APX-SAP-2026' },
  ];

  return (
    <div>
      <NexusAdvisory />

      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Event name</FieldLabel>
        <TextInput
          value={form.eventName}
          onChange={(v) => onChange({ eventName: v })}
          placeholder="e.g. Q3 Cloud Infrastructure Sourcing"
          hasError={errors.eventName}
        />
        {errors.eventName && <RequiredMessage />}
      </div>

      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Event type</FieldLabel>
        <EventTypeGroup
          value={form.eventType}
          onChange={(v) => onChange({ eventType: v })}
          hasError={errors.eventType}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Linked program</FieldLabel>
        <SelectInput
          value={form.linkedProgram}
          onChange={(v) => onChange({ linkedProgram: v })}
          options={PROGRAM_OPTIONS}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Estimated value</FieldLabel>
        <TextInput
          value={form.estimatedValue}
          onChange={(v) => onChange({ estimatedValue: v })}
          placeholder="e.g. $2.4M"
        />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 32, clear: 'both' }}>
        <a
          href="/source"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            padding: '9px 0',
          }}
        >
          ← Cancel
        </a>
        <NavButton onClick={onContinue}>Continue →</NavButton>
      </div>
    </div>
  );
}

// ── Step 2: Vendors ────────────────────────────────────────────────────────────

interface Step2Errors {
  vendors?: boolean;
}

function Step2(props: {
  form: FormState;
  errors: Step2Errors;
  onChange: (patch: Partial<FormState>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { form, errors, onChange, onBack, onContinue } = props;

  const [newVendorName, setNewVendorName] = useState('');

  function updateVendor(idx: number, patch: Partial<VendorRow>) {
    const updated = form.vendors.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    onChange({ vendors: updated });
  }

  function removeVendor(idx: number) {
    onChange({ vendors: form.vendors.filter((_, i) => i !== idx) });
  }

  function addVendor() {
    if (!newVendorName.trim()) return;
    onChange({ vendors: [...form.vendors, { name: newVendorName.trim(), contact: '', notes: '' }] });
    setNewVendorName('');
  }

  function addBlankVendor() {
    onChange({ vendors: [...form.vendors, { name: '', contact: '', notes: '' }] });
  }

  return (
    <div>
      {/* Add vendor row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={newVendorName}
          onChange={(e) => setNewVendorName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addVendor(); }}
          placeholder="Vendor name"
          style={{ ...inputBase, flex: 1 }}
        />
        <button
          type="button"
          onClick={addVendor}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: SHELL.INK,
            color: SHELL.PAPER,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>

      {errors.vendors && (
        <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.RUST_TEXT, marginBottom: 12 }}>
          Add at least one vendor to continue
        </div>
      )}

      {/* Vendor list */}
      {form.vendors.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {form.vendors.map((vendor, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 10,
                alignItems: 'start',
              }}
            >
              <div>
                {idx === 0 && <FieldLabel>Name</FieldLabel>}
                <input
                  type="text"
                  value={vendor.name}
                  onChange={(e) => updateVendor(idx, { name: e.target.value })}
                  placeholder="Vendor name"
                  style={{
                    ...inputBase,
                    border: `1px solid ${errors.vendors && !vendor.name.trim() ? SHELL.RUST_TEXT : SHELL.CARD_LINE}`,
                  }}
                />
              </div>
              <div>
                {idx === 0 && <FieldLabel>Contact email</FieldLabel>}
                <input
                  type="text"
                  value={vendor.contact}
                  onChange={(e) => updateVendor(idx, { contact: e.target.value })}
                  placeholder="contact@vendor.com"
                  style={inputBase}
                />
              </div>
              <div>
                {idx === 0 && <FieldLabel>Notes</FieldLabel>}
                <input
                  type="text"
                  value={vendor.notes}
                  onChange={(e) => updateVendor(idx, { notes: e.target.value })}
                  placeholder="Optional notes"
                  style={inputBase}
                />
              </div>
              <div style={{ paddingTop: idx === 0 ? 22 : 0 }}>
                <button
                  type="button"
                  onClick={() => removeVendor(idx)}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 12,
                    border: 'none',
                    background: 'transparent',
                    color: SHELL.INK_MUTED,
                    cursor: 'pointer',
                    padding: '8px 4px',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add another vendor link */}
      <button
        type="button"
        onClick={addBlankVendor}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 24,
          textDecoration: 'underline',
        }}
      >
        + Add another vendor
      </button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <NavButton onClick={onBack} variant="ghost">← Back</NavButton>
        <NavButton onClick={onContinue}>Continue →</NavButton>
      </div>
    </div>
  );
}

// ── Step 3: Confirm ────────────────────────────────────────────────────────────

function Step3(props: {
  form: FormState;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { form, onBack, onSubmit } = props;

  const eventTypeLabel =
    EVENT_TYPE_OPTIONS.find((o) => o.value === form.eventType)?.label ?? form.eventType;

  return (
    <div>
      {/* Event name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 18,
          color: SHELL.INK,
          marginBottom: 16,
          fontWeight: 'normal',
        }}
      >
        {form.eventName || '—'}
      </div>

      {/* Type + program */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {form.eventType && (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              background: SHELL.GRAY_BG,
              color: SHELL.GRAY_TEXT,
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            {eventTypeLabel}
          </span>
        )}
        {form.linkedProgram && (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              background: SHELL.MINT_BG,
              color: SHELL.MINT_TEXT,
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            ↗ {form.linkedProgram}
          </span>
        )}
      </div>

      {/* Estimated value */}
      {form.estimatedValue && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: SHELL.INK_MUTED,
              marginBottom: 4,
            }}
          >
            Estimated value
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>
            {form.estimatedValue}
          </div>
        </div>
      )}

      {/* Vendors */}
      {form.vendors.filter((v) => v.name.trim()).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Vendors
          </div>
          {form.vendors
            .filter((v) => v.name.trim())
            .map((v, idx) => (
              <div
                key={idx}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_SOFT,
                  marginBottom: 4,
                  display: 'flex',
                  gap: 12,
                }}
              >
                <span>{v.name}</span>
                {v.contact && <span style={{ color: SHELL.INK_MUTED }}>{v.contact}</span>}
                {v.notes && <span style={{ color: SHELL.INK_MUTED }}>{v.notes}</span>}
              </div>
            ))}
        </div>
      )}

      {/* Create CTA */}
      <button
        type="button"
        onClick={onSubmit}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 12,
          letterSpacing: '0.06em',
          background: SHELL.INK,
          color: SHELL.PAPER,
          border: 'none',
          borderRadius: 6,
          padding: '12px 24px',
          width: '100%',
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        Create source event →
      </button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <NavButton onClick={onBack} variant="ghost">← Back</NavButton>
      </div>
    </div>
  );
}

// ── Success state ──────────────────────────────────────────────────────────────

function SuccessState() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.MINT_TEXT,
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        ✓ Source event created — Nexus has opened the event in Stage 1: Plan
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a
          href="/source"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.MINT_TEXT,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          → View event
        </a>
        <a
          href="/source"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          → Return to Source
        </a>
      </div>
    </div>
  );
}

// ── Main wizard component ──────────────────────────────────────────────────────

const STEP_TITLES = ['Event details', 'Vendors', 'Confirm'];

export function SourceOriginatePage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<FormState>({
    eventName: '',
    eventType: '',
    linkedProgram: '',
    estimatedValue: '',
    vendors: [{ name: '', contact: '', notes: '' }],
  });

  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleStep1Continue() {
    const errors: Step1Errors = {};
    if (!form.eventName.trim()) errors.eventName = true;
    if (!form.eventType) errors.eventType = true;
    if (Object.keys(errors).length > 0) {
      setStep1Errors(errors);
      return;
    }
    setStep1Errors({});
    setStep(1);
  }

  function handleStep2Continue() {
    const hasNamedVendor = form.vendors.some((v) => v.name.trim());
    if (!hasNamedVendor) {
      setStep2Errors({ vendors: true });
      return;
    }
    setStep2Errors({});
    setStep(2);
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · New event',
      }}
    >
      {/* Full-width work pane */}
      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '40px 60px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

          {/* Page heading */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: SHELL.INK_MUTED,
                marginBottom: 6,
              }}
            >
              Originate source event
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 22,
                fontWeight: 'normal',
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {STEP_TITLES[step]}
            </h1>
          </div>

          <StepIndicator currentStep={step} />

          {submitted ? (
            <SuccessState />
          ) : step === 0 ? (
            <Step1
              form={form}
              errors={step1Errors}
              onChange={patchForm}
              onContinue={handleStep1Continue}
            />
          ) : step === 1 ? (
            <Step2
              form={form}
              errors={step2Errors}
              onChange={patchForm}
              onBack={() => setStep(0)}
              onContinue={handleStep2Continue}
            />
          ) : (
            <Step3
              form={form}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
