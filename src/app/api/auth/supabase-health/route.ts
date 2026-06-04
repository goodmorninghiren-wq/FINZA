import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase-config";
import { isSupabaseNetworkError } from "@/lib/supabase-fetch";

/** Server → Supabase connectivity check (avoids browser CORS). */
export async function GET() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return NextResponse.json({
      ok: false,
      error: "Supabase env vars missing in .env.local",
    });
  }

  const host = new URL(url).host;

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    const ok =
      res.status === 200 ||
      res.status === 401 ||
      (res.status >= 400 && res.status < 500 && res.status !== 404);

    if (res.status === 404) {
      return NextResponse.json({
        ok: false,
        status: 404,
        host,
        error:
          "Supabase returned 404. Often this is SSL/VPN on your PC — run `npm run dev`, not `next dev`. If it continues, confirm the project URL and anon key in .env.local match supabase.com/dashboard.",
      });
    }

    return NextResponse.json({
      ok,
      status: res.status,
      host,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cannot reach Supabase";
    const sslHint = isSupabaseNetworkError(message)
      ? "SSL/network blocked. Run: npm run dev"
      : undefined;

    return NextResponse.json({
      ok: false,
      error: message,
      sslHint,
      host,
    });
  }
}
