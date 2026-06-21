const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Application = require('../models/Application');

// @desc    Create application
// @route   POST /api/applications
// @access  Private
const createApplication = asyncHandler(async (req, res) => {
  const { company, role, package: pkg, status, appliedDate, notes } = req.body;

  const application = await Application.create({
    userId: req.user.id,
    company,
    role,
    package: pkg,
    status,
    appliedDate,
    notes,
  });

  res.status(201).json({ success: true, message: 'Application added', data: application });
});

// @desc    Get all applications for user
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = { userId: req.user.id };

  if (status && status !== 'All') query.status = status;
  if (search) {
    query.$or = [
      { company: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
    ];
  }

  const applications = await Application.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: applications.length, data: applications });
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = asyncHandler(async (req, res) => {
  let application = await Application.findById(req.params.id);

  if (!application) throw new AppError('Application not found', 404);
  if (application.userId.toString() !== req.user.id) throw new AppError('Not authorized', 403);

  application = await Application.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, message: 'Application updated', data: application });
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) throw new AppError('Application not found', 404);
  if (application.userId.toString() !== req.user.id) throw new AppError('Not authorized', 403);

  await application.deleteOne();
  res.json({ success: true, message: 'Application deleted' });
});

module.exports = { createApplication, getApplications, updateApplication, deleteApplication };