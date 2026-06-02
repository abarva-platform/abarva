export type SubprocessorUseStatus = 'active' | 'optional' | 'legacy';

export type SubprocessorRecord = {
  name: string;
  role: string;
  dataCategories: string;
  useStatus: SubprocessorUseStatus;
  safeguards: string;
};

export const SUBPROCESSOR_LAST_UPDATED = '2026-06-02';

export const SUBPROCESSOR_RECORDS: readonly SubprocessorRecord[] = [
  {
    name: 'Microsoft Azure',
    role: 'Client data-plane infrastructure, object storage, databases, private networking, secrets, observability, and optional Azure AI services.',
    dataCategories: 'Customer-scoped records, evidence files, processing logs, operational telemetry, and secrets where the customer lane is configured for Azure.',
    useStatus: 'active',
    safeguards: 'Tenant-scoped adapters, private data-plane architecture, encryption controls inherited from Azure services, and customer-owned Azure subscription option for private lanes.',
  },
  {
    name: 'Vercel',
    role: 'Shared SaaS control-plane hosting, previews, production deployment, edge routing, and platform runtime logs.',
    dataCategories: 'Application requests, routing metadata, build metadata, static assets, and limited operational logs. Client-private payload persistence must route through data-plane adapters.',
    useStatus: 'active',
    safeguards: 'Control-plane/data-plane separation, immutable deployments, HTTPS, release previews, and rollback through prior deployment promotion or revert PR.',
  },
  {
    name: 'Clerk',
    role: 'Authentication, session management, organization membership, MFA, and user identity metadata.',
    dataCategories: 'User account identifiers, email addresses, session metadata, organization membership, role claims, and authentication events.',
    useStatus: 'active',
    safeguards: 'Route-level auth gates, short-lived sessions, role checks, organization scoping, and tenant access validation before client data is served.',
  },
  {
    name: 'Anthropic',
    role: 'Large language model inference for broker-mediated reasoning and drafting workflows.',
    dataCategories: 'Prompt excerpts, user instructions, retrieved context, generated text, and AI usage metadata when the model path is enabled.',
    useStatus: 'optional',
    safeguards: 'AgentContextBroker mediation, tenant binding, prompt minimization, human-decision controls, and no final-decision authority.',
  },
  {
    name: 'OpenAI',
    role: 'Large language model inference, embeddings, and related AI capability where enabled for a client or product path.',
    dataCategories: 'Prompt excerpts, retrieved context, embeddings inputs, generated text, and AI usage metadata when the provider path is enabled.',
    useStatus: 'optional',
    safeguards: 'Provider routing through governed model paths, prompt minimization, human-decision controls, and opt-out or provider-specific configuration where contracted.',
  },
  {
    name: 'Resend',
    role: 'Transactional email delivery for product and operational notifications.',
    dataCategories: 'Recipient email address, message metadata, template payloads, delivery events, bounces, and complaints.',
    useStatus: 'optional',
    safeguards: 'Webhook signature verification, scoped notification dispatch, and use limited to notification flows when configured.',
  },
  {
    name: 'Stripe',
    role: 'Billing and payment operations where commercial checkout or subscription billing is enabled.',
    dataCategories: 'Billing contact information, customer billing identifiers, invoice metadata, payment status, and subscription metadata.',
    useStatus: 'optional',
    safeguards: 'Billing-only integration boundary and feature-path configuration; pilot or enterprise contracts may use offline billing instead.',
  },
  {
    name: 'PostHog',
    role: 'Product analytics, usage measurement, feature observability, and pilot success telemetry where enabled.',
    dataCategories: 'Usage events, page or feature interactions, client/user identifiers where configured, and aggregated analytics metadata.',
    useStatus: 'optional',
    safeguards: 'Feature-specific instrumentation, analytics minimization, and customer-specific disablement where required by contract.',
  },
  {
    name: 'Supabase',
    role: 'Compatibility-era Postgres, auth/RLS test residue, migrations, or deprecation evidence.',
    dataCategories: 'Legacy or test-path records only where an existing compatibility path remains in scope.',
    useStatus: 'legacy',
    safeguards: 'New runtime data-backed work must use Azure/Postgres data-plane adapters rather than adding direct Supabase dependencies.',
  },
  {
    name: 'Pinecone',
    role: 'Compatibility-era vector retrieval or historical tenant namespace references.',
    dataCategories: 'Legacy vector metadata or embeddings where an existing compatibility path remains in scope.',
    useStatus: 'legacy',
    safeguards: 'New runtime retrieval work should follow governed broker and data-plane adapter boundaries unless separately contracted.',
  },
  {
    name: 'Neo4j',
    role: 'Compatibility-era graph references, tests, migrations, or optional historical graph experiments.',
    dataCategories: 'Legacy graph metadata where an existing compatibility path remains in scope.',
    useStatus: 'legacy',
    safeguards: 'No new runtime graph dependency should be introduced without a separate architectural decision and contract review.',
  },
] as const;

export const SUBPROCESSOR_COMMITMENTS = [
  {
    title: 'Customer contracts control the final list',
    body: 'A customer order form, DPA, private-data-lane addendum, or security exhibit can narrow providers, regions, retention, or optional services for that customer.',
  },
  {
    title: 'Optional services can be disabled',
    body: 'Email, analytics, billing, and model-provider paths are configured by product path and contract posture. They are not a blanket requirement for every pilot.',
  },
  {
    title: 'Legacy names are not new dependencies',
    body: 'Supabase, Pinecone, and Neo4j may still appear in compatibility shims, tests, migrations, or deprecation docs, but new runtime work follows Azure/Postgres and governed broker boundaries.',
  },
] as const;
