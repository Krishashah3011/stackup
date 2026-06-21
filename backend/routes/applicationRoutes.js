const express = require('express');
const { body } = require('express-validator');
const {
  createApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getApplications)
  .post(
    [
      body('company').trim().notEmpty().withMessage('Company name is required'),
      body('role').trim().notEmpty().withMessage('Role is required'),
      body('status')
        .optional()
        .isIn(['Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'])
        .withMessage('Invalid status value'),
    ],
    validate,
    createApplication
  );

router.route('/:id').put(updateApplication).delete(deleteApplication);

module.exports = router;
