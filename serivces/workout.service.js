const { randomUUID } = require("crypto");
const Workout = require("../models/workout.model");
const Catalog = require("./exerciseCatalog.service");

function bad(message, code = "VALIDATION_ERROR", statusCode = 400) { throw Object.assign(new Error(message), { code, statusCode }); }

class WorkoutService {
  static async create(userId, input) {
    const exercise = Catalog.validate(input.exerciseTypeId, input.exerciseType);
    if (!input.name || !input.name.trim()) bad("Workout name is required");
    return Workout.create({ ...input, exerciseType: exercise.name, exerciseTypeId: exercise.id, workoutId: randomUUID(), createdBy: userId });
  }
  static async list({ page = 1, limit = 20, includeInactive = false } = {}) {
    page = Math.max(Number(page) || 1, 1); limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const filter = includeInactive ? {} : { isActive: true };
    const [items, total] = await Promise.all([Workout.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Workout.countDocuments(filter)]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  static async get(workoutId, includeInactive = false) { const item = await Workout.findOne({ workoutId, ...(includeInactive ? {} : { isActive: true }) }).lean(); if (!item) bad("Workout not found", "WORKOUT_NOT_FOUND", 404); return item; }
  static async update(userId, workoutId, input) {
    const workout = await Workout.findOne({ workoutId }); if (!workout) bad("Workout not found", "WORKOUT_NOT_FOUND", 404);
    if (workout.createdBy !== userId) bad("Only the workout creator or an administrator can update it", "FORBIDDEN", 403);
    if (input.exerciseTypeId !== undefined || input.exerciseType !== undefined) {
      const exercise = Catalog.validate(input.exerciseTypeId ?? workout.exerciseTypeId, input.exerciseType ?? workout.exerciseType);
      input.exerciseTypeId = exercise.id; input.exerciseType = exercise.name;
    }
    const allowed = ["name", "description", "exerciseType", "exerciseTypeId", "sets", "reps", "durationSeconds"];
    for (const key of allowed) if (input[key] !== undefined) workout[key] = input[key];
    return workout.save();
  }
  static async setActive(userId, workoutId, isActive) {
    if (typeof isActive !== "boolean") bad("isActive must be a boolean");
    const workout = await Workout.findOne({ workoutId }); if (!workout) bad("Workout not found", "WORKOUT_NOT_FOUND", 404);
    if (workout.createdBy !== userId) bad("Only the workout creator or an administrator can update it", "FORBIDDEN", 403);
    workout.isActive = isActive; return workout.save();
  }
}
module.exports = WorkoutService;
