-- =============================================================
-- GestorPro — Schema inicial con Row Level Security
-- Multi-tenant: cada organización ve solo sus propios datos
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- ORGANIZATIONS
-- =============================================================
create table if not exists organizations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  logo_url      text,
  plan          text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table organizations enable row level security;

create policy "org_members_select" on organizations
  for select using (
    id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

-- =============================================================
-- PROFILES (extends auth.users)
-- =============================================================
create table if not exists profiles (
  id              uuid primary key references auth.users on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  email           text not null,
  full_name       text not null,
  avatar_url      text,
  role            text not null default 'vendedor' check (role in ('admin', 'vendedor', 'almacen')),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own_org" on profiles
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "admin_update_profiles" on profiles
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.organization_id = profiles.organization_id
        and p.role = 'admin'
    )
  );

-- =============================================================
-- CATEGORIES
-- =============================================================
create table if not exists categories (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  name            text not null,
  description     text,
  created_at      timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories_org_select" on categories
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "categories_org_insert" on categories
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "categories_org_update" on categories
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "categories_org_delete" on categories
  for delete using (organization_id = (select organization_id from profiles where id = auth.uid()));

-- =============================================================
-- PRODUCTS
-- =============================================================
create table if not exists products (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  category_id     uuid references categories on delete set null,
  sku             text not null,
  name            text not null,
  description     text,
  unit            text not null default 'pieza',
  cost_price      numeric(12,2) not null default 0,
  sale_price      numeric(12,2) not null default 0,
  stock           integer not null default 0,
  min_stock       integer not null default 5,
  image_url       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, sku)
);

alter table products enable row level security;

create policy "products_org_select" on products
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "products_org_insert" on products
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "products_org_update" on products
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "products_org_delete" on products
  for delete using (
    organization_id = (select organization_id from profiles where id = auth.uid())
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- CUSTOMERS
-- =============================================================
create table if not exists customers (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  city            text,
  rfc             text,
  credit_limit    numeric(12,2) not null default 0,
  balance         numeric(12,2) not null default 0,
  tags            text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table customers enable row level security;

create policy "customers_org_select" on customers
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "customers_org_insert" on customers
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "customers_org_update" on customers
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "customers_org_delete" on customers
  for delete using (
    organization_id = (select organization_id from profiles where id = auth.uid())
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- SALES
-- =============================================================
create table if not exists sales (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  customer_id     uuid not null references customers on delete restrict,
  user_id         uuid not null references profiles on delete restrict,
  folio           text not null,
  status          text not null default 'pendiente' check (status in ('pendiente','confirmada','entregada','cancelada')),
  payment_method  text not null default 'efectivo' check (payment_method in ('efectivo','transferencia','credito','cheque')),
  subtotal        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  tax             numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, folio)
);

alter table sales enable row level security;

create policy "sales_org_select" on sales
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "sales_org_insert" on sales
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "sales_org_update" on sales
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

-- =============================================================
-- SALE ITEMS
-- =============================================================
create table if not exists sale_items (
  id          uuid primary key default uuid_generate_v4(),
  sale_id     uuid not null references sales on delete cascade,
  product_id  uuid not null references products on delete restrict,
  quantity    integer not null,
  unit_price  numeric(12,2) not null,
  discount    numeric(5,2) not null default 0,
  subtotal    numeric(12,2) not null
);

alter table sale_items enable row level security;

create policy "sale_items_org_select" on sale_items
  for select using (
    sale_id in (select id from sales where organization_id = (select organization_id from profiles where id = auth.uid()))
  );

create policy "sale_items_org_insert" on sale_items
  for insert with check (
    sale_id in (select id from sales where organization_id = (select organization_id from profiles where id = auth.uid()))
  );

-- =============================================================
-- QUOTES
-- =============================================================
create table if not exists quotes (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  customer_id     uuid not null references customers on delete restrict,
  user_id         uuid not null references profiles on delete restrict,
  folio           text not null,
  status          text not null default 'borrador' check (status in ('borrador','enviada','aceptada','rechazada','vencida')),
  valid_until     date not null,
  subtotal        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  tax             numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, folio)
);

alter table quotes enable row level security;

create policy "quotes_org_select" on quotes
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "quotes_org_insert" on quotes
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "quotes_org_update" on quotes
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

-- =============================================================
-- QUOTE ITEMS
-- =============================================================
create table if not exists quote_items (
  id          uuid primary key default uuid_generate_v4(),
  quote_id    uuid not null references quotes on delete cascade,
  product_id  uuid not null references products on delete restrict,
  quantity    integer not null,
  unit_price  numeric(12,2) not null,
  discount    numeric(5,2) not null default 0,
  subtotal    numeric(12,2) not null
);

alter table quote_items enable row level security;

create policy "quote_items_org_select" on quote_items
  for select using (
    quote_id in (select id from quotes where organization_id = (select organization_id from profiles where id = auth.uid()))
  );

create policy "quote_items_org_insert" on quote_items
  for insert with check (
    quote_id in (select id from quotes where organization_id = (select organization_id from profiles where id = auth.uid()))
  );

-- =============================================================
-- DELIVERIES
-- =============================================================
create table if not exists deliveries (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  sale_id         uuid not null references sales on delete cascade,
  assigned_to     uuid references profiles on delete set null,
  status          text not null default 'pendiente' check (status in ('pendiente','en_ruta','entregado','fallido')),
  scheduled_date  date,
  delivered_at    timestamptz,
  address         text not null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table deliveries enable row level security;

create policy "deliveries_org_select" on deliveries
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "deliveries_org_insert" on deliveries
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "deliveries_org_update" on deliveries
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

-- =============================================================
-- SUPPLIERS
-- =============================================================
create table if not exists suppliers (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  name            text not null,
  contact_name    text,
  email           text,
  phone           text,
  address         text,
  rfc             text,
  payment_terms   integer default 30,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table suppliers enable row level security;

create policy "suppliers_org_select" on suppliers
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "suppliers_org_insert" on suppliers
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "suppliers_org_update" on suppliers
  for update using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "suppliers_org_delete" on suppliers
  for delete using (
    organization_id = (select organization_id from profiles where id = auth.uid())
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- TRANSACTIONS (Finanzas)
-- =============================================================
create table if not exists transactions (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations on delete cascade,
  type            text not null check (type in ('ingreso', 'egreso')),
  category        text not null,
  description     text not null,
  amount          numeric(12,2) not null,
  reference       text,
  date            date not null,
  created_at      timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "transactions_org_select" on transactions
  for select using (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "transactions_org_insert" on transactions
  for insert with check (organization_id = (select organization_id from profiles where id = auth.uid()));

create policy "transactions_admin_delete" on transactions
  for delete using (
    organization_id = (select organization_id from profiles where id = auth.uid())
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- TRIGGER: auto-create profile on signup
-- =============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  org_id uuid;
  org_name text;
  org_slug text;
begin
  org_name := coalesce(new.raw_user_meta_data->>'org_name', 'Mi Empresa');
  org_slug := coalesce(new.raw_user_meta_data->>'org_slug', 'mi-empresa-' || substr(new.id::text, 1, 8));

  -- Create organization
  insert into organizations (name, slug, plan)
  values (org_name, org_slug, 'starter')
  returning id into org_id;

  -- Create profile
  insert into profiles (id, organization_id, email, full_name, role)
  values (
    new.id,
    org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================================
-- TRIGGER: update updated_at automatically
-- =============================================================
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at before update on organizations
  for each row execute procedure update_updated_at_column();

create trigger trg_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger trg_products_updated_at before update on products
  for each row execute procedure update_updated_at_column();

create trigger trg_customers_updated_at before update on customers
  for each row execute procedure update_updated_at_column();

create trigger trg_sales_updated_at before update on sales
  for each row execute procedure update_updated_at_column();

create trigger trg_quotes_updated_at before update on quotes
  for each row execute procedure update_updated_at_column();

create trigger trg_deliveries_updated_at before update on deliveries
  for each row execute procedure update_updated_at_column();

create trigger trg_suppliers_updated_at before update on suppliers
  for each row execute procedure update_updated_at_column();

-- =============================================================
-- INDEXES for performance
-- =============================================================
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_products_org on products(organization_id);
create index if not exists idx_customers_org on customers(organization_id);
create index if not exists idx_sales_org on sales(organization_id);
create index if not exists idx_sales_customer on sales(customer_id);
create index if not exists idx_sales_created on sales(created_at desc);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_quotes_org on quotes(organization_id);
create index if not exists idx_deliveries_org on deliveries(organization_id);
create index if not exists idx_transactions_org on transactions(organization_id);
create index if not exists idx_transactions_date on transactions(date desc);
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
-- Audit log table for immutable change history
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations on delete cascade,
  user_id uuid references profiles on delete set null,
  table_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  record_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now() not null
);

alter table audit_logs enable row level security;

create policy "audit_logs_org_select" on audit_logs
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create index idx_audit_logs_org_created on audit_logs(organization_id, created_at desc);
create index idx_audit_logs_table on audit_logs(organization_id, table_name);
create index idx_audit_logs_record on audit_logs(record_id);

-- Trigger function (runs as security definer to always have auth context)
create or replace function log_audit_event() returns trigger
language plpgsql security definer as $$
declare
  v_org_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  select organization_id into v_org_id from profiles where id = v_user_id limit 1;

  insert into audit_logs (organization_id, user_id, table_name, action, record_id, old_data, new_data)
  values (
    v_org_id,
    v_user_id,
    tg_table_name,
    tg_op,
    coalesce((new).id, (old).id),
    case when tg_op = 'DELETE' then to_jsonb(old) else null end,
    case when tg_op != 'DELETE' then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

-- Apply to business-critical tables
create trigger audit_sales
  after insert or update or delete on sales
  for each row execute function log_audit_event();

create trigger audit_customers
  after insert or update or delete on customers
  for each row execute function log_audit_event();

create trigger audit_products
  after insert or update or delete on products
  for each row execute function log_audit_event();

create trigger audit_quotes
  after insert or update or delete on quotes
  for each row execute function log_audit_event();
-- Atomic sale creation with stock deduction and sequential folio
create or replace function create_sale_with_items(
  p_customer_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_notes text default null
) returns json
language plpgsql security definer as $$
declare
  v_sale_id uuid;
  v_org_id uuid;
  v_user_id uuid;
  v_folio text;
  v_seq int;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_product_stock int;
  v_qty int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select organization_id into v_org_id from profiles where id = v_user_id;
  if v_org_id is null then
    raise exception 'Organization not found';
  end if;

  -- Sequential folio (row-level lock prevents duplicates under concurrent writes)
  select coalesce(max(cast(regexp_replace(folio, '[^0-9]', '', 'g') as int)), 0) + 1
  into v_seq
  from sales
  where organization_id = v_org_id
  for update;

  v_folio := 'VTA-' || lpad(v_seq::text, 5, '0');

  -- Validate stock before inserting anything
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    select stock into v_product_stock
    from products
    where id = (v_item->>'product_id')::uuid;

    if v_product_stock < v_qty then
      raise exception 'Stock insuficiente para producto %', (v_item->>'product_id');
    end if;
  end loop;

  -- Insert sale header
  insert into sales (
    organization_id, customer_id, user_id, folio, status,
    payment_method, subtotal, discount, tax, total, notes
  ) values (
    v_org_id, p_customer_id, v_user_id, v_folio, 'pendiente',
    p_payment_method, 0, 0, 0, 0, p_notes
  ) returning id into v_sale_id;

  -- Insert items and deduct stock atomically
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into sale_items (sale_id, product_id, quantity, unit_price, discount, subtotal)
    values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'discount')::numeric,
      (v_item->>'subtotal')::numeric
    );

    update products
    set stock = stock - (v_item->>'quantity')::int,
        updated_at = now()
    where id = (v_item->>'product_id')::uuid;
  end loop;

  -- Compute totals
  select coalesce(sum(subtotal), 0) into v_subtotal
  from sale_items where sale_id = v_sale_id;

  v_tax := v_subtotal * 0.16;
  v_total := v_subtotal + v_tax;

  update sales set subtotal = v_subtotal, tax = v_tax, total = v_total
  where id = v_sale_id;

  return json_build_object('id', v_sale_id, 'folio', v_folio, 'total', v_total);
end;
$$;

grant execute on function create_sale_with_items to authenticated;


-- Quote to sale conversion
create or replace function convert_quote_to_sale(
  p_quote_id uuid,
  p_payment_method text
) returns json
language plpgsql security definer as $$
declare
  v_quote record;
  v_result json;
begin
  select * into v_quote from quotes where id = p_quote_id;
  if not found then
    raise exception 'Quote not found';
  end if;

  select create_sale_with_items(
    v_quote.customer_id,
    p_payment_method,
    (select jsonb_agg(jsonb_build_object(
      'product_id', product_id,
      'quantity', quantity,
      'unit_price', unit_price,
      'discount', discount,
      'subtotal', subtotal
    )) from quote_items where quote_id = p_quote_id),
    v_quote.notes
  ) into v_result;

  update quotes set status = 'aceptada', updated_at = now() where id = p_quote_id;

  return v_result;
end;
$$;

grant execute on function convert_quote_to_sale to authenticated;
-- CFDI / SAT fiscal fields

-- Organizations: fiscal data
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS rfc              text,
  ADD COLUMN IF NOT EXISTS razon_social     text,
  ADD COLUMN IF NOT EXISTS regimen_fiscal   text DEFAULT '601',
  ADD COLUMN IF NOT EXISTS fiscal_zip       text,
  ADD COLUMN IF NOT EXISTS cer_content      text,  -- base64 .cer
  ADD COLUMN IF NOT EXISTS key_content      text,  -- base64 .key (encrypted at rest)
  ADD COLUMN IF NOT EXISTS key_password     text,  -- encrypted key password
  ADD COLUMN IF NOT EXISTS pac_username     text,  -- SW SapienS user
  ADD COLUMN IF NOT EXISTS pac_password     text;  -- SW SapienS password

-- Products: SAT catalog keys
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sat_product_key  text DEFAULT '01010101',
  ADD COLUMN IF NOT EXISTS sat_unit_key     text DEFAULT 'H87',
  ADD COLUMN IF NOT EXISTS sat_unit_name    text DEFAULT 'Pieza';

-- Customers: RFC / fiscal data for CFDI recipient
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS rfc              text,
  ADD COLUMN IF NOT EXISTS razon_social     text,
  ADD COLUMN IF NOT EXISTS regimen_fiscal   text,
  ADD COLUMN IF NOT EXISTS fiscal_zip       text,
  ADD COLUMN IF NOT EXISTS uso_cfdi         text DEFAULT 'G03';

-- Sales: CFDI stamp result
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS cfdi_uuid        uuid,
  ADD COLUMN IF NOT EXISTS cfdi_xml         text,
  ADD COLUMN IF NOT EXISTS cfdi_pdf_url     text,
  ADD COLUMN IF NOT EXISTS cfdi_status      text DEFAULT 'sin_timbrar'
                                             CHECK (cfdi_status IN ('sin_timbrar','timbrado','cancelado'));

CREATE INDEX IF NOT EXISTS idx_sales_cfdi_uuid ON sales(cfdi_uuid) WHERE cfdi_uuid IS NOT NULL;

-- Quotes: Conekta payment link
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS payment_link_id  text,
  ADD COLUMN IF NOT EXISTS payment_link_url text,
  ADD COLUMN IF NOT EXISTS payment_link_exp timestamptz;
