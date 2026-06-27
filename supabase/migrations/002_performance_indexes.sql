-- Performance indexes for high-query tables

-- Customers
create index if not exists idx_customers_org_active on customers(organization_id, is_active);
create index if not exists idx_customers_name_trgm on customers using gin(name gin_trgm_ops);

-- Sales
create index if not exists idx_sales_org_created on sales(organization_id, created_at desc);
create index if not exists idx_sales_org_customer on sales(organization_id, customer_id);
create index if not exists idx_sales_org_status on sales(organization_id, status);
create index if not exists idx_sales_folio on sales(organization_id, folio);
create index if not exists idx_sales_user on sales(user_id);

-- Sale items
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_sale_items_product on sale_items(product_id);

-- Products
create index if not exists idx_products_org_active on products(organization_id, is_active);
create index if not exists idx_products_low_stock on products(organization_id) where stock <= min_stock;
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_name_trgm on products using gin(name gin_trgm_ops);
create index if not exists idx_products_sku on products(organization_id, sku);

-- Quotes
create index if not exists idx_quotes_org_status on quotes(organization_id, status);
create index if not exists idx_quotes_valid_until on quotes(organization_id, valid_until);
create index if not exists idx_quotes_customer on quotes(customer_id);

-- Deliveries
create index if not exists idx_deliveries_org_status on deliveries(organization_id, status);
create index if not exists idx_deliveries_scheduled on deliveries(organization_id, scheduled_date);

-- Transactions
create index if not exists idx_transactions_org_date on transactions(organization_id, date desc);
create index if not exists idx_transactions_type on transactions(organization_id, type);

-- Profiles
create index if not exists idx_profiles_org on profiles(organization_id);
