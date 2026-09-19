# Vendor Architecture Icon Packs

This folder stores source URLs, hashes, and download tooling for official cloud architecture icon
packs used for internal architecture diagrams, presentation appendices, and customer-facing topology
visuals.

Use these assets only to represent the vendor products and services they identify. Do not modify,
crop, distort, recolor, or use vendor product icons as AbarVa product marks.

The ZIP files are intentionally not committed to Git. Run the download script below to fetch local
copies from the official vendor sources and verify their SHA-256 hashes.

## Packs

| Vendor | File | Source | Retrieved | SHA-256 |
| --- | --- | --- | --- | --- |
| AWS | `aws/aws-architecture-icons-2026-08-06.zip` | <https://aws.amazon.com/architecture/icons/> | 2026-09-08 | `d2d166c453526471749d520e0db022c459abef759d2946cf2dd1d1c992dc6526` |
| Microsoft Azure | `azure/azure-public-service-icons-v24-2026-07.zip` | <https://learn.microsoft.com/en-us/azure/architecture/icons/> | 2026-09-08 | `921594ccd1bf3d9c0a1bd7b6d924e050551a59342f2b353bb74bdcf761c35141` |

## Usage Notes

- Keep the source URLs and SHA-256 hashes in `manifest.json` as the shared contract.
- Download and extract locally when building a deck or diagram. Do not commit downloaded ZIPs or
  extracted generated trees unless a specific deliverable needs curated icons.
- Prefer named service chips for dense executive diagrams; use official icons when they improve
  recognition at the final slide size.
- Include the service name near each icon in architecture diagrams.
- For Azure, follow the Microsoft icon terms in the package and on the source page.
- For AWS, use only the official package and keep icons current with the AWS quarterly release
  cadence.

## Local Download And Extraction

```sh
node scripts/architecture/download-vendor-icon-packs.mjs
```

The script downloads the official ZIPs to the paths listed in `manifest.json` and verifies each file
against the recorded SHA-256 hash.

```sh
mkdir -p /tmp/abarva-vendor-icons/aws /tmp/abarva-vendor-icons/azure
unzip docs/architecture/vendor-icons/aws/aws-architecture-icons-2026-08-06.zip -d /tmp/abarva-vendor-icons/aws
unzip docs/architecture/vendor-icons/azure/azure-public-service-icons-v24-2026-07.zip -d /tmp/abarva-vendor-icons/azure
```

The AWS ZIP contains multiple icon sizes and `__MACOSX` metadata; filter locally to the size and
format needed for the diagramming surface.
