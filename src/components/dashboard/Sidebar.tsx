'use client'
// src/components/dashboard/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  LayoutDashboard, Settings, TrendingUp, CreditCard,
  LogOut, Zap, ChevronRight
} from 'lucide-react'

const nav = [
  { label: 'Dashboard',   href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Trades',      href: '/dashboard/trades',   icon: TrendingUp },
  { label: 'Settings',    href: '/settings',            icon: Settings },
  { label: 'Billing',     href: '/settings/billing',   icon: CreditCard },
]

const PLAN_BADGE: Record<string, string> = {
  starter: 'badge-subtle',
  pro:     'badge-blue',
  elite:   'badge-gold',
}

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 border-r border-white/[0.06] bg-surface flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="font-bold text-sm">APEX <span className="text-subtle font-normal">/ HL</span></span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                ${active
                  ? 'bg-green/10 text-green'
                  : 'text-muted hover:text-white hover:bg-white/[0.04]'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
        {/* Plan badge */}
        <div className="px-3 py-2 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-subtle" />
          <span className={`${PLAN_BADGE[profile?.plan ?? 'starter']} capitalize`}>
            {profile?.plan ?? 'starter'}
          </span>
          {profile?.plan === 'starter' && (
            <Link href="/settings/billing"
              className="ml-auto text-xs text-green hover:underline font-medium">
              Upgrade
            </Link>
          )}
        </div>

        {/* User email */}
        <div className="px-3 py-1">
          <p className="text-xs text-subtle truncate">{profile?.email}</p>
        </div>

        {/* Sign out */}
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted
                     hover:text-red hover:bg-red/5 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
