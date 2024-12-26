// lib/constants/roles.ts
export const ROLE_NAMES = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    USER: 'User',
    VIEWER: 'Viewer'
  } as const;
  
  export const ROLE_TYPES = {
    PRIMARY: 'primary',
    AGENCY: 'agency'
  } as const;
  
  export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];
  export type RoleType = typeof ROLE_TYPES[keyof typeof ROLE_TYPES];