// app/(protected)/settings/organization/[role]/client-page.tsx
'use client'

import RoleContent from '../role-content'
import { useOrganization } from '@/hooks/useOrganization'
import { ROLE_NAMES } from '@/lib/services/user-organization-service'

interface ClientRolePageProps {
  role: string
}

export default function ClientRolePage({ role }: ClientRolePageProps) {
  const { organization } = useOrganization()

  // Convertir le rôle en titre propre pour l'affichage
  const displayRole = role.toLowerCase() === 'super-admin' 
    ? ROLE_NAMES.SUPER_ADMIN 
    : role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <>
      <RoleContent role={displayRole} />
    </>
  )
}