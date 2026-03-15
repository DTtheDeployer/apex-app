#!/usr/bin/env python3
"""
APEX Trading Bot v6 - Multi-Strategy
=====================================
Supports multiple trading strategies with simple preset selection.
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
    HL_API_KEY: str = os.getenv("HL_API_KEY", "")
    HL_API_SECRET: str = os.getenv("HL_API_SECRET", "")
    HL_WALLET_ADDRESS: str = os.getenv("HL_WALLET_ADDRESS", "")
    
    APEX_APP_URL: str = os.getenv("APEX_APP_URL", "https://app.apexhl.trade")
    APEX_USER_ID: str = os.getenv("APEX_USER_ID", "a040d19d-f40e-44f7-9b90-dead9d9bcfeb")
    BOT_API_SECRET: str = os.getenv("BOT_API_SECRET", "")
    
    ASSETS: List[str] = field(default_factory=lambda: ["BTC", "ETH", "SOL", "ARB", "DOGE"])
    TIMEFRAME: str = "1h"
    MAX_LEVERAGE: int = 10
    RISK_PER_TRADE: float = 0.04
    MAX_POSITIONS: int = 3
    
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

# ══════════════════════════════════════════════════════════════════════════════
#  STRATEGY DEFINITIONS
# ══════════════════════════════════════════════════════════════════════════════

STRATEGIES = {
    "apex_adaptive": {
        "name": "APEX Adaptive",
        "description": "Adapts to market regime automatically",
        "style": "hybrid",
        "hold_time": "varies",
        "icon": "🔄",
        "params": {
            "trend_rsi_pullback": 50,
            "trend_rsi_momentum_min": 50,
            "trend_rsi_momentum_max": 70,
            "mean_rev_rsi_oversold": 35,
            "mean_rev_rsi_overbought": 65,
            "min_confidence": 0.5,
            "atr_sl_mult": 2.0,
            "atr_tp_mult": 3.0,
        },
    },
    "momentum_rider": {
        "name": "Momentum Rider",
        "description": "Ride strong trends with RSI + MACD confirmation",
        "style": "trend",
        "hold_time": "hours-days",
        "icon": "🚀",
        "params": {
            "rsi_min": 55,
            "rsi_max": 75,
            "require_macd_confirm": True,
            "require_price_above_sma": True,
            "min_confidence": 0.55,
            "atr_sl_mult": 2.0,
            "atr_tp_mult": 3.5,
        },
    },
    "dip_hunter": {
        "name": "Dip Hunter",
        "description": "Buy oversold, sell overbought at Bollinger extremes",
        "style": "mean_reversion",
        "hold_time": "hours",
        "icon": "🎯",
        "params": {
            "rsi_oversold": 30,
            "rsi_overbought": 70,
            "bb_penetration": True,
            "min_confidence": 0.5,
            "atr_sl_mult": 1.5,
            "atr_tp_mult": 2.0,
        },
    },
    "breakout_blitz": {
        "name": "Breakout Blitz",
        "description": "Catch range breakouts on high momentum",
        "style": "breakout",
        "hold_time": "hours-days",
        "icon": "⚡",
        "params": {
            "lookback_periods": 20,
            "rsi_min": 50,
            "rsi_max": 75,
            "min_confidence": 0.5,
            "atr_sl_mult": 1.5,
            "atr_tp_mult": 3.0,
        },
    },
    "scalp_sniper": {
        "name": "Scalp Sniper",
        "description": "Quick trades on micro pullbacks, tight SL/TP",
        "style": "scalping",
        "hold_time": "minutes-hours",
        "icon": "🎯",
        "params": {
            "rsi_oversold": 40,
            "rsi_overbought": 60,
            "min_confidence": 0.45,
            "atr_sl_mult": 1.0,
            "atr_tp_mult": 1.5,
        },
    },
    "swing_king": {
        "name": "Swing King",
        "description": "Larger moves, wider stops, patient entries",
        "style": "swing",
        "hold_time": "days-weeks",
        "icon": "👑",
        "params": {
            "rsi_oversold": 25,
            "rsi_overbought": 75,
            "require_trend_align": True,
            "min_confidence": 0.6,
            "atr_sl_mult": 3.0,
            "atr_tp_mult": 5.0,
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
            ("2025-01-29", "FOMC"), ("2025-03-19", "FOMC"), ("2025-05-07", "FOMC"),
            ("2025-06-18", "FOMC"), ("2025-07-30", "FOMC"), ("2025-09-17", "FOMC"),
            ("2026-01-28", "FOMC"), ("2026-03-18", "FOMC"), ("2026-05-06", "FOMC"),
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
#  SIGNAL ENGINE - MULTI-STRATEGY
# ══════════════════════════════════════════════════════════════════════════════

class SignalEngine:
    def __init__(self):
        self.regime_detector = RegimeDetector()
        self.macro_calendar = MacroCalendar()
    
    def generate_signal(self, symbol: str, candles: List[Dict], strategy_id: str = "apex_adaptive") -> Optional[Signal]:
        """Generate a signal using the specified strategy."""
        if len(candles) < 50:
            return None
        
        strategy = STRATEGIES.get(strategy_id, STRATEGIES["apex_adaptive"])
        params = strategy["params"]
        
        regime = self.regime_detector.detect(candles)
        macro_context, _ = self.macro_calendar.get_context()
        
        if macro_context == MacroContext.FREEZE:
            return None
        
        # Calculate indicators
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
        macd_signal = self._calculate_ema(np.array([ema_12 - ema_26]), 9)
        bb_upper, bb_lower, bb_mid = self._calculate_bollinger(closes)
        atr = self._calculate_atr(highs, lows, closes)
        
        # Route to strategy-specific logic
        if strategy_id == "apex_adaptive":
            return self._strategy_apex_adaptive(symbol, candles, params, regime, macro_context, 
                                                 current_price, rsi, sma_20, sma_50, macd, bb_upper, bb_lower, bb_mid, atr, highs, lows)
        elif strategy_id == "momentum_rider":
            return self._strategy_momentum_rider(symbol, params, regime, macro_context,
                                                  current_price, rsi, sma_20, sma_50, macd, atr)
        elif strategy_id == "dip_hunter":
            return self._strategy_dip_hunter(symbol, params, regime, macro_context,
                                              current_price, rsi, bb_upper, bb_lower, bb_mid, atr)
        elif strategy_id == "breakout_blitz":
            return self._strategy_breakout_blitz(symbol, params, regime, macro_context,
                                                  current_price, rsi, highs, lows, atr)
        elif strategy_id == "scalp_sniper":
            return self._strategy_scalp_sniper(symbol, params, regime, macro_context,
                                                current_price, rsi, sma_20, bb_upper, bb_lower, bb_mid, atr)
        elif strategy_id == "swing_king":
            return self._strategy_swing_king(symbol, params, regime, macro_context,
                                              current_price, rsi, sma_20, sma_50, macd, atr)
        
        return None
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STRATEGY: APEX ADAPTIVE (Original hybrid strategy)
    # ═══════════════════════════════════════════════════════════════════════════
    def _strategy_apex_adaptive(self, symbol, candles, params, regime, macro_context,
                                 current_price, rsi, sma_20, sma_50, macd, bb_upper, bb_lower, bb_mid, atr, highs, lows):
        signal = None
        
        if regime == Regime.TRENDING_UP:
            rsi_min = params["trend_rsi_momentum_min"]
            rsi_max = params["trend_rsi_momentum_max"]
            
            if rsi_min < rsi < rsi_max and current_price > sma_20 > sma_50 and macd > 0:
                confidence = min(0.8, 0.5 + (rsi - 50) / 100)
                stop_loss = current_price - (params["atr_sl_mult"] * atr)
                take_profit = current_price + (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🔄 APEX Adaptive: Strong uptrend detected. RSI at {rsi:.0f} shows momentum. "
                    f"Price ${current_price:,.0f} above SMAs. MACD positive. LONG with {confidence:.0%} confidence."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
            
            elif rsi < params["trend_rsi_pullback"] and current_price > sma_50:
                confidence = min(0.75, 0.4 + (params["trend_rsi_pullback"] - rsi) / 100)
                stop_loss = current_price - (params["atr_sl_mult"] * atr)
                take_profit = current_price + (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🔄 APEX Adaptive: Pullback in uptrend. RSI dropped to {rsi:.0f}. "
                    f"Buying the dip with {confidence:.0%} confidence."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        elif regime == Regime.TRENDING_DOWN:
            rsi_min = 100 - params["trend_rsi_momentum_max"]
            rsi_max = 100 - params["trend_rsi_momentum_min"]
            
            if rsi_min < rsi < rsi_max and current_price < sma_20 < sma_50 and macd < 0:
                confidence = min(0.8, 0.5 + (50 - rsi) / 100)
                stop_loss = current_price + (params["atr_sl_mult"] * atr)
                take_profit = current_price - (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🔄 APEX Adaptive: Strong downtrend. RSI at {rsi:.0f}. "
                    f"SHORT with {confidence:.0%} confidence."
                )
                
                signal = Signal(
                    type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        elif regime == Regime.RANGING:
            if current_price < bb_lower and rsi < params["mean_rev_rsi_oversold"]:
                confidence = min(0.7, 0.4 + (params["mean_rev_rsi_oversold"] - rsi) / 50)
                stop_loss = current_price - (1.5 * atr)
                take_profit = bb_mid
                
                explanation = (
                    f"🔄 APEX Adaptive: Mean reversion. Price below BB lower, RSI oversold at {rsi:.0f}. "
                    f"LONG targeting middle band."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
            
            elif current_price > bb_upper and rsi > params["mean_rev_rsi_overbought"]:
                confidence = min(0.7, 0.4 + (rsi - params["mean_rev_rsi_overbought"]) / 50)
                stop_loss = current_price + (1.5 * atr)
                take_profit = bb_mid
                
                explanation = (
                    f"🔄 APEX Adaptive: Mean reversion. Price above BB upper, RSI overbought at {rsi:.0f}. "
                    f"SHORT targeting middle band."
                )
                
                signal = Signal(
                    type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        elif regime == Regime.VOLATILE:
            recent_high = max(highs[-20:])
            recent_low = min(lows[-20:])
            
            if current_price > recent_high and 50 < rsi < 75:
                confidence = min(0.65, 0.4 + (rsi - 50) / 100)
                stop_loss = recent_high - atr
                take_profit = current_price + (2.5 * atr)
                
                explanation = (
                    f"🔄 APEX Adaptive: Bullish breakout above ${recent_high:,.0f}. "
                    f"LONG with {confidence:.0%} confidence."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
            
            elif current_price < recent_low and 25 < rsi < 50:
                confidence = min(0.65, 0.4 + (50 - rsi) / 100)
                stop_loss = recent_low + atr
                take_profit = current_price - (2.5 * atr)
                
                explanation = (
                    f"🔄 APEX Adaptive: Bearish breakout below ${recent_low:,.0f}. "
                    f"SHORT with {confidence:.0%} confidence."
                )
                
                signal = Signal(
                    type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="APEX_ADAPTIVE", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        if signal and signal.confidence < params["min_confidence"]:
            return None
        
        if signal and macro_context == MacroContext.CAUTION:
            signal.confidence *= 0.7
            signal.explanation += " (Reduced size: macro event upcoming)"
        
        return signal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STRATEGY: MOMENTUM RIDER
    # ═══════════════════════════════════════════════════════════════════════════
    def _strategy_momentum_rider(self, symbol, params, regime, macro_context,
                                  current_price, rsi, sma_20, sma_50, macd, atr):
        
        # Only trade in trending markets
        if regime not in [Regime.TRENDING_UP, Regime.TRENDING_DOWN]:
            return None
        
        signal = None
        
        # LONG: Strong uptrend with momentum confirmation
        if regime == Regime.TRENDING_UP:
            if (params["rsi_min"] < rsi < params["rsi_max"] and 
                current_price > sma_20 > sma_50 and 
                macd > 0):
                
                confidence = min(0.85, 0.55 + (rsi - 50) / 100 + (0.1 if macd > 0 else 0))
                stop_loss = current_price - (params["atr_sl_mult"] * atr)
                take_profit = current_price + (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🚀 Momentum Rider: Strong uptrend confirmed. RSI {rsi:.0f} shows momentum. "
                    f"Price above both SMAs, MACD positive ({macd:.2f}). Riding the trend LONG."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="MOMENTUM_RIDER", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        # SHORT: Strong downtrend with momentum confirmation
        elif regime == Regime.TRENDING_DOWN:
            rsi_inv_min = 100 - params["rsi_max"]
            rsi_inv_max = 100 - params["rsi_min"]
            
            if (rsi_inv_min < rsi < rsi_inv_max and 
                current_price < sma_20 < sma_50 and 
                macd < 0):
                
                confidence = min(0.85, 0.55 + (50 - rsi) / 100 + (0.1 if macd < 0 else 0))
                stop_loss = current_price + (params["atr_sl_mult"] * atr)
                take_profit = current_price - (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🚀 Momentum Rider: Strong downtrend confirmed. RSI {rsi:.0f} shows selling pressure. "
                    f"Price below both SMAs, MACD negative ({macd:.2f}). Riding the trend SHORT."
                )
                
                signal = Signal(
                    type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="MOMENTUM_RIDER", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        if signal and signal.confidence < params["min_confidence"]:
            return None
        
        return signal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STRATEGY: DIP HUNTER (Mean Reversion)
    # ═══════════════════════════════════════════════════════════════════════════
    def _strategy_dip_hunter(self, symbol, params, regime, macro_context,
                              current_price, rsi, bb_upper, bb_lower, bb_mid, atr):
        
        # Best in ranging or mildly volatile markets
        if regime == Regime.VOLATILE:
            return None  # Too risky for mean reversion
        
        signal = None
        
        # LONG: Oversold at lower Bollinger Band
        if rsi < params["rsi_oversold"] and current_price <= bb_lower:
            confidence = min(0.75, 0.45 + (params["rsi_oversold"] - rsi) / 60)
            stop_loss = current_price - (params["atr_sl_mult"] * atr)
            take_profit = bb_mid  # Target middle band
            
            explanation = (
                f"🎯 Dip Hunter: Oversold condition detected. RSI at {rsi:.0f}, price at lower BB. "
                f"Buying the dip, targeting mean reversion to ${bb_mid:,.0f}."
            )
            
            signal = Signal(
                type=SignalType.LONG, symbol=symbol, confidence=confidence,
                strategy="DIP_HUNTER", entry_price=current_price,
                stop_loss=stop_loss, take_profit=take_profit,
                regime=regime, macro=macro_context,
                explanation=explanation, rsi=rsi, macd=0
            )
        
        # SHORT: Overbought at upper Bollinger Band
        elif rsi > params["rsi_overbought"] and current_price >= bb_upper:
            confidence = min(0.75, 0.45 + (rsi - params["rsi_overbought"]) / 60)
            stop_loss = current_price + (params["atr_sl_mult"] * atr)
            take_profit = bb_mid  # Target middle band
            
            explanation = (
                f"🎯 Dip Hunter: Overbought condition detected. RSI at {rsi:.0f}, price at upper BB. "
                f"Fading the rip, targeting mean reversion to ${bb_mid:,.0f}."
            )
            
            signal = Signal(
                type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                strategy="DIP_HUNTER", entry_price=current_price,
                stop_loss=stop_loss, take_profit=take_profit,
                regime=regime, macro=macro_context,
                explanation=explanation, rsi=rsi, macd=0
            )
        
        if signal and signal.confidence < params["min_confidence"]:
            return None
        
        return signal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STRATEGY: BREAKOUT BLITZ
    # ═══════════════════════════════════════════════════════════════════════════
    def _strategy_breakout_blitz(self, symbol, params, regime, macro_context,
                                  current_price, rsi, highs, lows, atr):
        
        lookback = params["lookback_periods"]
        recent_high = max(highs[-lookback:])
        recent_low = min(lows[-lookback:])
        
        signal = None
        
        # LONG: Breakout above recent high
        if current_price > recent_high and params["rsi_min"] < rsi < params["rsi_max"]:
            # Higher confidence if breaking out with strong momentum
            breakout_strength = (current_price - recent_high) / atr
            confidence = min(0.8, 0.5 + breakout_strength * 0.1 + (rsi - 50) / 200)
            
            stop_loss = recent_high - (params["atr_sl_mult"] * atr)
            take_profit = current_price + (params["atr_tp_mult"] * atr)
            
            explanation = (
                f"⚡ Breakout Blitz: Price broke above {lookback}-period high of ${recent_high:,.0f}. "
                f"RSI at {rsi:.0f} confirms momentum. Catching the breakout LONG."
            )
            
            signal = Signal(
                type=SignalType.LONG, symbol=symbol, confidence=confidence,
                strategy="BREAKOUT_BLITZ", entry_price=current_price,
                stop_loss=stop_loss, take_profit=take_profit,
                regime=regime, macro=macro_context,
                explanation=explanation, rsi=rsi, macd=0
            )
        
        # SHORT: Breakdown below recent low
        elif current_price < recent_low and (100 - params["rsi_max"]) < rsi < (100 - params["rsi_min"]):
            breakdown_strength = (recent_low - current_price) / atr
            confidence = min(0.8, 0.5 + breakdown_strength * 0.1 + (50 - rsi) / 200)
            
            stop_loss = recent_low + (params["atr_sl_mult"] * atr)
            take_profit = current_price - (params["atr_tp_mult"] * atr)
            
            explanation = (
                f"⚡ Breakout Blitz: Price broke below {lookback}-period low of ${recent_low:,.0f}. "
                f"RSI at {rsi:.0f} confirms selling pressure. Catching the breakdown SHORT."
            )
            
            signal = Signal(
                type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                strategy="BREAKOUT_BLITZ", entry_price=current_price,
                stop_loss=stop_loss, take_profit=take_profit,
                regime=regime, macro=macro_context,
                explanation=explanation, rsi=rsi, macd=0
            )
        
        if signal and signal.confidence < params["min_confidence"]:
            return None
        
        return signal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STRATEGY: SCALP SNIPER
    # ═══════════════════════════════════════════════════════════════════════════
    def _strategy_scalp_sniper(self, symbol, params, regime, macro_context,
                                current_price, rsi, sma_20, bb_upper, bb_lower, bb_mid, atr):
        
        signal = None
        
        # Quick LONG: RSI oversold, price near lower BB
        if rsi < params["rsi_oversold"]:
            bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
            
            if bb_position < 0.3:  # Near lower band
                confidence = min(0.7, 0.45 + (params["rsi_oversold"] - rsi) / 80)
                stop_loss = current_price - (params["atr_sl_mult"] * atr)
                take_profit = current_price + (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🎯 Scalp Sniper: Quick long setup. RSI oversold at {rsi:.0f}, "
                    f"price near lower BB. Tight SL/TP for quick profit."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="SCALP_SNIPER", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=0
                )
        
        # Quick SHORT: RSI overbought, price near upper BB
        elif rsi > params["rsi_overbought"]:
            bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
            
            if bb_position > 0.7:  # Near upper band
                confidence = min(0.7, 0.45 + (rsi - params["rsi_overbought"]) / 80)
                stop_loss = current_price + (params["atr_sl_mult"] * atr)
                take_profit = current_price - (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"🎯 Scalp Sniper: Quick short setup. RSI overbought at {rsi:.0f}, "
                    f"price near upper BB. Tight SL/TP for quick profit."
                )
                
                signal = Signal(
                    type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="SCALP_SNIPER", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=0
                )
        
        if signal and signal.confidence < params["min_confidence"]:
            return None
        
        return signal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STRATEGY: SWING KING
    # ═══════════════════════════════════════════════════════════════════════════
    def _strategy_swing_king(self, symbol, params, regime, macro_context,
                              current_price, rsi, sma_20, sma_50, macd, atr):
        
        signal = None
        
        # LONG: Deep oversold with trend alignment potential
        if rsi < params["rsi_oversold"]:
            # Check for potential trend reversal or continuation
            trend_bias = "bullish" if sma_20 > sma_50 else "bearish"
            
            # More confident if already in uptrend (pullback), less if counter-trend
            if trend_bias == "bullish" or rsi < 25:  # Deep oversold can trigger regardless
                confidence = min(0.8, 0.5 + (params["rsi_oversold"] - rsi) / 50)
                if trend_bias == "bullish":
                    confidence += 0.1  # Bonus for trend alignment
                
                stop_loss = current_price - (params["atr_sl_mult"] * atr)
                take_profit = current_price + (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"👑 Swing King: Deep value entry. RSI at {rsi:.0f} signals extreme oversold. "
                    f"Wide stops (${stop_loss:,.0f}), big target (${take_profit:,.0f}). "
                    f"Trend bias: {trend_bias}. Patient swing LONG."
                )
                
                signal = Signal(
                    type=SignalType.LONG, symbol=symbol, confidence=confidence,
                    strategy="SWING_KING", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        # SHORT: Extremely overbought with trend alignment
        elif rsi > params["rsi_overbought"]:
            trend_bias = "bearish" if sma_20 < sma_50 else "bullish"
            
            if trend_bias == "bearish" or rsi > 75:
                confidence = min(0.8, 0.5 + (rsi - params["rsi_overbought"]) / 50)
                if trend_bias == "bearish":
                    confidence += 0.1
                
                stop_loss = current_price + (params["atr_sl_mult"] * atr)
                take_profit = current_price - (params["atr_tp_mult"] * atr)
                
                explanation = (
                    f"👑 Swing King: Extreme overbought. RSI at {rsi:.0f}. "
                    f"Wide stops, big target. Trend bias: {trend_bias}. Patient swing SHORT."
                )
                
                signal = Signal(
                    type=SignalType.SHORT, symbol=symbol, confidence=confidence,
                    strategy="SWING_KING", entry_price=current_price,
                    stop_loss=stop_loss, take_profit=take_profit,
                    regime=regime, macro=macro_context,
                    explanation=explanation, rsi=rsi, macd=macd
                )
        
        if signal and signal.confidence < params["min_confidence"]:
            return None
        
        return signal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SIGNAL RADAR (unchanged)
    # ═══════════════════════════════════════════════════════════════════════════
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
                if 50 < rsi < 70:
                    strength = 70 + int((rsi - 50) / 20 * 30)
                else:
                    strength = max(0, 70 - abs(rsi - 60) * 2)
                trigger = "MOMENTUM"
            elif rsi < 50 and current_price > sma_50:
                strength = int(50 + (50 - rsi))
                trigger = "PULLBACK"
            else:
                strength = 20
            direction = "LONG"
        
        elif regime == Regime.TRENDING_DOWN:
            if current_price < sma_20 < sma_50 and macd < 0:
                if 30 < rsi < 50:
                    strength = 70 + int((50 - rsi) / 20 * 30)
                else:
                    strength = max(0, 70 - abs(rsi - 40) * 2)
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
            "symbol": symbol,
            "strength": min(100, max(0, strength)),
            "direction": direction,
            "trigger": trigger,
            "rsi": round(rsi, 1),
            "regime": regime.value
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INDICATOR CALCULATIONS
    # ═══════════════════════════════════════════════════════════════════════════
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
    def __init__(self, max_positions: int = 3, max_leverage: int = 10):
        self.max_positions = max_positions
        self.max_leverage = max_leverage
    
    def check_risk_limits(self, positions: List[Position], equity: float) -> bool:
        return len(positions) < self.max_positions
    
    def calculate_position_size(self, equity: float, entry: float, stop_loss: float, confidence: float, risk_per_trade: float):
        risk_amount = equity * risk_per_trade * confidence
        price_risk = abs(entry - stop_loss) / entry
        
        if price_risk == 0:
            return 0, 1
        
        position_value = risk_amount / price_risk
        leverage = min(self.max_leverage, max(1, int(position_value / equity)))
        size = min(position_value, equity * leverage * 0.9)
        
        return size, leverage

# ══════════════════════════════════════════════════════════════════════════════
#  HYPERLIQUID CLIENT
# ══════════════════════════════════════════════════════════════════════════════

class HyperliquidClient:
    INFO_URL = "https://api.hyperliquid.xyz/info"
    
    def __init__(self, paper: bool = True, paper_balance: float = 10000.0):
        self.paper = paper
        self.paper_balance = paper_balance
        self.paper_positions: Dict[str, Position] = {}
        self.session = requests.Session()
        self._price_cache = {}
        self._candle_cache = {}
    
    def get_candles(self, symbol: str, timeframe: str, limit: int = 100) -> List[Dict]:
        try:
            response = self.session.post(
                self.INFO_URL,
                json={"type": "candleSnapshot", "req": {"coin": symbol, "interval": timeframe, "startTime": int((datetime.now(timezone.utc) - timedelta(hours=limit)).timestamp() * 1000)}},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                candles = [{"open": float(c["o"]), "high": float(c["h"]), "low": float(c["l"]), "close": float(c["c"]), "volume": float(c["v"]), "time": c["t"]} for c in data]
                self._candle_cache[symbol] = candles
                return candles
        except Exception as e:
            logger.error(f"Candles error {symbol}: {e}")
        return self._candle_cache.get(symbol, [])
    
    def get_all_prices(self) -> Dict[str, float]:
        try:
            response = self.session.post(self.INFO_URL, json={"type": "allMids"}, timeout=10)
            if response.status_code == 200:
                self._price_cache = {k: float(v) for k, v in response.json().items()}
        except:
            pass
        return self._price_cache
    
    def get_price(self, symbol: str) -> Optional[float]:
        return self.get_all_prices().get(symbol)
    
    def get_equity(self) -> float:
        if self.paper:
            unrealized = sum(self._calculate_unrealized_pnl(p) for p in self.paper_positions.values())
            return self.paper_balance + unrealized
        return 0
    
    def get_positions(self) -> List[Position]:
        return list(self.paper_positions.values()) if self.paper else []
    
    def get_positions_with_pnl(self) -> List[Dict]:
        result = []
        for p in self.get_positions():
            current_price = self.get_price(p.symbol)
            unrealized = self._calculate_unrealized_pnl(p) if current_price else 0
            pnl_pct = (unrealized / p.size * 100) if p.size > 0 else 0
            result.append({
    "id": p.id, "symbol": p.symbol, "side": p.side,
    "entry_price": p.entry_price, "current_price": current_price,
    "size": p.size, "unrealized_pnl": round(unrealized, 2),
    "pnl_pct": round(pnl_pct, 2), "leverage": p.leverage,
    "stop_loss": p.stop_loss, "take_profit": p.take_profit,
    "strategy": p.strategy, "explanation": p.explanation,
    "regime": p.regime,
    "opened_at": p.entry_time.isoformat() if hasattr(p, 'entry_time') and p.entry_time else None,
})
        return result
    
    def open_position(self, signal: Signal, size: float, leverage: int) -> Optional[Position]:
        if not self.paper:
            return None
        
        position = Position(
            id=str(uuid.uuid4()), symbol=signal.symbol, side=signal.type.value,
            entry_price=signal.entry_price, size=size, leverage=leverage,
            stop_loss=signal.stop_loss, take_profit=signal.take_profit,
            entry_time=datetime.now(timezone.utc),
            regime=signal.regime.value, macro=signal.macro.value,
            strategy=signal.strategy, explanation=signal.explanation
        )
        self.paper_positions[signal.symbol] = position
        logger.info(f"🚀 Opened {signal.type.value} {signal.symbol} @ ${signal.entry_price:.2f} | {signal.strategy}")
        return position
    
    def close_position(self, position: Position, reason: str) -> Optional[Dict]:
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
        
        if reason == "TP":
            close_explanation = f"Take profit hit! Price reached ${current_price:,.0f}. Profit: ${pnl:.2f}"
        elif reason == "SL":
            close_explanation = f"Stop loss triggered at ${current_price:,.0f}. Loss limited to ${abs(pnl):.2f}."
        else:
            close_explanation = f"Position closed at ${current_price:,.0f}. P&L: ${pnl:.2f}"
        
        logger.info(f"💰 Closed {position.symbol} | P&L: ${pnl:+.2f} | {reason}")
        return {
            "symbol": position.symbol, "side": position.side,
            "entry_price": position.entry_price, "exit_price": current_price,
            "size": position.size, "pnl": pnl,
            "pnl_pct": (pnl / position.size) * 100, "reason": reason,
            "held_minutes": int((datetime.now(timezone.utc) - position.entry_time).total_seconds() / 60),
            "strategy": position.strategy,
            "explanation": position.explanation,
            "close_explanation": close_explanation
        }
    
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
                    id=p["id"],
                    symbol=p["symbol"],
                    side=p["side"],
                    entry_price=float(p["entry_price"]),
                    size=float(p["size"]),
                    leverage=int(p["leverage"]),
                    stop_loss=float(p["stop_loss"]) if p.get("stop_loss") else 0,
                    take_profit=float(p["take_profit"]) if p.get("take_profit") else 0,
                    entry_time=datetime.fromisoformat(p["entry_time"].replace("Z", "+00:00")) if isinstance(p["entry_time"], str) else p["entry_time"],
                    regime=p.get("regime", ""),
                    macro=p.get("macro", ""),
                    strategy=p.get("strategy", ""),
                    explanation=p.get("explanation", ""),
                )
                self.paper_positions[position.symbol] = position
                logger.info(f"📂 Loaded position: {position.side} {position.symbol} @ ${position.entry_price:.2f}")
            except Exception as e:
                logger.error(f"Failed to load position: {e}")
    
    def check_sl_tp(self, position: Position) -> Optional[str]:
        current_price = self.get_price(position.symbol)
        if not current_price:
            return None
        
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
            r = self.session.post(f"{self.app_url}/api/bot/sync", json={**payload, "user_id": self.user_id}, timeout=5)
            return r.status_code == 200
        except:
            return False
    
    def fetch_settings(self) -> Dict:
        try:
            r = self.session.get(f"{self.app_url}/api/bot/settings?user_id={self.user_id}", timeout=5)
            if r.status_code == 200:
                return r.json()
        except:
            pass
        return {}
    
    def fetch_commands(self) -> List[Dict]:
        try:
            r = self.session.get(f"{self.app_url}/api/bot/close?user_id={self.user_id}", timeout=5)
            if r.status_code == 200:
                return r.json().get("commands", [])
        except:
            pass
        return []
    
    def ack_command(self, command_id: str, status: str = "completed") -> bool:
        try:
            r = self.session.patch(
                f"{self.app_url}/api/bot/close",
                json={"command_id": command_id, "status": status},
                timeout=5
            )
            return r.status_code == 200
        except:
            return False
    
    def load_positions(self) -> List[Dict]:
        try:
            r = self.session.get(f"{self.app_url}/api/bot/positions", timeout=5)
            if r.status_code == 200:
                return r.json().get("positions", [])
        except Exception as e:
            logger.debug(f"Failed to load positions: {e}")
        return []
    
    def save_position(self, position: 'Position') -> bool:
        try:
            r = self.session.post(
                f"{self.app_url}/api/bot/positions",
                json={
                    "id": position.id,
                    "symbol": position.symbol,
                    "side": position.side,
                    "entry_price": position.entry_price,
                    "size": position.size,
                    "leverage": position.leverage,
                    "stop_loss": position.stop_loss,
                    "take_profit": position.take_profit,
                    "entry_time": position.entry_time.isoformat(),
                    "regime": position.regime,
                    "macro": position.macro,
                    "strategy": position.strategy,
                    "explanation": position.explanation,
                },
                timeout=5
            )
            return r.status_code == 200
        except:
            return False
    
    def delete_position(self, symbol: str) -> bool:
        try:
            r = self.session.delete(
                f"{self.app_url}/api/bot/positions",
                json={"symbol": symbol},
                timeout=5
            )
            return r.status_code == 200
        except:
            return False
    
    def heartbeat(self, equity: float, positions: List[Dict], regime: str, macro: str, strategy: str = "", trade_fired: bool = False, signal_radar: List[Dict] = None):
        self._reset_daily()
        self._cycles_today += 1
        if trade_fired:
            self._trades_today += 1
        
        total_unrealized = sum(p.get("unrealized_pnl", 0) for p in positions)
        
        self._post({
            "type": "heartbeat",
            "equity": equity,
            "open_positions": len(positions),
            "regime": regime,
            "macro_context": macro,
            "strategy": strategy,
            "cycles_today": self._cycles_today,
            "trades_today": self._trades_today,
            "pnl_today": round(total_unrealized + self._realized_pnl_today, 2),
            "unrealized_pnl": round(total_unrealized, 2),
            "positions": positions,
            "signal_radar": signal_radar or [],
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
#  MAIN BOT
# ══════════════════════════════════════════════════════════════════════════════

class APEXBot:
    def __init__(self):
        self.config = CONFIG
        self.client = HyperliquidClient(paper=self.config.PAPER_TRADE, paper_balance=self.config.PAPER_BALANCE)
        self.signal_engine = SignalEngine()
        self.risk_manager = RiskManager(max_positions=self.config.MAX_POSITIONS, max_leverage=self.config.MAX_LEVERAGE)
        self.sync = BotSync(self.config.APEX_APP_URL, self.config.APEX_USER_ID, self.config.BOT_API_SECRET)
        
        self.strategy_id = "apex_adaptive"
        self.risk_per_trade = 0.04
        self.auto_trading_enabled = True
        self._last_settings_fetch = 0
    
    def fetch_settings(self):
        now = time.time()
        if now - self._last_settings_fetch > 60:
            settings = self.sync.fetch_settings()
            if settings:
                self.strategy_id = settings.get("strategy", "apex_adaptive")
                self.risk_per_trade = settings.get("risk_per_trade", 0.04)
                self.auto_trading_enabled = settings.get("enabled", True)
                
                strategy_name = STRATEGIES.get(self.strategy_id, {}).get("name", self.strategy_id)
                status = "🟢 ON" if self.auto_trading_enabled else "🔴 OFF"
                logger.info(f"📋 Settings: {strategy_name}, {self.risk_per_trade*100:.0f}% risk, Auto: {status}")
            self._last_settings_fetch = now
    
    def start(self):
        logger.info("=" * 60)
        logger.info("  APEX Trading Bot v6 - Multi-Strategy")
        logger.info("=" * 60)
        logger.info(f"  Mode: {'PAPER' if self.config.PAPER_TRADE else 'LIVE'}")
        logger.info(f"  Assets: {', '.join(self.config.ASSETS)}")
        logger.info(f"  Strategies: {', '.join(STRATEGIES.keys())}")
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
    
    def cycle(self):
        equity = self.client.get_equity()
        positions = self.client.get_positions()
        positions_with_pnl = self.client.get_positions_with_pnl()
        
        macro_context, _ = self.signal_engine.macro_calendar.get_context()
        current_regime = Regime.UNKNOWN
        trade_fired = False
        signal_radar = []
        
        # Process manual commands from dashboard
        commands = self.sync.fetch_commands()
        for cmd in commands:
            if cmd.get("command") == "CLOSE_POSITION":
                payload = cmd.get("payload", {})
                symbol = payload.get("symbol")
                
                for position in positions:
                    if position.symbol == symbol:
                        result = self.client.close_position(position, "MANUAL")
                        if result:
                            self.sync.trade_close(position, result, self.config.PAPER_TRADE)
                            self.sync.delete_position(symbol)
                            logger.info(f"🖐️ Manual close: {symbol}")
                        break
                
                self.sync.ack_command(cmd.get("id"))
        
        positions = self.client.get_positions()
        positions_with_pnl = self.client.get_positions_with_pnl()
        
        # Check SL/TP
        for position in positions:
            close_reason = self.client.check_sl_tp(position)
            if close_reason:
                result = self.client.close_position(position, close_reason)
                if result:
                    self.sync.trade_close(position, result, self.config.PAPER_TRADE)
                    self.sync.delete_position(position.symbol)
        
        positions = self.client.get_positions()
        positions_with_pnl = self.client.get_positions_with_pnl()
        
        # Scan all assets
        if self.auto_trading_enabled and self.risk_manager.check_risk_limits(positions, equity):
            for symbol in self.config.ASSETS:
                candles = self.client.get_candles(symbol, self.config.TIMEFRAME)
                if not candles:
                    continue
                
                scan = self.signal_engine.scan_signal_strength(symbol, candles)
                signal_radar.append(scan)
                
                if any(p.symbol == symbol for p in positions):
                    continue
                
                # Use selected strategy
                signal = self.signal_engine.generate_signal(symbol, candles, self.strategy_id)
                current_regime = self.signal_engine.regime_detector.detect(candles)
                
                if signal:
                    size, leverage = self.risk_manager.calculate_position_size(
                        equity, signal.entry_price, signal.stop_loss, signal.confidence, self.risk_per_trade
                    )
                    
                    position = self.client.open_position(signal, size, leverage)
                    if position:
                        trade_fired = True
                        self.sync.trade_signal(position, signal.confidence, self.config.PAPER_TRADE)
                        self.sync.save_position(position)
                        positions_with_pnl = self.client.get_positions_with_pnl()
        else:
            # Still scan for signal radar even when auto trading is off
            for symbol in self.config.ASSETS:
                candles = self.client.get_candles(symbol, self.config.TIMEFRAME)
                if candles:
                    scan = self.signal_engine.scan_signal_strength(symbol, candles)
                    signal_radar.append(scan)
                    current_regime = self.signal_engine.regime_detector.detect(candles)
        
        # Heartbeat
        self.sync.heartbeat(
            equity=equity, positions=positions_with_pnl,
            regime=current_regime.value, macro=macro_context.value,
            strategy=self.strategy_id,
            trade_fired=trade_fired, signal_radar=signal_radar
        )
        
        # Log
        strategy_name = STRATEGIES.get(self.strategy_id, {}).get("name", self.strategy_id)
        total_unrealized = sum(p.get("unrealized_pnl", 0) for p in positions_with_pnl)
        pos_str = ", ".join([f"{p['symbol']}({p['unrealized_pnl']:+.0f})" for p in positions_with_pnl])
        hottest = max(signal_radar, key=lambda x: x["strength"]) if signal_radar else None
        hot_str = f" | 🔥 {hottest['symbol']} {hottest['strength']}%" if hottest and hottest['strength'] >= 50 else ""
        auto_str = "" if self.auto_trading_enabled else " | ⏸️ PAUSED"
        
        logger.info(f"${equity:.0f} | [{pos_str or 'none'}] | {strategy_name}{hot_str}{auto_str}")

if __name__ == "__main__":
    bot = APEXBot()
    bot.start()