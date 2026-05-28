# PHS AWS Portability Lab — 1-Week Plan

**Purpose:** Demonstrate cloud portability to PHS in Week 1 of the pilot. Confidence-building parallel track, NOT critical path. Pilot value delivery continues on Azure regardless.

**What this is not:** a production-grade HIPAA-compliant AWS deployment. That's a 3-6+ week Year-1 work stream after PHS commits and AWS architecture review completes.

**What it is:** a working AbarVa runtime on AWS — login, three modules functional, agent grounded against synthetic data, audit logging in place, demoable in their AWS account or ours.

---

## Day-by-day

### Day 1 — Architecture + account setup

**Goal:** Empty-but-correct AWS account ready to receive AbarVa runtime.

- Create or use existing AbarVa AWS account in us-east-1 (or us-west-2 if PHS prefers — confirm with them)
- VPC + 2 public + 2 private subnets across 2 AZs
- Internet gateway, NAT gateway, route tables
- Security groups: ALB-tier (443 from internet), app-tier (443 from ALB), data-tier (5432 from app-tier)
- IAM roles: app-runtime role, RDS access role, S3 access role
- KMS keys: app data (encryption at rest), Secrets Manager (encryption)
- AWS Secrets Manager: stub entries for DB credentials, OpenAI/Azure OpenAI API keys, Clerk keys
- CloudWatch log groups: app-runtime, data-tier, audit
- Terraform / IaC scaffold in `terraform/aws-portability-lab/`

**Output:** Terraform plan + apply clean; AWS account "empty but ready."

### Day 2 — Runtime deployment

**Goal:** Next.js app running, accessible via HTTPS, behind ALB.

- Build AbarVa runtime container image
  - Multi-stage Dockerfile (build → production runtime)
  - Node 24 LTS base
  - Standalone Next.js output
- Push to ECR
- ECS Fargate cluster + service + task definition
  - 2 vCPU / 4 GB memory baseline
  - 2 task minimum (1 per AZ)
  - Health checks against `/api/health`
- ALB with HTTPS listener (ACM cert auto-provisioned)
- Route53 record (`abarva-aws-lab.example.com` or similar)

**Output:** `https://abarva-aws-lab...` returns the AbarVa landing page. Container logs flow to CloudWatch.

### Day 3 — Data layer

**Goal:** Postgres + S3 + tenant data loaded with synthetic seed.

- RDS Aurora Postgres serverless v2
  - Single-cluster, multi-AZ
  - Encrypted at rest with KMS app-data key
  - Private subnet only — no public access
  - Backup retention 7 days
- Database initialization: run all `supabase/migrations/*.sql` (Postgres-compatible)
  - Includes `clients`, `applications`, `ai_initiatives`, `vendor_contracts`, `enterprise_context_chunks`, `enterprise_context_source_files`, `ai_egress_audit`, RLS policies
  - Note: Supabase-specific functions (`auth.uid()`, etc.) need to be stubbed or replaced
- S3 bucket for uploaded artifacts
  - Encryption at rest with KMS
  - Bucket policy: tenant-scoped IAM access only
  - Versioning enabled
- Seed one synthetic tenant: load the Meridian dataset (`datasets/meridian-health-synthetic-v1/`) using the existing loader pointed at AWS Aurora
- Verify: 320 chunks embedded, 140 apps, 28 initiatives, 50 contracts loaded

**Output:** AbarVa runtime can query the tenant data. Smoke: visit `/admin/context-layer` while signed in as a Meridian demo persona, see real counts.

### Day 4 — AI / data controls

**Goal:** AI egress wired, audit logging working, tenant isolation provable.

- AI egress configuration
  - Option A (faster): proxy OpenAI calls through the existing AbarVa Azure egress endpoint
  - Option B (more "AWS-native"): route through AWS Bedrock for Claude + Titan embeddings
  - Recommendation: Option A for the 1-week lab. Bedrock requires explicit model approvals + onboarding lead time.
- Audit logging
  - Every model call writes to `ai_egress_audit` in Aurora
  - Application logs flow to CloudWatch
  - Audit logs replicate to a dedicated S3 bucket with 7-year retention (HIPAA-baseline; not enforced for lab but configured for portability narrative)
- Tenant isolation smoke
  - Run `scripts/audit/db-substrate-audit.mjs` against the AWS Aurora connection
  - Verify RLS: attempt cross-tenant query as service role with `set role authenticated` + JWT claim spoofing — should fail
- No-PHI guardrails
  - Add a request middleware that scans uploaded files for HIPAA Safe Harbor identifiers (basic regex + dates)
  - Reject uploads matching PHI patterns with a clear error
  - For lab purposes only — production-grade PHI handling is Year-1

**Output:** Sentinel agent answers a Meridian question on AWS, audit row written to Aurora, no PHI leak vectors.

### Day 5 — Functional smoke

**Goal:** End-to-end demo flow works on AWS.

Run the same 13-step demo flow used for Northstar (`scripts/demo/northstar-demo-capture.mjs`), pointed at the AWS deployment:

1. Sign in as `cdio@meridian-health.example.com`
2. Land on home with Meridian branding
3. `/intelligence/ask` with 3 grounded questions
4. `/admin/context-layer` with real ingestion stages
5. `/source` with Meridian app portfolio
6. `/tower` with Meridian initiatives

Verify on AWS:
- All routes 200 OK
- Sentinel answers cite real Meridian substrate (Dr. Anita Krishnamurthy, the apps loaded, etc.)
- Audit rows flow into Aurora `ai_egress_audit`
- No console errors beyond the baseline 4 we see on Azure

**Output:** HTML report at `audit-artifacts/aws-lab-smoke-<timestamp>/` with screenshots. PHS architecture team sees the platform working in AWS.

### Day 6 — Hardening + handoff

**Goal:** PHS can hand the AWS lab to their architecture team for review.

- Terraform / IaC cleanup
  - Variable-driven (region, account ID, secret ARNs)
  - Idempotent apply
  - Tagged resources (`Project=AbarVaPortabilityLab`, `Tenant=Meridian-Demo`, `Owner=AbarVa`)
- Architecture diagram (PNG + Mermaid source)
- Security notes
  - What's HIPAA-compatible today
  - What needs Year-1 work for production (encrypt-with-CMK keys, SSO via PHS IdP, AWS Backup vault lock, GuardDuty + Inspector, AWS Config rules, full CloudTrail enabled, VPC flow logs, network ACLs hardening, customer-managed KMS keys, S3 Object Lock for audit logs)
- Cost estimate
  - Aurora serverless v2 minimum: ~$180/mo idle, ~$400/mo light load
  - ECS Fargate 2 tasks: ~$50/mo
  - ALB + NAT + data transfer: ~$80/mo
  - **Total lab steady-state: ~$300-500/mo idle, ~$700/mo light load**
  - Tear-down command included in IaC

### Day 7 — Demo script + final handoff packet

**Goal:** PHS can demo the AWS lab to their own internal stakeholders without AbarVa present.

- Demo script (15 minutes, click-by-click) — `PHS_AWS_LAB_DEMO_SCRIPT.md`
- Sign-in walkthrough — `PHS_AWS_LAB_SIGNIN_HOWTO.md`
- Architecture review packet for PHS to share with their AWS architects:
  - Architecture diagram
  - Service inventory + costs
  - Security posture summary + Year-1 production gap list
  - IaC repository link
  - Sample CloudWatch queries
  - Sample audit log entries
- Tear-down command if PHS wants to test rebuild from scratch

---

## What this lab proves (and doesn't)

### Proves
- AbarVa runtime is cloud-portable
- Core tables work on Aurora Postgres
- AI egress works from AWS
- Tenant isolation works
- Substrate loader works from AWS
- The demo flow PHS will see works identically on AWS

### Does not prove
- HIPAA production-grade controls (encrypt CMK, audit retention, full DR)
- Native Epic / Workday / Coupa integrations
- Enterprise SSO with PHS IdP
- Penetration test passed
- Full DR + RTO/RPO compliance
- BAA-covered ingestion

These are 3-6+ weeks of Year-1 production work after PHS commits, not in the 1-week lab.

---

## Cost to AbarVa for the 1-week lab

- AWS spend: ~$50 for the week (mostly tear-down before charges accumulate)
- Engineering time: ~3-4 days of one solution-architect or back-end engineer
- No external services / consultants required

---

## Risks for the 1-week lab specifically

| Risk | Mitigation |
|---|---|
| AWS account approvals / org SCPs block resource creation | Use AbarVa AWS account, demonstrate in our environment; PHS validates IaC against their account constraints in Year-1 |
| Supabase-specific functions (RLS via `auth.uid()`) don't port cleanly to Aurora | Have a workaround pattern documented; use service-role connection + application-layer tenant filter as the lab fallback (RLS narrative becomes "production hardening Year-1") |
| OpenAI egress from AWS adds latency vs Azure | Acceptable for a lab; document the ~50-100ms delta; production AWS routes through Bedrock or co-located Azure endpoint |
| AbarVa engineering capacity during the same week as pilot kickoff | Run the lab in the week BEFORE pilot kickoff (or after Day-10 Azure pilot smoke); not concurrent with PHS-facing pilot activities |

---

## Decision needed from PHS at meeting time

**Do they want the AWS lab as a parallel track, or defer to Year-1?**

If parallel track: include in this SOW, no extra cost to PHS, AbarVa absorbs.
If defer: the SOW notes the 1-week lab is available on demand in Year-1.

Either way, the pilot does NOT depend on AWS.
