/**
 * DSA Tracker Integration Tests
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

// ── Mock DsaProgress ──────────────────────────────────────────────────────────
jest.mock('../models/DsaProgress', () => {
  const records = new Map();
  let nextId = 1;

  function MockRecord(data) {
    this._id           = `dsa-${nextId++}`;
    this.userId        = data.userId || 'user-001';
    this.topic         = data.topic;
    this.totalProblems = data.totalProblems;
    this.solvedProblems = data.solvedProblems || 0;
    this.progress      = data.totalProblems > 0
      ? Math.round((Math.min(data.solvedProblems || 0, data.totalProblems) / data.totalProblems) * 100)
      : 0;
    this.createdAt     = new Date();
    this.updatedAt     = new Date();
  }

  Object.defineProperty(MockRecord.prototype, 'id', {
    get() { return String(this._id); },
    enumerable: true,
  });

  MockRecord.prototype.save = async function () {
    this.solvedProblems = Math.min(this.solvedProblems, this.totalProblems);
    this.progress = Math.round((this.solvedProblems / this.totalProblems) * 100);
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

  MockRecord.find = jest.fn((query = {}) => {
    const chain = {
      sort()   { return this; },
      then(resolve) {
        const results = [...records.values()].filter((r) => {
          if (query.userId && r.userId !== String(query.userId)) return false;
          return true;
        });
        return Promise.resolve(results).then(resolve);
      },
    };
    return chain;
  });

  MockRecord.findOne = jest.fn((query = {}) => ({
    then(resolve) {
      const result = [...records.values()].find((r) => {
        if (query.userId && r.userId !== String(query.userId)) return false;
        if (query.topic && r.topic !== query.topic) return false;
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
  app.use('/api/dsa', require('../routes/dsaRoutes'));
  app.use(errorHandler);
  return app;
};

const auth = (app) => ({ Authorization: `Bearer ${app._testToken}` });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('DSA Tracker API', () => {
  let app;
  const DsaProgress = require('../models/DsaProgress');

  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { DsaProgress.__clear(); });

  // ── POST /api/dsa ─────────────────────────────────────────────────────────
  describe('POST /api/dsa', () => {
    it('creates a DSA topic and returns 201', async () => {
      const res = await request(app)
        .post('/api/dsa')
        .set(auth(app))
        .send({ topic: 'Arrays', totalProblems: 50, solvedProblems: 10 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topic).toBe('Arrays');
      expect(res.body.data.totalProblems).toBe(50);
      expect(res.body.data.solvedProblems).toBe(10);
      expect(res.body.data.progress).toBe(20);
    });

    it('auto-calculates progress = 100 when solved equals total', async () => {
      const res = await request(app)
        .post('/api/dsa')
        .set(auth(app))
        .send({ topic: 'Strings', totalProblems: 30, solvedProblems: 30 });

      expect(res.body.data.progress).toBe(100);
    });

    it('returns 409 when topic already exists', async () => {
      await request(app).post('/api/dsa').set(auth(app))
        .send({ topic: 'Arrays', totalProblems: 50, solvedProblems: 0 });
      const res = await request(app).post('/api/dsa').set(auth(app))
        .send({ topic: 'Arrays', totalProblems: 50, solvedProblems: 0 });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 for invalid topic', async () => {
      const res = await request(app)
        .post('/api/dsa')
        .set(auth(app))
        .send({ topic: 'Blockchain', totalProblems: 50 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when totalProblems is 0', async () => {
      const res = await request(app)
        .post('/api/dsa')
        .set(auth(app))
        .send({ topic: 'Trees', totalProblems: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/dsa')
        .send({ topic: 'Arrays', totalProblems: 50 });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/dsa ─────────────────────────────────────────────────────────
  describe('GET /api/dsa', () => {
    beforeEach(async () => {
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Arrays', totalProblems: 50, solvedProblems: 25 });
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Strings', totalProblems: 30, solvedProblems: 30 });
    });

    it('returns all DSA records', async () => {
      const res = await request(app).get('/api/dsa').set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/dsa');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/dsa/summary ─────────────────────────────────────────────────
  describe('GET /api/dsa/summary', () => {
    it('returns zero summary when no records', async () => {
      const res = await request(app).get('/api/dsa/summary').set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.data.overallProgress).toBe(0);
      expect(res.body.data.totalSolved).toBe(0);
      expect(res.body.data.topicsTracked).toBe(0);
    });

    it('calculates correct overall progress', async () => {
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Arrays', totalProblems: 100, solvedProblems: 50 });
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Strings', totalProblems: 100, solvedProblems: 100 });

      const res = await request(app).get('/api/dsa/summary').set(auth(app));
      expect(res.body.data.overallProgress).toBe(75); // (50+100)/2
      expect(res.body.data.totalSolved).toBe(150);
      expect(res.body.data.topicsTracked).toBe(2);
    });

    it('correctly identifies best and weakest topics', async () => {
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Arrays', totalProblems: 100, solvedProblems: 80 });
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Graphs', totalProblems: 100, solvedProblems: 20 });

      const res = await request(app).get('/api/dsa/summary').set(auth(app));
      expect(res.body.data.bestTopic.topic).toBe('Arrays');
      expect(res.body.data.weakestTopic.topic).toBe('Graphs');
    });

    it('lists untracked topics', async () => {
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Arrays', totalProblems: 50, solvedProblems: 10 });
      const res = await request(app).get('/api/dsa/summary').set(auth(app));
      expect(Array.isArray(res.body.data.untrackedTopics)).toBe(true);
      expect(res.body.data.untrackedTopics).not.toContain('Arrays');
      expect(res.body.data.untrackedTopics.length).toBe(7);
    });

    it('counts completed topics (progress = 100)', async () => {
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Arrays', totalProblems: 10, solvedProblems: 10 });
      await request(app).post('/api/dsa').set(auth(app)).send({ topic: 'Strings', totalProblems: 10, solvedProblems: 5 });

      const res = await request(app).get('/api/dsa/summary').set(auth(app));
      expect(res.body.data.completedTopics).toBe(1);
    });
  });

  // ── PUT /api/dsa/:id ─────────────────────────────────────────────────────
  describe('PUT /api/dsa/:id', () => {
    let recordId;

    beforeEach(async () => {
      const res = await request(app).post('/api/dsa').set(auth(app))
        .send({ topic: 'Trees', totalProblems: 40, solvedProblems: 10 });
      recordId = res.body.data._id;
    });

    it('updates solved count and recalculates progress', async () => {
      const res = await request(app)
        .put(`/api/dsa/${recordId}`)
        .set(auth(app))
        .send({ solvedProblems: 20 });

      expect(res.status).toBe(200);
      expect(res.body.data.solvedProblems).toBe(20);
      expect(res.body.data.progress).toBe(50);
    });

    it('clamps solvedProblems to totalProblems', async () => {
      const res = await request(app)
        .put(`/api/dsa/${recordId}`)
        .set(auth(app))
        .send({ solvedProblems: 999 });

      expect(res.status).toBe(200);
      expect(res.body.data.solvedProblems).toBe(40); // clamped to total
      expect(res.body.data.progress).toBe(100);
    });

    it('returns 404 for non-existent record', async () => {
      const res = await request(app)
        .put('/api/dsa/nonexistent-id')
        .set(auth(app))
        .send({ solvedProblems: 5 });

      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/dsa/:id/increment ─────────────────────────────────────────
  describe('PATCH /api/dsa/:id/increment', () => {
    let recordId;

    beforeEach(async () => {
      const res = await request(app).post('/api/dsa').set(auth(app))
        .send({ topic: 'Hashing', totalProblems: 20, solvedProblems: 10 });
      recordId = res.body.data._id;
    });

    it('increments solved by 1', async () => {
      const res = await request(app)
        .patch(`/api/dsa/${recordId}/increment`)
        .set(auth(app));

      expect(res.status).toBe(200);
      expect(res.body.data.solvedProblems).toBe(11);
    });

    it('returns 400 when all problems already solved', async () => {
      // First solve all
      await request(app).put(`/api/dsa/${recordId}`).set(auth(app)).send({ solvedProblems: 20 });
      const res = await request(app).patch(`/api/dsa/${recordId}/increment`).set(auth(app));

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already solved/i);
    });
  });

  // ── POST /api/dsa/bulk ────────────────────────────────────────────────────
  describe('POST /api/dsa/bulk', () => {
    it('creates multiple topics in one request', async () => {
      const res = await request(app)
        .post('/api/dsa/bulk')
        .set(auth(app))
        .send({
          topics: [
            { topic: 'Arrays',  totalProblems: 50, solvedProblems: 10 },
            { topic: 'Strings', totalProblems: 30, solvedProblems: 0  },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(2);
    });

    it('skips already-existing topics in bulk add', async () => {
      await request(app).post('/api/dsa').set(auth(app))
        .send({ topic: 'Arrays', totalProblems: 50, solvedProblems: 0 });

      const res = await request(app)
        .post('/api/dsa/bulk')
        .set(auth(app))
        .send({
          topics: [
            { topic: 'Arrays',  totalProblems: 50 },  // already exists
            { topic: 'Strings', totalProblems: 30 },  // new
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(1);          // only Strings created
      expect(res.body.skipped).toContain('Arrays');
    });

    it('returns 400 for empty topics array', async () => {
      const res = await request(app)
        .post('/api/dsa/bulk')
        .set(auth(app))
        .send({ topics: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid topic in bulk', async () => {
      const res = await request(app)
        .post('/api/dsa/bulk')
        .set(auth(app))
        .send({ topics: [{ topic: 'InvalidTopic', totalProblems: 10 }] });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/dsa/:id ───────────────────────────────────────────────────
  describe('DELETE /api/dsa/:id', () => {
    let recordId;

    beforeEach(async () => {
      const res = await request(app).post('/api/dsa').set(auth(app))
        .send({ topic: 'Dynamic Programming', totalProblems: 60, solvedProblems: 15 });
      recordId = res.body.data._id;
    });

    it('deletes the record and returns 200', async () => {
      const res = await request(app).delete(`/api/dsa/${recordId}`).set(auth(app));
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed/i);
    });

    it('returns 404 after deletion', async () => {
      await request(app).delete(`/api/dsa/${recordId}`).set(auth(app));
      const res = await request(app).delete(`/api/dsa/${recordId}`).set(auth(app));
      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).delete(`/api/dsa/${recordId}`);
      expect(res.status).toBe(401);
    });
  });
});
