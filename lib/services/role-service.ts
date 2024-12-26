// lib/services/role-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Role, Permission } from '@/types/role'

export const RoleService = {
  async getAllRoles(type?: 'primary' | 'subsidiary') {
    const supabase = createClientComponentClient()
    
    const query = supabase
      .from('roles')
      .select('*')
    
    if (type) {
      query.eq('type', type)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data as Role[]
  },

  async getUserRoles(userId: string) {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('organization_users')
      .select(`
        organization_id,
        roles (
          id,
          name,
          type,
          permissions
        ),
        organizations (
          id,
          name,
          type
        )
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data
  },

  async hasPermission(
    userId: string, 
    organizationId: string, 
    permission: keyof Permission
  ): Promise<boolean> {
    try {
      const supabase = createClientComponentClient()
      
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          roles (
            permissions
          )
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single()

      if (error) throw error
      
      return data?.roles?.permissions?.[permission] || false
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  },

  async assignRole(userId: string, organizationId: string, roleId: string) {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('organization_users')
      .update({ role_id: roleId })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (error) throw error
    return data
  }
}