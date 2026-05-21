jest.mock('../../src/utils/prisma');
jest.mock('../../src/services/avatarImageService', () => ({
  generateAvatarForUser: jest.fn().mockResolvedValue('data:image/png;base64,abc123'),
}));

const request = require('../helpers/request');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const avatarImageService = require('../../src/services/avatarImageService');
const { makeToken, mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => {
  resetPrismaMocks(prisma);
  avatarImageService.generateAvatarForUser.mockResolvedValue('data:image/png;base64,abc123');
});

describe('POST /api/auth/register', () => {
  test('registers successfully without gymId', async () => {
    prisma.gym.findUnique.mockResolvedValue(null); // not called since no gymId
    prisma.user.findUnique.mockResolvedValue(null); // email not in use
    prisma.user.create.mockResolvedValue(mockUser({ id: 'new-user' }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('registers with a valid gymCode', async () => {
    const gym = { id: 'gym-1', name: 'Test Gym', location: 'City', gymCode: '4821' };
    prisma.gym.findUnique.mockResolvedValue(gym);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser({ gymId: 'gym-1' }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'pass123', gymCode: '4821' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.gymId).toBe('gym-1');
  });

  test('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'missing@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/missing/i);
  });

  test('returns 404 if gymCode does not exist', async () => {
    prisma.gym.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@test.com', password: 'pass', gymCode: '9999' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invalid gym code/i);
  });

  test('returns 400 if email is already in use', async () => {
    prisma.gym.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(mockUser()); // email exists

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dave', email: 'taken@test.com', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email already/i);
  });
});

describe('POST /api/auth/login', () => {
  test('login succeeds with correct credentials', async () => {
    const hashed = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue(mockUser({ password: hashed }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('returns 400 for wrong password', async () => {
    const hashed = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue(mockUser({ password: hashed }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('returns 400 for non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'pass' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});

describe('GET /api/auth/me', () => {
  test('returns profile for authenticated user', async () => {
    const user = mockUser();
    const userWithItems = { ...user, userItems: [] };

    // auth middleware call
    prisma.user.findUnique.mockResolvedValueOnce(user);
    // buildUserProfile call
    prisma.user.findUnique.mockResolvedValueOnce(userWithItems);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('returns 404 if profile not found (deleted user)', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);     // auth passes
    prisma.user.findUnique.mockResolvedValueOnce(null);     // profile not found

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/auth/create-avatar', () => {
  test('creates avatar successfully', async () => {
    const user = mockUser({ avatarGender: null });
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({ ...user, avatarGender: 'MALE' });

    const res = await request(app)
      .post('/api/auth/create-avatar')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gender: 'MALE' });

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('returns 400 if gender is missing', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/create-avatar')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ faceJawId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/gender/i);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/auth/create-avatar')
      .send({ gender: 'FEMALE' });
    expect(res.status).toBe(401);
  });
});
