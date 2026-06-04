const fs = require('fs');
const path = require('path');

const files = [
    'supabase_schema.sql',
    'supabase_migration_bank_entries.sql',
    'setup_company_schema.sql'
];

let combined = '';
for (const file of files) {
    combined += `-- ==========================================================\n`;
    combined += `-- FILE: ${file}\n`;
    combined += `-- ==========================================================\n\n`;
    combined += fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    combined += '\n\n';
}

fs.writeFileSync(path.join(__dirname, '..', 'combined_schema.sql'), combined, 'utf8');
console.log('Successfully created combined_schema.sql!');
