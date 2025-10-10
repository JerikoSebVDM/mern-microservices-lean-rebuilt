const client = require("prom-client");
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Business counters
const orderReceived = new client.Counter({
  name: "orders_received_total",
  help: "Total number of orders received",
});
const orderCompleted = new client.Counter({
  name: "orders_completed_total",
  help: "Total number of orders marked completed",
});

register.registerMetric(orderReceived);
register.registerMetric(orderCompleted);

const metricsMiddleware = (serviceName) => (req, res, next) => {
  // optional HTTP counter
  next();
};

async function metricsEndpoint(req, res) {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error("❌ Metrics export failed:", err.message);
    res.status(500).end(err.message);
  }
}

module.exports = {
  orderReceived,
  orderCompleted,
  metricsMiddleware,
  metricsEndpoint,
  register,
};
