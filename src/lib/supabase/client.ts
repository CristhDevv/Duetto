import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/[\r\n]+/g, ''),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim().replace(/[\r\n]+/g, '')
  )
  return client
}
