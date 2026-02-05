'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface AppHeaderProps {
  userName?: string | null
}

export function AppHeader({ userName }: AppHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()

    try {
      await supabase.auth.signOut()
    } catch {
      // Even on network error, clear local session
    }

    window.location.href = '/login'
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-lg font-semibold">
          AI Starter Kit
        </Link>
        <div className="flex items-center gap-4">
          {userName && (
            <>
              <span className="text-sm text-muted-foreground">{userName}</span>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Abmelden
          </Button>
        </div>
      </div>
    </header>
  )
}
