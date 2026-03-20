'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveSettings } from './actions'
import { Shield, Cpu, Bell, Save, Eye, EyeOff } from 'lucide-react'
import type { BotConfig } from '@/types'

const HL_SYMBOLS = ['BTC','ETH','SOL','AVAX','DOGE','ARB','OP','LINK','MATIC','WIF']

export default function SettingsClient() {
  const supabase = useMemo(() => createClient(), [])
  const [config, setConfig] = useState<Partial<BotConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [privateKey, setPrivateKey] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('bot_configs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) setConfig(data)
      setLoading(false)
    }

    load()
  }, [supabase])

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)

    const { error: saveError } = await saveSettings(
      {
        hl_wallet_address:   config.hl_wallet_address ?? null,
        symbols:             config.symbols ?? ['BTC', 'ETH'],
        leverage:            config.leverage ?? 3,
        max_position_pct:    config.max_position_pct ?? 0.1,
        max_daily_loss_pct:  config.max_daily_loss_pct ?? 0.05,
        max_positions:       config.max_positions ?? 4,
        testnet:             config.testnet ?? true,
        discord_webhook_url: config.discord_webhook_url ?? null,
        telegram_bot_token:  config.telegram_bot_token ?? null,
        telegram_chat_id:    config.telegram_chat_id ?? null,
        email_alerts:        config.email_alerts ?? true,
        bot_enabled:         config.bot_enabled ?? false,
      },
      privateKey
    )

    if (saveError) {
      setError(saveError)
    } else {
      setPrivateKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  function toggleSymbol(s: string) {
    const syms = config.symbols ?? ['BTC', 'ETH']
    setConfig(c => ({
      ...c,
      symbols: syms.includes(s) ? syms.filter(x => x !== s) : [...syms, s],
    }))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-green/30 border-t-green rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bot Settings</h1>
          <p className="text-muted text-sm mt-0.5">Configure your trading parameters</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      {error && <div className="card border-red/20 bg-red/5 mb-6 text-red text-sm">{error}</div>}

      <section className="card mb-4">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
          <Shield className="w-4 h-4 text-green" />
          <h2 className="font-semibold text-sm">Hyperliquid Connection</h2>
        </div>
        <div className="bg-blue/5 border border-blue/20 rounded-lg px-4 py-3 mb-5 text-xs text-muted leading-relaxed">
          🔐 <strong className="text-white">Non-custodial:</strong> Generate a sub-wallet at{' '}
          <a
            href="https://app.hyperliquid.xyz/API"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green hover:underline"
          >
            app.hyperliquid.xyz/API
          </a>
          . APEX can only place trades — withdrawal is architecturally impossible via API keys.
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Main Wallet Address (0x…)</label>
            <input
              className="input font-mono text-xs"
              placeholder="0xYourMainWalletAddress"
              value={config.hl_wallet_address ?? ''}
              onChange={e => setConfig(c => ({ ...c, hl_wallet_address: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">API Sub-Wallet Private Key</label>
            <div className="relative">
              <input
                className="input font-mono text-xs pr-10"
                type={showKey ? 'text' : 'password'}
                placeholder="0xYourAPIWalletPrivateKey (stored encrypted)"
                value={privateKey}
                onChange={e => setPrivateKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-subtle mt-1.5">
              Leave blank to keep existing key. Encrypted with AES-256-GCM before storage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Network</label>
            <div className="flex items-center gap-4 ml-2">
              {['testnet', 'mainnet'].map(net => (
                <label key={net} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="network"
                    checked={net === 'testnet' ? (config.testnet ?? true) : !config.testnet}
                    onChange={() => setConfig(c => ({ ...c, testnet: net === 'testnet' }))}
                    className="accent-green"
                  />
                  <span className="text-sm capitalize">{net}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
          <Cpu className="w-4 h-4 text-blue" />
          <h2 className="font-semibold text-sm">Trading Parameters</h2>
        </div>

        <div className="mb-5">
          <label className="label">Trading Pairs</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {HL_SYMBOLS.map(s => {
              const active = (config.symbols ?? ['BTC', 'ETH']).includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymbol(s)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-green/10 border-green/30 text-green'
                      : 'bg-white/5 border-white/10 text-subtle hover:border-white/20'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-subtle mt-2">Pro plan: up to 7 pairs · Elite: all 100+ Hyperliquid pairs</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Leverage</label>
            <select
              className="input"
              value={config.leverage ?? 3}
              onChange={e => setConfig(c => ({ ...c, leverage: +e.target.value }))}
            >
              {[1, 2, 3, 5, 10].map(v => <option key={v} value={v}>{v}×</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max position size</label>
            <select
              className="input"
              value={config.max_position_pct ?? 0.1}
              onChange={e => setConfig(c => ({ ...c, max_position_pct: +e.target.value }))}
            >
              {[0.05, 0.10, 0.15, 0.20].map(v => (
                <option key={v} value={v}>{(v * 100).toFixed(0)}% of equity</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Daily loss limit</label>
            <select
              className="input"
              value={config.max_daily_loss_pct ?? 0.05}
              onChange={e => setConfig(c => ({ ...c, max_daily_loss_pct: +e.target.value }))}
            >
              {[0.03, 0.05, 0.07, 0.10].map(v => (
                <option key={v} value={v}>{(v * 100).toFixed(0)}% — circuit breaker</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Max open positions</label>
            <select
              className="input"
              value={config.max_positions ?? 4}
              onChange={e => setConfig(c => ({ ...c, max_positions: +e.target.value }))}
            >
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable live trading</p>
            <p className="text-xs text-subtle mt-0.5">Bot will execute real orders when enabled</p>
          </div>
          <button
            type="button"
            onClick={() => setConfig(c => ({ ...c, bot_enabled: !c.bot_enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.bot_enabled ? 'bg-green' : 'bg-white/10'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.bot_enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
          <Bell className="w-4 h-4 text-gold" />
          <h2 className="font-semibold text-sm">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Discord Webhook URL</label>
            <input
              className="input font-mono text-xs"
              placeholder="https://discord.com/api/webhooks/…"
              value={config.discord_webhook_url ?? ''}
              onChange={e => setConfig(c => ({ ...c, discord_webhook_url: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telegram Bot Token</label>
              <input
                className="input font-mono text-xs"
                placeholder="1234567890:ABC…"
                value={config.telegram_bot_token ?? ''}
                onChange={e => setConfig(c => ({ ...c, telegram_bot_token: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Telegram Chat ID</label>
              <input
                className="input font-mono text-xs"
                placeholder="-1001234567890"
                value={config.telegram_chat_id ?? ''}
                onChange={e => setConfig(c => ({ ...c, telegram_chat_id: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="emailAlerts"
              className="accent-green"
              checked={config.email_alerts ?? true}
              onChange={e => setConfig(c => ({ ...c, email_alerts: e.target.checked }))}
            />
            <label htmlFor="emailAlerts" className="text-sm cursor-pointer">
              Email alerts on trade open/close
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}