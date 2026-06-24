/**
 * Auth Integration Tests
 * Run: npm test
 *
 * These tests use supertest to hit the real Express app.
 * They mock Mongoose so no real DB connection is needed.
 *
 * To run against a real test DB, set TEST_MONGODB_URI in your .env.test file.
 */

const request = require('supertest');

// ── Minimal Express app for testing (bypasses DB) ────────────────────────────
const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
dotenv.config();

// Set test JWT secret so token generation works without .env
process.env.JWT_SECRET   = process.env.JWT_SECRET   || 'test_secret_key_for_jest';
process.env.JWT_EXPIRE   = process.env.JWT_EXPIRE   || '7d';
process.env.MONGODB_URI  = process.env.MONGODB_URI  || 'mongodb://localhost:27017/stackup-test';

const errorHandler = require('../middleware/errorHandler');

// Build a test app (routes imported after env is set)
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use(errorHandler);
  return app;
};

// ── Mock Mongoose User model ──────────────────────────────────────────────────
jest.mock('../models/User', () => {
  const bcrypt = require('bcryptjs');

  // In-memory "database" — two indexes for O(1) lookup
  const usersByEmail = new Map();
  const usersById    = new Map();
  let nextId = 1;

  const MockUser = function (data) {
    this._id       = String(nextId++);
    this.name      = data.name;
    this.email     = data.email;
    this.password  = data.password;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  };

  // Mongoose adds a virtual `.id` getter that returns `_id.toString()`
  Object.defineProperty(MockUser.prototype, 'id', {
    get() { return String(this._id); },
    enumerable: true,
  });

  MockUser.prototype.save = async function () {
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(4);
      this.password = await bcrypt.hash(this.password, salt);
    }
    this.updatedAt = new Date();
    usersByEmail.set(this.email, this);
    usersById.set(this._id, this);
    return this;
  };

  MockUser.prototype.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  MockUser.prototype.deleteOne = async function () {
    usersByEmail.delete(this.email);
    usersById.delete(this._id);
  };

  MockUser.create = async function (data) {
    const user = new MockUser(data);
    await user.save();
    return user;
  };

  MockUser.findOne = jest.fn(({ email } = {}) => {
    const chain = {
      _email: email,
      select(fields) { return this; },
      then(resolve, reject) {
        const user = usersByEmail.get(this._email) || null;
        return Promise.resolve(user).then(resolve, reject);
      },
    };
    return chain;
  });

  MockUser.findById = jest.fn((id) => {
    const chain = {
      _targetId: id,
      select(fields) { return this; },
      then(resolve, reject) {
        const user = usersById.get(String(id)) || null;
        return Promise.resolve(user).then(resolve, reject);
      },
    };
    return chain;
  });

  // Clear between tests
  MockUser.__clear = () => { usersByEmail.clear(); usersById.clear(); nextId = 1; };

  return MockUser;
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth API', () => {
  let app;
  const User = require('../models/User');

  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { User.__clear(); });

  // ── POST /api/auth/register ──────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    const validPayload = {
      name: 'Krisha Patel',
      email: 'krisha@example.com',
      password: 'password123',
    };

    it('returns 201 and a JWT token on successful registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validPayload.email);
      expect(res.body.user.name).toBe(validPayload.name);
      expect(res.body.user.password).toBeUndefined(); // password never returned
    });

    it('returns 409 when email already exists', async () => {
      await request(app).post('/api/auth/register').send(validPayload);
      const res = await request(app).post('/api/auth/register').send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'a@b.com', password: 'pass123' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('name');
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'pass123' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('email');
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '12' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('password');
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/auth/login ─────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Seed one user
      await request(app).post('/api/auth/register').send({
        name: 'Krisha Patel',
        email: 'krisha@example.com',
        password: 'correctpass',
      });
    });

    it('returns 200 and a token with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'krisha@example.com', password: 'correctpass' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('krisha@example.com');
    });

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'krisha@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'somepass' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'krisha@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('password');
    });

    it('returns 400 when email is invalid format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bad-format', password: 'somepass' });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/auth/profile ────────────────────────────────────────────────
  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Krisha Patel',
        email: 'krisha@example.com',
        password: 'pass123',
      });
      token = res.body.token;
    });

    it('returns 200 and user data with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('krisha@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer this.is.not.valid');

      expect(res.status).toBe(401);
    });

    it('returns 401 with expired / tampered token', async () => {
      const fakeToken = token.slice(0, -5) + 'XXXXX';
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
    });
  });

  // ── PUT /api/auth/profile ────────────────────────────────────────────────
  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Original Name',
        email: 'update@example.com',
        password: 'oldpassword',
      });
      token = res.body.token;
    });

    it('updates name and returns new token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.token).toBeDefined();
    });

    it('returns 401 when currentPassword is wrong on password change', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when newPassword is missing currentPassword', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpass123' });

      expect(res.status).toBe(400);
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Hacker' });

      expect(res.status).toBe(401);
    });
  });
});