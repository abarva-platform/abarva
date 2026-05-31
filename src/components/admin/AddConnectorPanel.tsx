'use client';

/**
 * AddConnectorPanel · Wave 2 PR-6 — Connector onboarding drawer.
 *
 * Verdict §4 Persona A friction: a first-time tenant admin opens
 * /admin and has no upload affordance from the landing. This drawer
 * opens via the `?add=open` query (driven from a CTA on the
 * Connectors panel card on /admin or the Connectors page header).
 *
 * Two-pane layout per the brief:
 *   LEFT  — category-chip filter + template grid
 *   RIGHT — details form for the selected template
 *   FOOT  — Test connection · Save draft · Cancel
 *
 * Hard constraints honored:
 *   • Design system locked: Georgia (serif) header, DM Sans body,
 *     JetBrains Mono eyebrows, cream paper, black/ghost buttons.
 *     No new colors — palette from `COLORS` / inline tokens.
 *   • No real OAuth. The auth-method picker captures operator
 *     intent only; the "Configure auth" CTA links to the existing
 *     connector-detail page. We never collect credentials.
 *   • Save draft (PRE-W4-PR-2) persists a real `pending` connector
 *     row via the connector-health broker. Telemetry is kept as a
 *     breadcrumb. No credentials are written — only template id,
 *     name, scope, and operator auth-method intent.
 *   • Test connection is a placeholder: emits telemetry + shows a
 *     transient banner. A real `test_connector(tenantKey, …)` RPC
 *     lands in Wave 2 PR-1 (the connector-health broker).
 */

import { useCallback, useMemo, useState } from 'react';
import posthog from 'posthog-js';

import {
  createPendingConnectorAction,
  type CreatePendingConnectorActionResult,
} from '@/app/(maestro)/admin/connectors/_actions/create-pending-connector';

export interface ConnectorTemplate {
  id: string;
  label: string;
  vendor: string;
  category: ConnectorTemplateCategory;
  authMethods: ReadonlyArray<ConnectorAuthMethod>;
  description: string;
}

export type ConnectorTemplateCategory =
  | 'data_platform'
  | 'crm'
  | 'itsm'
  | 'hr'
  | 'identity'
  | 'analytics'
  | 'finance';

export type ConnectorAuthMethod = 'oauth' | 'api_key' | 'sso';

const CATEGORY_LABELS: Record<ConnectorTemplateCategory, string> = {
  data_platform: 'Data platform',
  crm: 'CRM',
  itsm: 'ITSM',
  hr: 'HR',
  identity: 'Identity',
  analytics: 'Analytics',
  finance: 'Finance',
};

const AUTH_METHOD_LABELS: Record<ConnectorAuthMethod, string> = {
  oauth: 'OAuth 2.0',
  api_key: 'API key',
  sso: 'SSO / SAML',
};

/**
 * Default template list. Sourced from the verdict-pinned set
 * (Postgres, Salesforce, Snowflake, ServiceNow, Workday, Okta,
 * GA4, Adobe Analytics, Stripe). Callers can override via
 * `templates` prop once a tenant-scoped catalog exists.
 */
const DEFAULT_TEMPLATES: ReadonlyArray<ConnectorTemplate> = [
  {
    id: 'postgres',
    label: 'Postgres',
    vendor: 'PostgreSQL',
    category: 'data_platform',
    authMethods: ['api_key'],
    description:
      'Direct read-only Postgres connection for tenant warehouses and operational stores.',
  },
  {
    id: 'snowflake',
    label: 'Snowflake',
    vendor: 'Snowflake Inc.',
    category: 'data_platform',
    authMethods: ['oauth', 'api_key'],
    description:
      'Cloud data warehouse. Scoped to the tenant database; least-privilege role enforced.',
  },
  {
    id: 'salesforce',
    label: 'Salesforce',
    vendor: 'Salesforce',
    category: 'crm',
    authMethods: ['oauth'],
    description:
      'CRM source for accounts, opportunities, and customer-success signals.',
  },
  {
    id: 'servicenow',
    label: 'ServiceNow',
    vendor: 'ServiceNow Inc.',
    category: 'itsm',
    authMethods: ['oauth'],
    description:
      'IT service management — change requests, incidents, and program risk signal feed.',
  },
  {
    id: 'workday',
    label: 'Workday',
    vendor: 'Workday Inc.',
    category: 'hr',
    authMethods: ['oauth', 'sso'],
    description:
      'HR system of record. Org structure, role grants, and headcount substrate.',
  },
  {
    id: 'okta',
    label: 'Okta',
    vendor: 'Okta',
    category: 'identity',
    authMethods: ['sso', 'oauth'],
    description:
      'Identity provider for SSO and group-based access control across surfaces.',
  },
  {
    id: 'ga4',
    label: 'Google Analytics 4',
    vendor: 'Google',
    category: 'analytics',
    authMethods: ['oauth'],
    description:
      'Web and app analytics for revenue-impact signals on Pattern-to-Move funnels.',
  },
  {
    id: 'adobe_analytics',
    label: 'Adobe Analytics',
    vendor: 'Adobe',
    category: 'analytics',
    authMethods: ['oauth', 'api_key'],
    description:
      'Enterprise analytics. Companion to GA4 for omnichannel attribution.',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    vendor: 'Stripe',
    category: 'finance',
    authMethods: ['api_key'],
    description:
      'Payments and subscription signal feed. Read-only billing snapshots.',
  },
];

const ALL_CATEGORIES: ReadonlyArray<ConnectorTemplateCategory> = [
  'data_platform',
  'crm',
  'itsm',
  'hr',
  'identity',
  'analytics',
  'finance',
];

interface Props {
  /** Tenant slug used as the namespace for save-draft telemetry. */
  tenantKey: string;
  /** Href the panel uses for its "Cancel" / overlay close action. */
  closeHref: string;
  /** Override the catalog (used by tests / future tenant-scoped catalogs). */
  templates?: ReadonlyArray<ConnectorTemplate>;
  /**
   * Override the persistence call. Defaults to the real server action
   * (`createPendingConnectorAction`). Tests inject a stub.
   */
  saveDraft?: (input: {
    templateId: string;
    name: string;
    scope?: string | null;
    authMethod?: ConnectorAuthMethod | null;
  }) => Promise<CreatePendingConnectorActionResult>;
}

type FlowState =
  | { kind: 'editing' }
  | { kind: 'saving' }
  | { kind: 'tested'; ts: number }
  | { kind: 'saved'; draftName: string; connectorId: string };

export function AddConnectorPanel({
  tenantKey,
  closeHref,
  templates = DEFAULT_TEMPLATES,
  saveDraft = createPendingConnectorAction,
}: Props) {
  const [activeCategory, setActiveCategory] =
    useState<ConnectorTemplateCategory | 'all'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id ?? '',
  );
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [authMethod, setAuthMethod] = useState<ConnectorAuthMethod | ''>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowState>({ kind: 'editing' });

  const filteredTemplates = useMemo(
    () =>
      activeCategory === 'all'
        ? templates
        : templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const handleSelectTemplate = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      setAuthMethod('');
      setValidationError(null);
      setFlow({ kind: 'editing' });
    },
    [],
  );

  const handleTestConnection = useCallback(() => {
    if (!selectedTemplate) {
      setValidationError('Pick a connector template first.');
      return;
    }
    setValidationError(null);
    if (typeof window !== 'undefined') {
      try {
        posthog.capture('connector_onboarding_test_connection_clicked', {
          tenantKey,
          template_id: selectedTemplate.id,
          auth_method: authMethod || null,
        });
      } catch {
        // PostHog not initialized — swallow.
      }
    }
    // TODO(Wave 2 PR-1): wire to `test_connector(tenantKey, …)`
    // RPC behind the connector-health broker once the broker
    // contract lands. Until then this is a placeholder.
    setFlow({ kind: 'tested', ts: Date.now() });
  }, [selectedTemplate, authMethod, tenantKey]);

  const handleSaveDraft = useCallback(async () => {
    if (!selectedTemplate) {
      setValidationError('Pick a connector template first.');
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setValidationError('Give this connector a name before saving.');
      return;
    }
    setValidationError(null);
    if (typeof window !== 'undefined') {
      // Telemetry breadcrumb — kept after the real persistence wire-up
      // in PRE-W4-PR-2 because it usefully marks the click event in
      // the funnel regardless of the persistence outcome.
      try {
        posthog.capture('connector_onboarding_save_draft_clicked', {
          tenantKey,
          template_id: selectedTemplate.id,
          auth_method: authMethod || null,
        });
      } catch {
        // PostHog not initialized — swallow.
      }
    }
    setFlow({ kind: 'saving' });
    let result: CreatePendingConnectorActionResult;
    try {
      result = await saveDraft({
        templateId: selectedTemplate.id,
        name: trimmedName,
        scope: scope.trim().length > 0 ? scope.trim() : null,
        authMethod: authMethod === '' ? null : authMethod,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed.';
      setValidationError(message);
      setFlow({ kind: 'editing' });
      return;
    }
    if (!result.ok) {
      setValidationError(result.error);
      setFlow({ kind: 'editing' });
      return;
    }
    setFlow({
      kind: 'saved',
      draftName: trimmedName,
      connectorId: result.connectorId,
    });
  }, [selectedTemplate, name, scope, authMethod, tenantKey, saveDraft]);

  return (
    <div
      data-testid="add-connector-panel"
      role="dialog"
      aria-label="Add a connector"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(10,12,18,0.45)',
      }}
    >
      <a
        href={closeHref}
        aria-label="Close add-connector panel"
        data-testid="add-connector-panel-scrim"
        style={{
          position: 'absolute',
          inset: 0,
          textDecoration: 'none',
        }}
      />
      <section
        style={{
          position: 'relative',
          width: 'min(960px, 92vw)',
          height: '100%',
          background: '#FBFAF7',
          boxShadow: '-12px 0 36px rgba(10,12,18,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            padding: '24px 32px 18px',
            borderBottom: '1px solid rgba(10,12,18,0.10)',
          }}
        >
          <div
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6B7280',
              marginBottom: 6,
            }}
          >
            Onboarding · Connector
          </div>
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: '-0.012em',
              color: '#0A0C12',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Add a connector
          </h2>
          <p
            style={{
              fontFamily:
                'var(--font-inter), "DM Sans", system-ui, sans-serif',
              fontSize: 13,
              color: '#3D4454',
              margin: '6px 0 0',
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            Pick a template, name the connection, and we will hold a draft
            until an authorized operator finishes the auth handshake on
            the connector detail page. No credentials are stored from this
            panel.
          </p>
        </header>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
            gap: 0,
            overflow: 'hidden',
          }}
        >
          {/* LEFT — template picker */}
          <div
            data-testid="add-connector-template-pane"
            style={{
              padding: '20px 28px',
              borderRight: '1px solid rgba(10,12,18,0.10)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#6B7280',
                marginBottom: 10,
              }}
            >
              Templates · {filteredTemplates.length}
            </div>
            <div
              role="tablist"
              aria-label="Filter by category"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <CategoryChip
                label="All"
                active={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
              />
              {ALL_CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat}
                  label={CATEGORY_LABELS[cat]}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                />
              ))}
            </div>

            <ul
              data-testid="add-connector-template-list"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      data-testid="add-connector-template-card"
                      data-template-id={tpl.id}
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 12,
                        background: isSelected ? '#FFFFFF' : 'transparent',
                        border: `1px solid ${
                          isSelected
                            ? 'rgba(10,12,18,0.55)'
                            : 'rgba(10,12,18,0.12)'
                        }`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily:
                          'var(--font-inter), "DM Sans", system-ui, sans-serif',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#0A0C12',
                          marginBottom: 2,
                        }}
                      >
                        {tpl.label}
                      </div>
                      <div
                        style={{
                          fontFamily:
                            'var(--font-jetbrains-mono), ui-monospace, monospace',
                          fontSize: 9.5,
                          color: '#6B7280',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {CATEGORY_LABELS[tpl.category]}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filteredTemplates.length === 0 && (
              <p
                data-testid="add-connector-template-empty"
                style={{
                  fontFamily:
                    'var(--font-inter), "DM Sans", system-ui, sans-serif',
                  fontSize: 12,
                  color: '#6B7280',
                  marginTop: 12,
                }}
              >
                No templates in this category yet.
              </p>
            )}
          </div>

          {/* RIGHT — details form */}
          <div
            data-testid="add-connector-form-pane"
            style={{
              padding: '20px 28px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {selectedTemplate ? (
              <>
                <div>
                  <div
                    style={{
                      fontFamily:
                        'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Selected · {selectedTemplate.vendor}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 20,
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                      color: '#0A0C12',
                      margin: '0 0 6px',
                    }}
                  >
                    {selectedTemplate.label}
                  </h3>
                  <p
                    style={{
                      fontFamily:
                        'var(--font-inter), "DM Sans", system-ui, sans-serif',
                      fontSize: 13,
                      color: '#3D4454',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedTemplate.description}
                  </p>
                </div>

                <FormField
                  label="Connector name"
                  hint="The display name shown on the Connectors list."
                  htmlFor="add-connector-name"
                >
                  <input
                    id="add-connector-name"
                    data-testid="add-connector-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`${selectedTemplate.label} · production`}
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Scope"
                  hint="Optional — what objects, tables, or domains this connector should pull."
                  htmlFor="add-connector-scope"
                >
                  <input
                    id="add-connector-scope"
                    data-testid="add-connector-scope-input"
                    type="text"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="e.g. orders, inventory, returns"
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Auth method"
                  hint="Operator intent only. Credentials are collected on the connector detail page."
                  htmlFor="add-connector-auth"
                >
                  <div
                    role="radiogroup"
                    aria-label="Auth method"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                  >
                    {selectedTemplate.authMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        role="radio"
                        aria-checked={authMethod === method}
                        data-testid="add-connector-auth-method"
                        data-method={method}
                        data-selected={
                          authMethod === method ? 'true' : 'false'
                        }
                        onClick={() => setAuthMethod(method)}
                        style={{
                          fontFamily:
                            'var(--font-jetbrains-mono), ui-monospace, monospace',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.10em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          borderRadius: 3,
                          cursor: 'pointer',
                          background:
                            authMethod === method ? '#0A0C12' : 'transparent',
                          color:
                            authMethod === method ? '#FBFAF7' : '#0A0C12',
                          border: '1px solid rgba(10,12,18,0.35)',
                        }}
                      >
                        {AUTH_METHOD_LABELS[method]}
                      </button>
                    ))}
                  </div>
                </FormField>

                <a
                  href={`/admin/connectors/${selectedTemplate.id}`}
                  data-testid="add-connector-configure-auth-link"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), ui-monospace, monospace',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: '#0A0C12',
                    textDecoration: 'underline',
                  }}
                >
                  Configure auth on connector detail →
                </a>

                {validationError && (
                  <div
                    role="alert"
                    data-testid="add-connector-validation-error"
                    style={{
                      fontFamily:
                        'var(--font-inter), "DM Sans", system-ui, sans-serif',
                      fontSize: 12,
                      color: '#8B1F0F',
                      background: '#FFE6E1',
                      padding: '8px 10px',
                      borderRadius: 4,
                      border: '1px solid rgba(139,31,15,0.25)',
                    }}
                  >
                    {validationError}
                  </div>
                )}

                {flow.kind === 'tested' && (
                  <div
                    role="status"
                    data-testid="add-connector-test-banner"
                    style={{
                      fontFamily:
                        'var(--font-inter), "DM Sans", system-ui, sans-serif',
                      fontSize: 12,
                      color: '#7A4F01',
                      background: '#FFF4E1',
                      padding: '8px 10px',
                      borderRadius: 4,
                      border: '1px solid rgba(122,79,1,0.25)',
                    }}
                  >
                    Connection test is queued until the live connector health
                    service is enabled.
                  </div>
                )}

                {flow.kind === 'saved' && (
                  <div
                    role="status"
                    data-testid="add-connector-saved-banner"
                    style={{
                      fontFamily:
                        'var(--font-inter), "DM Sans", system-ui, sans-serif',
                      fontSize: 12,
                      color: '#1B5E20',
                      background: '#E8F5E8',
                      padding: '8px 10px',
                      borderRadius: 4,
                      border: '1px solid rgba(27,94,32,0.25)',
                    }}
                  >
                    Saved as pending — &ldquo;{flow.draftName}&rdquo; is
                    visible on{' '}
                    <a
                      data-testid="add-connector-saved-link"
                      href={`/admin/connectors#connector-${flow.connectorId}`}
                      style={{ color: '#1B5E20', textDecoration: 'underline' }}
                    >
                      the Connectors list
                    </a>
                    . Finish the auth handshake to take it live.
                  </div>
                )}
              </>
            ) : (
              <p
                style={{
                  fontFamily:
                    'var(--font-inter), "DM Sans", system-ui, sans-serif',
                  fontSize: 13,
                  color: '#6B7280',
                }}
              >
                Pick a template on the left to begin.
              </p>
            )}
          </div>
        </div>

        <footer
          style={{
            padding: '14px 32px',
            borderTop: '1px solid rgba(10,12,18,0.10)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            background: '#F5F3EE',
          }}
        >
          <a
            href={closeHref}
            data-testid="add-connector-cancel"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#0A0C12',
              textDecoration: 'none',
              padding: '6px 4px',
            }}
          >
            Cancel
          </a>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              data-testid="add-connector-test-button"
              onClick={handleTestConnection}
              disabled={!selectedTemplate}
              style={ghostButtonStyle(!selectedTemplate)}
            >
              Test connection
            </button>
            <button
              type="button"
              data-testid="add-connector-save-button"
              onClick={handleSaveDraft}
              disabled={!selectedTemplate || flow.kind === 'saving'}
              style={primaryButtonStyle(
                !selectedTemplate || flow.kind === 'saving',
              )}
            >
              {flow.kind === 'saving' ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-testid="add-connector-category-chip"
      data-selected={active ? 'true' : 'false'}
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        padding: '5px 10px',
        borderRadius: 3,
        cursor: 'pointer',
        background: active ? '#0A0C12' : 'transparent',
        color: active ? '#FBFAF7' : '#0A0C12',
        border: '1px solid rgba(10,12,18,0.35)',
      }}
    >
      {label}
    </button>
  );
}

function FormField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#3D4454',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
      <div
        style={{
          fontFamily: 'var(--font-inter), "DM Sans", system-ui, sans-serif',
          fontSize: 11,
          color: '#6B7280',
          marginTop: 4,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-inter), "DM Sans", system-ui, sans-serif',
  fontSize: 13,
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid rgba(10,12,18,0.18)',
  background: '#FFFFFF',
  color: '#0A0C12',
};

function ghostButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: '#0A0C12',
    background: 'transparent',
    border: '1px solid rgba(10,12,18,0.35)',
    borderRadius: 3,
    padding: '8px 14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: '#FBFAF7',
    background: '#0A0C12',
    border: '1px solid #0A0C12',
    borderRadius: 3,
    padding: '8px 14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

/** Exposed for tests that need to assert the default catalog shape. */
export const __TESTING__ = {
  DEFAULT_TEMPLATES,
  CATEGORY_LABELS,
  AUTH_METHOD_LABELS,
};
