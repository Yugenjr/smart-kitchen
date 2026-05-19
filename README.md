# Smart Kitchen System

A production-style microservices-based Smart Kitchen platform built for learning scalable backend and cloud-native architecture.

This project focuses on building a complete distributed system step-by-step using modern backend engineering practices instead of building a monolithic CRUD application.

The system combines:

* kitchen management
* grocery tracking
* nutrition planning
* AI-powered recommendations
* budget analytics
* microservices communication
* cloud-native deployment

---

# Project Goals

This project is intentionally designed to learn:

* Microservice Architecture
* API-first backend development
* Event-driven systems
* Distributed authentication
* PostgreSQL integration
* Docker & Kubernetes
* Kafka messaging
* CI/CD pipelines
* Production deployment workflows
* Clean backend architecture
* Service isolation and communication

The focus is not just making features work.

The focus is understanding:

* how services communicate
* how systems scale
* how infrastructure is wired
* how production backend systems are structured

---

# High-Level Architecture

```text
Frontend (Next.js)
        |
        v
API Gateway
        |
------------------------------------------------
|        |          |          |               |
Auth   Grocery   Nutrition   Recipe      AI Planner
Service Service    Service    Service      Service
        |
        v
Kafka Event Bus
        |
------------------------------------------------
|                    |                         |
Notifications   Analytics Service      Recommendation Engine
```

---

# Current Progress

## Completed

### Auth Service

* JWT authentication
* Signup & Login APIs
* Protected routes
* PostgreSQL integration
* Supabase database
* Password hashing with bcrypt
* Swagger API docs
* DTO validation
* NestJS modular architecture

---

# Planned Services

## 1. Auth Service

Handles:

* user authentication
* JWT generation
* authorization
* protected route validation

Tech:

* NestJS
* PostgreSQL
* Passport JWT
* bcrypt

Status:
✅ Completed (V1)

---

## 2. Grocery Service

Handles:

* pantry inventory
* grocery tracking
* expiry management
* stock monitoring
* monthly spending

Planned Features:

* expiry alerts
* low-stock alerts
* analytics
* user-specific inventory

---

## 3. Nutrition Service

Handles:

* daily nutrition tracking
* calorie monitoring
* protein/fat/carb analysis
* dietary planning

---

## 4. Recipe Service

Handles:

* recipe management
* ingredient matching
* cooking recommendations
* recipe search

---

## 5. AI Planner Service

Handles:

* AI-powered meal planning
* grocery optimization
* budget-aware recommendations
* nutrition balancing

Will later integrate:

* OpenAI APIs
* recommendation pipelines

---

## 6. Notification Service

Handles:

* expiry reminders
* budget alerts
* meal reminders
* low-stock notifications

---

# Tech Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS

---

## Backend

* NestJS
* TypeScript
* TypeORM
* PostgreSQL

---

## Authentication

* JWT
* Passport
* bcrypt

---

## Database

* Supabase PostgreSQL

---

## API Documentation

* Swagger

---

## Infrastructure (Planned)

* Docker
* Kubernetes
* Kafka
* Zookeeper
* AWS

---

## CI/CD (Planned)

* GitHub Actions
* AWS Deployment Pipelines

---

# Repository Structure

```text
Smart-Kitchen/
│
├── frontend/
│
├── backend/
│   ├── auth-service/
│   ├── grocery-service/
│   ├── nutrition-service/
│   └── recipe-service/
│
├── infra/
│
├── docs/
│   ├── frontend/
│   └── backend/
│
└── README.md
```

---

# Microservice Philosophy

Each service is designed to be:

* independently deployable
* independently scalable
* independently testable
* domain-specific

Each service owns:

* its own logic
* its own APIs
* its own database responsibilities

Services communicate using:

* HTTP (synchronous communication)
* Kafka events (asynchronous communication)

---

# Development Workflow

The project follows:

* feature branching
* modular development
* isolated services
* API-first design

Example branches:

```text
feature/auth-service
feature/grocery-service
feature/kafka-integration
feature/api-gateway
```

---

# Current Backend Architecture Pattern

Every backend service follows:

```text
Controller
→ receives requests

Service
→ business logic

Repository / ORM
→ database access

Entity
→ database blueprint

DTO
→ request validation

Guard
→ route protection

Strategy
→ authentication validation
```

---

# API-First Development

The backend is designed first before frontend integration.

Swagger documentation is used for:

* endpoint testing
* API validation
* contract documentation
* frontend-backend integration

---

# Security Practices

Implemented:

* bcrypt password hashing
* JWT authentication
* DTO validation
* protected routes
* environment variables

Planned:

* refresh tokens
* RBAC
* rate limiting
* API throttling
* centralized exception filters

---

# Environment Variables

Each service maintains its own `.env`.

Example:

```env
DATABASE_URL=
JWT_SECRET=
PORT=
```

`.env` files are never committed.

---

# Future Infrastructure Roadmap

## Phase 1

✅ Auth Service

---

## Phase 2

* Grocery Service
* Nutrition Service
* Recipe Service

---

## Phase 3

* Kafka event-driven communication
* asynchronous workflows

---

## Phase 4

* API Gateway
* centralized routing
* authentication middleware

---

## Phase 5

* Dockerization
* container orchestration

---

## Phase 6

* Kubernetes deployment
* service scaling
* ingress setup

---

## Phase 7

* AWS deployment
* CI/CD pipelines
* monitoring & logging

---

# Learning Focus

This project is intentionally built to deeply understand:

* backend architecture
* distributed systems
* microservices communication
* dependency injection
* cloud-native deployment
* scalable service design

The goal is not rapid feature generation.

The goal is understanding how production backend systems are actually engineered.

---

# Current Status

Auth Service:
✅ Stable

Next Focus:
➡ Grocery Service

---

# Author

Built as a deep backend engineering and distributed systems learning project.

Focused on:

* scalable architecture
* clean backend engineering
* production-style infrastructure
* real-world system design
