import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase-config";
import { getSupabaseFetch } from "@/lib/supabase-fetch";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for Route Handlers. Writes session cookies directly using
 * the Next.js async cookies() API.
 */
export async function createSupabaseRouteClient() {
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
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The setAll method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });

  return { supabase, url };
}

