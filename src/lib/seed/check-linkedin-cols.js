const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'linkedin_prospects';"
  });
  if (error) {
    console.error('Error fetching columns:', error);
  } else {
    console.log('Prospect table columns:', data);
  }
}

run();
