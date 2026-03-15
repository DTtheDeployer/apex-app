'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  LayoutDashboard, Settings, TrendingUp, CreditCard,
  LogOut, Zap, ChevronRight, Menu, X, Crosshair
} from 'lucide-react'

const nav = [
  { label: 'Dashboard',     href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Manual Trade',  href: '/dashboard/manual',   icon: Crosshair },
  { label: 'Trades',        href: '/dashboard/trades',   icon: TrendingUp },
  { label: 'Settings',      href: '/settings',           icon: Settings },
  { label: 'Billing',       href: '/settings/billing',   icon: CreditCard },
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
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeMobile}>
          <div className="w-7 h-7 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="font-bold text-sm">APEX <span className="text-subtle font-normal">/ HL</span></span>
        </Link>
        {/* Close button - mobile only */}
        <button 
          onClick={closeMobile}
          className="md:hidden p-1 text-muted hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          const isExactDashboard = href === '/dashboard' && pathname === '/dashboard'
          const isActive = isExactDashboard || active
          
          return (
            <Link key={href} href={href} onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                ${isActive
                  ? 'bg-green/10 text-green'
                  : 'text-muted hover:text-white hover:bg-white/[0.04]'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
        <div className="px-3 py-2 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-subtle" />
          <span className={`${PLAN_BADGE[profile?.plan ?? 'starter']} capitalize`}>
            {profile?.plan ?? 'starter'}
          </span>
          {profile?.plan === 'starter' && (
            <Link href="/settings/billing" onClick={closeMobile}
              className="ml-auto text-xs text-green hover:underline font-medium">
              Upgrade
            </Link>
          )}
        </div>

        <div className="px-3 py-1">
          <p className="text-xs text-subtle truncate">{profile?.email}</p>
        </div>

        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted
                     hover:text-red hover:bg-red/5 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-white/[0.06] flex items-center px-4 z-40">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-muted hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="font-bold text-sm">APEX</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={`
        md:hidden fixed top-0 left-0 h-full w-64 bg-surface z-50
        transform transition-transform duration-200 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-white/[0.06] bg-surface flex-col">
        <SidebarContent />
      </aside>
    </>
  )
}