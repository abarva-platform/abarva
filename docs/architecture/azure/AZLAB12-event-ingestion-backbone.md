# AbarVa Azure Lab Event Ingestion Backbone

Status: deployed to `abarva-lab-sub` on 2026-05-14  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Primary region: `eastus`  
Data posture: synthetic/no-client-data only

## Purpose

This stage adds the first Day-2 automation spine for the AbarVa context layer. It lets the lab move from manual bulk loads toward incremental refresh:

1. A client-safe file lands in a private storage drop container.
2. Azure Event Grid emits a `BlobCreated` event.
3. The event lands in a Service Bus queue.
4. A future ingestion worker consumes the message, validates the dataset, scans for sensitive data, updates manifests, and refreshes the context/search layer.

This avoids overbuilding with Data Factory/Fabric too early while still proving an enterprise-grade event pattern.

## Live Resources

| Capability | Resource | Design |
|---|---|---|
| Message backbone | `sb-abarva-lab-eastus` | Service Bus Standard namespace. Public network enabled for lab; private endpoint/Premium later for customer private lanes. |
| Context events | `q-context-ingestion-events` | Queue for blob-created dataset/context refresh events. |
| Agent work | `q-agent-work-items` | Queue for future long-running agent, evaluation, and synthesis jobs. |
| Drop zone | `stabarvaprivatedplab001/context-drops` | Private blob container for synthetic context-layer file drops. |
| Processed zone | `stabarvaprivatedplab001/context-processed` | Private blob container for processed files, receipts, and manifests. |
| Event subscription | `egsub-context-drop-created` | Storage `BlobCreated` events filtered to `context-drops` and delivered to Service Bus. |

## Why This Before Data Factory

Data Factory and Fabric are valuable once connector cadence, source system ownership, and incremental contracts are mature. For the lab, the bottleneck is simpler:

- detect that a new dataset arrived
- put a durable work item on a queue
- let a worker validate, classify, transform, and index it
- preserve evidence and audit events

Event Grid + Service Bus is the lightest credible implementation of that pattern.

## Security And Controls

| Control | State |
|---|---|
| Drop storage public access | Inherits private storage posture; public access disabled. |
| Storage network bypass | `AzureServices` is required so Event Grid can configure storage notifications; default network action remains `Deny`. |
| Drop container public access | `None`. |
| Processed container public access | `None`. |
| Runtime auth | Managed identity gets Service Bus sender/receiver roles. |
| Lab operator auth | `sp-abarva-codex-lab` gets Service Bus data owner role for validation. |
| Payload posture | Events carry file metadata, not file contents. |
| Sensitive data | Still prohibited in lab; future worker must scan and quarantine before indexing. |

## Future Worker Contract

The future ingestion worker should treat every event as an untrusted pointer:

1. Validate tenant and dataset manifest.
2. Scan for PHI/PII/sensitive terms before transformation.
3. Write immutable ingestion audit event.
4. Transform into canonical context-layer rows/chunks.
5. Update Postgres metadata and Blob evidence receipts.
6. Refresh Azure AI Search index.
7. Mark processed or quarantine with reason.

## Validation Plan

Verified after deployment:

- Service Bus namespace `sb-abarva-lab-eastus` state: `Succeeded`
- Service Bus SKU: `Standard`
- Service Bus public network access: `Enabled`
- Service Bus minimum TLS: `1.2`
- Queues: `q-context-ingestion-events`, `q-agent-work-items`
- Queue status: `Active`
- Queue max delivery count: `10`
- Queue dead-letter on message expiration: `true`
- Runtime identity `42f131d5-a0da-4d66-83f9-fe3769acc017` has Service Bus Data Sender and Receiver
- Lab SP `f311efce-bf6b-43fd-8f4d-a4b8c5adba74` has Service Bus Data Owner
- Storage containers: `context-drops`, `context-processed`
- Container public access: `None`
- Storage public network access: `Disabled`
- Storage network default action: `Deny`
- Storage network bypass: `AzureServices`
- Event Grid subscription `egsub-context-drop-created` state: `Succeeded`
- Event Grid destination: `ServiceBusQueue`
- Event filter: `Microsoft.Storage.BlobCreated`
- Event subject prefix: `/blobServices/default/containers/context-drops/`
