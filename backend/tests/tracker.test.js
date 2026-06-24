/**
 * Placement Tracker Integration Tests
 * Run: npm test
 *
 * Mocks both User and Application models.
 * No real DB connection required.
 */

const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET  = process.env.JWT_SECRET  || 'test_secret_key';
process.env.JWT_EXPIRE  = process.env.JWT_EXPIRE  || '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test';

const errorHandler = require('../middleware/errorHandler');

// ── Mock User (needed by auth middleware) ─────────────────────────────────────
jest.mock('../models/User', () => {
  const usersById = new Map();

  function MockUser(data) {
    this._id       = 'user-001';
    this.name      = data.name;
    this.email     = data.email;
    this.createdAt = new Date();
  }

  Object.defineProperty(MockUser.prototype, 'id', {
    get() { return String(this._id); },
    enumerable: true,
  });

  MockUser.findById = jest.fn((id) => ({
    select() { return this; },
    then(resolve) {
      const u = usersById.get(String(id)) ||
        new MockUser({ name: 'Test User', email: 't@t.com' });
      usersById.set('user-001', u);
      return Promise.resolve(u).then(resolve);
    },
  }));

  return MockUser;
});

// ── Mock Application model ────────────────────────────────────────────────────
jest.mock('../models/Application', () => {
  const mongoose = { Types: { ObjectId: { createFromHexString: (id) => id } } };

  const apps   = new Map();
  let   nextId = 1;

  function MockApp(data) {
    this._id         = `app-${nextId++}`;
    this.userId      = data.userId || 'user-001';
    this.company     = data.company;
    this.role        = data.role;
    this.package     = data.package || 'Not disclosed';
    this.status      = data.status  || 'Applied';
    this.appliedDate = data.appliedDate ? new Date(data.appliedDate) : new Date();
    this.notes       = data.notes   || '';
    this.createdAt   = new Date();
    this.updatedAt   = new Date();
  }

  Object.defineProperty(MockApp.prototype, 'id', {
    get() { return String(this._id); },
  });

  MockApp.prototype.deleteOne = async function () {
    apps.delete(this._id);
  };

  MockApp.create = async function (data) {
    const app = new MockApp(data);
    apps.set(app._id, app);
    return app;
  };

  // Chainable find builder
  const makeChain = (filterFn) => {
    let _sort = null, _skip = 0, _limit = Infinity, _select = null;
    const chain = {
      sort(s)   { _sort = s; return chain; },
      skip(n)   { _skip = n; return chain; },
      limit(n)  { _limit = n; return chain; },
      select(f) { _select = f; return chain; },
      then(resolve) {
        let results = [...apps.values()].filter(filterFn);
        if (_sort) {
          const [field, dir] = Object.entries(_sort)[0];
          results.sort((a, b) => {
            const av = a[field], bv = b[field];
            return dir === 1 ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
          });
        }
        if (_skip)  results = results.slice(_skip);
        if (_limit < Infinity) results = results.slice(0, _limit);
        return Promise.resolve(results).then(resolve);
      },
    };
    return chain;
  };

  MockApp.find = jest.fn((query = {}) => {
    const filterFn = (app) => {
      if (query.userId && app.userId !== String(query.userId)) return false;
      if (query.status && app.status !== query.status) return false;
      if (query.$or) {
        return query.$or.some((cond) => {
          const [field, matcher] = Object.entries(cond)[0];
          const pattern = matcher.$regex;
          return new RegExp(pattern, 'i').test(app[field] || '');
        });
      }
      return true;
    };
    return makeChain(filterFn);
  });

  MockApp.findById = jest.fn((id) => ({
    then(resolve) { return Promise.resolve(apps.get(String(id)) || null).then(resolve); },
  }));

  MockApp.findByIdAndUpdate = jest.fn(async (id, update, opts) => {
    const app = apps.get(String(id));
    if (!app) return null;
    const fields = update.$set || update;
    Object.assign(app, fields);
    app.updatedAt = new Date();
    return app;
  });

  MockApp.countDocuments = jest.fn(async (query = {}) => {
    return [...apps.values()].filter((app) => {
      if (query.userId && app.userId !== String(query.userId)) return false;
      return true;
    }).length;
  });

  MockApp.aggregate = jest.fn(async (pipeline) => {
    const statuses = {};
    [...apps.values()].forEach((app) => {
      statuses[app.status] = (statuses[app.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([_id, count]) => ({ _id, count }));
  });

  MockApp.__clear = () => { apps.clear(); nextId = 1; };

  return MockApp;
});

// ── Build test app ─────────────────────────────────────────────────────────────
const buildApp = () => {
  const app = express();
  app.use(express.json());

  // Inject a valid JWT for protected routes in tests
  const generateToken = require('../utils/generateToken');
  const TEST_TOKEN    = generateToken('user-001');
  app._testToken      = TEST_TOKEN;

  app.use('/api/applications', require('../routes/applicationRoutes'));
  app.use(errorHandler);
  return app;
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Placement Tracker API', () => {
  let app;
  let token;
  const Application = require('../models/Application');

  beforeAll(() => {
    app   = buildApp();
    token = app._testToken;
  });

  beforeEach(() => { Application.__clear(); });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // ── POST /api/applications ────────────────────────────────────────────────
  describe('POST /api/applications', () => {
    it('creates an application and returns 201', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ company: 'Google', role: 'SWE', package: '₹30 LPA', status: 'Applied' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company).toBe('Google');
      expect(res.body.data.role).toBe('SWE');
      expect(res.body.data.status).toBe('Applied');
    });

    it('returns 400 when company is missing', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ role: 'SWE' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('company');
    });

    it('returns 400 when role is missing', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ company: 'Infosys' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('role');
    });

    it('returns 400 for invalid status value', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ company: 'TCS', role: 'Dev', status: 'Ghosted' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({ company: 'X', role: 'Y' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/applications ─────────────────────────────────────────────────
  describe('GET /api/applications', () => {
    beforeEach(async () => {
      await request(app).post('/api/applications').set(auth())
        .send({ company: 'Google',   role: 'SWE',            status: 'Applied' });
      await request(app).post('/api/applications').set(auth())
        .send({ company: 'Amazon',   role: 'Backend Dev',    status: 'Selected' });
      await request(app).post('/api/applications').set(auth())
        .send({ company: 'Infosys',  role: 'System Engineer',status: 'Rejected' });
    });

    it('returns all applications for the user', async () => {
      const res = await request(app).get('/api/applications').set(auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/applications?status=Selected')
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].company).toBe('Amazon');
    });

    it('searches by company name', async () => {
      const res = await request(app)
        .get('/api/applications?search=google')
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].company).toBe('Google');
    });

    it('searches by role name', async () => {
      const res = await request(app)
        .get('/api/applications?search=backend')
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].role).toBe('Backend Dev');
    });

    it('returns empty array when no match', async () => {
      const res = await request(app)
        .get('/api/applications?search=Microsoft')
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/applications');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/applications/stats ───────────────────────────────────────────
  describe('GET /api/applications/stats', () => {
    beforeEach(async () => {
      await request(app).post('/api/applications').set(auth())
        .send({ company: 'A', role: 'Dev', status: 'Applied' });
      await request(app).post('/api/applications').set(auth())
        .send({ company: 'B', role: 'Dev', status: 'Selected' });
    });

    it('returns stats with counts per status', async () => {
      const res = await request(app).get('/api/applications/stats').set(auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.counts).toBeDefined();
      expect(res.body.data.counts.total).toBe(2);
      expect(res.body.data.counts['Applied']).toBe(1);
      expect(res.body.data.counts['Selected']).toBe(1);
    });

    it('returns recentActivity array', async () => {
      const res = await request(app).get('/api/applications/stats').set(auth());
      expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
    });
  });

  // ── GET /api/applications/:id ─────────────────────────────────────────────
  describe('GET /api/applications/:id', () => {
    let appId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ company: 'Netflix', role: 'Frontend Dev', status: 'Applied' });
      appId = res.body.data._id;
    });

    it('returns the application by ID', async () => {
      const res = await request(app)
        .get(`/api/applications/${appId}`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.company).toBe('Netflix');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app)
        .get('/api/applications/nonexistent-id-999')
        .set(auth());

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/applications/:id ─────────────────────────────────────────────
  describe('PUT /api/applications/:id', () => {
    let appId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ company: 'Wipro', role: 'Associate Dev', status: 'Applied' });
      appId = res.body.data._id;
    });

    it('updates status successfully', async () => {
      const res = await request(app)
        .put(`/api/applications/${appId}`)
        .set(auth())
        .send({ status: 'OA Scheduled' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('OA Scheduled');
    });

    it('updates multiple fields at once', async () => {
      const res = await request(app)
        .put(`/api/applications/${appId}`)
        .set(auth())
        .send({ company: 'Wipro Ltd', package: '₹8 LPA', notes: 'HR round done' });

      expect(res.status).toBe(200);
      expect(res.body.data.company).toBe('Wipro Ltd');
      expect(res.body.data.package).toBe('₹8 LPA');
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .put(`/api/applications/${appId}`)
        .set(auth())
        .send({ status: 'Ghosted' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent application', async () => {
      const res = await request(app)
        .put('/api/applications/fake-id-000')
        .set(auth())
        .send({ status: 'Selected' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/applications/:id ──────────────────────────────────────────
  describe('DELETE /api/applications/:id', () => {
    let appId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(auth())
        .send({ company: 'HCL', role: 'Analyst', status: 'Rejected' });
      appId = res.body.data._id;
    });

    it('deletes the application and returns 200', async () => {
      const res = await request(app)
        .delete(`/api/applications/${appId}`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 after deletion', async () => {
      await request(app).delete(`/api/applications/${appId}`).set(auth());
      const res = await request(app)
        .delete(`/api/applications/${appId}`)
        .set(auth());

      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).delete(`/api/applications/${appId}`);
      expect(res.status).toBe(401);
    });
  });
});
