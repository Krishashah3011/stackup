/**
 * Aptitude Tracker Integration Tests
 * Run: npm test
 */

const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET  = process.env.JWT_SECRET  || 'test_secret_key';
process.env.JWT_EXPIRE  = process.env.JWT_EXPIRE  || '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test';

const errorHandler = require('../middleware/errorHandler');

// ── Mock User ─────────────────────────────────────────────────────────────────
jest.mock('../models/User', () => {
  function MockUser(data) {
    this._id = 'user-001';
    this.name = data.name || 'Test';
    this.email = data.email || 't@t.com';
    this.createdAt = new Date();
  }
  Object.defineProperty(MockUser.prototype, 'id', {
    get() { return String(this._id); },
    enumerable: true,
  });
  MockUser.findById = jest.fn((id) => ({
    select() { return this; },
    then(resolve) { return Promise.resolve(new MockUser({})).then(resolve); },
  }));
  return MockUser;
});

// ── Mock AptitudeProgress ─────────────────────────────────────────────────────
jest.mock('../models/AptitudeProgress', () => {
  const records = new Map();
  let nextId = 1;

  function MockRecord(data) {
    this._id             = `apt-${nextId++}`;
    this.userId          = data.userId || 'user-001';
    this.category        = data.category;
    this.completedTopics = data.completedTopics || 0;
    this.totalTopics     = data.totalTopics || 10;
    this.score           = data.score    || 0;
    this.accuracy        = data.accuracy || 0;
    this.createdAt       = new Date();
    this.updatedAt       = new Date();
  }

  Object.defineProperty(MockRecord.prototype, 'id', {
    get() { return String(this._id); },
    enumerable: true,
  });

  MockRecord.prototype.save = async function () {
    this.updatedAt = new Date();
    records.set(this._id, this);
    return this;
  };

  MockRecord.prototype.deleteOne = async function () {
    records.delete(this._id);
  };

  MockRecord.create = async function (data) {
    const rec = new MockRecord(data);
    records.set(rec._id, rec);
    return rec;
  };

  MockRecord.find = jest.fn((query = {}) => ({
    sort() { return this; },
    then(resolve) {
      const results = [...records.values()].filter((r) => {
        if (query.userId && r.userId !== String(query.userId)) return false;
        return true;
      });
      return Promise.resolve(results).then(resolve);
    },
  }));

  MockRecord.findOne = jest.fn((query = {}) => ({
    then(resolve) {
      const result = [...records.values()].find((r) => {
        if (query.userId && r.userId !== String(query.userId)) return false;
        if (query.category && r.category !== query.category) return false;
        return true;
      }) || null;
      return Promise.resolve(result).then(resolve);
    },
  }));

  MockRecord.findById = jest.fn((id) => ({
    then(resolve) {
      return Promise.resolve(records.get(String(id)) || null).then(resolve);
    },
  }));

  MockRecord.__clear = () => { records.clear(); nextId = 1; };

  return MockRecord;
});

// ── Build test app ─────────────────────────────────────────────────────────────
const buildApp = () => {
  const app = express();
  app.use(express.json());
  const generateToken = require('../utils/generateToken');
  app._testToken = generateToken('user-001');
  app.use('/api/aptitude', require('../routes/aptitudeRoutes'));
  app.use(errorHandler);
  return app;
};

const auth = (app) => ({ Authorization: `Bearer ${app._testToken}` });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Aptitude Tracker API', () => {
  let app;
  const AptitudeProgress = require('../models/AptitudeProgress');

  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { AptitudeProgress.__clear(); });

  // ── POST /api/aptitude ────────────────────────────────────────────────────
  describe('POST /api/aptitude', () => {
    it('creates a category and returns 201', async () => {
      const res = await request(app)
        .post('/api/aptitude')
        .set(auth(app))
        .send({ category: 'Quantitative Aptitude', score: 70, accuracy: 65, totalTopics: 10, completedTopics: 4 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Quantitative Aptitude');
      expect(res.body.data.score).toBe(70);
      expect(res.body.data.accuracy).toBe(65);
    });

    it('returns 409 when category already exists', async () => {
      await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Logical Reasoning', score: 60 });

      const res = await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Logical Reasoning', score: 70 });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 for invalid category', async () => {
      const res = await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Fake Category', score: 50 });

      expect(res.status).toBe(400);
    });

    it('rejects score above 100 with 400', async () => {
      const res = await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Verbal Ability', score: 150, accuracy: 80 });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/aptitude')
        .send({ category: 'Data Interpretation' });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/aptitude ─────────────────────────────────────────────────────
  describe('GET /api/aptitude', () => {
    beforeEach(async () => {
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Quantitative Aptitude', score: 75 });
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Logical Reasoning',     score: 60 });
    });

    it('returns all categories', async () => {
      const res = await request(app).get('/api/aptitude').set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ── GET /api/aptitude/summary ─────────────────────────────────────────────
  describe('GET /api/aptitude/summary', () => {
    it('returns zero summary when empty', async () => {
      const res = await request(app).get('/api/aptitude/summary').set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.data.avgScore).toBe(0);
      expect(res.body.data.categoriesTracked).toBe(0);
      expect(res.body.data.untrackedCategories.length).toBe(4);
    });

    it('calculates correct avg score and accuracy', async () => {
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Quantitative Aptitude', score: 80, accuracy: 70 });
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Logical Reasoning',     score: 60, accuracy: 90 });

      const res = await request(app).get('/api/aptitude/summary').set(auth(app));
      expect(res.body.data.avgScore).toBe(70);    // (80+60)/2
      expect(res.body.data.avgAccuracy).toBe(80); // (70+90)/2
    });

    it('identifies best and weakest categories', async () => {
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Quantitative Aptitude', score: 90, accuracy: 80 });
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Verbal Ability',        score: 40, accuracy: 50 });

      const res = await request(app).get('/api/aptitude/summary').set(auth(app));
      expect(res.body.data.bestCategory.category).toBe('Quantitative Aptitude');
      expect(res.body.data.weakestCategory.category).toBe('Verbal Ability');
    });

    it('lists untracked categories', async () => {
      await request(app).post('/api/aptitude').set(auth(app)).send({ category: 'Quantitative Aptitude', score: 60 });

      const res = await request(app).get('/api/aptitude/summary').set(auth(app));
      expect(res.body.data.untrackedCategories).not.toContain('Quantitative Aptitude');
      expect(res.body.data.untrackedCategories.length).toBe(3);
    });

    it('correctly counts total topics completed', async () => {
      await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Quantitative Aptitude', completedTopics: 6, totalTopics: 10, score: 70 });
      await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Logical Reasoning', completedTopics: 4, totalTopics: 8, score: 60 });

      const res = await request(app).get('/api/aptitude/summary').set(auth(app));
      expect(res.body.data.totalTopicsCompleted).toBe(10);
      expect(res.body.data.totalTopicsAvail).toBe(18);
    });
  });

  // ── PUT /api/aptitude/:id ─────────────────────────────────────────────────
  describe('PUT /api/aptitude/:id', () => {
    let recId;

    beforeEach(async () => {
      const res = await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Data Interpretation', score: 55, accuracy: 60 });
      recId = res.body.data._id;
    });

    it('updates score and accuracy', async () => {
      const res = await request(app).put(`/api/aptitude/${recId}`).set(auth(app))
        .send({ score: 75, accuracy: 80 });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(75);
      expect(res.body.data.accuracy).toBe(80);
    });

    it('rejects accuracy above 100 with 400', async () => {
      const res = await request(app).put(`/api/aptitude/${recId}`).set(auth(app))
        .send({ accuracy: 150 });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent record', async () => {
      const res = await request(app).put('/api/aptitude/nonexistent').set(auth(app))
        .send({ score: 70 });
      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/aptitude/:id/session ──────────────────────────────────────
  describe('PATCH /api/aptitude/:id/session', () => {
    let recId;
    let initialScore;
    let initialAccuracy;

    beforeEach(async () => {
      const res = await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Verbal Ability', score: 60, accuracy: 70 });
      recId           = res.body.data._id;
      initialScore    = res.body.data.score;
      initialAccuracy = res.body.data.accuracy;
    });

    it('applies rolling average to score and accuracy', async () => {
      const res = await request(app).patch(`/api/aptitude/${recId}/session`).set(auth(app))
        .send({ score: 90, accuracy: 90 });

      expect(res.status).toBe(200);
      // 60 * 0.7 + 90 * 0.3 = 42 + 27 = 69
      expect(res.body.data.score).toBe(69);
      // 70 * 0.7 + 90 * 0.3 = 49 + 27 = 76
      expect(res.body.data.accuracy).toBe(76);
    });

    it('increments completedTopics by topicsCompleted', async () => {
      const res = await request(app).patch(`/api/aptitude/${recId}/session`).set(auth(app))
        .send({ score: 70, accuracy: 75, topicsCompleted: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.completedTopics).toBe(2);
    });

    it('returns 400 when neither score nor accuracy is provided', async () => {
      const res = await request(app).patch(`/api/aptitude/${recId}/session`).set(auth(app))
        .send({ topicsCompleted: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent record', async () => {
      const res = await request(app).patch('/api/aptitude/fake-id/session').set(auth(app))
        .send({ score: 80 });
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/aptitude/bulk ───────────────────────────────────────────────
  describe('POST /api/aptitude/bulk', () => {
    it('creates multiple categories in one request', async () => {
      const res = await request(app).post('/api/aptitude/bulk').set(auth(app))
        .send({
          categories: [
            { category: 'Quantitative Aptitude', score: 70, accuracy: 65 },
            { category: 'Logical Reasoning',     score: 60, accuracy: 70 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(2);
    });

    it('skips already-existing categories', async () => {
      await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Verbal Ability', score: 50 });

      const res = await request(app).post('/api/aptitude/bulk').set(auth(app))
        .send({
          categories: [
            { category: 'Verbal Ability',        score: 60 }, // skip
            { category: 'Data Interpretation',   score: 55 }, // create
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(1);
      expect(res.body.skipped).toContain('Verbal Ability');
    });

    it('returns 400 for empty categories array', async () => {
      const res = await request(app).post('/api/aptitude/bulk').set(auth(app))
        .send({ categories: [] });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid category in bulk', async () => {
      const res = await request(app).post('/api/aptitude/bulk').set(auth(app))
        .send({ categories: [{ category: 'Made Up', score: 70 }] });
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/aptitude/:id ──────────────────────────────────────────────
  describe('DELETE /api/aptitude/:id', () => {
    let recId;

    beforeEach(async () => {
      const res = await request(app).post('/api/aptitude').set(auth(app))
        .send({ category: 'Logical Reasoning', score: 65 });
      recId = res.body.data._id;
    });

    it('deletes and returns 200', async () => {
      const res = await request(app).delete(`/api/aptitude/${recId}`).set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed/i);
    });

    it('returns 404 after deletion', async () => {
      await request(app).delete(`/api/aptitude/${recId}`).set(auth(app));
      const res = await request(app).delete(`/api/aptitude/${recId}`).set(auth(app));
      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).delete(`/api/aptitude/${recId}`);
      expect(res.status).toBe(401);
    });
  });
});