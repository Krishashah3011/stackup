const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

// ─── Helper: format user for response ─────────────────────────────────────────
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: formatUser(user),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Select password explicitly (it's excluded by default)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: formatUser(user),
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  // req.user is already set by the protect middleware (no password)
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  res.json({
    success: true,
    user: formatUser(user),
  });
});

// @desc    Update user profile (name and/or password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  // Update name if provided
  if (name && name.trim()) {
    user.name = name.trim();
  }

  // Update password if provided
  if (newPassword) {
    if (!currentPassword) {
      throw new AppError('Current password is required to set a new password', 400);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    user.password = newPassword; // pre-save hook will hash it
  }

  await user.save();

  // Issue a fresh token so frontend stays logged in after name change
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    token,
    user: formatUser(user),
  });
});

// @desc    Delete user account and all associated data
// @route   DELETE /api/auth/profile
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError('Password is required to delete your account', 400);

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Incorrect password', 401);

  // Delete all user data across collections
  const Application       = require('../models/Application');
  const DsaProgress       = require('../models/DsaProgress');
  const AptitudeProgress  = require('../models/AptitudeProgress');
  const ResumeAnalysis    = require('../models/ResumeAnalysis');
  const InterviewGeneration = require('../models/InterviewGeneration');

  await Promise.all([
    Application.deleteMany({ userId: user._id }),
    DsaProgress.deleteMany({ userId: user._id }),
    AptitudeProgress.deleteMany({ userId: user._id }),
    ResumeAnalysis.deleteMany({ userId: user._id }),
    InterviewGeneration.deleteMany({ userId: user._id }),
    user.deleteOne(),
  ]);

  res.json({
    success: true,
    message: 'Account and all associated data deleted successfully',
  });
});

module.exports = { register, login, getProfile, updateProfile, deleteAccount };