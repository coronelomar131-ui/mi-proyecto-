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
