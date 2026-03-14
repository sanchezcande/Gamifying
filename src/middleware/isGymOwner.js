const { fail } = require('../utils/response');

function isGymOwner(req, res, next) {
  if (!req.user?.isOwner) return fail(res, 403, 'Gym owner access required');
  return next();
}

module.exports = isGymOwner;
