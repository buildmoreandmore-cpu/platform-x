import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    // Create client_invites table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.client_invites (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id text NOT NULL,
          client_name text NOT NULL,
          client_email text NOT NULL,
          invite_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
          invited_by text NOT NULL,
          created_at timestamptz DEFAULT now(),
          accepted_at timestamptz
        );
        
        ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Service role full access" ON public.client_invites FOR ALL USING (true);
        
        -- Also create profiles table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.profiles (
          id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          name text,
          role text DEFAULT 'Client' CHECK (role IN ('Engineer', 'Project Lead', 'Admin', 'Client')),
          created_at timestamptz DEFAULT now(),
          PRIMARY KEY (id)
        );
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
        CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
        CREATE POLICY IF NOT EXISTS "Service role full access profiles" ON public.profiles FOR ALL USING (true);
      `
    });

    if (error) {
      console.error('Database setup error:', error);
    } else {
      console.log('Database setup completed successfully!');
    }
  } catch (err) {
    console.error('Setup failed:', err);
  }
}

setupDatabase();