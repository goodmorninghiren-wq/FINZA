/**
 * Tests Supabase password auth the same way the app does.
 * Usage: node scripts/test-auth-login.js your@email.com yourpassword
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

function postAuth(email, password, rejectUnauthorized) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const body = JSON.stringify({ email, password });
  const url = new URL(`${base}/auth/v1/token?grant_type=password`);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        rejectUnauthorized,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, text });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  loadEnv();
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.log("Usage: node scripts/test-auth-login.js email password");
    process.exit(1);
  }

  console.log("Project:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  for (const mode of [
    { label: "strict SSL", rejectUnauthorized: true },
    { label: "relaxed SSL (dev fix)", rejectUnauthorized: false },
  ]) {
    try {
      const { status, text } = await postAuth(email, password, mode.rejectUnauthorized);
      console.log(`\n[${mode.label}] HTTP ${status}`);
      if (!text.trim()) {
        console.log("  Body: (empty) ← causes login JSON error");
      } else {
        try {
          const j = JSON.parse(text);
          if (j.access_token) console.log("  OK — got access_token");
          else if (j.error_description) console.log("  Auth:", j.error_description);
          else console.log("  Body:", text.slice(0, 200));
        } catch {
          console.log("  Body (not JSON):", text.slice(0, 120));
        }
      }
    } catch (e) {
      console.log(`\n[${mode.label}] FAIL:`, e.message);
    }
  }
}

main();
