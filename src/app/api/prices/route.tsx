import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch prices')
    }

    const data = await response.json()
    
    const assets = ['BTC', 'ETH', 'SOL', 'ARB', 'DOGE']
    const prices: Record<string, number> = {}
    
    for (const asset of assets) {
      if (data[asset]) {
        prices[asset] = parseFloat(data[asset])
      }
    }

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Prices error:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}