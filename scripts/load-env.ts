import * as fs from 'fs';
import * as path from 'path';

// Read env variables immediately on import
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}
process.env.CRM_TEST_MODE = 'true';
