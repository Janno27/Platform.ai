"use client"

export function KanbanCardSkeleton() {
  return (
    <div className="p-4 mb-2 border rounded-lg bg-muted/5 border-dashed border-muted-foreground/20 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
        <div className="flex justify-between items-center">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-6 w-6 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
} 