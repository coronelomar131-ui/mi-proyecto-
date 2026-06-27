import { z } from 'zod'

// CUSTOMERS
export const customerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(7, 'Teléfono inválido').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}([A-Z0-9]{3})?$/, 'RFC inválido').optional().or(z.literal('')),
  credit_limit: z.coerce.number().min(0, 'Crédito no puede ser negativo').max(999999, 'Máximo 999,999'),
})
export type CustomerFormData = z.infer<typeof customerSchema>

// PRODUCTS
export const productSchema = z.object({
  sku: z.string().min(1, 'SKU requerido').max(50),
  name: z.string().min(1, 'Nombre requerido').max(200),
  description: z.string().optional().or(z.literal('')),
  unit: z.string().min(1, 'Unidad requerida'),
  cost_price: z.coerce.number().min(0, 'Precio costo no puede ser negativo'),
  sale_price: z.coerce.number().min(0, 'Precio venta no puede ser negativo'),
  stock: z.coerce.number().min(0, 'Stock no puede ser negativo').int(),
  min_stock: z.coerce.number().min(0).int(),
  category_id: z.string().optional().or(z.literal('')),
})
export type ProductFormData = z.infer<typeof productSchema>

// SALE ITEM
export const saleItemSchema = z.object({
  product_id: z.string().uuid('Producto inválido'),
  quantity: z.coerce.number().min(1, 'Cantidad mínima: 1').int(),
  unit_price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0, 'Descuento no puede ser negativo').max(100, 'Descuento máximo 100%'),
})

// SALES
export const saleSchema = z.object({
  customer_id: z.string().uuid('Cliente requerido'),
  items: z.array(saleItemSchema).min(1, 'Agrega al menos un producto'),
  payment_method: z.enum(['efectivo', 'transferencia', 'credito', 'cheque']),
  notes: z.string().optional().or(z.literal('')),
})
export type SaleFormData = z.infer<typeof saleSchema>

// QUOTES
export const quoteSchema = z.object({
  customer_id: z.string().uuid('Cliente requerido'),
  items: z.array(saleItemSchema).min(1, 'Agrega al menos un producto'),
  valid_until: z.string().refine((date) => new Date(date) > new Date(), 'La fecha debe ser futura'),
  notes: z.string().optional().or(z.literal('')),
})
export type QuoteFormData = z.infer<typeof quoteSchema>

// SUPPLIERS
export const supplierSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  contact_name: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(7, 'Teléfono inválido').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  rfc: z.string().optional().or(z.literal('')),
  payment_terms: z.coerce.number().min(0).int().optional(),
})
export type SupplierFormData = z.infer<typeof supplierSchema>

// TRANSACTIONS
export const transactionSchema = z.object({
  type: z.enum(['ingreso', 'egreso']),
  category: z.string().min(1, 'Categoría requerida'),
  description: z.string().min(1, 'Descripción requerida').max(200),
  amount: z.coerce.number().min(0.01, 'Monto mínimo: 0.01'),
  reference: z.string().optional().or(z.literal('')),
  date: z.string().refine((date) => new Date(date) <= new Date(), 'La fecha no puede ser futura'),
})
export type TransactionFormData = z.infer<typeof transactionSchema>

// Helper to get first error message per field
export function getFieldErrors<T extends z.ZodTypeAny>(
  result: z.SafeParseReturnType<z.input<T>, z.output<T>>
): Partial<Record<string, string>> {
  if (result.success) return {}
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
  )
}
