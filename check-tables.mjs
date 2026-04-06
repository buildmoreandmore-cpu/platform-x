import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } });

const tables = ['tenants', 'tenant_users', 'profiles', 'projects', 'organizations', 'assets', 'contact_submissions'];
for (const t of tables) {
  const { error } = await s.from(t).select('*').limit(1);
  console.log(`${t}: ${error ? 'MISSING - ' + error.message : 'EXISTS'}`);
}
