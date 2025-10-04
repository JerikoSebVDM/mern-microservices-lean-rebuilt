# MERN Microservices (Lean Class Demo)

Lean microservices demo for classwork. Shows service boundaries, REST + webhook, Docker, K8s, and metrics.

## Services
- **gateway**: reverse proxy to internal services; `/metrics` exposed.
- **auth**: signup/login with JWT; `/metrics` exposed.
- **catalog**: seeded products; `/metrics` exposed.
- **cart**: per-user cart (JWT); `/checkout` posts webhook to `order`; `/metrics` exposed.
- **order**: receives webhook and stores orders; `/metrics` exposed.
- **client**: minimal React/Vite UI for login → catalog → cart → checkout.
- **prometheus** & **grafana** for monitoring.

## Quick start
```bash
cp .env.example .env
docker compose up --build
```
- Client: http://localhost:5173
- API via gateway: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

## Kubernetes (optional, later)
Apply manifests in `k8s/` to a local cluster (minikube/kind).

## Notes
- Single MongoDB with collections: `users`, `products`, `carts`, `orders`.
- Async is via **webhook** (Cart → Order). You can add Kafka/RabbitMQ later.
