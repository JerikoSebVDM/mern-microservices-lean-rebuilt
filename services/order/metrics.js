const client = require('prom-client');

const orderReceived = new client.Counter({
  name: 'orders_received_total',
  help: 'Total number of orders received',
});

const orderCompleted = new client.Counter({
  name: 'orders_completed_total',
  help: 'Total number of orders marked completed',
});

const metricsMiddleware = (serviceName) => (req, res, next) => {
  // basic request counter if you already had this
  next();
};

const metricsEndpoint = () => async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

module.exports = {
  orderReceived,
  orderCompleted,
  metricsMiddleware,
  metricsEndpoint,
  register: client.register,
};
