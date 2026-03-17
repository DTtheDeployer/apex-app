'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  AlertTriangle, CheckCircle, RefreshCw, Target,
  Shield, Zap, Info, ArrowRight, X
} from 'lucide-react'

const ASSETS = ['BTC', 'ETH', 'SOL', 'ARB', 'DOGE']

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 7, 10]

interface AssetPrice {
  symbol: string
  price: number
  change24h?: number
}

export default function ManualTradePage() {
  const router = useRouter()
  
  // Form state
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG')
  const [sizeUsd, setSizeUsd] = useState('')
  const [leverage, setLeverage] = useState(3)
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  
  // UI state
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Fetch live prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices')
        if (res.ok) {
          const data = await res.json()
          setPrices(data.prices || {})
        }
      } catch (e) {
        console.error('Failed to fetch prices:', e)
      }
    }
    
    fetchPrices()
    const interval = setInterval(fetchPrices, 10000) // Every 10s
    return () => clearInterval(interval)
  }, [])
  
  const currentPrice = prices[selectedAsset] || 0
  const positionSize = parseFloat(sizeUsd) || 0
  const slPrice = parseFloat(stopLoss) || 0
  const tpPrice = parseFloat(takeProfit) || 0
  
  // Calculate risk/reward
  const calculateRiskReward = () => {
    if (!currentPrice || !slPrice || !tpPrice || !positionSize) {
      return { risk: 0, reward: 0, rr: 0, slPct: 0, tpPct: 0 }
    }
    
    let slPct, tpPct
    if (side === 'LONG') {
      slPct = ((currentPrice - slPrice) / currentPrice) * 100
      tpPct = ((tpPrice - currentPrice) / currentPrice) * 100
    } else {
      slPct = ((slPrice - currentPrice) / currentPrice) * 100
      tpPct = ((currentPrice - tpPrice) / currentPrice) * 100
    }
    
    const risk = (slPct / 100) * positionSize * leverage
    const reward = (tpPct / 100) * positionSize * leverage
    const rr = risk > 0 ? reward / risk : 0
    
    return { risk, reward, rr, slPct, tpPct }
  }
  
  const { risk, reward, rr, slPct, tpPct } = calculateRiskReward()
  
  // Auto-calculate SL/TP based on ATR-like percentage
  const autoSetSLTP = (slPctInput: number, tpPctInput: number) => {
    if (!currentPrice) return
    
    if (side === 'LONG') {
      setStopLoss((currentPrice * (1 - slPctInput / 100)).toFixed(2))
      setTakeProfit((currentPrice * (1 + tpPctInput / 100)).toFixed(2))
    } else {
      setStopLoss((currentPrice * (1 + slPctInput / 100)).toFixed(2))
      setTakeProfit((currentPrice * (1 - tpPctInput / 100)).toFixed(2))
    }
  }
  
  // Validate inputs
  const validateInputs = (): string | null => {
    if (!currentPrice) return 'Unable to fetch current price'
    if (positionSize < 10) return 'Minimum position size is $10'
    if (positionSize > 10000) return 'Maximum position size is $10,000'
    if (!slPrice) return 'Stop loss is required'
    if (!tpPrice) return 'Take profit is required'
    
    if (side === 'LONG') {
      if (slPrice >= currentPrice) return 'Stop loss must be below current price for LONG'
      if (tpPrice <= currentPrice) return 'Take profit must be above current price for LONG'
    } else {
      if (slPrice <= currentPrice) return 'Stop loss must be above current price for SHORT'
      if (tpPrice >= currentPrice) return 'Take profit must be below current price for SHORT'
    }
    
    if (slPct > 20) return 'Stop loss too far (>20% from entry)'
    if (tpPct > 50) return 'Take profit too far (>50% from entry)'
    
    return null
  }
  
  const handleSubmit = async () => {
    const validationError = validateInputs()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setShowConfirm(true)
  }
  
  const executeOrder = async () => {
    setSubmitting(true)
    setError('')
    setShowConfirm(false)
    
    try {
      const res = await fetch('/api/bot/manual-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          symbol: selectedAsset,
          side,
          size: positionSize,
          leverage,
          entry_price: currentPrice,
          stop_loss: slPrice,
          take_profit: tpPrice,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to place order')
      }
      
      setSuccess(`${side} ${selectedAsset} order placed successfully!`)
      
      // Reset form
      setSizeUsd('')
      setStopLoss('')
      setTakeProfit('')
      
      // Redirect to dashboard after 2s
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
      
    } catch (e: any) {
      setError(e.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">Manual Trade</h1>
        <p className="text-sm text-muted mt-1">Place trades directly without bot signals</p>
      </div>
      
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green/10 border border-green/30 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green" />
          <p className="text-green font-medium">{success}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red/10 border border-red/30 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red" />
          <p className="text-red text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4 text-red" />
          </button>
        </div>
      )}
      
      {/* Asset Selector */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Select Asset</p>
        <div className="grid grid-cols-5 gap-2">
          {ASSETS.map(asset => (
            <button
              key={asset}
              onClick={() => {
                setSelectedAsset(asset)
                setStopLoss('')
                setTakeProfit('')
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                selectedAsset === asset
                  ? 'bg-green/10 border-green/50 text-green'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <p className="text-sm font-bold">{asset}</p>
              <p className="text-[10px] text-muted mt-1">
                ${prices[asset]?.toLocaleString() || '—'}
              </p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Side Toggle */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Direction</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSide('LONG')
              setStopLoss('')
              setTakeProfit('')
            }}
            className={`p-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
              side === 'LONG'
                ? 'bg-green/10 border-green/50 text-green'
                : 'bg-white/5 border-white/10 hover:border-white/30 text-muted'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold">LONG</span>
          </button>
          <button
            onClick={() => {
              setSide('SHORT')
              setStopLoss('')
              setTakeProfit('')
            }}
            className={`p-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
              side === 'SHORT'
                ? 'bg-red/10 border-red/50 text-red'
                : 'bg-white/5 border-white/10 hover:border-white/30 text-muted'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
            <span className="font-bold">SHORT</span>
          </button>
        </div>
      </div>
      
      {/* Position Size */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Position Size</p>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="number"
            value={sizeUsd}
            onChange={(e) => setSizeUsd(e.target.value)}
            placeholder="Enter amount in USD"
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-lg font-mono focus:outline-none focus:border-green/50"
          />
        </div>
        <div className="flex gap-2 mt-3">
          {[100, 250, 500, 1000].map(amount => (
            <button
              key={amount}
              onClick={() => setSizeUsd(amount.toString())}
              className="flex-1 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium transition-all"
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>
      
      {/* Leverage */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted uppercase tracking-wider font-medium">Leverage</p>
          <span className="text-lg font-bold text-green">{leverage}x</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {LEVERAGE_OPTIONS.map(lev => (
            <button
              key={lev}
              onClick={() => setLeverage(lev)}
              className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                leverage === lev
                  ? 'bg-green/10 border-green/50 text-green'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
        {leverage >= 7 && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-amber-400">High leverage increases liquidation risk</p>
          </div>
        )}
      </div>
      
      {/* SL/TP */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted uppercase tracking-wider font-medium">Stop Loss / Take Profit</p>
          <p className="text-xs text-muted">Current: ${currentPrice.toLocaleString()}</p>
        </div>
        
        {/* Quick presets */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => autoSetSLTP(2, 4)}
            className="flex-1 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium transition-all"
          >
            Tight (2%/4%)
          </button>
          <button
            onClick={() => autoSetSLTP(3, 6)}
            className="flex-1 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium transition-all"
          >
            Normal (3%/6%)
          </button>
          <button
            onClick={() => autoSetSLTP(5, 10)}
            className="flex-1 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium transition-all"
          >
            Wide (5%/10%)
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-red mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Stop Loss
            </label>
            <div className="relative">
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="SL price"
                className="w-full bg-red/5 border border-red/30 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-red/50"
              />
              {slPct > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red">
                  -{slPct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-green mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Take Profit
            </label>
            <div className="relative">
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="TP price"
                className="w-full bg-green/5 border border-green/30 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-green/50"
              />
              {tpPct > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green">
                  +{tpPct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Preview */}
      {positionSize > 0 && currentPrice > 0 && (
        <div className="bg-surface rounded-xl p-4 mb-4 border border-white/10">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Order Preview</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Asset</span>
              <span className="font-medium">{selectedAsset}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Side</span>
              <span className={`font-bold ${side === 'LONG' ? 'text-green' : 'text-red'}`}>{side}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Entry Price</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Position Size</span>
              <span className="font-mono">${positionSize.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Leverage</span>
              <span className="font-mono text-green">{leverage}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Effective Size</span>
              <span className="font-mono">${(positionSize * leverage).toLocaleString()}</span>
            </div>
            
            {slPrice > 0 && tpPrice > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="flex justify-between">
                  <span className="text-muted">Max Loss</span>
                  <span className="font-mono text-red">-${risk.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Max Profit</span>
                  <span className="font-mono text-green">+${reward.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Risk/Reward</span>
                  <span className={`font-bold ${rr >= 1.5 ? 'text-green' : rr >= 1 ? 'text-amber-400' : 'text-red'}`}>
                    1:{rr.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !positionSize || !currentPrice}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          side === 'LONG'
            ? 'bg-green hover:bg-green/90 disabled:bg-green/30'
            : 'bg-red hover:bg-red/90 disabled:bg-red/30'
        } disabled:cursor-not-allowed`}
      >
        {submitting ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Zap className="w-5 h-5" />
            {side === 'LONG' ? 'Open Long' : 'Open Short'}
          </>
        )}
      </button>
      
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Order</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted">Action</span>
                <span className={`font-bold ${side === 'LONG' ? 'text-green' : 'text-red'}`}>
                  {side} {selectedAsset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Size</span>
                <span className="font-mono">${positionSize.toLocaleString()} × {leverage}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Entry</span>
                <span className="font-mono">${currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Stop Loss</span>
                <span className="font-mono text-red">${slPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Take Profit</span>
                <span className="font-mono text-green">${tpPrice.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-muted">Max Loss</span>
                  <span className="font-bold text-red">-${risk.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeOrder}
                disabled={submitting}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  side === 'LONG' ? 'bg-green hover:bg-green/90' : 'bg-red hover:bg-red/90'
                }`}
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}