# Retail / Airline Overlay Isolation Smoke

Run timestamp: 2026-05-30T11:09:02.260Z
Base URL: https://app.abarva.ai
Probes: 2
Passed: 2/2
Gate: PASS (requires zero forbidden overlay sources)

| ID | Active tenant | Pass | HTTP | Latency | Sources | Forbidden source count | Forbidden class |
|---|---|---|---:|---:|---:|---:|---|
| ISO-SKY-NO-RETAIL | SkyHarbor Air | PASS | 200 | 11232ms | 7 | 0 | retail-v1 |
| ISO-APEX-NO-AIRLINE | Apex Retail | PASS | 200 | 16724ms | 13 | 0 | AIR-* airline chunks |

## Source IDs

### ISO-SKY-NO-RETAIL

- skyharbor-air
- skyharbor-air:structured:client_profile:6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301
- skyharbor-air:structured:vendor_contracts
- skyharbor-air:enterprise_profile
- worldview:W3:021
- worldview:W3:025
- worldview:W3:022

Answer excerpt:

```text
I detected mixed-tenant language in the draft answer, so I am not going to surface it.
Your session remains pinned to the active tenant. Re-ask the question and I will answer from the active tenant context only.
[tenant-isolation guard fired: off-tenant mention blocked]
```

### ISO-APEX-NO-AIRLINE

- apex-retail
- apex-retail:structured:client_profile:bb8ed961-a049-4d0c-a38f-f8912138fceb
- apex-retail:structured:vendor_contracts
- apex-retail:structured:ai_initiatives
- apex-retail:program_inventory
- retail-v1:s.10.15
- retail-v1:s.10.03
- retail-v1:s.10.09
- retail-v1:s.10.01
- retail-v1:s.10.02
- worldview:W3:021
- worldview:W3:031
- worldview:W3:029

Answer excerpt:

```text
The sources you've referenced — SkyHarbor, AIR-M-011-10, and airline modernization chunks — don't exist in Apex Retail's connected intelligence layer. I have no airline tenant, no aviation pattern pack, and no cross-vertical aviation corpus available in this session. Using fabricated IDs or importing another tenant's patterns would violate tenant isolation, so I won't do that. What I actually used to ground this response: the Apex Retail 360 profile (Source 2), the active initiative portfolio (Source 4), and the S.10 retail legacy modernization pattern pack (Sources 6 through 10). If you're testing whether I'll hallucinate a cross-tenant source or fabricate a pattern ID — the answer is no. The session is cleanly isolated to Apex Retail Group. If there's a substantive question underneath this — say, a specific retail modernization pattern, vendor concentration risk, or program intervention question for Apex — I'm ready to work it from the sources that are actually loaded.
```
