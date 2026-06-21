const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getGeminiModel } = require('../config/gemini');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const InterviewGeneration = require('../models/InterviewGeneration');
const fs = require('fs');

// @desc    Analyze resume PDF
// @route   POST /api/ai/resume-analyze
// @access  Private
const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a PDF resume', 400);

  let pdfText = '';
  try {
    const pdfParse = require('pdf-parse');
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    pdfText = pdfData.text;
  } catch (err) {
    // Clean up file on error
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new AppError('Failed to extract text from PDF. Ensure the PDF is not scanned/image-based.', 422);
  }

  if (!pdfText.trim()) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new AppError('Could not extract text from this PDF. It may be a scanned document.', 422);
  }

  const model = getGeminiModel();
  const prompt = `You are an expert ATS resume analyzer and career coach. Analyze the following resume text and respond ONLY with valid JSON (no markdown, no explanation outside JSON).

Resume Text:
${pdfText.substring(0, 8000)}

Respond with this exact JSON structure:
{
  "score": <number 0-100>,
  "strengths": [<list of 3-5 strong points>],
  "missingKeywords": [<list of important missing technical/soft skill keywords>],
  "improvementSuggestions": [<list of 4-6 actionable improvement suggestions>],
  "atsTips": [<list of 3-5 ATS optimization tips>]
}`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  let analysisData;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    analysisData = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError('AI returned an unexpected response. Please try again.', 500);
  }

  // Clean up uploaded file
  if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

  const saved = await ResumeAnalysis.create({
    userId: req.user.id,
    fileName: req.file.originalname,
    score: analysisData.score,
    missingKeywords: analysisData.missingKeywords || [],
    improvementSuggestions: analysisData.improvementSuggestions || [],
    atsTips: analysisData.atsTips || [],
    strengths: analysisData.strengths || [],
    rawAnalysis: rawText,
  });

  res.json({
    success: true,
    message: 'Resume analyzed successfully',
    data: {
      id: saved._id,
      score: saved.score,
      strengths: saved.strengths,
      missingKeywords: saved.missingKeywords,
      improvementSuggestions: saved.improvementSuggestions,
      atsTips: saved.atsTips,
    },
  });
});

// @desc    Generate interview questions
// @route   POST /api/ai/interview
// @access  Private
const generateInterview = asyncHandler(async (req, res) => {
  const { company, role, skills } = req.body;

  if (!company || !role) throw new AppError('Company and role are required', 400);

  const skillsText = Array.isArray(skills) ? skills.join(', ') : skills || 'General';
  const model = getGeminiModel();

  const prompt = `You are an expert technical interviewer. Generate a comprehensive set of interview questions for:
Company: ${company}
Role: ${role}
Skills/Technologies: ${skillsText}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "hrQuestions": [<8-10 HR behavioral questions relevant to ${company} culture>],
  "technicalQuestions": [<10-12 technical questions based on ${role} and skills: ${skillsText}>],
  "projectQuestions": [<5-7 project-based questions to assess practical experience>]
}`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  let questionsData;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    questionsData = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError('AI returned an unexpected response. Please try again.', 500);
  }

  const saved = await InterviewGeneration.create({
    userId: req.user.id,
    company,
    role,
    skills: Array.isArray(skills) ? skills : [skills],
    hrQuestions: questionsData.hrQuestions || [],
    technicalQuestions: questionsData.technicalQuestions || [],
    projectQuestions: questionsData.projectQuestions || [],
  });

  res.json({
    success: true,
    message: 'Interview questions generated successfully',
    data: {
      id: saved._id,
      company: saved.company,
      role: saved.role,
      skills: saved.skills,
      hrQuestions: saved.hrQuestions,
      technicalQuestions: saved.technicalQuestions,
      projectQuestions: saved.projectQuestions,
    },
  });
});

module.exports = { analyzeResume, generateInterview };