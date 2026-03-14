#!/usr/bin/env python3
"""
APEX Trading Bot for Hyperliquid
================================
A multi-strategy perpetuals trading bot with regime detection,
macro calendar awareness, and dashboard sync.

Features:
- Multi-strategy: Trend following + Mean reversion + Breakout
- Regime detection: ADX, ATR ratio, Bollinger Band width
- Macro calendar: Pauses during FOMC, CPI, NFP
- Risk management: Dynamic position sizing, SL/TP
- Dashboard sync: Real-time updates to APEX web dashboard

Usage:
  1. Set environment variables (see .env.example)
  2. Run: python apex_bot.py

Author: APEX / Built for Dan
"""

import os
import time
import json
import hmac
import hashlib
import logging
import requests
import uuid
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from typing import Optional, Dict, List, Tuple
from enum import Enum
import numpy as np

# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class Config:
    # API Credentials
    HL_API_KEY: str = os.getenv("HL_API_KEY", "")
    HL_API_SECRET: str = os.getenv("HL_API_SECRET", "")
    HL_WALLET_ADDRESS: str = os.getenv("HL_WALLET_ADDRESS", "")
    
    # Dashboard Sync
    APEX_APP_URL: str = os.getenv("APEX_APP_URL", "https://app.apexhl.trade")
    APEX_USER_ID: str = os.getenv("APEX_USER_ID", "a040d19d-f40e-44f7-9b90-dead9d9bcfeb")
    BOT_API_SECRET: str = os.getenv("BOT_API_SECRET", "")
    
    # Trading Parameters
    ASSETS: List[str] = None  # Set in __post_init__
    TIMEFRAME: str = "1h"
    MAX_LEVERAGE: int = 10
    RISK_PER_TRADE: float = 0.04  # 4% risk per trade
    MAX_POSITIONS: int = 3
    
    # Paper Trading
    PAPER_TRADE: bool = os.getenv("PAPER_TRADE", "true").lower() == "true"
    PAPER_BALANCE: float = 10000.0
    
    # Bot Settings
    CYCLE_INTERVAL: int = 60  # seconds between cycles
    
    def __post_init__(self):
        if self.ASSETS is None:
            self.ASSETS = ["BTC", "ETH", "SOL", "ARB", "DOGE"]

CONFIG = Config()

# ══════════════════════════════════════════════════════════════════════════════
#  LOGGING
# ══════════════════════════════════════════════════════════════════════════════

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
    CAUTION = "CAUTION"  # Approaching event
    FREEZE = "FREEZE"    # During event - no new trades
    FADE = "FADE"        # Post-event fade opportunity

class SignalType(Enum):
    LONG = "LONG"
    SHORT = "SHORT"
    NONE = "NONE"

@dataclass
class Signal:
    type: SignalType
    symbol: str
    confidence: float  # 0-1
    strategy: str
    entry_price: float
    stop_loss: float
    take_profit: float
    regime: Regime
    macro: MacroContext

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

# ══════════════════════════════════════════════════════════════════════════════
#  MACRO CALENDAR
# ══════════════════════════════════════════════════════════════════════════════

class MacroCalendar:
    """
    Tracks major economic events that impact crypto markets.
    FOMC, CPI, NFP, Jackson Hole, etc.
    """
    
    # 2024-2025 FOMC meeting dates (announcement typically 2pm ET)
    FOMC_DATES = [
        "2024-12-18", "2025-01-29", "2025-03-19", "2025-05-07",
        "2025-06-18", "2025-07-30", "2025-09-17", "2025-11-05", "2025-12-17"
    ]
    
    # CPI release dates (8:30am ET, usually 2nd week of month)
    CPI_DATES = [
        "2024-12-11", "2025-01-15", "2025-02-12", "2025-03-12",
        "2025-04-10", "2025-05-13", "2025-06-11", "2025-07-11"
    ]
    
    # NFP release dates (8:30am ET, first Friday of month)
    NFP_DATES = [
        "2024-12-06", "2025-01-10", "2025-02-07", "2025-03-07",
        "2025-04-04", "2025-05-02", "2025-06-06", "2025-07-03"
    ]
    
    def __init__(self):
        self.events = self._build_event_list()
    
    def _build_event_list(self) -> List[Dict]:
        events = []
        for date in self.FOMC_DATES:
            events.append({"date": date, "type": "FOMC", "freeze_hours": 4})
        for date in self.CPI_DATES:
            events.append({"date": date, "type": "CPI", "freeze_hours": 2})
        for date in self.NFP_DATES:
            events.append({"date": date, "type": "NFP", "freeze_hours": 2})
        return events
    
    def get_context(self) -> Tuple[MacroContext, Optional[str]]:
        """
        Returns current macro context and upcoming event name.
        """
        now = datetime.now(timezone.utc)
        
        for event in self.events:
            event_date = datetime.strptime(event["date"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            
            # Check if we're in freeze window (event day, before/during announcement)
            if event_date.date() == now.date():
                # Freeze for the specified hours around the event
                freeze_start = event_date.replace(hour=12, minute=0)  # Before announcement
                freeze_end = event_date.replace(hour=12 + event["freeze_hours"], minute=0)
                
                if freeze_start <= now <= freeze_end:
                    return MacroContext.FREEZE, event["type"]
                elif now < freeze_start:
                    return MacroContext.CAUTION, event["type"]
                elif now > freeze_end and (now - freeze_end).seconds < 7200:  # 2 hours post
                    return MacroContext.FADE, event["type"]
            
            # Check if event is tomorrow (caution)
            elif event_date.date() == (now + timedelta(days=1)).date():
                return MacroContext.CAUTION, event["type"]
        
        return MacroContext.NONE, None

# ══════════════════════════════════════════════════════════════════════════════
#  MARKET INTELLIGENCE - REGIME DETECTION
# ══════════════════════════════════════════════════════════════════════════════

class RegimeDetector:
    """
    Detects market regime using multiple indicators:
    - ADX for trend strength
    - ATR ratio for volatility
    - Bollinger Band width for squeeze detection
    """
    
    def __init__(self, lookback: int = 14):
        self.lookback = lookback
    
    def detect(self, candles: List[Dict]) -> Regime:
        """
        Analyze candles and return current regime.
        Candles should be dicts with 'open', 'high', 'low', 'close', 'volume'.
        """
        if len(candles) < self.lookback + 10:
            return Regime.UNKNOWN
        
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        
        # Calculate ADX
        adx = self._calculate_adx(highs, lows, closes)
        
        # Calculate ATR ratio (current ATR vs average)
        atr = self._calculate_atr(highs, lows, closes)
        atr_ratio = atr[-1] / np.mean(atr[-self.lookback:]) if np.mean(atr[-self.lookback:]) > 0 else 1
        
        # Calculate Bollinger Band width
        bb_width = self._calculate_bb_width(closes)
        
        # Determine regime
        if adx > 25:
            # Strong trend
            recent_change = (closes[-1] - closes[-self.lookback]) / closes[-self.lookback]
            if recent_change > 0:
                return Regime.TRENDING_UP
            else:
                return Regime.TRENDING_DOWN
        elif atr_ratio > 1.5 or bb_width > 0.1:
            return Regime.VOLATILE
        else:
            return Regime.RANGING
    
    def _calculate_adx(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> float:
        """Calculate Average Directional Index."""
        n = self.lookback
        
        # True Range
        tr = np.maximum(
            highs[1:] - lows[1:],
            np.maximum(
                np.abs(highs[1:] - closes[:-1]),
                np.abs(lows[1:] - closes[:-1])
            )
        )
        
        # +DM and -DM
        plus_dm = np.where(
            (highs[1:] - highs[:-1]) > (lows[:-1] - lows[1:]),
            np.maximum(highs[1:] - highs[:-1], 0),
            0
        )
        minus_dm = np.where(
            (lows[:-1] - lows[1:]) > (highs[1:] - highs[:-1]),
            np.maximum(lows[:-1] - lows[1:], 0),
            0
        )
        
        # Smoothed values
        atr = self._smooth(tr, n)
        plus_di = 100 * self._smooth(plus_dm, n) / atr
        minus_di = 100 * self._smooth(minus_dm, n) / atr
        
        # DX and ADX
        dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di + 1e-10)
        adx = self._smooth(dx, n)
        
        return adx[-1] if len(adx) > 0 else 0
    
    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> np.ndarray:
        """Calculate Average True Range."""
        tr = np.maximum(
            highs[1:] - lows[1:],
            np.maximum(
                np.abs(highs[1:] - closes[:-1]),
                np.abs(lows[1:] - closes[:-1])
            )
        )
        return self._smooth(tr, self.lookback)
    
    def _calculate_bb_width(self, closes: np.ndarray) -> float:
        """Calculate Bollinger Band width as percentage."""
        n = self.lookback
        sma = np.convolve(closes, np.ones(n)/n, mode='valid')
        std = np.array([np.std(closes[i:i+n]) for i in range(len(closes)-n+1)])
        
        upper = sma + 2 * std
        lower = sma - 2 * std
        width = (upper - lower) / sma
        
        return width[-1] if len(width) > 0 else 0
    
    def _smooth(self, data: np.ndarray, period: int) -> np.ndarray:
        """Wilder's smoothing method."""
        result = np.zeros_like(data, dtype=float)
        result[period-1] = np.mean(data[:period])
        for i in range(period, len(data)):
            result[i] = (result[i-1] * (period-1) + data[i]) / period
        return result[period-1:]

# ══════════════════════════════════════════════════════════════════════════════
#  SIGNAL ENGINE - MULTI-STRATEGY
# ══════════════════════════════════════════════════════════════════════════════

class SignalEngine:
    """
    Multi-strategy signal generation:
    1. Trend Following - ride momentum in trending regimes
    2. Mean Reversion - fade extremes in ranging regimes
    3. Breakout - enter on range breaks
    """
    
    def __init__(self):
        self.regime_detector = RegimeDetector()
        self.macro_calendar = MacroCalendar()
    
    def generate_signals(self, symbol: str, candles: List[Dict]) -> Optional[Signal]:
        """
        Analyze market and generate trading signal if conditions are met.
        """
        if len(candles) < 50:
            return None
        
        # Get market context
        regime = self.regime_detector.detect(candles)
        macro_context, macro_event = self.macro_calendar.get_context()
        
        # Don't generate signals during FREEZE
        if macro_context == MacroContext.FREEZE:
            logger.info(f"[{symbol}] Macro FREEZE active ({macro_event}) - no signals")
            return None
        
        # Calculate indicators
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        
        current_price = closes[-1]
        
        # RSI
        rsi = self._calculate_rsi(closes)
        
        # Moving averages
        sma_20 = np.mean(closes[-20:])
        sma_50 = np.mean(closes[-50:])
        ema_12 = self._calculate_ema(closes, 12)
        ema_26 = self._calculate_ema(closes, 26)
        
        # MACD
        macd = ema_12 - ema_26
        signal_line = self._calculate_ema(np.array([macd]), 9) if len([macd]) >= 9 else macd
        
        # Bollinger Bands
        bb_upper, bb_lower, bb_mid = self._calculate_bollinger(closes)
        
        # ATR for stop loss calculation
        atr = self._calculate_atr_simple(highs, lows, closes)
        
        signal = None
        
        # ═══════════════════════════════════════════════════════════════════
        # STRATEGY 1: TREND FOLLOWING
        # ═══════════════════════════════════════════════════════════════════
        if regime in [Regime.TRENDING_UP, Regime.TRENDING_DOWN]:
            if regime == Regime.TRENDING_UP:
                # Long on pullback in uptrend
                if rsi < 45 and current_price > sma_50 and current_price < sma_20:
                    confidence = min(0.8, 0.5 + (50 - rsi) / 100)
                    stop_loss = current_price - (2 * atr)
                    take_profit = current_price + (3 * atr)
                    
                    signal = Signal(
                        type=SignalType.LONG,
                        symbol=symbol,
                        confidence=confidence,
                        strategy="TREND_PULLBACK",
                        entry_price=current_price,
                        stop_loss=stop_loss,
                        take_profit=take_profit,
                        regime=regime,
                        macro=macro_context
                    )
            else:  # TRENDING_DOWN
                # Short on rally in downtrend
                if rsi > 55 and current_price < sma_50 and current_price > sma_20:
                    confidence = min(0.8, 0.5 + (rsi - 50) / 100)
                    stop_loss = current_price + (2 * atr)
                    take_profit = current_price - (3 * atr)
                    
                    signal = Signal(
                        type=SignalType.SHORT,
                        symbol=symbol,
                        confidence=confidence,
                        strategy="TREND_PULLBACK",
                        entry_price=current_price,
                        stop_loss=stop_loss,
                        take_profit=take_profit,
                        regime=regime,
                        macro=macro_context
                    )
        
        # ═══════════════════════════════════════════════════════════════════
        # STRATEGY 2: MEAN REVERSION
        # ═══════════════════════════════════════════════════════════════════
        elif regime == Regime.RANGING:
            # Long at lower Bollinger Band
            if current_price < bb_lower and rsi < 30:
                confidence = min(0.75, 0.4 + (30 - rsi) / 50)
                stop_loss = current_price - (1.5 * atr)
                take_profit = bb_mid  # Target middle band
                
                signal = Signal(
                    type=SignalType.LONG,
                    symbol=symbol,
                    confidence=confidence,
                    strategy="MEAN_REVERSION",
                    entry_price=current_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    regime=regime,
                    macro=macro_context
                )
            
            # Short at upper Bollinger Band
            elif current_price > bb_upper and rsi > 70:
                confidence = min(0.75, 0.4 + (rsi - 70) / 50)
                stop_loss = current_price + (1.5 * atr)
                take_profit = bb_mid
                
                signal = Signal(
                    type=SignalType.SHORT,
                    symbol=symbol,
                    confidence=confidence,
                    strategy="MEAN_REVERSION",
                    entry_price=current_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    regime=regime,
                    macro=macro_context
                )
        
        # ═══════════════════════════════════════════════════════════════════
        # STRATEGY 3: BREAKOUT
        # ═══════════════════════════════════════════════════════════════════
        elif regime == Regime.VOLATILE:
            # Recent high/low breakout
            recent_high = max(highs[-20:])
            recent_low = min(lows[-20:])
            
            # Bullish breakout
            if current_price > recent_high and rsi > 50 and rsi < 70:
                confidence = min(0.7, 0.5 + (rsi - 50) / 100)
                stop_loss = recent_high - atr  # Below breakout level
                take_profit = current_price + (2.5 * atr)
                
                signal = Signal(
                    type=SignalType.LONG,
                    symbol=symbol,
                    confidence=confidence,
                    strategy="BREAKOUT",
                    entry_price=current_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    regime=regime,
                    macro=macro_context
                )
            
            # Bearish breakout
            elif current_price < recent_low and rsi < 50 and rsi > 30:
                confidence = min(0.7, 0.5 + (50 - rsi) / 100)
                stop_loss = recent_low + atr
                take_profit = current_price - (2.5 * atr)
                
                signal = Signal(
                    type=SignalType.SHORT,
                    symbol=symbol,
                    confidence=confidence,
                    strategy="BREAKOUT",
                    entry_price=current_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    regime=regime,
                    macro=macro_context
                )
        
        # Reduce confidence during CAUTION macro context
        if signal and macro_context == MacroContext.CAUTION:
            signal.confidence *= 0.7
            logger.info(f"[{symbol}] Macro CAUTION - reduced confidence")
        
        return signal
    
    def _calculate_rsi(self, closes: np.ndarray, period: int = 14) -> float:
        """Calculate Relative Strength Index."""
        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_ema(self, data: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average."""
        if len(data) < period:
            return np.mean(data)
        
        multiplier = 2 / (period + 1)
        ema = np.mean(data[:period])
        
        for price in data[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def _calculate_bollinger(self, closes: np.ndarray, period: int = 20, std_dev: int = 2) -> Tuple[float, float, float]:
        """Calculate Bollinger Bands."""
        sma = np.mean(closes[-period:])
        std = np.std(closes[-period:])
        
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        
        return upper, lower, sma
    
    def _calculate_atr_simple(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Calculate Average True Range."""
        tr = np.maximum(
            highs[-period:] - lows[-period:],
            np.maximum(
                np.abs(highs[-period:] - np.roll(closes, 1)[-period:]),
                np.abs(lows[-period:] - np.roll(closes, 1)[-period:])
            )
        )
        return np.mean(tr)

# ══════════════════════════════════════════════════════════════════════════════
#  RISK MANAGER
# ══════════════════════════════════════════════════════════════════════════════

class RiskManager:
    """
    Position sizing and risk management.
    """
    
    def __init__(self, config: Config):
        self.config = config
    
    def calculate_position_size(
        self,
        equity: float,
        entry_price: float,
        stop_loss: float,
        confidence: float
    ) -> Tuple[float, int]:
        """
        Calculate position size based on risk parameters.
        Returns (size_in_usd, leverage).
        """
        # Risk amount (adjusted by confidence)
        risk_amount = equity * self.config.RISK_PER_TRADE * confidence
        
        # Distance to stop loss
        sl_distance = abs(entry_price - stop_loss)
        sl_percentage = sl_distance / entry_price
        
        # Position size that risks the desired amount
        position_size = risk_amount / sl_percentage
        
        # Calculate required leverage
        leverage = min(
            int(position_size / equity) + 1,
            self.config.MAX_LEVERAGE
        )
        
        # Adjust position size for max leverage
        max_position = equity * leverage
        position_size = min(position_size, max_position)
        
        return round(position_size, 2), leverage
    
    def check_risk_limits(self, positions: List[Position], equity: float) -> bool:
        """Check if we can open a new position."""
        if len(positions) >= self.config.MAX_POSITIONS:
            logger.warning("Max positions reached")
            return False
        
        # Check total exposure
        total_exposure = sum(p.size for p in positions)
        if total_exposure > equity * self.config.MAX_LEVERAGE * 0.8:
            logger.warning("Total exposure limit reached")
            return False
        
        return True

# ══════════════════════════════════════════════════════════════════════════════
#  HYPERLIQUID API CLIENT
# ══════════════════════════════════════════════════════════════════════════════

class HyperliquidClient:
    """
    Hyperliquid API wrapper for trading operations.
    Supports both paper trading and live trading.
    """
    
    BASE_URL = "https://api.hyperliquid.xyz"
    INFO_URL = "https://api.hyperliquid.xyz/info"
    
    def __init__(self, config: Config):
        self.config = config
        self.paper = config.PAPER_TRADE
        self.paper_balance = config.PAPER_BALANCE
        self.paper_positions: Dict[str, Position] = {}
        self.session = requests.Session()
    
    def get_candles(self, symbol: str, interval: str = "1h", limit: int = 100) -> List[Dict]:
        """Fetch OHLCV candles from Hyperliquid."""
        try:
            response = self.session.post(
                self.INFO_URL,
                json={
                    "type": "candleSnapshot",
                    "req": {
                        "coin": symbol,
                        "interval": interval,
                        "startTime": int((datetime.now(timezone.utc) - timedelta(hours=limit)).timestamp() * 1000),
                        "endTime": int(datetime.now(timezone.utc).timestamp() * 1000)
                    }
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                candles = []
                for c in data:
                    candles.append({
                        "timestamp": c["t"],
                        "open": float(c["o"]),
                        "high": float(c["h"]),
                        "low": float(c["l"]),
                        "close": float(c["c"]),
                        "volume": float(c["v"])
                    })
                return candles
            else:
                logger.error(f"Failed to fetch candles: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching candles: {e}")
            return []
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Get current price for a symbol."""
        try:
            response = self.session.post(
                self.INFO_URL,
                json={"type": "allMids"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return float(data.get(symbol, 0))
            return None
        except Exception as e:
            logger.error(f"Error fetching price: {e}")
            return None
    
    def get_equity(self) -> float:
        """Get account equity."""
        if self.paper:
            # Calculate paper equity including unrealized P&L
            unrealized_pnl = sum(
                self._calculate_unrealized_pnl(p) 
                for p in self.paper_positions.values()
            )
            return self.paper_balance + unrealized_pnl
        
        # Live trading - fetch from API
        try:
            response = self.session.post(
                self.INFO_URL,
                json={
                    "type": "clearinghouseState",
                    "user": self.config.HL_WALLET_ADDRESS
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return float(data.get("marginSummary", {}).get("accountValue", 0))
            return 0
        except Exception as e:
            logger.error(f"Error fetching equity: {e}")
            return 0
    
    def get_positions(self) -> List[Position]:
        """Get open positions."""
        if self.paper:
            return list(self.paper_positions.values())
        
        # Live trading - fetch from API
        try:
            response = self.session.post(
                self.INFO_URL,
                json={
                    "type": "clearinghouseState",
                    "user": self.config.HL_WALLET_ADDRESS
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                positions = []
                for p in data.get("assetPositions", []):
                    pos = p.get("position", {})
                    if float(pos.get("szi", 0)) != 0:
                        positions.append(Position(
                            id=str(uuid.uuid4()),
                            symbol=pos.get("coin", ""),
                            side="LONG" if float(pos.get("szi", 0)) > 0 else "SHORT",
                            entry_price=float(pos.get("entryPx", 0)),
                            size=abs(float(pos.get("szi", 0))),
                            leverage=int(pos.get("leverage", {}).get("value", 1)),
                            stop_loss=0,  # Not stored on-chain
                            take_profit=0,
                            entry_time=datetime.now(timezone.utc),
                            regime="",
                            macro=""
                        ))
                return positions
            return []
        except Exception as e:
            logger.error(f"Error fetching positions: {e}")
            return []
    
    def open_position(self, signal: Signal, size: float, leverage: int) -> Optional[Position]:
        """Open a new position."""
        if self.paper:
            return self._paper_open(signal, size, leverage)
        
        # Live trading - implement actual order placement
        logger.warning("Live trading not yet implemented - use paper mode")
        return None
    
    def close_position(self, position: Position, reason: str = "MANUAL") -> Optional[Dict]:
        """Close an existing position."""
        if self.paper:
            return self._paper_close(position, reason)
        
        # Live trading - implement actual order placement
        logger.warning("Live trading not yet implemented - use paper mode")
        return None
    
    def _paper_open(self, signal: Signal, size: float, leverage: int) -> Optional[Position]:
        """Simulate opening a position in paper trading."""
        position = Position(
            id=str(uuid.uuid4()),
            symbol=signal.symbol,
            side=signal.type.value,
            entry_price=signal.entry_price,
            size=size,
            leverage=leverage,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            entry_time=datetime.now(timezone.utc),
            regime=signal.regime.value,
            macro=signal.macro.value
        )
        
        self.paper_positions[signal.symbol] = position
        logger.info(f"[PAPER] Opened {signal.type.value} {signal.symbol} @ ${signal.entry_price:.2f}")
        return position
    
    def _paper_close(self, position: Position, reason: str) -> Optional[Dict]:
        """Simulate closing a position in paper trading."""
        if position.symbol not in self.paper_positions:
            return None
        
        current_price = self.get_price(position.symbol)
        if not current_price:
            return None
        
        # Calculate P&L
        if position.side == "LONG":
            pnl = (current_price - position.entry_price) / position.entry_price * position.size
        else:
            pnl = (position.entry_price - current_price) / position.entry_price * position.size
        
        # Update paper balance
        self.paper_balance += pnl
        
        # Remove position
        del self.paper_positions[position.symbol]
        
        held_minutes = int((datetime.now(timezone.utc) - position.entry_time).total_seconds() / 60)
        
        result = {
            "symbol": position.symbol,
            "side": position.side,
            "entry_price": position.entry_price,
            "exit_price": current_price,
            "size": position.size,
            "pnl": pnl,
            "pnl_pct": (pnl / position.size) * 100,
            "reason": reason,
            "held_minutes": held_minutes
        }
        
        logger.info(f"[PAPER] Closed {position.symbol} | P&L: ${pnl:.2f} ({result['pnl_pct']:.2f}%) | Reason: {reason}")
        return result
    
    def _calculate_unrealized_pnl(self, position: Position) -> float:
        """Calculate unrealized P&L for a position."""
        current_price = self.get_price(position.symbol)
        if not current_price:
            return 0
        
        if position.side == "LONG":
            return (current_price - position.entry_price) / position.entry_price * position.size
        else:
            return (position.entry_price - current_price) / position.entry_price * position.size
    
    def check_sl_tp(self, position: Position) -> Optional[str]:
        """Check if position hit stop loss or take profit."""
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
#  DASHBOARD SYNC (from apex_bot_sync.py)
# ══════════════════════════════════════════════════════════════════════════════

class BotSync:
    """Sync bot state to APEX web dashboard."""
    
    def __init__(self, config: Config):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "x-bot-secret": config.BOT_API_SECRET,
        })
        self._cycles_today = 0
        self._trades_today = 0
        self._pnl_today = 0.0
        self._day = datetime.now(timezone.utc).date()
    
    def _reset_daily(self):
        today = datetime.now(timezone.utc).date()
        if today > self._day:
            self._cycles_today = 0
            self._trades_today = 0
            self._pnl_today = 0.0
            self._day = today
    
    def _post(self, payload: dict) -> bool:
        try:
            r = self.session.post(
                f"{self.config.APEX_APP_URL}/api/bot/sync",
                json={**payload, "user_id": self.config.APEX_USER_ID},
                timeout=5,
            )
            return r.status_code == 200
        except Exception as e:
            logger.debug(f"Sync failed: {e}")
            return False
    
    def heartbeat(
        self,
        equity: float,
        open_positions: int,
        regime: str,
        macro_context: str,
        pnl_delta: float = 0.0,
        trade_fired: bool = False
    ):
        self._reset_daily()
        self._cycles_today += 1
        if trade_fired:
            self._trades_today += 1
        self._pnl_today += pnl_delta
        
        self._post({
            "type": "heartbeat",
            "equity": equity,
            "open_positions": open_positions,
            "regime": regime,
            "macro_context": macro_context,
            "cycles_today": self._cycles_today,
            "trades_today": self._trades_today,
            "pnl_today": round(self._pnl_today, 2),
        })
    
    def trade_signal(self, position: Position, confidence: float, net_score: float):
        self._post({
            "type": "trade_signal",
            "id": position.id,
            "symbol": position.symbol,
            "side": position.side,
            "entry_price": position.entry_price,
            "size": position.size,
            "leverage": position.leverage,
            "stop_loss": position.stop_loss,
            "take_profit": position.take_profit,
            "confidence": confidence,
            "net_score": net_score,
            "regime": position.regime,
            "macro_context": position.macro,
            "paper": self.config.PAPER_TRADE,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    
    def trade_close(self, position: Position, result: Dict):
        self._pnl_today += result["pnl"]
        self._post({
            "type": "trade_close",
            "id": str(uuid.uuid4()),
            "signal_id": position.id,
            "symbol": result["symbol"],
            "side": result["side"],
            "entry_price": result["entry_price"],
            "exit_price": result["exit_price"],
            "size": result["size"],
            "pnl": round(result["pnl"], 4),
            "pnl_pct": round(result["pnl_pct"], 4),
            "close_reason": result["reason"],
            "held_minutes": result["held_minutes"],
            "paper": self.config.PAPER_TRADE,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

# ══════════════════════════════════════════════════════════════════════════════
#  MAIN BOT
# ══════════════════════════════════════════════════════════════════════════════

class APEXBot:
    """Main trading bot orchestrator."""
    
    def __init__(self):
        self.config = CONFIG
        self.client = HyperliquidClient(self.config)
        self.signal_engine = SignalEngine()
        self.risk_manager = RiskManager(self.config)
        self.sync = BotSync(self.config)
        self.running = False
    
    def start(self):
        """Start the bot."""
        logger.info("=" * 60)
        logger.info("  APEX Trading Bot Starting")
        logger.info("=" * 60)
        logger.info(f"  Mode: {'PAPER TRADING' if self.config.PAPER_TRADE else 'LIVE TRADING'}")
        logger.info(f"  Assets: {', '.join(self.config.ASSETS)}")
        logger.info(f"  Timeframe: {self.config.TIMEFRAME}")
        logger.info(f"  Max Leverage: {self.config.MAX_LEVERAGE}x")
        logger.info(f"  Risk per Trade: {self.config.RISK_PER_TRADE * 100}%")
        logger.info("=" * 60)
        
        self.running = True
        
        while self.running:
            try:
                self.cycle()
                time.sleep(self.config.CYCLE_INTERVAL)
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                self.running = False
            except Exception as e:
                logger.error(f"Cycle error: {e}")
                time.sleep(10)
    
    def cycle(self):
        """Run one bot cycle."""
        equity = self.client.get_equity()
        positions = self.client.get_positions()
        
        # Get current regime and macro context for dashboard
        macro_context, _ = self.signal_engine.macro_calendar.get_context()
        current_regime = Regime.UNKNOWN
        
        trade_fired = False
        pnl_delta = 0.0
        
        # ═══════════════════════════════════════════════════════════════════
        # CHECK EXISTING POSITIONS FOR SL/TP
        # ═══════════════════════════════════════════════════════════════════
        for position in positions:
            close_reason = self.client.check_sl_tp(position)
            if close_reason:
                result = self.client.close_position(position, close_reason)
                if result:
                    pnl_delta += result["pnl"]
                    self.sync.trade_close(position, result)
        
        # ═══════════════════════════════════════════════════════════════════
        # SCAN FOR NEW SIGNALS
        # ═══════════════════════════════════════════════════════════════════
        if self.risk_manager.check_risk_limits(positions, equity):
            for symbol in self.config.ASSETS:
                # Skip if already in position
                if any(p.symbol == symbol for p in positions):
                    continue
                
                # Fetch candles and generate signal
                candles = self.client.get_candles(symbol, self.config.TIMEFRAME)
                if not candles:
                    continue
                
                signal = self.signal_engine.generate_signals(symbol, candles)
                current_regime = self.signal_engine.regime_detector.detect(candles)
                
                if signal and signal.confidence >= 0.5:
                    # Calculate position size
                    size, leverage = self.risk_manager.calculate_position_size(
                        equity,
                        signal.entry_price,
                        signal.stop_loss,
                        signal.confidence
                    )
                    
                    # Open position
                    position = self.client.open_position(signal, size, leverage)
                    if position:
                        trade_fired = True
                        self.sync.trade_signal(position, signal.confidence, signal.confidence)
                        
                        logger.info(
                            f"[{symbol}] {signal.type.value} | "
                            f"Strategy: {signal.strategy} | "
                            f"Confidence: {signal.confidence:.2f} | "
                            f"Size: ${size:.2f} | "
                            f"Leverage: {leverage}x"
                        )
        
        # ═══════════════════════════════════════════════════════════════════
        # SEND HEARTBEAT
        # ═══════════════════════════════════════════════════════════════════
        self.sync.heartbeat(
            equity=equity,
            open_positions=len(self.client.get_positions()),
            regime=current_regime.value,
            macro_context=macro_context.value,
            pnl_delta=pnl_delta,
            trade_fired=trade_fired
        )
        
        # Log status
        positions_str = ", ".join([f"{p.symbol}:{p.side}" for p in self.client.get_positions()])
        logger.info(
            f"Cycle | Equity: ${equity:.2f} | "
            f"Positions: [{positions_str or 'none'}] | "
            f"Regime: {current_regime.value} | "
            f"Macro: {macro_context.value}"
        )

# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    bot = APEXBot()
    bot.start()
