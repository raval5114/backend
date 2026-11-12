const WearableData = require("../models/wearableData.model");
const WorkoutExecution = require("../models/workoutExecution.model");
const AnalyticsContract = require("./analytics.contract");

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_RANGE_DAYS = AnalyticsContract.maxCustomRangeDays;
const METRICS = ["steps", "distanceMeters", "calories", "durationSeconds"];
const SEMANTICS_ERROR = "The configured wearable batch semantics are not supported by analytics";

function fail(message, code = "VALIDATION_ERROR", statusCode = 400) {
  throw Object.assign(new Error(message), { code, statusCode });
}

function makeFormatter(timezone) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    fail("timezone must be a valid IANA timezone", "INVALID_TIMEZONE", 400);
  }
}

function partsInTimezone(value, timezone, formatter = makeFormatter(timezone)) {
  const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
  };
}

function dateKey(parts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function parseDateOnly(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(`${name} must be a real calendar date`, "INVALID_DATE", 400);
  }
  return { year, month, day };
}

function addCalendarDays(parts, amount) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function addCalendarMonths(year, month, amount) {
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: 1 };
}

function localDateTimeToUtc(parts, timezone) {
  const formatter = makeFormatter(timezone);
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour || 0, parts.minute || 0, parts.second || 0);
  let guess = target;
  // Iteratively correct the UTC guess using the timezone's rendered wall clock.
  for (let i = 0; i < 4; i += 1) {
    const local = partsInTimezone(new Date(guess), timezone, formatter);
    const rendered = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    const correction = target - rendered;
    if (correction === 0) break;
    guess += correction;
  }
  return new Date(guess);
}

function parseTimestamp(value, name) {
  if (typeof value !== "string" && !(value instanceof Date)) fail(`${name} is required and must be a date or ISO timestamp`, "INVALID_DATE", 400);
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) fail(`${name} must be a valid date or ISO timestamp`, "INVALID_DATE", 400);
  return date;
}

function resolveDateRange({ period = "custom", startDate, endDate, timezone = "UTC", referenceDate = new Date(), maxRangeDays = DEFAULT_MAX_RANGE_DAYS } = {}) {
  const formatter = makeFormatter(timezone);
  const normalizedPeriod = String(period).toLowerCase();
  if (!Number.isInteger(maxRangeDays) || maxRangeDays < 1) fail("maxRangeDays must be a positive integer");
  let start;
  let end;
  let startLocal;
  let endLocal;

  if (["daily", "weekly", "monthly"].includes(normalizedPeriod)) {
    const anchor = startDate ? parseDateOnly(startDate, "startDate") : partsInTimezone(parseTimestamp(referenceDate, "referenceDate"), timezone, formatter);
    if (!anchor) fail("For daily, weekly and monthly periods, startDate must be YYYY-MM-DD when provided", "INVALID_DATE", 400);
    if (normalizedPeriod === "daily") {
      startLocal = { year: anchor.year, month: anchor.month, day: anchor.day };
      endLocal = addCalendarDays(startLocal, 1);
    } else if (normalizedPeriod === "weekly") {
      const weekday = new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day)).getUTCDay();
      const daysSinceMonday = (weekday + 6) % 7;
      startLocal = addCalendarDays(anchor, -daysSinceMonday);
      endLocal = addCalendarDays(startLocal, 7);
    } else {
      startLocal = { year: anchor.year, month: anchor.month, day: 1 };
      endLocal = addCalendarMonths(anchor.year, anchor.month, 1);
    }
    start = localDateTimeToUtc({ ...startLocal, hour: 0 }, timezone);
    end = localDateTimeToUtc({ ...endLocal, hour: 0 }, timezone);
  } else if (normalizedPeriod === "custom") {
    if (startDate === undefined || endDate === undefined) fail("custom period requires startDate and endDate", "INVALID_DATE_RANGE", 400);
    const startOnly = parseDateOnly(startDate, "startDate");
    const endOnly = parseDateOnly(endDate, "endDate");
    if (startOnly && endOnly) {
      startLocal = startOnly;
      endLocal = addCalendarDays(endOnly, 1); // API end date is inclusive; query end is exclusive.
      start = localDateTimeToUtc({ ...startLocal, hour: 0 }, timezone);
      end = localDateTimeToUtc({ ...endLocal, hour: 0 }, timezone);
    } else {
      start = parseTimestamp(startDate, "startDate");
      end = parseTimestamp(endDate, "endDate");
      startLocal = partsInTimezone(start, timezone, formatter);
      endLocal = partsInTimezone(end, timezone, formatter);
      const endAtLocalMidnight = endLocal.hour === 0 && endLocal.minute === 0 && endLocal.second === 0 && end.getUTCMilliseconds() === 0;
      if (endAtLocalMidnight) endLocal = addCalendarDays(endLocal, -1);
    }
  } else {
    fail("period must be daily, weekly, monthly or custom", "INVALID_PERIOD", 400);
  }

  if (!(start < end)) fail("startDate must be before endDate", "INVALID_DATE_RANGE", 400);
  const startDay = Date.UTC(startLocal.year, startLocal.month - 1, startLocal.day);
  const lastIncluded = normalizedPeriod === "custom" && !(parseDateOnly(startDate, "startDate") && parseDateOnly(endDate, "endDate"))
    ? endLocal
    : addCalendarDays(endLocal, -1);
  const endDay = Date.UTC(lastIncluded.year, lastIncluded.month - 1, lastIncluded.day);
  const calendarDays = Math.floor((endDay - startDay) / DAY_MS) + 1;
  if (calendarDays > maxRangeDays) fail(`Date range cannot exceed ${maxRangeDays} calendar days`, "DATE_RANGE_TOO_LARGE", 400);

  return {
    period: normalizedPeriod,
    timezone,
    start,
    end,
    startDate: dateKey(startLocal),
    endDate: dateKey(lastIncluded),
    calendarDays,
  };
}

function assertPlayerId(playerId) {
  if (typeof playerId !== "string" || !playerId.trim()) fail("playerId is required", "INVALID_PLAYER_ID", 400);
}

function assertBatchSemantics({
  batchSemantics = AnalyticsContract.batchSemantics,
  durationSemantics = AnalyticsContract.durationSemantics,
} = {}) {
  // Fail closed if a future caller attempts to use a data contract the service
  // has not implemented. Clients never choose this value.
  if (batchSemantics !== "interval-incremental" || durationSemantics !== "batch") {
    fail(SEMANTICS_ERROR, "UNSUPPORTED_ANALYTICS_DATA_SEMANTICS", 409);
  }
}

function numeric(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function localBucketKey(date, timezone, groupBy, formatter = makeFormatter(timezone)) {
  const parts = partsInTimezone(date, timezone, formatter);
  if (groupBy === "daily") return dateKey(parts);
  if (groupBy === "monthly") return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}`;
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const monday = addCalendarDays(parts, -((weekday + 6) % 7));
  return dateKey(monday);
}

function assertNoOverlaps(records) {
  const byExecution = new Map();
  for (const record of records) {
    if (!(record.startedAt instanceof Date) || !(record.endedAt instanceof Date) || record.startedAt > record.endedAt) {
      fail("Stored wearable batch has invalid interval timestamps", "INVALID_STORED_INTERVAL", 500);
    }
    const items = byExecution.get(record.executionId) || [];
    items.push(record);
    byExecution.set(record.executionId, items);
  }
  for (const items of byExecution.values()) {
    items.sort((a, b) => a.startedAt - b.startedAt || a.endedAt - b.endedAt);
    for (let i = 1; i < items.length; i += 1) {
      if (items[i].startedAt < items[i - 1].endedAt) {
        fail("Overlapping wearable batches cannot be summed safely", "OVERLAPPING_WEARABLE_BATCHES", 409);
      }
    }
  }
}

async function loadRecords({ playerId, range }) {
  // Include intersecting batches so the report can explicitly exclude intervals
  // that cross the requested boundary rather than silently prorating them.
  return WearableData.aggregate([
    { $match: { playerId, startedAt: { $lt: range.end }, endedAt: { $gte: range.start } } },
    { $project: { _id: 0, playerId: 1, executionId: 1, sessionId: 1, batchId: 1, startedAt: 1, endedAt: 1, metrics: 1 } },
    { $sort: { executionId: 1, startedAt: 1, endedAt: 1, batchId: 1 } },
  ]);
}

async function loadExecutions({ playerId, range }) {
  return WorkoutExecution.find({ playerId, startedAt: { $gte: range.start, $lt: range.end } })
    .select("executionId startedAt actualDurationSeconds")
    .lean();
}

function prepareRecords(records, range) {
  const datesFormatter = makeFormatter(range.timezone);
  const fullyContained = [];
  let boundaryExcludedBatches = 0;
  for (const record of records) {
    record.startedAt = new Date(record.startedAt);
    record.endedAt = new Date(record.endedAt);
    if (record.startedAt < range.start || record.endedAt >= range.end) {
      boundaryExcludedBatches += 1;
      continue;
    }
    fullyContained.push({ ...record, bucket: localBucketKey(record.endedAt, range.timezone, "daily", datesFormatter) });
  }
  assertNoOverlaps(fullyContained);
  return { records: fullyContained, boundaryExcludedBatches };
}

function sumKnown(values) {
  const known = values.filter((value) => value !== null);
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null;
}

function summarize(records, executions = [], timezone = "UTC") {
  const totals = Object.fromEntries(METRICS.map((metric) => [metric, sumKnown(records.map((record) => numeric(record.metrics?.[metric])))]));
  const executionDurationTotal = sumKnown(groupExecutions(records, executions).map((item) => item.durationSeconds));
  const hrSamples = records.map((record) => ({
    average: numeric(record.metrics?.averageHeartRateBpm),
    maximum: numeric(record.metrics?.maxHeartRateBpm),
    weight: numeric(record.metrics?.durationSeconds),
  }));
  const weighted = hrSamples.filter((sample) => sample.average !== null && sample.weight !== null && sample.weight > 0);
  const weightedDuration = weighted.reduce((sum, sample) => sum + sample.weight, 0);
  const executionCount = new Set([...records.map((record) => record.executionId), ...executions.map((execution) => execution.executionId)]).size;
  const activeDays = new Set([
    ...records.map((record) => record.bucket),
    ...executions.filter((execution) => execution.startedAt).map((execution) => dateKey(partsInTimezone(new Date(execution.startedAt), timezone))),
  ]).size;
  return {
    totalSteps: totals.steps,
    totalDistanceMeters: totals.distanceMeters,
    totalCalories: totals.calories,
    totalDurationSeconds: executionDurationTotal,
    executionCount,
    activeDays,
    durationWeightedAverageHeartRateBpm: weightedDuration ? weighted.reduce((sum, sample) => sum + sample.average * sample.weight, 0) / weightedDuration : null,
    highestRecordedBatchMaximumHeartRateBpm: sumKnown(hrSamples.map((sample) => sample.maximum)) === null ? null : Math.max(...hrSamples.map((sample) => sample.maximum).filter((value) => value !== null)),
  };
}

function groupRecords(records, timezone, groupBy) {
  const formatter = makeFormatter(timezone);
  const groups = new Map();
  for (const record of records) {
    const key = localBucketKey(record.endedAt, timezone, groupBy, formatter);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, group]) => {
    const summary = summarize(group, [], timezone);
    const durationMinutes = summary.totalDurationSeconds === null ? null : summary.totalDurationSeconds / 60;
    const durationHours = summary.totalDurationSeconds === null ? null : summary.totalDurationSeconds / 3600;
    const distanceKm = summary.totalDistanceMeters === null ? null : summary.totalDistanceMeters / 1000;
    return {
      periodStart: key,
      ...summary,
      stepsPerMinute: durationMinutes > 0 && summary.totalSteps !== null ? summary.totalSteps / durationMinutes : null,
      averageSpeedMetersPerSecond: durationHours > 0 && summary.totalDistanceMeters !== null ? summary.totalDistanceMeters / (durationHours * 3600) : null,
      averageSpeedKilometersPerHour: durationHours > 0 && distanceKm !== null ? distanceKm / durationHours : null,
    };
  });
}

function groupExecutions(records, executions = []) {
  const byExecution = new Map();
  for (const record of records) {
    if (!byExecution.has(record.executionId)) byExecution.set(record.executionId, []);
    byExecution.get(record.executionId).push(record);
  }
  const knownExecutions = new Map(executions.map((execution) => [execution.executionId, execution]));
  const executionIds = new Set([...byExecution.keys(), ...knownExecutions.keys()]);
  return [...executionIds].map((executionId) => {
    const items = byExecution.get(executionId) || [];
    const execution = knownExecutions.get(executionId);
    const wearableDuration = sumKnown(items.map((item) => numeric(item.metrics?.durationSeconds)));
    return {
      executionId,
      startedAt: execution?.startedAt ? new Date(execution.startedAt) : items.length ? new Date(Math.min(...items.map((item) => item.startedAt.getTime()))) : null,
      durationSeconds: numeric(execution?.actualDurationSeconds) ?? wearableDuration,
    };
  });
}

function consistency(records, range, executions = []) {
  const daily = groupRecords(records, range.timezone, "daily");
  const weekly = groupRecords(records, range.timezone, "weekly");
  const active = new Set([
    ...daily.map((item) => item.periodStart),
    ...executions.filter((execution) => execution.startedAt).map((execution) => dateKey(partsInTimezone(new Date(execution.startedAt), range.timezone))),
  ]);
  const rangeStart = parseDateOnly(range.startDate, "startDate");
  const rangeEnd = parseDateOnly(range.endDate, "endDate");
  let bestStreak = 0;
  let streak = 0;
  for (let i = 0; i < range.calendarDays; i += 1) {
    const key = dateKey(addCalendarDays(rangeStart, i));
    if (active.has(key)) { streak += 1; bestStreak = Math.max(bestStreak, streak); }
    else streak = 0;
  }
  const lastDate = dateKey(rangeEnd);
  let currentStreak = 0;
  for (let i = 0; i < range.calendarDays; i += 1) {
    const key = dateKey(addCalendarDays(rangeEnd, -i));
    if (!active.has(key)) break;
    currentStreak += 1;
  }
  const executionCount = new Set([...records.map((record) => record.executionId), ...executions.map((execution) => execution.executionId)]).size;
  const activeWeeks = new Set([
    ...weekly.map((item) => item.periodStart),
    ...executions.filter((execution) => execution.startedAt).map((execution) => localBucketKey(new Date(execution.startedAt), range.timezone, "weekly")),
  ]).size;
  return {
    activeDays: active.size,
    executionCount,
    activeWeeks,
    averageExecutionsPerActiveWeek: activeWeeks ? executionCount / activeWeeks : 0,
    currentStreakDays: active.has(lastDate) ? currentStreak : 0,
    bestStreakDays: bestStreak,
  };
}

function percentageChange(current, previous) {
  if (current === null || previous === null) return { percentage: null, status: "MISSING_DATA" };
  if (previous === 0) return { percentage: null, status: "ZERO_BASELINE" };
  return { percentage: ((current - previous) / Math.abs(previous)) * 100, status: "AVAILABLE" };
}

function previousRange(range) {
  const first = parseDateOnly(range.startDate, "startDate");
  let previousStart;
  let previousLast;
  if (range.period === "daily") {
    previousStart = addCalendarDays(first, -1);
    previousLast = previousStart;
  } else if (range.period === "weekly") {
    previousStart = addCalendarDays(first, -7);
    previousLast = addCalendarDays(first, -1);
  } else if (range.period === "monthly") {
    previousStart = addCalendarMonths(first.year, first.month, -1);
    previousLast = addCalendarDays(first, -1);
  } else {
    previousStart = addCalendarDays(first, -range.calendarDays);
    previousLast = addCalendarDays(first, -1);
  }
  return resolveDateRange({
    period: "custom",
    startDate: dateKey(previousStart),
    endDate: dateKey(previousLast),
    timezone: range.timezone,
    maxRangeDays: DEFAULT_MAX_RANGE_DAYS,
  });
}

async function collect({
  playerId,
  period,
  startDate,
  endDate,
  timezone = AnalyticsContract.timezoneFallback,
  referenceDate,
  maxRangeDays = DEFAULT_MAX_RANGE_DAYS,
  batchSemantics = AnalyticsContract.batchSemantics,
  durationSemantics = AnalyticsContract.durationSemantics,
}) {
  assertPlayerId(playerId);
  assertBatchSemantics({ batchSemantics, durationSemantics });
  const range = resolveDateRange({ period, startDate, endDate, timezone, referenceDate, maxRangeDays });
  const [stored, executions] = await Promise.all([
    loadRecords({ playerId, range }),
    loadExecutions({ playerId, range }),
  ]);
  const prepared = prepareRecords(stored, range);
  return { range, executions, ...prepared };
}

function withMetadata(range, boundaryExcludedBatches, data) {
  return {
    playerId: data.playerId,
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    timezone: range.timezone,
    generatedAt: new Date().toISOString(),
    dataQuality: { boundaryExcludedBatches, batchSemantics: AnalyticsContract.batchSemantics },
    ...data,
  };
}

class AnalyticsService {
  static async getOverview(options) {
    const result = await collect(options);
    return withMetadata(result.range, result.boundaryExcludedBatches, { playerId: options.playerId, ...summarize(result.records, result.executions, result.range.timezone) });
  }

  static async getActivityAnalytics(options) {
    const result = await collect(options);
    const groupBy = options.groupBy || (result.range.period === "custom" ? "daily" : result.range.period);
    if (!["daily", "weekly", "monthly"].includes(groupBy)) fail("groupBy must be daily, weekly or monthly", "INVALID_GROUP_BY", 400);
    return withMetadata(result.range, result.boundaryExcludedBatches, {
      playerId: options.playerId,
      groupBy,
      trends: groupRecords(result.records, result.range.timezone, groupBy),
    });
  }

  static async getHeartRateAnalytics(options) {
    const result = await collect(options);
    const summary = summarize(result.records, result.executions, result.range.timezone);
    return withMetadata(result.range, result.boundaryExcludedBatches, {
      playerId: options.playerId,
      durationWeightedAverageBpm: summary.durationWeightedAverageHeartRateBpm,
      highestRecordedBatchMaximumBpm: summary.highestRecordedBatchMaximumHeartRateBpm,
      sampleCount: result.records.filter((record) => numeric(record.metrics?.averageHeartRateBpm) !== null || numeric(record.metrics?.maxHeartRateBpm) !== null).length,
    });
  }

  static async getDurationAnalytics(options) {
    const result = await collect(options);
    const executions = groupExecutions(result.records, result.executions).map((item) => item.durationSeconds).filter((value) => value !== null);
    const total = sumKnown(executions);
    return withMetadata(result.range, result.boundaryExcludedBatches, {
      playerId: options.playerId,
      totalDurationSeconds: total,
      averageExecutionDurationSeconds: executions.length ? total / executions.length : null,
      longestExecutionDurationSeconds: executions.length ? Math.max(...executions) : null,
      shortestExecutionDurationSeconds: executions.length ? Math.min(...executions) : null,
      executionCount: new Set(result.records.map((record) => record.executionId)).size,
    });
  }

  static async getConsistencyAnalytics(options) {
    const result = await collect(options);
    return withMetadata(result.range, result.boundaryExcludedBatches, { playerId: options.playerId, ...consistency(result.records, result.range, result.executions) });
  }

  static async getProgressAnalytics(options) {
    const current = await collect(options);
    const priorRange = previousRange(current.range);
    const [previousRecords, previousExecutions] = await Promise.all([
      loadRecords({ playerId: options.playerId, range: priorRange }),
      loadExecutions({ playerId: options.playerId, range: priorRange }),
    ]);
    const preparedPrevious = prepareRecords(previousRecords, priorRange);
    const currentTotals = summarize(current.records, current.executions, current.range.timezone);
    const previousTotals = summarize(preparedPrevious.records, previousExecutions, priorRange.timezone);
    const compare = (key) => ({ current: currentTotals[key], previous: previousTotals[key], ...percentageChange(currentTotals[key], previousTotals[key]) });
    return withMetadata(current.range, current.boundaryExcludedBatches, {
      playerId: options.playerId,
      comparisonPeriod: { startDate: priorRange.startDate, endDate: priorRange.endDate },
      metrics: {
        steps: compare("totalSteps"),
        distanceMeters: compare("totalDistanceMeters"),
        calories: compare("totalCalories"),
        durationSeconds: compare("totalDurationSeconds"),
        durationWeightedAverageHeartRateBpm: compare("durationWeightedAverageHeartRateBpm"),
      },
    });
  }

  static async getAnalyticsReport(options) {
    const result = await collect(options);
    const summary = summarize(result.records, result.executions, result.range.timezone);
    const groupBy = options.groupBy || (result.range.period === "custom" ? "daily" : result.range.period);
    if (!["daily", "weekly", "monthly"].includes(groupBy)) fail("groupBy must be daily, weekly or monthly", "INVALID_GROUP_BY", 400);
    const executions = groupExecutions(result.records, result.executions).map((item) => item.durationSeconds).filter((value) => value !== null);
    const progress = await AnalyticsService.getProgressAnalytics(options);
    return withMetadata(result.range, result.boundaryExcludedBatches, {
      playerId: options.playerId,
      overview: summary,
      activity: { groupBy, trends: groupRecords(result.records, result.range.timezone, groupBy) },
      heartRate: {
        durationWeightedAverageBpm: summary.durationWeightedAverageHeartRateBpm,
        highestRecordedBatchMaximumBpm: summary.highestRecordedBatchMaximumHeartRateBpm,
      },
      duration: {
        totalDurationSeconds: summary.totalDurationSeconds,
        averageExecutionDurationSeconds: executions.length ? sumKnown(executions) / executions.length : null,
        longestExecutionDurationSeconds: executions.length ? Math.max(...executions) : null,
        shortestExecutionDurationSeconds: executions.length ? Math.min(...executions) : null,
      },
      consistency: consistency(result.records, result.range, result.executions),
      progress: progress.metrics,
    });
  }
}

module.exports = AnalyticsService;
module.exports._internals = {
  resolveDateRange,
  localDateTimeToUtc,
  localBucketKey,
  summarize,
  groupRecords,
  groupExecutions,
  consistency,
  percentageChange,
  assertNoOverlaps,
  assertBatchSemantics,
  previousRange,
};
