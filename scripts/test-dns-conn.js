const { Client } = require('pg');

const dbConfig = {
    user: 'postgres',
    password: 'Hiren@123!@#',
    host: '2406:da1c:61c:d601:110:ca93:a995:f66',
    port: 5432,
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
};

async function test() {
    console.log('Attempting connection directly to IPv6 address...');
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT version();');
        console.log(res.rows[0]);
        await client.end();
    } catch (connectErr) {
        console.error('Connection error:', connectErr);
    }
}

test();
