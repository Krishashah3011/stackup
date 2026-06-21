const mongoose = require('mongoose');

const interviewGenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    skills: [String],
    hrQuestions: [String],
    technicalQuestions: [String],
    projectQuestions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewGeneration', interviewGenerationSchema);
