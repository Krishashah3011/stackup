const express = require('express');
const { body } = require('express-validator');
const { analyzeResume, generateInterview } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post('/resume-analyze', upload.single('resume'), analyzeResume);

router.post(
  '/interview',
  [
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
  ],
  validate,
  generateInterview
);

module.exports = router;