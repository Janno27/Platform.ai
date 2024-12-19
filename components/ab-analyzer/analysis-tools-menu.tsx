"use client"

import * as React from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Highlighter, MessageSquare, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToolComment } from "./tool_comment"

interface AnalysisToolsMenuProps {
  children: React.ReactNode
  onSelectTool: (tool: "comment" | "highlight" | "screenshot", data: { content: string }) => void
  isAnalysisMode: boolean
  activeTab: string
  filters: {
    device_category: string[]
    item_category2: string[]
  }
}

export function AnalysisToolsMenu({
  children,
  onSelectTool,
  isAnalysisMode,
  activeTab,
  filters
}: AnalysisToolsMenuProps) {
  const [selectedTool, setSelectedTool] = React.useState<"comment" | "highlight" | "screenshot" | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (tool: "comment" | "highlight" | "screenshot", e: Event) => {
    e.preventDefault()
    setSelectedTool(tool)
    setIsOpen(true)
  }

  const handleClose = () => {
    setSelectedTool(null)
    setIsOpen(false)
  }

  const renderToolContent = () => {
    switch (selectedTool) {
      case "comment":
        return (
          <ToolComment
            onSave={(comment) => {
              onSelectTool("comment", { content: comment })
              handleClose()
            }}
            onCancel={handleClose}
            activeTab={activeTab}
            filters={filters}
          />
        )
      default:
        return (
          <>
            <ContextMenuItem onSelect={(e) => handleSelect("comment", e)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Comment
            </ContextMenuItem>
            <ContextMenuItem onSelect={(e) => handleSelect("highlight", e)}>
              <Highlighter className="mr-2 h-4 w-4" />
              Highlight + Comment
            </ContextMenuItem>
            <ContextMenuItem onSelect={(e) => handleSelect("screenshot", e)}>
              <Camera className="mr-2 h-4 w-4" />
              Screenshot + Comment
            </ContextMenuItem>
          </>
        )
    }
  }

  if (!isAnalysisMode) {
    return <>{children}</>
  }

  return (
    <ContextMenu open={isOpen} onOpenChange={setIsOpen}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent 
        className={cn(selectedTool && "p-0")}
        onInteractOutside={(e) => {
          if (selectedTool) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (selectedTool) {
            e.preventDefault()
          }
        }}
      >
        {renderToolContent()}
      </ContextMenuContent>
    </ContextMenu>
  )
}