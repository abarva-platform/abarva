# Private demo library

## Viewer and administrator paths

The public overview links to `/demo`. An approved viewer enters their email, receives a Clerk one-time code, and returns to `/demo`. Authentication alone does not authorize playback. Every page/media request checks current private identity-provider metadata and the verified primary email. A grant binds that email to allowed video IDs and an expiry.

Verified platform administrators open **Viewer access** on `/demo` to approve an email for 7, 14 or 30 days or revoke access. The control does not send an invitation email. Share the demo URL separately. New accounts are external-only with no client binding or module access. Adding a demo grant to an existing client account does not change that account's product permissions.

Approvals are stored as `privateMetadata.nexusDemoAccess` with `enabled`, `email`, `videoIds`, `expiresAt`, `grantedBy` and `grantedAt`. Revocations record `revokedBy` and `revokedAt`. Browser-editable metadata is not accepted. A revoked viewer cannot start a new authorized media request, but already buffered/downloaded content cannot be recalled.

## Media publication

Media uses the existing Azure object-storage configuration and a logical `demo-videos` bucket. With a configured shared container, the adapter adds that bucket as a path prefix. Do not create anonymous/public blob access or put MP4s in `public/` or the web image.

Fixed catalog paths:

| Video ID    | MP4                              | Captions                         |
| ----------- | -------------------------------- | -------------------------------- |
| `executive` | `2026-10-14/nexus-executive.mp4` | `2026-10-14/nexus-executive.vtt` |
| `full`      | `2026-10-14/nexus-full.mp4`      | `2026-10-14/nexus-full.vtt`      |

Before publication, verify the final files against the approved visual master, soundtrack, edit timeline and chapter timings in `src/lib/demo-library/catalog.ts`. Decode the entire MP4, inspect framing and audiovisual sync, and retain file hashes plus review evidence privately. The current catalog matches the existing five-minute and thirteen-minute edit timelines; it is not proof the MP4s exist.

Publish the approved files through the sanctioned private-network operator/upload lane. Do not open the private storage account to the internet to upload from a laptop. Set the MP4 content type to `video/mp4` and only then mark its blob metadata `demo_published=true`. Captions use `text/vtt`; only publish reviewed captions. Until the MP4 exists with that marker, the library displays a preparation state. There is no public upload endpoint in this release.

The app checks that the containing Azure container is private. GET/HEAD and byte-range requests go through `/api/demo-video/[videoId]`, recheck authorization, and stream the fixed blob using server credentials. The browser never receives a Blob URL, SAS token or storage key. The storage identity must have read access to the private container and its properties.

## Acceptance gates

1. Verify the repo-owned ACA main deploy and web/traffic/worker digest invariant.
2. Confirm the homepage's demo CTA, current branding and five-section structure.
3. Signed out: see the email-code form, never a playable video or admin controls. Direct media GET/HEAD must return 401.
4. Signed in without approval: no player. Expired/revoked grants and a wrong video scope must deny new media requests.
5. Demo-only identity: Home, Intelligence, Moves, Source, Tower and admin APIs must remain inaccessible. Existing workspace identities keep their existing permissions.
6. After actual media publication: complete email delivery and code verification with an approved recipient; play both cuts, seek near the end, change chapters, enable captions and check phone playback.
7. Revoke that viewer and verify the next media request is denied. Do not claim already buffered bytes have been revoked.

Code tests, a deployed library, published media, email receipt and signed-in playback are distinct states. Keep them separate in release reporting.
