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
  const { data, error } = await supabase.from('linkedin_prospects').select('name, screenshot_date');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Prospect dates:', data);
  }
}

run();
