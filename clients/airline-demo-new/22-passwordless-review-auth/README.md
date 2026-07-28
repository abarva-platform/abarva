# Passwordless (Entra) database access for the Airline review job

Goal: `mi-airdn-review-lab-001` reaches the airline lab PostgreSQL using a
Microsoft Entra token — no PostgreSQL administrator password, no Key Vault
secret-read for DB credentials. Least privilege: SELECT only on candidate/evidence
structures for DRY-RUN package generation; no publication or baseline activation.

## Current state (verified read-only)

- PG server `pg-abarva-airdn-lab-eus2-001`: **`activeDirectoryAuth: Disabled`**,
  `passwordAuth: Enabled`, `tenantId: null`. So passwordless is not merely missing
  a role — the **server-level Entra bridge is off**. This is the gap to implement.
- Review job `job-airdn-review-apply-lab` already runs as `mi-airdn-review-lab-001`
  (objectId `1c570a7e-8fc1-4cf5-9bf4-2bef30023334`), container `airdn-job`.

## Bridge (IaC + governed migration)

### Step 1 — Enable Entra auth on the server (IaC). One decision required.
```
az postgres flexible-server update \
  -n pg-abarva-airdn-lab-eus2-001 -g rg-abarva-airdn-lab-eus2-001 \
  --active-directory-auth Enabled          # keep passwordAuth for break-glass, or disable later

# Set the Entra ADMIN principal that will provision the review role.
# DECISION: which principal is the PG Entra admin? (an admin group is preferred
# over an individual; a bootstrap admin MI is also fine). This is the one input
# that should be confirmed rather than defaulted.
az postgres flexible-server ad-admin create \
  -s pg-abarva-airdn-lab-eus2-001 -g rg-abarva-airdn-lab-eus2-001 \
  --object-id <ENTRA_ADMIN_OBJECT_ID> --display-name <ENTRA_ADMIN_NAME> \
  --type <User|Group|ServicePrincipal>
```

### Step 2 — Create the least-privilege review role (governed migration)
Connect to `abarva_airline_demo_new_knowledge_lab` **as the Entra admin** (token
auth, passwordless) and run `001_review_role_entra.sql`. It creates the
Entra-mapped role for the review MI and grants SELECT only — no writes, no
publication/consumption, no object creation.

### Step 3 — Review job uses the MI token (no script change)
The review job’s command acquires the Entra token from IMDS and uses it as
`PGPASSWORD` (the review-package script already reads `PGHOST/PGUSER/PGDATABASE/
PGPASSWORD`):
```
CLIENT_ID=c9e786c3-47b3-458f-b26a-c3effbe34273   # mi-airdn-review-lab-001
export PGHOST=pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com
export PGPORT=5432 PGDATABASE=abarva_airline_demo_new_knowledge_lab PGSSLMODE=require
export PGUSER=mi-airdn-review-lab-001
export PGPASSWORD=$(curl -s -H Metadata:true \
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fossrdbms-aad.database.windows.net&client_id=${CLIENT_ID}" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).access_token))')
node scripts/knowledge/build-review-decision-ledger.mjs --from-db --mode dry-run \
  --tenant airline-demo-new --release-id airline-demo-new-source-corpus-v1.0.0 \
  --validation-run-ref airline-demo-new-knowledge-validate-v1-20260728-002 \
  --reviewer <reviewer-identity> --policy-version knowledge-review-decision-policy-v2 \
  --out-dir /tmp/airline-review-package-dry-run --emit-proof-bundle
```
Run this via the review job with image updated to the v2 digest. Dry-run writes
nothing. The proof bundle streams back for step-D human review.

## Why passwordless is the permanent answer
The review identity needs neither the PG admin password nor KV secret-read for
credentials, nor publication/activation rights. Using the admin secret for a
read-only dry-run would be privilege escalation and add rotation/restore risk.

## Open decision
The only input needed to proceed is the **Entra admin principal** for Step 1
(which group/identity administers the lab PG server). Enabling Entra auth on the
shared lab server is a real infra change; it should be applied deliberately with
that principal confirmed.
