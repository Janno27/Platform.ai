"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ListViewProps {
  tests: any[]
  columns: string[]
  statusColors: Record<string, string>
}

export function ListView({ tests, columns = [], statusColors }: ListViewProps) {
  if (!columns?.length) return null

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6">
        {columns.map((status) => {
          const statusTests = tests.filter(test => test.status === status)
          if (statusTests.length === 0) return null

          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: statusColors[status] }}
                />
                <h3 className="font-medium">{status}</h3>
                <Badge variant="secondary">{statusTests.length}</Badge>
              </div>

              <div className="space-y-2 pl-4">
                {statusTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">{test.hypothesis}</p>
                      </div>
                      <Badge>{test.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
} 