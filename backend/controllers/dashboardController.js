const asyncHandler = require('../utils/asyncHandler');
const Application = require('../models/Application');
const DsaProgress = require('../models/DsaProgress');
const AptitudeProgress = require('../models/AptitudeProgress');
const ResumeAnalysis = require('../models/ResumeAnalysis');

// @desc    Get dashboard stats for user
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [applications, dsaProgress, aptitudeProgress, latestResume] = await Promise.all([
    Application.find({ userId }),
    DsaProgress.find({ userId }),
    AptitudeProgress.find({ userId }),
    ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }),
  ]);

  // Application stats
  const totalApplications = applications.length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const interviewScheduled = applications.filter((a) => a.status === 'Interview Scheduled').length;

  // DSA overall progress
  const dsaOverall =
    dsaProgress.length > 0
      ? Math.round(dsaProgress.reduce((sum, d) => sum + d.progress, 0) / dsaProgress.length)
      : 0;

  // Aptitude overall score
  const aptitudeOverall =
    aptitudeProgress.length > 0
      ? Math.round(aptitudeProgress.reduce((sum, a) => sum + a.score, 0) / aptitudeProgress.length)
      : 0;

  // Recent applications (last 5)
  const recentApplications = applications
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((app) => ({
      id: app._id,
      company: app.company,
      role: app.role,
      status: app.status,
      appliedDate: app.appliedDate,
    }));

  res.json({
    success: true,
    data: {
      applications: {
        total: totalApplications,
        selected: selectedCount,
        rejected: rejectedCount,
        interviewScheduled,
      },
      resumeScore: latestResume ? latestResume.score : null,
      dsaProgress: dsaOverall,
      aptitudeProgress: aptitudeOverall,
      recentApplications,
      dsaBreakdown: dsaProgress,
      aptitudeBreakdown: aptitudeProgress,
    },
  });
});

module.exports = { getDashboardStats };