export type UserRole = 'admin' | 'vendedor' | 'almacen'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  plan: 'starter' | 'pro' | 'enterprise'
  subscription_status?: 'trial' | 'active' | 'past_due' | 'canceled'
  trial_ends_at?: string
  subscription_ends_at?: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  organizations?: { name: string; plan: string }
}

export interface Customer {
  id: string
  organization_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  rfc?: string
  credit_limit: number
  balance: number
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  organization_id: string
  name: string
  description?: string
  created_at: string
}

export interface Product {
  id: string
  organization_id: string
  category_id?: string
  sku: string
  barcode?: string
  name: string
  description?: string
  unit: string
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  product?: Product
}

export type SaleStatus = 'pendiente' | 'confirmada' | 'entregada' | 'cancelada'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'credito' | 'cheque'

export interface Sale {
  id: string
  organization_id: string
  customer_id: string
  user_id: string
  folio: string
  status: SaleStatus
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  tax: number
  total: number
  notes?: string
  cfdi_status?: string
  cfdi_uuid?: string
  cfdi_xml?: string
  created_at: string
  updated_at: string
  customer?: Customer
  items?: SaleItem[]
  created_by?: Profile
}

export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida'

export interface QuoteItem {
  id: string
  quote_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  product?: Product
}

export interface Quote {
  id: string
  organization_id: string
  customer_id: string
  user_id: string
  folio: string
  status: QuoteStatus
  valid_until: string
  subtotal: number
  discount: number
  tax: number
  total: number
  notes?: string
  payment_link_url?: string
  payment_link_id?: string
  payment_link_exp?: string
  created_at: string
  updated_at: string
  customer?: Customer
  items?: QuoteItem[]
}

export type DeliveryStatus = 'pendiente' | 'en_ruta' | 'entregado' | 'fallido'

export interface Delivery {
  id: string
  organization_id: string
  sale_id: string
  assigned_to?: string
  status: DeliveryStatus
  scheduled_date?: string
  delivered_at?: string
  address: string
  notes?: string
  created_at: string
  updated_at: string
  sale?: Sale
  assignee?: Profile
}

export interface Supplier {
  id: string
  organization_id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  rfc?: string
  payment_terms?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PurchaseStatus = 'pendiente' | 'recibida' | 'parcial' | 'cancelada'

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_cost: number
  received_qty: number
  subtotal: number
  product?: Product
}

export interface Purchase {
  id: string
  organization_id: string
  supplier_id: string
  folio: string
  status: PurchaseStatus
  subtotal: number
  tax: number
  total: number
  expected_date?: string
  received_at?: string
  notes?: string
  created_at: string
  updated_at: string
  supplier?: Supplier
  items?: PurchaseItem[]
}

export interface Transaction {
  id: string
  organization_id: string
  type: 'ingreso' | 'egreso'
  category: string
  description: string
  amount: number
  reference?: string
  date: string
  created_at: string
}

export interface KPIData {
  ventasHoy: number
  ventasMes: number
  clientesActivos: number
  productosStockBajo: number
  cotizacionesPendientes: number
  entregasHoy: number
  ingresosHoy: number
  ingresosMes: number
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
  badge?: number
}
