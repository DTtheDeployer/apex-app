import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'APEX <noreply@apexhl.trade>'

export async function sendWelcomeEmail(to: string, name?: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to APEX — Let\'s get you trading',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #E8EEF4; background: #0A1628;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #00A896, #00D4AA); font-size: 24px; font-weight: 800; color: #0A1628; line-height: 48px;">A</div>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px; text-align: center; color: #E8EEF4;">Welcome to APEX${name ? `, ${name}` : ''}</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #9ba3b8; margin: 0 0 24px;">Your account is ready. Here's how to get started:</p>

          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #9ba3b8;"><strong style="color: #00A896;">1.</strong> Open your dashboard and explore paper trading — no setup required</p>
            <p style="margin: 0 0 12px; font-size: 14px; color: #9ba3b8;"><strong style="color: #00A896;">2.</strong> When ready, go to Settings and connect your Hyperliquid sub-wallet</p>
            <p style="margin: 0; font-size: 14px; color: #9ba3b8;"><strong style="color: #00A896;">3.</strong> Choose a strategy and enable live trading</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00A896, #00BFA6); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
          </div>

          <p style="font-size: 13px; color: #5a6478; text-align: center; margin: 32px 0 0;">
            Questions? Reply to this email or visit our docs.<br/>
            APEX — Non-custodial trading on Hyperliquid
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

export async function sendTradeAlertEmail(
  to: string,
  trade: {
    action: 'opened' | 'closed'
    symbol: string
    side: string
    price: number
    pnl?: number
    pnlPct?: number
    strategy?: string
  }
) {
  try {
    const isOpen = trade.action === 'opened'
    const pnlColor = (trade.pnl ?? 0) >= 0 ? '#00d084' : '#ff4757'
    const pnlText = trade.pnl != null ? `$${trade.pnl.toFixed(2)} (${(trade.pnlPct ?? 0).toFixed(1)}%)` : ''

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `APEX: ${trade.symbol} ${trade.side} ${trade.action} ${pnlText ? `— ${pnlText}` : ''}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #E8EEF4; background: #0A1628;">
          <h2 style="font-size: 20px; margin: 0 0 20px; color: #E8EEF4;">
            Trade ${isOpen ? 'Opened' : 'Closed'}: ${trade.symbol} ${trade.side}
          </h2>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #9ba3b8;">
              <strong>Symbol:</strong> ${trade.symbol}
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #9ba3b8;">
              <strong>Direction:</strong> ${trade.side}
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #9ba3b8;">
              <strong>Price:</strong> $${trade.price.toLocaleString()}
            </p>
            ${trade.strategy ? `<p style="margin: 0 0 8px; font-size: 14px; color: #9ba3b8;"><strong>Strategy:</strong> ${trade.strategy}</p>` : ''}
            ${!isOpen && trade.pnl != null ? `
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${pnlColor};">
                P&L: ${pnlText}
              </p>
            ` : ''}
          </div>
          <p style="font-size: 12px; color: #5a6478; text-align: center; margin: 24px 0 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #00A896; text-decoration: none;">View in Dashboard</a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send trade alert email:', error)
  }
}

export async function sendPaymentFailedEmail(to: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'APEX: Payment failed — action required',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #E8EEF4; background: #0A1628;">
          <h2 style="font-size: 20px; margin: 0 0 16px; color: #E8EEF4;">Payment Failed</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #9ba3b8; margin: 0 0 24px;">
            We were unable to process your subscription payment. Please update your payment method to avoid service interruption.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00A896, #00BFA6); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">Update Payment Method</a>
          </div>
          <p style="font-size: 13px; color: #5a6478; text-align: center; margin: 24px 0 0;">
            If you believe this is an error, reply to this email for support.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send payment failed email:', error)
  }
}
