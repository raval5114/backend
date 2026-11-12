const test = require("node:test");
const assert = require("node:assert/strict");
const AnalyticsService = require("../serivces/analytics.service");
const WearableData = require("../models/wearableData.model");
const WorkoutExecution = require("../models/workoutExecution.model");

const { _internals } = AnalyticsService;

function record({ executionId = "EX-1", startedAt, endedAt, metrics = {} }) {
  return {
    executionId,
    playerId: "PLY-1",
    batchId: `${executionId}-${startedAt}`,
    startedAt: new Date(startedAt),
    endedAt: new Date(endedAt),
    metrics,
  };
}

test("daily and weekly boundaries use the requested local timezone", () => {
  const daily = _internals.resolveDateRange({ period: "daily", startDate: "2026-11-11", timezone: "Asia/Kolkata" });
  assert.equal(daily.start.toISOString(), "2026-11-10T18:30:00.000Z");
  assert.equal(daily.end.toISOString(), "2026-11-11T18:30:00.000Z");
  assert.equal(daily.endDate, "2026-11-11");

  const weekly = _internals.resolveDateRange({ period: "weekly", startDate: "2026-11-11", timezone: "UTC" });
  assert.equal(weekly.startDate, "2026-11-09");
  assert.equal(weekly.endDate, "2026-11-15");
  assert.equal(weekly.calendarDays, 7);
});

test("local calendar boundaries account for daylight-saving transitions", () => {
  const range = _internals.resolveDateRange({ period: "daily", startDate: "2026-03-08", timezone: "America/New_York" });
  assert.equal((range.end - range.start) / (60 * 60 * 1000), 23);
});

test("custom date-only range treats end date as inclusive and bounds its size", () => {
  const range = _internals.resolveDateRange({ period: "custom", startDate: "2026-11-01", endDate: "2026-11-03", timezone: "UTC" });
  assert.equal(range.start.toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-11-04T00:00:00.000Z");
  assert.equal(range.calendarDays, 3);
  assert.throws(() => _internals.resolveDateRange({ period: "custom", startDate: "2026-01-01", endDate: "2026-12-31", timezone: "UTC", maxRangeDays: 100 }), { code: "DATE_RANGE_TOO_LARGE" });
});

test("previous period follows calendar week and month boundaries", () => {
  const month = _internals.resolveDateRange({ period: "monthly", startDate: "2026-03-12", timezone: "UTC" });
  const priorMonth = _internals.previousRange(month);
  assert.equal(priorMonth.startDate, "2026-02-01");
  assert.equal(priorMonth.endDate, "2026-02-28");

  const week = _internals.resolveDateRange({ period: "weekly", startDate: "2026-03-12", timezone: "UTC" });
  const priorWeek = _internals.previousRange(week);
  assert.equal(priorWeek.startDate, "2026-03-02");
  assert.equal(priorWeek.endDate, "2026-03-08");
});

test("invalid timezone, dates and range ordering fail with client errors", () => {
  assert.throws(() => _internals.resolveDateRange({ period: "daily", startDate: "2026-13-40", timezone: "UTC" }), { code: "INVALID_DATE" });
  assert.throws(() => _internals.resolveDateRange({ period: "daily", startDate: "2026-11-11", timezone: "Mars/Olympus" }), { code: "INVALID_TIMEZONE" });
  assert.throws(() => _internals.resolveDateRange({ period: "custom", startDate: "2026-11-12", endDate: "2026-11-11", timezone: "UTC" }), { code: "INVALID_DATE_RANGE" });
});

test("data totals preserve missing values and compute duration-weighted heart rate", () => {
  const records = [
    record({ startedAt: "2026-11-11T01:00:00Z", endedAt: "2026-11-11T01:10:00Z", metrics: { steps: 100, distanceMeters: 80, calories: 10, durationSeconds: 600, averageHeartRateBpm: 100, maxHeartRateBpm: 120 } }),
    record({ executionId: "EX-2", startedAt: "2026-11-11T02:00:00Z", endedAt: "2026-11-11T02:05:00Z", metrics: { steps: 50, calories: 5, durationSeconds: 300, averageHeartRateBpm: 130, maxHeartRateBpm: 150 } }),
  ];
  const summary = _internals.summarize(records);
  assert.equal(summary.totalSteps, 150);
  assert.equal(summary.totalDistanceMeters, 80);
  assert.equal(summary.totalDurationSeconds, 900);
  assert.equal(summary.executionCount, 2);
  assert.equal(summary.durationWeightedAverageHeartRateBpm, 110);
  assert.equal(summary.highestRecordedBatchMaximumHeartRateBpm, 150);
});

test("records group by local day and produce safe rates", () => {
  const records = [
    record({ startedAt: "2026-11-10T18:40:00Z", endedAt: "2026-11-10T19:40:00Z", metrics: { steps: 600, distanceMeters: 1200, durationSeconds: 3600 } }),
    record({ executionId: "EX-2", startedAt: "2026-11-11T18:00:00Z", endedAt: "2026-11-11T19:00:00Z", metrics: { steps: 300, distanceMeters: 600, durationSeconds: 1800 } }),
  ];
  const groups = _internals.groupRecords(records, "Asia/Kolkata", "daily");
  assert.equal(groups.length, 2);
  assert.equal(groups[0].periodStart, "2026-11-11");
  assert.equal(groups[0].stepsPerMinute, 10);
  assert.equal(groups[0].averageSpeedKilometersPerHour, 1.2);
});

test("consistency counts activity days and streaks", () => {
  const range = _internals.resolveDateRange({ period: "custom", startDate: "2026-11-09", endDate: "2026-11-12", timezone: "UTC" });
  const records = [
    record({ startedAt: "2026-11-09T10:00:00Z", endedAt: "2026-11-09T10:30:00Z", metrics: {} }),
    record({ executionId: "EX-2", startedAt: "2026-11-11T10:00:00Z", endedAt: "2026-11-11T10:30:00Z", metrics: {} }),
    record({ executionId: "EX-3", startedAt: "2026-11-12T10:00:00Z", endedAt: "2026-11-12T10:30:00Z", metrics: {} }),
  ].map((item) => ({ ...item, bucket: _internals.localBucketKey(item.endedAt, "UTC", "daily") }));
  const result = _internals.consistency(records, range);
  assert.equal(result.activeDays, 3);
  assert.equal(result.executionCount, 3);
  assert.equal(result.activeWeeks, 1);
  assert.equal(result.currentStreakDays, 2);
  assert.equal(result.bestStreakDays, 2);
});

test("overlapping batches in one execution are rejected", () => {
  const records = [
    record({ startedAt: "2026-11-11T10:00:00Z", endedAt: "2026-11-11T10:30:00Z", metrics: {} }),
    record({ startedAt: "2026-11-11T10:20:00Z", endedAt: "2026-11-11T10:40:00Z", metrics: {} }),
  ];
  assert.throws(() => _internals.assertNoOverlaps(records), { code: "OVERLAPPING_WEARABLE_BATCHES" });
});

test("zero and missing comparison baselines never produce Infinity", () => {
  assert.deepEqual(_internals.percentageChange(12, 0), { percentage: null, status: "ZERO_BASELINE" });
  assert.deepEqual(_internals.percentageChange(null, 10), { percentage: null, status: "MISSING_DATA" });
  assert.equal(_internals.percentageChange(12, 10).percentage, 20);
});

test("service refuses unsupported batch and duration contracts", async () => {
  await assert.rejects(
    AnalyticsService.getOverview({
      playerId: "PLY-1",
      period: "daily",
      startDate: "2026-11-11",
      timezone: "UTC",
      batchSemantics: "cumulative-snapshot",
      durationSemantics: "execution",
    }),
    { code: "UNSUPPORTED_ANALYTICS_DATA_SEMANTICS", statusCode: 409 },
  );
});

test("overview and progress query only a player's intersecting records", async () => {
  const originalAggregate = WearableData.aggregate;
  const originalFind = WorkoutExecution.find;
  const calls = [];
  const executionCalls = [];
  const docs = [
    record({ startedAt: "2026-11-11T10:00:00Z", endedAt: "2026-11-11T10:30:00Z", metrics: { steps: 100, calories: 10, distanceMeters: 50, durationSeconds: 1800, averageHeartRateBpm: 120, maxHeartRateBpm: 140 } }),
  ];
  WearableData.aggregate = async (pipeline) => {
    calls.push(pipeline[0].$match);
    const range = pipeline[0].$match;
    return docs.filter((doc) => doc.startedAt < range.startedAt.$lt && doc.endedAt >= range.endedAt.$gte);
  };
  WorkoutExecution.find = (filter) => {
    executionCalls.push(filter);
    return {
      select() { return this; },
      lean: async () => [{ executionId: "EX-1", startedAt: new Date("2026-11-11T10:00:00Z"), actualDurationSeconds: 1500 }]
        .filter((item) => item.startedAt >= filter.startedAt.$gte && item.startedAt < filter.startedAt.$lt),
    };
  };
  try {
    const options = { playerId: "PLY-1", period: "custom", startDate: "2026-11-11", endDate: "2026-11-11", timezone: "UTC" };
    const overview = await AnalyticsService.getOverview(options);
    assert.equal(overview.totalSteps, 100);
    assert.equal(overview.playerId, "PLY-1");
    assert.equal(overview.executionCount, 1);
    const activity = await AnalyticsService.getActivityAnalytics(options);
    assert.equal(activity.trends.length, 1);
    assert.equal(activity.trends[0].stepsPerMinute, 3.3333333333333335);
    const heartRate = await AnalyticsService.getHeartRateAnalytics(options);
    assert.equal(heartRate.durationWeightedAverageBpm, 120);
    assert.equal(heartRate.highestRecordedBatchMaximumBpm, 140);
    const duration = await AnalyticsService.getDurationAnalytics(options);
    assert.equal(duration.totalDurationSeconds, 1500);
    assert.equal(duration.averageExecutionDurationSeconds, 1500);
    const consistency = await AnalyticsService.getConsistencyAnalytics(options);
    assert.equal(consistency.activeDays, 1);
    assert.equal(consistency.executionCount, 1);
    assert.equal(consistency.averageExecutionsPerActiveWeek, 1);
    const progress = await AnalyticsService.getProgressAnalytics(options);
    assert.equal(progress.metrics.steps.current, 100);
    assert.equal(progress.metrics.steps.previous, null);
    assert.equal(progress.metrics.steps.status, "MISSING_DATA");
    const report = await AnalyticsService.getAnalyticsReport(options);
    assert.equal(report.overview.totalSteps, 100);
    assert.equal(report.overview.totalDurationSeconds, 1500);
    assert.equal(report.activity.trends.length, 1);
    assert.equal(report.progress.steps.status, "MISSING_DATA");
    assert.equal(calls.length, 10);
    assert.ok(calls.every((filter) => filter.playerId === "PLY-1"));
    assert.equal(executionCalls.length, 10);
    assert.ok(executionCalls.every((filter) => filter.playerId === "PLY-1"));
  } finally {
    WearableData.aggregate = originalAggregate;
    WorkoutExecution.find = originalFind;
  }
});
