// components/organization/user-table.tsx
'use client'

import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { OrganizationUser } from "@/lib/services/user-organization-service"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'

interface UserTableProps {
  data: OrganizationUser[]
  onStatusChange?: (userId: string, status: 'active' | 'invited' | 'disabled') => void
  onRoleChange?: (userId: string, newRoleId: string) => void
}

export function UserTable({ data, onStatusChange, onRoleChange }: UserTableProps) {
  const columns: ColumnDef<OrganizationUser>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={
            status === 'active' ? 'success' :
            status === 'invited' ? 'warning' :
            'destructive'
          }>
            {status}
          </Badge>
        )
      }
    },
    {
      accessorKey: "last_login",
      header: "Last Active",
      cell: ({ row }) => {
        const date = row.getValue("last_login") as string
        return date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : 'Never'
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onStatusChange && (
                <>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(user.id, 'active')}
                  >
                    Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(user.id, 'disabled')}
                  >
                    Disable
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return <DataTable columns={columns} data={data} />
}