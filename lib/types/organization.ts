export interface OrganizationUser {
    id: string
    name: string | null
    email: string | null
    role: string
    status: 'active' | 'invited' | 'disabled'
    created_at: string
  }
  
  export interface Role {
    id: string
    name: string
    type: 'primary' | 'subsidiary'
    permissions: Record<string, boolean>
  }
  
  export interface Organization {
    id: string
    name: string
    type: string
    parent_organization_id?: string
    subscription_tier?: string
  }

  export interface OrganizationData {
    hasOrganization: boolean
    organizationName?: string
    accountType: 'individual' | 'business'
  }
  
  export interface OrganizationLimit {
    super_admin_limit: number
    admin_limit: number
    user_limit: number
    viewer_limit: number
  }