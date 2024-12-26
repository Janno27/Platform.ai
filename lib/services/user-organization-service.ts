// lib/services/user-organization-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export const ROLE_NAMES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  USER: 'User',
  VIEWER: 'Viewer'
} as const

const getRoleNameFromSlug = (slug: string): string => {
  const roleMap: { [key: string]: string } = {
    'super-admin': ROLE_NAMES.SUPER_ADMIN,
    'admin': ROLE_NAMES.ADMIN,
    'user': ROLE_NAMES.USER,
    'viewer': ROLE_NAMES.VIEWER
  }
  return roleMap[slug.toLowerCase()] || slug
}

export interface OrganizationUser {
  id: string
  name: string | null
  email: string | null
  role: string
  status: 'active' | 'invited' | 'disabled'
  created_at: string
}

export const UserOrganizationService = {
  async getUsersByRole(organizationId: string, roleSlug: string) {
    const supabase = createClientComponentClient<Database>()

    try {
      const roleName = getRoleNameFromSlug(roleSlug)
      console.log('Fetching users for organization:', organizationId, 'and role:', roleName)

      // Récupérer le rôle
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .is('organization_id', null)
        .single()

      if (roleError) {
        console.error('Error fetching role:', roleError)
        return []
      }

      // Faire une jointure manuelle
      const { data: users, error: usersError } = await supabase
        .from('organization_users')
        .select(`
          id,
          user_id,
          status,
          created_at
        `)
        .eq('organization_id', organizationId)
        .eq('role_id', role.id)

      if (usersError) {
        console.error('Error fetching organization users:', usersError)
        return []
      }

      if (!users || users.length === 0) {
        return []
      }

      // Récupérer les profils séparément
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', users.map(u => u.user_id))

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return []
      }

      // Combiner les données manuellement
      return users.map(user => {
        const profile = profiles?.find(p => p.id === user.user_id)
        return {
          id: user.user_id,
          name: profile?.name || 'Unnamed User',
          email: profile?.email || 'No Email',
          role: roleName,
          status: user.status,
          created_at: user.created_at
        }
      })

    } catch (error) {
      console.error('Error in getUsersByRole:', error)
      return []
    }
  },

  async inviteUser(email: string, organizationId: string, roleName: string) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      // 1. Récupérer l'ID du rôle
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .is('organization_id', null)
        .single()

      if (roleError) throw roleError

      // 2. Vérifier si l'utilisateur existe déjà dans auth.users
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (userError && userError.code !== 'PGRST116') {  // PGRST116 = not found
        throw userError
      }

      if (existingUser) {
        // 3a. Si l'utilisateur existe, l'ajouter à l'organisation
        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            user_id: existingUser.id,
            organization_id: organizationId,
            role_id: roleData.id,
            status: 'active'
          })

        if (orgUserError) throw orgUserError
      } else {
        // 3b. Si l'utilisateur n'existe pas, créer une invitation
        const { error: inviteError } = await supabase
          .from('invitations')
          .insert({
            email,
            organization_id: organizationId,
            role_id: roleData.id,
            invited_by: (await supabase.auth.getUser()).data.user?.id,
            token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()  // 7 jours
          })

        if (inviteError) throw inviteError
      }

      return true
    } catch (error) {
      console.error('Error in inviteUser:', error)
      throw error
    }
  },

  async updateUserRole(userId: string, organizationId: string, newRoleName: string) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      // 1. Récupérer l'ID du nouveau rôle
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', newRoleName)
        .is('organization_id', null)
        .single()

      if (roleError) throw roleError

      // 2. Mettre à jour le rôle de l'utilisateur
      const { error: updateError } = await supabase
        .from('organization_users')
        .update({ role_id: roleData.id })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)

      if (updateError) throw updateError

      return true
    } catch (error) {
      console.error('Error in updateUserRole:', error)
      throw error
    }
  }
}