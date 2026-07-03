const mongoose = require('mongoose');

const interviewGenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
    },
    company:    { type: String, required: true, trim: true },
    role:       { type: String, required: true, trim: true },
    skills:     [String],
    difficulty: {
      type:    String,
      enum:    ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Mixed',
    },
    overview:              { type: String, default: '' },
    tips:                  [String],
    hrQuestions:           [String],
    technicalQuestions:    [String],
    projectQuestions:      [String],
    systemDesignQuestions: [String],
  },
  { timestamps: true }
);

// Index for fast user history queries
interviewGenerationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewGeneration', interviewGenerationSchema);