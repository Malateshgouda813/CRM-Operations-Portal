export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';

export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export type MovementType = 'IN' | 'OUT';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    followUpNotes?: number;
    salesChallans?: number;
  };
  followUpNotes?: FollowUpNote[];
  salesChallans?: SalesChallan[];
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minimumStock: number;
  location: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: MovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category?: string;
    currentStock?: number;
    minimumStock?: number;
    location?: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface SalesChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number | string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    location: string;
  };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    businessName: string;
    mobile?: string;
    email?: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: Role;
  };
  items?: SalesChallanItem[];
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  draftChallans: number;
  confirmedChallans: number;
}

export interface DashboardActivity {
  recentChallans: SalesChallan[];
  lowStockProducts: Product[];
  recentMovements: StockMovement[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: any[];
}
