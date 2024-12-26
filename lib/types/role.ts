// types/role.ts
export interface Permission {
    organization_management: boolean
    subsidiary_management?: boolean
    user_management: boolean
    test_management: boolean
    settings_management: boolean
    all_subsidiaries_access?: boolean
  }
  
  export interface Role {
    id: string
    name: string
    type: 'primary' | 'subsidiary'
    permissions: Permission
    created_at: string
  }
  
  export type RoleName = 
    | 'Super Admin'
    | 'Admin'
    | 'Manager'
    | 'Collaborator'
    | 'Viewer'