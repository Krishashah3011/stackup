const asyncHandler  = require('../utils/asyncHandler');
const AppError      = require('../utils/AppError');
const Application   = require('../models/Application');

const VALID_STATUSES = ['Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'];
const VALID_SORT_FIELDS = ['createdAt', 'appliedDate', 'company', 'role', 'status'];

// ─── Helper: assert ownership ─────────────────────────────────────────────────
const assertOwner = (application, userId) => {
  if (application.userId.toString() !== userId) {
    throw new AppError('You are not authorized to access this application', 403);
  }
};

// @desc    Get stats summary for current user
// @route   GET /api/applications/stats
// @access  Private
const getApplicationStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Try to convert to ObjectId for the aggregation pipeline.
  // Falls back to a string match if the id is not a valid 24-char hex (e.g. test env).
  let userObjectId;
  try {
    userObjectId = require('mongoose').Types.ObjectId.createFromHexString(userId);
  } catch {
    userObjectId = userId; // non-ObjectId string (test mocks, etc.)
  }

  const [statusCounts, recentActivity] = await Promise.all([
    Application.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('company role status appliedDate createdAt'),
  ]);

  // Build status map with zeros for missing statuses
  const countMap = { total: 0 };
  VALID_STATUSES.forEach((s) => { countMap[s] = 0; });
  statusCounts.forEach(({ _id, count }) => {
    countMap[_id]  = count;
    countMap.total += count;
  });

  res.json({
    success: true,
    data: {
      counts: countMap,
      recentActivity,
    },
  });
});

// @desc    Get all applications for current user (with filter, search, sort, pagination)
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    sort    = 'createdAt',
    order   = 'desc',
    page    = 1,
    limit   = 50,
  } = req.query;

  // Build query
  const query = { userId: req.user.id };
  if (status && status !== 'All' && VALID_STATUSES.includes(status)) {
    query.status = status;
  }
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { company: { $regex: escaped, $options: 'i' } },
      { role:    { $regex: escaped, $options: 'i' } },
    ];
  }

  // Sort
  const sortField = VALID_SORT_FIELDS.includes(sort) ? sort : 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj   = { [sortField]: sortOrder };

  // Pagination
  const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
  const pageSize = Math.min(100, parseInt(limit, 10) || 50);
  const skip     = (pageNum - 1) * pageSize;

  const [applications, total] = await Promise.all([
    Application.find(query).sort(sortObj).skip(skip).limit(pageSize),
    Application.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: applications.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
    data: applications,
  });
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new AppError('Application not found', 404);
  assertOwner(application, req.user.id);

  res.json({ success: true, data: application });
});

// @desc    Create application
// @route   POST /api/applications
// @access  Private
const createApplication = asyncHandler(async (req, res) => {
  const { company, role, package: pkg, status, appliedDate, notes } = req.body;

  const application = await Application.create({
    userId: req.user.id,
    company: company.trim(),
    role:    role.trim(),
    package: pkg?.trim() || 'Not disclosed',
    status:  VALID_STATUSES.includes(status) ? status : 'Applied',
    appliedDate: appliedDate || new Date(),
    notes: notes?.trim() || '',
  });

  res.status(201).json({
    success: true,
    message: `Application to ${application.company} added successfully`,
    data: application,
  });
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new AppError('Application not found', 404);
  assertOwner(application, req.user.id);

  // Whitelist updatable fields
  const allowed = ['company', 'role', 'package', 'status', 'appliedDate', 'notes'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Validate status if provided
  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  const updated = await Application.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Application updated successfully',
    data: updated,
  });
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new AppError('Application not found', 404);
  assertOwner(application, req.user.id);

  await application.deleteOne();

  res.json({
    success: true,
    message: `Application to ${application.company} deleted successfully`,
  });
});

module.exports = {
  getApplicationStats,
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
};