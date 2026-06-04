import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase-config'
import { getSupabaseFetch } from '@/lib/supabase-fetch'

export async function createClient() {
    const cookieStore = await cookies()

    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv()

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials missing on server. Returning dummy client.')
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
            },
            from: () => ({
                select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }), single: () => Promise.resolve({ data: null, error: null }) }) }),
            })
        } as any
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            global: { fetch: getSupabaseFetch() },
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from a Server Component — middleware refreshes sessions.
                    }
                },
            },
        }
    )
}
