jest.mock('../../src/utils/prisma');
jest.mock('../../src/services/notificationService');

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { sendPushNotifications } = require('../../src/services/notificationService');
const { makeToken, mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => {
  resetPrismaMocks(prisma);
  sendPushNotifications.mockResolvedValue(undefined);
});

const user = mockUser({ gymId: 'gym-1' });
const otherUser = mockUser({ id: 'other-user', gymId: 'gym-1' });

function authUser() {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

describe('POST /api/sessions', () => {
  test('creates a session successfully', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    const session = {
      id: 'sess-1', userId: user.id, gymId: 'gym-1',
      workoutType: 'WEIGHTS', scheduledAt: new Date(futureDate),
      spotsAvailable: 5, cancelled: false, joiners: [],
      user: { name: user.name }
    };
    prisma.gymSession.create.mockResolvedValue(session);
    prisma.user.findMany.mockResolvedValue([]); // no members to notify

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ workoutType: 'WEIGHTS', scheduledAt: futureDate, spotsAvailable: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.workoutType).toBe('WEIGHTS');
  });

  test('returns 400 if workoutType is missing', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ scheduledAt: futureDate });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/workouttype/i);
  });

  test('returns 400 if scheduledAt is missing', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ workoutType: 'CARDIO' });

    expect(res.status).toBe(400);
  });

  test('returns 400 if scheduledAt is invalid date', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ workoutType: 'CARDIO', scheduledAt: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid scheduledAt/i);
  });

  test('returns 400 if user has no gym', async () => {
    const noGymUser = { ...user, gymId: null };
    prisma.user.findUnique.mockResolvedValueOnce(noGymUser); // auth
    prisma.user.findUnique.mockResolvedValueOnce(noGymUser); // controller

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ workoutType: 'WEIGHTS', scheduledAt: futureDate });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/belong to a gym/i);
  });
});

describe('GET /api/sessions', () => {
  test('returns active sessions for gym', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findMany.mockResolvedValue([
      {
        id: 'sess-1', workoutType: 'WEIGHTS', scheduledAt: new Date(futureDate),
        cancelled: false, spotsAvailable: 5,
        user: { id: user.id, name: user.name, avatarClass: 'ROOKIE' },
        joiners: []
      }
    ]);

    const res = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/sessions/:id/join', () => {
  const session = {
    id: 'sess-1', userId: 'owner-id', gymId: 'gym-1',
    cancelled: false, spotsAvailable: 5, joiners: [],
    user: { pushToken: null, name: 'Owner' }
  };

  test('joins a session successfully', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findUnique.mockResolvedValue(session);
    prisma.sessionJoin.count.mockResolvedValue(0);
    prisma.sessionJoin.create.mockResolvedValue({ id: 'sj-1', sessionId: 'sess-1', userId: user.id });

    const res = await request(app)
      .post('/api/sessions/sess-1/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBe('sess-1');
  });

  test('returns 404 if session not found', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/sessions/nonexistent/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/session not found/i);
  });

  test('returns 400 if session is cancelled', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findUnique.mockResolvedValue({ ...session, cancelled: true });

    const res = await request(app)
      .post('/api/sessions/sess-1/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cancelled/i);
  });

  test('returns 400 if joining your own session', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findUnique.mockResolvedValue({ ...session, userId: user.id });

    const res = await request(app)
      .post('/api/sessions/sess-1/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/your own session/i);
  });

  test('returns 400 if session is full', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    const fullSession = { ...session, spotsAvailable: 2 };
    prisma.gymSession.findUnique.mockResolvedValue(fullSession);
    prisma.sessionJoin.count.mockResolvedValue(2);

    const res = await request(app)
      .post('/api/sessions/sess-1/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/session is full/i);
  });

  test('returns 400 on duplicate join (P2002)', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findUnique.mockResolvedValue(session);
    prisma.sessionJoin.count.mockResolvedValue(0);
    const dupError = new Error('Duplicate');
    dupError.code = 'P2002';
    prisma.sessionJoin.create.mockRejectedValue(dupError);

    const res = await request(app)
      .post('/api/sessions/sess-1/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already joined/i);
  });

  test('returns 403 if session belongs to different gym', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gymSession.findUnique.mockResolvedValue({ ...session, gymId: 'other-gym' });

    const res = await request(app)
      .post('/api/sessions/sess-1/join')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/sessions/:id', () => {
  test('cancels own session', async () => {
    authUser();
    const ownedSession = {
      id: 'sess-1', userId: user.id, joiners: [],
      user: { name: user.name }
    };
    prisma.gymSession.findUnique.mockResolvedValue(ownedSession);
    prisma.gymSession.update.mockResolvedValue({ ...ownedSession, cancelled: true });

    const res = await request(app)
      .delete('/api/sessions/sess-1')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cancelled).toBe(true);
  });

  test('returns 403 if not session owner', async () => {
    authUser();
    prisma.gymSession.findUnique.mockResolvedValue({
      id: 'sess-1', userId: 'someone-else', joiners: [],
      user: { name: 'Other' }
    });

    const res = await request(app)
      .delete('/api/sessions/sess-1')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not your session/i);
  });

  test('returns 404 if session not found', async () => {
    authUser();
    prisma.gymSession.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/sessions/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/sessions/:id/messages', () => {
  test('returns messages for a participant (session owner)', async () => {
    authUser();
    const sess = { id: 'sess-1', userId: user.id };
    prisma.gymSession.findUnique.mockResolvedValue(sess);
    prisma.sessionJoin.findUnique.mockResolvedValue(null); // owner, not a joiner
    prisma.sessionMessage.findMany.mockResolvedValue([
      { id: 'msg-1', text: 'See you there!', createdAt: new Date(), user: { id: user.id, name: user.name } }
    ]);

    const res = await request(app)
      .get('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].text).toBe('See you there!');
  });

  test('returns messages for a joiner', async () => {
    authUser();
    const sess = { id: 'sess-1', userId: 'owner-id' }; // user is NOT owner
    prisma.gymSession.findUnique.mockResolvedValue(sess);
    prisma.sessionJoin.findUnique.mockResolvedValue({ id: 'sj-1' }); // user IS a joiner
    prisma.sessionMessage.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
  });

  test('returns 403 if not a participant', async () => {
    authUser();
    const sess = { id: 'sess-1', userId: 'other-owner' };
    prisma.gymSession.findUnique.mockResolvedValue(sess);
    prisma.sessionJoin.findUnique.mockResolvedValue(null); // not owner and not joiner

    const res = await request(app)
      .get('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not a participant/i);
  });

  test('returns 404 if session not found', async () => {
    authUser();
    prisma.gymSession.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/sessions/nonexistent/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/sessions/:id/messages', () => {
  test('sends a message as session owner', async () => {
    authUser();
    const sess = { id: 'sess-1', userId: user.id, cancelled: false };
    prisma.gymSession.findUnique.mockResolvedValue(sess);
    prisma.sessionJoin.findUnique.mockResolvedValue(null); // owner
    const msg = { id: 'msg-1', text: 'Hello!', sessionId: 'sess-1', userId: user.id, user: { id: user.id, name: user.name } };
    prisma.sessionMessage.create.mockResolvedValue(msg);

    const res = await request(app)
      .post('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ text: 'Hello!' });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('Hello!');
  });

  test('returns 400 if text is empty', async () => {
    authUser();
    const sess = { id: 'sess-1', userId: user.id, cancelled: false };
    prisma.gymSession.findUnique.mockResolvedValue(sess);
    prisma.sessionJoin.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/text is required/i);
  });

  test('returns 400 if session is cancelled', async () => {
    authUser();
    prisma.gymSession.findUnique.mockResolvedValue({ id: 'sess-1', userId: user.id, cancelled: true });
    prisma.sessionJoin.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ text: 'Hello' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cancelled/i);
  });

  test('returns 403 if not a participant', async () => {
    authUser();
    prisma.gymSession.findUnique.mockResolvedValue({ id: 'sess-1', userId: 'other', cancelled: false });
    prisma.sessionJoin.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/sessions/sess-1/messages')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ text: 'Hello' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/sessions/push-token', () => {
  test('saves push token', async () => {
    authUser();
    prisma.user.update.mockResolvedValue({ ...user, pushToken: 'ExponentPushToken[abc]' });

    const res = await request(app)
      .post('/api/sessions/push-token')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ pushToken: 'ExponentPushToken[abc]' });

    expect(res.status).toBe(200);
    expect(res.body.data.saved).toBe(true);
  });

  test('returns 400 if pushToken missing', async () => {
    authUser();

    const res = await request(app)
      .post('/api/sessions/push-token')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pushtoken/i);
  });
});
