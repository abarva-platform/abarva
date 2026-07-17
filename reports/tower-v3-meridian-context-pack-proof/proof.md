# Tower v3 Meridian ContextPack Proof

Status: Pass

This proof reads active Meridian v3 tenant input files for dimensions 08, 09, 11, 14, 17, and 18.
It does not use `cio_tower` as source truth. `cio_tower` remains bridge-only until row-level reconciliation is proven.

## Result

- Context pack: `meridian-health-tower-v3-live-context-pack`
- Mode: `active`
- Truth status: `active`
- Tower metric records: 555
- Tower value records: 561
- Tower value claims: 561
- Blocked value claims: 80
- Realized-value language allowed: No

## Truth Split

This is live active v3 tenant input proof, not synthetic fixture contract proof. The rows remain planning-grade where their source classification says so, so Tower can show measurement/readiness context but cannot claim realized/proven/delivered value.
