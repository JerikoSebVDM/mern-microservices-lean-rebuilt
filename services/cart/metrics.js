const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
});
register.registerMetric(httpRequests);

function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      httpRequests.labels(req.method, route, String(res.statusCode), serviceName).inc();
    });
    next();
  };
}

function metricsEndpoint() {
  return async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  };
}

module.exports = { metricsMiddleware, metricsEndpoint };
