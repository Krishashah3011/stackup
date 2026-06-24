const express = require('express');
const { body, query } = require('express-validator');
const {
  getApplicationStats,
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', getApplicationStats);

// ── Collection ────────────────────────────────────────────────────────────────
router
  .route('/')
  .get(
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('sort').optional().isIn(['createdAt', 'appliedDate', 'company', 'role', 'status'])
        .withMessage('Invalid sort field'),
      query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    ],
    validate,
    getApplications
  )
  .post(
    [
      body('company')
        .trim()
        .notEmpty().withMessage('Company name is required')
        .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
      body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isLength({ max: 100 }).withMessage('Role cannot exceed 100 characters'),
      body('package')
        .optional()
        .isLength({ max: 50 }).withMessage('Package cannot exceed 50 characters'),
      body('status')
        .optional()
        .isIn(['Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'])
        .withMessage('Invalid status value'),
      body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    ],
    validate,
    createApplication
  );

// ── Single resource ───────────────────────────────────────────────────────────
router
  .route('/:id')
  .get(getApplication)
  .put(
    [
      body('company').optional().trim()
        .notEmpty().withMessage('Company name cannot be empty')
        .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
      body('role').optional().trim()
        .notEmpty().withMessage('Role cannot be empty')
        .isLength({ max: 100 }).withMessage('Role cannot exceed 100 characters'),
      body('status').optional()
        .isIn(['Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'])
        .withMessage('Invalid status value'),
      body('notes').optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    ],
    validate,
    updateApplication
  )
  .delete(deleteApplication);

module.exports = router;