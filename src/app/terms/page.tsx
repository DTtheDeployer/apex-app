import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - APEX',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <nav className="border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="font-bold text-lg">APEX</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/60 leading-relaxed">
          <p><strong className="text-white">Last updated:</strong> March 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8">1. Service Description</h2>
          <p>APEX provides automated trading signals and execution tools for the Hyperliquid decentralized exchange. The service includes paper trading (simulated) and live trading (real orders) functionality.</p>

          <h2 className="text-xl font-semibold text-white mt-8">2. Risk Disclosure</h2>
          <p>Trading perpetual futures involves significant risk of loss. You may lose some or all of your invested capital. Past performance does not guarantee future results. APEX is a tool, not financial advice.</p>

          <h2 className="text-xl font-semibold text-white mt-8">3. Non-Custodial</h2>
          <p>APEX never holds your funds. You connect via a trade-only API sub-wallet generated on Hyperliquid. Withdrawals are architecturally impossible through the API keys used.</p>

          <h2 className="text-xl font-semibold text-white mt-8">4. Subscriptions & Billing</h2>
          <p>Paid plans are billed monthly via Stripe. You may cancel or change your plan at any time through the billing settings. Refunds are handled on a case-by-case basis.</p>

          <h2 className="text-xl font-semibold text-white mt-8">5. Acceptable Use</h2>
          <p>You agree not to reverse engineer, abuse, or use the service for any unlawful purpose. Accounts violating these terms may be suspended.</p>

          <h2 className="text-xl font-semibold text-white mt-8">6. Limitation of Liability</h2>
          <p>APEX is provided &quot;as is&quot; without warranty. We are not liable for trading losses, system downtime, or API failures. You trade at your own risk.</p>

          <h2 className="text-xl font-semibold text-white mt-8">7. Contact</h2>
          <p>Questions about these terms? Email us at support@apexhl.trade.</p>
        </div>
      </div>
    </div>
  )
}
