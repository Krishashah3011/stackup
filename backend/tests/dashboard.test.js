/**
 * Dashboard Integration Tests
 * Run: npm test
 *
 * Mocks User, Application, DsaProgress, AptitudeProgress, ResumeAnalysis.
 * No real DB connection required.
 */

const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET  = process.env.JWT_SECRET  || 'test_secret_key';
process.env.JWT_EXPIRE  = process.env.JWT_EXPIRE  || '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test';

const errorHandler = require('../middleware/errorHandler');

// ── Mock User (for auth middleware) ───────────────────────────────────────────
jest.mock('../models/User', () => {
  function MockUser(data) {
    this._id  = 'user-001';
    this.name = data.name || 'Test User';
    this.email = data.email || 'test@example.com';
    this.createdAt = new Date();
  }
  Object.defineProperty(MockUser.prototype, 'id', {
    get() { return String(this._id); },
    enumerable: true,
  });
  MockUser.findById = jest.fn((id) => ({
    select() { return this; },
    then(resolve) {
      return Promise.resolve(new MockUser({})).then(resolve);
    },
  }));
  return MockUser;
});

// ── Mock Application ──────────────────────────────────────────────────────────
jest.mock('../models/Application', () => {
  let _apps = [];

  const makeChain = (filterFn) => {
    let _sortFn = null, _limit = Infinity;
    const chain = {
      sort(s) {
        const [field, dir] = Object.entries(s)[0];
        _sortFn = (a, b) => dir === -1
          ? (new Date(b[field]) - new Date(a[field]))
          : (new Date(a[field]) - new Date(b[field]));
        return chain;
      },
      limit(n) { _limit = n; return chain; },
      select()  { return chain; },
      then(resolve) {
        let results = _apps.filter(filterFn);
        if (_sortFn) results.sort(_sortFn);
        if (_limit < Infinity) results = results.slice(0, _limit);
        return Promise.resolve(results).then(resolve);
      },
    };
    return chain;
  };

  const MockApp = {
    find: jest.fn((q = {}) => makeChain((app) => {
      if (q.userId && app.userId !== String(q.userId)) return false;
      return true;
    })),
    findOne: jest.fn((q = {}) => ({
      sort() { return this; },
      limit() { return this; },
      select() { return this; },
      then(resolve) {
        const results = _apps.filter((a) => q.userId ? a.userId === String(q.userId) : true);
        return Promise.resolve(results[0] || null).then(resolve);
      },
    })),
    __setApps: (apps) => { _apps = apps; },
    __clear:   ()     => { _apps = []; },
  };
  return MockApp;
});

// ── Mock DsaProgress ──────────────────────────────────────────────────────────
jest.mock('../models/DsaProgress', () => {
  let _records = [];
  const makeChain = () => ({
    sort()   { return this; },
    then(resolve) { return Promise.resolve(_records).then(resolve); },
  });
  return {
    find:      jest.fn(() => makeChain()),
    __set:     (r) => { _records = r; },
    __clear:   ()  => { _records = []; },
  };
});

// ── Mock AptitudeProgress ─────────────────────────────────────────────────────
jest.mock('../models/AptitudeProgress', () => {
  let _records = [];
  const makeChain = () => ({
    sort()   { return this; },
    then(resolve) { return Promise.resolve(_records).then(resolve); },
  });
  return {
    find:    jest.fn(() => makeChain()),
    __set:   (r) => { _records = r; },
    __clear: ()  => { _records = []; },
  };
});

// ── Mock ResumeAnalysis ───────────────────────────────────────────────────────
jest.mock('../models/ResumeAnalysis', () => {
  let _records = [];
  return {
    findOne: jest.fn(() => ({
      sort()   { return this; },
      then(resolve) {
        return Promise.resolve(_records[0] || null).then(resolve);
      },
    })),
    find: jest.fn(() => ({
      sort()   { return this; },
      limit()  { return this; },
      select() { return this; },
      then(resolve) { return Promise.resolve(_records).then(resolve); },
    })),
    __set:   (r) => { _records = r; },
    __clear: ()  => { _records = []; },
  };
});

// ── Build test app ─────────────────────────────────────────────────────────────
const buildApp = () => {
  const app = express();
  app.use(express.json());

  const generateToken = require('../utils/generateToken');
  app._testToken = generateToken('user-001');

  app.use('/api/dashboard', require('../routes/dashboardRoutes'));
  app.use(errorHandler);
  return app;
};

const auth = (app) => ({ Authorization: `Bearer ${app._testToken}` });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Dashboard API', () => {
  let app;
  const Application      = require('../models/Application');
  const DsaProgress      = require('../models/DsaProgress');
  const AptitudeProgress = require('../models/AptitudeProgress');
  const ResumeAnalysis   = require('../models/ResumeAnalysis');

  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    Application.__clear();
    DsaProgress.__clear();
    AptitudeProgress.__clear();
    ResumeAnalysis.__clear();
  });

  // ── GET /api/dashboard ────────────────────────────────────────────────────
  describe('GET /api/dashboard', () => {

    it('returns 200 with correct shape on an empty account', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const d = res.body.data;
      expect(d).toHaveProperty('readinessScore');
      expect(d).toHaveProperty('applications');
      expect(d).toHaveProperty('dsa');
      expect(d).toHaveProperty('aptitude');
      expect(d).toHaveProperty('resume');
      expect(d).toHaveProperty('recentApplications');
      expect(d).toHaveProperty('suggestions');
    });

    it('returns 0 readiness when no data exists', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.readinessScore).toBe(0);
    });

    it('returns correct application counts', async () => {
      Application.__setApps([
        { userId: 'user-001', status: 'Applied',   company: 'A', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
        { userId: 'user-001', status: 'Selected',  company: 'B', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
        { userId: 'user-001', status: 'Rejected',  company: 'C', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
        { userId: 'user-001', status: 'Rejected',  company: 'D', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      const apps = res.body.data.applications;

      expect(apps.total).toBe(4);
      expect(apps['Applied']).toBe(1);
      expect(apps['Selected']).toBe(1);
      expect(apps['Rejected']).toBe(2);
    });

    it('calculates conversionRate correctly', async () => {
      Application.__setApps([
        { userId: 'user-001', status: 'Selected', company: 'A', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
        { userId: 'user-001', status: 'Selected', company: 'B', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
        { userId: 'user-001', status: 'Rejected', company: 'C', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      // 2 selected, 1 rejected → 66% (rounded)
      expect(res.body.data.applications.conversionRate).toBe(67);
    });

    it('returns null conversionRate with no decided applications', async () => {
      Application.__setApps([
        { userId: 'user-001', status: 'Applied', company: 'A', role: 'Dev', createdAt: new Date(), appliedDate: new Date() },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.applications.conversionRate).toBeNull();
    });

    it('returns correct DSA overall and totals', async () => {
      DsaProgress.__set([
        { _id: 'd1', topic: 'Arrays',  totalProblems: 50, solvedProblems: 25, progress: 50 },
        { _id: 'd2', topic: 'Strings', totalProblems: 30, solvedProblems: 30, progress: 100 },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      const dsa = res.body.data.dsa;

      expect(dsa.overall).toBe(75);        // (50+100)/2
      expect(dsa.totalSolved).toBe(55);    // 25+30
      expect(dsa.totalProblems).toBe(80);  // 50+30
      expect(dsa.topicsTracked).toBe(2);
    });

    it('returns correct aptitude overall', async () => {
      AptitudeProgress.__set([
        { _id: 'a1', category: 'Quantitative Aptitude', score: 80, accuracy: 75 },
        { _id: 'a2', category: 'Logical Reasoning',     score: 60, accuracy: 65 },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      const apt = res.body.data.aptitude;

      expect(apt.overall).toBe(70);       // (80+60)/2
      expect(apt.avgAccuracy).toBe(70);   // (75+65)/2
      expect(apt.categoriesTracked).toBe(2);
    });

    it('returns resume score from latest analysis', async () => {
      ResumeAnalysis.__set([
        { _id: 'r1', score: 82, fileName: 'resume.pdf', createdAt: new Date() },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.resume.score).toBe(82);
      expect(res.body.data.resume.history.length).toBe(1);
    });

    it('returns null resume score when no resume analyzed', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.resume.score).toBeNull();
    });

    it('includes weekly trend array with 8 entries', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));
      const trend = res.body.data.applications.weeklyTrend;
      expect(Array.isArray(trend)).toBe(true);
      expect(trend.length).toBe(8);
      trend.forEach((week) => {
        expect(week).toHaveProperty('label');
        expect(week).toHaveProperty('count');
        expect(typeof week.count).toBe('number');
      });
    });

    it('returns recentApplications capped at 6', async () => {
      const apps = Array.from({ length: 10 }, (_, i) => ({
        userId: 'user-001',
        status: 'Applied',
        company: `Company${i}`,
        role: 'Dev',
        createdAt: new Date(Date.now() - i * 86400000),
        appliedDate: new Date(),
      }));
      Application.__setApps(apps);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.recentApplications.length).toBeLessThanOrEqual(6);
    });

    it('suggests adding application when none exist', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));
      const suggestions = res.body.data.suggestions;
      const hasTrackerSuggestion = suggestions.some((s) => s.type === 'tracker');
      expect(hasTrackerSuggestion).toBe(true);
    });

    it('suggests DSA when no DSA progress exists', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));
      const hasDsaSuggestion = res.body.data.suggestions.some((s) => s.type === 'dsa');
      expect(hasDsaSuggestion).toBe(true);
    });

    it('computes positive readiness when all modules have data', async () => {
      Application.__setApps(
        Array.from({ length: 10 }, (_, i) => ({
          userId: 'user-001', status: 'Applied',
          company: `Co${i}`, role: 'Dev',
          createdAt: new Date(), appliedDate: new Date(),
        }))
      );
      DsaProgress.__set([
        { topic: 'Arrays', totalProblems: 50, solvedProblems: 40, progress: 80 },
      ]);
      AptitudeProgress.__set([
        { category: 'Quantitative Aptitude', score: 75, accuracy: 70 },
      ]);
      ResumeAnalysis.__set([
        { _id: 'r1', score: 80, fileName: 'cv.pdf', createdAt: new Date() },
      ]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.readinessScore).toBeGreaterThan(0);
      expect(res.body.data.readinessScore).toBeLessThanOrEqual(100);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/dashboard');
      expect(res.status).toBe(401);
    });
  });

  // ── Readiness score formula ────────────────────────────────────────────────
  describe('Readiness score computation', () => {
    it('scores 100 when all components are maxed', async () => {
      Application.__setApps(
        Array.from({ length: 10 }, (_, i) => ({
          userId: 'user-001', status: 'Applied',
          company: `Co${i}`, role: 'Dev',
          createdAt: new Date(), appliedDate: new Date(),
        }))
      );
      DsaProgress.__set([{ topic: 'Arrays', totalProblems: 10, solvedProblems: 10, progress: 100 }]);
      AptitudeProgress.__set([{ category: 'Quantitative Aptitude', score: 100, accuracy: 100 }]);
      ResumeAnalysis.__set([{ _id: 'r1', score: 100, fileName: 'cv.pdf', createdAt: new Date() }]);

      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.readinessScore).toBe(100);
    });

    it('scores 0 when completely empty', async () => {
      const res = await request(app).get('/api/dashboard').set(auth(app));
      expect(res.body.data.readinessScore).toBe(0);
    });

    it('is always between 0 and 100', async () => {
      // Partial data
      DsaProgress.__set([{ topic: 'Arrays', totalProblems: 50, solvedProblems: 10, progress: 20 }]);
      const res = await request(app).get('/api/dashboard').set(auth(app));
      const score = res.body.data.readinessScore;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});