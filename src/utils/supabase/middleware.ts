import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase-config'
import { getSupabaseFetch, isSupabaseNetworkError } from '@/lib/supabase-fetch'

export async function updateSession(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    if (pathname.startsWith('/api/')) {
        return NextResponse.next({ request })
    }

    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv()

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        global: { fetch: getSupabaseFetch() },
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    let user = null
    let authUnreachable = false

    try {
        const { data: { user: userData }, error } = await supabase.auth.getUser()
        user = userData
        if (error && isSupabaseNetworkError(error.message)) {
            authUnreachable = true
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : ''
        if (isSupabaseNetworkError(message)) {
            authUnreachable = true
        }
    }

    if (user && pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    const isPublicPath =
        pathname.startsWith('/login') || pathname.startsWith('/auth')

    if (!user && !authUnreachable && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
