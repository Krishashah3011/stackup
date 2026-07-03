const asyncHandler         = require('../utils/asyncHandler');
const AppError             = require('../utils/AppError');
const { getGeminiModel }   = require('../config/gemini');
const ResumeAnalysis       = require('../models/ResumeAnalysis');
const InterviewGeneration  = require('../models/InterviewGeneration');
const fs                   = require('fs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse JSON from Gemini response — strips markdown fences if present. */
const parseGeminiJSON = (rawText) => {
  // Try to extract JSON object from the response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in AI response');
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Try removing trailing commas (common Gemini quirk)
    const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned);
  }
};

/** Ensure a field is a non-empty array of strings. */
const toStringArray = (val) => {
  if (!Array.isArray(val)) return [];
  return val.filter((item) => typeof item === 'string' && item.trim()).map((s) => s.trim());
};

/** Sanitise user input for prompt injection. */
const sanitise = (str, maxLen = 200) =>
  String(str || '').replace(/[`'"\\]/g, '').trim().slice(0, maxLen);

// ─────────────────────────────────────────────────────────────────────────────

// @desc    Generate interview questions with Gemini
// @route   POST /api/ai/interview
// @access  Private
const generateInterview = asyncHandler(async (req, res) => {
  const { company, role, skills, difficulty = 'Mixed', rounds = 3 } = req.body;

  if (!company?.trim() || !role?.trim()) {
    throw new AppError('Company name and role are required', 400);
  }

  const safeCompany    = sanitise(company);
  const safeRole       = sanitise(role);
  const skillsArr      = Array.isArray(skills)
    ? skills.map((s) => sanitise(s, 50)).filter(Boolean)
    : skills ? [sanitise(skills)] : [];
  const skillsText     = skillsArr.length > 0 ? skillsArr.join(', ') : 'General Software Engineering';

  const validDifficulties = ['Easy', 'Medium', 'Hard', 'Mixed'];
  const safeDifficulty    = validDifficulties.includes(difficulty) ? difficulty : 'Mixed';

  // Determine round count (3–5)
  const roundCount = Math.min(5, Math.max(3, Number(rounds) || 3));

  const model = getGeminiModel();

  const prompt = `You are a senior technical interviewer at ${safeCompany}. Generate a comprehensive, realistic interview question set for:

Company: ${safeCompany}
Role: ${safeRole}
Skills/Technologies: ${skillsText}
Difficulty Level: ${safeDifficulty}
Interview Rounds: ${roundCount}

Return ONLY valid JSON with no markdown, no extra text, no trailing commas:
{
  "overview": "<2-sentence description of the interview process at ${safeCompany} for ${safeRole}>",
  "tips": [<3-4 specific preparation tips for ${safeCompany} interviews>],
  "hrQuestions": [<exactly 8 HR/behavioral questions with STAR method hints relevant to ${safeCompany} culture>],
  "technicalQuestions": [<exactly 10 technical questions based on ${safeRole} and ${skillsText}, with difficulty markers like [Easy], [Medium], [Hard]>],
  "projectQuestions": [<exactly 6 project/experience questions that probe practical skills>],
  "systemDesignQuestions": [<exactly 4 system design questions appropriate for ${safeRole}>]
}`;

  let questionsData;
  try {
    const result  = await model.generateContent(prompt);
    const rawText = result.response.text();
    questionsData = parseGeminiJSON(rawText);
  } catch (err) {
    if (err.message?.includes('JSON')) {
      throw new AppError('AI returned malformed data. Please try again.', 500);
    }
    throw new AppError('AI service temporarily unavailable. Please try again.', 503);
  }

  // Validate and normalise all arrays
  const hrQuestions          = toStringArray(questionsData.hrQuestions);
  const technicalQuestions   = toStringArray(questionsData.technicalQuestions);
  const projectQuestions     = toStringArray(questionsData.projectQuestions);
  const systemDesignQuestions = toStringArray(questionsData.systemDesignQuestions);
  const tips                 = toStringArray(questionsData.tips);

  if (hrQuestions.length === 0 && technicalQuestions.length === 0) {
    throw new AppError('AI failed to generate questions. Please try again.', 500);
  }

  const saved = await InterviewGeneration.create({
    userId:   req.user.id,
    company:  safeCompany,
    role:     safeRole,
    skills:   skillsArr,
    hrQuestions,
    technicalQuestions,
    projectQuestions,
    systemDesignQuestions,
    tips,
    overview:   questionsData.overview || '',
    difficulty: safeDifficulty,
  });

  res.status(201).json({
    success: true,
    message: `Interview questions generated for ${safeCompany} — ${safeRole}`,
    data: {
      id:                    saved._id,
      company:               saved.company,
      role:                  saved.role,
      skills:                saved.skills,
      difficulty:            saved.difficulty,
      overview:              saved.overview,
      tips:                  saved.tips,
      hrQuestions:           saved.hrQuestions,
      technicalQuestions:    saved.technicalQuestions,
      projectQuestions:      saved.projectQuestions,
      systemDesignQuestions: saved.systemDesignQuestions,
      createdAt:             saved.createdAt,
    },
  });
});

// @desc    Get interview generation history for user
// @route   GET /api/ai/interview/history
// @access  Private
const getInterviewHistory = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const pageSize = Math.min(20, Math.max(1, Number(limit)));
  const pageNum  = Math.max(1, Number(page));
  const skip     = (pageNum - 1) * pageSize;

  const [sessions, total] = await Promise.all([
    InterviewGeneration.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('company role skills difficulty overview createdAt'),
    InterviewGeneration.countDocuments({ userId: req.user.id }),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
    data: sessions,
  });
});

// @desc    Get a single interview session by ID
// @route   GET /api/ai/interview/:id
// @access  Private
const getInterviewSession = asyncHandler(async (req, res) => {
  const session = await InterviewGeneration.findById(req.params.id);
  if (!session) throw new AppError('Interview session not found', 404);
  if (session.userId.toString() !== req.user.id) throw new AppError('Not authorised', 403);

  res.json({ success: true, data: session });
});

// @desc    Delete an interview session
// @route   DELETE /api/ai/interview/:id
// @access  Private
const deleteInterviewSession = asyncHandler(async (req, res) => {
  const session = await InterviewGeneration.findById(req.params.id);
  if (!session) throw new AppError('Interview session not found', 404);
  if (session.userId.toString() !== req.user.id) throw new AppError('Not authorised', 403);

  await session.deleteOne();
  res.json({ success: true, message: 'Interview session deleted' });
});

// ─── Resume Analyzer ──────────────────────────────────────────────────────────

// @desc    Analyze resume PDF
// @route   POST /api/ai/resume-analyze
// @access  Private
const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a PDF resume', 400);

  let pdfText = '';
  try {
    const pdfParse  = require('pdf-parse');
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData   = await pdfParse(pdfBuffer);
    pdfText         = pdfData.text;
  } catch {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new AppError('Failed to extract text from PDF. Ensure the PDF is not scanned/image-based.', 422);
  }

  if (!pdfText.trim()) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new AppError('Could not extract text. The PDF may be image-based (scanned).', 422);
  }

  const model  = getGeminiModel();
  const prompt = `You are an expert ATS resume analyzer and career coach. Analyze the following resume and respond ONLY with valid JSON (no markdown, no text outside JSON).

Resume Text:
${pdfText.substring(0, 8000)}

Return this exact JSON structure:
{
  "score": <integer 0-100 representing ATS compatibility>,
  "strengths": [<3-5 specific strengths found in this resume>],
  "missingKeywords": [<important technical/soft skill keywords missing from this resume>],
  "improvementSuggestions": [<4-6 specific, actionable suggestions to improve this resume>],
  "atsTips": [<3-5 ATS-specific optimisation tips for this resume>],
  "summary": "<2-sentence overall assessment>"
}`;

  let analysisData;
  try {
    const result  = await model.generateContent(prompt);
    const rawText = result.response.text();
    analysisData  = parseGeminiJSON(rawText);
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (err.message?.includes('JSON')) {
      throw new AppError('AI returned malformed data. Please try again.', 500);
    }
    throw new AppError('AI service temporarily unavailable. Please try again.', 503);
  }

  if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

  const score = Math.min(100, Math.max(0, Number(analysisData.score) || 0));

  const saved = await ResumeAnalysis.create({
    userId:                 req.user.id,
    fileName:               req.file.originalname,
    score,
    strengths:              toStringArray(analysisData.strengths),
    missingKeywords:        toStringArray(analysisData.missingKeywords),
    improvementSuggestions: toStringArray(analysisData.improvementSuggestions),
    atsTips:                toStringArray(analysisData.atsTips),
    rawAnalysis:            analysisData.summary || '',
  });

  res.status(201).json({
    success: true,
    message: 'Resume analyzed successfully',
    data: {
      id:                     saved._id,
      score:                  saved.score,
      summary:                analysisData.summary || '',
      strengths:              saved.strengths,
      missingKeywords:        saved.missingKeywords,
      improvementSuggestions: saved.improvementSuggestions,
      atsTips:                saved.atsTips,
    },
  });
});

// @desc    Get resume analysis history
// @route   GET /api/ai/resume/history
// @access  Private
const getResumeHistory = asyncHandler(async (req, res) => {
  const analyses = await ResumeAnalysis.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('fileName score createdAt');

  res.json({ success: true, count: analyses.length, data: analyses });
});

module.exports = {
  generateInterview,
  getInterviewHistory,
  getInterviewSession,
  deleteInterviewSession,
  analyzeResume,
  getResumeHistory,
};