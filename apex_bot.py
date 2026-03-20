#!/usr/bin/env python3
"""
APEX Trading Bot v10 - Multi-Strategy with Live Trading
========================================================
Supports paper trading and live trading via Hyperliquid SDK.
Features: Active Position Manager, Multi-Timeframe, Volume Analysis,
          Funding Rate Awareness, Partial Exits, Dynamic Sizing, Notifications
"""

from dotenv import load_dotenv
load_dotenv()

import os
import time
import logging
import requests
import uuid
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Tuple
from enum import Enum
import numpy as np

# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class Config:
    HL_PRIVATE_KEY: str = os.getenv("HL_API_SECRET", "")        # API wallet private key
    HL_WALLET_ADDRESS: str = os.getenv("HL_WALLET_ADDRESS", "") # Main wallet address
    
    APEX_APP_URL: str = os.getenv("APEX_APP_URL", "https://app.apexhl.trade")
    APEX_USER_ID: str = os.getenv("APEX_USER_ID", "")
    BOT_API_SECRET: str = os.getenv("BOT_API_SECRET", "")
    
    ASSETS: List[str] = field(default_factory=lambda: ["BTC", "ETH", "SOL", "ARB", "DOGE"])
    TIMEFRAME: str = "1h"
    MAX_LEVERAGE: int = 5
    RISK_PER_TRADE: float = 0.03
    MAX_POSITIONS: int = 3
    MAX_DAILY_LOSS: float = 0.05  # 5% max daily drawdown - circuit breaker
    
    PAPER_TRADE: bool = field(default_factory=lambda: os.getenv("PAPER_TRADE", "true").lower() == "true")
    PAPER_BALANCE: float = 10000.0
    CYCLE_INTERVAL: int = 60

CONFIG = Config()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("APEX")

# ══════════════════════════════════════════════════════════════════════════════
#  ENUMS & DATA CLASSES
# ══════════════════════════════════════════════════════════════════════════════

class Regime(Enum):
    TRENDING_UP = "TRENDING_UP"
    TRENDING_DOWN = "TRENDING_DOWN"
    RANGING = "RANGING"
    VOLATILE = "VOLATILE"
    UNKNOWN = "UNKNOWN"

class MacroContext(Enum):
    NONE = "NONE"
    CAUTION = "CAUTION"
    FREEZE = "FREEZE"
    REACTIVE = "REACTIVE"

class SignalType(Enum):
    LONG = "LONG"
    SHORT = "SHORT"

@dataclass
class Signal:
    type: SignalType
    symbol: str
    confidence: float
    strategy: str
    entry_price: float
    stop_loss: float
    take_profit: float
    regime: Regime
    macro: MacroContext
    explanation: str = ""
    rsi: float = 0
    macd: float = 0

@dataclass
class Position:
    id: str
    symbol: str
    side: str
    entry_price: float
    size: float
    leverage: int
    stop_loss: float
    take_profit: float
    entry_time: datetime
    regime: str
    macro: str
    strategy: str = ""
    explanation: str = ""
    # Active Position Manager fields
    original_stop_loss: float = 0.0
    trailing_stop: float = 0.0
    highest_price: float = 0.0  # Tracks peak price since entry (LONG)
    lowest_price: float = 999999.0  # Tracks trough price since entry (SHORT)
    candles_held: int = 0
    trailing_activated: bool = False
    # Partial exit tracking
    partial_exits_taken: int = 0  # How many partial exits have been taken (0, 1, 2)
    original_size: float = 0.0   # Original position size before any partials

# ══════════════════════════════════════════════════════════════════════════════
#  STRATEGY DEFINITIONS
# ══════════════════════════════════════════════════════════════════════════════

STRATEGIES = {
    "apex_adaptive": {
        "name": "APEX Adaptive",
        "description": "Adapts to market regime automatically — selective, high-conviction entries only",
        "style": "hybrid",
        "hold_time": "varies",
        "icon": "🔄",
        "params": {
            "trend_rsi_pullback": 45,
            "trend_rsi_momentum_min": 55,
            "trend_rsi_momentum_max": 72,
            "mean_rev_rsi_oversold": 30,
            "mean_rev_rsi_overbought": 70,
            "min_confidence": 0.62,
            "atr_sl_mult": 2.5,
            "atr_tp_mult": 4.0,
            "trail_activation": 1.5,
            "trail_step": 0.5,
            "time_stop_candles": 12,
            "cooldown_candles": 3,
        },
    },
    "momentum_rider": {
        "name": "Momentum Rider",
        "description": "Ride strong trends with RSI + MACD confirmation — wider stops, let winners run",
        "style": "trend",
        "hold_time": "hours-days",
        "icon": "🚀",
        "params": {
            "rsi_min": 58,
            "rsi_max": 75,
            "require_macd_confirm": True,
            "require_price_above_sma": True,
            "min_confidence": 0.60,
            "atr_sl_mult": 2.5,
            "atr_tp_mult": 4.5,
            "trail_activation": 2.0,
            "trail_step": 0.75,
            "time_stop_candles": 18,
            "cooldown_candles": 4,
        },
    },
    "dip_hunter": {
        "name": "Dip Hunter",
        "description": "Buy deep oversold, sell deep overbought at Bollinger extremes only",
        "style": "mean_reversion",
        "hold_time": "hours",
        "icon": "🎯",
        "params": {
            "rsi_oversold": 25,
            "rsi_overbought": 75,
            "bb_penetration": True,
            "min_confidence": 0.58,
            "atr_sl_mult": 2.0,
            "atr_tp_mult": 2.5,
            "trail_activation": 1.0,
            "trail_step": 0.4,
            "time_stop_candles": 8,
            "cooldown_candles": 3,
        },
    },
    "breakout_blitz": {
        "name": "Breakout Blitz",
        "description": "Catch confirmed range breakouts with momentum follow-through",
        "style": "breakout",
        "hold_time": "hours-days",
        "icon": "⚡",
        "params": {
            "lookback_periods": 24,
            "rsi_min": 55,
            "rsi_max": 78,
            "min_confidence": 0.60,
            "atr_sl_mult": 2.0,
            "atr_tp_mult": 4.0,
            "trail_activation": 1.5,
            "trail_step": 0.6,
            "time_stop_candles": 14,
            "cooldown_candles": 4,
        },
    },
    "scalp_sniper": {
        "name": "Scalp Sniper",
        "description": "Precision scalps at extreme levels in confirmed ranging markets",
        "style": "scalping",
        "hold_time": "minutes-hours",
        "icon": "🎯",
        "params": {
            "rsi_oversold": 25,
            "rsi_overbought": 75,
            "min_confidence": 0.60,
            "atr_sl_mult": 1.8,
            "atr_tp_mult": 2.5,
            "trail_activation": 0.8,
            "trail_step": 0.3,
            "time_stop_candles": 6,
            "cooldown_candles": 2,
        },
    },
    "swing_king": {
        "name": "Swing King",
        "description": "Patient multi-day entries with wide stops — maximum conviction only",
        "style": "swing",
        "hold_time": "days-weeks",
        "icon": "👑",
        "params": {
            "rsi_oversold": 22,
            "rsi_overbought": 78,
            "require_trend_align": True,
            "min_confidence": 0.65,
            "atr_sl_mult": 3.5,
            "atr_tp_mult": 6.0,
            "trail_activation": 2.5,
            "trail_step": 1.0,
            "time_stop_candles": 36,
            "cooldown_candles": 6,
        },
    },
}

# ══════════════════════════════════════════════════════════════════════════════
#  REGIME DETECTOR
# ══════════════════════════════════════════════════════════════════════════════

class RegimeDetector:
    def __init__(self, lookback: int = 20):
        self.lookback = lookback
    
    def detect(self, candles: List[Dict]) -> Regime:
        if len(candles) < 50:
            return Regime.UNKNOWN
        
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        
        adx = self._calculate_adx(highs, lows, closes)
        bb_width = self._calculate_bb_width(closes)
        
        sma_20 = np.mean(closes[-20:])
        sma_50 = np.mean(closes[-50:])
        trend_up = sma_20 > sma_50
        
        if adx > 25:
            return Regime.TRENDING_UP if trend_up else Regime.TRENDING_DOWN
        elif bb_width > 0.06:
            return Regime.VOLATILE
        else:
            return Regime.RANGING
    
    def _calculate_adx(self, highs, lows, closes, period=14):
        n = len(closes)
        if n < period + 1:
            return 0
        tr = np.maximum(highs[1:] - lows[1:],
                       np.maximum(np.abs(highs[1:] - closes[:-1]),
                                 np.abs(lows[1:] - closes[:-1])))
        plus_dm = np.where((highs[1:] - highs[:-1]) > (lows[:-1] - lows[1:]),
                          np.maximum(highs[1:] - highs[:-1], 0), 0)
        minus_dm = np.where((lows[:-1] - lows[1:]) > (highs[1:] - highs[:-1]),
                           np.maximum(lows[:-1] - lows[1:], 0), 0)
        atr = self._smooth(tr, period)
        plus_di = 100 * self._smooth(plus_dm, period) / (atr + 1e-10)
        minus_di = 100 * self._smooth(minus_dm, period) / (atr + 1e-10)
        dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di + 1e-10)
        adx = self._smooth(dx, period)
        return adx[-1] if len(adx) > 0 else 0
    
    def _calculate_bb_width(self, closes):
        n = self.lookback
        sma = np.mean(closes[-n:])
        std = np.std(closes[-n:])
        return (2 * std) / sma if sma > 0 else 0
    
    def _smooth(self, data, period):
        result = np.zeros_like(data, dtype=float)
        if len(data) < period:
            return result
        result[period-1] = np.mean(data[:period])
        for i in range(period, len(data)):
            result[i] = (result[i-1] * (period-1) + data[i]) / period
        return result[period-1:]

# ══════════════════════════════════════════════════════════════════════════════
#  MACRO CALENDAR
# ══════════════════════════════════════════════════════════════════════════════

class MacroCalendar:
    def __init__(self):
        self.events = [
            ("2026-03-18", "FOMC"), ("2026-05-06", "FOMC"),
            ("2026-06-17", "FOMC"), ("2026-07-29", "FOMC"),
            ("2026-09-16", "FOMC"), ("2026-11-04", "FOMC"),
            ("2026-12-16", "FOMC"),
        ]
    
    def get_context(self) -> Tuple[MacroContext, Optional[str]]:
        now = datetime.now(timezone.utc)
        for date_str, event in self.events:
            event_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            hours_until = (event_date - now).total_seconds() / 3600
            if 0 <= hours_until <= 4:
                return MacroContext.FREEZE, f"{event} in {hours_until:.1f}h"
            elif 4 < hours_until <= 24:
                return MacroContext.CAUTION, f"{event} tomorrow"
        return MacroContext.NONE, None

# ══════════════════════════════════════════════════════════════════════════════
#  SIGNAL ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class SignalEngine:
    def __init__(self):
        self.regime_detector = RegimeDetector()
        self.macro_calendar = MacroCalendar()
    
    def generate_signal(self, symbol: str, candles: List[Dict], strategy_id: str = "apex_adaptive",
                         candles_4h: Optional[List[Dict]] = None,
                         funding_rate: float = 0.0) -> Optional[Signal]:
        if len(candles) < 50:
            return None

        strategy = STRATEGIES.get(strategy_id, STRATEGIES["apex_adaptive"])
        params = strategy["params"]

        regime = self.regime_detector.detect(candles)
        macro_context, _ = self.macro_calendar.get_context()

        if macro_context == MacroContext.FREEZE:
            return None

        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        volumes = np.array([c.get("volume", 0) for c in candles])
        current_price = closes[-1]

        rsi = self._calculate_rsi(closes)
        sma_20 = np.mean(closes[-20:])
        sma_50 = np.mean(closes[-50:])
        ema_12 = self._calculate_ema(closes, 12)
        ema_26 = self._calculate_ema(closes, 26)
        macd = ema_12 - ema_26
        bb_upper, bb_lower, bb_mid = self._calculate_bollinger(closes)
        atr = self._calculate_atr(highs, lows, closes)

        # ── Multi-Timeframe Analysis (4h) ──────────────────────────────
        htf_bias = self._get_htf_bias(candles_4h)

        # ── Volume Analysis ────────────────────────────────────────────
        vol_confirm = self._check_volume_confirmation(volumes)

        signal = None
        if strategy_id == "apex_adaptive":
            signal = self._strategy_apex_adaptive(symbol, candles, params, regime, macro_context,
                                                 current_price, rsi, sma_20, sma_50, macd, bb_upper, bb_lower, bb_mid, atr, highs, lows)
        elif strategy_id == "momentum_rider":
            signal = self._strategy_momentum_rider(symbol, params, regime, macro_context,
                                                  current_price, rsi, sma_20, sma_50, macd, atr)
        elif strategy_id == "dip_hunter":
            signal = self._strategy_dip_hunter(symbol, params, regime, macro_context,
                                              current_price, rsi, bb_upper, bb_lower, bb_mid, atr)
        elif strategy_id == "breakout_blitz":
            signal = self._strategy_breakout_blitz(symbol, params, regime, macro_context,
                                                  current_price, rsi, highs, lows, atr)
        elif strategy_id == "scalp_sniper":
            signal = self._strategy_scalp_sniper(symbol, params, regime, macro_context,
                                                current_price, rsi, sma_20, bb_upper, bb_lower, bb_mid, atr)
        elif strategy_id == "swing_king":
            signal = self._strategy_swing_king(symbol, params, regime, macro_context,
                                              current_price, rsi, sma_20, sma_50, macd, atr)

        # ── Apply Multi-Timeframe, Volume & Funding Rate Filters ────────
        if signal:
            signal = self._apply_htf_volume_filter(signal, htf_bias, vol_confirm, strategy, funding_rate)

        # Enrich every signal with structured trade thesis
        if signal:
            signal = self._enrich_explanation(signal, atr, strategy)

        return signal

    def _get_htf_bias(self, candles_4h: Optional[List[Dict]]) -> str:
        """
        Determine higher-timeframe (4h) trend bias.
        Returns: 'bullish', 'bearish', or 'neutral'
        """
        if not candles_4h or len(candles_4h) < 30:
            return "neutral"

        closes = np.array([c["close"] for c in candles_4h])
        highs = np.array([c["high"] for c in candles_4h])
        lows = np.array([c["low"] for c in candles_4h])

        # 4h SMA trend
        sma_20 = np.mean(closes[-20:])
        sma_50 = np.mean(closes[-min(50, len(closes)):])
        current = closes[-1]

        # 4h RSI
        rsi_4h = self._calculate_rsi(closes)

        # 4h MACD
        ema_12 = self._calculate_ema(closes, 12)
        ema_26 = self._calculate_ema(closes, 26)
        macd_4h = ema_12 - ema_26

        # 4h ADX for trend strength
        adx_4h = self.regime_detector._calculate_adx(highs, lows, closes)

        bullish_score = 0
        bearish_score = 0

        # SMA alignment
        if current > sma_20 > sma_50:
            bullish_score += 2
        elif current < sma_20 < sma_50:
            bearish_score += 2

        # MACD direction
        if macd_4h > 0:
            bullish_score += 1
        elif macd_4h < 0:
            bearish_score += 1

        # RSI bias
        if rsi_4h > 55:
            bullish_score += 1
        elif rsi_4h < 45:
            bearish_score += 1

        # Strong trend (ADX > 25)
        if adx_4h > 25:
            if bullish_score > bearish_score:
                bullish_score += 1
            elif bearish_score > bullish_score:
                bearish_score += 1

        if bullish_score >= 3:
            return "bullish"
        elif bearish_score >= 3:
            return "bearish"
        return "neutral"

    def _check_volume_confirmation(self, volumes: np.ndarray) -> Dict:
        """
        Analyze volume to confirm or deny signal quality.
        Returns dict with volume metrics.
        """
        if len(volumes) < 20 or np.sum(volumes) == 0:
            return {"confirmed": True, "ratio": 1.0, "trend": "flat", "note": ""}

        avg_vol_20 = np.mean(volumes[-20:])
        avg_vol_5 = np.mean(volumes[-5:])
        current_vol = volumes[-1]

        # Volume ratio: current vs 20-period average
        vol_ratio = current_vol / avg_vol_20 if avg_vol_20 > 0 else 1.0

        # Recent volume trend (5-bar vs 20-bar)
        vol_trend_ratio = avg_vol_5 / avg_vol_20 if avg_vol_20 > 0 else 1.0

        # Volume trend direction
        if vol_trend_ratio > 1.3:
            vol_trend = "surging"
        elif vol_trend_ratio > 1.1:
            vol_trend = "rising"
        elif vol_trend_ratio < 0.7:
            vol_trend = "drying_up"
        elif vol_trend_ratio < 0.9:
            vol_trend = "declining"
        else:
            vol_trend = "flat"

        # Confirmation logic
        confirmed = True
        note = ""

        # Breakout on low volume = likely fake
        if vol_ratio < 0.5:
            confirmed = False
            note = "Volume too low — possible fake move"
        # Trend with drying volume = weakening
        elif vol_trend == "drying_up":
            confirmed = False
            note = "Volume drying up — trend may be exhausting"

        return {
            "confirmed": confirmed,
            "ratio": round(vol_ratio, 2),
            "trend": vol_trend,
            "note": note,
        }

    def _apply_htf_volume_filter(self, signal: Signal, htf_bias: str,
                                  vol_confirm: Dict, strategy: Dict,
                                  funding_rate: float = 0.0) -> Optional[Signal]:
        """
        Gate every signal through multi-timeframe alignment, volume confirmation,
        and funding rate awareness. No trade passes without all checks.
        """
        strategy_style = strategy.get("style", "hybrid")
        is_long = signal.type == SignalType.LONG
        is_short = signal.type == SignalType.SHORT

        # ── Funding Rate Filter ───────────────────────────────────────
        # Positive funding = longs pay shorts (crowded long), negative = shorts pay longs
        if abs(funding_rate) > 0.0001:  # Only act on meaningful funding
            annual_rate = funding_rate * 3 * 365  # Hourly rate → annualized
            if is_long and funding_rate > 0.0003:
                # High positive funding = crowded long, penalize longs
                penalty = min(0.85, 1.0 - abs(funding_rate) * 500)
                signal.confidence *= penalty
                signal.explanation += f" (Funding headwind: {annual_rate:.0f}% APR against)"
            elif is_short and funding_rate < -0.0003:
                # High negative funding = crowded short, penalize shorts
                penalty = min(0.85, 1.0 - abs(funding_rate) * 500)
                signal.confidence *= penalty
                signal.explanation += f" (Funding headwind: {abs(annual_rate):.0f}% APR against)"
            elif is_long and funding_rate < -0.0002:
                # Negative funding = shorts pay us, boost longs
                signal.confidence = min(0.95, signal.confidence * 1.05)
                signal.explanation += f" (Funding tailwind: {abs(annual_rate):.0f}% APR earned)"
            elif is_short and funding_rate > 0.0002:
                # Positive funding = longs pay us, boost shorts
                signal.confidence = min(0.95, signal.confidence * 1.05)
                signal.explanation += f" (Funding tailwind: {annual_rate:.0f}% APR earned)"

        # ── HTF Filter ─────────────────────────────────────────────────
        # Trend strategies: MUST align with 4h direction. No LONG against 4h bearish.
        if strategy_style in ["trend", "breakout", "swing"]:
            if is_long and htf_bias == "bearish":
                logger.info(f"🚫 HTF REJECT: {signal.symbol} LONG blocked — 4h trend is bearish")
                return None
            if is_short and htf_bias == "bullish":
                logger.info(f"🚫 HTF REJECT: {signal.symbol} SHORT blocked — 4h trend is bullish")
                return None

        # Mean reversion / scalping: 4h opposition = reduce confidence (don't block)
        if strategy_style in ["mean_reversion", "scalping"]:
            if (is_long and htf_bias == "bearish") or (is_short and htf_bias == "bullish"):
                signal.confidence *= 0.75
                signal.explanation += " (Reduced: counter to 4h trend)"

        # Hybrid (apex_adaptive): block on strong opposition, reduce on mild
        if strategy_style == "hybrid":
            if is_long and htf_bias == "bearish":
                signal.confidence *= 0.6
                signal.explanation += " (Caution: 4h trend bearish)"
                if signal.confidence < 0.55:
                    logger.info(f"🚫 HTF REJECT: {signal.symbol} LONG confidence too low after 4h penalty")
                    return None
            elif is_short and htf_bias == "bullish":
                signal.confidence *= 0.6
                signal.explanation += " (Caution: 4h trend bullish)"
                if signal.confidence < 0.55:
                    logger.info(f"🚫 HTF REJECT: {signal.symbol} SHORT confidence too low after 4h penalty")
                    return None

        # HTF alignment bonus — boost confidence when 1h and 4h agree
        if (is_long and htf_bias == "bullish") or (is_short and htf_bias == "bearish"):
            signal.confidence = min(0.95, signal.confidence * 1.1)
            signal.explanation += " (Boosted: aligned with 4h trend)"

        # ── Volume Filter ──────────────────────────────────────────────
        if not vol_confirm["confirmed"]:
            # Breakouts absolutely need volume — hard reject
            if strategy_style == "breakout":
                logger.info(f"🚫 VOL REJECT: {signal.symbol} breakout blocked — {vol_confirm['note']}")
                return None
            # Other strategies: penalize confidence
            signal.confidence *= 0.8
            signal.explanation += f" ({vol_confirm['note']})"
            if signal.confidence < 0.50:
                logger.info(f"🚫 VOL REJECT: {signal.symbol} confidence too low after volume penalty")
                return None

        # Volume surge bonus — high volume confirms the move
        if vol_confirm["ratio"] > 1.5 and vol_confirm["confirmed"]:
            signal.confidence = min(0.95, signal.confidence * 1.05)
            signal.explanation += f" (Strong volume: {vol_confirm['ratio']}x avg)"

        # Final confidence gate after all adjustments
        min_conf = strategy["params"].get("min_confidence", 0.60)
        if signal.confidence < min_conf:
            logger.info(f"🚫 FINAL REJECT: {signal.symbol} {signal.type.value} confidence "
                        f"{signal.confidence:.0%} below min {min_conf:.0%} after filters")
            return None

        return signal

    def _enrich_explanation(self, signal: Signal, atr: float, strategy: Dict) -> Signal:
        """Add structured context to every trade explanation: targets, R:R, expectations."""
        entry = signal.entry_price
        sl = signal.stop_loss
        tp = signal.take_profit
        risk_dist = abs(entry - sl)
        reward_dist = abs(tp - entry)
        rr = reward_dist / risk_dist if risk_dist > 0 else 0

        # Expected move as percentage
        tp_pct = (reward_dist / entry) * 100 if entry > 0 else 0
        sl_pct = (risk_dist / entry) * 100 if entry > 0 else 0

        # Hold time expectation from strategy
        hold_time = strategy.get("hold_time", "varies")

        # Build the enriched explanation
        base = signal.explanation.rstrip(".")
        enriched = (
            f"{base}. "
            f"Target: ${tp:,.2f} (+{tp_pct:.1f}%), "
            f"Stop: ${sl:,.2f} (-{sl_pct:.1f}%). "
            f"R:R {rr:.1f}:1. "
            f"Market: {signal.regime.value.replace('_', ' ').title()}. "
            f"Expected hold: {hold_time}."
        )
        signal.explanation = enriched
        return signal

    def _strategy_apex_adaptive(self, symbol, candles, params, regime, macro_context,
                                 current_price, rsi, sma_20, sma_50, macd, bb_upper, bb_lower, bb_mid, atr, highs, lows):
        signal = None
        if regime == Regime.TRENDING_UP:
            rsi_min = params["trend_rsi_momentum_min"]
            rsi_max = params["trend_rsi_momentum_max"]
            if rsi_min < rsi < rsi_max and current_price > sma_20 > sma_50 and macd > 0:
                confidence = min(0.8, 0.5 + (rsi - 50) / 100)
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=current_price - (params["atr_sl_mult"] * atr),
                    take_profit=current_price + (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Strong uptrend. RSI {rsi:.0f}, price above SMAs, MACD positive. LONG {confidence:.0%}.",
                    rsi=rsi, macd=macd)
            elif rsi < params["trend_rsi_pullback"] and current_price > sma_50:
                confidence = min(0.75, 0.4 + (params["trend_rsi_pullback"] - rsi) / 100)
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=current_price - (params["atr_sl_mult"] * atr),
                    take_profit=current_price + (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Pullback in uptrend. RSI {rsi:.0f}. Buying dip {confidence:.0%}.",
                    rsi=rsi, macd=macd)
        elif regime == Regime.TRENDING_DOWN:
            rsi_min = 100 - params["trend_rsi_momentum_max"]
            rsi_max = 100 - params["trend_rsi_momentum_min"]
            if rsi_min < rsi < rsi_max and current_price < sma_20 < sma_50 and macd < 0:
                confidence = min(0.8, 0.5 + (50 - rsi) / 100)
                signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=current_price + (params["atr_sl_mult"] * atr),
                    take_profit=current_price - (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Strong downtrend. RSI {rsi:.0f}. SHORT {confidence:.0%}.",
                    rsi=rsi, macd=macd)
        elif regime == Regime.RANGING:
            if current_price < bb_lower and rsi < params["mean_rev_rsi_oversold"]:
                confidence = min(0.7, 0.4 + (params["mean_rev_rsi_oversold"] - rsi) / 50)
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=current_price - (1.5 * atr), take_profit=bb_mid,
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Mean reversion. Below BB, RSI oversold {rsi:.0f}. LONG to midband.",
                    rsi=rsi, macd=macd)
            elif current_price > bb_upper and rsi > params["mean_rev_rsi_overbought"]:
                confidence = min(0.7, 0.4 + (rsi - params["mean_rev_rsi_overbought"]) / 50)
                signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=current_price + (1.5 * atr), take_profit=bb_mid,
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Mean reversion. Above BB, RSI overbought {rsi:.0f}. SHORT to midband.",
                    rsi=rsi, macd=macd)
        elif regime == Regime.VOLATILE:
            recent_high = max(highs[-20:])
            recent_low = min(lows[-20:])
            if current_price > recent_high and 50 < rsi < 75:
                confidence = min(0.65, 0.4 + (rsi - 50) / 100)
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=recent_high - atr, take_profit=current_price + (2.5 * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Bullish breakout above ${recent_high:,.0f}. LONG {confidence:.0%}.",
                    rsi=rsi, macd=macd)
            elif current_price < recent_low and 25 < rsi < 50:
                confidence = min(0.65, 0.4 + (50 - rsi) / 100)
                signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=recent_low + atr, take_profit=current_price - (2.5 * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🔄 APEX Adaptive: Bearish breakout below ${recent_low:,.0f}. SHORT {confidence:.0%}.",
                    rsi=rsi, macd=macd)
        if signal and signal.confidence < params["min_confidence"]:
            return None
        if signal and macro_context == MacroContext.CAUTION:
            signal.confidence *= 0.7
            signal.explanation += " (Reduced: macro event upcoming)"
        return signal

    def _strategy_momentum_rider(self, symbol, params, regime, macro_context,
                                  current_price, rsi, sma_20, sma_50, macd, atr):
        if regime not in [Regime.TRENDING_UP, Regime.TRENDING_DOWN]:
            return None
        signal = None
        if regime == Regime.TRENDING_UP:
            if params["rsi_min"] < rsi < params["rsi_max"] and current_price > sma_20 > sma_50 and macd > 0:
                confidence = min(0.85, 0.55 + (rsi - 50) / 100 + (0.1 if macd > 0 else 0))
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="MOMENTUM_RIDER", entry_price=current_price,
                    stop_loss=current_price - (params["atr_sl_mult"] * atr),
                    take_profit=current_price + (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🚀 Momentum Rider: Strong uptrend. RSI {rsi:.0f}, MACD {macd:.2f}. LONG.",
                    rsi=rsi, macd=macd)
        elif regime == Regime.TRENDING_DOWN:
            rsi_inv_min = 100 - params["rsi_max"]
            rsi_inv_max = 100 - params["rsi_min"]
            if rsi_inv_min < rsi < rsi_inv_max and current_price < sma_20 < sma_50 and macd < 0:
                confidence = min(0.85, 0.55 + (50 - rsi) / 100 + (0.1 if macd < 0 else 0))
                signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="MOMENTUM_RIDER", entry_price=current_price,
                    stop_loss=current_price + (params["atr_sl_mult"] * atr),
                    take_profit=current_price - (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🚀 Momentum Rider: Strong downtrend. RSI {rsi:.0f}, MACD {macd:.2f}. SHORT.",
                    rsi=rsi, macd=macd)
        if signal and signal.confidence < params["min_confidence"]:
            return None
        return signal

    def _strategy_dip_hunter(self, symbol, params, regime, macro_context,
                              current_price, rsi, bb_upper, bb_lower, bb_mid, atr):
        if regime == Regime.VOLATILE:
            return None
        signal = None
        if rsi < params["rsi_oversold"] and current_price <= bb_lower:
            confidence = min(0.75, 0.45 + (params["rsi_oversold"] - rsi) / 60)
            signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                strategy="DIP_HUNTER", entry_price=current_price,
                stop_loss=current_price - (params["atr_sl_mult"] * atr), take_profit=bb_mid,
                regime=regime, macro=macro_context,
                explanation=f"🎯 Dip Hunter: RSI {rsi:.0f}, at lower BB. LONG to ${bb_mid:,.0f}.",
                rsi=rsi, macd=0)
        elif rsi > params["rsi_overbought"] and current_price >= bb_upper:
            confidence = min(0.75, 0.45 + (rsi - params["rsi_overbought"]) / 60)
            signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                strategy="DIP_HUNTER", entry_price=current_price,
                stop_loss=current_price + (params["atr_sl_mult"] * atr), take_profit=bb_mid,
                regime=regime, macro=macro_context,
                explanation=f"🎯 Dip Hunter: RSI {rsi:.0f}, at upper BB. SHORT to ${bb_mid:,.0f}.",
                rsi=rsi, macd=0)
        if signal and signal.confidence < params["min_confidence"]:
            return None
        return signal

    def _strategy_breakout_blitz(self, symbol, params, regime, macro_context,
                                  current_price, rsi, highs, lows, atr):
        lookback = params["lookback_periods"]
        recent_high = max(highs[-lookback:])
        recent_low = min(lows[-lookback:])
        signal = None
        if current_price > recent_high and params["rsi_min"] < rsi < params["rsi_max"]:
            breakout_strength = (current_price - recent_high) / atr
            confidence = min(0.8, 0.5 + breakout_strength * 0.1 + (rsi - 50) / 200)
            signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                strategy="BREAKOUT_BLITZ", entry_price=current_price,
                stop_loss=recent_high - (params["atr_sl_mult"] * atr),
                take_profit=current_price + (params["atr_tp_mult"] * atr),
                regime=regime, macro=macro_context,
                explanation=f"⚡ Breakout Blitz: Above {lookback}p high ${recent_high:,.0f}. RSI {rsi:.0f}. LONG.",
                rsi=rsi, macd=0)
        elif current_price < recent_low and (100 - params["rsi_max"]) < rsi < (100 - params["rsi_min"]):
            breakdown_strength = (recent_low - current_price) / atr
            confidence = min(0.8, 0.5 + breakdown_strength * 0.1 + (50 - rsi) / 200)
            signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                strategy="BREAKOUT_BLITZ", entry_price=current_price,
                stop_loss=recent_low + (params["atr_sl_mult"] * atr),
                take_profit=current_price - (params["atr_tp_mult"] * atr),
                regime=regime, macro=macro_context,
                explanation=f"⚡ Breakout Blitz: Below {lookback}p low ${recent_low:,.0f}. RSI {rsi:.0f}. SHORT.",
                rsi=rsi, macd=0)
        if signal and signal.confidence < params["min_confidence"]:
            return None
        return signal

    def _strategy_scalp_sniper(self, symbol, params, regime, macro_context,
                                current_price, rsi, sma_20, bb_upper, bb_lower, bb_mid, atr):
        # Only scalp in ranging markets - never fight a trend
        if regime in [Regime.TRENDING_UP, Regime.TRENDING_DOWN, Regime.UNKNOWN]:
            return None
        signal = None
        if rsi < params["rsi_oversold"]:
            bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
            if bb_position < 0.3:
                confidence = min(0.7, 0.45 + (params["rsi_oversold"] - rsi) / 80)
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="SCALP_SNIPER", entry_price=current_price,
                    stop_loss=current_price - (params["atr_sl_mult"] * atr),
                    take_profit=current_price + (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🎯 Scalp Sniper: RSI oversold {rsi:.0f}, near lower BB, ranging market. LONG.",
                    rsi=rsi, macd=0)
        elif rsi > params["rsi_overbought"]:
            bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
            if bb_position > 0.7:
                confidence = min(0.7, 0.45 + (rsi - params["rsi_overbought"]) / 80)
                signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="SCALP_SNIPER", entry_price=current_price,
                    stop_loss=current_price + (params["atr_sl_mult"] * atr),
                    take_profit=current_price - (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"🎯 Scalp Sniper: RSI overbought {rsi:.0f}, near upper BB, ranging market. SHORT.",
                    rsi=rsi, macd=0)
        if signal and signal.confidence < params["min_confidence"]:
            return None
        return signal

    def _strategy_swing_king(self, symbol, params, regime, macro_context,
                              current_price, rsi, sma_20, sma_50, macd, atr):
        signal = None
        if rsi < params["rsi_oversold"]:
            trend_bias = "bullish" if sma_20 > sma_50 else "bearish"
            if trend_bias == "bullish" or rsi < 25:
                confidence = min(0.8, 0.5 + (params["rsi_oversold"] - rsi) / 50)
                if trend_bias == "bullish":
                    confidence += 0.1
                signal = Signal(type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="SWING_KING", entry_price=current_price,
                    stop_loss=current_price - (params["atr_sl_mult"] * atr),
                    take_profit=current_price + (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"👑 Swing King: RSI {rsi:.0f}, {trend_bias} bias. Patient swing LONG.",
                    rsi=rsi, macd=macd)
        elif rsi > params["rsi_overbought"]:
            trend_bias = "bearish" if sma_20 < sma_50 else "bullish"
            if trend_bias == "bearish" or rsi > 75:
                confidence = min(0.8, 0.5 + (rsi - params["rsi_overbought"]) / 50)
                if trend_bias == "bearish":
                    confidence += 0.1
                signal = Signal(type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="SWING_KING", entry_price=current_price,
                    stop_loss=current_price + (params["atr_sl_mult"] * atr),
                    take_profit=current_price - (params["atr_tp_mult"] * atr),
                    regime=regime, macro=macro_context,
                    explanation=f"👑 Swing King: RSI {rsi:.0f}, {trend_bias} bias. Patient swing SHORT.",
                    rsi=rsi, macd=macd)
        if signal and signal.confidence < params["min_confidence"]:
            return None
        return signal

    def scan_signal_strength(self, symbol: str, candles: List[Dict]) -> Dict:
        if len(candles) < 50:
            return {"symbol": symbol, "strength": 0, "direction": "NEUTRAL", "trigger": "—", "rsi": 0}
        regime = self.regime_detector.detect(candles)
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        current_price = closes[-1]
        rsi = self._calculate_rsi(closes)
        sma_20 = np.mean(closes[-20:])
        sma_50 = np.mean(closes[-50:])
        ema_12 = self._calculate_ema(closes, 12)
        ema_26 = self._calculate_ema(closes, 26)
        macd = ema_12 - ema_26
        bb_upper, bb_lower, _ = self._calculate_bollinger(closes)
        strength = 0
        direction = "NEUTRAL"
        trigger = "—"
        if regime == Regime.TRENDING_UP:
            if current_price > sma_20 > sma_50 and macd > 0:
                strength = 70 + int((rsi - 50) / 20 * 30) if 50 < rsi < 70 else max(0, 70 - abs(rsi - 60) * 2)
                trigger = "MOMENTUM"
            elif rsi < 50 and current_price > sma_50:
                strength = int(50 + (50 - rsi))
                trigger = "PULLBACK"
            else:
                strength = 20
            direction = "LONG"
        elif regime == Regime.TRENDING_DOWN:
            if current_price < sma_20 < sma_50 and macd < 0:
                strength = 70 + int((50 - rsi) / 20 * 30) if 30 < rsi < 50 else max(0, 70 - abs(rsi - 40) * 2)
                trigger = "MOMENTUM"
            elif rsi > 50 and current_price < sma_50:
                strength = int(50 + (rsi - 50))
                trigger = "PULLBACK"
            else:
                strength = 20
            direction = "SHORT"
        elif regime == Regime.RANGING:
            bb_range = bb_upper - bb_lower
            bb_pos = (current_price - bb_lower) / bb_range if bb_range > 0 else 0.5
            if bb_pos < 0.3 and rsi < 40:
                strength = int(60 + (0.3 - bb_pos) * 100)
                direction = "LONG"
            elif bb_pos > 0.7 and rsi > 60:
                strength = int(60 + (bb_pos - 0.7) * 100)
                direction = "SHORT"
            else:
                strength = int(30 + abs(bb_pos - 0.5) * 60)
                direction = "LONG" if bb_pos < 0.5 else "SHORT"
            trigger = "MEAN_REV"
        elif regime == Regime.VOLATILE:
            recent_high = max(highs[-20:])
            recent_low = min(lows[-20:])
            range_size = recent_high - recent_low
            dist_high = (recent_high - current_price) / range_size if range_size > 0 else 1
            dist_low = (current_price - recent_low) / range_size if range_size > 0 else 1
            if dist_high < dist_low:
                strength = int((1 - dist_high) * 100)
                direction = "LONG"
            else:
                strength = int((1 - dist_low) * 100)
                direction = "SHORT"
            trigger = "BREAKOUT"
        return {
            "symbol": symbol, "strength": min(100, max(0, strength)),
            "direction": direction, "trigger": trigger,
            "rsi": round(rsi, 1), "regime": regime.value
        }

    def _calculate_rsi(self, closes, period=14):
        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        if avg_loss == 0:
            return 100
        return 100 - (100 / (1 + avg_gain / avg_loss))

    def _calculate_ema(self, data, period):
        mult = 2 / (period + 1)
        ema = data[0]
        for price in data[1:]:
            ema = (price * mult) + (ema * (1 - mult))
        return ema

    def _calculate_bollinger(self, closes, period=20, std_dev=2):
        sma = np.mean(closes[-period:])
        std = np.std(closes[-period:])
        return sma + std_dev * std, sma - std_dev * std, sma

    def _calculate_atr(self, highs, lows, closes, period=14):
        tr = np.maximum(highs[1:] - lows[1:],
                       np.maximum(np.abs(highs[1:] - closes[:-1]),
                                 np.abs(lows[1:] - closes[:-1])))
        return np.mean(tr[-period:])

# ══════════════════════════════════════════════════════════════════════════════
#  RISK MANAGER
# ══════════════════════════════════════════════════════════════════════════════

class RiskManager:
    def __init__(self, max_positions: int = 3, max_leverage: int = 5):
        self.max_positions = max_positions
        self.max_leverage = max_leverage
        self._start_equity = None
        self._daily_start_equity = None
        self._day = datetime.now(timezone.utc).date()
        # Dynamic sizing: track recent trade outcomes
        self._recent_results: List[float] = []  # Last N trade PnL percentages
        self._consecutive_losses: int = 0

    def reset_daily(self, equity: float):
        today = datetime.now(timezone.utc).date()
        if self._daily_start_equity is None or today > self._day:
            self._daily_start_equity = equity
            self._day = today
        if self._start_equity is None:
            self._start_equity = equity

    def record_trade_result(self, pnl_pct: float):
        """Track trade results for dynamic sizing."""
        self._recent_results.append(pnl_pct)
        if len(self._recent_results) > 20:
            self._recent_results = self._recent_results[-20:]
        if pnl_pct < 0:
            self._consecutive_losses += 1
        else:
            self._consecutive_losses = 0

    def _get_kelly_fraction(self) -> float:
        """Half-Kelly criterion: optimal fraction based on win rate and payoff ratio."""
        if len(self._recent_results) < 5:
            return 1.0  # Not enough data, use full size

        wins = [r for r in self._recent_results if r > 0]
        losses = [r for r in self._recent_results if r < 0]

        if not losses or not wins:
            return 1.0

        win_rate = len(wins) / len(self._recent_results)
        avg_win = np.mean(wins)
        avg_loss = abs(np.mean(losses))

        if avg_loss == 0:
            return 1.0

        payoff_ratio = avg_win / avg_loss
        # Kelly: f = (p * b - q) / b  where p=win_rate, q=loss_rate, b=payoff_ratio
        kelly = (win_rate * payoff_ratio - (1 - win_rate)) / payoff_ratio
        # Use half-Kelly for safety, clamp between 0.25 and 1.0
        half_kelly = max(0.25, min(1.0, kelly * 0.5))
        return half_kelly

    def _get_streak_multiplier(self) -> float:
        """Reduce size after consecutive losses."""
        if self._consecutive_losses == 0:
            return 1.0
        elif self._consecutive_losses == 1:
            return 0.85
        elif self._consecutive_losses == 2:
            return 0.65
        else:
            return 0.5  # 3+ consecutive losses: half size

    def check_risk_limits(self, positions: List[Position], equity: float) -> bool:
        if len(positions) >= self.max_positions:
            return False
        # Daily loss circuit breaker
        if self._daily_start_equity and equity < self._daily_start_equity * (1 - CONFIG.MAX_DAILY_LOSS):
            logger.warning(f"🛑 CIRCUIT BREAKER: Daily loss limit hit. Equity ${equity:.0f} vs start ${self._daily_start_equity:.0f}")
            return False
        return True

    def calculate_position_size(self, equity: float, entry: float, stop_loss: float, confidence: float, risk_per_trade: float):
        if not equity or equity <= 0 or np.isnan(equity):
            return 0, 1

        # Dynamic sizing adjustments
        kelly = self._get_kelly_fraction()
        streak_mult = self._get_streak_multiplier()
        size_mult = kelly * streak_mult

        if size_mult < 1.0:
            logger.info(f"📊 Dynamic sizing: {size_mult:.0%} (Kelly: {kelly:.0%}, Streak: {streak_mult:.0%}, "
                       f"Losses: {self._consecutive_losses})")

        risk_amount = equity * risk_per_trade * confidence * size_mult
        price_risk = abs(entry - stop_loss) / entry

        if price_risk == 0:
            return 0, 1

        # Use the user's selected leverage directly
        leverage = self.max_leverage
        # Position size = risk-based size, capped by leveraged equity
        position_value = risk_amount / price_risk
        size = min(position_value, equity * leverage * 0.9)

        return size, leverage

# ══════════════════════════════════════════════════════════════════════════════
#  ACTIVE POSITION MANAGER — Regime-reactive exits, trailing stops, time stops
# ══════════════════════════════════════════════════════════════════════════════

class ActivePositionManager:
    """
    The core differentiator: actively manages open positions instead of
    just waiting for static SL/TP. Checks regime shifts, trails stops,
    enforces time stops, and manages trade cooldowns.
    """

    def __init__(self, signal_engine: 'SignalEngine'):
        self.signal_engine = signal_engine
        # Cooldown tracking: symbol -> (last_loss_time, cooldown_candles_remaining)
        self.cooldowns: Dict[str, int] = {}

    def manage_position(self, position: Position, candles: List[Dict],
                        strategy_id: str) -> Optional[str]:
        """
        Evaluate an open position and return a close reason if it should exit.
        Returns None if position should stay open.
        """
        if len(candles) < 50:
            return None

        strategy = STRATEGIES.get(strategy_id, STRATEGIES["apex_adaptive"])
        params = strategy["params"]

        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        current_price = closes[-1]
        atr = self.signal_engine._calculate_atr(highs, lows, closes)

        # Increment candle counter
        position.candles_held += 1

        # Update price tracking
        if position.side == "LONG":
            position.highest_price = max(position.highest_price, current_price)
        else:
            position.lowest_price = min(position.lowest_price, current_price)

        # --- CHECK 1: Regime-Reactive Exit ---
        regime_exit = self._check_regime_exit(position, candles, current_price, atr)
        if regime_exit:
            return regime_exit

        # --- CHECK 2: Trailing Stop ---
        trail_exit = self._check_trailing_stop(position, current_price, atr, params)
        if trail_exit:
            return trail_exit

        # --- CHECK 3: Time Stop (Conviction Decay) ---
        time_exit = self._check_time_stop(position, current_price, params)
        if time_exit:
            return time_exit

        # --- CHECK 4: Partial Exit (Scale-Out) ---
        partial = self._check_partial_exit(position, current_price, atr, params)
        if partial:
            return partial

        # --- CHECK 5: Cross-Position Correlation (checked at cycle level) ---
        # This is handled in the BotEngine.cycle() method

        return None

    def _check_regime_exit(self, position: Position, candles: List[Dict],
                           current_price: float, atr: float) -> Optional[str]:
        """
        If the market regime has flipped against the position, exit or tighten.
        This is the #1 game-changer — never hold a LONG into a confirmed downtrend.
        """
        current_regime = self.signal_engine.regime_detector.detect(candles)
        entry_regime = position.regime

        if position.side == "LONG":
            if current_regime == Regime.TRENDING_DOWN:
                # Regime flipped against us — immediate exit
                logger.info(f"🔄 REGIME EXIT: {position.symbol} LONG entered in {entry_regime}, "
                           f"regime now TRENDING_DOWN. Closing.")
                return "REGIME_FLIP"
            elif current_regime == Regime.VOLATILE and entry_regime in ["TRENDING_UP", "RANGING"]:
                # Regime shifted to volatile — tighten stop to breakeven - 0.5 ATR (below entry for LONG)
                breakeven_stop = position.entry_price - (0.5 * atr)
                if current_price > breakeven_stop and position.stop_loss < breakeven_stop:
                    position.stop_loss = breakeven_stop
                    logger.info(f"⚡ REGIME TIGHTEN: {position.symbol} LONG stop → breakeven-0.5ATR "
                               f"(${breakeven_stop:.2f}) due to VOLATILE regime")
        else:  # SHORT
            if current_regime == Regime.TRENDING_UP:
                logger.info(f"🔄 REGIME EXIT: {position.symbol} SHORT entered in {entry_regime}, "
                           f"regime now TRENDING_UP. Closing.")
                return "REGIME_FLIP"
            elif current_regime == Regime.VOLATILE and entry_regime in ["TRENDING_DOWN", "RANGING"]:
                breakeven_stop = position.entry_price - (0.5 * atr)
                if current_price < breakeven_stop and position.stop_loss > breakeven_stop:
                    position.stop_loss = breakeven_stop
                    logger.info(f"⚡ REGIME TIGHTEN: {position.symbol} SHORT stop → breakeven+0.5ATR "
                               f"(${breakeven_stop:.2f}) due to VOLATILE regime")

        return None

    def _check_trailing_stop(self, position: Position, current_price: float,
                             atr: float, params: Dict) -> Optional[str]:
        """
        Activate trailing stop once price moves trail_activation * ATR in our favor.
        Then trail by trail_step * ATR from the peak/trough.
        """
        trail_activation = params.get("trail_activation", 1.5)
        trail_step = params.get("trail_step", 0.5)

        if position.side == "LONG":
            profit_in_atr = (current_price - position.entry_price) / atr if atr > 0 else 0

            if profit_in_atr >= trail_activation:
                if not position.trailing_activated:
                    position.trailing_activated = True
                    logger.info(f"📈 TRAIL ACTIVATED: {position.symbol} LONG at {profit_in_atr:.1f}x ATR profit")

                # Trail from the highest price seen
                new_trail = position.highest_price - (trail_step * atr)
                if new_trail > position.stop_loss:
                    position.stop_loss = new_trail
                    position.trailing_stop = new_trail

                # Check if trailed out
                if current_price <= position.trailing_stop and position.trailing_stop > 0:
                    logger.info(f"📉 TRAIL EXIT: {position.symbol} LONG hit trailing stop "
                               f"${position.trailing_stop:.2f} (peak ${position.highest_price:.2f})")
                    return "TRAILING_STOP"

        else:  # SHORT
            profit_in_atr = (position.entry_price - current_price) / atr if atr > 0 else 0

            if profit_in_atr >= trail_activation:
                if not position.trailing_activated:
                    position.trailing_activated = True
                    logger.info(f"📉 TRAIL ACTIVATED: {position.symbol} SHORT at {profit_in_atr:.1f}x ATR profit")

                new_trail = position.lowest_price + (trail_step * atr)
                if new_trail < position.stop_loss:
                    position.stop_loss = new_trail
                    position.trailing_stop = new_trail

                if current_price >= position.trailing_stop and position.trailing_stop > 0:
                    logger.info(f"📈 TRAIL EXIT: {position.symbol} SHORT hit trailing stop "
                               f"${position.trailing_stop:.2f} (trough ${position.lowest_price:.2f})")
                    return "TRAILING_STOP"

        return None

    def _check_time_stop(self, position: Position, current_price: float,
                         params: Dict) -> Optional[str]:
        """
        If the trade hasn't moved meaningfully after N candles, the thesis is dead.
        Exit at breakeven or small loss rather than waiting for full SL.
        """
        time_stop_candles = params.get("time_stop_candles", 12)

        if position.candles_held >= time_stop_candles:
            # Check if we're near breakeven (within 0.5% either direction)
            pnl_pct = 0
            if position.side == "LONG":
                pnl_pct = (current_price - position.entry_price) / position.entry_price
            else:
                pnl_pct = (position.entry_price - current_price) / position.entry_price

            # Only time-stop if we haven't moved significantly in our favor
            if pnl_pct < 0.015:  # Less than 1.5% profit after N candles
                logger.info(f"⏰ TIME STOP: {position.symbol} {position.side} held {position.candles_held} candles "
                           f"with only {pnl_pct:.2%} profit. Thesis expired.")
                return "TIME_STOP"

        return None

    def _check_partial_exit(self, position: Position, current_price: float,
                            atr: float, params: Dict) -> Optional[str]:
        """
        Scale out in tranches: 25% at 1x target, 50% at 2x target, trail the rest.
        Returns 'PARTIAL_25' or 'PARTIAL_50' for partial closes.
        """
        if position.partial_exits_taken >= 2:
            return None  # Already took both partials, let trailing stop handle the rest

        risk_dist = abs(position.entry_price - position.original_stop_loss) if position.original_stop_loss else atr
        if risk_dist == 0:
            return None

        if position.side == "LONG":
            profit_r = (current_price - position.entry_price) / risk_dist
        else:
            profit_r = (position.entry_price - current_price) / risk_dist

        # First partial: 25% off at 1x R
        if position.partial_exits_taken == 0 and profit_r >= 1.0:
            logger.info(f"💰 PARTIAL 25%: {position.symbol} {position.side} at {profit_r:.1f}R profit")
            return "PARTIAL_25"

        # Second partial: 50% off at 2x R
        if position.partial_exits_taken == 1 and profit_r >= 2.0:
            logger.info(f"💰 PARTIAL 50%: {position.symbol} {position.side} at {profit_r:.1f}R profit")
            return "PARTIAL_50"

        return None

    def register_cooldown(self, symbol: str, strategy_id: str):
        """Register a cooldown after a losing trade."""
        strategy = STRATEGIES.get(strategy_id, STRATEGIES["apex_adaptive"])
        cooldown = strategy["params"].get("cooldown_candles", 3)
        self.cooldowns[symbol] = cooldown
        logger.info(f"❄️ COOLDOWN: {symbol} blocked for {cooldown} candles after loss")

    def tick_cooldowns(self):
        """Decrement cooldown counters each cycle."""
        expired = []
        for symbol, remaining in self.cooldowns.items():
            self.cooldowns[symbol] = remaining - 1
            if self.cooldowns[symbol] <= 0:
                expired.append(symbol)
        for symbol in expired:
            del self.cooldowns[symbol]
            logger.info(f"✅ COOLDOWN EXPIRED: {symbol} ready to trade again")

    def is_on_cooldown(self, symbol: str) -> bool:
        return symbol in self.cooldowns

    def check_correlation_exit(self, positions: List[Position],
                               candles_map: Dict[str, List[Dict]]) -> List[str]:
        """
        If 60%+ of held positions are in assets that have flipped bearish/bullish
        against our direction, that's a correlated macro move. Exit all.
        """
        if len(positions) < 2:
            return []

        bearish_count = 0
        bullish_count = 0
        longs = []
        shorts = []

        for pos in positions:
            candles = candles_map.get(pos.symbol)
            if not candles or len(candles) < 50:
                continue
            regime = self.signal_engine.regime_detector.detect(candles)
            if pos.side == "LONG":
                longs.append(pos)
                if regime == Regime.TRENDING_DOWN:
                    bearish_count += 1
            else:
                shorts.append(pos)
                if regime == Regime.TRENDING_UP:
                    bullish_count += 1

        symbols_to_close = []
        total = len(positions)
        # If 60%+ of positions face adverse regime
        if longs and bearish_count / max(len(longs), 1) >= 0.6:
            symbols_to_close.extend([p.symbol for p in longs])
            logger.warning(f"🚨 CORRELATION EXIT: {bearish_count}/{len(longs)} LONG positions "
                          f"facing TRENDING_DOWN. Closing all longs.")
        if shorts and bullish_count / max(len(shorts), 1) >= 0.6:
            symbols_to_close.extend([p.symbol for p in shorts])
            logger.warning(f"🚨 CORRELATION EXIT: {bullish_count}/{len(shorts)} SHORT positions "
                          f"facing TRENDING_UP. Closing all shorts.")

        return symbols_to_close

# ══════════════════════════════════════════════════════════════════════════════
#  HYPERLIQUID CLIENT - PAPER + LIVE
# ══════════════════════════════════════════════════════════════════════════════

class HyperliquidClient:
    INFO_URL = "https://api.hyperliquid.xyz/info"

    def __init__(self, paper: bool = True, paper_balance: float = 10000.0,
                 private_key: str = "", wallet_address: str = ""):
        self.paper = paper
        self.paper_balance = paper_balance
        self.paper_positions: Dict[str, Position] = {}
        self.session = requests.Session()
        self._price_cache = {}
        self._candle_cache = {}
        self._candle_cache_time: Dict[str, float] = {}
        self.wallet_address = wallet_address

        # Live trading setup
        self._exchange = None
        self._info = None
        if not paper and private_key:
            self._init_live(private_key, wallet_address)

    def _init_live(self, private_key: str, wallet_address: str):
        try:
            from hyperliquid.exchange import Exchange
            from hyperliquid.info import Info
            from hyperliquid.utils import constants
            import eth_account

            account = eth_account.Account.from_key(private_key)
            self._exchange = Exchange(
                account,
                constants.MAINNET_API_URL,
                account_address=wallet_address  # Main wallet - API wallet trades on its behalf
            )
            self._info = Info(constants.MAINNET_API_URL, skip_ws=True)
            logger.info(f"✅ Live trading initialised | Wallet: {wallet_address[:8]}...{wallet_address[-4:]}")
        except Exception as e:
            logger.error(f"❌ Failed to initialise live trading: {e}")
            raise

    def get_candles(self, symbol: str, timeframe: str, limit: int = 100) -> List[Dict]:
        try:
            response = self.session.post(
                self.INFO_URL,
                json={"type": "candleSnapshot", "req": {
                    "coin": symbol, "interval": timeframe,
                    "startTime": int((datetime.now(timezone.utc) - timedelta(hours=limit)).timestamp() * 1000)
                }},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                candles = [{"open": float(c["o"]), "high": float(c["h"]), "low": float(c["l"]),
                            "close": float(c["c"]), "volume": float(c["v"]), "time": c["t"]} for c in data]
                self._candle_cache[symbol] = candles
                self._candle_cache_time[symbol] = time.time()
                return candles
        except Exception as e:
            logger.error(f"Candles error {symbol}: {e}")
        # Stale cache guard: reject cached candles older than 5 minutes
        if symbol in self._candle_cache:
            cache_age = time.time() - self._candle_cache_time.get(symbol, 0)
            if cache_age > 300:
                logger.warning(f"Stale candle cache for {symbol} ({cache_age:.0f}s old) — returning empty")
                return []
        return self._candle_cache.get(symbol, [])

    def get_all_prices(self) -> Dict[str, float]:
        try:
            response = self.session.post(self.INFO_URL, json={"type": "allMids"}, timeout=10)
            if response.status_code == 200:
                self._price_cache = {k: float(v) for k, v in response.json().items()}
        except Exception as e:
            logger.error(f"Failed to fetch all prices: {e}")
        return self._price_cache

    def get_price(self, symbol: str) -> Optional[float]:
        return self.get_all_prices().get(symbol)

    def get_equity(self) -> float:
        if self.paper:
            unrealized = sum(self._calculate_unrealized_pnl(p) for p in self.paper_positions.values())
            return self.paper_balance + unrealized
        try:
            response = self.session.post(
                self.INFO_URL,
                json={"type": "portfolio", "user": self.wallet_address},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                # Get latest account value from day history
                day_data = next((d[1] for d in data if d[0] == "day"), None)
                if day_data and day_data.get("accountValueHistory"):
                    latest = day_data["accountValueHistory"][-1][1]
                    return float(latest)
            return 0.0
        except Exception as e:
            logger.error(f"Failed to get equity: {e}")
            return 0.0

    def get_funding_rates(self) -> Dict[str, float]:
        """Fetch current funding rates from Hyperliquid. Positive = longs pay, Negative = shorts pay."""
        try:
            response = self.session.post(
                self.INFO_URL,
                json={"type": "metaAndAssetCtxs"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                meta = data[0] if isinstance(data, list) and len(data) > 0 else {}
                asset_ctxs = data[1] if isinstance(data, list) and len(data) > 1 else []
                universe = meta.get("universe", [])
                rates = {}
                for i, ctx in enumerate(asset_ctxs):
                    if i < len(universe):
                        symbol = universe[i]["name"]
                        funding = float(ctx.get("funding", 0))
                        rates[symbol] = funding
                return rates
        except Exception as e:
            logger.debug(f"Funding rate fetch error: {e}")
        return {}

    def get_positions(self) -> List[Position]:
        if self.paper:
            return list(self.paper_positions.values())
        try:
            state = self._info.user_state(self.wallet_address)
            positions = []
            for p in state.get("assetPositions", []):
                pos = p.get("position", {})
                if float(pos.get("szi", 0)) == 0:
                    continue
                symbol = pos["coin"]
                size = float(pos["szi"])
                side = "LONG" if size > 0 else "SHORT"
                entry = float(pos.get("entryPx", 0))
                positions.append(Position(
                    id=symbol, symbol=symbol, side=side,
                    entry_price=entry, size=abs(size), leverage=int(float(pos.get("leverage", {}).get("value", 1))),
                    stop_loss=0, take_profit=0,
                    entry_time=datetime.now(timezone.utc),
                    regime="", macro="", strategy="LIVE"
                ))
            return positions
        except Exception as e:
            logger.error(f"Failed to get live positions: {e}")
            return []

    def get_positions_with_pnl(self) -> List[Dict]:
        result = []
        for p in self.get_positions():
            current_price = self.get_price(p.symbol)
            unrealized = self._calculate_unrealized_pnl(p) if current_price else 0
            pnl_pct = (unrealized / p.size * 100) if p.size > 0 else 0

            # Calculate liquidation price estimate
            # Liq price = entry * (1 - 1/leverage) for LONG, entry * (1 + 1/leverage) for SHORT
            liq_price = 0.0
            if p.leverage > 0:
                margin_fraction = 1.0 / p.leverage
                if p.side == "LONG":
                    liq_price = p.entry_price * (1 - margin_fraction * 0.9)  # 90% of margin = maintenance
                else:
                    liq_price = p.entry_price * (1 + margin_fraction * 0.9)
            liq_distance_pct = abs(current_price - liq_price) / current_price * 100 if current_price else 0

            result.append({
                "id": p.id, "symbol": p.symbol, "side": p.side,
                "entry_price": p.entry_price, "current_price": current_price,
                "size": p.size, "unrealized_pnl": round(unrealized, 2),
                "pnl_pct": round(pnl_pct, 2), "leverage": p.leverage,
                "stop_loss": p.stop_loss, "take_profit": p.take_profit,
                "strategy": p.strategy, "explanation": p.explanation,
                "regime": p.regime,
                "opened_at": p.entry_time.isoformat() if p.entry_time else None,
                "liquidation_price": round(liq_price, 2),
                "liquidation_distance_pct": round(liq_distance_pct, 1),
            })
        return result

    def open_position(self, signal: Signal, size: float, leverage: int) -> Optional[Position]:
        if self.paper:
            position = Position(
                id=str(uuid.uuid4()), symbol=signal.symbol, side=signal.type.value,
                entry_price=signal.entry_price, size=size, leverage=leverage,
                stop_loss=signal.stop_loss, take_profit=signal.take_profit,
                entry_time=datetime.now(timezone.utc),
                regime=signal.regime.value, macro=signal.macro.value,
                strategy=signal.strategy, explanation=signal.explanation
            )
            self.paper_positions[signal.symbol] = position
            logger.info(f"📄 Paper {signal.type.value} {signal.symbol} @ ${signal.entry_price:.2f} | {signal.strategy}")
            return position

        # Live trading
        try:
            is_buy = signal.type == SignalType.LONG
            # Get asset metadata for size precision
            meta = self._info.meta()
            asset_idx = next((i for i, a in enumerate(meta["universe"]) if a["name"] == signal.symbol), None)
            if asset_idx is None:
                logger.error(f"Asset {signal.symbol} not found in HL universe")
                return None

            sz_decimals = meta["universe"][asset_idx].get("szDecimals", 3)
            current_price = self.get_price(signal.symbol)
            if not current_price:
                return None

            # Calculate size in asset units
            asset_size = round(size / current_price, sz_decimals)
            if asset_size <= 0:
                logger.error(f"Calculated size too small: {asset_size}")
                return None

            # Set leverage first
            self._exchange.update_leverage(leverage, signal.symbol, is_cross=True)

            # Place market order
            order_result = self._exchange.market_open(
                signal.symbol,
                is_buy,
                asset_size,
                None,  # slippage handled by market order
                0.01   # 1% slippage tolerance
            )

            if order_result and order_result.get("status") == "ok":
                fill = order_result["response"]["data"]["statuses"][0]
                filled_price = float(fill.get("filled", {}).get("avgPx", current_price))
                position = Position(
                    id=str(uuid.uuid4()), symbol=signal.symbol, side=signal.type.value,
                    entry_price=filled_price, size=size, leverage=leverage,
                    stop_loss=signal.stop_loss, take_profit=signal.take_profit,
                    entry_time=datetime.now(timezone.utc),
                    regime=signal.regime.value, macro=signal.macro.value,
                    strategy=signal.strategy, explanation=signal.explanation
                )
                logger.info(f"🚀 LIVE {signal.type.value} {signal.symbol} @ ${filled_price:.2f} | size: {asset_size} | {signal.strategy}")
                return position
            else:
                logger.error(f"Order failed: {order_result}")
                return None

        except Exception as e:
            logger.error(f"Failed to open live position {signal.symbol}: {e}")
            return None

    def close_position(self, position: Position, reason: str) -> Optional[Dict]:
        if self.paper:
            if position.symbol not in self.paper_positions:
                return None
            current_price = self.get_price(position.symbol)
            if not current_price:
                return None
            if position.side == "LONG":
                pnl = (current_price - position.entry_price) / position.entry_price * position.size
            else:
                pnl = (position.entry_price - current_price) / position.entry_price * position.size
            self.paper_balance += pnl
            del self.paper_positions[position.symbol]
            logger.info(f"📄 Paper close {position.symbol} | P&L: ${pnl:+.2f} | {reason}")
            return {
                "symbol": position.symbol, "side": position.side,
                "entry_price": position.entry_price, "exit_price": current_price,
                "size": position.size, "pnl": pnl,
                "pnl_pct": (pnl / position.size) * 100, "reason": reason,
                "held_minutes": int((datetime.now(timezone.utc) - position.entry_time).total_seconds() / 60),
                "strategy": position.strategy,
                "explanation": position.explanation,
                "close_explanation": f"Closed at ${current_price:,.2f}. P&L: ${pnl:.2f} ({reason})"
            }

        # Live close
        try:
            is_buy = position.side == "SHORT"  # Close SHORT = buy, close LONG = sell
            current_price = self.get_price(position.symbol)
            if not current_price:
                return None

            meta = self._info.meta()
            asset_idx = next((i for i, a in enumerate(meta["universe"]) if a["name"] == position.symbol), None)
            sz_decimals = meta["universe"][asset_idx].get("szDecimals", 3) if asset_idx is not None else 3
            asset_size = round(position.size / position.entry_price, sz_decimals)

            order_result = self._exchange.market_close(position.symbol, asset_size, None, 0.01)

            if order_result and order_result.get("status") == "ok":
                fill = order_result["response"]["data"]["statuses"][0]
                exit_price = float(fill.get("filled", {}).get("avgPx", current_price))

                if position.side == "LONG":
                    pnl = (exit_price - position.entry_price) / position.entry_price * position.size
                else:
                    pnl = (position.entry_price - exit_price) / position.entry_price * position.size

                logger.info(f"💰 LIVE close {position.symbol} @ ${exit_price:.2f} | P&L: ${pnl:+.2f} | {reason}")
                return {
                    "symbol": position.symbol, "side": position.side,
                    "entry_price": position.entry_price, "exit_price": exit_price,
                    "size": position.size, "pnl": pnl,
                    "pnl_pct": (pnl / position.size) * 100, "reason": reason,
                    "held_minutes": int((datetime.now(timezone.utc) - position.entry_time).total_seconds() / 60),
                    "strategy": position.strategy,
                    "explanation": position.explanation,
                    "close_explanation": f"Closed at ${exit_price:,.2f}. P&L: ${pnl:.2f} ({reason})"
                }
            else:
                logger.error(f"Close order failed: {order_result}")
                return None

        except Exception as e:
            logger.error(f"Failed to close live position {position.symbol}: {e}")
            return None

    def check_sl_tp(self, position: Position) -> Optional[str]:
        current_price = self.get_price(position.symbol)
        if not current_price:
            return None
        if position.stop_loss == 0 and position.take_profit == 0:
            return None  # Live positions managed by HL natively if no SL/TP set
        if position.side == "LONG":
            if current_price <= position.stop_loss:
                return "SL"
            if current_price >= position.take_profit:
                return "TP"
        else:
            if current_price >= position.stop_loss:
                return "SL"
            if current_price <= position.take_profit:
                return "TP"
        return None

    def _calculate_unrealized_pnl(self, position: Position) -> float:
        current_price = self.get_price(position.symbol)
        if not current_price:
            return 0
        if position.side == "LONG":
            return (current_price - position.entry_price) / position.entry_price * position.size
        return (position.entry_price - current_price) / position.entry_price * position.size

    def load_positions_from_db(self, positions_data: List[Dict]):
        for p in positions_data:
            try:
                position = Position(
                    id=p["id"], symbol=p["symbol"], side=p["side"],
                    entry_price=float(p["entry_price"]), size=float(p["size"]),
                    leverage=int(p["leverage"]),
                    stop_loss=float(p["stop_loss"]) if p.get("stop_loss") else 0,
                    take_profit=float(p["take_profit"]) if p.get("take_profit") else 0,
                    entry_time=datetime.fromisoformat(p["entry_time"].replace("Z", "+00:00")) if isinstance(p["entry_time"], str) else p["entry_time"],
                    regime=p.get("regime", ""), macro=p.get("macro", ""),
                    strategy=p.get("strategy", ""), explanation=p.get("explanation", ""),
                )
                self.paper_positions[position.symbol] = position
                logger.info(f"📂 Loaded: {position.side} {position.symbol} @ ${position.entry_price:.2f}")
            except Exception as e:
                logger.error(f"Failed to load position: {e}")

# ══════════════════════════════════════════════════════════════════════════════
#  DASHBOARD SYNC
# ══════════════════════════════════════════════════════════════════════════════

class BotSync:
    def __init__(self, app_url: str, user_id: str, bot_secret: str):
        self.app_url = app_url
        self.user_id = user_id
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "x-bot-secret": bot_secret,
        })
        self._cycles_today = 0
        self._trades_today = 0
        self._realized_pnl_today = 0.0
        self._day = datetime.now(timezone.utc).date()

    def _reset_daily(self):
        today = datetime.now(timezone.utc).date()
        if today > self._day:
            self._cycles_today = 0
            self._trades_today = 0
            self._realized_pnl_today = 0.0
            self._day = today

    def _post(self, payload: dict) -> bool:
        try:
            r = self.session.post(f"{self.app_url}/api/bot/sync",
                                  json={**payload, "user_id": self.user_id}, timeout=5)
            return r.status_code == 200
        except Exception as e:
            logger.error(f"Failed to post sync data: {e}")
            return False

    def fetch_settings(self) -> Dict:
        try:
            r = self.session.get(f"{self.app_url}/api/bot/settings?user_id={self.user_id}", timeout=5)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            logger.error(f"Failed to fetch settings: {e}")
        return {}

    def fetch_commands(self) -> List[Dict]:
        try:
            r = self.session.get(f"{self.app_url}/api/bot/close?user_id={self.user_id}", timeout=5)
            if r.status_code == 200:
                return r.json().get("commands", [])
        except Exception as e:
            logger.error(f"Failed to fetch commands: {e}")
        return []

    def ack_command(self, command_id: str, status: str = "completed") -> bool:
        try:
            r = self.session.patch(f"{self.app_url}/api/bot/close",
                                   json={"command_id": command_id, "status": status}, timeout=5)
            return r.status_code == 200
        except Exception as e:
            logger.error(f"Failed to ack command {command_id}: {e}")
            return False

    def load_positions(self) -> List[Dict]:
        try:
            r = self.session.get(f"{self.app_url}/api/bot/positions", timeout=5)
            if r.status_code == 200:
                return r.json().get("positions", [])
        except Exception as e:
            logger.debug(f"Failed to load positions: {e}")
        return []

    def save_position(self, position: Position) -> bool:
        try:
            r = self.session.post(f"{self.app_url}/api/bot/positions", json={
                "id": position.id, "symbol": position.symbol, "side": position.side,
                "entry_price": position.entry_price, "size": position.size,
                "leverage": position.leverage, "stop_loss": position.stop_loss,
                "take_profit": position.take_profit,
                "entry_time": position.entry_time.isoformat(),
                "regime": position.regime, "macro": position.macro,
                "strategy": position.strategy, "explanation": position.explanation,
            }, timeout=5)
            return r.status_code == 200
        except Exception as e:
            logger.error(f"Failed to save position {position.symbol}: {e}")
            return False

    def delete_position(self, symbol: str) -> bool:
        try:
            r = self.session.delete(f"{self.app_url}/api/bot/positions",
                                    json={"symbol": symbol}, timeout=5)
            return r.status_code == 200
        except Exception as e:
            logger.error(f"Failed to delete position {symbol}: {e}")
            return False

    def heartbeat(self, equity: float, positions: List[Dict], regime: str, macro: str,
                  strategy: str = "", trade_fired: bool = False, signal_radar: List[Dict] = None):
        self._reset_daily()
        self._cycles_today += 1
        if trade_fired:
            self._trades_today += 1
        total_unrealized = sum(p.get("unrealized_pnl", 0) for p in positions)
        self._post({
            "type": "heartbeat", "equity": equity,
            "open_positions": len(positions), "regime": regime,
            "macro_context": macro, "strategy": strategy,
            "cycles_today": self._cycles_today, "trades_today": self._trades_today,
            "pnl_today": round(total_unrealized + self._realized_pnl_today, 2),
            "unrealized_pnl": round(total_unrealized, 2),
            "positions": positions, "signal_radar": signal_radar or [],
        })

    def trade_signal(self, position: Position, confidence: float, paper: bool):
        self._post({
            "type": "trade_signal",
            "id": position.id, "symbol": position.symbol, "side": position.side,
            "entry_price": position.entry_price, "size": position.size,
            "leverage": position.leverage, "stop_loss": position.stop_loss,
            "take_profit": position.take_profit, "confidence": confidence,
            "regime": position.regime, "macro_context": position.macro,
            "strategy": position.strategy, "explanation": position.explanation,
            "paper": paper, "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def trade_close(self, position: Position, result: Dict, paper: bool):
        self._realized_pnl_today += result["pnl"]
        self._post({
            "type": "trade_close",
            "id": str(uuid.uuid4()), "signal_id": position.id,
            "symbol": result["symbol"], "side": result["side"],
            "entry_price": result["entry_price"], "exit_price": result["exit_price"],
            "size": result["size"], "pnl": round(result["pnl"], 4),
            "pnl_pct": round(result["pnl_pct"], 4), "close_reason": result["reason"],
            "held_minutes": result["held_minutes"],
            "strategy": result.get("strategy", "") or position.strategy,
            "explanation": result.get("close_explanation", ""),
            "paper": paper, "timestamp": datetime.now(timezone.utc).isoformat(),
        })

# ══════════════════════════════════════════════════════════════════════════════
#  NOTIFICATION DISPATCHER — Discord & Telegram webhooks
# ══════════════════════════════════════════════════════════════════════════════

class NotificationDispatcher:
    """Sends trade notifications to Discord and/or Telegram webhooks."""

    def __init__(self):
        self.discord_webhook = os.getenv("DISCORD_WEBHOOK_URL", "")
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
        self.session = requests.Session()
        self.enabled = bool(self.discord_webhook or (self.telegram_token and self.telegram_chat_id))
        if self.enabled:
            channels = []
            if self.discord_webhook:
                channels.append("Discord")
            if self.telegram_token:
                channels.append("Telegram")
            logger.info(f"🔔 Notifications enabled: {', '.join(channels)}")

    def notify_trade_open(self, position: 'Position', equity: float):
        if not self.enabled:
            return
        side_emoji = "🟢" if position.side == "LONG" else "🔴"
        msg = (
            f"{side_emoji} **NEW {position.side}** | {position.symbol}\n"
            f"Entry: ${position.entry_price:,.2f} | Size: ${position.size:,.0f} | Lev: {position.leverage}x\n"
            f"SL: ${position.stop_loss:,.2f} | TP: ${position.take_profit:,.2f}\n"
            f"Strategy: {position.strategy} | Equity: ${equity:,.0f}\n"
            f"_{position.explanation[:200]}_"
        )
        self._send(msg)

    def notify_trade_close(self, result: Dict, equity: float):
        if not self.enabled:
            return
        pnl = result.get("pnl", 0)
        pnl_emoji = "✅" if pnl >= 0 else "❌"
        msg = (
            f"{pnl_emoji} **CLOSED** | {result['symbol']} {result['side']}\n"
            f"Entry: ${result['entry_price']:,.2f} → Exit: ${result['exit_price']:,.2f}\n"
            f"P&L: ${pnl:+,.2f} ({result.get('pnl_pct', 0):+.1f}%) | Reason: {result['reason']}\n"
            f"Held: {result.get('held_minutes', 0)}min | Equity: ${equity:,.0f}"
        )
        self._send(msg)

    def notify_regime_flip(self, symbol: str, old_regime: str, new_regime: str):
        if not self.enabled:
            return
        msg = f"🔄 **REGIME FLIP** | {symbol}: {old_regime} → {new_regime}"
        self._send(msg)

    def notify_circuit_breaker(self, equity: float, daily_start: float):
        if not self.enabled:
            return
        loss_pct = ((daily_start - equity) / daily_start) * 100
        msg = (
            f"🛑 **CIRCUIT BREAKER** | Daily loss limit hit!\n"
            f"Equity: ${equity:,.0f} (down {loss_pct:.1f}% from ${daily_start:,.0f})\n"
            f"Auto-trading paused until tomorrow."
        )
        self._send(msg)

    def _send(self, message: str):
        if self.discord_webhook:
            self._send_discord(message)
        if self.telegram_token and self.telegram_chat_id:
            self._send_telegram(message)

    def _send_discord(self, message: str):
        try:
            self.session.post(self.discord_webhook, json={"content": message}, timeout=5)
        except Exception as e:
            logger.debug(f"Discord notification failed: {e}")

    def _send_telegram(self, message: str):
        try:
            # Convert markdown bold to Telegram HTML
            text = message.replace("**", "").replace("_", "")
            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            self.session.post(url, json={
                "chat_id": self.telegram_chat_id,
                "text": text,
                "parse_mode": "HTML"
            }, timeout=5)
        except Exception as e:
            logger.debug(f"Telegram notification failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN BOT
# ══════════════════════════════════════════════════════════════════════════════

class APEXBot:
    def __init__(self):
        self.config = CONFIG

        # Validate APEX_USER_ID is set and not the old dummy default
        _DUMMY_UUID = "a040d19d-f40e-44f7-9b90-dead9d9bcfeb"
        if not self.config.APEX_USER_ID or self.config.APEX_USER_ID == _DUMMY_UUID:
            logger.error("APEX_USER_ID is not set or is still the default dummy UUID. "
                         "Set the APEX_USER_ID environment variable to your real user ID.")
            raise SystemExit(1)

        try:
            self.client = HyperliquidClient(
                paper=self.config.PAPER_TRADE,
                paper_balance=self.config.PAPER_BALANCE,
                private_key=self.config.HL_PRIVATE_KEY,
                wallet_address=self.config.HL_WALLET_ADDRESS,
            )
        except Exception as e:
            if not self.config.PAPER_TRADE:
                logger.error(f"Live trading initialization failed: {e} — falling back to paper trading mode")
                self.config.PAPER_TRADE = True
                self.client = HyperliquidClient(
                    paper=True,
                    paper_balance=self.config.PAPER_BALANCE,
                )
            else:
                raise
        self.signal_engine = SignalEngine()
        self.risk_manager = RiskManager(
            max_positions=self.config.MAX_POSITIONS,
            max_leverage=self.config.MAX_LEVERAGE
        )
        self.position_manager = ActivePositionManager(self.signal_engine)
        self.sync = BotSync(self.config.APEX_APP_URL, self.config.APEX_USER_ID, self.config.BOT_API_SECRET)
        self.notifications = NotificationDispatcher()
        self.strategy_id = "apex_adaptive"
        self.risk_per_trade = self.config.RISK_PER_TRADE
        self.auto_trading_enabled = True
        self._last_settings_fetch = 0
        self._funding_rates: Dict[str, float] = {}
        self._last_funding_fetch = 0
        self._daily_loss_breaker_tripped = False

    def fetch_settings(self):
        now = time.time()
        if now - self._last_settings_fetch > 60:
            settings = self.sync.fetch_settings()
            if settings:
                self.strategy_id = settings.get("strategy", "apex_adaptive")
                self.risk_per_trade = settings.get("risk_per_trade", self.config.RISK_PER_TRADE)
                self.auto_trading_enabled = settings.get("enabled", True)
                # Apply leverage from dashboard settings
                max_lev = settings.get("max_leverage")
                if max_lev and isinstance(max_lev, int):
                    self.risk_manager.max_leverage = max_lev
                strategy_name = STRATEGIES.get(self.strategy_id, {}).get("name", self.strategy_id)
                status = "🟢 ON" if self.auto_trading_enabled else "🔴 OFF"
                logger.info(f"📋 Settings: {strategy_name}, {self.risk_per_trade*100:.0f}% risk, "
                           f"{self.risk_manager.max_leverage}x max lev, Auto: {status}")
            self._last_settings_fetch = now

    def start(self):
        mode = "PAPER" if self.config.PAPER_TRADE else "⚡ LIVE"
        logger.info("=" * 60)
        logger.info(f"  APEX Trading Bot v10 | Mode: {mode}")
        logger.info(f"  Active Position Manager: ENABLED")
        logger.info(f"  Features: Regime exits, Trailing stops, Time stops, Cooldowns, Correlation guard")
        logger.info(f"  Features: Partial exits (scale-out), Dynamic sizing (Kelly), Funding rate awareness")
        logger.info(f"  Filters: Multi-timeframe (4h) confirmation, Volume analysis")
        logger.info(f"  Notifications: {'ENABLED' if self.notifications.enabled else 'OFF (set DISCORD_WEBHOOK_URL or TELEGRAM_BOT_TOKEN)'}")
        logger.info(f"  Assets: {', '.join(self.config.ASSETS)}")
        logger.info(f"  Max leverage: {self.config.MAX_LEVERAGE}x | Risk/trade: {self.config.RISK_PER_TRADE*100:.0f}%")
        logger.info(f"  Daily loss limit: {self.config.MAX_DAILY_LOSS*100:.0f}%")
        logger.info("=" * 60)

        if self.config.PAPER_TRADE:
            saved_positions = self.sync.load_positions()
            if saved_positions:
                self.client.load_positions_from_db(saved_positions)
                logger.info(f"📂 Loaded {len(saved_positions)} position(s) from database")

        while True:
            try:
                self.fetch_settings()
                self.cycle()
                time.sleep(self.config.CYCLE_INTERVAL)
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                break
            except Exception as e:
                logger.error(f"Cycle error: {e}")
                time.sleep(10)

    def _handle_partial_close(self, position: Position, reason: str):
        """Handle partial exits — reduce position size instead of full close."""
        if reason == "PARTIAL_25":
            close_pct = 0.25
        elif reason == "PARTIAL_50":
            close_pct = 0.50
        else:
            return

        original_size = position.original_size or position.size
        close_size = original_size * close_pct

        if self.config.PAPER_TRADE:
            # Paper: adjust position size and balance
            current_price = self.client.get_price(position.symbol)
            if not current_price:
                return
            if position.side == "LONG":
                pnl = (current_price - position.entry_price) / position.entry_price * close_size
            else:
                pnl = (position.entry_price - current_price) / position.entry_price * close_size
            self.client.paper_balance += pnl
            position.size -= close_size
            position.partial_exits_taken += 1
            # Move stop to breakeven after first partial
            if position.partial_exits_taken == 1:
                position.stop_loss = position.entry_price
                logger.info(f"🔒 Stop → breakeven after partial exit on {position.symbol}")
            logger.info(f"💰 Partial close {close_pct:.0%} of {position.symbol} | P&L: ${pnl:+.2f} | Remaining: ${position.size:.0f}")
            # Sync partial result
            self.sync.heartbeat(
                equity=self.client.get_equity(), positions=self.client.get_positions_with_pnl(),
                regime="", macro="", strategy=self.strategy_id
            )
        else:
            # Live: close partial size via market order
            try:
                current_price = self.client.get_price(position.symbol)
                if not current_price:
                    return
                meta = self.client._info.meta()
                asset_idx = next((i for i, a in enumerate(meta["universe"]) if a["name"] == position.symbol), None)
                sz_decimals = meta["universe"][asset_idx].get("szDecimals", 3) if asset_idx is not None else 3
                asset_close_size = round(close_size / position.entry_price, sz_decimals)

                is_buy = position.side == "SHORT"
                order_result = self.client._exchange.market_open(
                    position.symbol, is_buy, asset_close_size, None, 0.01
                )
                if order_result and order_result.get("status") == "ok":
                    position.size -= close_size
                    position.partial_exits_taken += 1
                    if position.partial_exits_taken == 1:
                        position.stop_loss = position.entry_price
                    logger.info(f"💰 LIVE partial {close_pct:.0%} of {position.symbol}")
            except Exception as e:
                logger.error(f"Partial close failed: {e}")

    def _close_and_sync(self, position: Position, reason: str):
        """Close a position and sync to dashboard. Registers cooldown on loss.
        Also checks daily loss circuit breaker after close."""
        result = self.client.close_position(position, reason)
        if result:
            self.sync.trade_close(position, result, self.config.PAPER_TRADE)
            self.sync.delete_position(position.symbol)
            # Record result for dynamic sizing
            pnl_pct = result.get("pnl_pct", 0)
            self.risk_manager.record_trade_result(pnl_pct)
            # Notify
            equity = self.client.get_equity()
            self.notifications.notify_trade_close(result, equity)
            # Register cooldown if the trade was a loss
            if result.get("pnl", 0) < 0:
                self.position_manager.register_cooldown(position.symbol, self.strategy_id)
            # Check daily loss circuit breaker AFTER closing
            if (self.risk_manager._daily_start_equity and
                    equity < self.risk_manager._daily_start_equity * (1 - self.config.MAX_DAILY_LOSS)):
                logger.warning(f"🛑 CIRCUIT BREAKER (post-close): Daily loss limit exceeded. "
                               f"Equity ${equity:.0f} vs start ${self.risk_manager._daily_start_equity:.0f}. "
                               f"Disabling auto-trading for this cycle.")
                self._daily_loss_breaker_tripped = True
                self.notifications.notify_circuit_breaker(equity, self.risk_manager._daily_start_equity)

    def cycle(self):
        equity = self.client.get_equity()
        positions = self.client.get_positions()
        positions_with_pnl = self.client.get_positions_with_pnl()

        self.risk_manager.reset_daily(equity)
        self.position_manager.tick_cooldowns()
        # Reset the post-close circuit breaker flag at cycle start
        self._daily_loss_breaker_tripped = False

        macro_context, _ = self.signal_engine.macro_calendar.get_context()
        current_regime = Regime.UNKNOWN
        trade_fired = False
        signal_radar = []
        candles_map: Dict[str, List[Dict]] = {}
        candles_4h_map: Dict[str, List[Dict]] = {}

        # Process manual close commands
        commands = self.sync.fetch_commands()
        for cmd in commands:
            if cmd.get("command") == "CLOSE_POSITION":
                symbol = cmd.get("payload", {}).get("symbol")
                for position in positions:
                    if position.symbol == symbol:
                        self._close_and_sync(position, "MANUAL")
                        logger.info(f"🖐️ Manual close: {symbol}")
                        break
                self.sync.ack_command(cmd.get("id"))

        positions = self.client.get_positions()
        positions_with_pnl = self.client.get_positions_with_pnl()

        # ═══════════════════════════════════════════════════════════════
        #  ACTIVE POSITION MANAGEMENT — the game changer
        # ═══════════════════════════════════════════════════════════════

        # Phase 1: Check static SL/TP (unchanged — these are the hard safety net)
        for position in positions:
            close_reason = self.client.check_sl_tp(position)
            if close_reason:
                self._close_and_sync(position, close_reason)

        positions = self.client.get_positions()

        # Phase 2: Active management — regime exits, trailing stops, time stops, partials
        for position in list(positions):
            candles = self.client.get_candles(position.symbol, self.config.TIMEFRAME)
            if candles:
                candles_map[position.symbol] = candles
                close_reason = self.position_manager.manage_position(
                    position, candles, self.strategy_id
                )
                if close_reason:
                    if close_reason.startswith("PARTIAL_"):
                        self._handle_partial_close(position, close_reason)
                    else:
                        self._close_and_sync(position, close_reason)

        positions = self.client.get_positions()

        # Phase 3: Cross-position correlation check
        if len(positions) >= 2:
            # Build candles_map for any positions we haven't fetched yet
            for position in positions:
                if position.symbol not in candles_map:
                    c = self.client.get_candles(position.symbol, self.config.TIMEFRAME)
                    if c:
                        candles_map[position.symbol] = c

            symbols_to_close = self.position_manager.check_correlation_exit(
                positions, candles_map
            )
            for position in positions:
                if position.symbol in symbols_to_close:
                    self._close_and_sync(position, "CORRELATION_EXIT")

        positions = self.client.get_positions()
        positions_with_pnl = self.client.get_positions_with_pnl()

        # ═══════════════════════════════════════════════════════════════
        #  SIGNAL SCANNING & NEW ENTRIES
        # ═══════════════════════════════════════════════════════════════

        # Fetch funding rates (every 5 minutes)
        now = time.time()
        if now - self._last_funding_fetch > 300:
            self._funding_rates = self.client.get_funding_rates()
            self._last_funding_fetch = now
            if self._funding_rates:
                top_rates = sorted(self._funding_rates.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
                rate_str = ", ".join([f"{s}:{r*100:.4f}%" for s, r in top_rates])
                logger.info(f"💸 Funding rates (top 3): {rate_str}")

        if (self.auto_trading_enabled and not self._daily_loss_breaker_tripped
                and self.risk_manager.check_risk_limits(positions, equity)):
            for symbol in self.config.ASSETS:
                candles = candles_map.get(symbol) or self.client.get_candles(symbol, self.config.TIMEFRAME)
                if not candles:
                    continue
                candles_map[symbol] = candles

                scan = self.signal_engine.scan_signal_strength(symbol, candles)
                signal_radar.append(scan)

                # Skip if already in a position for this symbol
                if any(p.symbol == symbol for p in positions):
                    continue

                # Skip if on cooldown after a recent loss
                if self.position_manager.is_on_cooldown(symbol):
                    continue

                # Fetch 4h candles for multi-timeframe confirmation
                candles_4h = candles_4h_map.get(symbol)
                if candles_4h is None:
                    candles_4h = self.client.get_candles(symbol, "4h", limit=200)
                    candles_4h_map[symbol] = candles_4h or []

                funding = self._funding_rates.get(symbol, 0.0)
                signal = self.signal_engine.generate_signal(
                    symbol, candles, self.strategy_id, candles_4h=candles_4h,
                    funding_rate=funding
                )
                current_regime = self.signal_engine.regime_detector.detect(candles)

                if signal:
                    size, leverage = self.risk_manager.calculate_position_size(
                        equity, signal.entry_price, signal.stop_loss,
                        signal.confidence, self.risk_per_trade
                    )

                    if not self.config.PAPER_TRADE:
                        logger.info(f"🔔 LIVE signal: {signal.type.value} {symbol} | "
                                   f"confidence: {signal.confidence:.0%} | size: ${size:.0f} | lev: {leverage}x")

                    position = self.client.open_position(signal, size, leverage)
                    if position:
                        # Initialize APM tracking fields
                        position.original_stop_loss = position.stop_loss
                        position.highest_price = position.entry_price
                        position.lowest_price = position.entry_price
                        position.original_size = position.size
                        trade_fired = True
                        self.sync.trade_signal(position, signal.confidence, self.config.PAPER_TRADE)
                        self.sync.save_position(position)
                        self.notifications.notify_trade_open(position, equity)
                        positions = self.client.get_positions()
                        positions_with_pnl = self.client.get_positions_with_pnl()
        else:
            for symbol in self.config.ASSETS:
                candles = candles_map.get(symbol) or self.client.get_candles(symbol, self.config.TIMEFRAME)
                if candles:
                    candles_map[symbol] = candles
                    scan = self.signal_engine.scan_signal_strength(symbol, candles)
                    signal_radar.append(scan)
                    current_regime = self.signal_engine.regime_detector.detect(candles)

        # Heartbeat
        self.sync.heartbeat(
            equity=equity, positions=positions_with_pnl,
            regime=current_regime.value, macro=macro_context.value,
            strategy=self.strategy_id, trade_fired=trade_fired,
            signal_radar=signal_radar
        )

        mode_str = "📄" if self.config.PAPER_TRADE else "⚡"
        strategy_name = STRATEGIES.get(self.strategy_id, {}).get("name", self.strategy_id)
        total_unrealized = sum(p.get("unrealized_pnl", 0) for p in positions_with_pnl)
        pos_str = ", ".join([f"{p['symbol']}({p['unrealized_pnl']:+.0f})" for p in positions_with_pnl])
        hottest = max(signal_radar, key=lambda x: x["strength"]) if signal_radar else None
        hot_str = f" | 🔥 {hottest['symbol']} {hottest['strength']}%" if hottest and hottest['strength'] >= 50 else ""
        auto_str = "" if self.auto_trading_enabled else " | ⏸️ PAUSED"
        cooldown_str = f" | ❄️ {len(self.position_manager.cooldowns)}" if self.position_manager.cooldowns else ""

        logger.info(f"{mode_str} ${equity:.0f} | [{pos_str or 'none'}] | {strategy_name}{hot_str}{cooldown_str}{auto_str}")


if __name__ == "__main__":
    bot = APEXBot()
    bot.start()
