/**
 * AI Module Integration Tests
 * Run: npm test
 *
 * Mocks Gemini API and DB models — no real AI calls or DB needed.
 */

const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET   = process.env.JWT_SECRET   || 'test_secret_key';
process.env.JWT_EXPIRE   = process.env.JWT_EXPIRE   || '7d';
process.env.MONGODB_URI  = process.env.MONGODB_URI  || 'mongodb://localhost/test';
process.env.GEMINI_API_KEY = 'fake-key-for-tests';

const errorHandler = require('../middleware/errorHandler');

// ── Mock User ─────────────────────────────────────────────────────────────────
jest.mock('../models/User', () => {
  function MockUser() {
    this._id = 'user-001'; this.name = 'Test'; this.email = 't@t.com'; this.createdAt = new Date();
  }
  Object.defineProperty(MockUser.prototype, 'id', { get() { return String(this._id); }, enumerable: true });
  MockUser.findById = jest.fn(() => ({
    select() { return this; },
    then(resolve) { return Promise.resolve(new MockUser()).then(resolve); },
  }));
  return MockUser;
});

// ── Mock InterviewGeneration ──────────────────────────────────────────────────
jest.mock('../models/InterviewGeneration', () => {
  const sessions = new Map();
  let nextId = 1;

  function MockSession(data) {
    this._id                  = `int-${nextId++}`;
    this.userId               = data.userId || 'user-001';
    this.company              = data.company;
    this.role                 = data.role;
    this.skills               = data.skills || [];
    this.difficulty           = data.difficulty || 'Mixed';
    this.overview             = data.overview || '';
    this.tips                 = data.tips || [];
    this.hrQuestions          = data.hrQuestions || [];
    this.technicalQuestions   = data.technicalQuestions || [];
    this.projectQuestions     = data.projectQuestions || [];
    this.systemDesignQuestions = data.systemDesignQuestions || [];
    this.createdAt            = new Date();
    this.updatedAt            = new Date();
  }
  Object.defineProperty(MockSession.prototype, 'id', { get() { return String(this._id); }, enumerable: true });
  MockSession.prototype.deleteOne = async function () { sessions.delete(this._id); };

  MockSession.create = async function (data) {
    const s = new MockSession(data); sessions.set(s._id, s); return s;
  };

  const makeChain = (fn) => {
    let _sort = null, _skip = 0, _limit = Infinity, _select = null;
    const ch = {
      sort(s)   { _sort = s; return ch; },
      skip(n)   { _skip = n; return ch; },
      limit(n)  { _limit = n; return ch; },
      select(f) { _select = f; return ch; },
      then(resolve) {
        let r = [...sessions.values()].filter(fn);
        if (_sort) { const [f, d] = Object.entries(_sort)[0]; r.sort((a,b) => d===1 ? a[f]-b[f] : b[f]-a[f]); }
        if (_skip) r = r.slice(_skip);
        if (_limit < Infinity) r = r.slice(0, _limit);
        return Promise.resolve(r).then(resolve);
      },
    };
    return ch;
  };

  MockSession.find = jest.fn((q = {}) => makeChain((s) => q.userId ? s.userId === String(q.userId) : true));
  MockSession.findById = jest.fn((id) => ({
    then(resolve) { return Promise.resolve(sessions.get(String(id)) || null).then(resolve); },
  }));
  MockSession.countDocuments = jest.fn(async (q = {}) =>
    [...sessions.values()].filter((s) => q.userId ? s.userId === String(q.userId) : true).length
  );
  MockSession.__clear = () => { sessions.clear(); nextId = 1; };
  return MockSession;
});

// ── Mock ResumeAnalysis ───────────────────────────────────────────────────────
jest.mock('../models/ResumeAnalysis', () => {
  const analyses = new Map();
  let nextId = 1;

  function MockAnalysis(data) {
    this._id                   = `res-${nextId++}`;
    this.userId                = data.userId || 'user-001';
    this.fileName              = data.fileName || 'resume.pdf';
    this.score                 = data.score || 0;
    this.strengths             = data.strengths || [];
    this.missingKeywords       = data.missingKeywords || [];
    this.improvementSuggestions = data.improvementSuggestions || [];
    this.atsTips               = data.atsTips || [];
    this.rawAnalysis           = data.rawAnalysis || '';
    this.createdAt             = new Date();
  }
  Object.defineProperty(MockAnalysis.prototype, 'id', { get() { return String(this._id); }, enumerable: true });

  MockAnalysis.create = async function (data) {
    const a = new MockAnalysis(data); analyses.set(a._id, a); return a;
  };
  MockAnalysis.find = jest.fn((q = {}) => ({
    sort()   { return this; },
    limit()  { return this; },
    select() { return this; },
    then(resolve) {
      const r = [...analyses.values()].filter((a) => q.userId ? a.userId === String(q.userId) : true);
      return Promise.resolve(r).then(resolve);
    },
  }));
  MockAnalysis.__clear = () => { analyses.clear(); nextId = 1; };
  return MockAnalysis;
});

// ── Mock Gemini ───────────────────────────────────────────────────────────────
jest.mock('../config/gemini', () => {
  const INTERVIEW_RESPONSE = JSON.stringify({
    overview: 'Google interviews are rigorous and multi-round.',
    tips: ['Practice LeetCode', 'Study system design', 'Prepare STAR stories'],
    hrQuestions: [
      'Tell me about yourself.',
      'Why do you want to work at Google?',
      'Describe a challenging project you worked on.',
      'How do you handle failure?',
      'Tell me about a time you disagreed with your manager.',
      'Where do you see yourself in 5 years?',
      'What is your greatest strength?',
      'Describe your ideal work environment.',
    ],
    technicalQuestions: [
      '[Easy] What is the difference between == and === in JavaScript?',
      '[Medium] Explain how React hooks work.',
      '[Medium] What is a closure in JavaScript?',
      '[Hard] How does garbage collection work in V8?',
      '[Medium] Explain REST vs GraphQL.',
      '[Easy] What is Big O notation?',
      '[Hard] Implement a LRU cache.',
      '[Medium] What is the virtual DOM?',
      '[Hard] Explain database indexing.',
      '[Medium] What are microservices?',
    ],
    projectQuestions: [
      'Describe the most complex project you have built.',
      'How did you handle a production incident?',
      'What was your biggest technical challenge?',
      'How did you improve the performance of an application?',
      'Tell me about a time you refactored legacy code.',
      'Describe your experience with testing.',
    ],
    systemDesignQuestions: [
      'Design a URL shortener like bit.ly.',
      'Design a distributed cache system.',
      'How would you design Twitter\'s timeline feature?',
      'Design a notification service for a large-scale app.',
    ],
  });

  return {
    getGeminiModel: () => ({
      generateContent: jest.fn(async () => ({
        response: { text: () => INTERVIEW_RESPONSE },
      })),
    }),
  };
});

// ── Build test app ─────────────────────────────────────────────────────────────
const buildApp = () => {
  const app = express();
  app.use(express.json());
  const generateToken = require('../utils/generateToken');
  app._testToken = generateToken('user-001');
  app.use('/api/ai', require('../routes/aiRoutes'));
  app.use(errorHandler);
  return app;
};

const auth = (app) => ({ Authorization: `Bearer ${app._testToken}` });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AI Interview API', () => {
  let app;
  const InterviewGeneration = require('../models/InterviewGeneration');

  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { InterviewGeneration.__clear(); });

  // ── POST /api/ai/interview ────────────────────────────────────────────────
  describe('POST /api/ai/interview', () => {
    it('generates questions and returns 201', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'Google', role: 'Software Engineer', skills: ['React', 'Node.js'], difficulty: 'Hard' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const d = res.body.data;
      expect(d.company).toBe('Google');
      expect(d.role).toBe('Software Engineer');
      expect(Array.isArray(d.hrQuestions)).toBe(true);
      expect(Array.isArray(d.technicalQuestions)).toBe(true);
      expect(Array.isArray(d.projectQuestions)).toBe(true);
      expect(Array.isArray(d.systemDesignQuestions)).toBe(true);
    });

    it('includes overview and tips in response', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'Amazon', role: 'SDE-2', difficulty: 'Mixed' });

      expect(res.body.data.overview).toBeTruthy();
      expect(Array.isArray(res.body.data.tips)).toBe(true);
      expect(res.body.data.tips.length).toBeGreaterThan(0);
    });

    it('returns correct question counts from Gemini mock', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'Microsoft', role: 'Frontend Dev', skills: ['React'] });

      expect(res.body.data.hrQuestions.length).toBe(8);
      expect(res.body.data.technicalQuestions.length).toBe(10);
      expect(res.body.data.projectQuestions.length).toBe(6);
      expect(res.body.data.systemDesignQuestions.length).toBe(4);
    });

    it('returns 400 when company is missing', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ role: 'Engineer' });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('company');
    });

    it('returns 400 when role is missing', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'Google' });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('role');
    });

    it('returns 400 for invalid difficulty', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'TCS', role: 'Dev', difficulty: 'Extreme' });
      expect(res.status).toBe(400);
    });

    it('saves skills array correctly', async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'Infosys', role: 'Dev', skills: ['Java', 'Spring Boot', 'SQL'] });

      expect(res.body.data.skills).toEqual(['Java', 'Spring Boot', 'SQL']);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/ai/interview')
        .send({ company: 'Google', role: 'SWE' });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/ai/interview/history ─────────────────────────────────────────
  describe('GET /api/ai/interview/history', () => {
    beforeEach(async () => {
      await request(app).post('/api/ai/interview').set(auth(app)).send({ company: 'Google',   role: 'SWE'     });
      await request(app).post('/api/ai/interview').set(auth(app)).send({ company: 'Amazon',   role: 'SDE-1'   });
      await request(app).post('/api/ai/interview').set(auth(app)).send({ company: 'Infosys',  role: 'Analyst' });
    });

    it('returns history list', async () => {
      const res = await request(app).get('/api/ai/interview/history').set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('returns total count', async () => {
      const res = await request(app).get('/api/ai/interview/history').set(auth(app));
      expect(res.body.total).toBe(3);
    });

    it('respects limit query param', async () => {
      const res = await request(app).get('/api/ai/interview/history?limit=2').set(auth(app));
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/ai/interview/history');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/ai/interview/:id ─────────────────────────────────────────────
  describe('GET /api/ai/interview/:id', () => {
    let sessionId;

    beforeEach(async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'Wipro', role: 'Dev', difficulty: 'Easy' });
      sessionId = res.body.data.id;
    });

    it('returns the session by ID', async () => {
      const res = await request(app).get(`/api/ai/interview/${sessionId}`).set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.data.company).toBe('Wipro');
    });

    it('returns 404 for non-existent session', async () => {
      const res = await request(app).get('/api/ai/interview/nonexistent-id').set(auth(app));
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/ai/interview/:id ──────────────────────────────────────────
  describe('DELETE /api/ai/interview/:id', () => {
    let sessionId;

    beforeEach(async () => {
      const res = await request(app).post('/api/ai/interview').set(auth(app))
        .send({ company: 'HCL', role: 'Analyst' });
      sessionId = res.body.data.id;
    });

    it('deletes the session', async () => {
      const res = await request(app).delete(`/api/ai/interview/${sessionId}`).set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 after deletion', async () => {
      await request(app).delete(`/api/ai/interview/${sessionId}`).set(auth(app));
      const res = await request(app).delete(`/api/ai/interview/${sessionId}`).set(auth(app));
      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).delete(`/api/ai/interview/${sessionId}`);
      expect(res.status).toBe(401);
    });
  });
});