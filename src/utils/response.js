function ok(res, data = {}) {
  return res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  return res.status(status).json({ success: false, data: null, error });
}

module.exports = { ok, fail };
