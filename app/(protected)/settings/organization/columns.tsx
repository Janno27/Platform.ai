// app/(protected)/settings/organization/[role]/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserX, UserCog, Mail } from "lucide-react"
import { formatDistance } from 'date-fns'

export type UserOrganization = {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'invited' | 'disabled'
  created_at: string
}

export const columns: ColumnDef<UserOrganization>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === 'active' ? 'success' : status === 'invited' ? 'warning' : 'destructive'}>
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => {
      return formatDistance(new Date(row.getValue("created_at")), new Date(), { addSuffix: true })
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
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCog className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
            {user.status === 'invited' && (
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Resend Invitation
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-red-600">
              <UserX className="mr-2 h-4 w-4" />
              Remove User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]