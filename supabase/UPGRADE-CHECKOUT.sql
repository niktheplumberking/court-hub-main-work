-- ============================================================
-- COURT HUB — Checkout upgrade (run ONCE in Supabase → SQL Editor)
--
-- What this fixes:
--  • Stock is RESERVED the moment a customer starts paying, inside one
--    database transaction. Two people can no longer both pay for the last
--    (or one-of-a-kind) racket.
--  • Abandoned checkouts give their stock back automatically.
--  • Every stock change is atomic (no lost updates when many orders land
--    at the same second).
--  • Cancelling an order in the admin puts its items back in stock (once).
--
-- Safe to run more than once. Changes no existing data.
-- ============================================================

-- ── Reservations ──
create table if not exists checkout_holds (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  -- Snapshot of what was reserved: [{ id, title, qty, price_aed }]
  items jsonb not null,
  status text not null default 'held' check (status in ('held', 'converted', 'released')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists checkout_holds_status_expiry_idx on checkout_holds (status, expires_at);
-- Server-only table (service key). No policies = invisible to the public API.
alter table checkout_holds enable row level security;

-- ── Order extras ──
alter table orders add column if not exists hold_id uuid;
alter table orders add column if not exists stripe_payment_intent text;
alter table orders add column if not exists restocked boolean not null default false;
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

-- ── reserve_stock: all-or-nothing reservation for a whole cart ──
-- p_items: [{ "id": "<uuid>", "qty": 2 }, ...] (ids unique, qty >= 1)
-- Returns { ok: true, hold_id, items, zeroed } or
--         { ok: false, reason: 'unavailable' | 'stock', id, available }.
create or replace function reserve_stock(p_items jsonb, p_minutes int default 32)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  v_id uuid;
  v_qty int;
  p products%rowtype;
  snapshot jsonb := '[]'::jsonb;
  v_hold uuid;
  v_zeroed boolean := false;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  -- Pass 1: lock every row (stable id order → no deadlocks between carts)
  -- and check stock. Nothing is changed unless the WHOLE cart fits.
  for it in select value from jsonb_array_elements(p_items) order by value->>'id' loop
    v_id := (it->>'id')::uuid;
    v_qty := (it->>'qty')::int;
    select * into p from products where id = v_id for update;
    if not found or p.status <> 'active' then
      return jsonb_build_object('ok', false, 'reason', 'unavailable', 'id', v_id, 'available', 0);
    end if;
    if v_qty is null or v_qty < 1 or p.quantity < v_qty or (p.is_unique and v_qty > 1) then
      return jsonb_build_object('ok', false, 'reason', 'stock', 'id', v_id,
        'available', case when p.is_unique then least(p.quantity, 1) else greatest(p.quantity, 0) end);
    end if;
    snapshot := snapshot || jsonb_build_object(
      'id', p.id, 'title', p.title, 'qty', v_qty, 'price_aed', p.price_aed);
  end loop;

  -- Pass 2: take the stock (rows are still locked by this transaction).
  for it in select value from jsonb_array_elements(snapshot) loop
    update products set quantity = quantity - (it->>'qty')::int
      where id = (it->>'id')::uuid;
  end loop;
  select bool_or(quantity <= 0) into v_zeroed
    from products where id in (select (value->>'id')::uuid from jsonb_array_elements(snapshot));

  insert into checkout_holds (items, expires_at)
    values (snapshot, now() + make_interval(mins => p_minutes))
    returning id into v_hold;

  return jsonb_build_object('ok', true, 'hold_id', v_hold, 'items', snapshot, 'zeroed', coalesce(v_zeroed, false));
end;
$$;

-- ── release_hold: give reserved stock back (abandoned / expired checkout) ──
-- Idempotent: only a 'held' reservation is released, exactly once.
create or replace function release_hold(p_hold uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb;
  it jsonb;
begin
  update checkout_holds set status = 'released'
    where id = p_hold and status = 'held'
    returning items into v_items;
  if not found then return false; end if;
  for it in select value from jsonb_array_elements(v_items) loop
    update products set quantity = quantity + (it->>'qty')::int
      where id = (it->>'id')::uuid;
  end loop;
  return true;
end;
$$;

-- ── convert_hold: payment succeeded → reservation becomes a sale ──
-- Returns 'converted' (first time), 'already' (repeat call) or
-- 'late' (the hold had been released before payment arrived — stock is
-- taken again, never below zero; the admin should double-check stock).
create or replace function convert_hold(p_hold uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb;
  v_status text;
  it jsonb;
begin
  select status, items into v_status, v_items from checkout_holds where id = p_hold for update;
  if not found then return 'missing'; end if;
  if v_status = 'converted' then return 'already'; end if;

  update checkout_holds set status = 'converted' where id = p_hold;
  for it in select value from jsonb_array_elements(v_items) loop
    if v_status = 'released' then
      update products set quantity = greatest(0, quantity - (it->>'qty')::int)
        where id = (it->>'id')::uuid;
    end if;
    -- One-of-a-kind items leave the shop for good once sold.
    update products set status = 'sold'
      where id = (it->>'id')::uuid and is_unique and quantity <= 0 and status = 'active';
  end loop;
  return case when v_status = 'released' then 'late' else 'converted' end;
end;
$$;

-- ── take_stock: for orders paid on a checkout started before this upgrade ──
create or replace function take_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
begin
  for it in select value from jsonb_array_elements(p_items) loop
    update products set
      quantity = greatest(0, quantity - (it->>'qty')::int),
      status = case when is_unique and quantity - (it->>'qty')::int <= 0 and status = 'active'
                    then 'sold' else status end
      where id = (it->>'id')::uuid;
  end loop;
end;
$$;

-- ── set_order_status: admin status change with automatic restock ──
-- Cancelling puts the items back in stock (once). Un-cancelling takes them
-- out again. Row lock makes double-clicks harmless.
create or replace function set_order_status(p_order uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o orders%rowtype;
  it jsonb;
  v_restocked boolean;
begin
  if p_status not in ('paid', 'fulfilled', 'cancelled') then
    raise exception 'Invalid status %', p_status;
  end if;
  select * into o from orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  v_restocked := o.restocked;

  if p_status = 'cancelled' and o.status <> 'cancelled' and not o.restocked then
    for it in select value from jsonb_array_elements(o.items) loop
      update products set
        quantity = quantity + (it->>'qty')::int,
        status = case when status = 'sold' then 'active' else status end
        where id = (it->>'id')::uuid;
    end loop;
    v_restocked := true;
  elsif p_status <> 'cancelled' and o.status = 'cancelled' and o.restocked then
    for it in select value from jsonb_array_elements(o.items) loop
      update products set
        quantity = greatest(0, quantity - (it->>'qty')::int),
        status = case when is_unique and quantity - (it->>'qty')::int <= 0 and status = 'active'
                      then 'sold' else status end
        where id = (it->>'id')::uuid;
    end loop;
    v_restocked := false;
  end if;

  update orders set status = p_status, restocked = v_restocked where id = p_order;
  return jsonb_build_object('status', p_status, 'restocked', v_restocked);
end;
$$;

-- Only the server (service key) may call these.
revoke execute on function reserve_stock(jsonb, int) from public, anon, authenticated;
revoke execute on function release_hold(uuid) from public, anon, authenticated;
revoke execute on function convert_hold(uuid) from public, anon, authenticated;
revoke execute on function take_stock(jsonb) from public, anon, authenticated;
revoke execute on function set_order_status(uuid, text) from public, anon, authenticated;
grant execute on function reserve_stock(jsonb, int) to service_role;
grant execute on function release_hold(uuid) to service_role;
grant execute on function convert_hold(uuid) to service_role;
grant execute on function take_stock(jsonb) to service_role;
grant execute on function set_order_status(uuid, text) to service_role;
