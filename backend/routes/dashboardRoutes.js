const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get full dashboard statistics for the authenticated user
// @access  Private
router.get('/', protect, getDashboardStats);

module.exports = router;