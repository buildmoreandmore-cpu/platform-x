import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method

  // ── GET — list all users with contract access ──
  if (method === 'GET') {
    try {
      const [profilesResult, accessResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('contract_access')
          .select('*'),
      ])

      if (profilesResult.error) {
        return res.status(500).json({ error: profilesResult.error.message })
      }

      const profiles = profilesResult.data || []
      const accessRecords = accessResult.data || []

      // Attach contract_access arrays to each profile
      const users = profiles.map((p: any) => ({
        ...p,
        contract_access: accessRecords.filter((a: any) => a.user_id === p.id),
      }))

      return res.status(200).json({ users })
    } catch (err: any) {
      console.error('[admin-users] GET error:', err)
      return res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }

  // ── POST — create a new user ──
  if (method === 'POST') {
    try {
      const { email, password, full_name, role, organization, credentials, contract_ids } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' })
      }

      if (!role || !['admin', 'client', 'cmvp'].includes(role)) {
        return res.status(400).json({ error: 'role must be admin, client, or cmvp' })
      }

      // 1. Create auth user via Supabase admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError) {
        return res.status(400).json({ error: authError.message })
      }

      const userId = authData.user.id

      // 2. Insert profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: full_name || null,
          role,
          organization: organization || null,
          credentials: credentials || null,
          is_active: true,
        })

      if (profileError) {
        console.error('[admin-users] Profile insert error:', profileError)
        // Attempt to clean up the auth user
        await supabase.auth.admin.deleteUser(userId)
        return res.status(500).json({ error: 'Failed to create profile', detail: profileError.message })
      }

      // 3. Insert contract_access records if provided
      if (contract_ids && Array.isArray(contract_ids) && contract_ids.length > 0) {
        const accessRows = contract_ids.map((cid: string) => ({
          user_id: userId,
          contract_id: cid,
        }))

        const { error: accessError } = await supabase
          .from('contract_access')
          .insert(accessRows)

        if (accessError) {
          console.error('[admin-users] Contract access insert error:', accessError)
          // Non-fatal — user was created, access can be granted later
        }
      }

      // 4. Return created user with access
      const { data: createdProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data: createdAccess } = await supabase
        .from('contract_access')
        .select('*')
        .eq('user_id', userId)

      return res.status(201).json({
        user: {
          ...createdProfile,
          contract_access: createdAccess || [],
        },
      })
    } catch (err: any) {
      console.error('[admin-users] POST error:', err)
      return res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }

  // ── PATCH — update user (toggle active, change role, grant/revoke access) ──
  if (method === 'PATCH') {
    try {
      const { user_id, action, role, contract_id } = req.body

      if (!user_id || !action) {
        return res.status(400).json({ error: 'user_id and action are required' })
      }

      switch (action) {
        case 'toggle_active': {
          // Fetch current state
          const { data: profile, error: fetchErr } = await supabase
            .from('profiles')
            .select('is_active')
            .eq('id', user_id)
            .single()

          if (fetchErr || !profile) {
            return res.status(404).json({ error: 'User not found' })
          }

          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ is_active: !profile.is_active })
            .eq('id', user_id)

          if (updateErr) {
            return res.status(500).json({ error: updateErr.message })
          }

          return res.status(200).json({ success: true, is_active: !profile.is_active })
        }

        case 'update_role': {
          if (!role || !['admin', 'client', 'cmvp'].includes(role)) {
            return res.status(400).json({ error: 'role must be admin, client, or cmvp' })
          }

          const { error: roleErr } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', user_id)

          if (roleErr) {
            return res.status(500).json({ error: roleErr.message })
          }

          return res.status(200).json({ success: true, role })
        }

        case 'grant_access': {
          if (!contract_id) {
            return res.status(400).json({ error: 'contract_id is required for grant_access' })
          }

          const { error: grantErr } = await supabase
            .from('contract_access')
            .upsert({ user_id, contract_id }, { onConflict: 'user_id,contract_id' })

          if (grantErr) {
            return res.status(500).json({ error: grantErr.message })
          }

          return res.status(200).json({ success: true })
        }

        case 'revoke_access': {
          if (!contract_id) {
            return res.status(400).json({ error: 'contract_id is required for revoke_access' })
          }

          const { error: revokeErr } = await supabase
            .from('contract_access')
            .delete()
            .eq('user_id', user_id)
            .eq('contract_id', contract_id)

          if (revokeErr) {
            return res.status(500).json({ error: revokeErr.message })
          }

          return res.status(200).json({ success: true })
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (err: any) {
      console.error('[admin-users] PATCH error:', err)
      return res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
