// Manual mock for Prisma client used in all tests
const prisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  },
  gym: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  checkIn: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn()
  },
  purchase: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  referral: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  shopItem: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  userItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  },
  battle: {
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn()
  },
  competition: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  gymSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  sessionJoin: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  sessionMessage: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn()
};

// Default $transaction implementation: supports both array form and callback form
prisma.$transaction.mockImplementation(async (arg) => {
  if (typeof arg === 'function') return arg(prisma);
  if (Array.isArray(arg)) return Promise.all(arg);
  return arg;
});

module.exports = prisma;
