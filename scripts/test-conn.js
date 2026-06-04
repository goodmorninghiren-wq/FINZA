const { Client } = require('pg');

const regions = [
    'ap-south-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
    'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
    'eu-north-1', 'sa-east-1'
];

async function testRegions() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`Testing region ${region} with host ${host}...`);
        const client = new Client({
            user: 'postgres.odbzxjnqgxmmffxaxoup',
            password: 'Hiren@123!@#',
            host: host,
            port: 6543,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
        });

        try {
            await client.connect();
            console.log(`\nSUCCESS connected to ${region}!`);
            const res = await client.query('SELECT version();');
            console.log('Postgres version:', res.rows[0].version);
            await client.end();
            return region; // Found it!
        } catch (err) {
            console.log(`Failed to connect to ${region}:`, err.message);
        }
    }
    console.log('\nCould not connect to any region.');
}

testRegions();
