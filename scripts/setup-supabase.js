const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Database configuration object to avoid URL parsing issues with special characters in password
const dbConfig = {
    user: 'postgres',
    password: 'Hiren@123!@#',
    host: 'db.odbzxjnqgxmmffxaxoup.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
};

// Supabase details
const supabaseUrl = "https://odbzxjnqgxmmffxaxoup.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYnp4am5xZ3htbWZmeGF4b3VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwMTI5NCwiZXhwIjoyMDk2MDc3Mjk0fQ.0cjYYTjetGS9ZRNf9hi0atxXfUPnuAujU-5YIVkgfJg";

async function run() {
    console.log('Connecting to PostgreSQL database...');
    const client = new Client(dbConfig);
    await client.connect();
    console.log('Connected successfully!');

    try {
        // 1. Read and execute supabase_schema.sql
        console.log('Executing supabase_schema.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase_schema.sql'), 'utf8');
        await client.query(schemaSql);
        console.log('supabase_schema.sql executed successfully.');

        // 2. Read and execute supabase_migration_bank_entries.sql
        console.log('Executing supabase_migration_bank_entries.sql...');
        const migrationSql = fs.readFileSync(path.join(__dirname, '../supabase_migration_bank_entries.sql'), 'utf8');
        await client.query(migrationSql);
        console.log('supabase_migration_bank_entries.sql executed successfully.');

        // 3. Read and execute setup_company_schema.sql
        console.log('Executing setup_company_schema.sql...');
        const companySql = fs.readFileSync(path.join(__dirname, '../setup_company_schema.sql'), 'utf8');
        await client.query(companySql);
        console.log('setup_company_schema.sql executed successfully.');

    } catch (err) {
        console.error('Error running SQL scripts:', err);
    } finally {
        await client.end();
    }

    console.log('Initializing Supabase Admin Client to create a user...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = 'admin@finza.com';
    const password = 'Finza@123!';

    console.log(`Creating/getting user: ${email}...`);
    try {
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = userList.users.find(u => u.email === email);
        if (existingUser) {
            console.log(`User ${email} already exists.`);
        } else {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });
            if (createError) throw createError;
            console.log(`Successfully created user: ${email} with password: ${password}`);
        }
    } catch (err) {
        console.error('Error creating user via Supabase Auth Admin API:', err);
    }
}

run();
