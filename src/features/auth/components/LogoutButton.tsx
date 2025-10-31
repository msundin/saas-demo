'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  children?: React.ReactNode
  className?: string
}

export function LogoutButton({
  children = 'Log out',
  className,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Failed to log out:', error.message)
        setIsLoggingOut(false)
        return
      }

      // Redirect to home page after successful logout
      router.push('/')
    } catch (error) {
      console.error('Failed to log out:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? 'Logging out...' : children}
    </Button>
  )
}
