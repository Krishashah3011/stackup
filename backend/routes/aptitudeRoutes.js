const express = require('express');
const { body } = require('express-validator');
const {
  addAptitudeProgress,
  getAptitudeProgress,
  updateAptitudeProgress,
  deleteAptitudeProgress,
} = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const APT_CATEGORIES = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'];

router
  .route('/')
  .get(getAptitudeProgress)
  .post(
    [
      body('category').isIn(APT_CATEGORIES).withMessage(`Category must be one of: ${APT_CATEGORIES.join(', ')}`),
      body('completedTopics').optional().isInt({ min: 0 }).withMessage('Completed topics must be non-negative'),
      body('score').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
      body('accuracy').optional().isFloat({ min: 0, max: 100 }).withMessage('Accuracy must be between 0 and 100'),
    ],
    validate,
    addAptitudeProgress
  );

router.route('/:id').put(updateAptitudeProgress).delete(deleteAptitudeProgress);

module.exports = router;
