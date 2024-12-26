// hooks/usePermissions.ts
import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'

export function usePermissions() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { organization } = useOrganization()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user || !organization?.id) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('organization_users')
          .select(`
            roles (
              name,
              permissions
            )
          `)
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .single()

        setPermissions(data?.roles?.permissions || {})
      } catch (error) {
        console.error('Error loading permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [user, organization?.id, supabase])

  const hasPermission = useCallback((permission: string): boolean => {
    return Boolean(permissions[permission])
  }, [permissions])

  const checkPermission = useCallback((permission: string): boolean => {
    return Boolean(permissions[permission])
  }, [permissions])

  return { 
    permissions, 
    loading, 
    hasPermission,
    checkPermission 
  }
}