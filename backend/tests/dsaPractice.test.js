const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  },
}));

const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock('../models/DsaPracticeState', () => ({
  __esModule: true,
  default: {
    findOne: (...args) => mockFindOne(...args),
    create: (...args) => mockCreate(...args),
  },
}));

jest.mock('../models/DsaSubmission', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock('../models/DsaProgress', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
  },
}));

const router = require('../routes/dsaRoutes');

const app = express();
app.use(express.json());
app.use('/api/dsa', router);

describe('DSA practice routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      userId: 'user-1',
      currentLanguage: 'python',
      solvedQuestions: [],
      bookmarks: [],
      topicProgress: [],
    });
  });

  it('creates a default practice state for the authenticated user', async () => {
    const res = await request(app).get('/api/dsa/practice/state').set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentLanguage).toBe('python');
  });
});
