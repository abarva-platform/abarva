# Demo Auth Login Map

Canonical client set:

- `meridian` → Meridian Health System
- `arcturus` → Arcturus Financial Group
- `apexretail` → Apex Retail Group
- `keystone` → Keystone Energy Holdings

Rules:

- `admin` and `investor` can toggle across all four clients
- `maestro` demo users are locked to exactly one client
- locked users do not see the top client toggle
- post-login redirects always persist the chosen client into both local storage and the `abarva_active_client` cookie

Suggested demo logins:

| Email | Role | Client scope | Landing route | Password |
| --- | --- | --- | --- | --- |
| `anand+clerk_test@abarva.com` | `admin` | all 4 | `/home?client=meridian` | `Archer2026!` |
| `anand.sundaram@thesundaram.com` | `admin` | all 4 | `/home?client=meridian` | `Archer2026!` |
| `investor+clerk_test@abarva.com` | `investor` | all 4 | `/investor?client=meridian` | `Demo2026!` |
| `mh+clerk_test@abarva.com` | `maestro` | `meridian` only | `/home?client=meridian` | `Demo2026!` |
| `af+clerk_test@abarva.com` | `maestro` | `arcturus` only | `/home?client=arcturus` | `Demo2026!` |
| `apex+clerk_test@abarva.com` | `maestro` | `apexretail` only | `/home?client=apexretail` | `Demo2026!` |
| `keystone+clerk_test@abarva.com` | `maestro` | `keystone` only | `/home?client=keystone` | `Demo2026!` |

Clerk metadata contract:

Locked client maestro:

```json
{
  "role": "maestro",
  "clientId": "keystone",
  "clientName": "Keystone Energy Holdings",
  "defaultClientId": "keystone",
  "clientLocked": true
}
```

Investor:

```json
{
  "role": "investor",
  "clientIds": ["meridian", "arcturus", "apexretail", "keystone"],
  "defaultClientId": "meridian",
  "clientLocked": false
}
```

Admin:

```json
{
  "role": "admin",
  "clientIds": ["meridian", "arcturus", "apexretail", "keystone"],
  "defaultClientId": "meridian",
  "clientLocked": false
}
```
