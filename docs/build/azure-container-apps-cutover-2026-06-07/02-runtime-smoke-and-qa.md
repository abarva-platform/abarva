# Azure Container Apps Cutover - Runtime Smoke and QA

Date: 2026-06-07  
Status: FAIL - signed-in QA blocks DNS cutover

## Smoke and signed-in QA record

| Surface / proof                      | Evidence                                                                                                                                                                                                                               | Status  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Public Home                          | Unauthenticated `GET /` on Azure FQDN returned HTTP 200, 29,730 bytes                                                                                                                                                                  | PASS    |
| Azure runtime DB smoke               | Azure runtime exec connected to Azure Postgres `abarva_control` at `10.43.1.4/32` and counted required tables                                                                                                                          | PASS    |
| Intelligence / Sentinel signed-in QA | Apex CDO and Meridian CDAO authenticated sessions loaded `/intelligence` with HTTP 200                                                                                                                                                 | PASS    |
| Moves signed-in QA                   | Apex CDO and Meridian CDAO authenticated sessions loaded `/strategic-moves` with HTTP 500                                                                                                                                              | FAIL    |
| Source signed-in QA                  | Apex CDO and Meridian CDAO authenticated sessions loaded `/source` with HTTP 500                                                                                                                                                       | FAIL    |
| Tower signed-in QA                   | Apex CDO and Meridian CDAO authenticated sessions loaded `/tower` with HTTP 500                                                                                                                                                        | FAIL    |
| Setup / Admin signed-in QA           | Apex CDO and Meridian CDAO authenticated sessions redirected `/admin` to `/home` with HTTP 500                                                                                                                                         | FAIL    |
| Home signed-in QA                    | Apex CDO and Meridian CDAO authenticated sessions loaded `/home` with HTTP 500                                                                                                                                                         | FAIL    |
| Claude/Anthropic reasoning proof     | Runtime env probe showed `ANTHROPIC_API_KEY` present and `NEXUS_COMPOSER_MODEL` is a Claude model; direct runtime Anthropic call was not run because subsequent Container Apps exec calls hit `429 Too Many Requests` retry-after 600s | PARTIAL |
| Zero Supabase runtime calls          | Env probe showed no Supabase env vars; boot guard passed; app logs still contain denied strings `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from old bundled runtime errors                                             | FAIL    |

## Acceptance

DNS must not change until public smoke and signed-in QA pass on the Azure
Container Apps FQDN.

## Signed-in QA details

Authentication method:

- Azure app `/api/auth/demo-code-sign-in` minted tickets without printing token
  values.
- `cdo@apex-retail.example.com` and `cdao@meridian-health.example.com` were
  used for QA.
- Apex CDO was unbanned via Clerk `unbanUser`; Meridian CDAO was already
  unbanned.
- Browser sessions confirmed `__session` cookies and active-client cookies:
  `apexretail` and `meridian`.

Result summary:

| User          | Surface               | Status | Final URL          | Verdict |
| ------------- | --------------------- | -----: | ------------------ | ------- |
| Apex CDO      | Home                  |    500 | `/home`            | FAIL    |
| Apex CDO      | Intelligence/Sentinel |    200 | `/intelligence`    | PASS    |
| Apex CDO      | Moves                 |    500 | `/strategic-moves` | FAIL    |
| Apex CDO      | Source                |    500 | `/source`          | FAIL    |
| Apex CDO      | Tower                 |    500 | `/tower`           | FAIL    |
| Apex CDO      | Setup/Admin           |    500 | `/home`            | FAIL    |
| Meridian CDAO | Home                  |    500 | `/home`            | FAIL    |
| Meridian CDAO | Intelligence/Sentinel |    200 | `/intelligence`    | PASS    |
| Meridian CDAO | Moves                 |    500 | `/strategic-moves` | FAIL    |
| Meridian CDAO | Source                |    500 | `/source`          | FAIL    |
| Meridian CDAO | Tower                 |    500 | `/tower`           | FAIL    |
| Meridian CDAO | Setup/Admin           |    500 | `/home`            | FAIL    |

## Runtime failure evidence

Revision `ca-abarva-web-lab-eastus--0000049` logs show repeated old-image
runtime errors:

```text
Error: Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
at <unknown> (.next/server/chunks/ssr/src_lib_supabase-server_ts_...)
```

The active runtime therefore still contains a pre-cutover bundle that expects
Supabase env vars on several authenticated surfaces. DNS cutover, Supabase
pause, and Vercel removal are blocked.
