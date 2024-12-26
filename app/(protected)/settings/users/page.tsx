// app/(protected)/settings/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { RoleService } from '@/lib/services/role-service'
import { toast } from 'sonner'

export default function UsersManagementPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const { organization } = useOrganization()
  
  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <RoleSelect 
          userId={row.original.id}
          currentRole={row.original.role}
          roles={roles}
          onRoleChange={handleRoleChange}
        />
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          onClick={() => handleUserDelete(row.original.id)}
        >
          Remove
        </Button>
      )
    }
  ]

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await RoleService.assignRole(userId, organization.id, roleId)
      toast.success('Role updated successfully')
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>
            Manage users and their roles in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
          />
        </CardContent>
      </Card>
    </div>
  )
}