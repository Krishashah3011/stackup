const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const DsaProgress = require('../models/DsaProgress');

// @desc    Add DSA topic progress
// @route   POST /api/dsa
// @access  Private
const addDsaProgress = asyncHandler(async (req, res) => {
  const { topic, totalProblems, solvedProblems } = req.body;

  const existing = await DsaProgress.findOne({ userId: req.user.id, topic });
  if (existing) throw new AppError(`Progress for "${topic}" already exists. Use update instead.`, 409);

  const progress = await DsaProgress.create({
    userId: req.user.id,
    topic,
    totalProblems,
    solvedProblems: solvedProblems || 0,
  });

  res.status(201).json({ success: true, message: 'DSA progress added', data: progress });
});

// @desc    Get all DSA progress for user
// @route   GET /api/dsa
// @access  Private
const getDsaProgress = asyncHandler(async (req, res) => {
  const progress = await DsaProgress.find({ userId: req.user.id }).sort({ topic: 1 });
  res.json({ success: true, count: progress.length, data: progress });
});

// @desc    Update DSA topic progress
// @route   PUT /api/dsa/:id
// @access  Private
const updateDsaProgress = asyncHandler(async (req, res) => {
  let record = await DsaProgress.findById(req.params.id);

  if (!record) throw new AppError('DSA progress record not found', 404);
  if (record.userId.toString() !== req.user.id) throw new AppError('Not authorized', 403);

  Object.assign(record, req.body);
  await record.save();

  res.json({ success: true, message: 'DSA progress updated', data: record });
});

// @desc    Delete DSA topic progress
// @route   DELETE /api/dsa/:id
// @access  Private
const deleteDsaProgress = asyncHandler(async (req, res) => {
  const record = await DsaProgress.findById(req.params.id);

  if (!record) throw new AppError('DSA progress record not found', 404);
  if (record.userId.toString() !== req.user.id) throw new AppError('Not authorized', 403);

  await record.deleteOne();
  res.json({ success: true, message: 'DSA progress deleted' });
});

module.exports = { addDsaProgress, getDsaProgress, updateDsaProgress, deleteDsaProgress };