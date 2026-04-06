import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAIL = 'admin@vantageinfrastructure.com';
const PASSWORD = 'Vantage2026!';

async function seed() {
  console.log('Creating Vantage tenant...');

  // 1. Create tenant
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .upsert({
      name: 'Vantage Infrastructure Group',
      slug: 'vantage',
      primary_color: '#C9A84C',
      secondary_color: '#A68B3A',
      plan: 'enterprise',
      is_active: true,
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (tenantErr) {
    console.error('Tenant error:', tenantErr);
    process.exit(1);
  }
  console.log('Tenant created:', tenant.id, tenant.name);

  // 2. Create auth user (or get existing)
  console.log(`Creating user ${EMAIL}...`);
  let userId;

  // Try to create new user
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (createErr) {
    if (createErr.message?.includes('already been registered')) {
      // User exists — look up by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users.find(u => u.email === EMAIL);
      if (!existing) {
        console.error('User exists but could not be found');
        process.exit(1);
      }
      userId = existing.id;
      console.log('User already exists:', userId);

      // Update password
      await supabase.auth.admin.updateUserById(userId, { password: PASSWORD });
      console.log('Password updated.');
    } else {
      console.error('User create error:', createErr);
      process.exit(1);
    }
  } else {
    userId = newUser.user.id;
    console.log('User created:', userId);
  }

  // 3. Create profile
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: 'Admin',
      initials: 'VA',
      email: EMAIL,
      default_role: 'Admin',
      project_roles: {},
      tenant_id: tenant.id,
    }, { onConflict: 'id' });

  if (profileErr) console.error('Profile error:', profileErr);
  else console.log('Profile created.');

  // 4. Link user to tenant as owner
  const { error: linkErr } = await supabase
    .from('tenant_users')
    .upsert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner',
    }, { onConflict: 'tenant_id,user_id' });

  if (linkErr) console.error('Tenant link error:', linkErr);
  else console.log('User linked to tenant as owner.');

  console.log('\n✅ Done! Login credentials:');
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
  console.log('   Works for both Engineer Login and Client Portal.');
}

seed().catch(console.error);
