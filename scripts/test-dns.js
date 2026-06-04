const dns = require('dns');
const { Client } = require('pg');

// Force Node.js to use Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const SUPABASE_URL = 'https://odbzxjnqgxmmffxaxoup.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYnp4am5xZ3htbWZmeGF4b3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDEyOTQsImV4cCI6MjA5NjA3NzI5NH0.zrBHxFpYgha8lOoCXM9lFFsJqwqz_q9Rqt2JVxKhn2E';
const DB_URL = 'postgresql://postgres:Hiren%40123%21%40%23@db.odbzxjnqgxmmffxaxoup.supabase.co:5432/postgres';

async function testRest() {
  console.log('Testing REST API with Google DNS...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: ANON_KEY }
    });
    console.log(`REST Status: ${res.status}`);
    const text = await res.text();
    console.log(`REST Response preview: ${text.slice(0, 200)}`);
  } catch (err) {
    console.error('REST Error:', err);
  }
}

async function testPostgres() {
  console.log('Testing Postgres Connection with Google DNS...');
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const { rows } = await client.query('SELECT version();');
    console.log('Postgres connection SUCCESS! Database version:', rows[0].version);
    await client.end();
  } catch (err) {
    console.error('Postgres Error:', err);
  }
}

async function run() {
  await testRest();
  console.log('\n--------------------\n');
  await testPostgres();
}

run();
