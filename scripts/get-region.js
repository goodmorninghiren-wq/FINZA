const https = require('https');

const options = {
    hostname: 'odbzxjnqgxmmffxaxoup.supabase.co',
    port: 443,
    path: '/rest/v1/',
    method: 'GET',
    rejectUnauthorized: false, // Bypass SSL certificate issue if any
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYnp4am5xZ3htbWZmeGF4b3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDEyOTQsImV4cCI6MjA5NjA3NzI5NH0.zrBHxFpYgha8lOoCXM9lFFsJqwqz_q9Rqt2JVxKhn2E'
    }
};

const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error(e);
});
req.end();
