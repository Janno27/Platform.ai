'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { UsersStats as Stats } from './types'
import { OrganizationService } from '@/lib/services/organization-service'
import { useOrganization } from '@/hooks/useOrganization'

interface UsersStatsProps {
  onFilterChange: (filters: string[]) => void
  activeFilters: string[]
}

export function UsersStats({ onFilterChange, activeFilters }: UsersStatsProps) {
  const [stats, setStats] = useState<Stats>({
    viewer: 0,
    user: 0,
    admin: 0,
    superAdmin: 0,
    inactive: 0,
    pending: 0
  })
  const { organization } = useOrganization()

  useEffect(() => {
    if (organization?.id) {
      console.log('Fetching stats for organization:', organization.id)
      OrganizationService.getUserStats(organization.id)
        .then(newStats => {
          console.log('Received stats:', newStats)
          setStats(newStats)
        })
        .catch(error => {
          console.error('Failed to fetch stats:', error)
        })
    }
  }, [organization?.id])

  const toggleFilter = (filter: string) => {
    onFilterChange(
      activeFilters.includes(filter)
        ? activeFilters.filter(f => f !== filter)
        : [...activeFilters, filter]
    )
  }

  return (
    <Card className="bg-card/50 border-none shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-6 gap-6">
          <StatItem
            label="Viewers"
            count={stats.viewer}
            active={activeFilters.includes('viewer')}
            onClick={() => toggleFilter('viewer')}
          />
          <StatItem
            label="Users"
            count={stats.user}
            active={activeFilters.includes('user')}
            onClick={() => toggleFilter('user')}
          />
          <StatItem
            label="Admins"
            count={stats.admin}
            active={activeFilters.includes('admin')}
            onClick={() => toggleFilter('admin')}
          />
          <StatItem
            label="Super Admins"
            count={stats.superAdmin}
            active={activeFilters.includes('superAdmin')}
            onClick={() => toggleFilter('superAdmin')}
          />
          <StatItem
            label="Inactive"
            count={stats.inactive}
            active={activeFilters.includes('inactive')}
            onClick={() => toggleFilter('inactive')}
            variant="warning"
          />
          <StatItem
            label="Pending"
            count={stats.pending}
            active={activeFilters.includes('pending')}
            onClick={() => toggleFilter('pending')}
            variant="info"
          />
        </div>

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {activeFilters.map(filter => (
              <Badge
                key={filter}
                variant="secondary"
                className="gap-1 capitalize"
              >
                {filter}
                <button 
                  onClick={() => toggleFilter(filter)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange([])}
              className="ml-auto"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatItem({ 
  label, 
  count, 
  active, 
  onClick,
  variant = 'default' 
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  variant?: 'default' | 'warning' | 'info'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg transition-colors",
        active ? "bg-primary/10" : "hover:bg-primary/5",
        variant === 'warning' && "text-yellow-600",
        variant === 'info' && "text-blue-600"
      )}
    >
      <div className="font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
    </button>
  )
}