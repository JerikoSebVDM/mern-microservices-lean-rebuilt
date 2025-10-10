const client = require("prom-client");
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Example: number of shipments processed
const shipmentsProcessed = new client.Counter({
  name: "shipments_processed_total",
  help: "Total number of shipments processed",
});
register.registerMetric(shipmentsProcessed);

function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    next();
  };
}

async function metricsEndpoint(req, res) {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error("❌ Metrics export failed:", err.message);
    res.status(500).end(err.message);
  }
}

module.exports = { metricsMiddleware, metricsEndpoint, shipmentsProcessed, register };
