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
