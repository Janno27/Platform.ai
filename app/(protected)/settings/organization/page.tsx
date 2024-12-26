// app/(protected)/settings/organization/page.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/hooks/useOrganization'
import { SubOrganizationList } from '@/components/organization/sub-organization-list'
import { UsersList } from '@/components/organization/users-list'
import { AdminsList } from '@/components/organization/admins-list'
import { UsersStats } from '@/components/organization/users-stats'
import { PendingUsers } from '@/components/organization/pending-users'
import { AddUserDialog } from '@/components/organization/dialogs/add-user-dialog'
import { AddAdminDialog } from '@/components/organization/dialogs/add-admin-dialog'

export default function OrganizationManagementPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addAdminOpen, setAddAdminOpen] = useState(false)
  const [filters, setFilters] = useState<string[]>([])
  const { hasPermission } = usePermissions()
  const { organization } = useOrganization()
  const isAdminOrHigher = hasPermission('admin_management')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">Organization Management</h1>
        <Badge variant="secondary" className="h-6">
          {organization?.name}
        </Badge>
      </div>

      <SubOrganizationList />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            {isAdminOrHigher && (
              <TabsTrigger value="admins">Admins</TabsTrigger>
            )}
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => activeTab === 'admins' ? setAddAdminOpen(true) : setAddUserOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === 'admins' ? 'Admin' : 'User'}
          </Button>
        </div>

        <TabsContent value="users" className="space-y-6 mt-6">
          {isAdminOrHigher && (
            <PendingUsers 
              onAccept={(userId) => {/* TODO */}}
              onReject={(userId) => {/* TODO */}}
            />
          )}

          <UsersStats
            onFilterChange={setFilters}
            activeFilters={filters}
          />

          <UsersList filters={filters} />
        </TabsContent>

        {isAdminOrHigher && (
          <TabsContent value="admins" className="mt-6">
            <AdminsList />
          </TabsContent>
        )}
      </Tabs>

      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          setAddUserOpen(false)
          // TODO: Recharger la liste
        }}
      />

      <AddAdminDialog
        open={addAdminOpen}
        onOpenChange={setAddAdminOpen}
        onSuccess={() => {
          setAddAdminOpen(false)
          // TODO: Recharger la liste
        }}
      />
    </div>
  )
}