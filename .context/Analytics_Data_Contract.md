# Analytics Wearable Data Contract

The analytics API uses the following server-side working contract for records
in the `WearableData` collection:

- One record represents a non-overlapping interval from `startedAt` through
  `endedAt`.
- `steps`, `calories`, and `distanceMeters` are interval increments.
- `metrics.durationSeconds` is active duration within that interval.
- `averageHeartRateBpm` describes the interval used for duration weighting;
  `maxHeartRateBpm` is the maximum recorded in that batch.
- Duplicate `executionId`/`batchId` writes are idempotent under the existing
  unique index. Distinct overlapping intervals in one execution are rejected
  from analytics with HTTP 409 because they cannot be safely summed.
- Event times are stored in UTC. Calendar grouping uses a validated IANA
  timezone, defaulting to UTC until the player profile stores one. Weeks begin
  Monday. Date-only custom end dates are inclusive at the API and become an
  exclusive next-day boundary internally. Custom requests are limited to 366
  calendar days.

## Client compatibility

The current Wear OS client sends legacy readings to `/api/wearable/data` with
`heartRate`, `steps`, `calories`, `recordedAt`, and `syncId`. That route writes
the legacy wearable collection and does not populate the `WearableData`
collection used by analytics. The analytics batch endpoint accepts the newer
interval shape. Device analytics will remain empty until the Wear OS sync path
is migrated to send that shape; this contract must not be used to reinterpret
legacy readings as interval increments.

The service supports the interval-increment contract only. Cumulative snapshots
and other duration meanings are rejected as unsupported. If the client later
uses a different contract, implement version-aware reconciliation before
changing this document or the analytics contract configuration.
