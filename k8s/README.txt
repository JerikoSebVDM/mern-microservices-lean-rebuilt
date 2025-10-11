Absolutely — here’s the **full and final `README_K8S.md`**, fully formatted, complete with emojis, code blocks, and all verified config details from your current live setup.

You can **copy–paste this directly** into your repository root.

---

```markdown
# 🚀 MERN Microservices E-Commerce — Kubernetes Deployment (Final)

This document describes the **fully operational Kubernetes setup** for the MERN microservices e-commerce platform — including **RabbitMQ async messaging**, **Prometheus monitoring**, and **Grafana dashboards**.

---

## 🧩 Architecture Overview

```

[ React Client ]
↓
[ Gateway ]
↓
┌───────────────┬──────────────┬───────────────┐
│ Auth Service  │ Catalog Svc  │ Cart Service  │
└───────────────┴──────────────┴──────┬────────┘
↓
[ RabbitMQ ]
↓
[ Order Service ]
↓
[ Shipping Service ]
↓
[ MongoDB ]

````

Each service is containerized, monitored, and deployed into the `mern-ecommerce` Kubernetes namespace.

---

## 🧰 Core Components

| Component | Purpose | Port | Notes |
|------------|----------|------|-------|
| 🧑‍💻 **Client (React)** | Front-end interface | `5173` | Connects to Gateway |
| 🕸️ **Gateway** | API Gateway (reverse proxy) | `8098` | Routes traffic to all services |
| 🔐 **Auth** | User signup/login | `3001` | Mongo-backed |
| 🛍️ **Catalog** | Product listing service | `3002` | Mongo-backed |
| 🛒 **Cart** | Session cart + checkout | `3003` | Publishes to RabbitMQ |
| 📦 **Order** | Consumes orders from RabbitMQ | `3004` | Publishes to Mongo |
| 🚚 **Shipping** | Async shipping creation | `3005` | Listens on `orders` queue |
| 🐇 **RabbitMQ** | Message broker | `5672 / 15672` | `guest:guest` |
| 📊 **Prometheus** | Metrics collection | `9090` | Scrapes all services |
| 📈 **Grafana** | Visualization dashboard | `3000` | Dashboards linked to Prometheus |
| 🍃 **MongoDB** | Database | `27017` | Persistent storage |

---

## ⚙️ Port-Forward Commands

Run these in separate PowerShell or terminal tabs:

```bash
kubectl port-forward svc/client -n mern-ecommerce 5173:5173
kubectl port-forward svc/gateway -n mern-ecommerce 8098:8080
kubectl port-forward svc/mongo -n mern-ecommerce 27017:27017
kubectl port-forward svc/rabbitmq -n mern-ecommerce 15672:15672
kubectl port-forward svc/prometheus -n mern-ecommerce 9090:9090
kubectl port-forward svc/grafana -n mern-ecommerce 3000:3000
````

---

## 🌐 Access Points

| Tool / Service             | Local URL                                        | Login                |
| -------------------------- | ------------------------------------------------ | -------------------- |
| 🖥️ **Client UI**          | [http://localhost:5173](http://localhost:5173)   | Public               |
| 🧩 **Gateway (API)**       | [http://localhost:8098](http://localhost:8098)   | Public API root      |
| 🐇 **RabbitMQ Dashboard**  | [http://localhost:15672](http://localhost:15672) | `guest / guest`      |
| 📊 **Prometheus**          | [http://localhost:9090](http://localhost:9090)   | Metrics explorer     |
| 📈 **Grafana**             | [http://localhost:3000](http://localhost:3000)   | `admin / admin`      |
| 🍃 **MongoDB (via shell)** | `mongodb://localhost:27017/mern`                 | No auth (local only) |

---

## 🧾 Environment Variables (Standardized)

All async services use the same RabbitMQ credentials:

```yaml
- name: AMQP_URL
  value: "amqp://guest:guest@rabbitmq:5672"
- name: RABBIT_URL
  value: "amqp://guest:guest@rabbitmq:5672"
```

---

## 📊 Prometheus Configuration (`prometheus.yaml`)

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: 'auth'
    static_configs: [{ targets: ['auth:3001'] }]

  - job_name: 'catalog'
    static_configs: [{ targets: ['catalog:3002'] }]

  - job_name: 'cart'
    static_configs: [{ targets: ['cart:3003'] }]

  - job_name: 'order'
    static_configs: [{ targets: ['order:3004'] }]

  - job_name: 'shipping'
    static_configs: [{ targets: ['shipping:3005'] }]

  - job_name: 'gateway'
    static_configs: [{ targets: ['gateway:8080'] }]

  - job_name: 'rabbitmq'
    static_configs: [{ targets: ['rabbitmq:9419'] }]
```

✅ **RabbitMQ exporter** exposes metrics at port `9419`.
✅ **All services** expose `/metrics` endpoints (Prometheus client registered).

---

## 📈 Grafana Setup

* **Datasource:** `Prometheus` → `http://prometheus:9090`
* **Default login:** `admin / admin`
* **Recommended Dashboards:**

  * *Node.js / Express Service Metrics*
  * *RabbitMQ Overview*
  * *MongoDB Stats*
  * *Custom E-Commerce KPIs* (Orders processed, Shipping queue length, etc.)

Example metric names:

```
process_cpu_seconds_total
orders_processed_total
http_request_duration_seconds
```

---

## 🔬 Health & Metrics Endpoints

| Service  | Health    | Metrics    |
| -------- | --------- | ---------- |
| Gateway  | `/health` | `/metrics` |
| Auth     | `/health` | `/metrics` |
| Catalog  | `/health` | `/metrics` |
| Cart     | `/health` | `/metrics` |
| Order    | `/health` | `/metrics` |
| Shipping | `/health` | `/metrics` |

---

## 🧪 Functional Test Sequence (End-to-End)

Run from PowerShell or terminal **(keep port-forwards active)**:

```powershell
# 1️⃣ Signup via Gateway → Auth
Invoke-RestMethod -Uri "http://localhost:8098/auth/signup" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"email":"k8sfinal@test.com","password":"123"}'

# 2️⃣ Add product to Cart
Invoke-RestMethod -Uri "http://localhost:8098/cart/add" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"productId":"desk01","qty":2}'

# 3️⃣ Checkout → RabbitMQ → Order → Shipping
Invoke-RestMethod -Uri "http://localhost:8098/cart/checkout" -Method POST

# 4️⃣ Verify logs
kubectl logs deploy/order -n mern-ecommerce --tail=20
kubectl logs deploy/shipping -n mern-ecommerce --tail=20
```

Expected output:

```
📦 Received order_created: ...
✅ Shipping entry saved for orderId ...
```

---

## 🧭 Cluster Check Commands

```bash
# Check all services
kubectl get svc -n mern-ecommerce

# Check all pods
kubectl get pods -n mern-ecommerce

# View container logs
kubectl logs deploy/<service-name> -n mern-ecommerce --tail=50
```

---

## 🏁 Milestone Completion Summary

| Milestone                             | Description                              | Status         |
| ------------------------------------- | ---------------------------------------- | -------------- |
| 1️⃣ Core Services                     | Auth, Catalog, Cart, Mongo, Docker setup | ✅ Completed    |
| 2️⃣ Gateway + Client                  | API Gateway + React Frontend             | ✅ Completed    |
| 3️⃣ Order + Prometheus + Grafana      | Metrics & Monitoring integrated          | ✅ Completed    |
| 4️⃣ RabbitMQ + Async + K8s Deployment | Fully deployed in K8s with observability | ✅ Completed 🎉 |

---

## 📚 Notes

* RabbitMQ dashboard uses **guest/guest** for local admin access.
* Prometheus scrapes all service `/metrics` endpoints every **5s**.
* Grafana dashboards are pre-linked to Prometheus datasource.
* MongoDB can be queried directly inside the cluster with:

  ```bash
  kubectl exec -it deploy/mongo -n mern-ecommerce -- mongosh
  use mern
  db.shippings.find().sort({_id:-1}).limit(1)
  ```