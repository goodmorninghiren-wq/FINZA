// Push full schema to Supabase using the REST API via node-fetch approach
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://odbzxjnqgxmmffxaxoup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYnp4am5xZ3htbWZmeGF4b3VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwMTI5NCwiZXhwIjoyMDk2MDc3Mjk0fQ.0cjYYTjetGS9ZRNf9hi0atxXfUPnuAujU-5YIVkgfJg';

const sql = fs.readFileSync(path.join(__dirname, '..', 'full_schema.sql'), 'utf8');

function runSQL(sqlQuery) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sqlQuery });
        const options = {
            hostname: 'odbzxjnqgxmmffxaxoup.supabase.co',
            port: 443,
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('Attempting to push schema via Supabase RPC...');
    try {
        const result = await runSQL(sql);
        console.log('Status:', result.status);
        console.log('Response:', result.body.substring(0, 500));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
