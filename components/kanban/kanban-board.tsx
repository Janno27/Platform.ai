"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { KanbanCard } from "./kanban-card"
import { 
  Plus, 
  Users2,
  Filter,
  LayoutGrid,
  List,
  Table as TableIcon,
  ChevronDown,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { KanbanColumn } from "./kanban-column"
import { TableView } from "./views/table-view"
import { ListView } from "./views/list-view"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { KanbanSkeleton } from "./kanban-skeleton"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/useUser"
import { toast } from "react-hot-toast"
import { KanbanCardSkeleton } from "./kanban-card-skeleton"

const VIEW_OPTIONS = [
  { label: "Board", value: "board", icon: LayoutGrid },
  { label: "Table", value: "table", icon: TableIcon },
  { label: "List", value: "list", icon: List },
]

const STATUS_COLORS = {
  draft: "#E2E8F0",
  in_progress: "#60A5FA",
  review: "#F59E0B",
  done: "#10B981",
}

interface KanbanBoardProps {
  tests: any[]
  columns: string[]
  onColumnAdd: (columnName: string) => void
  onColumnDelete: (columnName: string) => void
  onCardMove: (testId: string, newStatus: string) => void
}

export function KanbanBoard({
  tests,
  columns,
  onColumnAdd,
  onColumnDelete,
  onCardMove
}: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<"board" | "table" | "list">("board")
  const [foldedColumns, setFoldedColumns] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const { userDetails } = useUser()
  const [isFolded, setIsFolded] = useState(false)

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => {
      setSearchTerm(e.detail)
    }

    window.addEventListener('kanban-search', handleSearch as EventListener)
    return () => {
      window.removeEventListener('kanban-search', handleSearch as EventListener)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // ... chargement des données
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.hypothesis?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || test.type === selectedType
    return matchesSearch && matchesType
  })

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) {
      // Même colonne, pas besoin de mettre à jour le statut
      return
    }

    try {
      // Mettre à jour le statut dans Supabase
      const { error } = await supabase
        .from('ab_tests_summary')
        .update({ 
          status: destination.droppableId,
          last_modified_by: userDetails?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId)

      if (error) throw error

      // Appeler la fonction de callback
      onCardMove(draggableId, destination.droppableId)
    } catch (error) {
      console.error('Error moving card:', error)
      toast.error('Failed to update test status')
    }
  }

  const toggleFoldColumn = (columnId: string) => {
    setFoldedColumns(prev => 
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  if (isLoading) {
    return <KanbanSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Summary et Users - Section pliable */}
      <div className={cn(
        "space-y-4 overflow-hidden transition-all duration-200",
        isFolded ? "h-0" : "h-auto"
      )}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex -space-x-2">
              {tests.slice(0, 4).map((test) => (
                <Avatar key={test.id} className="border-2 border-background">
                  <AvatarImage src={test.owner?.avatar} />
                  <AvatarFallback>{test.owner?.initials}</AvatarFallback>
                </Avatar>
              ))}
              {tests.length > 4 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
                  +{tests.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et Contrôles - Toujours visibles */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsFolded(!isFolded)}
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isFolded && "transform rotate-180"
              )} />
            </Button>

            <Select
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ab_test">A/B Test</SelectItem>
                <SelectItem value="personalization">Personalization</SelectItem>
                <SelectItem value="patch">Patch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.value}
                  variant={viewMode === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(option.value as any)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Kanban Board - Toujours visible */}
      <div className={cn(
        "transition-all duration-200 relative",
        isFolded ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-220px)]"
      )}>
        {viewMode === "board" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="absolute inset-0">
              <div className="flex gap-4 p-4 bg-muted/30 rounded-lg h-full overflow-x-auto overflow-y-hidden">
                {columns.map((columnId) => (
                  <KanbanColumn
                    key={columnId}
                    id={columnId}
                    title={columnId}
                    count={filteredTests.filter(test => test.status === columnId).length}
                    color={STATUS_COLORS[columnId] || "#94A3B8"}
                    isFolded={foldedColumns.includes(columnId)}
                    onFold={() => toggleFoldColumn(columnId)}
                  >
                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "min-h-[100px] transition-colors h-full overflow-hidden",
                            snapshot.isDraggingOver && "bg-muted/50"
                          )}
                        >
                          <div className="h-full overflow-y-auto pr-2">
                            {filteredTests
                              .filter(test => test.status === columnId)
                              .map((test, index) => (
                                <Draggable
                                  key={test.id}
                                  draggableId={test.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <>
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                          "transition-opacity",
                                          snapshot.isDragging && "opacity-50"
                                        )}
                                      >
                                        <KanbanCard
                                          test={test}
                                          isDragging={snapshot.isDragging}
                                        />
                                      </div>
                                      {snapshot.isDragging && (
                                        <div className="pointer-events-none">
                                          <KanbanCardSkeleton />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {snapshot.isDraggingOver && (
                              <div className="pointer-events-none">
                                <KanbanCardSkeleton />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </KanbanColumn>
                ))}
                
                {/* Bouton d'ajout de colonne */}
                <Button
                  variant="ghost"
                  className="h-10 w-10 rounded-full shrink-0 opacity-50 hover:opacity-100"
                  onClick={() => onColumnAdd("New Status")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DragDropContext>
        )}

        {viewMode === "list" && (
          <ListView 
            tests={filteredTests} 
            columns={columns}
            statusColors={STATUS_COLORS}
          />
        )}
        
        {viewMode === "table" && <TableView tests={filteredTests} />}
      </div>
    </div>
  )
} 