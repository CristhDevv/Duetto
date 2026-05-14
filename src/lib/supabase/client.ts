import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/[\r\n]+/g, ''),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim().replace(/[\r\n]+/g, '')
)

export function createClient() {
  return supabase
}
