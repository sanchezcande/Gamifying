jest.mock('../../src/utils/prisma');

const jwt = require('jsonwebtoken');
const httpMocks = require('node-mocks-http');
const prisma = require('../../src/utils/prisma');
const authMiddleware = require('../../src/middleware/auth');
const avatarCreatedMiddleware = require('../../src/middleware/avatarCreated');
const isGymOwnerMiddleware = require('../../src/middleware/isGymOwner');
const { mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const JWT_SECRET = process.env.JWT_SECRET;

function makeReqRes() {
  const req = httpMocks.createRequest();
  const res = httpMocks.createResponse();
  return { req, res };
}

describe('auth middleware', () => {
  test('calls next() with valid token', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    const { req, res } = makeReqRes();
    req.headers.authorization = `Bearer ${token}`;

    const next = jest.fn();
    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(user);
  });

  test('returns 401 without Authorization header', async () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('returns 401 with malformed header (no Bearer prefix)', async () => {
    const { req, res } = makeReqRes();
    req.headers.authorization = 'Token abc123';
    const next = jest.fn();
    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('returns 401 with expired/invalid token', async () => {
    const { req, res } = makeReqRes();
    req.headers.authorization = 'Bearer this.is.invalid';
    const next = jest.fn();
    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('returns 404 if user not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const token = jwt.sign({ userId: 'deleted-user' }, JWT_SECRET);
    const { req, res } = makeReqRes();
    req.headers.authorization = `Bearer ${token}`;

    const next = jest.fn();
    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
  });
});

describe('avatarCreated middleware', () => {
  test('calls next() when avatar is created', () => {
    const { req, res } = makeReqRes();
    req.user = mockUser({ avatarGender: 'MALE' });
    const next = jest.fn();

    avatarCreatedMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 when avatar is not created', () => {
    const { req, res } = makeReqRes();
    req.user = mockUser({ avatarGender: null });
    const next = jest.fn();

    avatarCreatedMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});

describe('isGymOwner middleware', () => {
  test('calls next() for gym owners', () => {
    const { req, res } = makeReqRes();
    req.user = mockUser({ isOwner: true });
    const next = jest.fn();

    isGymOwnerMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 for non-owners', () => {
    const { req, res } = makeReqRes();
    req.user = mockUser({ isOwner: false });
    const next = jest.fn();

    isGymOwnerMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
