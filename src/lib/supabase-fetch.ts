/**
 * Server-side fetch for Supabase (use only in API routes / server code).
 * Dev TLS: npm run dev sets NODE_TLS_REJECT_UNAUTHORIZED=0; instrumentation.ts backs that up.
 */
export function getSupabaseFetch(): typeof fetch {
  return fetch;
}

export function isSupabaseNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("unable_to_verify") ||
    m.includes("certificate") ||
    m.includes("econnrefused") ||
    m.includes("enotfound") ||
    m.includes("etimedout") ||
    m.includes("network") ||
    m.includes("unexpected end of json")
  );
}

export function supabaseAuthErrorMessage(
  error: { message: string; status?: number },
  url: string
): string {
  const msg = error.message || "Authentication failed.";
  if (error.status === 404 || msg.includes("404")) {
    return (
      `Cannot reach Supabase Auth at ${new URL(url).host}. ` +
      "Check NEXT_PUBLIC_SUPABASE_URL and anon key in .env.local match supabase.com/dashboard → Project Settings → API."
    );
  }
  if (isSupabaseNetworkError(msg)) {
    return (
      "Cannot reach Supabase from this computer (network/SSL). " +
      "Run: npm run dev (not next dev). Try disabling VPN or antivirus HTTPS scanning."
    );
  }
  if (
    msg.toLowerCase().includes("unexpected end of json") ||
    msg.toLowerCase().includes("not valid json")
  ) {
    return (
      "Supabase returned an empty or invalid response. Your project is usually fine — " +
      "run npm run dev, then retry. If it persists, check VPN/antivirus or use another network."
    );
  }
  return msg;
}
