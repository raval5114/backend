# Analytics API Overview

This document describes the analytics endpoints mounted at `/api/analytics`.
All endpoints are read-only `GET` requests and require a Bearer access token.

## Access rules

- A player can view only their own analytics.
- A coach can view analytics for players assigned to them.
- An administrator follows the current platform admin policy.
- The server enforces access. A client-side player selector is not an access control.

## Common query parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `period` | Yes | `daily`, `weekly`, `monthly`, or `custom`. |
| `startDate` | For custom; optional otherwise | `YYYY-MM-DD`. For daily, weekly, or monthly periods, this selects the calendar date containing the period. |
| `endDate` | For custom | Inclusive `YYYY-MM-DD`. Internally, the query uses the following local midnight as an exclusive end boundary. |
| `timezone` | No | Valid IANA timezone such as `Asia/Kolkata`. Defaults to `UTC` until player timezone storage exists. |
| `groupBy` | Activity/report only | `daily`, `weekly`, or `monthly`. Defaults to the requested period, or `daily` for custom ranges. |

Weeks run Monday through Sunday. Custom ranges are limited to 366 calendar days.
All endpoints accept the same authentication header and no request body.

```http
Authorization: Bearer <access-token>
```

Example weekly request:

```http
GET /api/analytics/players/PLY-101/overview?period=weekly&startDate=2026-11-11&timezone=Asia%2FKolkata
```

The week containing November 11, 2026 is used. Replace `PLY-101` and the token
with the intended player ID and authenticated user's access token.

## Endpoints

### 1. Overview

```http
GET /api/analytics/players/:playerId/overview
```

Returns activity totals, execution count, active days, and recorded heart-rate
summaries.

Example response:

```json
{
  "success": true,
  "data": {
    "playerId": "PLY-101",
    "period": "weekly",
    "startDate": "2026-11-09",
    "endDate": "2026-11-15",
    "timezone": "Asia/Kolkata",
    "generatedAt": "2026-11-14T10:30:00.000Z",
    "dataQuality": {
      "boundaryExcludedBatches": 0,
      "batchSemantics": "interval-incremental"
    },
    "totalSteps": 18400,
    "totalDistanceMeters": 12300,
    "totalCalories": 920,
    "totalDurationSeconds": 7200,
    "executionCount": 4,
    "activeDays": 3,
    "durationWeightedAverageHeartRateBpm": 128.5,
    "highestRecordedBatchMaximumHeartRateBpm": 166
  }
}
```

### 2. Activity trends

```http
GET /api/analytics/players/:playerId/activity
```

Optional `groupBy` determines the trend interval.

Example request:

```http
GET /api/analytics/players/PLY-101/activity?period=custom&startDate=2026-11-09&endDate=2026-11-11&timezone=Asia%2FKolkata&groupBy=daily
```

Example response:

```json
{
  "success": true,
  "data": {
    "playerId": "PLY-101",
    "period": "custom",
    "startDate": "2026-11-09",
    "endDate": "2026-11-11",
    "timezone": "Asia/Kolkata",
    "generatedAt": "2026-11-14T10:30:00.000Z",
    "dataQuality": {
      "boundaryExcludedBatches": 0,
      "batchSemantics": "interval-incremental"
    },
    "groupBy": "daily",
    "trends": [
      {
        "periodStart": "2026-11-10",
        "totalSteps": 3000,
        "totalDistanceMeters": 1200,
        "totalCalories": 210,
        "totalDurationSeconds": 1800,
        "executionCount": 1,
        "activeDays": 1,
        "durationWeightedAverageHeartRateBpm": 128.5,
        "highestRecordedBatchMaximumHeartRateBpm": 155,
        "stepsPerMinute": 100,
        "averageSpeedMetersPerSecond": 0.67,
        "averageSpeedKilometersPerHour": 2.4
      }
    ]
  }
}
```

### 3. Heart rate

```http
GET /api/analytics/players/:playerId/heart-rate
```

Returns the duration-weighted average of recorded batch averages and the
highest recorded batch maximum. It does not represent continuous heart-rate
sampling.

Example response:

```json
{
  "success": true,
  "data": {
    "playerId": "PLY-101",
    "period": "weekly",
    "startDate": "2026-11-09",
    "endDate": "2026-11-15",
    "timezone": "UTC",
    "generatedAt": "2026-11-14T10:30:00.000Z",
    "dataQuality": {
      "boundaryExcludedBatches": 0,
      "batchSemantics": "interval-incremental"
    },
    "durationWeightedAverageBpm": 128.5,
    "highestRecordedBatchMaximumBpm": 166,
    "sampleCount": 8
  }
}
```

### 4. Duration

```http
GET /api/analytics/players/:playerId/duration
```

Returns total, average, longest, and shortest execution durations.

Example response:

```json
{
  "success": true,
  "data": {
    "playerId": "PLY-101",
    "period": "monthly",
    "startDate": "2026-11-01",
    "endDate": "2026-11-30",
    "timezone": "UTC",
    "generatedAt": "2026-11-14T10:30:00.000Z",
    "dataQuality": {
      "boundaryExcludedBatches": 0,
      "batchSemantics": "interval-incremental"
    },
    "totalDurationSeconds": 7200,
    "averageExecutionDurationSeconds": 1800,
    "longestExecutionDurationSeconds": 2400,
    "shortestExecutionDurationSeconds": 1200,
    "executionCount": 4
  }
}
```

In the current implementation, this endpoint's `executionCount` counts unique
execution IDs represented by wearable batches.

### 5. Consistency

```http
GET /api/analytics/players/:playerId/consistency
```

Returns active days, execution count, active weeks, and activity streaks in the
requested range.

Example response:

```json
{
  "success": true,
  "data": {
    "playerId": "PLY-101",
    "period": "weekly",
    "startDate": "2026-11-09",
    "endDate": "2026-11-15",
    "timezone": "UTC",
    "generatedAt": "2026-11-14T10:30:00.000Z",
    "dataQuality": {
      "boundaryExcludedBatches": 0,
      "batchSemantics": "interval-incremental"
    },
    "activeDays": 3,
    "executionCount": 4,
    "activeWeeks": 1,
    "averageExecutionsPerActiveWeek": 4,
    "currentStreakDays": 2,
    "bestStreakDays": 2
  }
}
```

### 6. Progress comparison

```http
GET /api/analytics/players/:playerId/progress
```

Compares the requested period with the preceding period. Weekly comparisons
use the prior Monday-to-Sunday week; monthly comparisons use the previous
calendar month.

Example response:

```json
{
  "success": true,
  "data": {
    "playerId": "PLY-101",
    "period": "weekly",
    "startDate": "2026-11-09",
    "endDate": "2026-11-15",
    "timezone": "UTC",
    "generatedAt": "2026-11-14T10:30:00.000Z",
    "dataQuality": {
      "boundaryExcludedBatches": 0,
      "batchSemantics": "interval-incremental"
    },
    "comparisonPeriod": {
      "startDate": "2026-11-02",
      "endDate": "2026-11-08"
    },
    "metrics": {
      "steps": {
        "current": 18400,
        "previous": 16000,
        "percentage": 15,
        "status": "AVAILABLE"
      },
      "distanceMeters": {
        "current": 12300,
        "previous": 11000,
        "percentage": 11.82,
        "status": "AVAILABLE"
      },
      "calories": {
        "current": 920,
        "previous": 0,
        "percentage": null,
        "status": "ZERO_BASELINE"
      },
      "durationSeconds": {
        "current": 7200,
        "previous": 6800,
        "percentage": 5.88,
        "status": "AVAILABLE"
      },
      "durationWeightedAverageHeartRateBpm": {
        "current": 128.5,
        "previous": 126,
        "percentage": 1.98,
        "status": "AVAILABLE"
      }
    }
  }
}
```

`percentage` is `null` when the prior value is zero or a metric is missing.
The `status` is `ZERO_BASELINE` or `MISSING_DATA` in those cases.

### 7. Combined report

```http
GET /api/analytics/players/:playerId/report
```

Returns the combined report in the same format as the individual endpoints.
The `data` object contains `overview`, `activity`, `heartRate`, `duration`,
`consistency`, and `progress` sections. It also includes the common metadata
fields (`playerId`, period, dates, timezone, generation time, and data quality).

## Common errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid period, date range, timezone, or grouping value. |
| `401` | Missing or invalid access token. |
| `403` | Caller lacks `PLAYER_READ` or the player is outside their permitted scope. |
| `404` | The requested player does not exist. |
| `409` | Wearable intervals overlap or use unsupported semantics. |
| `500` | Unexpected server error. |

Example error response:

```json
{
  "success": false,
  "error": "OVERLAPPING_WEARABLE_BATCHES",
  "message": "Overlapping wearable batches cannot be summed safely"
}
```

## Data contract notes

The analytics service assumes each wearable batch is a distinct, non-overlapping
interval; steps, calories, and distance are interval increments; and
`durationSeconds` is active duration within the interval. Overlapping intervals
are rejected rather than double-counted. See
[`Analytics_Data_Contract.md`](Analytics_Data_Contract.md) for the wearable
client compatibility note.

Swagger UI is available at `/api-docs`.
