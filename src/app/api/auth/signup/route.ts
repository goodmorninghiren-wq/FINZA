import { NextResponse } from "next/server";
import { assertSupabaseEnv } from "@/lib/supabase-config";
import { parseJsonBody, friendlyJsonOrNetworkError } from "@/lib/parse-json-body";
import { supabaseAuthErrorMessage } from "@/lib/supabase-fetch";
import { createSupabaseRouteClient } from "@/utils/supabase/route-handler";

export async function POST(request: Request) {
  const parsed = await parseJsonBody<{ email?: string; password?: string }>(
    request
  );
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const email = String(parsed.data.email || "")
    .trim()
    .toLowerCase();
  const password = String(parsed.data.password || "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  let url: string;
  try {
    url = assertSupabaseEnv().url;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Supabase is not configured.",
      },
      { status: 500 }
    );
  }

  const host = new URL(url).host;
  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    const { supabase } = await createSupabaseRouteClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/login`,
      },
    });

    if (error) {
      const status = error.message.includes("already registered") ? 409 : 400;
      return NextResponse.json(
        { error: supabaseAuthErrorMessage(error, url) },
        { status }
      );
    }

    if (data.session) {
      return NextResponse.json({ ok: true, session: true });
    }

    return NextResponse.json(
      {
        ok: true,
        session: false,
        message:
          "Account created. Check your email to confirm, or ask an admin to disable email confirmation.",
      }
    );
  } catch (err) {
    console.error("[auth/signup]", err);
    const raw = err instanceof Error ? err.message : "Sign up failed.";
    return NextResponse.json(
      { error: friendlyJsonOrNetworkError(raw, host) },
      { status: 500 }
    );
  }
}
