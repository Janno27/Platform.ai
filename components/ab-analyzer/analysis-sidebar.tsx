"use client"

import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Calendar, Filter, Layout, MoreVertical, X, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Comment {
  id: number
  content: string
  timestamp: string
  tab: string
  filters?: {
    device_category?: string[]
    item_category2?: string[]
  }
}

interface AnalysisSidebarProps {
  open: boolean
  onClose: () => void
}

export function AnalysisSidebar({ open, onClose }: AnalysisSidebarProps) {
  const [comments, setComments] = React.useState<Comment[]>([])
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null)
  const [editContent, setEditContent] = React.useState("")

  const loadComments = React.useCallback(() => {
    try {
      const savedComments = JSON.parse(localStorage.getItem('analysis-comments') || '[]')
      setComments(savedComments.sort((a: Comment, b: Comment) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      loadComments()
    }
  }, [open, loadComments])

  const handleDelete = (id: number) => {
    try {
      const updatedComments = comments.filter(comment => comment.id !== id)
      localStorage.setItem('analysis-comments', JSON.stringify(updatedComments))
      setComments(updatedComments)
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const saveEdit = (id: number) => {
    try {
      const updatedComments = comments.map(comment => 
        comment.id === id 
          ? { ...comment, content: editContent, timestamp: new Date().toISOString() }
          : comment
      )
      localStorage.setItem('analysis-comments', JSON.stringify(updatedComments))
      setComments(updatedComments)
      setEditingCommentId(null)
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
    }
  }

  const formatFilters = (filters?: { device_category?: string[], item_category2?: string[] }) => {
    if (!filters) return []
    
    const formattedFilters = []
    if (filters.device_category?.length) {
      formattedFilters.push(...filters.device_category.map(f => `Device: ${f}`))
    }
    if (filters.item_category2?.length) {
      formattedFilters.push(...filters.item_category2.map(f => `Category: ${f}`))
    }
    return formattedFilters
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[400px] p-0 flex flex-col">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Analysis Notes</h2>
                <p className="text-sm text-muted-foreground">
                  {comments.length} note{comments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "p-4 rounded-lg border bg-card",
                  "transition-colors duration-200",
                  editingCommentId === comment.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Layout className="h-4 w-4" />
                    <span>{comment.tab}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(comment)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCommentId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveEdit(comment.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm mb-3">{comment.content}</p>
                )}

                {comment.filters && formatFilters(comment.filters).length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Filter className="h-3 w-3" />
                    <div className="flex gap-1 flex-wrap">
                      {formatFilters(comment.filters).map((filter) => (
                        <span 
                          key={filter}
                          className="bg-muted px-1.5 py-0.5 rounded"
                        >
                          {filter}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}