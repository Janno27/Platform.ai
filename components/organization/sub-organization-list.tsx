// components/organization/sub-organization-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Plus, ExternalLink } from "lucide-react"
import { usePermissions } from '@/hooks/usePermissions'
import { AddSubOrgDialog } from './dialogs/add-sub-org-dialog'
import { SubOrganization } from './types'

export function SubOrganizationList() {
  const [organizations, setOrganizations] = useState<SubOrganization[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const { hasPermission } = usePermissions()
  const canManageOrgs = hasPermission('organization_management')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Organization accounts</h2>
        {canManageOrgs && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        )}
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-lg border bg-card">
        <div className="flex space-x-4 p-4">
          {organizations.map((org) => (
            <Card key={org.id} className="flex-shrink-0 w-[200px] shadow-none">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium truncate">{org.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {org.userCount} users
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/settings/organization/${org.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <AddSubOrgDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          setAddDialogOpen(false)
          // TODO: Recharger la liste
        }}
      />
    </div>
  )
}