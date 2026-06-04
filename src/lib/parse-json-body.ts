/** Safe JSON body parse for API route handlers (avoids "Unexpected end of JSON input"). */
export async function parseJsonBody<T extends Record<string, unknown>>(
  request: Request
): Promise<{ data: T } | { error: string; status: number }> {
  let text = "";
  try {
    text = await request.text();
  } catch {
    return { error: "Could not read request body.", status: 400 };
  }

  if (!text.trim()) {
    return { error: "Request body is empty.", status: 400 };
  }

  try {
    const data = JSON.parse(text) as T;
    return { data };
  } catch {
    return { error: "Invalid JSON in request body.", status: 400 };
  }
}

export function isJsonParseErrorMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("unexpected end of json") ||
    m.includes("unexpected token") ||
    m.includes("not valid json") ||
    (m.includes("json") && m.includes("parse"))
  );
}

export function friendlyJsonOrNetworkError(message: string, supabaseHost?: string): string {
  if (isJsonParseErrorMessage(message)) {
    return (
      "Supabase returned an empty or invalid response (often SSL/antivirus on Windows). " +
      "Stop the server, run `npm run dev`, then try again." +
      (supabaseHost ? ` (host: ${supabaseHost})` : "")
    );
  }
  if (
    message.includes("fetch failed") ||
    message.includes("UNABLE_TO_VERIFY") ||
    message.includes("certificate")
  ) {
    return "Network/SSL blocked reaching Supabase. Run: npm run dev";
  }
  return message;
}
