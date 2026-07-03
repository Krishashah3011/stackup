const asyncHandler      = require('../utils/asyncHandler');
const AppError          = require('../utils/AppError');
const AptitudeProgress  = require('../models/AptitudeProgress');

const ALL_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
];

// ─── Helper: assert ownership ─────────────────────────────────────────────────
const assertOwner = (record, userId) => {
  if (record.userId.toString() !== userId) {
    throw new AppError('Not authorised to access this record', 403);
  }
};

// @desc    Get aptitude summary stats for user
// @route   GET /api/aptitude/summary
// @access  Private
const getAptitudeSummary = asyncHandler(async (req, res) => {
  const records = await AptitudeProgress.find({ userId: req.user.id });

  const avgScore    = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.score,    0) / records.length)
    : 0;
  const avgAccuracy = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.accuracy, 0) / records.length)
    : 0;

  const totalTopicsCompleted = records.reduce((s, r) => s + r.completedTopics, 0);
  const totalTopicsAvail     = records.reduce((s, r) => s + r.totalTopics,     0);

  // Best category (highest score)
  const bestCategory = records.length > 0
    ? records.reduce((b, r) => (r.score > b.score ? r : b), records[0])
    : null;

  // Weakest category (lowest score among started: score > 0)
  const startedRecords  = records.filter((r) => r.score > 0);
  const weakestCategory = startedRecords.length > 0
    ? startedRecords.reduce((w, r) => (r.score < w.score ? r : w), startedRecords[0])
    : null;

  const trackedCategories   = records.map((r) => r.category);
  const untrackedCategories = ALL_CATEGORIES.filter((c) => !trackedCategories.includes(c));

  res.json({
    success: true,
    data: {
      avgScore,
      avgAccuracy,
      categoriesTracked:    records.length,
      categoriesTotal:      ALL_CATEGORIES.length,
      totalTopicsCompleted,
      totalTopicsAvail,
      bestCategory:    bestCategory    ? { category: bestCategory.category,    score: bestCategory.score    } : null,
      weakestCategory: weakestCategory ? { category: weakestCategory.category, score: weakestCategory.score } : null,
      untrackedCategories,
    },
  });
});

// @desc    Get all aptitude progress for user
// @route   GET /api/aptitude
// @access  Private
const getAptitudeProgress = asyncHandler(async (req, res) => {
  const records = await AptitudeProgress.find({ userId: req.user.id }).sort({ category: 1 });
  res.json({ success: true, count: records.length, data: records });
});

// @desc    Add aptitude progress
// @route   POST /api/aptitude
// @access  Private
const addAptitudeProgress = asyncHandler(async (req, res) => {
  const { category, completedTopics, totalTopics, score, accuracy } = req.body;

  const existing = await AptitudeProgress.findOne({ userId: req.user.id, category });
  if (existing) {
    throw new AppError(
      `Progress for "${category}" already exists. Use PUT /api/aptitude/${existing._id} to update it.`,
      409
    );
  }

  const total     = Math.max(1,   Number(totalTopics)     || 10);
  const completed = Math.min(total, Math.max(0, Number(completedTopics) || 0));

  const record = await AptitudeProgress.create({
    userId: req.user.id,
    category,
    completedTopics: completed,
    totalTopics:     total,
    score:           Math.min(100, Math.max(0, Number(score)    || 0)),
    accuracy:        Math.min(100, Math.max(0, Number(accuracy) || 0)),
  });

  res.status(201).json({
    success: true,
    message: `"${category}" added to your aptitude tracker`,
    data:    record,
  });
});

// @desc    Bulk-add all aptitude categories at once
// @route   POST /api/aptitude/bulk
// @access  Private
const bulkAddAptitudeProgress = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new AppError('categories must be a non-empty array', 400);
  }
  if (categories.length > 4) {
    throw new AppError('Cannot add more than 4 categories at once', 400);
  }

  const existingRecords    = await AptitudeProgress.find({ userId: req.user.id });
  const existingCategories = new Set(existingRecords.map((r) => r.category));

  const created = [];
  const skipped = [];

  for (const item of categories) {
    if (!ALL_CATEGORIES.includes(item.category)) {
      throw new AppError(`"${item.category}" is not a valid aptitude category`, 400);
    }
    if (existingCategories.has(item.category)) {
      skipped.push(item.category);
      continue;
    }

    const total     = Math.max(1,    Number(item.totalTopics)     || 10);
    const completed = Math.min(total, Math.max(0, Number(item.completedTopics) || 0));

    const rec = await AptitudeProgress.create({
      userId:          req.user.id,
      category:        item.category,
      completedTopics: completed,
      totalTopics:     total,
      score:           Math.min(100, Math.max(0, Number(item.score)    || 0)),
      accuracy:        Math.min(100, Math.max(0, Number(item.accuracy) || 0)),
    });
    created.push(rec);
  }

  res.status(201).json({
    success: true,
    message: `Added ${created.length} categor${created.length === 1 ? 'y' : 'ies'}${skipped.length ? `, skipped ${skipped.length} already existing` : ''}`,
    data:    created,
    skipped,
  });
});

// @desc    Update aptitude progress
// @route   PUT /api/aptitude/:id
// @access  Private
const updateAptitudeProgress = asyncHandler(async (req, res) => {
  const record = await AptitudeProgress.findById(req.params.id);
  if (!record) throw new AppError('Aptitude progress record not found', 404);
  assertOwner(record, req.user.id);

  // Whitelist + clamp
  const { completedTopics, totalTopics, score, accuracy } = req.body;
  if (totalTopics     !== undefined) record.totalTopics     = Math.max(1,   Number(totalTopics));
  if (completedTopics !== undefined) record.completedTopics = Math.min(record.totalTopics, Math.max(0, Number(completedTopics)));
  if (score           !== undefined) record.score           = Math.min(100, Math.max(0, Number(score)));
  if (accuracy        !== undefined) record.accuracy        = Math.min(100, Math.max(0, Number(accuracy)));

  await record.save();

  res.json({
    success: true,
    message: `"${record.category}" progress updated`,
    data:    record,
  });
});

// @desc    Log a practice session (quick score update)
// @route   PATCH /api/aptitude/:id/session
// @access  Private
const logSession = asyncHandler(async (req, res) => {
  const { score, accuracy, topicsCompleted = 0 } = req.body;

  if (score === undefined && accuracy === undefined) {
    throw new AppError('Provide at least score or accuracy for the session', 400);
  }

  const record = await AptitudeProgress.findById(req.params.id);
  if (!record) throw new AppError('Aptitude progress record not found', 404);
  assertOwner(record, req.user.id);

  // Rolling average: weight new session at 30%, existing at 70%
  if (score    !== undefined) record.score    = Math.round(record.score    * 0.7 + Number(score)    * 0.3);
  if (accuracy !== undefined) record.accuracy = Math.round(record.accuracy * 0.7 + Number(accuracy) * 0.3);

  // Increment completed topics
  if (topicsCompleted > 0) {
    record.completedTopics = Math.min(
      record.totalTopics,
      record.completedTopics + Number(topicsCompleted)
    );
  }

  // Clamp
  record.score    = Math.min(100, Math.max(0, record.score));
  record.accuracy = Math.min(100, Math.max(0, record.accuracy));

  await record.save();

  res.json({
    success: true,
    message: `Session logged for "${record.category}"`,
    data:    record,
  });
});

// @desc    Delete aptitude progress
// @route   DELETE /api/aptitude/:id
// @access  Private
const deleteAptitudeProgress = asyncHandler(async (req, res) => {
  const record = await AptitudeProgress.findById(req.params.id);
  if (!record) throw new AppError('Aptitude progress record not found', 404);
  assertOwner(record, req.user.id);

  await record.deleteOne();
  res.json({ success: true, message: `"${record.category}" removed from your aptitude tracker` });
});

module.exports = {
  getAptitudeSummary,
  getAptitudeProgress,
  addAptitudeProgress,
  bulkAddAptitudeProgress,
  updateAptitudeProgress,
  logSession,
  deleteAptitudeProgress,
};