const express = require('express');
const { body } = require('express-validator');
const {
  getAptitudeSummary,
  getAptitudeProgress,
  addAptitudeProgress,
  bulkAddAptitudeProgress,
  updateAptitudeProgress,
  logSession,
  deleteAptitudeProgress,
} = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const VALID_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
];

const scoreValidators = [
  body('score').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be 0–100'),
  body('accuracy').optional().isFloat({ min: 0, max: 100 }).withMessage('Accuracy must be 0–100'),
];

// ── Summary ───────────────────────────────────────────────────────────────────
router.get('/summary', getAptitudeSummary);

// ── Bulk add ──────────────────────────────────────────────────────────────────
router.post(
  '/bulk',
  [
    body('categories')
      .isArray({ min: 1, max: 4 })
      .withMessage('categories must be an array with 1–4 items'),
    body('categories.*.category')
      .isIn(VALID_CATEGORIES)
      .withMessage(`Each category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    body('categories.*.score').optional().isFloat({ min: 0, max: 100 }),
    body('categories.*.accuracy').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  bulkAddAptitudeProgress
);

// ── Collection ────────────────────────────────────────────────────────────────
router
  .route('/')
  .get(getAptitudeProgress)
  .post(
    [
      body('category')
        .isIn(VALID_CATEGORIES)
        .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
      body('completedTopics').optional().isInt({ min: 0 }).withMessage('Must be non-negative'),
      body('totalTopics').optional().isInt({ min: 1 }).withMessage('Must be at least 1'),
      ...scoreValidators,
    ],
    validate,
    addAptitudeProgress
  );

// ── Session log (quick update) ────────────────────────────────────────────────
router.patch(
  '/:id/session',
  [
    ...scoreValidators,
    body('topicsCompleted').optional().isInt({ min: 0 }).withMessage('Must be non-negative'),
  ],
  validate,
  logSession
);

// ── Single resource ───────────────────────────────────────────────────────────
router
  .route('/:id')
  .put(
    [
      body('completedTopics').optional().isInt({ min: 0 }),
      body('totalTopics').optional().isInt({ min: 1 }),
      ...scoreValidators,
    ],
    validate,
    updateAptitudeProgress
  )
  .delete(deleteAptitudeProgress);

module.exports = router;