export type Role = 'super_admin' | 'admin' | 'user' | 'viewer';

export interface Permission {
  organization_management: boolean
  subsidiary_management: boolean
  user_management: boolean
  test_management: boolean
  settings_management: boolean
  all_subsidiaries_access: boolean
  super_admin?: boolean
  admin?: boolean
  viewer?: boolean
} 