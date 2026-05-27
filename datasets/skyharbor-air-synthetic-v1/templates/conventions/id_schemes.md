# ID Schemes

Stable IDs use `SHA-` prefix plus segment-specific code. Graph entity IDs are deterministic SHA-256 hashes over `client_key + entity_type + canonical_name`.
