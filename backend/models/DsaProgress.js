const mongoose = require('mongoose');

const dsaProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      enum: [
        'Arrays',
        'Strings',
        'Linked List',
        'Stack & Queue',
        'Hashing',
        'Trees',
        'Graphs',
        'Dynamic Programming',
      ],
    },
    totalProblems: {
      type: Number,
      required: [true, 'Total problems count is required'],
      min: [1, 'Total problems must be at least 1'],
    },
    solvedProblems: {
      type: Number,
      default: 0,
      min: [0, 'Solved problems cannot be negative'],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Auto-calculate progress before saving
dsaProgressSchema.pre('save', function (next) {
  if (this.totalProblems > 0) {
    this.solvedProblems = Math.min(this.solvedProblems, this.totalProblems);
    this.progress = Math.round((this.solvedProblems / this.totalProblems) * 100);
  }
  next();
});

dsaProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('DsaProgress', dsaProgressSchema);
