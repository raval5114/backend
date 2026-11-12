// Working contract for records stored in the analytics WearableData collection.
// The legacy Wear OS writer currently targets a different endpoint/collection;
// that client must migrate to the interval-batch API before its data is counted.
module.exports = Object.freeze({
  batchSemantics: "interval-incremental",
  durationSemantics: "batch",
  overlapPolicy: "reject",
  timezoneFallback: "UTC",
  weekStartsOn: "monday",
  maxCustomRangeDays: 366,
});
