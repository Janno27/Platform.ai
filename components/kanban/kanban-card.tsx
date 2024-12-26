"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface KanbanCardProps {
  test: any
  index: number
}

export function KanbanCard({ test, index }: KanbanCardProps) {
  return (
    <Card
      className={cn(
        "p-4 mb-2 cursor-grab bg-background",
        "hover:shadow-md transition-all duration-200"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium line-clamp-2">{test.name}</h4>
          <Badge variant="outline" className="ml-2 shrink-0">
            {test.type}
          </Badge>
        </div>
        
        {test.hypothesis && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {test.hypothesis}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {test.team?.map((member: any) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{test.variations?.length || 0} variations</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
} 