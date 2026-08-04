# Ordering System

A modern, full-stack ordering platform designed to manage orders, products, users, and analytics in a microservices-based architecture. The project combines a React frontend with multiple backend services for authentication, ordering, inventory, notifications, and analytics.

## ✨ Features

- User registration and authentication
- Order creation and order tracking
- Product and inventory management
- Admin-friendly dashboard views
- Analytics and reporting support
- Event-driven communication using Kafka
- MongoDB persistence with outbox/event processing
- Responsive user interface built with React and Material UI

## 🛠️ Technologies Used

- Frontend: React, Vite, Material UI, Axios
- Backend: Node.js, Express-style service architecture
- Messaging: Kafka
- Database: MongoDB
- DevOps/Infrastructure: Docker Compose
- Security: Token-based authentication and role-aware access

## 🚀 Installation and Running

### Prerequisites

- Node.js and npm
- Docker Desktop

### 1. Clone the repository

```bash
git clone <repository-url>
cd ordering-system
```

### 2. Start the infrastructure services

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts MongoDB, Kafka, Mongo Express, and Kafka UI.

### 3. Install dependencies

```bash
npm install --prefix frontend
npm install --prefix backend/authentication-service
npm install --prefix backend/order-service
npm install --prefix backend/inventory-service
npm install --prefix backend/analytics-service
npm install --prefix backend/notification-service
npm install --prefix backend/shared
```

### 4. Start the services

Run the backend services in separate terminals:

```bash
cd backend/authentication-service && npm run dev
cd backend/order-service && npm run dev
cd backend/inventory-service && npm run dev
cd backend/analytics-service && npm run dev
cd backend/notification-service && npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

### 5. MongoDB Compass

Use this connection string:

```text
mongodb://localhost:27018/ordering_system?directConnection=true&retryWrites=true&w=majority
```

The main collections include:

- `orders`
- `products`
- `analytics`
- `processedevents`
- `outboxevents`
- `users`

If Compass is already connected to an older standalone instance on port `27017`, reconnect using the URI above and refresh the database tree.

## 👤 Author

Developed by Sushreeta Sahu

GitHub: [12Sushree](https://github.com/12Sushree)
