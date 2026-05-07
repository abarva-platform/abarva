'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';

// ── Sub-nav (same as SetupUsersPage) ─────────────────────────────────────────

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', href: '/admin/connectors' },
  { key: 'users', label: 'Users', active: true, href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
];

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { label: '1 · Email' },
  { label: '2 · Role & access' },
  { label: '3 · Message' },
  { label: '4 · Review' },
];

// ── Step indicator ────────────────────────────────────────────────────────────

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
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: i < STEPS.length - 1 ? undefined : 1,
          }}
        >
          <StepPill
            label={step.label}
            status={i < currentStep ? 'complete' : i === currentStep ? 'active' : 'pending'}
          />
          {i < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1,
                background: SHELL.GRAY_LINE,
                margin: '0 8px',
                minWidth: 16,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Role types and surface defaults ─────────────────────────────────────────

type Role = 'admin' | 'collaborator' | 'viewer';

const ALL_SURFACES = ['Programs', 'Source', 'Intelligence', 'Tower', 'Setup'];

function defaultSurfaces(role: Role): string[] {
  if (role === 'admin') return [...ALL_SURFACES];
  if (role === 'collaborator') return ['Programs', 'Source'];
  return ['Programs'];
}

// ── Nav buttons ───────────────────────────────────────────────────────────────

function NavButtons({
  step,
  onBack,
  onContinue,
  onCancel,
  continueLabel = 'Continue →',
  continueDisabled = false,
}: {
  step: number;
  onBack: () => void;
  onContinue: () => void;
  onCancel: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 32,
        paddingTop: 20,
        borderTop: '1px solid ' + SHELL.CARD_LINE,
      }}
    >
      {step > 0 && (
        <button
          onClick={onBack}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            background: 'transparent',
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 6,
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      )}
      <button
        onClick={onContinue}
        disabled={continueDisabled}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.PAPER,
          background: continueDisabled ? SHELL.INK_MUTED : SHELL.INK,
          border: 'none',
          borderRadius: 6,
          padding: '8px 20px',
          cursor: continueDisabled ? 'default' : 'pointer',
        }}
      >
        {continueLabel}
      </button>
      <div style={{ flex: 1 }} />
      <a
        href="/admin/users"
        onClick={onCancel}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          textDecoration: 'none',
        }}
      >
        Cancel
      </a>
    </div>
  );
}

// ── Step 1: Email address ─────────────────────────────────────────────────────

function Step1Email({
  email,
  onChange,
}: {
  email: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Email address
        </span>
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        placeholder="name@company.com"
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 14,
          padding: '12px 16px',
          width: '100%',
          boxSizing: 'border-box',
          background: SHELL.CARD_WHITE,
          border: '1px solid ' + SHELL.CARD_LINE,
          borderRadius: 8,
          color: SHELL.INK,
          outline: 'none',
        }}
      />

      {/* Steward advisory */}
      <div
        style={{
          background: SHELL.PAPER_SOFT,
          borderRadius: 8,
          padding: '12px 16px',
          marginTop: 16,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 6,
          }}
        >
          Steward
        </div>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          This person will receive an invitation email and must create a password to activate their
          account.
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Role & surface access ────────────────────────────────────────────

const ROLE_CARDS: { role: Role; name: string; description: string }[] = [
  { role: 'admin', name: 'Admin', description: 'Full access to all surfaces and settings' },
  {
    role: 'collaborator',
    name: 'Collaborator',
    description: 'Read and write access to selected surfaces',
  },
  { role: 'viewer', name: 'Viewer', description: 'Read-only access to selected surfaces' },
];

function Step2RoleAccess({
  role,
  onRoleChange,
  surfaces,
  onSurfacesChange,
}: {
  role: Role;
  onRoleChange: (r: Role) => void;
  surfaces: string[];
  onSurfacesChange: (s: string[]) => void;
}) {
  function toggleSurface(surface: string) {
    if (role === 'admin') return; // all locked for admin
    if (surfaces.includes(surface)) {
      onSurfacesChange(surfaces.filter((s) => s !== surface));
    } else {
      onSurfacesChange([...surfaces, surface]);
    }
  }

  return (
    <div>
      {/* Role cards */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Role
      </div>
      {ROLE_CARDS.map(({ role: r, name, description }) => {
        const selected = role === r;
        return (
          <div
            key={r}
            onClick={() => onRoleChange(r)}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: selected ? '1.5px solid ' + SHELL.INK : '1.5px solid ' + SHELL.CARD_LINE,
              background: selected ? SHELL.PAPER_DEEP : SHELL.CARD_WHITE,
              marginBottom: 8,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                fontWeight: 600,
                color: SHELL.INK,
                marginBottom: 2,
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: SHELL.INK_MUTED,
              }}
            >
              {description}
            </div>
          </div>
        );
      })}

      {/* Surface access */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        Surface access
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ALL_SURFACES.map((surface) => {
          const isSetup = surface === 'Setup';
          const isAdminRole = role === 'admin';
          const checked = isAdminRole ? true : surfaces.includes(surface);
          const disabled = isAdminRole || (isSetup && !isAdminRole);

          return (
            <button
              key={surface}
              onClick={() => !disabled && toggleSurface(surface)}
              disabled={disabled}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                borderRadius: 999,
                padding: '4px 12px',
                border: checked ? 'none' : '1px solid ' + SHELL.CARD_LINE,
                background: checked ? SHELL.MINT_BG : SHELL.CARD_WHITE,
                color: checked ? SHELL.MINT_TEXT : SHELL.GRAY_TEXT,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.7 : 1,
              }}
            >
              {surface}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 3: Personal message ─────────────────────────────────────────────────

function Step3Message({
  message,
  onChange,
}: {
  message: string;
  onChange: (v: string) => void;
}) {
  const MAX = 280;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Personal message (optional)
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          {message.length}/{MAX}
        </span>
      </div>
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        rows={4}
        placeholder="Add a personal note to your invitation…"
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          padding: '10px',
          width: '100%',
          boxSizing: 'border-box',
          background: SHELL.CARD_WHITE,
          border: '1px solid ' + SHELL.CARD_LINE,
          borderRadius: 6,
          color: SHELL.INK,
          resize: 'vertical',
          outline: 'none',
        }}
      />

      {/* Email preview */}
      {message.length > 0 && (
        <div
          style={{
            background: SHELL.PAPER_SOFT,
            borderRadius: 8,
            padding: '16px 20px',
            marginTop: 16,
          }}
        >
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 8,
            }}
          >
            Email preview
          </div>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              margin: '0 0 6px 0',
              lineHeight: 1.5,
            }}
          >
            Hi, … {message}
          </p>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              margin: 0,
            }}
          >
            — David Chen via AbarVa
          </p>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Review & send ────────────────────────────────────────────────────

function rolePillStyle(role: Role): { bg: string; text: string } {
  if (role === 'admin') return { bg: SHELL.INK, text: SHELL.PAPER };
  if (role === 'collaborator') return { bg: SHELL.BLUE_BG, text: SHELL.INK };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

function Step4Review({
  email,
  role,
  surfaces,
  message,
  onSend,
  sent,
}: {
  email: string;
  role: Role;
  surfaces: string[];
  message: string;
  onSend: () => void;
  sent: boolean;
}) {
  const pill = rolePillStyle(role);

  if (sent) {
    return (
      <div>
        {/* Success card */}
        <div
          style={{
            background: SHELL.MINT_BG,
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 15,
              fontWeight: 600,
              color: SHELL.MINT_TEXT,
              marginBottom: 8,
            }}
          >
            ✓ Invitation sent to {email}
          </div>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            They&apos;ll receive an email with setup instructions. The invitation expires in 7 days.
          </p>
        </div>
        <a
          href="/admin/users"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}
        >
          → Return to Users
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Email */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 4,
          }}
        >
          Email
        </div>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            fontWeight: 700,
            color: SHELL.INK,
          }}
        >
          {email}
        </span>
      </div>

      {/* Role + surfaces */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 6,
          }}
        >
          Role & access
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: pill.text,
              background: pill.bg,
              borderRadius: 10,
              padding: '3px 9px',
              lineHeight: 1,
            }}
          >
            {role}
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
            }}
          >
            {surfaces.join(' · ')}
          </span>
        </div>
      </div>

      {/* Message preview */}
      {message.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Personal message
          </div>
          <div
            style={{
              background: SHELL.PAPER_SOFT,
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_MUTED,
                fontStyle: 'italic',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Send CTA */}
      <button
        onClick={onSend}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 12,
          color: SHELL.PAPER,
          background: SHELL.INK,
          border: 'none',
          borderRadius: 8,
          padding: '12px 0',
          width: '100%',
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
      >
        Send invitation
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function InviteCollaboratorPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('collaborator');
  const [surfaces, setSurfaces] = useState<string[]>(defaultSurfaces('collaborator'));
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleRoleChange(r: Role) {
    setRole(r);
    setSurfaces(defaultSurfaces(r));
  }

  function handleContinue() {
    if (step < 3) setStep(step + 1);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleSend() {
    setSent(true);
  }

  const step1Valid = email.includes('@');

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Users · Invite',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Access Governor' }}
        quote="Invite flow is deterministic and role-scoped. Admin grants all surfaces, collaborators stay bounded, and pending invites should be cleared quickly so audit posture stays current."
        agentContext="Steward · Setup · invite collaborator"
        actions={[
          { letter: 'A', text: 'Invite collaborator', detail: 'Add a new operator to Programs and Source' },
          { letter: 'B', text: 'Review pending invites', detail: 'Clear dormant invitations before role sprawl grows' },
          { letter: 'C', text: 'Return to users', detail: 'Verify the membership ledger after sending' },
        ]}
        surface="setup"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '40px 60px',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {/* Back link */}
          <a
            href="/admin/users"
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 16,
            }}
          >
            ← Users
          </a>

          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.PEACH_TEXT,
              marginBottom: 12,
              lineHeight: 1,
            }}
          >
            Canonical route · /admin/invite
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 400,
              color: SHELL.INK,
              margin: '0 0 4px 0',
              lineHeight: 1.2,
            }}
          >
            Invite collaborator
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: '0 0 28px 0',
            }}
            >
              Add a team member to Apex Retail Group on AbarVa
            </p>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Step content */}
          {step === 0 && <Step1Email email={email} onChange={setEmail} />}
          {step === 1 && (
            <Step2RoleAccess
              role={role}
              onRoleChange={handleRoleChange}
              surfaces={surfaces}
              onSurfacesChange={setSurfaces}
            />
          )}
          {step === 2 && <Step3Message message={message} onChange={setMessage} />}
          {step === 3 && (
            <Step4Review
              email={email}
              role={role}
              surfaces={surfaces}
              message={message}
              onSend={handleSend}
              sent={sent}
            />
          )}

          {/* Navigation buttons (hidden after send) */}
          {!sent && step < 3 && (
            <NavButtons
              step={step}
              onBack={handleBack}
              onContinue={handleContinue}
              onCancel={() => {}}
              continueDisabled={step === 0 && !step1Valid}
            />
          )}
          {!sent && step === 3 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid ' + SHELL.CARD_LINE,
              }}
            >
              <button
                onClick={handleBack}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_SOFT,
                  background: 'transparent',
                  border: '1px solid ' + SHELL.CARD_LINE,
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <div style={{ flex: 1 }} />
              <a
                href="/admin/users"
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  textDecoration: 'none',
                }}
              >
                Cancel
              </a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
