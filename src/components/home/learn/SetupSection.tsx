'use client';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead,
  Callout, StepList, Step, TileGrid, Tile, TermGrid, Term,
} from './primitives';

export function SetupSection() {
  return (
    <>
      {/* Band */}
      <HeroBand color="slate">
        <Eyebrow light>Setup</Eyebrow>
        <SectionTitle light>Setup — before you begin</SectionTitle>
        <Lead light>
          Setup is where you wire AbarVa into your organization's data and context. Without Setup, Intelligence has nothing to analyze and Nexus produces generic documents. Good Setup = high-quality everything else.
        </Lead>
      </HeroBand>

      {/* Connectors */}
      <Section>
        <Eyebrow>Setup · Connectors</Eyebrow>
        <SectionTitle>Connectors & data sources</SectionTitle>
        <Lead>
          Connectors are the pipes from your organization's systems into AbarVa's intelligence substrate. They're what makes signals specific to your business rather than generic industry patterns.
        </Lead>

        <TileGrid>
          <Tile
            icon="🗄️"
            name="Data warehouses"
            desc="Snowflake, BigQuery, Redshift, Databricks. Feed operational metrics that Intelligence uses to detect cost, efficiency, and risk patterns."
            path="/admin → Connectors → Data"
          />
          <Tile
            icon="☁️"
            name="CRM & ops systems"
            desc="Salesforce, ServiceNow, SAP. Transaction data and process logs that give Intelligence context about where friction and opportunity actually live."
            path="/admin → Connectors → Systems"
          />
          <Tile
            icon="📁"
            name="Document stores"
            desc="SharePoint, Google Drive, Confluence. Strategy documents, past project files, and reference materials that Nexus can draw on when generating deliverables."
            path="/admin → Connectors → Documents"
          />
          <Tile
            icon="📊"
            name="BI & reporting"
            desc="Power BI, Tableau, Looker. Pre-built dashboards and KPI definitions help Intelligence interpret metrics in business context rather than raw numbers."
            path="/admin → Connectors → BI"
          />
        </TileGrid>

        <Callout kind="warn" icon="⚠️" label="Foundation readiness matters">
          The "Foundation readiness" field you fill during Move origination (P0) is partly a reflection of Setup completeness. If connectors are sparse, Nexus will flag a readiness gap that will slow P3 design and P4 business case quality. The more connected Setup is, the better every Move document becomes.
        </Callout>
      </Section>

      {/* Tenant profile */}
      <Section>
        <Eyebrow>Setup · Tenant Profile</Eyebrow>
        <SectionTitle>Tenant profile & org context</SectionTitle>
        <Lead>
          The tenant profile is your organization's context layer — who the key executives are, what the strategic priorities are, and how the business is structured. This is how AbarVa learns to talk about your company correctly.
        </Lead>

        <StepList>
          <Step title="Add your executive team">
            Name and title for each C-suite and VP-level stakeholder. When you name a sponsor in a Move, Nexus can look up their role and ensure the charter addresses their reporting context.
          </Step>
          <Step title="Set your strategic priorities">
            2–5 top-level priorities your organization is working on (e.g. "Cost efficiency", "Customer experience transformation"). Intelligence uses these to weight which patterns are most relevant to surface.
          </Step>
          <Step title="Define your business units">
            A flat list of major divisions or functions. Used to scope Moves correctly and filter Intelligence signals by area of impact.
          </Step>
        </StepList>
      </Section>

      {/* Key terms */}
      <Section>
        <Eyebrow>Setup · Key Terms</Eyebrow>
        <SectionTitle>Key terms in Setup</SectionTitle>
        <TermGrid>
          <Term name="Connector">
            An integration between AbarVa and an external data system. Connectors pull data into the intelligence substrate. <em>Without connectors, Intelligence has no evidence and Moves produce generic content.</em>
          </Term>
          <Term name="Substrate">
            The combined data layer that all agents query. It includes connector data, document embeddings, and tenant context. <em>Think of it as the shared memory of the platform.</em>
          </Term>
          <Term name="Foundation readiness">
            An assessment of how complete and current your substrate is for a given initiative. <em>Low foundation readiness = higher risk of thin documents and missed risks.</em>
          </Term>
          <Term name="Tenant">
            Your organization's isolated instance of AbarVa. All data, agents, and Moves are scoped to your tenant — no data is shared across tenants.
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
