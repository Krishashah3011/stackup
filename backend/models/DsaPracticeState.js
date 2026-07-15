const mongoose = require('mongoose');

const dsaPracticeStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    solvedQuestions: {
      type: [String],
      default: [],
    },
    submittedCode: {
      type: Map,
      of: String,
      default: {},
    },
    currentLanguage: {
      type: String,
      default: 'python',
    },
    bookmarks: {
      type: [String],
      default: [],
    },
    topicProgress: {
      type: [
        {
          topic: String,
          solvedCount: Number,
          totalCount: Number,
          completion: Number,
        },
      ],
      default: [],
    },
    completion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DsaPracticeState', dsaPracticeStateSchema);
