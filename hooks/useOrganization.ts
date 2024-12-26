// hooks/useOrganization.ts
"use client"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from './useAuth'

interface Organization {
  id: string
  name: string
  user_account_type: 'individual' | 'business'
  parent_organization_id?: string
}

interface OrganizationState {
 organization: Organization | null
 loading: boolean
 error: Error | null
}

export function useOrganization() {
  const [state, setState] = useState<OrganizationState>({
    organization: null,
    loading: true,
    error: null,
  })
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadOrganization = async () => {
      if (!user) {
        setState(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        // Utiliser une seule requête avec left join
        const { data, error } = await supabase
          .from('organization_users')
          .select(`
            organization_id,
            organization:organization_id (
              id,
              name,
              user_account_type,
              parent_organization_id,
              subscription_tier
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)

        if (error) throw error

        setState({
          organization: data?.[0]?.organization || null,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error loading organization:', error)
        setState({
          organization: null,
          loading: false,
          error: error as Error
        })
      }
    }

    loadOrganization()
  }, [user])

  return state
}