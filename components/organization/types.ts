// components/organization/types.ts
export type UserRole = 'Super Admin' | 'Admin' | 'User' | 'Viewer'
export type UserStatus = 'active' | 'pending' | 'inactive'

export interface OrganizationUser {
  id: string
  name: string | null
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  last_connection?: string
  organization_id: string
  metadata?: Record<string, any>
}

export interface SubOrganization {
  id: string
  name: string
  userCount: number
  parentOrganizationId?: string
}

export interface UsersStats {
  viewer: number
  user: number
  admin: number
  superAdmin: number
  inactive: number
  pending: number
}

export interface OrganizationProps {
  organizationId: string
}