# Mini ERP + CRM Portal — System Architecture & Technical Design

This document details the high-level and component-level architecture, database schema, security model, and transactional business logic for the Mini ERP + CRM Operations Portal.

---

## 1. System Architecture Overview

```mermaid
graph TD
    Client[React 18 + TypeScript + Vite SPA]
    
    subgraph Network Layer
        AuthInterceptors[Axios HTTP Client with JWT Bearer Token]
    end

    subgraph Backend REST Services [Node.js + Express + TypeScript]
        Router[Express API Router /api]
        AuthMiddleware[JWT Authenticate & Authorize RBAC Middleware]
        Validators[Zod Request Payload Validators]
        Controllers[Feature Controllers]
        Services[Business Logic & Transaction Handlers]
        ErrorHandler[Centralized Global Error Handler]
    end

    subgraph Database Layer [PostgreSQL & Prisma ORM]
        PrismaClient[Prisma ORM Client]
        PostgresDB[(PostgreSQL Database)]
    end

    Client --> AuthInterceptors
    AuthInterceptors --> Router
    Router --> AuthMiddleware
    AuthMiddleware --> Validators
    Validators --> Controllers
    Controllers --> Services
    Services --> PrismaClient
    PrismaClient --> PostgresDB
    Controllers -.-> ErrorHandler
    Validators -.-> ErrorHandler
```

---

## 2. Authentication & JWT Flow

1. **Client Submission**: Client sends user email and plaintext password over HTTPS to `POST /api/auth/login`.
2. **Password Verification**: Backend compares the submitted password against the stored bcrypt hash (`bcryptjs.compare`).
3. **Token Issuance**: Upon successful verification, a signed JSON Web Token (JWT) is issued containing the user payload:
   ```json
   {
     "userId": "uuid-v4",
     "email": "user@example.com",
     "role": "ADMIN | SALES | WAREHOUSE | ACCOUNTS",
     "name": "User Display Name",
     "exp": 1786524800
   }
   ```
4. **Header Interception**: Frontend stores the JWT and automatically attaches `Authorization: Bearer <token>` to every subsequent REST request via Axios request interceptors.
5. **Session Expiry & 401 Handling**: When a token expires, the backend returns `401 Unauthorized`. The Axios response interceptor immediately clears client storage and redirects the user to the `/login` portal.

---

## 3. Role-Based Access Control (RBAC) Matrix

Backend endpoints strictly enforce authorization rules via the `authorize(...roles)` middleware. The frontend role-based UI is used solely for UX convenience; backend security never trusts client input.

| Resource / Action | Endpoint | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Authentication & Health** | `GET /api/health`, `/api/auth/me` | ✅ | ✅ | ✅ | ✅ |
| **Dashboard Metrics** | `GET /api/dashboard/*` | ✅ | ✅ | ✅ | ✅ |
| **View Customers** | `GET /api/customers`, `/:id` | ✅ | ✅ | ✅ | ✅ |
| **Manage Customers** | `POST`, `PUT`, `DELETE /api/customers` | ✅ | ✅ | ❌ | ❌ |
| **Log CRM Follow-ups** | `POST /api/customers/:id/follow-ups` | ✅ | ✅ | ❌ | ❌ |
| **View Products** | `GET /api/products`, `/:id` | ✅ | ✅ | ✅ | ✅ |
| **Manage Products** | `POST`, `PUT`, `DELETE /api/products` | ✅ | ❌ | ✅ | ❌ |
| **View Inventory Movements**| `GET /api/stock-movements` | ✅ | ✅ | ✅ | ✅ |
| **Log Stock Adjustments** | `POST /api/stock-movements` | ✅ | ❌ | ✅ | ❌ |
| **View Sales Challans** | `GET /api/challans`, `/:id` | ✅ | ✅ | ✅ | ✅ |
| **Create / Confirm Challan**| `POST /api/challans`, `/:id/confirm` | ✅ | ✅ | ❌ | ❌ |
| **Cancel Draft Challan** | `POST /api/challans/:id/cancel` | ✅ | ✅ | ❌ | ❌ |

---

## 4. Entity Relationship Model & Database Schema

```mermaid
erDiagram
    User ||--o{ FollowUpNote : "logs"
    User ||--o{ StockMovement : "records"
    User ||--o{ SalesChallan : "creates"
    Customer ||--o{ FollowUpNote : "has"
    Customer ||--o{ SalesChallan : "places"
    Product ||--o{ StockMovement : "tracks"
    Product ||--o{ SalesChallanItem : "referenced in"
    SalesChallan ||--|{ SalesChallanItem : "contains"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role
        datetime createdAt
        datetime updatedAt
    }

    Customer {
        string id PK
        string name
        string mobile
        string email
        string businessName
        string gstNumber
        CustomerType customerType
        string address
        CustomerStatus status
        datetime followUpDate
        string notes
        datetime createdAt
        datetime updatedAt
    }

    FollowUpNote {
        string id PK
        string customerId FK
        string note
        datetime followUpDate
        string createdById FK
        datetime createdAt
    }

    Product {
        string id PK
        string name
        string sku UK
        string category
        decimal unitPrice
        int currentStock
        int minimumStock
        string location
        datetime createdAt
        datetime updatedAt
    }

    StockMovement {
        string id PK
        string productId FK
        int quantity
        MovementType type
        string reason
        string createdById FK
        datetime createdAt
    }

    SalesChallan {
        string id PK
        string challanNumber UK
        string customerId FK
        int totalQuantity
        ChallanStatus status
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    SalesChallanItem {
        string id PK
        string challanId FK
        string productId FK
        string productNameSnapshot
        string skuSnapshot
        decimal unitPriceSnapshot
        int quantity
    }
```

---

## 5. Sales Challan Lifecycle & Atomic Transaction Logic

The sales challan workflow represents the core operational integrity of the system.

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales/Admin User
    participant Controller as Challan Controller
    participant DB as Prisma / PostgreSQL

    Note over User, DB: Phase A: Create Draft Challan
    User->>Controller: POST /api/challans (customerId, items: [{productId, quantity}])
    Controller->>DB: Query customer & products
    Controller->>DB: Generate sequential challanNumber (CH-YYYY-XXXXXX)
    Controller->>DB: Create SalesChallan (status: DRAFT) with SalesChallanItem snapshots
    Note right of DB: CRITICAL: Stock is NOT modified during DRAFT creation!
    Controller-->>User: 201 Created (Challan in DRAFT status)

    Note over User, DB: Phase B: Confirm Challan (Atomic Transaction)
    User->>Controller: POST /api/challans/:id/confirm
    Controller->>DB: BEGIN DATABASE TRANSACTION
    Controller->>DB: Lock & fetch current stock for ALL line items
    alt Any Item has currentStock < requested quantity
        Controller->>DB: ABORT / ROLLBACK TRANSACTION
        Controller-->>User: 400 Bad Request ("Insufficient stock for Product X. Available: A, Required: B")
        Note right of DB: Zero stock modified. Full rollback.
    else All items have sufficient stock
        Controller->>DB: Decrement product.currentStock for each item
        Controller->>DB: Create OUT StockMovement records with reference CH-YYYY-XXXXXX
        Controller->>DB: Update SalesChallan status = CONFIRMED
        Controller->>DB: COMMIT TRANSACTION
        Controller-->>User: 200 OK (Confirmed Challan & updated stock)
    end
```

### Safety Guarantees:
1. **Price Snapshots**: `SalesChallanItem` stores snapshot fields (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`). If master catalog prices change later, past challans retain their historical values.
2. **Atomic Rollback**: If a challan has 10 line items and item 10 fails the stock check, items 1 through 9 are **not** decremented. The transaction is completely rolled back.
3. **No Direct Stock Manipulation**: Master product catalog updates cannot alter `currentStock`. Inventory stock changes can only occur through verifiable `StockMovement` records or confirmed `SalesChallan` transactions.
