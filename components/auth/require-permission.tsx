// components/auth/require-permission.tsx
'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'

interface RequirePermissionProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequirePermission({ 
  permission, 
  children, 
  fallback = <div>Access denied</div> 
}: RequirePermissionProps) {
  const { checkPermission, loading } = usePermissions()
  const { loading: authLoading } = useAuth()

  if (loading || authLoading) {
    return <div>Loading...</div>
  }

  if (!checkPermission(permission as any)) {
    return fallback
  }

  return <>{children}</>
}