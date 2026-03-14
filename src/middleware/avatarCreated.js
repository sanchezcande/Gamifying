const { fail } = require('../utils/response');

function avatarCreated(req, res, next) {
  if (!req.user.avatarGender) {
    return fail(res, 400, 'Avatar not created yet');
  }
  return next();
}

module.exports = avatarCreated;
