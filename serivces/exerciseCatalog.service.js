// // The supplied Android catalog source was not present in the backend repository.
// // Keep this registry centralized and extend it from the canonical _AndroidExercise list.
// const EXERCISES = Object.freeze([
//   { id: 14, name: "cricket" },
//   { id: 55, name: "running" },
//   { id: 67, name: "squat" },
//   { id: 83, name: "yoga" },
// ]);

// function list() { return EXERCISES; }
// function getById(id) { return EXERCISES.find((item) => item.id === Number(id)); }
// function getByName(name) { return EXERCISES.find((item) => item.name === String(name).trim().toLowerCase()); }
// function validate(id, name) {
//   const entry = getById(id);
//   if (!entry || entry.id === 0) throw Object.assign(new Error("Exercise type is not in the supported catalog"), { statusCode: 400, code: "INVALID_EXERCISE_TYPE" });
//   if (name && entry.name !== String(name).trim().toLowerCase()) throw Object.assign(new Error("Exercise name and ID do not match"), { statusCode: 400, code: "EXERCISE_MISMATCH" });
//   return entry;
// }
// module.exports = { list, getById, getByName, validate };


const EXERCISES = Object.freeze([
  { id: 101, name: "benchPress" },
  { id: 102, name: "deadlift" },
  { id: 103, name: "barbellShoulderPress" },
  { id: 104, name: "latPullDown" },
  { id: 105, name: "dumbbellCurlRightArm" },
  { id: 106, name: "dumbbellCurlLeftArm" },
  { id: 107, name: "dumbbellFrontRaise" },
  { id: 108, name: "dumbbellLateralRaise" },
  { id: 109, name: "dumbbellTricepsExtensionTwoArm" },
  { id: 110, name: "crunch" },
  { id: 111, name: "benchSitUp" },
  { id: 112, name: "lunge" },
  { id: 113, name: "burpee" },
  { id: 114, name: "jumpingJack" },
  { id: 115, name: "plank" },
  { id: 116, name: "runningTreadmill" },
  { id: 117, name: "bikingStationary" },
  { id: 118, name: "rowingMachine" },
  { id: 119, name: "elliptical" },
]);

function list() {
  return EXERCISES;
}

function getById(id) {
  return EXERCISES.find((item) => item.id === Number(id));
}

function getByName(name) {
  return EXERCISES.find(
    (item) => item.name === String(name).trim().toLowerCase()
  );
}

function validate(id, name) {
  const entry = getById(id);

  if (!entry) {
    throw Object.assign(
      new Error("Exercise type is not in the supported catalog"),
      { statusCode: 400, code: "INVALID_EXERCISE_TYPE" }
    );
  }

  if (
    name &&
    entry.name.toLowerCase() !== String(name).trim().toLowerCase()
  ) {
    throw Object.assign(
      new Error("Exercise name and ID do not match"),
      { statusCode: 400, code: "EXERCISE_MISMATCH" }
    );
  }

  return entry;
}

module.exports = { list, getById, getByName, validate };
