import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for Client Components
 *
 * This client:
 * - Respects Row Level Security (RLS) policies
 * - Has access to user authentication state
 * - Automatically handles cookies for session management
 *
 * Use this in:
 * - Client Components (with 'use client' directive)
 * - Browser-side interactions
 * - Real-time subscriptions
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
