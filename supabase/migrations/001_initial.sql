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
