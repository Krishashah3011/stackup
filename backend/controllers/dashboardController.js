const asyncHandler      = require('../utils/asyncHandler');
const Application       = require('../models/Application');
const DsaProgress       = require('../models/DsaProgress');
const AptitudeProgress  = require('../models/AptitudeProgress');
const ResumeAnalysis    = require('../models/ResumeAnalysis');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute a "Placement Readiness Score" (0-100) from all module data. */
const computeReadinessScore = ({ applications, dsaOverall, aptitudeOverall, resumeScore }) => {
  const weights = {
    applications : 0.20,   // 20% — are you applying?
    dsa          : 0.30,   // 30% — coding skills
    aptitude     : 0.25,   // 25% — aptitude prep
    resume       : 0.25,   // 25% — resume quality
  };

  // Applications sub-score: 100 if ≥10 applications, scaled below that
  const appScore = Math.min(100, (applications.total / 10) * 100);
  const dsaScore = dsaOverall;
  const aptScore = aptitudeOverall;
  const resScore = resumeScore ?? 0;

  const readiness = Math.round(
    appScore  * weights.applications +
    dsaScore  * weights.dsa +
    aptScore  * weights.aptitude +
    resScore  * weights.resume
  );

  return Math.max(0, Math.min(100, readiness));
};

/** Build status counts map, guaranteed to include all statuses with 0. */
const buildStatusCounts = (applications) => {
  const ALL = ['Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'];
  const map  = { total: applications.length };
  ALL.forEach((s) => { map[s] = 0; });
  applications.forEach((a) => { if (map[a.status] !== undefined) map[a.status]++; });
  return map;
};

/** Group applications by ISO week for a 8-week trend. */
const buildWeeklyTrend = (applications) => {
  const now   = new Date();
  const weeks = [];

  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = applications.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= weekStart && d < weekEnd;
    }).length;

    weeks.push({
      label: weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count,
    });
  }
  return weeks;
};

// @desc    Get full dashboard stats for the current user
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Fetch all data in parallel
  const [applications, dsaProgress, aptitudeProgress, latestResume, resumeHistory] =
    await Promise.all([
      Application.find({ userId }).sort({ createdAt: -1 }),
      DsaProgress.find({ userId }).sort({ topic: 1 }),
      AptitudeProgress.find({ userId }).sort({ category: 1 }),
      ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }),
      ResumeAnalysis.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('score createdAt fileName'),
    ]);

  // ── Application stats ───────────────────────────────────────────────────
  const statusCounts = buildStatusCounts(applications);

  // Conversion rate: selected / (selected + rejected) × 100
  const decidedCount = statusCounts['Selected'] + statusCounts['Rejected'];
  const conversionRate = decidedCount > 0
    ? Math.round((statusCounts['Selected'] / decidedCount) * 100)
    : null;

  // Recent applications (last 6)
  const recentApplications = applications.slice(0, 6).map((a) => ({
    id:          a._id,
    company:     a.company,
    role:        a.role,
    status:      a.status,
    appliedDate: a.appliedDate,
    createdAt:   a.createdAt,
  }));

  // Weekly trend (last 8 weeks)
  const weeklyTrend = buildWeeklyTrend(applications);

  // ── DSA stats ───────────────────────────────────────────────────────────
  const totalSolved   = dsaProgress.reduce((s, d) => s + d.solvedProblems,  0);
  const totalProblems = dsaProgress.reduce((s, d) => s + d.totalProblems, 0);
  const dsaOverall    = dsaProgress.length > 0
    ? Math.round(dsaProgress.reduce((s, d) => s + d.progress, 0) / dsaProgress.length)
    : 0;

  // ── Aptitude stats ──────────────────────────────────────────────────────
  const aptitudeOverall = aptitudeProgress.length > 0
    ? Math.round(aptitudeProgress.reduce((s, a) => s + a.score, 0) / aptitudeProgress.length)
    : 0;
  const avgAccuracy = aptitudeProgress.length > 0
    ? Math.round(aptitudeProgress.reduce((s, a) => s + a.accuracy, 0) / aptitudeProgress.length)
    : 0;

  // ── Resume stats ────────────────────────────────────────────────────────
  const resumeScore = latestResume?.score ?? null;

  // ── Readiness Score ─────────────────────────────────────────────────────
  const readinessScore = computeReadinessScore({
    applications: statusCounts,
    dsaOverall,
    aptitudeOverall,
    resumeScore,
  });

  // ── Quick action suggestions ────────────────────────────────────────────
  // Surface the most impactful next action for the user
  const suggestions = [];
  if (statusCounts.total === 0)      suggestions.push({ type: 'tracker',  msg: 'Add your first job application to get started' });
  if (dsaProgress.length === 0)      suggestions.push({ type: 'dsa',      msg: 'Start tracking your DSA progress by topic' });
  if (aptitudeProgress.length === 0) suggestions.push({ type: 'aptitude', msg: 'Log your aptitude preparation progress' });
  if (!latestResume)                 suggestions.push({ type: 'resume',   msg: 'Analyze your resume with AI for an ATS score' });
  if (suggestions.length === 0 && readinessScore < 60) {
    suggestions.push({ type: 'dsa', msg: `Your DSA progress is ${dsaOverall}% — keep solving problems!` });
  }

  res.json({
    success: true,
    data: {
      readinessScore,

      applications: {
        ...statusCounts,
        conversionRate,
        weeklyTrend,
      },

      resume: {
        score:   resumeScore,
        history: resumeHistory.map((r) => ({
          id:        r._id,
          score:     r.score,
          fileName:  r.fileName,
          createdAt: r.createdAt,
        })),
      },

      dsa: {
        overall:      dsaOverall,
        totalSolved,
        totalProblems,
        topicsTracked: dsaProgress.length,
        breakdown:    dsaProgress,
      },

      aptitude: {
        overall:          aptitudeOverall,
        avgAccuracy,
        categoriesTracked: aptitudeProgress.length,
        breakdown:        aptitudeProgress,
      },

      recentApplications,
      suggestions,
    },
  });
});

module.exports = { getDashboardStats };