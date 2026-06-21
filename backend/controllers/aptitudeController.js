const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const AptitudeProgress = require('../models/AptitudeProgress');

// @desc    Add aptitude progress
// @route   POST /api/aptitude
// @access  Private
const addAptitudeProgress = asyncHandler(async (req, res) => {
  const { category, completedTopics, totalTopics, score, accuracy } = req.body;

  const existing = await AptitudeProgress.findOne({ userId: req.user.id, category });
  if (existing) throw new AppError(`Progress for "${category}" already exists. Use update instead.`, 409);

  const progress = await AptitudeProgress.create({
    userId: req.user.id,
    category,
    completedTopics: completedTopics || 0,
    totalTopics: totalTopics || 10,
    score: score || 0,
    accuracy: accuracy || 0,
  });

  res.status(201).json({ success: true, message: 'Aptitude progress added', data: progress });
});

// @desc    Get all aptitude progress for user
// @route   GET /api/aptitude
// @access  Private
const getAptitudeProgress = asyncHandler(async (req, res) => {
  const progress = await AptitudeProgress.find({ userId: req.user.id }).sort({ category: 1 });
  res.json({ success: true, count: progress.length, data: progress });
});

// @desc    Update aptitude progress
// @route   PUT /api/aptitude/:id
// @access  Private
const updateAptitudeProgress = asyncHandler(async (req, res) => {
  let record = await AptitudeProgress.findById(req.params.id);

  if (!record) throw new AppError('Aptitude progress record not found', 404);
  if (record.userId.toString() !== req.user.id) throw new AppError('Not authorized', 403);

  Object.assign(record, req.body);
  await record.save();

  res.json({ success: true, message: 'Aptitude progress updated', data: record });
});

// @desc    Delete aptitude progress
// @route   DELETE /api/aptitude/:id
// @access  Private
const deleteAptitudeProgress = asyncHandler(async (req, res) => {
  const record = await AptitudeProgress.findById(req.params.id);

  if (!record) throw new AppError('Aptitude progress record not found', 404);
  if (record.userId.toString() !== req.user.id) throw new AppError('Not authorized', 403);

  await record.deleteOne();
  res.json({ success: true, message: 'Aptitude progress deleted' });
});

module.exports = { addAptitudeProgress, getAptitudeProgress, updateAptitudeProgress, deleteAptitudeProgress };