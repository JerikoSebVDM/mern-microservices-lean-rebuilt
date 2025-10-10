// services/cart/metrics.js
import client from "prom-client";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests handled by the cart service",
  labelNames: ["method", "route", "status", "service"],
});
register.registerMetric(httpRequests);

export function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    res.on("finish", () => {
      const route = req.route ? req.route.path : req.path;
      httpRequests
        .labels(req.method, route, String(res.statusCode), serviceName)
        .inc();
    });
    next();
  };
}

export async function metricsEndpoint(req, res) {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error("❌ Metrics export failed:", err.message);
    res.status(500).end(err.message);
  }
}
