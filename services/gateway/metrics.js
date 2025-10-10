const client = require("prom-client");
const register = new client.Registry();

// Collect default metrics
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests handled by the service",
  labelNames: ["method", "route", "status", "service"],
});
register.registerMetric(httpRequests);

function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    res.on("finish", () => {
      const route = req.route ? req.route.path : req.path;
      httpRequests.labels(req.method, route, String(res.statusCode), serviceName).inc();
    });
    next();
  };
}

async function metricsEndpoint(req, res) {
  try {
    res.status(200);
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error("❌ Metrics export failed:", err.message);
    res.status(500).end(err.message);
  }
}

module.exports = { metricsMiddleware, metricsEndpoint, register };
