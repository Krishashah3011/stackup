const express = require('express');
const { body, query } = require('express-validator');
const {
  generateInterview,
  getInterviewHistory,
  getInterviewSession,
  deleteInterviewSession,
  analyzeResume,
  getResumeHistory,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload      = require('../middleware/upload');
const validate    = require('../middleware/validate');

const router = express.Router();
router.use(protect);

// ── Resume ────────────────────────────────────────────────────────────────────
router.post('/resume-analyze', upload.single('resume'), analyzeResume);
router.get('/resume/history', getResumeHistory);

// ── Interview ─────────────────────────────────────────────────────────────────
router.get('/interview/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ],
  validate,
  getInterviewHistory
);

router.post(
  '/interview',
  [
    body('company').trim().notEmpty().withMessage('Company name is required')
      .isLength({ max: 200 }).withMessage('Company name too long'),
    body('role').trim().notEmpty().withMessage('Role is required')
      .isLength({ max: 200 }).withMessage('Role too long'),
    body('skills').optional(),
    body('difficulty').optional()
      .isIn(['Easy', 'Medium', 'Hard', 'Mixed'])
      .withMessage('Difficulty must be Easy, Medium, Hard, or Mixed'),
    body('rounds').optional().isInt({ min: 3, max: 5 })
      .withMessage('Rounds must be between 3 and 5'),
  ],
  validate,
  generateInterview
);

router.get('/interview/:id', getInterviewSession);
router.delete('/interview/:id', deleteInterviewSession);

module.exports = router;