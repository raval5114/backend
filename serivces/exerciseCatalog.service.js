// The supplied Android catalog source was not present in the backend repository.
// Keep this registry centralized and extend it from the canonical _AndroidExercise list.
const EXERCISES = Object.freeze([
  { id: 14, name: "cricket" },
  { id: 55, name: "running" },
  { id: 67, name: "squat" },
  { id: 83, name: "yoga" },
]);

function list() { return EXERCISES; }
function getById(id) { return EXERCISES.find((item) => item.id === Number(id)); }
function getByName(name) { return EXERCISES.find((item) => item.name === String(name).trim().toLowerCase()); }
function validate(id, name) {
  const entry = getById(id);
  if (!entry || entry.id === 0) throw Object.assign(new Error("Exercise type is not in the supported catalog"), { statusCode: 400, code: "INVALID_EXERCISE_TYPE" });
  if (name && entry.name !== String(name).trim().toLowerCase()) throw Object.assign(new Error("Exercise name and ID do not match"), { statusCode: 400, code: "EXERCISE_MISMATCH" });
  return entry;
}
module.exports = { list, getById, getByName, validate };
