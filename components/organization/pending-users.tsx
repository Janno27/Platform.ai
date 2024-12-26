'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { OrganizationUser } from './types'

interface PendingUsersProps {
  onAccept: (userId: string) => void
  onReject: (userId: string) => void
}

export function PendingUsers({ onAccept, onReject }: PendingUsersProps) {
  const [pendingUsers, setPendingUsers] = useState<OrganizationUser[]>([])
  const [loading, setLoading] = useState(false)

  if (pendingUsers.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Pending Invitations
          <Badge variant="secondary" className="ml-2">
            {pendingUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <div className="font-medium">{user.name || user.email}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-600"
                  onClick={() => onReject(user.id)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-600"
                  onClick={() => onAccept(user.id)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
