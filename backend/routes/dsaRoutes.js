const express = require('express');
const { body } = require('express-validator');
const {
  getDsaSummary,
  getDsaProgress,
  addDsaProgress,
  bulkAddDsaProgress,
  updateDsaProgress,
  incrementSolved,
  deleteDsaProgress,
} = require('../controllers/dsaController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

const router = express.Router();

// All routes require auth
router.use(protect);

const VALID_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack & Queue',
  'Hashing', 'Trees', 'Graphs', 'Dynamic Programming',
];

// ── Summary ───────────────────────────────────────────────────────────────────
router.get('/summary', getDsaSummary);

// ── Bulk add ──────────────────────────────────────────────────────────────────
router.post(
  '/bulk',
  [
    body('topics')
      .isArray({ min: 1, max: 8 })
      .withMessage('topics must be an array with 1–8 items'),
    body('topics.*.topic')
      .isIn(VALID_TOPICS)
      .withMessage(`Each topic must be one of: ${VALID_TOPICS.join(', ')}`),
    body('topics.*.totalProblems')
      .isInt({ min: 1 })
      .withMessage('Each totalProblems must be a positive integer'),
    body('topics.*.solvedProblems')
      .optional()
      .isInt({ min: 0 })
      .withMessage('solvedProblems must be a non-negative integer'),
  ],
  validate,
  bulkAddDsaProgress
);

// ── Collection ────────────────────────────────────────────────────────────────
router
  .route('/')
  .get(getDsaProgress)
  .post(
    [
      body('topic')
        .isIn(VALID_TOPICS)
        .withMessage(`Topic must be one of: ${VALID_TOPICS.join(', ')}`),
      body('totalProblems')
        .isInt({ min: 1 })
        .withMessage('totalProblems must be a positive integer'),
      body('solvedProblems')
        .optional()
        .isInt({ min: 0 })
        .withMessage('solvedProblems must be a non-negative integer'),
    ],
    validate,
    addDsaProgress
  );

// ── Increment (quick-solve) ───────────────────────────────────────────────────
router.patch('/:id/increment', incrementSolved);

// ── Single resource ───────────────────────────────────────────────────────────
router
  .route('/:id')
  .put(
    [
      body('totalProblems')
        .optional()
        .isInt({ min: 1 })
        .withMessage('totalProblems must be a positive integer'),
      body('solvedProblems')
        .optional()
        .isInt({ min: 0 })
        .withMessage('solvedProblems must be a non-negative integer'),
    ],
    validate,
    updateDsaProgress
  )
  .delete(deleteDsaProgress);

module.exports = router;