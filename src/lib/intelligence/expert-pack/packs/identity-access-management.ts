// Consilium expert — Identity & Access Management (IAM) (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the enterprise IDENTITY discipline: workforce and customer
// identity (CIAM), authentication (MFA / passwordless), authorization,
// privileged access management (PAM), identity governance & administration
// (IGA), zero-trust identity, the joiner-mover-leaver (JML) lifecycle, and the
// fast-growing machine / non-human identity (NHI) estate.
//
// CORE DOCTRINE — IDENTITY IS THE NEW PERIMETER, AND THE CORE WORK IS UNGLAMOROUS.
// As the network perimeter dissolved, identity became the primary control plane
// and the dominant breach path: credential theft, MFA fatigue, and privilege
// escalation now eclipse malware as the way in. But the binding constraint on an
// IAM program is NOT clever authentication — it is HYGIENE. The unglamorous core
// is joiner-mover-leaver discipline and access recertification: provisioning the
// right access on day one, REMOVING it on role change and exit, and proving — on
// a cadence, to an auditor — that everyone has only what they need. The dominant
// risk that flows from weak hygiene is OVER-PRIVILEGE and ORPHANED ACCOUNTS:
// entitlement creep that no one ever revokes, standing privileged access that
// should be just-in-time, and dormant accounts (including service principals and
// tokens) that are perfect, unmonitored attack footholds. This expert sizes the
// breach-risk reduction and the operational relief from automating JML/IGA, and
// is honest that AI helps most at the boring part (recertification, role mining,
// access-request decisions) — but that auto-revocation that locks out a real
// worker, or auto-approval that grants toxic access, are the failure modes that
// kill trust. This is DISTINCT from cybersecurity/SecOps (the running detection
// operation): this expert owns WHO can access WHAT and HOW that is governed.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const identityAccessManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.identity-access-management",
    expertName: "Identity & Access Management (IAM) Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "identity-access-management",
    scopeNote:
      "Cross-cutting transformation of the enterprise IDENTITY discipline: " +
      "workforce and customer identity (CIAM), authentication (MFA / " +
      "passwordless / phishing-resistant), authorization, privileged access " +
      "management (PAM), identity governance & administration (IGA), zero-trust " +
      "identity, the joiner-mover-leaver (JML) lifecycle, and the machine / " +
      "non-human identity (NHI) estate (service accounts, tokens, secrets, agent " +
      "identities). The governing reality is that identity is now the primary " +
      "perimeter and the dominant breach path, but the binding constraint is " +
      "unglamorous HYGIENE — JML discipline and access recertification — and the " +
      "dominant risk is OVER-PRIVILEGE plus ORPHANED ACCOUNTS that no one ever " +
      "revokes. Excludes broad SecOps / threat detection & response (the running " +
      "security operation, owned by the cybersecurity expert), endpoint/network " +
      "security, and application-internal authorization logic as a build " +
      "discipline (integrated with, not owned). This expert owns WHO can access " +
      "WHAT, how that access is granted, governed, certified, and removed, and " +
      "how AI is safely applied to that lifecycle.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "mfa_coverage_pct",
        name: "MFA / phishing-resistant auth coverage",
        definition:
          "Share of in-scope human accounts (and privileged accounts in " +
          "particular) protected by enforced multi-factor — ideally " +
          "phishing-resistant (FIDO2/passkey) — authentication.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 99,
          basis:
            "IAM maturity benchmarks; mature programs enforce MFA on ~100% of " +
            "interactive accounts and push phishing-resistant factors for " +
            "privileged users, while gaps concentrate in legacy apps, service " +
            "accounts, and exception carve-outs",
          label: "planning-range",
        },
        dataSource:
          "IdP sign-in / conditional-access logs (MFA-enforced vs MFA-exempt " +
          "accounts) reconciled against the full account inventory",
        whyItMatters:
          "The single highest-leverage control against credential theft — the " +
          "dominant initial-access vector. Coverage gaps and weak (SMS/push) " +
          "factors are exactly where MFA-fatigue and phishing attacks land, so " +
          "the number must be read as enforced-and-phishing-resistant, not " +
          "merely 'available'.",
      },
      {
        key: "privileged_accounts_under_pam_pct",
        name: "% privileged accounts under PAM",
        definition:
          "Share of privileged / administrative accounts (human and service) " +
          "whose credentials are vaulted, session-brokered, and access-governed " +
          "by a privileged-access-management system rather than held as standing, " +
          "directly-usable credentials.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "PAM maturity benchmarks; mature programs vault and broker the large " +
            "majority of privileged access with just-in-time elevation, while " +
            "immature estates leave admin credentials standing and unmanaged",
          label: "planning-range",
        },
        dataSource:
          "PAM platform vaulted/brokered account counts reconciled against a " +
          "discovered inventory of privileged accounts across directories, " +
          "servers, databases, and cloud",
        whyItMatters:
          "Privileged access is the keys-to-the-kingdom attack target; standing, " +
          "unvaulted admin credentials are the escalation path attackers seek. " +
          "Coverage shows how much of that surface is brokered and just-in-time " +
          "vs left exposed.",
      },
      {
        key: "access_recert_completion_pct",
        name: "Access recertification completion rate",
        definition:
          "Share of scheduled access reviews / attestations (per user, role, or " +
          "entitlement) completed within the campaign window by the accountable " +
          "reviewer, with a real decision (certify or revoke) rather than blanket " +
          "rubber-stamp.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 98,
          basis:
            "IGA program benchmarks; mature governance closes campaigns above " +
            "95% on time, while immature programs miss windows or complete them " +
            "via mass rubber-stamp approvals that are completion-in-name-only",
          label: "planning-range",
        },
        dataSource:
          "IGA platform certification-campaign records (items reviewed, decided, " +
          "and actioned within window)",
        whyItMatters:
          "Recertification is the unglamorous core of access governance and the " +
          "primary audit control. Low completion (or high rubber-stamp rate) " +
          "means entitlement creep is never caught — it is read alongside the " +
          "revoke rate, because 100% certify-everything is a red flag, not a win.",
      },
      {
        key: "orphaned_account_rate",
        name: "Orphaned / dormant account rate",
        definition:
          "Share of active-enabled accounts (human and service) with no valid " +
          "owner, no recent authentication, or tied to a terminated/transferred " +
          "worker — i.e. accounts that should have been disabled but were not.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "IGA hygiene benchmarks; tightly-governed estates keep orphaned/" +
            "dormant accounts low single digits, while estates with weak " +
            "leaver/JML hygiene routinely carry 10%+ stale or ownerless accounts",
          label: "planning-range",
        },
        dataSource:
          "Reconciliation of the IdP/directory account inventory against HRIS " +
          "(active workers), last-sign-in telemetry, and service-account owner " +
          "registration",
        whyItMatters:
          "Orphaned and dormant accounts are unmonitored, attributable-to-no-one " +
          "footholds — a top breach and audit finding. The rate is the direct " +
          "measure of leaver-hygiene failure and the dominant risk this expert " +
          "exists to close.",
      },
      {
        key: "deprovisioning_time",
        name: "Time-to-revoke on offboarding (deprovisioning time)",
        definition:
          "Elapsed time from a worker's termination/exit (HRIS event) to the " +
          "full revocation of their access across all connected systems, " +
          "including privileged and federated SaaS access.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 72,
          basis:
            "JML automation benchmarks; HRIS-triggered automated deprovisioning " +
            "reaches near-real-time/same-shift, while manual ticket-driven " +
            "offboarding runs days and leaves long-tail SaaS access lingering",
          label: "planning-range",
        },
        dataSource:
          "HRIS termination timestamp vs IGA/IdP final-revocation timestamp " +
          "across the connected-application set",
        whyItMatters:
          "Every hour between exit and revocation is a window of standing access " +
          "for a departed (possibly disgruntled) worker — a classic insider and " +
          "credential-reuse risk. It is the sharpest test of leaver-side JML " +
          "automation maturity.",
      },
      {
        key: "provisioning_time",
        name: "Provisioning time (time-to-access for joiners)",
        definition:
          "Elapsed time from a joiner/mover access need (hire or role change) to " +
          "that access being correctly granted, measured to first productive " +
          "access on core systems.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 120,
          basis:
            "JML automation benchmarks; birthright/role-based auto-provisioning " +
            "delivers day-one access in hours, while manual request-and-approve " +
            "flows leave new hires waiting days for access to do their job",
          label: "planning-range",
        },
        dataSource:
          "HRIS hire/transfer timestamp vs access-grant timestamps in the " +
          "IGA/IdP provisioning logs",
        whyItMatters:
          "The joiner-side productivity and experience metric — slow provisioning " +
          "wastes new-hire ramp and drives risky workarounds (shared accounts, " +
          "over-broad temporary grants). It balances the leaver-side urgency: " +
          "fast AND correct, not fast at the cost of over-grant.",
      },
      {
        key: "sso_coverage_pct",
        name: "% of applications on SSO / federated identity",
        definition:
          "Share of in-scope enterprise applications (SaaS and internal) " +
          "integrated with the central identity provider for single sign-on and " +
          "centrally-governed access, vs apps with local/standalone credentials.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "IAM consolidation benchmarks; mature programs federate the large " +
            "majority of apps, while a long tail of legacy and departmentally-" +
            "procured SaaS resists SSO and fragments governance",
          label: "planning-range",
        },
        dataSource:
          "IdP integrated-application catalog reconciled against the SaaS/app " +
          "inventory (CASB / expense / CMDB discovery)",
        whyItMatters:
          "Apps off SSO are governance blind spots — local passwords, no central " +
          "MFA, and no automated deprovisioning, so they accumulate orphaned " +
          "access. SSO coverage is the precondition for every downstream " +
          "lifecycle and recertification control to actually reach an app.",
      },
      {
        key: "standing_privilege_pct",
        name: "Standing privilege / over-privilege rate",
        definition:
          "Share of privileged or sensitive entitlements held as STANDING access " +
          "(always-on) rather than granted just-in-time, and/or the share of " +
          "granted entitlements demonstrably unused over a trailing period " +
          "(entitlement creep).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 70,
          basis:
            "Least-privilege benchmarks; mature zero-standing-privilege programs " +
            "drive standing privileged access toward the low tens via JIT " +
            "elevation, while immature estates leave most privilege standing and " +
            "much of it unused",
          label: "planning-range",
        },
        dataSource:
          "PAM/IGA entitlement data joined to access-usage telemetry (granted vs " +
          "actually-exercised over a trailing window)",
        whyItMatters:
          "Over-privilege is the dominant risk this expert closes: unused, " +
          "always-on entitlements are pure attack surface with no offsetting " +
          "value. The metric quantifies how far the estate is from " +
          "least-privilege / zero-standing-privilege and where JIT must reach.",
      },
      {
        key: "auth_friction_rate",
        name: "Authentication failure / friction rate",
        definition:
          "Rate of failed, abandoned, or help-desk-escalated authentication " +
          "events (lockouts, MFA failures, password resets) relative to total " +
          "sign-in volume — the friction the workforce/customer experiences from " +
          "the access controls.",
        unit: "% of sign-ins",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 12,
          basis:
            "IdP and service-desk benchmarks; well-tuned passwordless/adaptive " +
            "programs keep auth friction and reset volume low, while password- " +
            "and SMS-heavy estates generate high lockout and reset load",
          label: "planning-range",
        },
        dataSource:
          "IdP authentication logs (failure/abandon rates) joined to service-desk " +
          "ticket volume for password resets and account lockouts",
        whyItMatters:
          "The user-experience and cost counterweight to security: excessive " +
          "friction drives workarounds, shadow access, and a heavy password-reset " +
          "help-desk load. Passwordless and adaptive auth are justified largely " +
          "on bending this down WITHOUT weakening assurance.",
      },
      {
        key: "nhi_governed_pct",
        name: "% of non-human / machine identities governed",
        definition:
          "Share of service accounts, tokens, secrets, certificates, and " +
          "agent/workload identities that are inventoried, owned, scoped " +
          "least-privilege, and on a credential-rotation lifecycle — vs " +
          "unmanaged, unowned, or unrotated.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 90,
          basis:
            "Emerging NHI-governance benchmarks; non-human identities now " +
            "outnumber human ones many-to-one and are the least-governed class — " +
            "mature programs inventory and rotate the majority, most estates " +
            "govern only a fraction",
          label: "planning-range",
        },
        dataSource:
          "Secrets-management / NHI-discovery tooling reconciled against cloud " +
          "IAM, directory service accounts, and CI/CD credential stores",
        whyItMatters:
          "Machine identities vastly outnumber humans, frequently hold standing " +
          "privilege, rarely have an owner, and are seldom rotated — making them " +
          "the fastest-growing and least-watched attack surface. Governance " +
          "coverage is the leading indicator of whether the NHI risk is being " +
          "contained or compounding.",
      },
      {
        key: "identity_incident_rate",
        name: "Identity-related security incident rate",
        definition:
          "Count of confirmed security incidents whose initial access or " +
          "escalation involved an identity failure — credential theft, MFA " +
          "bypass, privilege escalation, orphaned-account abuse, or token " +
          "compromise — per quarter.",
        unit: "incidents / quarter",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 12,
          basis:
            "Enterprise- and threat-environment-dependent; trended against the " +
            "org's own baseline, with identity-rooted incidents the majority of " +
            "breaches in most industry reporting",
          label: "planning-range",
        },
        dataSource:
          "Incident/case-management records classified by root-cause identity " +
          "failure mode, joined to IdP/PAM forensic logs",
        whyItMatters:
          "The outcome metric — whether all the hygiene and control work actually " +
          "reduces identity-rooted breaches. Read in-context: it is the lagging " +
          "proof that leading indicators (MFA coverage, orphaned rate, standing " +
          "privilege) are moving the real risk, not just the dashboard.",
      },
      {
        key: "least_privilege_coverage_pct",
        name: "Least-privilege / role-model coverage",
        definition:
          "Share of users whose access is granted through a governed " +
          "role/birthright model (or attribute-based policy) rather than " +
          "accumulated ad-hoc grants, and whose entitlements have been " +
          "right-sized to actual need.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "IGA role-management benchmarks; mature programs govern most access " +
            "through maintained roles/policies, while immature estates run on " +
            "ad-hoc, request-by-request grants that defeat least-privilege",
          label: "planning-range",
        },
        dataSource:
          "IGA role-model coverage reports (users on governed roles vs ad-hoc " +
          "grants) joined to entitlement-usage analytics",
        whyItMatters:
          "A maintained role/policy model is what makes least-privilege scalable " +
          "and recertification meaningful; without it, access is a sprawl of " +
          "ungoverned grants. Coverage shows whether the estate is structurally " +
          "governable or perpetually firefighting individual entitlements.",
      },
    ],

    painThemes: [
      {
        key: "over_privilege_entitlement_creep",
        name: "Over-privilege & entitlement creep",
        description:
          "Access accumulates as people change roles but old entitlements are " +
          "never removed, so users carry far more than they need — standing, " +
          "always-on, often unused privilege that is pure attack surface. The " +
          "dominant risk in the discipline: nobody ever takes access AWAY.",
        detectionSignal:
          "High standing-privilege and unused-entitlement rates, large gaps " +
          "between granted and exercised access, recertification that certifies " +
          "everything, toxic combinations (segregation-of-duties violations) " +
          "going undetected.",
        diagnosticQuestion:
          "What share of privileged access is standing vs just-in-time, how much " +
          "granted entitlement is actually unused, and how do you detect and " +
          "remove access that accumulated across role changes?",
      },
      {
        key: "orphaned_and_dormant_accounts",
        name: "Orphaned & dormant accounts (leaver-hygiene failure)",
        description:
          "Accounts of departed or transferred workers — and ownerless service " +
          "accounts — stay enabled because offboarding is manual and SaaS access " +
          "is fragmented, leaving unmonitored footholds attributable to no one. " +
          "The classic audit finding and a top breach vector.",
        detectionSignal:
          "High orphaned/dormant account rate, long time-to-revoke on " +
          "offboarding, accounts with no recent sign-in still enabled, service " +
          "accounts with no registered owner, lingering federated-SaaS access " +
          "after exit.",
        diagnosticQuestion:
          "What is your time-to-revoke on offboarding across ALL systems " +
          "(including SaaS and privileged), and how many enabled accounts have no " +
          "valid owner or no recent authentication?",
      },
      {
        key: "jml_manual_and_slow",
        name: "Manual, slow joiner-mover-leaver lifecycle",
        description:
          "The JML lifecycle runs on tickets and tribal knowledge rather than " +
          "HRIS-triggered automation, so joiners wait days for access, movers " +
          "keep stale access from prior roles, and leavers linger — the " +
          "unglamorous hygiene that everything else depends on is broken.",
        detectionSignal:
          "Long provisioning and deprovisioning times, ticket-driven access, " +
          "manual approvals with no birthright/role model, mover events that add " +
          "but never remove access, heavy reliance on a few people who 'know' " +
          "the access map.",
        diagnosticQuestion:
          "How much of joiner/mover/leaver access is HRIS-triggered and " +
          "automated vs manual ticket work, and does a role change actually " +
          "remove the access the prior role no longer needs?",
      },
      {
        key: "mfa_gaps_and_phishable_factors",
        name: "MFA gaps & phishable authentication",
        description:
          "MFA is incomplete or relies on phishable factors (SMS, simple push) " +
          "that MFA-fatigue and adversary-in-the-middle attacks defeat, while " +
          "legacy apps, service accounts, and exception carve-outs sit outside " +
          "enforcement — leaving credential theft, the dominant access vector, " +
          "wide open.",
        detectionSignal:
          "MFA coverage below target, heavy reliance on SMS/push over " +
          "phishing-resistant (FIDO2/passkey) factors, large exception lists, " +
          "MFA-fatigue/bombing incidents, legacy-auth protocols still enabled.",
        diagnosticQuestion:
          "What is your enforced MFA coverage, what share uses phishing-resistant " +
          "factors vs SMS/push, and how large is your MFA exception and " +
          "legacy-auth carve-out list?",
      },
      {
        key: "recert_rubber_stamp",
        name: "Access recertification as rubber-stamp",
        description:
          "Certification campaigns are treated as a compliance chore — reviewers " +
          "bulk-approve everything to close the window — so reviews are " +
          "completed on paper but catch no over-privilege, defeating the primary " +
          "governance control and giving auditors false comfort.",
        detectionSignal:
          "Near-100% certify rate with near-zero revoke rate, campaigns closed " +
          "in a rush at deadline, reviewers attesting to access they do not " +
          "understand, no micro-certification on high-risk entitlements, no " +
          "evidence/usage shown at decision time.",
        diagnosticQuestion:
          "What is your recertification revoke rate (not just completion rate), " +
          "and do reviewers see actual usage/risk context — or are they " +
          "rubber-stamping lists they do not understand?",
      },
      {
        key: "nhi_sprawl",
        name: "Non-human / machine identity sprawl",
        description:
          "Service accounts, tokens, secrets, certificates, and agent identities " +
          "proliferate across cloud, CI/CD, and SaaS — outnumbering humans " +
          "many-to-one, often with standing privilege, no owner, and no rotation " +
          "— forming the fastest-growing, least-governed attack surface, now " +
          "compounded by AI agents needing their own credentials.",
        detectionSignal:
          "Large unmanaged service-account and secret counts, credentials never " +
          "rotated, hard-coded secrets in code/config, tokens with broad scope " +
          "and no expiry, no owner registry, AI-agent identities provisioned " +
          "ad-hoc with human-level access.",
        diagnosticQuestion:
          "How many non-human identities exist, what share are inventoried, " +
          "owned, least-privilege-scoped, and on a rotation lifecycle — and how " +
          "are AI-agent identities being granted access today?",
      },
      {
        key: "fragmented_identity_and_shadow_access",
        name: "Fragmented identity stores & shadow access",
        description:
          "Apps off central SSO carry local credentials, departmental SaaS is " +
          "procured outside IT, and multiple directories/identity stores are " +
          "un-reconciled — so governance, MFA, and deprovisioning never reach a " +
          "long tail of access, and shadow accounts accumulate unseen.",
        detectionSignal:
          "Low SSO coverage, multiple un-reconciled directories, local app " +
          "passwords, shadow-SaaS discovered only via CASB/expense, " +
          "deprovisioning that misses apps not wired to the IdP, no single " +
          "authoritative identity of record.",
        diagnosticQuestion:
          "What share of applications are on central SSO, how many separate " +
          "identity stores exist un-reconciled, and what is your visibility into " +
          "shadow-SaaS access outside the governed estate?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_access_recertification",
        name: "AI-assisted access recertification & decision support",
        valueMechanism:
          "Surface usage evidence, peer-group comparison, and risk scoring " +
          "alongside each certification item so reviewers make REAL " +
          "certify/revoke decisions instead of rubber-stamping, and auto-flag " +
          "the high-risk and clearly-unused entitlements for revocation — turning " +
          "the unglamorous recertification core from a compliance chore into " +
          "actual over-privilege reduction.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Entitlement and role data from the IGA platform",
          "Access-usage telemetry (granted vs exercised over a trailing window)",
          "Peer-group / role-baseline data and prior certification history",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-revocation of a falsely-flagged entitlement can lock a worker out of needed access — recommendations need a confirm step and a fast restore path",
          "Usage-based 'unused' inference misjudges seasonal/rare-but-critical access — exclude break-glass and periodic entitlements from auto-flagging",
          "Reviewer over-trust in AI recommendations recreates rubber-stamping with extra steps — keep the human accountable for the decision",
        ],
        metricsMoved: [
          "access_recert_completion_pct",
          "standing_privilege_pct",
          "least_privilege_coverage_pct",
        ],
      },
      {
        key: "ai_jml_provisioning",
        name: "AI-driven joiner-mover-leaver provisioning",
        valueMechanism:
          "Predict and recommend the right birthright access for joiners and " +
          "movers from role, department, and peer patterns, and trigger " +
          "automated deprovisioning the moment an HRIS exit/transfer fires — " +
          "compressing provisioning AND deprovisioning time while ensuring movers " +
          "actually LOSE the access their prior role no longer needs.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "HRIS as the authoritative source of joiner/mover/leaver events",
          "Role/birthright model and historical access-grant patterns",
          "Connected-application provisioning integrations (SCIM/connectors)",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Predicted access can over-grant if peer patterns already carry entitlement creep — recommendations must be diffed against least-privilege, not just 'what peers have'",
          "Auto-deprovisioning on a bad/duplicate HRIS event can wrongly cut off an active worker — reconcile identity matching before revoking",
          "Mover flows must remove old access, not only add new — net-change, not additive-only, or creep compounds",
        ],
        metricsMoved: [
          "provisioning_time",
          "deprovisioning_time",
          "orphaned_account_rate",
        ],
      },
      {
        key: "ai_role_mining",
        name: "AI role mining & entitlement right-sizing",
        valueMechanism:
          "Cluster users by actual access usage and attributes to discover and " +
          "maintain a clean role model, detect outlier/excess entitlements and " +
          "toxic (segregation-of-duties) combinations, and recommend right-sized " +
          "least-privilege roles — making least-privilege scalable instead of a " +
          "perpetual manual firefight against ad-hoc grants.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Full entitlement inventory across directories, apps, and cloud",
          "Access-usage analytics to distinguish needed from accumulated access",
          "Identity attributes (department, function, location) from HRIS",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Mining from a crept estate can codify existing over-privilege into roles — anchor on usage and need, not current grants",
          "Over-consolidation into broad roles can violate least-privilege — validate proposed roles against SoD policy before adoption",
        ],
        metricsMoved: [
          "least_privilege_coverage_pct",
          "standing_privilege_pct",
          "access_recert_completion_pct",
        ],
      },
      {
        key: "adaptive_passwordless_auth",
        name: "Adaptive, risk-based & passwordless authentication",
        valueMechanism:
          "Score each authentication on context (device, location, behavior, " +
          "identity risk) to step up only when risk warrants and step down to " +
          "frictionless passwordless/passkey when it does not — raising assurance " +
          "against phishing and MFA-fatigue while LOWERING friction and " +
          "password-reset load for the workforce and customers.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "IdP sign-in signals (device posture, location, network, velocity)",
          "Identity-risk and threat-intel signals (leaked-credential, impossible-travel)",
          "Behavioral baselines per user/population",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Risk models can over-block legitimate users (e.g. travel) creating lockout/business friction — tune false-positive cost explicitly",
          "Under-tuned step-up lets adversary-in-the-middle slip through — phishing-resistant factors must back high-risk decisions",
          "Behavioral signals carry privacy and bias considerations — govern what is collected and how it is used",
        ],
        metricsMoved: [
          "mfa_coverage_pct",
          "auth_friction_rate",
          "identity_incident_rate",
        ],
      },
      {
        key: "identity_threat_detection",
        name: "Identity threat detection & anomaly response (ITDR)",
        valueMechanism:
          "Detect identity-specific attacks — credential stuffing, MFA fatigue, " +
          "impossible travel, privilege-escalation and lateral-movement patterns, " +
          "dormant-account reactivation — from IdP/PAM telemetry and trigger " +
          "graduated response (step-up, session revoke, disable), shrinking the " +
          "identity-rooted breach window the perimeter no longer guards.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "IdP and PAM authentication, authorization, and session telemetry",
          "Directory-change and privilege-grant event streams",
          "Threat-intel on leaked credentials and known-attack patterns",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Automated session-revoke/account-disable on a false positive disrupts a legitimate user — graduated response with human gate on high-impact actions",
          "Attacker behavior shifts — models drift and need retraining and tuning against false-positive load",
          "Coordinates with, but does not replace, the SOC; ownership of identity response must be explicit",
        ],
        metricsMoved: [
          "identity_incident_rate",
          "orphaned_account_rate",
          "mfa_coverage_pct",
        ],
      },
      {
        key: "ai_access_request_decisioning",
        name: "AI access-request decisioning & self-service",
        valueMechanism:
          "Let users request access in natural language and auto-recommend or " +
          "auto-approve low-risk, policy-conformant requests (and route only the " +
          "genuinely risky ones to a human) with right-sized scope and built-in " +
          "expiry — cutting access-request turnaround and help-desk load while " +
          "steering grants toward least-privilege and time-bound rather than " +
          "standing.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Access-request and approval history with outcomes",
          "Entitlement risk classification and SoD policy",
          "Role/peer-group context to scope the recommendation",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Auto-approval can grant toxic/excessive access if risk classification is wrong — high-risk and SoD-relevant entitlements stay human-approved",
          "Convenience pressure pushes the auto-approval threshold too wide — anchor it to measured risk, not request volume",
          "Granted access should default to time-bound with expiry, not standing, or self-service feeds entitlement creep",
        ],
        metricsMoved: [
          "provisioning_time",
          "auth_friction_rate",
          "standing_privilege_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "automated_jml_lifecycle",
        name: "HRIS-driven automated identity lifecycle (JML)",
        description:
          "An identity lifecycle where HRIS is the authoritative source of " +
          "joiner/mover/leaver events and provisioning, role-change, and " +
          "deprovisioning are automated through the IGA platform across connected " +
          "applications — so joiners get day-one birthright access, movers' stale " +
          "access is removed (not just added to), and leavers are revoked in " +
          "near-real-time. The unglamorous hygiene engine everything else " +
          "depends on.",
        boundary:
          "Owns the automated access lifecycle and its connectors; does not own " +
          "the HR system of record or hiring/termination process itself (it " +
          "consumes those events), nor application-internal authorization logic " +
          "(it provisions into it).",
        humanAccountabilityPoint:
          "IGA / Identity Lifecycle Lead (accountable for lifecycle policy, the " +
          "role/birthright model, and what is allowed to auto-provision and " +
          "auto-revoke)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "continuous_access_governance",
        name: "Continuous access governance & recertification",
        description:
          "Risk-based, continuous (not just periodic) certification: " +
          "micro-certifications triggered by risk events, usage-evidence and " +
          "peer context shown at decision time, SoD/toxic-combination detection, " +
          "and a measured revoke rate — replacing rubber-stamp annual campaigns " +
          "with governance that actually removes over-privilege.",
        boundary:
          "Owns access certification, SoD policy enforcement, and entitlement " +
          "governance; does not own the act of business risk acceptance (that is " +
          "the data/app owner) or the underlying role model build (shared with " +
          "the lifecycle pattern).",
        humanAccountabilityPoint:
          "Access Governance / IGA Lead (accountable for certification cadence, " +
          "SoD policy, and the revoke-rate target)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "zero_standing_privilege_pam",
        name: "Zero-standing-privilege PAM & just-in-time access",
        description:
          "Privileged access vaulted, session-brokered, and granted just-in-time " +
          "with automatic expiry and full session recording, driving standing " +
          "admin privilege toward zero — so the keys-to-the-kingdom attack target " +
          "is brokered, time-bound, and auditable rather than standing and " +
          "directly usable.",
        boundary:
          "Owns privileged credential vaulting, session brokering, and JIT " +
          "elevation; does not own the underlying operating-system/application " +
          "privilege model it brokers, nor general-user access (that is IGA).",
        humanAccountabilityPoint:
          "Privileged Access Management Lead (accountable for which privilege is " +
          "brokered/JIT vs standing, and break-glass policy)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "phishing_resistant_zero_trust_auth",
        name: "Phishing-resistant, zero-trust authentication fabric",
        description:
          "Identity as the control plane: phishing-resistant MFA (FIDO2/passkeys) " +
          "and passwordless as the default, adaptive risk-based step-up, " +
          "continuous verification, and broad SSO/federation — so authentication " +
          "is both stronger against credential theft and MFA-fatigue AND lower " +
          "friction than the password-and-SMS estate it replaces.",
        boundary:
          "Owns authentication, conditional/adaptive access policy, and SSO " +
          "federation; does not own application-internal authorization or the " +
          "network/endpoint controls that complete a full zero-trust " +
          "architecture (integrated, not owned).",
        humanAccountabilityPoint:
          "IAM / Authentication Architect (accountable for factor policy, " +
          "exception governance, and adaptive-access tuning)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "non_human_identity_governance",
        name: "Non-human / machine identity governance",
        description:
          "Discover, inventory, assign ownership, least-privilege-scope, and " +
          "rotate service accounts, tokens, secrets, certificates, and " +
          "agent/workload identities through a secrets-management and NHI- " +
          "governance layer — bringing the largest and least-governed identity " +
          "class (now including AI-agent identities) under the same lifecycle " +
          "discipline as humans.",
        boundary:
          "Owns the inventory, ownership, scoping, and rotation lifecycle of " +
          "non-human identities; does not own the workloads/applications that use " +
          "them or the cloud-platform IAM primitives (it governs their use).",
        humanAccountabilityPoint:
          "NHI / Secrets-Management Lead (accountable for the NHI inventory, " +
          "ownership registry, and rotation policy — including AI-agent identities)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "IAM value is realized as BREACH-RISK REDUCTION plus OPERATIONAL " +
        "EFFICIENCY plus AUDIT/COMPLIANCE RELIEF — and the honest truth is that " +
        "most of it comes from getting the unglamorous HYGIENE right, not from " +
        "clever authentication. The firm, directly-measurable part is " +
        "operational: automating the joiner-mover-leaver lifecycle compresses " +
        "provisioning and deprovisioning time, returns help-desk and access-admin " +
        "labor, and lifts new-hire productivity; AI-assisted recertification and " +
        "role mining cut the governance grind. The risk-reduction part is larger " +
        "but softer: closing over-privilege, orphaned accounts, MFA gaps, and " +
        "standing privilege shrinks the dominant breach path (identity-rooted " +
        "incidents are the majority of breaches), but the prize is largely " +
        "AVOIDED loss — breaches that did not happen — which is real yet " +
        "probabilistic and hard to attribute to a specific control. A third, " +
        "underrated lever is audit/compliance: automated recertification and " +
        "clean deprovisioning evidence directly reduce audit findings, " +
        "remediation cost, and access-related control deficiencies. Value must be " +
        "sized on BOTH sides of the AI ledger: AI relieves the recertification " +
        "and lifecycle grind, but auto-revocation that locks out a real worker, " +
        "or auto-approval that grants toxic access, are give-backs that must be " +
        "netted. Efficiency and audit-relief anchor the firm part of the case; " +
        "breach-risk reduction is framed as expected-loss-avoided, never as a " +
        "guaranteed return.",
      dominantHaircutFactors: [
        {
          factor: "Avoided-breach attribution uncertainty",
          rationale:
            "The largest part of the prize is identity-rooted breaches that did " +
            "not happen — inherently probabilistic and hard to attribute to a " +
            "specific control like MFA coverage or orphaned-account cleanup. " +
            "Forward value must be discounted because the counterfactual cannot " +
            "be proven.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between modeled expected-loss-avoided and what can be " +
              "defensibly attributed to a specific identity control in a security " +
              "business case",
            label: "planning-range",
          },
        },
        {
          factor: "Connector / SaaS coverage gaps",
          rationale:
            "Lifecycle automation, MFA, and recertification only reach apps wired " +
            "to the IdP/IGA; a long tail of legacy and departmental SaaS off SSO " +
            "stays manual, so realized hygiene improvement lags the modeled " +
            "estate-wide number until coverage closes.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Implementation experience where un-federated apps and missing " +
              "connectors throttled JML automation and certification reach",
            label: "planning-range",
          },
        },
        {
          factor: "AI over-/under-action give-back",
          rationale:
            "AI recertification, role mining, and access decisioning save labor, " +
            "but auto-revocation lockouts, auto-approval of toxic access, and " +
            "roles mined from a crept estate create rework and residual risk that " +
            "offset part of the efficiency gain.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Observed give-back when AI-IAM efficiency is netted against " +
              "lockout rework, mis-grants, and the validation overhead of " +
              "right-sizing recommendations",
            label: "planning-range",
          },
        },
        {
          factor: "Data quality & identity reconciliation",
          rationale:
            "JML automation and orphaned-account detection depend on clean HRIS " +
            "data and reliable identity matching across stores; duplicate, " +
            "mismatched, or stale identity data caps automation and forces manual " +
            "exception handling.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "IGA program experience where HRIS data gaps and un-reconciled " +
              "identity stores throttled lifecycle automation and reconciliation",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Lifecycle / access-admin labor reduction",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reported reduction in manual provisioning/deprovisioning and " +
              "access-admin effort from HRIS-driven JML automation and " +
              "self-service access in mature IGA programs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in access-administration and help-desk " +
            "password/access labor (and in provisioning/deprovisioning time)",
        },
        {
          lever: "Over-privilege / standing-access reduction",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Reported reduction in standing privileged access and excess " +
              "entitlement from JIT/PAM, role mining, and usage-driven " +
              "recertification programs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in standing_privilege_pct and unused entitlement " +
            "against the org's own baseline",
        },
        {
          lever: "Expected identity-breach-loss avoided (risk reduction)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Modeled reduction in expected annualized loss from closing MFA " +
              "gaps, orphaned accounts, and standing privilege — probabilistic, " +
              "not booked",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in modeled expected-loss (frequency x impact) " +
            "from identity-rooted incidents, framed as avoided loss",
        },
      ],
      timeToValueBand:
        "MFA / phishing-resistant rollout and SSO consolidation: 1-3 quarters " +
        "for measurable coverage and friction relief on the federated estate. " +
        "HRIS-driven JML automation: 2-4 quarters as connectors and the role " +
        "model mature (the long-tail SaaS is the gating work). PAM / " +
        "zero-standing-privilege and AI-assisted recertification: 2-4 quarters, " +
        "gated on a clean privileged-account inventory and usage telemetry. NHI " +
        "governance and full continuous-governance maturity: 12-24 months, gated " +
        "on discovery completeness and identity-data reconciliation.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Identity Provider (IdP) / directory",
          role:
            "The authentication and access control plane and the authoritative " +
            "store of identities and sign-in policy — where MFA, conditional/" +
            "adaptive access, and SSO are enforced.",
          examples: [
            "Microsoft Entra ID",
            "Okta",
            "Ping Identity",
            "ForgeRock / PingOne",
          ],
        },
        {
          name: "Identity Governance & Administration (IGA)",
          role:
            "Governs the access lifecycle: provisioning/deprovisioning, the " +
            "role/birthright model, access requests, certification campaigns, and " +
            "SoD policy — the system of record for who-has-what and why.",
          examples: [
            "SailPoint",
            "Saviynt",
            "Microsoft Entra ID Governance",
            "Omada",
          ],
        },
        {
          name: "Privileged Access Management (PAM)",
          role:
            "Vaults privileged credentials, brokers and records privileged " +
            "sessions, and grants just-in-time elevation — the control plane for " +
            "the privileged-access attack surface.",
          examples: [
            "CyberArk",
            "BeyondTrust",
            "Delinea",
            "Microsoft Entra Privileged Identity Management",
          ],
        },
        {
          name: "HRIS (authoritative worker source)",
          role:
            "The system of record for worker joiner/mover/leaver events that " +
            "drives the automated identity lifecycle — IAM consumes, it does not " +
            "own, this source.",
          examples: ["Workday", "SAP SuccessFactors", "Oracle HCM", "UKG"],
        },
        {
          name: "Customer Identity (CIAM)",
          role:
            "Manages external/customer identity: registration, authentication, " +
            "consent, and progressive profiling — distinct from workforce " +
            "identity in scale, UX sensitivity, and privacy obligations.",
          examples: [
            "Okta Customer Identity (Auth0)",
            "Microsoft Entra External ID",
            "Ping (CIAM)",
            "Transmit Security",
          ],
        },
        {
          name: "Secrets / non-human identity management",
          role:
            "Inventories, scopes, and rotates service accounts, tokens, secrets, " +
            "certificates, and workload/agent identities — governance for the " +
            "machine-identity estate.",
          examples: [
            "HashiCorp Vault",
            "CyberArk Conjur",
            "Cloud-native secret managers (AWS/Azure/GCP)",
            "NHI-discovery tooling (e.g. Astrix, Oasis)",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Information Security Officer (CISO) / Identity owner",
          accountability:
            "Enterprise identity strategy and risk posture, the decision on how " +
            "much autonomy AI is granted in access decisions, and accountability " +
            "for identity-rooted breach risk.",
        },
        {
          title: "IAM / Identity Lifecycle Lead",
          accountability:
            "The joiner-mover-leaver lifecycle, provisioning/deprovisioning " +
            "automation, the role/birthright model, and time-to-access and " +
            "time-to-revoke outcomes.",
        },
        {
          title: "Access Governance / IGA Lead",
          accountability:
            "Access certification cadence and quality (revoke rate, not just " +
            "completion), SoD/toxic-combination policy, and entitlement " +
            "governance.",
        },
        {
          title: "Privileged Access Management (PAM) Lead",
          accountability:
            "Vaulting, session brokering, just-in-time elevation, " +
            "zero-standing-privilege progress, and break-glass policy for " +
            "privileged access.",
        },
        {
          title: "Authentication / CIAM Architect",
          accountability:
            "MFA and passwordless factor policy, adaptive/conditional access " +
            "tuning, SSO federation, and the workforce/customer authentication " +
            "experience.",
        },
      ],
      regulatoryFrames: [
        {
          name: "NIST 800-63 Digital Identity Guidelines & NIST CSF (Protect)",
          relevance:
            "The authoritative guidance on identity assurance, authenticator " +
            "(AAL/IAL) levels, and the access-control controls enterprises map " +
            "authentication and governance maturity against.",
        },
        {
          name: "SOX & financial-controls audit (access controls, SoD)",
          relevance:
            "Access recertification, segregation-of-duties enforcement, and " +
            "clean joiner-mover-leaver evidence are core SOX IT general controls; " +
            "weak hygiene becomes a control deficiency or material weakness.",
        },
        {
          name: "Privacy & consent regimes (GDPR, CCPA) for CIAM",
          relevance:
            "Customer-identity programs must govern consent, data minimization, " +
            "and subject rights — making CIAM authentication and profile data " +
            "handling a privacy-compliance obligation, not just a security one.",
        },
        {
          name: "Sector identity/access mandates (PCI DSS, HIPAA, FFIEC/NYDFS)",
          relevance:
            "Industry rules set minimum MFA, least-privilege, privileged-access, " +
            "and access-review requirements that the IAM program must satisfy and " +
            "evidence to auditors and regulators.",
        },
      ],
      canonicalTerms: [
        {
          term: "Joiner-Mover-Leaver (JML)",
          definition:
            "The identity lifecycle: provisioning access on hire (joiner), " +
            "adjusting it on role change (mover), and removing it on exit " +
            "(leaver) — the unglamorous hygiene core of access management.",
        },
        {
          term: "Least privilege / zero standing privilege",
          definition:
            "Granting only the access needed for a task, and holding privileged " +
            "access just-in-time with expiry rather than always-on — the target " +
            "state that closes over-privilege.",
        },
        {
          term: "Orphaned account",
          definition:
            "An enabled account with no valid owner or tied to a departed/" +
            "transferred worker — an unmonitored, attributable-to-no-one foothold " +
            "and a top audit finding.",
        },
        {
          term: "Access recertification (attestation)",
          definition:
            "A periodic or risk-triggered review where an accountable owner " +
            "certifies or revokes each user's access — the primary access " +
            "governance control, worthless when rubber-stamped.",
        },
        {
          term: "Privileged Access Management (PAM)",
          definition:
            "Vaulting, brokering, and just-in-time-granting of administrative " +
            "credentials and sessions to protect the keys-to-the-kingdom attack " +
            "target.",
        },
        {
          term: "Non-human identity (NHI) / machine identity",
          definition:
            "Service accounts, tokens, secrets, certificates, and workload/agent " +
            "identities — now outnumbering humans many-to-one and the " +
            "fastest-growing, least-governed attack surface.",
        },
        {
          term: "Phishing-resistant MFA",
          definition:
            "Authentication factors (FIDO2/passkeys, certificate-based) that " +
            "resist phishing and adversary-in-the-middle attacks, unlike phishable " +
            "SMS or simple push.",
        },
        {
          term: "Segregation of duties (SoD) / toxic combination",
          definition:
            "A pair of entitlements that, held together, enable fraud or error " +
            "(e.g. create-vendor + approve-payment) — a governance violation that " +
            "recertification and access requests must detect.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Authentication & MFA posture (coverage, factor strength)",
        authoritativeSource:
          "IdP sign-in / conditional-access logs (MFA-enforced vs exempt, factor " +
          "type) reconciled against the full account inventory",
        whatGoodEvidenceLooksLike:
          "Enforced MFA coverage split by phishing-resistant vs phishable " +
          "factors, with the exception/legacy-auth carve-out list quantified and " +
          "privileged-account coverage called out separately.",
        weakEvidenceToReject:
          "A vendor 'MFA available for 100% of users' claim with no enforced-vs-" +
          "available split and no exception list.",
      },
      {
        claim: "Access-governance hygiene (recertification, over-privilege)",
        authoritativeSource:
          "IGA certification-campaign records (completion AND revoke rate) and " +
          "entitlement-vs-usage analytics from the IGA platform",
        whatGoodEvidenceLooksLike:
          "Recertification completion WITH a non-trivial revoke rate, standing-" +
          "privilege and unused-entitlement percentages from usage telemetry, and " +
          "SoD-violation counts detected and remediated.",
        weakEvidenceToReject:
          "A near-100% certification completion rate with a near-zero revoke " +
          "rate presented as 'governed' — that is rubber-stamping, not governance.",
      },
      {
        claim: "Lifecycle hygiene (orphaned accounts, time-to-revoke)",
        authoritativeSource:
          "Reconciliation of the IdP/directory inventory against HRIS active " +
          "workers and last-sign-in telemetry, plus HRIS-to-revocation timestamps",
        whatGoodEvidenceLooksLike:
          "Orphaned/dormant account rate from an active HRIS-vs-directory " +
          "reconciliation, and time-to-revoke measured across ALL connected " +
          "systems (including SaaS and privileged), not just the IdP.",
        weakEvidenceToReject:
          "A 'we deprovision on exit' assertion with no measured time-to-revoke " +
          "and no reconciliation showing orphaned accounts are actually closed.",
      },
      {
        claim: "Privileged & non-human identity coverage",
        authoritativeSource:
          "PAM vaulted/brokered counts and NHI-discovery/secrets tooling " +
          "reconciled against discovered privileged and service-account inventories",
        whatGoodEvidenceLooksLike:
          "% privileged accounts vaulted and under JIT, and % of non-human " +
          "identities inventoried, owned, scoped, and on a rotation lifecycle — " +
          "against a DISCOVERED (not assumed) inventory.",
        weakEvidenceToReject:
          "A privileged- or service-account coverage figure based on a known " +
          "list with no active discovery of the true population.",
      },
      {
        claim: "IAM value (efficiency + audit relief + risk reduction)",
        authoritativeSource:
          "Access-admin/help-desk labor and provisioning/deprovisioning-time " +
          "deltas from IGA logs, audit-finding deltas, and a modeled " +
          "expected-loss-avoided framed as probabilistic",
        whatGoodEvidenceLooksLike:
          "Firm efficiency and audit-relief deltas (labor, lifecycle time, " +
          "access-related findings) as the anchored part, with breach-risk " +
          "reduction explicitly framed as expected-loss-avoided and netted " +
          "against AI over-/under-action give-back.",
        weakEvidenceToReject:
          "A guaranteed-dollar 'breaches prevented' ROI with no counterfactual " +
          "and no offset for lockout rework or coverage gaps.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your enforced MFA coverage, what share uses phishing-resistant factors vs SMS/push, and how large is your exception/legacy-auth carve-out — including on privileged accounts?",
      "What share of privileged access is standing vs just-in-time and vaulted under PAM, and how much granted entitlement is demonstrably unused (entitlement creep)?",
      "What is your access recertification REVOKE rate (not just completion), and do reviewers see real usage/risk context — or is it a rubber-stamp?",
      "What is your time-to-revoke on offboarding across ALL systems (SaaS and privileged included), and how many enabled accounts have no valid owner or no recent sign-in?",
      "How much of joiner/mover/leaver access is HRIS-triggered and automated vs manual ticket work — and does a role change actually REMOVE the prior role's access?",
      "What share of applications are on central SSO, how many un-reconciled identity stores exist, and how many non-human identities are inventoried, owned, scoped, and rotated?",
      "Where are you applying AI to recertification, role mining, or access requests today, and what guardrails fence auto-revocation lockouts and auto-approval of toxic access?",
    ],
    maturitySignals: [
      "MFA is enforced near-universally with phishing-resistant factors for privileged users, and legacy-auth/exception carve-outs are actively shrinking, not absorbed.",
      "The JML lifecycle is HRIS-driven and automated end to end — joiners get day-one birthright access, mover events REMOVE stale access, and leavers are revoked in near-real-time across SaaS and privileged systems.",
      "Recertification is risk-based and continuous with a measured, non-trivial revoke rate and usage evidence at decision time — over-privilege is actually removed, not rubber-stamped.",
      "Privileged access trends toward zero standing privilege (vaulted + JIT) and non-human identities are inventoried, owned, and rotated — the largest and least-governed class is under lifecycle discipline.",
    ],
    redFlags: [
      "Orphaned/dormant accounts are common and time-to-revoke runs days, with lingering SaaS and privileged access after worker exit — leaver hygiene is broken.",
      "Recertification completion is near 100% but the revoke rate is near zero — reviews are rubber-stamped and catch no over-privilege, giving auditors false comfort.",
      "Privileged access is largely standing and unvaulted, and a large share of granted entitlement is unused — the keys-to-the-kingdom surface is wide open to escalation.",
      "Non-human identities (service accounts, tokens, AI-agent identities) are unmanaged, unowned, and unrotated — the fastest-growing attack surface is invisible to governance.",
      "MFA relies on phishable SMS/push with large exception lists and enabled legacy-auth — credential theft and MFA-fatigue attacks have an open path.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Identity Providers (Microsoft Entra ID, Okta, Ping)",
        category: "Authentication, SSO, conditional/adaptive access",
        switchingCost:
          "Very high — the IdP is the authentication control plane; federated " +
          "app integrations, conditional-access policy, and directory data " +
          "accrete, and Microsoft's bundling of Entra into E5/M365 makes it the " +
          "default-by-economics for much of the market.",
        renewalDynamics:
          "Per-user subscription, frequently bundled into broader suites (M365 " +
          "E5); premium identity-governance and ITDR tiers upsold at renewal — " +
          "watch suite-bundle lock-in vs best-of-breed.",
      },
      {
        vendorName: "IGA platforms (SailPoint, Saviynt, Omada)",
        category: "Identity governance, lifecycle, certification",
        switchingCost:
          "High — connectors, the role model, certification workflows, and " +
          "policy represent multi-quarter build investment; the value is in the " +
          "governance content accreted, which is costly to rebuild.",
        renewalDynamics:
          "Per-identity subscription; SaaS/cloud IGA and AI-governance modules " +
          "are the premium-priced growth tiers — connector breadth and AI " +
          "features drive renewal pricing.",
      },
      {
        vendorName: "PAM platforms (CyberArk, BeyondTrust, Delinea)",
        category: "Privileged access management and just-in-time elevation",
        switchingCost:
          "High — vaulted credentials, brokered-session integrations, and " +
          "privileged workflows are deeply embedded in operations; re-platforming " +
          "PAM touches every privileged path and is operationally risky.",
        renewalDynamics:
          "Per-privileged-user/-account or per-vault pricing; cloud-PAM, " +
          "secrets, and non-human-identity modules are the expanding, " +
          "premium-priced segments.",
      },
      {
        vendorName: "CIAM platforms (Auth0/Okta CIC, Entra External ID, Transmit)",
        category: "Customer identity, authentication, and consent",
        switchingCost:
          "High — customer-facing auth is embedded in product flows and tied to " +
          "the live user base; migration risks user friction and churn, making " +
          "re-platforming a product-level decision.",
        renewalDynamics:
          "MAU/active-user-based pricing that scales with the customer base — " +
          "watch step-function pricing as the user base grows and fraud/passwordless " +
          "add-ons.",
      },
      {
        vendorName: "Secrets / NHI-governance tooling (HashiCorp Vault, CyberArk Conjur, NHI-discovery)",
        category: "Non-human identity, secrets, and rotation governance",
        switchingCost:
          "Moderate-to-high — secrets integrations wire into CI/CD, cloud, and " +
          "applications; the fast-emerging NHI-discovery segment is less " +
          "entrenched and more negotiable today.",
        renewalDynamics:
          "Per-secret/-identity or consumption-based pricing; NHI governance is " +
          "an early, fast-growing category — leverage exists before it entrenches.",
      },
    ],
    switchingCosts:
      "The IdP and PAM cores are effectively non-switchable in the short term " +
      "(authentication control plane, embedded privileged workflows, directory " +
      "and policy gravity), and IGA stickiness lives in the connectors and role " +
      "model built — so the negotiable frontier is disciplining suite-bundle " +
      "vs best-of-breed economics (especially Entra-in-E5 vs Okta/SailPoint), " +
      "controlling per-identity and MAU pricing growth as the estate and " +
      "customer base scale, and capturing the still-emerging NHI-governance " +
      "category before it entrenches.",
    negotiationLevers: [
      "Weigh the IdP suite bundle (Entra in M365 E5) against best-of-breed (Okta + SailPoint) on total cost AND governance depth — the bundle's gravity is the lock-in to price against",
      "Cap per-identity (IGA) and per-privileged-account (PAM) pricing growth with committed-volume and enterprise-true-up terms as the governed estate expands",
      "Tie AI-governance / ITDR premium tiers to measured efficacy (revoke-rate lift, deprovisioning-time reduction) rather than flat per-seat uplift",
      "Negotiate connector breadth and SaaS-integration coverage explicitly — the long-tail SaaS that defeats lifecycle automation is where coverage gaps (and value haircuts) live",
      "Secure data-portability, audit, and explainability rights on AI access-decisioning and role-mining models to avoid lock-in and satisfy audit/SoD evidence needs",
      "Negotiate CIAM MAU pricing step-functions and fraud/passwordless add-ons up front, before the customer base growth removes leverage",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      authentication_claim: [
        "IdP enforced-MFA coverage split by factor strength (phishing-resistant vs phishable)",
        "exception and legacy-auth carve-out list quantified",
        "privileged-account coverage called out separately",
      ],
      governance_hygiene_claim: [
        "recertification completion AND revoke rate (not completion alone)",
        "standing-privilege and unused-entitlement percentages from usage telemetry",
        "SoD/toxic-combination violations detected and remediated",
      ],
      lifecycle_claim: [
        "orphaned/dormant account rate from HRIS-vs-directory reconciliation",
        "time-to-revoke measured across ALL connected systems (SaaS + privileged)",
        "provisioning time and the share of JML that is HRIS-automated vs manual",
      ],
      privileged_nhi_claim: [
        "% privileged accounts vaulted and under JIT against a DISCOVERED inventory",
        "% non-human identities inventoried, owned, scoped, and rotated",
        "active discovery of the true privileged/service-account population",
      ],
      iam_value_projection: [
        "firm efficiency and audit-relief deltas (admin/help-desk labor, lifecycle time, access findings)",
        "breach-risk reduction framed as expected-loss-avoided (probabilistic)",
        "explicit offset for AI over-/under-action give-back (lockouts, mis-grants) and coverage gaps",
        "labelled planning range and haircut factors",
      ],
    },
    citationStandard:
      "Quantitative IAM claims cite the system of record — IdP, IGA, PAM, HRIS, " +
      "or NHI/secrets tooling — over a stated trailing period, reconciled against " +
      "a DISCOVERED (not assumed) inventory, and compared to the org's own " +
      "baseline. Governance claims always pair completion with the REVOKE rate, " +
      "because completion alone hides rubber-stamping; coverage claims (MFA, PAM, " +
      "NHI) are stated against an actively-discovered population, not a known " +
      "list. IAM value claims separate the FIRM part (measured efficiency and " +
      "audit-finding relief) from the PROBABILISTIC part (expected " +
      "identity-breach-loss avoided), cite a labelled planning range and haircut " +
      "factors, and ALWAYS net efficiency against the AI over-/under-action " +
      "give-back (lockouts, mis-grants) — never a guaranteed-dollar 'breaches " +
      "prevented' number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no measured baseline for MFA coverage, orphaned-account rate, time-to-revoke, or standing privilege — frame metrics as industry planning ranges, not their numbers.",
      "Recertification is cited by completion rate alone — flag that completion without a measured revoke rate may be rubber-stamping, and the over-privilege claim is incomplete.",
      "Coverage (MFA, PAM, NHI) is asserted against a known list rather than active discovery — present the likely discovered-vs-assumed gap explicitly.",
      "IAM value is expressed as a guaranteed return — reframe identity-breach-loss reduction as probabilistic expected-loss-avoided, not booked savings.",
      "Vendor-reported governance or automation efficacy figures are cited — mark as provider claims pending validation against the tenant's own IGA/IdP/PAM data.",
    ],
    inferenceLanguage: [
      "Across enterprise identity programs at this scale, MFA coverage and orphaned-account rates typically run...",
      "Without your measured baseline, the industry pattern suggests JML automation commonly cuts deprovisioning time by roughly...",
      "Treating identity-breach reduction as expected-loss-avoided rather than a guaranteed return...",
      "Peer programs at this maturity commonly reach a standing-privilege rate of... once just-in-time access is in place...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or number of 'breaches prevented' for this tenant",
      "This tenant's actual MFA coverage, orphaned-account rate, time-to-revoke, standing-privilege, or NHI-governance figures",
      "A claim that recertification is effective based on completion rate without a measured revoke rate",
      "A claim that MFA, privileged, or non-human identity coverage is complete without active discovery of the true population",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "identity posture scorecard / how is the IAM program doing",
      exhibitKind: "table",
      note: "MFA coverage (and factor strength), % privileged under PAM, recertification completion AND revoke rate, orphaned-account rate, time-to-revoke, provisioning time, % apps on SSO, standing privilege, NHI governed, identity-incident rate vs planning ranges and own baseline.",
    },
    {
      questionPattern:
        "IAM value story / hygiene efficiency plus audit relief plus risk reduction with honest offsets",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current state to lifecycle/admin labor savings to audit-finding relief to expected identity-breach-loss avoided to net value, showing the attribution, coverage-gap, and AI over-/under-action haircuts explicitly.",
    },
    {
      questionPattern:
        "over-privilege / entitlement-creep concentration — where to right-size access",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Entitlements by privilege risk x usage (granted-but-unused), concentrating recertification and right-sizing on the standing, high-risk, unused access that is pure attack surface.",
    },
    {
      questionPattern:
        "joiner-mover-leaver lifecycle time / provisioning and deprovisioning trend",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend provisioning and deprovisioning (time-to-revoke) against baseline and planning range to show whether HRIS-driven JML automation is bending the curve — especially on the leaver side.",
    },
    {
      questionPattern:
        "orphaned / dormant account funnel — how the account estate reconciles",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Total enabled accounts → matched-to-active-worker → MFA-enforced → recently-authenticated → owner-registered (service accounts) → residual orphaned/dormant, exposing where leaver-hygiene failure concentrates.",
    },
    {
      questionPattern: "identity control / coverage map across the IAM domains",
      exhibitKind: "table",
      note: "Per domain (authentication/MFA, JML lifecycle, access governance, PAM, CIAM, non-human identity): controls in place, coverage %, gaps, and remediation priority.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The unglamorous hygiene is treated as the core — HRIS-driven JML automation and a real recertification revoke rate are prioritized over flashy authentication, because over-privilege and orphaned accounts are the dominant risk",
      "Coverage is real before AI is layered on — broad SSO, clean HRIS data, and an actively-discovered privileged and non-human identity inventory, so lifecycle automation and recertification actually reach the whole estate",
      "AI is aimed at the boring, high-volume work (recertification decisions, role mining, access requests) with guardrails against auto-revocation lockouts and auto-approval of toxic access — net-change, not additive-only",
      "Privileged and non-human identities are brought under just-in-time, owned, rotated lifecycle discipline — the keys-to-the-kingdom and the fastest-growing attack surface are governed, not assumed",
    ],
    failureDrivers: [
      "Recertification is run as a rubber-stamp (high completion, zero revoke) so over-privilege is never removed and auditors get false comfort — the control exists on paper only",
      "The long-tail SaaS off SSO and the un-reconciled identity stores are never closed, so leaver hygiene, MFA, and governance miss a permanent shadow estate of orphaned access",
      "AI access decisioning or role mining is trained on a crept estate and codifies existing over-privilege, or auto-revocation lockouts erode trust and the program stalls",
      "Value is sold as guaranteed-dollar 'breaches prevented' ROI; when the counterfactual cannot be proven, board confidence in the next identity investment collapses",
      "Non-human and AI-agent identities are left ungoverned with standing privilege, so the attack surface compounds faster than the human-identity gains close it",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adaptive/passwordless authentication and SSO consolidation adopt first and " +
      "fastest because the value (security + lower friction) is tangible and the " +
      "patterns are well-understood. HRIS-driven JML automation and AI-assisted " +
      "recertification follow as connectors, the role model, and data quality " +
      "mature — gated on the unglamorous integration and reconciliation work. " +
      "Zero-standing-privilege PAM and AI role mining come next as privileged " +
      "inventory and usage telemetry firm up. Non-human/AI-agent identity " +
      "governance and full continuous-governance maturity adopt last, as " +
      "discovery and ownership catch up to a sprawling estate. Throughout, " +
      "adoption hinges on the business tolerating the friction of removing access " +
      "(the politically hard part) and trusting AI recommendations enough to act " +
      "without rubber-stamping or lockout fear.",
    roiClarity: "medium",
    roiClarityBasis:
      "IAM ROI is firmer on the EFFICIENCY and AUDIT-RELIEF halves (access-admin " +
      "and help-desk labor, provisioning/deprovisioning time, and access-control " +
      "audit findings are directly measurable in IGA/IdP/PAM and audit records) " +
      "but inherently softer on the RISK-REDUCTION half: the prize is largely " +
      "avoided identity-rooted breaches — real but probabilistic and unprovable " +
      "via counterfactual. Clarity is further reduced by the AI give-back: " +
      "auto-revocation lockouts and auto-approval mis-grants offset part of the " +
      "labor saving, and coverage gaps (un-federated SaaS, undiscovered NHI) cap " +
      "realized hygiene below the modeled estate. This is why the evidence and " +
      "hedge rules anchor the case on measured efficiency and audit relief, pair " +
      "every governance claim with the revoke rate, and frame breach-risk " +
      "reduction as expected-loss-avoided, never as a guaranteed return.",
  },

  regulatoryFrame: {
    name: "NIST 800-63 / CSF + SOX access controls + privacy & sector identity mandates",
    relevance:
      "The governing frame is layered: NIST 800-63 digital-identity guidelines " +
      "and NIST CSF (Protect) set identity-assurance and access-control " +
      "expectations enterprises map authentication and governance maturity " +
      "against; SOX IT general controls make access recertification, " +
      "segregation-of-duties, and clean joiner-mover-leaver evidence audited " +
      "financial controls (weak hygiene becomes a control deficiency); privacy " +
      "regimes (GDPR, CCPA) govern customer-identity (CIAM) consent and data; " +
      "and sector mandates (PCI DSS, HIPAA, FFIEC/NYDFS) set minimum MFA, " +
      "least-privilege, and privileged-access requirements the program must " +
      "evidence (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (cio)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
