const express = require('express');
const { body } = require('express-validator');
const {
  addDsaProgress,
  getDsaProgress,
  updateDsaProgress,
  deleteDsaProgress,
} = require('../controllers/dsaController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const DSA_TOPICS = ['Arrays', 'Strings', 'Linked List', 'Stack & Queue', 'Hashing', 'Trees', 'Graphs', 'Dynamic Programming'];

router
  .route('/')
  .get(getDsaProgress)
  .post(
    [
      body('topic').isIn(DSA_TOPICS).withMessage(`Topic must be one of: ${DSA_TOPICS.join(', ')}`),
      body('totalProblems').isInt({ min: 1 }).withMessage('Total problems must be a positive integer'),
      body('solvedProblems').optional().isInt({ min: 0 }).withMessage('Solved problems must be a non-negative integer'),
    ],
    validate,
    addDsaProgress
  );

router.route('/:id').put(updateDsaProgress).delete(deleteDsaProgress);

module.exports = router;
