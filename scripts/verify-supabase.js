/**
 * Verifies Supabase REST (anon + service role) and direct Postgres.
 * Usage: node scripts/verify-supabase.js
 * Loads .env.local from project root.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function checkRest(label, apikey) {
  const https = require("https");
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const status = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: "/rest/v1/",
        method: "GET",
        headers: { apikey },
        rejectUnauthorized: false,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.end();
  });
  const ok = status >= 200 && status < 500 && status !== 404;
  console.log(
    `[REST ${label}] ${ok ? "OK" : "FAIL"} — HTTP ${status} (${url.origin})`
  );
  return ok;
}

async function checkPostgres() {
  const host =
    process.env.SUPABASE_DB_HOST || "db.odbzxjnqgxmmffxaxoup.supabase.co";
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password && !process.env.DATABASE_URL) {
    console.log("[Postgres] SKIP — set DATABASE_URL or SUPABASE_DB_PASSWORD");
    return false;
  }

  const client = new Client(
    password
      ? {
          user: "postgres",
          password,
          host,
          port: Number(process.env.SUPABASE_DB_PORT || 5432),
          database: "postgres",
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        }
      : {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        }
  );

  try {
    await client.connect();
    const { rows } = await client.query("SELECT current_database() AS db");
    console.log(`[Postgres] OK — connected to "${rows[0].db}" on ${host}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`[Postgres] FAIL — ${err.message}`);
    if (
      err.message.includes("ENOENT") ||
      err.message.includes("ENOTFOUND") ||
      err.message.includes("ETIMEDOUT")
    ) {
      console.log(
        "  Hint: DNS/network cannot reach Supabase DB from this machine. REST API may still work in the app."
      );
    }
    return false;
  }
}

async function main() {
  loadEnvLocal();
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env:", missing.join(", "));
    process.exit(1);
  }

  console.log("Project:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonOk = await checkRest("anon", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceOk = await checkRest(
    "service_role",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const pgOk = await checkPostgres();

  const allOk = anonOk && serviceOk && pgOk;
  console.log(allOk ? "\nAll checks passed." : "\nSome checks failed.");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
