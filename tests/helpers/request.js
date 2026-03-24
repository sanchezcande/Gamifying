const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');

function buildRequest(app, method, path) {
  const headers = {};
  let payload;
  let executed = false;

  const exec = () => {
    if (executed) return executed;

    executed = new Promise((resolve, reject) => {
      const req = httpMocks.createRequest({
        method,
        url: path,
        headers,
        body: payload || {}
      });

      if (payload !== undefined) {
        req.body = payload;
        req._body = true;
        if (!headers['content-type']) {
          req.headers['content-type'] = 'application/json';
        }
      }

      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', () => {
        let body = res._getData();
        try {
          body = res._getJSONData();
        } catch (err) {
          // keep raw data if not JSON
        }

        resolve({
          status: res.statusCode,
          body,
          headers: res._getHeaders()
        });
      });

      try {
        app.handle(req, res);
      } catch (err) {
        reject(err);
      }
    });

    return executed;
  };

  const chain = {
    set(name, value) {
      headers[name.toLowerCase()] = value;
      return chain;
    },
    send(body) {
      payload = body;
      return exec();
    },
    then(onFulfilled, onRejected) {
      return exec().then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return exec().catch(onRejected);
    },
    finally(onFinally) {
      return exec().finally(onFinally);
    }
  };

  return chain;
}

module.exports = function request(app) {
  return {
    get: (path) => buildRequest(app, 'GET', path),
    post: (path) => buildRequest(app, 'POST', path),
    put: (path) => buildRequest(app, 'PUT', path),
    delete: (path) => buildRequest(app, 'DELETE', path)
  };
};
