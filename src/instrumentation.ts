/**
 * Runs once when the Next.js server starts.
 * Helps Supabase HTTPS work on Windows dev machines (antivirus/VPN SSL inspection).
 */
export async function register() {
  if (process.env.NODE_ENV !== "production") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}
