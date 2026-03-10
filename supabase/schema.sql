-- ============================================================
-- APEX / HL — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text,
  full_name       text,
  plan            text not null default 'starter',   -- starter | pro | elite
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  subscription_status   text default 'inactive',     -- active | inactive | past_due | canceled
  subscription_period_end timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── BOT CONFIG ───────────────────────────────────────────────
-- One row per user — their bot settings
create table public.bot_configs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade unique,
  -- Hyperliquid credentials (encrypted at app layer before storing)
  hl_wallet_address text,
  hl_private_key_enc text,    -- AES-256 encrypted, key = user's session secret
  -- Trading settings
  symbols         text[] default array['BTC','ETH'],
  leverage        int default 3,
  max_position_pct float default 0.10,
  max_daily_loss_pct float default 0.05,
  max_positions   int default 4,
  interval_minutes int default 60,
  testnet         boolean default true,
  -- Strategy weights (null = use regime-adaptive defaults)
  weight_ma_cross       float,
  weight_mean_reversion float,
  weight_momentum       float,
  weight_ml_score       float,
  -- Notifications
  discord_webhook_url text,
  telegram_bot_token  text,
  telegram_chat_id    text,
  email_alerts        boolean default true,
  -- Status
  bot_enabled     boolean default false,
  last_seen       timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── TRADES ───────────────────────────────────────────────────
-- Synced from apex_trades.jsonl by the bot
create table public.trades (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  external_id     text unique,   -- from apex_trades.jsonl id field
  type            text,          -- signal | close
  symbol          text,
  side            text,          -- LONG | SHORT
  entry_price     float,
  exit_price      float,
  size            float,
  leverage        int,
  stop_loss       float,
  take_profit     float,
  pnl             float,
  pnl_pct         float,
  close_reason    text,          -- TP | SL | MANUAL
  held_minutes    int,
  confidence      float,
  net_score       float,
  regime          text,          -- TRENDING_UP | TRENDING_DOWN | RANGING | VOLATILE
  macro_context   text,          -- NONE | CAUTION | FREEZE | REACTIVE
  paper           boolean default true,
  opened_at       timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz default now()
);

-- ── BOT HEARTBEATS ───────────────────────────────────────────
-- Bot pings this every cycle so dashboard shows live/offline status
create table public.bot_heartbeats (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  equity          float,
  open_positions  int default 0,
  regime          text,
  macro_context   text,
  cycles_today    int default 0,
  trades_today    int default 0,
  pnl_today       float default 0,
  created_at      timestamptz default now()
);

-- Keep only last 48h of heartbeats
create index idx_heartbeats_user_time on public.bot_heartbeats(user_id, created_at desc);

-- ── EQUITY SNAPSHOTS ─────────────────────────────────────────
-- Hourly equity for the portfolio chart
create table public.equity_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  equity          float,
  snapshot_at     timestamptz default now()
);

create index idx_equity_user_time on public.equity_snapshots(user_id, snapshot_at desc);

-- ── INDEXES ──────────────────────────────────────────────────
create index idx_trades_user      on public.trades(user_id, created_at desc);
create index idx_trades_symbol    on public.trades(symbol);
create index idx_trades_open      on public.trades(user_id) where closed_at is null;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.bot_configs        enable row level security;
alter table public.trades             enable row level security;
alter table public.bot_heartbeats     enable row level security;
alter table public.equity_snapshots   enable row level security;

-- profiles: users can only read/write their own row
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- bot_configs: own row only
create policy "own bot config" on public.bot_configs
  for all using (auth.uid() = user_id);

-- trades: own rows only
create policy "own trades" on public.trades
  for all using (auth.uid() = user_id);

-- heartbeats: own rows only
create policy "own heartbeats" on public.bot_heartbeats
  for all using (auth.uid() = user_id);

-- equity snapshots: own rows only
create policy "own equity" on public.equity_snapshots
  for all using (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  insert into public.bot_configs (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── UPDATED_AT AUTO-BUMP ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at    before update on public.profiles    for each row execute function public.set_updated_at();
create trigger bot_configs_updated_at before update on public.bot_configs  for each row execute function public.set_updated_at();

-- ── USEFUL VIEWS ─────────────────────────────────────────────
create or replace view public.user_stats as
select
  t.user_id,
  count(*) filter (where t.closed_at is not null)                            as total_trades,
  count(*) filter (where t.closed_at is not null and t.pnl > 0)             as wins,
  count(*) filter (where t.closed_at is not null and t.pnl <= 0)            as losses,
  round(
    count(*) filter (where t.closed_at is not null and t.pnl > 0)::numeric /
    nullif(count(*) filter (where t.closed_at is not null), 0) * 100, 1
  )                                                                          as win_rate_pct,
  round(coalesce(sum(t.pnl) filter (where t.closed_at is not null), 0)::numeric, 2) as total_pnl,
  round(coalesce(sum(t.pnl) filter (where t.closed_at is not null and date(t.closed_at) = current_date), 0)::numeric, 2) as pnl_today
from public.trades t
group by t.user_id;

-- Done! Schema ready.
-- Next: create a Supabase project, run this SQL, copy your project URL + anon key.
