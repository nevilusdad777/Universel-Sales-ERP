# 🏢 Universal Sales ERP

A full-stack ERP system for managing the complete B2B sales cycle — from quotations through to invoicing and payments — with role-based access control, real-time dashboard analytics, and inventory tracking.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Seed Data & Demo Users](#-seed-data--demo-users)
- [Role-Based Access Control](#-role-based-access-control)
- [Business Rules](#-business-rules)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)

---

## 🛠 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS            |
| Backend    | Node.js 20, Express 4                   |
| Database   | PostgreSQL 15                           |
| ORM        | Prisma 5                                |
| Auth       | JWT Access + Refresh Tokens (httpOnly)  |
| Dev Server | Vite (frontend) + Nodemon (backend)     |

---

## 🛠 Features & Capabilities

- **Complete B2B Sales Flow:** Quotations → Sales Orders → Invoices → Payments.
- **Dual-Token Authentication (JWT + Refresh Tokens):** Short-lived access token (15 mins) with httpOnly refresh token stored in DB for silent auto-refresh on `401 Unauthorized` and revocation on logout.
- **PDF Generation & Printing:** Dedicated PDF export endpoint (`pdfkit`) and clean, isolated A4 printable invoice utility.
- **Inventory Audit:** Automated stock increment/decrement transactions and low-stock alerts.

---

## 🏗 Architecture

```
US ERP/
├── backend/          # Express REST API
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── src/
│       ├── controllers/    # Route handlers (business logic)
│       ├── middlewares/    # Auth guard, role guard
│       ├── routes/         # Express route definitions
│       ├── utils/          # Prisma client, helpers
│       └── seed.js         # Database seeder
└── frontend/         # React SPA
    └── src/
        ├── components/     # Shared UI components (Sidebar, Navbar, etc.)
        ├── context/        # AuthContext (user state, login/logout)
        ├── pages/          # Page-level components
        └── services/       # Axios API client
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 15 (running locally or via Docker)
- npm ≥ 9

### 1. Clone the repository

```bash
git clone <repo-url>
cd "US ERP"
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
npm install
npx prisma db push        # Sync schema → database
node src/seed.js          # Populate demo data
npm run dev               # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Ensure VITE_API_URL matches your backend port
npm install
npm run dev               # Starts on http://localhost:5173
```

---

## 🌱 Seed Data & Demo Users

Run `node src/seed.js` from the `backend/` directory. It is **idempotent** — safe to re-run; it clears all existing data first.

### Demo Users

| Role            | Email                    | Password    |
|-----------------|--------------------------|-------------|
| Super Admin     | admin@us-erp.com         | admin123    |
| Manager         | manager@us-erp.com       | manager123  |
| Sales Executive | sales@us-erp.com         | sales123    |

### Seeded Data

| Entity        | Count | Notes                                          |
|---------------|-------|------------------------------------------------|
| Categories    | 3     | Electronics, Furniture, Office Supplies        |
| Products      | 9     | 4 items below minimum stock (low-stock alerts) |
| Customers     | 4     | 2 assigned to Sales Exec, 1 to Manager, 1 unassigned |
| Quotations    | 3     | DRAFT, SENT (expired), APPROVED                |
| Orders        | 1     | `ORD-2026-0001` in PROCESSING status           |
| Invoices      | 1     | `INV-2026-0001` with a partial payment         |
| Payments      | 1     | ₹500 partial against `INV-2026-0001`           |

The seeded chain (`QT-2026-0003 → ORD-2026-0001 → INV-2026-0001 → ₹500 payment`) ensures the Dashboard shows non-zero revenue and outstanding balance on first launch.

---

## 🔐 Role-Based Access Control

| Feature                         | Super Admin | Manager | Sales Executive    |
|---------------------------------|-------------|---------|-------------------|
| View all customers              | ✅          | ✅      | Own customers only |
| Create / edit customers         | ✅          | ✅      | ✅                |
| Delete customers                | ✅          | ✅      | ❌                |
| View all quotations             | ✅          | ✅      | Own only          |
| Approve / reject quotations     | ✅          | ✅      | ❌                |
| View all orders                 | ✅          | ✅      | Own only          |
| Cancel orders                   | ✅          | ✅      | ❌                |
| Manage products & categories    | ✅          | ✅      | View only         |
| View dashboard                  | ✅          | ✅      | ✅ (scoped data)  |
| User management                 | ✅          | ❌      | ❌                |

---

## 📐 Business Rules

1. **Rule 1 – Customer Soft Delete**: Customers are never hard-deleted; `isDeleted` flag is set.
2. **Rule 2 – Quotation → Order**: An order can only be created from an **APPROVED** quotation. One quotation produces at most one order.
3. **Rule 3 – Order items copy**: Order items are copied from the quotation at creation time (snapshot).
4. **Rule 4 – Invoice from Order**: An invoice is generated from a delivered/processing order. One order → one invoice.
5. **Rule 5 – Order cancellation**: Only orders in PENDING or PROCESSING status can be cancelled (stock is restored).
6. **Rule 6 – Payment tracking**: Payments are recorded against invoices. Total payments are summed to derive balance.
7. **Rule 7 – Low stock alert**: Products where `currentStock < minimumStock` are flagged and highlighted in the UI.
8. **Rule 8 – Sales Executive scoping**: Sales Executives only see customers, quotations, and orders assigned to them.
9. **Rule 9 – Quotation expiry**: On every GET, quotations with `validTill < now` and status SENT/DRAFT are automatically flipped to EXPIRED.
10. **Rule 10 – Stock decrement on order**: Stock is decremented when an order is created.
11. **Rule 11 – Stock restore on cancel**: Stock is restored when an order is cancelled.
12. **Rule 12 – Product status**: Inactive products cannot be added to new quotations.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

All endpoints (except `/auth/login`) require `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| POST   | `/auth/login`     | Login, returns JWT   |
| GET    | `/auth/profile`   | Get current user     |

### Dashboard

| Method | Endpoint          | Description                         |
|--------|-------------------|-------------------------------------|
| GET    | `/dashboard`      | Stats, low-stock, recent orders     |

### Customers

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/customers`          | List all (scoped by role)    |
| POST   | `/customers`          | Create customer               |
| GET    | `/customers/:id`      | Get single customer          |
| PUT    | `/customers/:id`      | Update customer              |
| DELETE | `/customers/:id`      | Soft-delete customer         |

### Products

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/products`           | List all products            |
| POST   | `/products`           | Create product               |
| GET    | `/products/:id`       | Get single product           |
| PUT    | `/products/:id`       | Update product               |
| DELETE | `/products/:id`       | Delete product               |

### Categories

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/categories`         | List all categories          |
| POST   | `/categories`         | Create category              |
| DELETE | `/categories/:id`     | Delete category              |

### Quotations

| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/quotations`                 | List all (scoped by role)            |
| POST   | `/quotations`                 | Create quotation (DRAFT)             |
| GET    | `/quotations/:id`             | Get single quotation                 |
| PUT    | `/quotations/:id`             | Update quotation                     |
| PATCH  | `/quotations/:id/approve`     | Approve quotation                    |
| PATCH  | `/quotations/:id/reject`      | Reject quotation                     |
| DELETE | `/quotations/:id`             | Delete quotation (DRAFT only)        |

### Sales Orders

| Method | Endpoint                      | Description                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/orders`                     | List all orders (scoped by role)         |
| POST   | `/orders`                     | Create order from approved quotation     |
| GET    | `/orders/:id`                 | Get single order                         |
| PATCH  | `/orders/:id/status`          | Update order status                      |
| PATCH  | `/orders/:id/cancel`          | Cancel order (restores stock)            |

### Invoices

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| GET    | `/invoices`           | List all invoices               |
| POST   | `/invoices`           | Create invoice from order       |
| GET    | `/invoices/:id`       | Get single invoice with payments|
| GET    | `/invoices/:id/pdf`   | Download generated invoice PDF  |

### Payments

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| GET    | `/payments`           | List all payments               |
| POST   | `/payments`           | Record payment against invoice  |
| GET    | `/payments/:id`       | Get single payment              |

### Inventory

| Method | Endpoint                    | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| GET    | `/inventory/transactions`   | Paginated stock movement audit transactions |
| GET    | `/inventory/low-stock`      | List products with currentStock < minimumStock|

---

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma        # All models: User, Customer, Product, Category,
│                            #   Quotation, Order, Invoice, Payment, StockTransaction
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── customer.controller.js
│   │   ├── product.controller.js
│   │   ├── category.controller.js
│   │   ├── quotation.controller.js
│   │   ├── order.controller.js
│   │   ├── invoice.controller.js
│   │   └── payment.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification
│   │   └── role.middleware.js    # Role-based guard
│   ├── routes/                   # One file per resource
│   ├── utils/
│   │   └── prisma.js            # Shared Prisma client
│   ├── index.js                  # Express app + route mounting
│   └── seed.js                   # Database seeder
├── .env.example
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # Shell with Sidebar + Navbar
│   │   ├── Sidebar.jsx
│   │   └── PrivateRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx      # JWT storage, user state
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── Products.jsx
│   │   └── Quotations.jsx
│   ├── services/
│   │   └── api.js               # Axios instance (auto-attaches JWT)
│   └── App.jsx                  # Route definitions
├── .env.example
└── package.json
```

---

## 🧪 Running in Development

```bash
# Terminal 1 – Backend
cd backend && npm run dev

# Terminal 2 – Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

---

## 📦 Re-seeding

To reset all data and start fresh:

```bash
cd backend
node src/seed.js
```

> ⚠️ This **deletes all existing data** before inserting fresh seed records.
