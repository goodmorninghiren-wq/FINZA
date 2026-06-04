import { NextResponse } from "next/server";
import { assertSupabaseEnv } from "@/lib/supabase-config";
import {
  friendlyJsonOrNetworkError,
  parseJsonBody,
} from "@/lib/parse-json-body";
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

  try {
    const { supabase } = await createSupabaseRouteClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: supabaseAuthErrorMessage(error, url) },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/login]", err);
    const raw = err instanceof Error ? err.message : "Login failed on server.";
    return NextResponse.json(
      { error: friendlyJsonOrNetworkError(raw, host) },
      { status: 500 }
    );
  }
}
