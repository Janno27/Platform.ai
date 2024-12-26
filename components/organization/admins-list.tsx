// components/organization/admins-list.tsx
'use client'

import { UsersList } from './users-list'

export function AdminsList() {
  return <UsersList filters={['admin', 'superAdmin']} />
}