# Azure Container Apps Cutover - Runtime Smoke and QA

Date: 2026-06-07
Status: PASS on merged-main image; DNS still held for soak gates

## Smoke and signed-in QA record

| Surface / proof                      | Evidence                                                                                                                               | Status |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Public Home                          | Merged-main image unauthenticated `GET /` returned HTTP 200                                                                            | PASS   |
| `/api/health`                        | Merged-main image returned HTTP 200 with `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`                    | PASS   |
| Azure runtime DB smoke               | Azure runtime exec connected to Azure Postgres `abarva_control` at `10.43.1.4/32` and counted required tables                          | PASS   |
| Home signed-in QA                    | Apex CDO and Meridian CDAO authenticated sessions loaded with HTTP 200                                                                 | PASS   |
| Intelligence / Sentinel signed-in QA | Apex CDO and Meridian CDAO authenticated sessions loaded `/intelligence` with HTTP 200                                                 | PASS   |
| Moves signed-in QA                   | Apex CDO and Meridian CDAO authenticated sessions loaded with HTTP 200                                                                 | PASS   |
| Source signed-in QA                  | Apex CDO and Meridian CDAO authenticated sessions loaded with HTTP 200                                                                 | PASS   |
| Tower signed-in QA                   | Apex CDO and Meridian CDAO authenticated sessions loaded with HTTP 200                                                                 | PASS   |
| Setup / Admin signed-in QA           | Apex CDO and Meridian CDAO authenticated sessions loaded with HTTP 200                                                                 | PASS   |
| Claude/Anthropic reasoning proof     | Azure runtime Anthropic request succeeded with `provider=anthropic`, `requestedModel=claude-opus-4-7`, `responseModel=claude-opus-4-7` | PASS   |
| Zero Supabase runtime calls          | Merged-main revision log tail had no deny-list matches for Supabase hosts/env names and boot guard passed                              | PASS   |

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

Initial old-image result summary:

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

## Merged-main image result summary

After refreshing to merged-main image
`acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41`,
the same signed-in QA passed:

| User          | Surface               | Status | Final URL                        | Verdict |
| ------------- | --------------------- | -----: | -------------------------------- | ------- |
| Apex CDO      | Home                  |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Intelligence/Sentinel |    200 | `/intelligence`                  | PASS    |
| Apex CDO      | Moves                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Source                |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Tower                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Setup/Admin           |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Home                  |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Intelligence/Sentinel |    200 | `/intelligence`                  | PASS    |
| Meridian CDAO | Moves                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Source                |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Tower                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Setup/Admin           |    200 | `/responsible-ai/acknowledgment` | PASS    |

Most authenticated product routes currently land on the Responsible AI
acknowledgment gate. This is an acceptable HTTP/auth smoke pass, but deeper
post-ack product journey QA should still run before DNS cutover.
