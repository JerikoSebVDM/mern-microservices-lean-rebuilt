# 🧩 MERN Microservices (Lean Class Demo)

This project is a lean microservices e-commerce demo designed for coursework.  
It demonstrates clear service boundaries, REST APIs, Docker orchestration, and real-time monitoring with Prometheus and Grafana.  
Each milestone adds one key production-grade feature while staying lightweight and modular.

---

## 🎯 Milestones & Deliverables

### ✅ Milestone 1: Core Services (20%)
- **Auth Service** → signup/login with JWT  
- **Catalog Service** → seeded products  
- **Cart Service** → per-user cart (secured with JWT)  
- **Dockerised MongoDB** with per-service collections  
- All services containerized with Docker

---

### ✅ Milestone 2: Gateway + Frontend (20%)
- **API Gateway** for routing and request proxying  
- **React/Vite Client** → login → catalog → add to cart → checkout flow  
- **Webhook** → checkout posts order event to Order service  
- Entire system runnable via `docker compose up`

---

### ✅ Milestone 3: Healthchecks + Monitoring (30%)
- `/health` endpoints added to all services for uptime verification  
- Configured Docker **healthchecks** and `restart: always` policies  
- Integrated **Prometheus** for metrics collection  
- Integrated **Grafana** for visualization dashboards  
- Prometheus scrapes all services (`auth`, `catalog`, `cart`, `order`, `gateway`)  
- Grafana visualizes real-time service health and request rates  
- Default Grafana credentials → **admin / admin**

#### 📊 Monitoring URLs
- Prometheus → [http://localhost:9090](http://localhost:9090)  
- Grafana → [http://localhost:3000](http://localhost:3000)

#### ✅ Verification Commands
```bash
curl http://localhost:3001/health   # auth
curl http://localhost:3002/health   # catalog
curl http://localhost:3003/health   # cart
curl http://localhost:3004/health   # order
curl http://localhost:8080/health   # gateway
🔜 Milestone 4: Async + Kubernetes (30%)
Add Kafka/RabbitMQ for asynchronous messaging (shipping/payment demo)

Add Kubernetes manifests for scalable deployment

Integrate services with message queue–based order processing

Configure Prometheus + Grafana to monitor async pipelines and pods

📂 Services Overview
Service	Port	Description
gateway	8080	Reverse proxy for routing requests
auth	3001	JWT signup/login authentication
catalog	3002	Seeded product catalog
cart	3003	Per-user cart + checkout webhooks
order	3004	Order storage & webhook handler
client	5173	React/Vite UI frontend
prometheus	9090	Metrics collection
grafana	3000	Dashboard visualization