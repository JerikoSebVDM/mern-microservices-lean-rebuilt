# MERN Microservices (Lean Class Demo)

This project is a lean microservices e-commerce demo designed for coursework.
It shows clear **service boundaries**, **REST APIs**, **Docker/Kubernetes orchestration**, and **monitoring**.
The scope is trimmed to fit time/budget while still covering all rubric requirements.

---

## 🎯 Milestones & Deliverables

### ✅ Milestone 1: Core Services (20%)
- **Auth Service**: signup/login with JWT
- **Catalog Service**: seeded products
- **Cart Service**: per-user cart (secured with JWT)
- **Dockerised MongoDB**: single DB with per-service collections
- All services containerized with Docker

### ✅ Milestone 2: Gateway + Frontend (20%)
- **API Gateway**: reverse proxy for routing requests to services
- **React/Vite Client**: login → catalog → add to cart → checkout flow
- **Webhook**: checkout posts order event to Order service
- All runnable via docker compose up

### 🔜 Milestone 3: Orders + Monitoring (30%)
- **Order Service**: receives webhooks, persists orders
- **Prometheus** metrics exposed from each service
- **Grafana** dashboards for monitoring

### 🔜 Milestone 4: Async + K8s (30%)
- Kafka/RabbitMQ integration for async flows (shipping/payment demo)
- Kubernetes manifests for deployment

---

## 📂 Services Overview

- **gateway** → reverse proxy to internal services (/metrics exposed)
- **auth** → signup/login with JWT (/metrics exposed)
- **catalog** → seeded products (/metrics exposed)
- **cart** → per-user cart, /checkout posts webhook to order service (/metrics exposed)
- **order** → stores orders received via webhook (/metrics exposed)
- **client** → minimal React/Vite UI for login → catalog → cart → checkout
- **monitoring** → Prometheus + Grafana configs (to be enabled in Milestone 3)

---

## ⚡ Quick Start

### 1. Clone the repo
```sh
git clone https://github.com/JerikoSebVDM/mern-microservices-lean-rebuilt.git
cd mern-microservices-lean-rebuilt
