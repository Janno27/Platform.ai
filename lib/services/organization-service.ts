// lib/services/organization-service.ts
import { supabase } from '@/lib/supabase'
import { UsersStats, OrganizationUser } from '@/components/organization/types'

interface Organization {
  id: string
  name: string
  type: 'primary' | 'subsidiary'
  user_account_type: 'individual' | 'business'
  created_at: string
}

export const OrganizationService = {
  async getUserStats(organizationId: string): Promise<UsersStats> {
    const supabase = createClientComponentClient()
    
    const { data: users, error } = await supabase
      .from('organization_users')
      .select(`
        status,
        role:role_id (
          name
        )
      `)
      .eq('organization_id', organizationId)

    if (error) throw error

    const stats = {
      viewer: 0,
      user: 0,
      admin: 0,
      superAdmin: 0,
      inactive: 0,
      pending: 0
    }

    users?.forEach(user => {
      const roleName = user.role?.name
      if (roleName === 'Viewer') stats.viewer++
      else if (roleName === 'User') stats.user++
      else if (roleName === 'Admin') stats.admin++
      else if (roleName === 'Super Admin') stats.superAdmin++

      if (user.status === 'inactive') stats.inactive++
      if (user.status === 'pending') stats.pending++
    })

    return stats
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Organization
  },

  async update(id: string, updates: Partial<Organization>) {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  async getUserStats(organizationId: string): Promise<UsersStats> {
    const { data: users, error } = await supabase
      .from('organization_users')
      .select(`
        id,
        status,
        role_id,
        roles!inner (
          name
        )
      `)
      .eq('organization_id', organizationId)
  
    if (error) {
      console.error('Error fetching stats:', error)
      throw error
    }
  
    const stats: UsersStats = {
      viewer: 0,
      user: 0,
      admin: 0,
      superAdmin: 0,
      inactive: 0,
      pending: 0
    }
  
    users?.forEach(user => {
      const roleName = user.roles?.name
      console.log('Processing user with role:', roleName, 'and status:', user.status)
      
      // Compte par rôle
      if (roleName === 'Viewer') stats.viewer++
      if (roleName === 'User') stats.user++
      if (roleName === 'Admin') stats.admin++
      if (roleName === 'Super Admin') stats.superAdmin++
      
      // Compte par statut
      if (user.status === 'inactive') stats.inactive++
      if (user.status === 'pending') stats.pending++
    })
  
    console.log('Final stats:', stats)
    return stats
  },
  async getUsers(organizationId: string, filters: string[] = []): Promise<OrganizationUser[]> {
    const supabase = createClientComponentClient()
    
    let query = supabase
      .from('organization_users')
      .select(`
        *,
        profile:user_id (
          name,
          email
        ),
        role:role_id (
          name
        )
      `)
      .eq('organization_id', organizationId)

    if (filters.length > 0) {
      if (filters.includes('inactive')) query = query.eq('status', 'inactive')
      if (filters.includes('pending')) query = query.eq('status', 'pending')
    }

    const { data, error } = await query
    if (error) throw error

    return data.map(user => ({
      id: user.user_id,
      name: user.profile?.name || 'Unknown',
      email: user.profile?.email || '',
      role: user.role?.name || 'Unknown',
      status: user.status,
      created_at: user.created_at,
      organization_id: user.organization_id
    }))
  }
}