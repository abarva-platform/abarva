# AgentDock

The shared chat-dock foundation for every agent surface. One component,
five toggleable modes, one API contract for paperclip uploads. Every
existing chat panel will migrate to this in the sibling chips that
follow this PR.

## Why

Today each surface owns its own chat lane (Source `EventChatLane`, Tower
`AtlasDrawer`, Intelligence `SentinelChat`, etc.). They drifted in
behavior and visual treatment, and uploads were inconsistent or missing.
`<AgentDock>` is the single shape every surface drops in. Sentinel /
Nexus / Atlas / Steward runtime contracts are unchanged — only the
surface widget is swapped.

## API

```tsx
import { AgentDock, type ChatMessage, type AttachmentRef } from '@/components/agent/AgentDock';

<AgentDock
  agent={{ initials: 'S', name: 'Sentinel', role: 'Surfaces evidence …' }}
  surface="source/new"                       // localStorage namespace + telemetry key
  defaultMode="side-rail"                    // 'side-rail' | 'pin-bottom' | 'pin-top' | 'expand' | 'collapsed'
  surfaceContext={{ stage: 'discovery' }}    // optional — round-tripped to upload metadata
  initialQuote="Quoting the previous turn"   // optional eyebrow above thread
  suggestedActions={[                        // optional — pre-fills composer on click
    { id: 'a', label: 'Summarize the last vendor packet.', body: 'Summarize the last vendor packet.' },
  ]}
  thread={turns}                             // ChatMessage[]
  onMessage={(text, attachments) => post(text, attachments)}
  workspace={<MainBody />}                   // for side-rail this becomes the right pane
  minLeftPx={320}
  defaultLeftPercent={38}
/>
```

### Modes

| Mode         | Behavior                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| `side-rail`  | Resizable column via `ResizableSplitter`. Default. Width persisted.       |
| `pin-bottom` | Full-width strip ~480px tall at viewport bottom.                         |
| `pin-top`    | Mirror of pin-bottom anchored below the AppTopBar.                       |
| `expand`     | Modal overlay 90×90 vw/vh; workspace dimmed behind. Esc closes.           |
| `collapsed`  | Floating 56×56 chip bottom-right. Double-click restores last rich mode.   |

The mode picker is the 5-icon row at top-right of the chat header.
Single-click switches mode + persists.

### Persistence

Per-surface, in localStorage:

- `abarva.agent-dock.{surface}.mode` — current mode
- `abarva.agent-dock.{surface}.split` — side-rail width percentage

Keep `surface` short and stable (`source/new`, `moves/detail`, etc.).
The same string is sent to the upload route as the `surface` form field,
so it doubles as a telemetry key.

### Composer

- Auto-grow `<textarea>` capped at ~6 rows / 160px.
- Enter submits, Shift+Enter inserts newline.
- Send button disabled while any upload is pending or while a submit is
  in flight.
- Drag-drop covers the entire dock panel; visual outline appears on
  dragover.

### Attachments

The paperclip opens a multi-file picker scoped to the supported MIME
allowlist (`AGENT_DOCK_MIME_ALLOWLIST`):

- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `text/csv`, `text/plain`, `text/markdown`
- `image/png`, `image/jpeg`

Each upload POSTs `multipart/form-data` to `/api/v1/agent/attachments`
with the file plus the surface and agent name. The route:

1. Authenticates via Clerk.
2. Resolves the active tenant via `getActiveClientRow`.
3. Validates MIME + 25 MB size cap.
4. Uploads the blob to the `agent-attachments` Supabase Storage bucket
   at `{tenant_id}/{user_id}/{uuid}-{filename}`.
5. Extracts text per MIME (PDF → `pdf-parse`, docx → `mammoth`, xlsx →
   `exceljs`, csv/txt/md → utf-8 read, images → empty string). Defensive
   — never throws on parser failure.
6. Inserts a row in `agent_attachment` with the metadata + extracted
   text.
7. Returns `{ id, file_name, mime, bytes, storage_path,
   extracted_text_preview }`. The preview is the first ~4000 chars.

Soft-delete via `DELETE /api/v1/agent/attachments/[id]` stamps
`deleted_at`. The blob stays — a retention job sweeps later.

### Migration playbook (for the 7 sibling chips)

1. Replace your custom chat panel mount with `<AgentDock>`.
2. Pick a stable `surface` string. Keep it under 60 chars.
3. Pass your existing thread + onSubmit handler. The `text` callback
   stays plain string; `attachments` is the new arg.
4. On the server side, when the next turn comes in, look up the
   attachments by id from `agent_attachment` (filtered by `tenant_id`
   and `surface`) and merge their `extracted_text` into the system
   prompt — your agent-specific code owns this composition. The dock
   does NOT call your runtime.
5. Migrations follow this PR. Slot the per-surface backfill (e.g. set
   `linked_event_id` on attachments referenced from `source/events/canvas`)
   in your sibling chip's migration, not here.

### Surfaces queued to migrate (sibling chips)

1. Source · `/source/new`
2. Source · canvas / event detail
3. Moves · home
4. Moves · detail
5. Intelligence · brief
6. Tower · root chat
7. Admin · maestro chat

### Manual setup step

The `agent-attachments` Supabase Storage bucket is **not** created by the
migration. Create it once per environment:

```ts
await sb.storage.createBucket('agent-attachments', { public: false });
```

Apply a bucket policy that enforces tenant-prefixed paths so anon-key
reads can't cross tenants.

### Migration

`supabase/migrations/20260508203814_agent_attachments.sql` adds the
`agent_attachment` table + indexes + RLS. Apply via:

```sh
npm run db:migrate
```

### Testing

- `src/components/agent/__tests__/AgentDock.test.tsx` — component
  behavior (modes, composer, drag-drop, attachment chip lifecycle).
- `src/app/api/v1/agent/attachments/__tests__/route.test.ts` — route
  auth + validation + extraction wiring.

Run scoped:

```sh
npx jest src/components/agent
npx jest src/app/api/v1/agent
```
