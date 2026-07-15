const mongoose = require('mongoose');

const dsaSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questionId: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    runtime: {
      type: Number,
      default: null,
    },
    memory: {
      type: Number,
      default: null,
    },
    passed: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DsaSubmission', dsaSubmissionSchema);
