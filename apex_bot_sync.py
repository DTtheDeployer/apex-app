"""
APEX Bot Sync Module
====================
Sends heartbeats and trade data from hl_bot.py to your web dashboard.
Add one import and a few function calls to hl_bot.py.

Setup:
  Set BOT_API_SECRET and APEX_APP_URL in your .env / environment.
  These must match what's in your Next.js app .env.local.

Usage in hl_bot.py:
  from apex_bot_sync import BotSync
  sync = BotSync(user_id="your-supabase-user-uuid")

  # In cycle():
  sync.heartbeat(equity=equity, open_positions=n, regime=regime, ...)

  # In execute() after opening:
  sync.trade_signal(trade_data)

  # In execute() after closing:
  sync.trade_close(close_data)
"""

import os
import json
import logging
import requests
import uuid
from datetime import datetime, timezone

logger = logging.getLogger("APEX-Sync")

APEX_APP_URL   = os.getenv("APEX_APP_URL", "https://app.apex-hl.io")
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "")


class BotSync:
    """
    Thin HTTP client that posts bot events to the APEX web dashboard.
    All calls are fire-and-forget with error suppression — sync failures
    never block trading operations.
    """

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.base_url = APEX_APP_URL.rstrip('/')
        self.session  = requests.Session()
        self.session.headers.update({
            "Content-Type":  "application/json",
            "x-bot-secret":  BOT_API_SECRET,
        })
        self._cycles_today  = 0
        self._trades_today  = 0
        self._pnl_today     = 0.0
        self._day           = datetime.now(timezone.utc).date()

    def _reset_daily(self):
        today = datetime.now(timezone.utc).date()
        if today > self._day:
            self._cycles_today = 0
            self._trades_today = 0
            self._pnl_today    = 0.0
            self._day          = today

    def _post(self, payload: dict) -> bool:
        """POST to /api/bot/sync. Silent on failure."""
        try:
            r = self.session.post(
                f"{self.base_url}/api/bot/sync",
                json={**payload, "user_id": self.user_id},
                timeout=5,
            )
            if r.status_code != 200:
                logger.debug(f"Sync non-200: {r.status_code} {r.text[:100]}")
                return False
            return True
        except Exception as e:
            logger.debug(f"Sync failed (non-critical): {e}")
            return False

    def heartbeat(
        self,
        equity: float,
        open_positions: int = 0,
        regime: str = "UNKNOWN",
        macro_context: str = "NONE",
        pnl_delta: float = 0.0,
        trade_fired: bool = False,
    ):
        """Call once per bot cycle."""
        self._reset_daily()
        self._cycles_today += 1
        if trade_fired:
            self._trades_today += 1
        self._pnl_today += pnl_delta

        self._post({
            "type":           "heartbeat",
            "equity":         equity,
            "open_positions": open_positions,
            "regime":         regime,
            "macro_context":  macro_context,
            "cycles_today":   self._cycles_today,
            "trades_today":   self._trades_today,
            "pnl_today":      round(self._pnl_today, 2),
        })

    def trade_signal(
        self,
        signal_id: str,
        symbol: str,
        side: str,
        entry_price: float,
        size: float,
        leverage: int,
        stop_loss: float,
        take_profit: float,
        confidence: float,
        net_score: float,
        regime: str = "",
        macro_context: str = "",
        paper: bool = True,
    ):
        """Call when a new position is opened."""
        self._post({
            "type":          "trade_signal",
            "id":            signal_id,
            "symbol":        symbol,
            "side":          side,
            "entry_price":   entry_price,
            "size":          size,
            "leverage":      leverage,
            "stop_loss":     stop_loss,
            "take_profit":   take_profit,
            "confidence":    confidence,
            "net_score":     net_score,
            "regime":        regime,
            "macro_context": macro_context,
            "paper":         paper,
            "timestamp":     datetime.now(timezone.utc).isoformat(),
        })

    def trade_close(
    self,
    close_id: str,
    signal_id: str,       # ID of the original signal
    symbol: str,
    side: str,
    entry_price: float,
    exit_price: float,
    size: float,
    pnl: float,
    pnl_pct: float,
    close_reason: str,    # TP | SL | MANUAL
    held_minutes: int,
    paper: bool = True,
    strategy: str = "",   # ADD THIS LINE
):
        """Call when a position is closed."""
        self._pnl_today += pnl
        self._post({
    "type":          "trade_close",
    "id":            close_id,
    "signal_id":     signal_id,
    "symbol":        symbol,
    "side":          side,
    "entry_price":   entry_price,
    "exit_price":    exit_price,
    "size":          size,
    "pnl":           round(pnl, 4),
    "pnl_pct":       round(pnl_pct, 4),
    "close_reason":  close_reason,
    "held_minutes":  held_minutes,
    "paper":         paper,
    "strategy":      strategy,   # ADD THIS LINE
    "timestamp":     datetime.now(timezone.utc).isoformat(),
})


# ══════════════════════════════════════════════════════════════════════════════
#  PATCH for hl_bot.py
#  Add these 5 lines to wire BotSync into your existing bot
# ══════════════════════════════════════════════════════════════════════════════

PATCH = """
# ── Add to top of hl_bot.py ────────────────────────────────────────────────
import os, uuid
from apex_bot_sync import BotSync

# ── Add to HyperliquidBot.__init__() ───────────────────────────────────────
self.sync = BotSync(user_id=os.getenv("APEX_USER_ID", ""))

# ── Add to HyperliquidBot.cycle() at the end ───────────────────────────────
self.sync.heartbeat(
    equity         = equity,
    open_positions = len(self._get_positions()),
    regime         = summary.get("analyses", [{}])[0].get("regime", "UNKNOWN"),
    macro_context  = summary.get("analyses", [{}])[0].get("macro",  "NONE"),
)

# ── Add to HyperliquidBot.execute() after opening a position ───────────────
signal_id = str(uuid.uuid4())
self.sync.trade_signal(
    signal_id=signal_id, symbol=coin, side="LONG",
    entry_price=price, size=size, leverage=self.leverage,
    stop_loss=sl, take_profit=tp,
    confidence=abs(conf), net_score=conf,
    regime=analysis.get("regime",""), macro_context=analysis.get("macro",""),
    paper=self.client.paper,
)
# store signal_id with the position so you can reference it on close:
# position_signal_ids[coin] = signal_id

# ── Add after closing a position ───────────────────────────────────────────
self.sync.trade_close(
    close_id=str(uuid.uuid4()),
    signal_id=position_signal_ids.get(coin, ""),
    symbol=coin, side="LONG",
    entry_price=entry, exit_price=price,
    size=size, pnl=pnl, pnl_pct=pnl/entry/size*100,
    close_reason="TP" if price >= tp else "SL",
    held_minutes=int((time.time()-entry_time)/60),
    paper=self.client.paper,
)
"""

if __name__ == "__main__":
    # Quick connectivity test
    import os
    print("APEX Bot Sync — connectivity test")
    print(f"Target: {APEX_APP_URL}")
    print(f"Secret: {'set ✓' if BOT_API_SECRET else 'NOT SET ✗'}")

    test_sync = BotSync(user_id="test-user")
    ok = test_sync._post({"type": "heartbeat", "equity": 10000, "open_positions": 0,
                          "regime": "TEST", "macro_context": "NONE",
                          "cycles_today": 1, "trades_today": 0, "pnl_today": 0})
    print(f"Connectivity: {'✓ OK' if ok else '✗ Failed (check URL and secret)'}")
