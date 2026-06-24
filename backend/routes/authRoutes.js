const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
      .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters')
      .escape(),
    body('email')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .isLength({ max: 72 }).withMessage('Password cannot exceed 72 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// ─── Protected routes ─────────────────────────────────────────────────────────

router.get('/profile', protect, getProfile);

router.put(
  '/profile',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
      .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters')
      .escape(),
    body('newPassword')
      .optional()
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .isLength({ max: 72 }).withMessage('New password cannot exceed 72 characters'),
  ],
  validate,
  updateProfile
);

router.delete(
  '/profile',
  protect,
  [
    body('password').notEmpty().withMessage('Password confirmation is required'),
  ],
  validate,
  deleteAccount
);

module.exports = router;