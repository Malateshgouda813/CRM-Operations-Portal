# Mini ERP + CRM Operations Portal

> Enterprise-grade wholesale and distribution operations management portal featuring customer relationship management, catalog SKU governance, immutable inventory ledgers, and transactional sales challan confirmation.

---

## 1. Project Overview

The **Mini ERP + CRM Operations Portal** is a production-ready full-stack application built for wholesale/distribution companies. It provides unified operational control across internal teams—Sales, Warehouse, Accounts, and System Administrators.

The portal provides an end-to-end dispatch and customer pipeline workflow:
- **CRM & Follow-ups**: Customer directories, pipeline status tracking, and follow-up logging.
- **Product Catalog**: SKU management, safety stock thresholds, and low-stock alerting.
- **Inventory Ledger**: Complete stock audit trail with IN/OUT movements and non-negative stock constraints.
- **Sales Challans**: Dynamic line-item dispatch challans with price snapshots and atomic database transactions.
- **Role-Based Access Control**: Strict backend-enforced permissions across 4 distinct corporate roles.

---

## 2. Business Context & Roles

Wholesale operations demand high consistency: sales teams book consignments, warehouse teams manage physical inventory, and accounts audit billing. This system coordinates these departments through strict business rules:

| Role | Primary Responsibilities | Permissions |
| :--- | :--- | :--- |
| **ADMIN** | System management, user oversight, full access | Full CRUD on all modules |
| **SALES** | Customer management, pipeline follow-ups, order booking | Customers, Follow-ups, Create/Confirm Challans |
| **WAREHOUSE** | Stock intake, product catalog, inventory movements | Products, Inventory Adjustments, View Orders |
| **ACCOUNTS** | Audit, compliance, commercial review | Read-only reporting across Customers & Challans |

---

## 3. Key Features

- **Authentication & RBAC**: Stateless JWT auth with bcrypt password hashing and backend route guards.
- **Live Operations Dashboard**: High-level KPIs (Total Customers, Products, Low Stock Alerts, Draft & Confirmed Challans), recent challans, and stock activity.
- **Customer CRM**: Pagination, search by name/mobile/business, filters by type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`) and status (`LEAD`, `ACTIVE`, `INACTIVE`), plus follow-up timeline logging.
- **Product Catalog & Safety Alerts**: Low-stock automatic detection (`currentStock <= minimumStock`), category filters, and location mapping.
- **Traceable Inventory Ledger**: Every inventory change creates an immutable `StockMovement` record with reason and user attribution. Direct unauthorized stock tampering is prohibited.
- **Transactional Sales Challans**:
  - Automatically generates formatted challan numbers (`CH-2026-000001`).
  - Draft creation saves line-item snapshots **without altering stock**.
  - Challan confirmation executes an **atomic database transaction**: verifies stock across all line items, deducts inventory, generates `OUT` stock movements, and marks the challan confirmed. If any item is short on stock, the entire transaction rolls back cleanly.

---

## 4. Technology Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Validation**: Zod schema validation
- **Middleware**: CORS, Morgan logger, centralized error handler

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Tooling / Bundler**: Vite
- **Routing**: React Router DOM (v6)
- **API Client**: Axios (with JWT interceptors)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with custom design system and responsive media queries

---

## 5. Folder Structure

```
minierpcrm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma data models and relations
│   │   └── seed.ts               # Database seeder (Users, Customers, Products, Stock)
│   ├── src/
│   │   ├── config/               # Environment & Prisma client configuration
│   │   ├── controllers/          # Request handlers (Auth, Customer, Product, Inventory, Challan, Dashboard)
│   │   ├── middleware/           # JWT authentication, RBAC, and error handlers
│   │   ├── routes/               # Modular Express API route definitions
│   │   ├── services/             # Core business logic helpers
│   │   ├── tests/                # Automated backend integration test suite
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── utils/                # Response builders and Challan ID generators
│   │   ├── validators/           # Zod payload validation schemas
│   │   ├── app.ts                # Express app configuration & middleware
│   │   └── server.ts             # HTTP server entrypoint
│   ├── .env.example              # Backend environment template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI (Button, Input, Select, Modal, Badge, Table, Pagination)
│   │   │   └── layout/           # DashboardLayout, Sidebar, Header, ProtectedRoute
│   │   ├── context/              # AuthContext & useAuth provider
│   │   ├── pages/                # Login, Dashboard, Customers, Products, Inventory, Challans
│   │   ├── services/             # Axios API client modules
│   │   ├── types/                # Frontend TypeScript types
│   │   ├── App.tsx               # Route definitions & guards
│   │   ├── index.css             # Unified CSS tokens & design system
│   │   └── main.tsx              # React DOM root
│   ├── .env.example              # Frontend environment template
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md           # Detailed architecture, ER diagrams, transaction flows
│   ├── FINAL_AUDIT.md            # Comprehensive requirement-by-requirement audit
│   └── postman/                  # Ready-to-import Postman collection
├── .gitignore
└── README.md
```

---

## 6. Database Models

1. **User**: `id`, `name`, `email` (unique), `passwordHash`, `role` (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`), timestamps.
2. **Customer**: `id`, `name`, `mobile`, `email`, `businessName`, `gstNumber`, `customerType` (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), `address`, `status` (`LEAD`, `ACTIVE`, `INACTIVE`), `followUpDate`, `notes`, timestamps.
3. **FollowUpNote**: `id`, `customerId`, `note`, `followUpDate`, `createdById`, `createdAt`.
4. **Product**: `id`, `name`, `sku` (unique), `category`, `unitPrice` (Decimal 12,2), `currentStock`, `minimumStock`, `location`, timestamps.
5. **StockMovement**: `id`, `productId`, `quantity`, `type` (`IN`, `OUT`), `reason`, `createdById`, `createdAt`.
6. **SalesChallan**: `id`, `challanNumber` (unique), `customerId`, `totalQuantity`, `status` (`DRAFT`, `CONFIRMED`, `CANCELLED`), `createdById`, timestamps.
7. **SalesChallanItem**: `id`, `challanId`, `productId`, `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot` (Decimal 12,2), `quantity`.

---

## 7. Demo Accounts & Credentials

The database seeder provisions demo users for each corporate role with a standard test password:

| Role | Email Address | Password | Default Portal Access |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@example.com` | `Demo@12345` | Full administrative access |
| **Sales Officer** | `sales@example.com` | `Demo@12345` | Customers, CRM follow-ups, Challans |
| **Warehouse Manager** | `warehouse@example.com` | `Demo@12345` | Product catalog, Inventory movements |
| **Accounts Officer** | `accounts@example.com` | `Demo@12345` | Financial audits, reporting, read-only |

---

## 8. Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **npm**: v9.x or later
- **PostgreSQL**: v14+ (Local instance, Docker container, or cloud PostgreSQL like Supabase/Neon)

### Step 1: Clone and Configure Environment Files

1. Backend configuration:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `backend/.env` with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/minierpcrm?schema=public"
   JWT_SECRET="super-secret-jwt-key-minierp-2026-change-in-production"
   PORT=5000
   FRONTEND_URL="http://localhost:5173"
   NODE_ENV="development"
   ```

2. Frontend configuration:
   ```bash
   cd ../frontend
   cp .env.example .env
   ```
   Edit `frontend/.env`:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```

### Step 2: Install Dependencies

```bash
# In backend directory:
cd ../backend
npm install

# In frontend directory:
cd ../frontend
npm install
```

### Step 3: Run Database Migrations and Seed Data

```bash
cd ../backend
# Generate Prisma Client
npm run prisma:generate

# Apply Database Migrations
npx prisma migrate dev --name init

# Seed Demo Users, Customers, Products, and Stock Movements
npm run prisma:seed
```

### Step 4: Run the Development Servers

1. Start the Backend REST API (Port 5000):
   ```bash
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the Frontend (Port 5173):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser at **`http://localhost:5173`** and log in with any demo credentials or use the one-click quick-fill buttons.

---

## 9. API Endpoints Reference

All endpoints return uniform response shapes:
- **Success**: `{ "success": true, "data": ..., "meta"?: { "page": 1, "limit": 10, "total": 45, "totalPages": 5 } }`
- **Error**: `{ "success": false, "message": "...", "errors"?: [...] }`

### Health & Auth
- `GET  /api/health` — System health check & uptime
- `POST /api/auth/login` — Authenticate user and receive JWT
- `GET  /api/auth/me` — Retrieve current authenticated user profile

### Customer CRM
- `GET    /api/customers` — List customers with pagination, search, and type/status filters
- `GET    /api/customers/:id` — Customer detail, recent orders, and follow-ups
- `POST   /api/customers` — Create customer profile
- `PUT    /api/customers/:id` — Update customer details
- `DELETE /api/customers/:id` — Delete customer (blocked if orders exist)
- `GET    /api/customers/:id/follow-ups` — List customer follow-up notes
- `POST   /api/customers/:id/follow-ups` — Log follow-up note and set next date

### Product Catalog
- `GET    /api/products` — List products with SKU/name search, category, and `lowStock` filter
- `GET    /api/products/categories` — Get distinct product categories
- `GET    /api/products/:id` — Product detail and movement history
- `POST   /api/products` — Create product and optional initial stock intake
- `PUT    /api/products/:id` — Update product details (pricing, minimum threshold, location)
- `DELETE /api/products/:id` — Delete product (blocked if movements exist)

### Inventory & Stock Movements
- `GET  /api/stock-movements` — Query audit ledger with filters
- `POST /api/stock-movements` — Record `IN` or `OUT` stock adjustment (atomic verification)

### Sales Challans
- `GET    /api/challans` — Query sales challans by status, customer, or search
- `GET    /api/challans/:id` — Challan detail with line item snapshots
- `POST   /api/challans` — Create draft challan (**does NOT deduct stock**)
- `PUT    /api/challans/:id` — Update draft challan items
- `POST   /api/challans/:id/confirm` — **Confirm challan via atomic transaction**
- `POST   /api/challans/:id/cancel` — Cancel draft challan

### Dashboard Analytics
- `GET /api/dashboard/stats` — High-level metric counts
- `GET /api/dashboard/recent-activity` — Recent challans, low-stock alerts, recent movements

---

## 10. Postman API Collection

A complete Postman collection is provided in `docs/postman/Mini-ERP-CRM.postman_collection.json`.

To import:
1. Open Postman -> Click **Import** -> Select `docs/postman/Mini-ERP-CRM.postman_collection.json`.
2. The collection uses variables `{{baseUrl}}` (defaults to `http://localhost:5000/api`) and `{{token}}`.
3. Executing the **Login - Admin Role** request automatically captures and saves the JWT token into collection variables.

---

## 11. Testing & Verification

Run the automated integration test suite to verify end-to-end database operations, stock constraints, and atomic transaction rollbacks:

```bash
cd backend
npm run test:integration
```

### Verified Test Cases:
1. Role-based login and password hash comparison (`bcrypt`).
2. JWT signature validation and unauthorized role rejection.
3. Customer creation, search, filter, and CRM follow-up logging.
4. Product SKU uniqueness and low-stock detection (`currentStock <= minimumStock`).
5. Inventory IN increment and OUT validation (blocking negative stock).
6. **Core Challan Flow**:
   - Draft creation leaves inventory unchanged.
   - Insufficient stock rejects confirmation and rolls back completely with 0 stock change.
   - Successful confirmation deducts stock atomically and creates OUT movements.
   - Duplicate confirmation prevention and cancellation safety.

---

## 12. Deployment Preparation

### Backend (Render / Railway)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run prisma:deploy && npm start`
- **Environment Variables**:
  - `DATABASE_URL`: Hosted PostgreSQL connection URL (e.g. Supabase or Neon)
  - `JWT_SECRET`: Secure 64-character random string
  - `NODE_ENV`: `production`
  - `PORT`: `10000` (or assigned by host)
  - `FRONTEND_URL`: Hosted frontend URL for CORS (e.g. `https://minierpcrm.vercel.app`)

### Frontend (Vercel / Netlify)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Backend production REST URL (e.g. `https://minierpcrm-api.onrender.com/api`)

---

## 13. Known Limitations & Future Enhancements

- **PDF Invoices & Thermal Challans**: Currently supports browser print layout; dedicated PDF rendering via PDFKit can be added.
- **Multi-Warehouse Transfers**: Currently models bin/rack locations; can be expanded to multi-facility inventory transfers.
- **Barcoding / QR Scanning**: Frontend camera SKU barcode scanning for quick stock intake.
