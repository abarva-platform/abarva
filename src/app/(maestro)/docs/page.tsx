import type { CSSProperties } from 'react';
import Link from 'next/link';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import {
  HELP_CENTER_ARTICLES,
  HELP_CENTER_SUPPORT_PATHS,
  HELP_CENTER_WORKFLOWS,
  type HelpCenterAudience,
} from '@/lib/help-center/product-docs';

export const metadata = {
  title: 'Help center · AbarVa Docs',
};

const cardStyle: CSSProperties = {
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.md,
  background: COLORS.white,
  padding: SPACING.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.md,
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 24,
  lineHeight: 1.18,
  fontWeight: 650,
  color: COLORS.ink,
  margin: 0,
};

const bodyStyle: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 14,
  lineHeight: 1.62,
  color: `${COLORS.ink}c8`,
  margin: 0,
};

const labelStyle: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: COLORS.navy,
  margin: 0,
};

const audienceLabel: Record<HelpCenterAudience, string> = {
  'all-users': 'All users',
  admins: 'Admins',
  operators: 'Operators',
};

function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        ...bodyStyle,
        fontSize: 13,
      }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function ProductDocsPage() {
  return (
    <AdminCanonShellV2
      tenantName="AbarVa Docs"
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Admin/Setup"
          primaryActionHref="/admin/setup"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Docs · Help center"
        title="AbarVa product help center"
        subtitle="Customer-safe operating guides for the pilot workspace: where work starts, where admin setup lives, how evidence-backed decisions move, and when to escalate."
      >
        <section
          aria-labelledby="help-center-principles"
          style={{
            ...cardStyle,
            background: COLORS.cream,
            borderColor: `${COLORS.ink}18`,
          }}
        >
          <p style={labelStyle}>Operating principle</p>
          <h2 id="help-center-principles" style={sectionTitleStyle}>
            Home is for insight. Admin is for setup. Decisions stay human-owned.
          </h2>
          <p style={{ ...bodyStyle, maxWidth: 860 }}>
            The help center separates day-to-day user guidance from admin/setup controls. It also keeps the product boundary clear: AbarVa helps teams reason from client context, corpus, evidence, and workflow state, while approvals, data-load responsibility, and external commitments remain with named humans.
          </p>
        </section>

        <section aria-labelledby="module-guides" style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          <h2 id="module-guides" style={sectionTitleStyle}>
            Module guides
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: SPACING.md,
            }}
          >
            {HELP_CENTER_ARTICLES.map((article) => (
              <article key={article.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACING.sm }}>
                  <p style={labelStyle}>{audienceLabel[article.audience]}</p>
                  {article.route ? (
                    <Link
                      href={article.route}
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLORS.navy,
                        textDecoration: 'none',
                      }}
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
                <h3 style={{ ...sectionTitleStyle, fontSize: 19 }}>{article.title}</h3>
                <p style={bodyStyle}>{article.summary}</p>
                <CheckList items={article.checkpoints} />
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="workflow-guides" style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          <h2 id="workflow-guides" style={sectionTitleStyle}>
            Workflow guides
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: SPACING.md,
            }}
          >
            {HELP_CENTER_WORKFLOWS.map((workflow) => (
              <article key={workflow.id} style={cardStyle}>
                <p style={labelStyle}>{workflow.owner}</p>
                <h3 style={{ ...sectionTitleStyle, fontSize: 19 }}>{workflow.title}</h3>
                <CheckList items={workflow.steps} />
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="support-paths" style={cardStyle}>
          <p style={labelStyle}>Support paths</p>
          <h2 id="support-paths" style={sectionTitleStyle}>
            How to raise questions safely
          </h2>
          <CheckList items={HELP_CENTER_SUPPORT_PATHS} />
        </section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
