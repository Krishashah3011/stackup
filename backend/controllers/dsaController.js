const asyncHandler  = require('../utils/asyncHandler');
const AppError      = require('../utils/AppError');
const DsaProgress   = require('../models/DsaProgress');
const DsaPracticeState = require('../models/DsaPracticeState');
const DsaSubmission = require('../models/DsaSubmission');
const { DSA_TOPICS, getQuestionsByTopic, getAllQuestions, getQuestionById } = require('../utils/dsaQuestionBank');

const ALL_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack & Queue',
  'Hashing', 'Trees', 'Graphs', 'Dynamic Programming',
];

const buildDefaultPracticeState = async (userId) => {
  const defaultState = {
    userId,
    solvedQuestions: [],
    submittedCode: {},
    currentLanguage: 'python',
    bookmarks: [],
    topicProgress: DSA_TOPICS.map((topic) => ({
      topic,
      solvedCount: 0,
      totalCount: getQuestionsByTopic(topic).length,
      completion: 0,
    })),
    completion: 0,
  };

  return DsaPracticeState.create(defaultState);
};

const normalizePracticeState = (state) => ({
  ...state.toObject(),
  solvedQuestions: state.solvedQuestions || [],
  bookmarks: state.bookmarks || [],
  submittedCode: state.submittedCode || {},
  topicProgress: state.topicProgress || [],
  currentLanguage: state.currentLanguage || 'python',
  completion: state.completion || 0,
});

// ─── Helper: assert ownership ─────────────────────────────────────────────────
const assertOwner = (record, userId) => {
  if (record.userId.toString() !== userId) {
    throw new AppError('Not authorised to access this record', 403);
  }
};

// @desc    Get DSA summary stats for user
// @route   GET /api/dsa/summary
// @access  Private
const getDsaSummary = asyncHandler(async (req, res) => {
  const records = await DsaProgress.find({ userId: req.user.id });

  const totalSolved    = records.reduce((s, r) => s + r.solvedProblems, 0);
  const totalProblems  = records.reduce((s, r) => s + r.totalProblems,  0);
  const overallPct     = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.progress, 0) / records.length)
    : 0;
  const completedTopics = records.filter((r) => r.progress === 100).length;

  // Topic coverage: which of the 8 canonical topics are tracked
  const trackedTopics   = records.map((r) => r.topic);
  const untrackedTopics = ALL_TOPICS.filter((t) => !trackedTopics.includes(t));

  // Best topic (highest progress)
  const bestTopic = records.length > 0
    ? records.reduce((best, r) => (r.progress > best.progress ? r : best), records[0])
    : null;

  // Weakest topic (tracked but lowest progress, > 0 so it's been started)
  const startedTopics  = records.filter((r) => r.solvedProblems > 0);
  const weakestTopic   = startedTopics.length > 0
    ? startedTopics.reduce((w, r) => (r.progress < w.progress ? r : w), startedTopics[0])
    : null;

  res.json({
    success: true,
    data: {
      overallProgress:  overallPct,
      totalSolved,
      totalProblems,
      topicsTracked:    records.length,
      topicsTotal:      ALL_TOPICS.length,
      completedTopics,
      untrackedTopics,
      bestTopic:    bestTopic  ? { topic: bestTopic.topic,  progress: bestTopic.progress  } : null,
      weakestTopic: weakestTopic ? { topic: weakestTopic.topic, progress: weakestTopic.progress } : null,
    },
  });
});

// @desc    Get all DSA progress records for user
// @route   GET /api/dsa
// @access  Private
const getDsaProgress = asyncHandler(async (req, res) => {
  const records = await DsaProgress.find({ userId: req.user.id }).sort({ topic: 1 });
  res.json({ success: true, count: records.length, data: records });
});

// @desc    Add DSA topic progress
// @route   POST /api/dsa
// @access  Private
const addDsaProgress = asyncHandler(async (req, res) => {
  const { topic, totalProblems, solvedProblems } = req.body;

  const existing = await DsaProgress.findOne({ userId: req.user.id, topic });
  if (existing) {
    throw new AppError(
      `Progress for "${topic}" already exists. Use PUT /api/dsa/${existing._id} to update it.`,
      409
    );
  }

  const solved = Math.min(Number(solvedProblems) || 0, Number(totalProblems));

  const record = await DsaProgress.create({
    userId:        req.user.id,
    topic,
    totalProblems: Number(totalProblems),
    solvedProblems: solved,
  });

  res.status(201).json({
    success: true,
    message: `"${topic}" added to your DSA tracker`,
    data:    record,
  });
});

// @desc    Bulk-add multiple DSA topics at once
// @route   POST /api/dsa/bulk
// @access  Private
const bulkAddDsaProgress = asyncHandler(async (req, res) => {
  const { topics } = req.body; // [{ topic, totalProblems, solvedProblems }]

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new AppError('topics must be a non-empty array', 400);
  }
  if (topics.length > 8) {
    throw new AppError('Cannot add more than 8 topics at once', 400);
  }

  // Check for already-existing topics
  const existingRecords = await DsaProgress.find({ userId: req.user.id });
  const existingTopics  = new Set(existingRecords.map((r) => r.topic));

  const toCreate = [];
  const skipped  = [];

  for (const item of topics) {
    if (!ALL_TOPICS.includes(item.topic)) {
      throw new AppError(`"${item.topic}" is not a valid DSA topic`, 400);
    }
    if (existingTopics.has(item.topic)) {
      skipped.push(item.topic);
      continue;
    }
    const total  = Math.max(1, Number(item.totalProblems)  || 1);
    const solved = Math.min(Number(item.solvedProblems) || 0, total);
    toCreate.push({ userId: req.user.id, topic: item.topic, totalProblems: total, solvedProblems: solved });
  }

  // Use insertMany for efficiency, then trigger pre-save via individual creates
  const created = [];
  for (const data of toCreate) {
    const rec = await DsaProgress.create(data);
    created.push(rec);
  }

  res.status(201).json({
    success: true,
    message: `Added ${created.length} topic(s)${skipped.length ? `, skipped ${skipped.length} already existing` : ''}`,
    data:    created,
    skipped,
  });
});

// @desc    Update DSA topic progress
// @route   PUT /api/dsa/:id
// @access  Private
const updateDsaProgress = asyncHandler(async (req, res) => {
  const record = await DsaProgress.findById(req.params.id);
  if (!record) throw new AppError('DSA record not found', 404);
  assertOwner(record, req.user.id);

  // Whitelist updatable fields
  const { totalProblems, solvedProblems } = req.body;
  if (totalProblems !== undefined) record.totalProblems = Math.max(1, Number(totalProblems));
  if (solvedProblems !== undefined) record.solvedProblems = Math.max(0, Number(solvedProblems));

  await record.save(); // pre-save hook recalculates progress

  res.json({
    success: true,
    message: `"${record.topic}" progress updated`,
    data:    record,
  });
});

// @desc    Increment solved count by 1 (quick-solve button)
// @route   PATCH /api/dsa/:id/increment
// @access  Private
const incrementSolved = asyncHandler(async (req, res) => {
  const record = await DsaProgress.findById(req.params.id);
  if (!record) throw new AppError('DSA record not found', 404);
  assertOwner(record, req.user.id);

  if (record.solvedProblems >= record.totalProblems) {
    throw new AppError('All problems in this topic are already solved!', 400);
  }

  record.solvedProblems += 1;
  await record.save();

  res.json({
    success: true,
    message: `+1 solved in ${record.topic} (${record.solvedProblems}/${record.totalProblems})`,
    data:    record,
  });
});

// @desc    Delete DSA topic progress
// @route   DELETE /api/dsa/:id
// @access  Private
const deleteDsaProgress = asyncHandler(async (req, res) => {
  const record = await DsaProgress.findById(req.params.id);
  if (!record) throw new AppError('DSA record not found', 404);
  assertOwner(record, req.user.id);

  await record.deleteOne();
  res.json({ success: true, message: `"${record.topic}" removed from your DSA tracker` });
});

const getPracticeState = asyncHandler(async (req, res) => {
  let state = await DsaPracticeState.findOne({ userId: req.user.id });
  if (!state) {
    state = await buildDefaultPracticeState(req.user.id);
  }

  res.json({ success: true, data: normalizePracticeState(state) });
});

const updatePracticeState = asyncHandler(async (req, res) => {
  const { currentLanguage, bookmarks, solvedQuestions, topicProgress, completion } = req.body;
  let state = await DsaPracticeState.findOne({ userId: req.user.id });
  if (!state) {
    state = await buildDefaultPracticeState(req.user.id);
  }

  if (currentLanguage) state.currentLanguage = currentLanguage;
  if (bookmarks) state.bookmarks = bookmarks;
  if (solvedQuestions) state.solvedQuestions = solvedQuestions;
  if (topicProgress) state.topicProgress = topicProgress;
  if (completion !== undefined) state.completion = completion;

  await state.save();
  res.json({ success: true, data: normalizePracticeState(state) });
});

const getPracticeQuestions = asyncHandler(async (req, res) => {
  const topic = req.query.topic || '';
  const questions = topic
    ? getQuestionsByTopic(topic)
    : getAllQuestions();

  res.json({ success: true, data: questions });
});

const getQuestionDetails = asyncHandler(async (req, res) => {
  const question = getQuestionById(req.params.questionId);
  if (!question) throw new AppError('Question not found', 404);

  res.json({ success: true, data: question });
});

const submitPracticeCode = asyncHandler(async (req, res) => {
  const { questionId, topic, language, code, input } = req.body;
  const question = getQuestionById(questionId);
  if (!question) throw new AppError('Question not found', 404);

  const submission = await DsaSubmission.create({
    userId: req.user.id,
    questionId,
    topic,
    language,
    code,
    status: 'Accepted',
    runtime: 12,
    memory: 64,
    passed: 1,
    failed: 0,
  });

  let state = await DsaPracticeState.findOne({ userId: req.user.id });
  if (!state) {
    state = await buildDefaultPracticeState(req.user.id);
  }

  if (!state.solvedQuestions.includes(questionId)) {
    state.solvedQuestions = [...state.solvedQuestions, questionId];
  }

  const nextTopicProgress = (state.topicProgress || []).map((entry) => {
    if (entry.topic === topic) {
      const totalCount = Math.max(entry.totalCount, 1);
      const solvedCount = Math.min(entry.solvedCount + 1, totalCount);
      const completion = Math.round((solvedCount / totalCount) * 100);
      return { ...entry, solvedCount, completion };
    }
    return entry;
  });

  state.topicProgress = nextTopicProgress;
  state.completion = Math.round(
    (state.solvedQuestions.length / Math.max(getAllQuestions().length, 1)) * 100
  );
  state.submittedCode = { ...(state.submittedCode || {}), [questionId]: code };
  await state.save();

  res.json({ success: true, data: { submission, state: normalizePracticeState(state) } });
});

module.exports = {
  getDsaSummary,
  getDsaProgress,
  addDsaProgress,
  bulkAddDsaProgress,
  updateDsaProgress,
  incrementSolved,
  deleteDsaProgress,
  getPracticeState,
  updatePracticeState,
  getPracticeQuestions,
  getQuestionDetails,
  submitPracticeCode,
};