const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://odbzxjnqgxmmffxaxoup.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYnp4am5xZ3htbWZmeGF4b3VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwMTI5NCwiZXhwIjoyMDk2MDc3Mjk0fQ.0cjYYTjetGS9ZRNf9hi0atxXfUPnuAujU-5YIVkgfJg";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    const email = 'admin@finza.com';
    const password = 'Finza@123!';
    
    console.log(`Attempting to create user ${email} via Supabase Auth Admin API...`);
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Success! User details:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

run();
