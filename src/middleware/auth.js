const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { fail } = require('../utils/response');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, 'Unauthorized');
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return fail(res, 404, 'User not found');
    req.user = user;
    return next();
  } catch (error) {
    return fail(res, 401, 'Invalid token');
  }
}

module.exports = auth;
