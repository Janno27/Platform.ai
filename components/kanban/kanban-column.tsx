"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  color: string
  isFolded: boolean
  onFold: () => void
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  title,
  count,
  color,
  isFolded,
  onFold,
  children
}: KanbanColumnProps) {
  return (
    <div className={cn(
      "transition-all duration-200",
      isFolded ? "w-12 shrink-0" : "w-80 shrink-0"
    )}>
      <div className={cn(
        "flex items-center gap-2 p-2 border-b",
        isFolded && "h-full border-b-0"
      )}>
        <div className={cn(
          "flex items-center gap-2 w-full",
          isFolded && "origin-top-left -rotate-90 translate-y-10 w-[calc(100vh-200px)]"
        )}>
          <div 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {count}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={onFold}
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isFolded && "-rotate-90"
            )} />
          </Button>
        </div>
      </div>
      
      {!isFolded && (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2 space-y-2">
            {children}
          </div>
        </ScrollArea>
      )}
    </div>
  )
} 