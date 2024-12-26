// components/organization/users-list.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, UserCog, UserX } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { OrganizationUser } from './types'
import { usePermissions } from '@/hooks/usePermissions'

interface UsersListProps {
  filters?: string[]
}

export function UsersList({ filters = [] }: UsersListProps) {
  const [users, setUsers] = useState<OrganizationUser[]>([])
  const { hasPermission } = usePermissions()
  const canManageUsers = hasPermission('user_management')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700'
      case 'inactive': return 'bg-red-500/10 text-red-700'
      case 'pending': return 'bg-yellow-500/10 text-yellow-700'
      default: return 'bg-gray-500/10 text-gray-700'
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Connection</TableHead>
            {canManageUsers && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge className={cn("capitalize", getStatusColor(user.status))}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>
                {user.last_connection 
                  ? formatDistanceToNow(new Date(user.last_connection), { addSuffix: true })
                  : 'Never'
                }
              </TableCell>
              {canManageUsers && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <UserCog className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <UserX className="mr-2 h-4 w-4" />
                        Remove User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}