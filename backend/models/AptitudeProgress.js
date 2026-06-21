const mongoose = require('mongoose');

const aptitudeProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Quantitative Aptitude',
        'Logical Reasoning',
        'Verbal Ability',
        'Data Interpretation',
      ],
    },
    completedTopics: {
      type: Number,
      default: 0,
      min: [0, 'Completed topics cannot be negative'],
    },
    totalTopics: {
      type: Number,
      default: 10,
      min: [1, 'Total topics must be at least 1'],
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

aptitudeProgressSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('AptitudeProgress', aptitudeProgressSchema);
