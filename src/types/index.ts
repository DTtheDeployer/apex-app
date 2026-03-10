// src/types/index.ts

export interface Profile {
  id: string
  email: string
  full_name: string
  plan: 'starter' | 'pro' | 'elite'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string
  subscription_period_end: string | null
  created_at: string
}

export interface BotConfig {
  id: string
  user_id: string
  hl_wallet_address: string | null
  symbols: string[]
  leverage: number
  max_position_pct: number
  max_daily_loss_pct: number
  max_positions: number
  interval_minutes: number
  testnet: boolean
  weight_ma_cross: number | null
  weight_mean_reversion: number | null
  weight_momentum: number | null
  weight_ml_score: number | null
  discord_webhook_url: string | null
  telegram_bot_token: string | null
  telegram_chat_id: string | null
  email_alerts: boolean
  bot_enabled: boolean
  last_seen: string | null
}

export interface Trade {
  id: string
  user_id: string
  external_id: string
  type: 'signal' | 'close'
  symbol: string
  side: 'LONG' | 'SHORT'
  entry_price: number
  exit_price: number | null
  size: number
  leverage: number
  stop_loss: number
  take_profit: number
  pnl: number | null
  pnl_pct: number | null
  close_reason: 'TP' | 'SL' | 'MANUAL' | null
  held_minutes: number | null
  confidence: number
  net_score: number
  regime: string | null
  macro_context: string | null
  paper: boolean
  opened_at: string
  closed_at: string | null
}

export interface BotHeartbeat {
  equity: number
  open_positions: number
  regime: string
  macro_context: string
  cycles_today: number
  trades_today: number
  pnl_today: number
  created_at: string
}

export interface EquitySnapshot {
  equity: number
  snapshot_at: string
}

export interface UserStats {
  total_trades: number
  wins: number
  losses: number
  win_rate_pct: number
  total_pnl: number
  pnl_today: number
}
