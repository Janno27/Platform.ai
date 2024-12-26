// app/(protected)/settings/organization/[role]/role-content.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { UserOrganizationService } from '@/lib/services/user-organization-service'
import { AddUserDialog } from '@/components/organization/add-user-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { toast } from 'sonner'

interface RoleContentProps {
  role: string
}

export default function RoleContent({ role }: RoleContentProps) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const { organization } = useOrganization()

  useEffect(() => {
    loadUsers()
  }, [organization?.id, role])

  const loadUsers = async () => {
    if (organization?.id) {
      setLoading(true)
      try {
        const data = await UserOrganizationService.getUsersByRole(organization.id, role)
        setUsers(data)
      } catch (error) {
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleUserAdded = () => {
    loadUsers()
    setIsAddUserOpen(false)
    toast.success('User added successfully')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{role} Management</h2>
        <Button 
          onClick={() => setIsAddUserOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add {role}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{role} Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns}
            data={users}
            loading={loading}
          />
        </CardContent>
      </Card>

      <AddUserDialog 
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onUserAdded={handleUserAdded}
        role={role}
      />
    </div>
  )
}