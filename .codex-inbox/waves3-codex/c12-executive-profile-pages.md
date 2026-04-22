# C12 · Executive Profile Pages

**Individual page per executive — linked from rosters across the platform. Where the Executive Profile System (Drop 5) becomes a navigable surface. Real-world executive profiles (Anand-scoped) and composite tenant executives (tenant-scoped) render on the same template with scope-appropriate content.**

**April 21, 2026 · Wave 3 · For Codex execution**

Reads alongside:
- `executive-profile-system.md` — the profile schema this renders
- `c11-composite-home-template.md` — where executive cards link to these pages

---

## Part 1 · What this page is

### 1.1 · The page

An executive profile page renders everything AbarVa knows about a specific executive — career trajectory, current remit, communication style (observed behavior only), known priorities, public commitments, relationship network, and AbarVa interaction history if applicable.

Two modes, same template:

- **Composite executive profile** (e.g., Jonathan Aldridge at Keystone) — for users operating within a tenant; renders the composite data; drives demo interactions.
- **Real-world executive profile** (e.g., Prat Vemana, Tim Peterson) — Anand-scoped; renders the real-world profile; drives relationship management and outreach planning.

### 1.2 · The demo moment

A user is reviewing the briefing and clicks on "Marcus Whitfield" (Apex composite CCO). The profile page loads showing Marcus's background, current focus areas, communication style preferences, known priorities, recent interactions, and current programs he sponsors.

Prat, as the demo user, sees this and realizes: when AbarVa personalizes his briefing, this is the kind of data shaping it. The page makes the invisible personalization visible — and the depth of the profile signals that AbarVa is serious about understanding specific humans, not generic executives.

---

## Part 2 · Page structure

### 2.1 · Section 1 · Header

**Avatar / initials circle** (left-aligned, ~80px)
- Subtle background
- Initials in Georgia serif if no avatar

**Name and role block** (right of avatar)
- Full name (Georgia 32px white)
- Preferred name if different (DM Sans 13px teal: "Goes by Jonathan")
- Current role (DM Sans 18px 500 warm off-white)
- Current company (DM Sans 16px 400 warm off-white)
- Tenure (JetBrains Mono 11px teal: "SINCE FEB 2026")

**Quick context row** (below name block)
- Reports to: [Name] (subtle link)
- Direct reports count: N
- Organizational scope: one-line summary

**Scope indicator** (small, top right)
- For composite profile: JetBrains Mono 11px teal "TENANT PROFILE · APEX"
- For real-world profile: JetBrains Mono 11px teal "REAL-WORLD PROFILE · ANAND-SCOPED"

### 2.2 · Section 2 · Current remit

**Section label.** JetBrains Mono 11px teal uppercase: "CURRENT REMIT"

**Content.**
- Prose paragraph describing what they own (from current_remit field)
- Reporting structure (small block with who they report to, direct reports, organizational scope)
- Strategic priorities personally owned (list with links to priority detail pages)
- Initiatives personally sponsored (list with links to initiative detail pages)

### 2.3 · Section 3 · Communication style

**Section label.** JetBrains Mono 11px teal uppercase: "COMMUNICATION STYLE · OBSERVED PATTERNS"

**Sub-label.** DM Sans 11px warm off-white 60% opacity: "Observed from public appearances and direct interactions. Confidence notation where low."

**Content — grid of observed patterns.**

Each pattern as a card:
- Pattern label (DM Sans 13px 700 white): e.g., "Information density"
- Observed value (DM Sans 14px 500 warm off-white): e.g., "Dense, operator-voice preferred"
- Confidence (if notable): small JetBrains Mono 10px teal: "HIGH CONFIDENCE · OBSERVED 5+ TIMES"

Patterns to render (from communication_style field in schema):
- Preferred modality
- Information density
- Evidence preference
- Decision time horizon
- Meeting style
- Written style observations

### 2.4 · Section 4 · Decision patterns

**Section label.** JetBrains Mono 11px teal uppercase: "DECISION PATTERNS"

**Content — same grid structure as communication style.**

Patterns:
- Risk tolerance
- Horizon preference
- Consensus building
- Pushback patterns (list)
- Acceleration patterns (list)
- Typical first questions (list)

### 2.5 · Section 5 · Career trajectory

**Section label.** JetBrains Mono 11px teal uppercase: "CAREER TRAJECTORY"

**Content — chronological list (newest first).**

Each role as an entry:
- Role + company (DM Sans 14px 700 white)
- Dates (JetBrains Mono 11px teal: "2020 – 2026")
- Exit context if relevant (small text: "Promoted to next role")
- Notable accomplishments (DM Sans 13px warm off-white, bullet list if multiple)

Keep the list compact — expandable for full detail on click.

### 2.6 · Section 6 · Public commitments

**Section label.** JetBrains Mono 11px teal uppercase: "PUBLIC STATEMENTS AND COMMITMENTS"

**Content.**

Each statement as an item:
- Statement summary (DM Sans 14px warm off-white)
- Source (DM Sans 11px teal: "Target investor day · March 2026")
- Date (JetBrains Mono 10px 60% opacity)
- Topic tags (small JetBrains Mono labels)
- Commitment quality indicator (if quantified: small teal pill; if directional: subtle gray pill)

Link to evidence where available.

### 2.7 · Section 7 · Known priorities and constraints

**Section label.** JetBrains Mono 11px teal uppercase: "KNOWN PRIORITIES"

**Content.**

Each priority as a small card:
- Priority description (DM Sans 14px 500 warm off-white)
- Source (DM Sans 11px teal: "Mentioned in podcast interview, Feb 2026")
- Confidence indicator

**Subsection · Known constraints.**

Similar render for known_constraints field (e.g., "Board watching cybersecurity posture").

### 2.8 · Section 8 · Relationship network

**Section label.** JetBrains Mono 11px teal uppercase: "RELATIONSHIP NETWORK"

**Content.**

- Key relationships list:
  - For each: Name · Relationship type · Brief context
  - Linked to the other person's profile (if in system)
- Influential voices (if populated):
  - Small list of who they're observed to respect or follow

### 2.9 · Section 9 · AbarVa relationship (real-world profiles only)

**Section label.** JetBrains Mono 11px teal uppercase: "ABARVA RELATIONSHIP"

**This section only renders for real-world profiles (Anand-scoped access).**

Content:
- Current relationship stage (DM Sans 14px 700 white): e.g., "Design partner candidate"
- Current trust level: e.g., "Earning"
- First contact date
- Total interaction count
- Known concerns (list)
- Demonstrated interests (list)
- Next action recommendation (DM Sans 13px warm off-white, bordered teal-left)
- Interaction log (expandable — list of touchpoints with dates)

### 2.10 · Section 10 · Demo persona overrides (composite profiles only)

**Section label.** JetBrains Mono 11px teal uppercase: "DEMO PERSONA CONFIGURATION"

**This section only renders for composite profiles.**

Content:
- Preferred name usage pattern
- Specific frames to open with
- Topics to lead with
- Sensitivities to acknowledge

Used for tenant maestros to personalize when this executive is user or subject.

### 2.11 · Section 11 · Source material

**Section label.** JetBrains Mono 11px teal uppercase: "SOURCE MATERIAL"

**Sub-label.** DM Sans 11px warm off-white 60% opacity: "All profile claims grounded in source material. Last reviewed [date]."

**Content.**
- Compact list of sources with type and reference
- Expandable for full source attribution
- Confidence notation where applicable

### 2.12 · Section 12 · Profile governance

**Section label.** JetBrains Mono 11px teal uppercase: "PROFILE USE AND GOVERNANCE"

**Content.**
- Profile use statement (DM Sans 13px warm off-white)
- Profile non-use statement (DM Sans 13px warm off-white)
- Last human review date
- Reviewer (for real-world profiles)

This section is intentionally visible — makes the ethical discipline transparent, not hidden. Users seeing "this profile is for meeting prep and conversation planning, not for psychological profiling or third-party sharing" understand the product's principles.

---

## Part 3 · Data dependencies

### 3.1 · Profile data

- **Source:** ExecutiveProfile entity (Drop 5)
- **Fields used:** entire profile schema
- **Access:** per reasoning_scope and disclosure_scope on profile

### 3.2 · Linked entities

- **Strategic priorities owned:** from strategic_priorities_personally_owned links
- **Initiatives sponsored:** from initiatives_personally_sponsored links
- **Relationships:** from key_relationships with links to related profiles
- **Evidence:** from evidence chains tied to public_statements

### 3.3 · AbarVa relationship data (real-world only)

- **Source:** abarva_relationship_history on profile
- **Computation:** interaction log aggregated and rendered

---

## Part 4 · Implementation specs

### 4.1 · Routing

- Composite executive: `/app/t/[tenant-id]/executives/[person-id]`
- Real-world executive: `/app/real-world/executives/[person-id]` — explicit path reinforces scope separation

Two distinct URL paths enforce structurally that composite and real-world profiles don't cross-leak.

### 4.2 · Access control

- Composite profile: access within tenant scope per tenant permissions
- Real-world profile: Anand-scoped; structural enforcement at route layer (deny unless user is Anand or explicit delegate)

### 4.3 · Component hierarchy

```
<ExecutiveProfilePage profileMode={"composite"|"real-world"}>
  <ProfileHeader profile={profile} />
  <CurrentRemit remit={profile.current_remit} />
  <CommunicationStyle style={profile.communication_style} />
  <DecisionPatterns patterns={profile.decision_patterns} />
  <CareerTrajectory history={profile.career_history} />
  <PublicStatements statements={profile.public_statements} />
  <KnownPriorities priorities={profile.known_priorities} constraints={profile.known_constraints} />
  <RelationshipNetwork relationships={profile.key_relationships} />
  {profileMode === "real-world" && <AbarVaRelationship history={profile.abarva_relationship_history} />}
  {profileMode === "composite" && <DemoPersonaOverrides overrides={profile.demo_persona_overrides} />}
  <SourceMaterial sources={profile.source_material} />
  <ProfileGovernance useStatement={profile.profile_use_statement} nonUseStatement={profile.profile_non_use_statement} />
</ExecutiveProfilePage>
```

### 4.4 · Design system

Same discipline as C11 and C21. Georgia serif for name + major headings. DM Sans for body. JetBrains Mono for labels. Near-black with warm off-white and teal accent.

Profile page should feel editorial — like reading a well-crafted biography section, not a CRM record.

### 4.5 · Responsive design

- Desktop: single-column main content (~800px max width)
- Some sections (communication style, decision patterns) render as grids on desktop; stack on mobile
- Avatar section: stacks vertically on mobile

---

## Part 5 · Interactions

### 5.1 · Entity links throughout

- Relationships → link to related executive profile (if accessible)
- Strategic priorities → link to priority detail
- Initiatives → link to initiative detail
- Evidence → expands evidence block or links to full source

### 5.2 · Edit affordance (composite profiles for admins; real-world for Anand)

Small "Edit" link visible to authorized users. Clicking opens an edit mode where profile fields can be updated. Changes logged with human_reviewed_by and human_reviewed_at updates.

### 5.3 · Expand sections

Most sections expand for fuller detail on click. Default-compact view keeps the page scannable; power users drill in.

### 5.4 · Print / share (low priority)

- Clean print stylesheet
- Share link (authenticated to viewer, respecting scope)

---

## Part 6 · Edge cases

### 6.1 · Sparsely populated profile

A new profile with only basic fields populated should render gracefully — don't show empty section headers. Render sections only when their data is populated.

### 6.2 · Confidentiality constraints

If a profile has fields marked confidential (e.g., known_constraints that are sensitive), render per disclosure scope. For most users, these fields may not appear.

### 6.3 · Real-world profile accessed by unauthorized user

403 with explanation.

### 6.4 · Cross-linked profiles

Profile A references Profile B in relationships. B should link to its own profile if accessible. If not accessible to current user, render as text without link.

---

## Part 7 · Testing

### 7.1 · Visual regression

- Composite profile (rich data) vs composite profile (sparse)
- Real-world profile with AbarVa relationship populated
- Mobile, tablet, desktop
- All schema fields rendered correctly

### 7.2 · Scope enforcement

- Composite profile accessible within tenant scope
- Real-world profile access denied to non-Anand users
- Fields respect reasoning_scope and disclosure_scope

### 7.3 · Interactions

- All entity links navigate correctly
- Edit mode (if implemented) updates profile
- Cross-linked profiles navigate appropriately

---

## Part 8 · Non-goals

- No relationship graph visualization (future — might be C24 cross-tenant pattern view territory)
- No automated profile enrichment from public sources (manual population for VIPs; automation future)
- No A/B testing of profile display (future)
- No profile analytics (who views whose profile — future privacy consideration)

---

## Part 9 · Ingestion notes for Codex

### 9.1 · Dependencies

- Executive Profile System (Drop 5 from Wave 1)
- Design system from C11

### 9.2 · Scope enforcement critical

The hard boundary between composite and real-world profiles must be structural. Don't rely on application-layer filtering. URL path separation, route-layer auth checks, and data-query scoping together enforce the boundary.

### 9.3 · Profile governance visibility

The governance section (Part 2.12) is intentionally visible to users. Don't hide it. It's part of AbarVa's ethical signaling and it's appropriate content.

### 9.4 · Coordinates with C11

Executive cards on C11 home page link here. Ensure the navigation works and visual style is consistent.

---

**END C12 · EXECUTIVE PROFILE PAGES**

*The Presence vibe made visible. Where Executive Profile schema (Drop 5) becomes a navigable, editorial-quality surface.*
