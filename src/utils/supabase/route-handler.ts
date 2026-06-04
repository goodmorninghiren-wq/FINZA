import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase-config";
import { getSupabaseFetch } from "@/lib/supabase-fetch";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for Route Handlers. Writes session cookies onto `response`
 * so the browser receives Set-Cookie (fixes logout-on-refresh).
 */
export async function createSupabaseRouteClient(response: NextResponse) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars in .env.local");
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    global: { fetch: getSupabaseFetch() },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, url };
}
