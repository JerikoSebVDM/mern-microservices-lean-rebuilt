# 🛍️ MERN Microservices E-Commerce Platform  

### 🚀 Microservices • 🐳 Docker & Kubernetes • 🐇 RabbitMQ • 📊 Prometheus & Grafana  

A lean, modular **microservices-based e-commerce platform** built with the **MERN stack**, deployed via **Kubernetes**, and monitored with **Prometheus + Grafana**.  
Designed for high scalability, async order handling, and real-time observability.

---

## 🧱 Architecture Overview

[ React Client ]
↓
[ API Gateway ]
↓
┌──────────────┬─────────────┬──────────────┬─────────────┐
│ Auth Service │ Catalog │ Cart Service │ Order │
│ (JWT + Bcrypt)│ Products DB│ Mongo + AMQP │ Mongo + MQ │
└──────────────┴─────────────┴──────────────┴─────────────┘
↓
[ RabbitMQ Broker ]
↓
[ Shipping Service ]
↓
[ MongoDB + Metrics ]

yaml
Copy code

Each service exposes `/health` and `/metrics` endpoints for Prometheus scraping.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + Vite |
| API Gateway | Express + http-proxy-middleware |
| Backend | Node.js (Auth, Catalog, Cart, Order, Shipping) |
| Database | MongoDB |
| Message Broker | RabbitMQ |
| Monitoring | Prometheus + Grafana |
| Containerization | Docker + Kubernetes |

---

## 🧩 Core Services

| Service | Port | Description |
|----------|------|-------------|
| **Auth** | `3001` | User registration & login with JWT |
| **Catalog** | `3002` | Product management |
| **Cart** | `3003` | Manages user cart & checkout |
| **Order** | `3004` | Receives checkout messages via RabbitMQ |
| **Shipping** | `3005` | Async shipping processor with Prometheus metrics |
| **Gateway** | `8080` | Unified API routing for all services |
| **Frontend** | `5173` | React client (Vite Dev) |
| **Prometheus** | `9090` | Metrics collection |
| **Grafana** | `3000` | Dashboard visualization |

---

## 🐳 Run Locally (Docker Compose)

```bash
# 1. Clone repo
git clone https://github.com/JerikoSebVDM/mern-microservices-lean-rebuilt.git
cd mern-microservices-lean-rebuilt

# 2. Start all services
docker compose up --build

# 3. Access interfaces
Frontend:   http://localhost:5173  
Gateway:    http://localhost:8080  
Prometheus: http://localhost:9090  
Grafana:    http://localhost:3000  
RabbitMQ:   http://localhost:15672 (guest / guest)
☸️ Run on Kubernetes
🧭 Deploy All Services
bash
Copy code
# Create namespace
kubectl create namespace mern-ecommerce

# Apply manifests
kubectl apply -f k8s/ -n mern-ecommerce

# Verify
kubectl get pods -n mern-ecommerce
🔌 Port Forward
bash
Copy code
kubectl port-forward svc/client -n mern-ecommerce 5173:5173
kubectl port-forward svc/gateway -n mern-ecommerce 8098:8080
kubectl port-forward svc/prometheus -n mern-ecommerce 9090:9090
kubectl port-forward svc/grafana -n mern-ecommerce 3000:3000
kubectl port-forward svc/rabbitmq -n mern-ecommerce 15672:15672
🧮 Prometheus & Grafana Setup
Prometheus Scrape Config (prometheus.yml)
yaml
Copy code
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
Grafana Dashboard
Datasource: Prometheus (http://prometheus:9090)

Dashboards: Container CPU, service latency, and business-level metrics (orders processed, checkout count).

🔁 RabbitMQ Flow
🛒 Cart Service publishes order_created message → orders queue.

🧾 Order Service consumes message and saves order in Mongo.

🚚 Shipping Service consumes same message, creates shipping record, and increments Prometheus metric.

✅ Verified with working queue exchange between cart → order → shipping.

🧪 Test Endpoints (via PowerShell or curl)
powershell
Copy code
# Register
Invoke-RestMethod -Uri "http://localhost:8098/auth/signup" `
  -Method POST -Headers @{ "Content-Type"="application/json" } `
  -Body '{"email":"test@test.com","password":"123"}'

# Add item
Invoke-RestMethod -Uri "http://localhost:8098/cart/add" `
  -Method POST -Headers @{ "Content-Type"="application/json" } `
  -Body '{"productId":"desk01","qty":2}'

# Checkout
Invoke-RestMethod -Uri "http://localhost:8098/cart/checkout" -Method POST
📊 Example Metrics
Metric	Source	Description
orders_processed_total	shipping	Orders consumed by shipping
process_cpu_seconds_total	all	CPU usage per service
nodejs_heap_used_bytes	all	Memory usage
http_request_duration_seconds	gateway	API latency

🧠 Troubleshooting
See TROUBLESHOOTING_GUIDE.docx for:

Common RabbitMQ 403 / connection issues

Mongo connection errors

Prometheus scrape targets not showing

Kubernetes pod restart / CrashLoopBackOff fixes

Step-by-step logs inspection commands

🧭 Milestones (Client Deliverables)
Milestone	Description	Status
1. Core Services (Auth, Catalog, Cart)	Mongo + Docker setup	✅ Done
2. Gateway + React Frontend	Unified routing verified	✅ Done
3. Order + Prometheus + Grafana	Business metrics integrated	✅ Done
4. RabbitMQ Async + Kubernetes	All pods running under mern-ecommerce	✅ Done

🧰 Useful Commands
bash
Copy code
# View logs for a service
kubectl logs deploy/cart -n mern-ecommerce --tail=50

# Restart deployments
kubectl rollout restart deploy/cart -n mern-ecommerce

# View metrics live
kubectl port-forward svc/prometheus -n mern-ecommerce 9090:9090