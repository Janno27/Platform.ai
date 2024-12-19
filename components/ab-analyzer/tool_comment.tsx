"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Check, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolCommentProps {
  onSave: (comment: string) => void
  onCancel: () => void
  activeTab: string
  filters: {
    device_category: string[]
    item_category2: string[]
  }
}

export function ToolComment({ 
  onSave, 
  onCancel,
  activeTab,
  filters
}: ToolCommentProps) {
  const [comment, setComment] = React.useState<string>("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)

  const handleSave = async () => {
    if (!comment.trim()) return
    
    setIsSaving(true)
    try {
      // Récupérer les commentaires existants
      const existingComments = JSON.parse(localStorage.getItem('analysis-comments') || '[]')
      
      // Créer le nouveau commentaire
      const newComment = {
        id: Date.now(),
        content: comment,
        timestamp: new Date().toISOString(),
        tab: activeTab,
        filters: {
          device_category: filters.device_category || [],
          item_category2: filters.item_category2 || []
        }
      }
      
      // Mettre à jour le stockage
      const updatedComments = [...existingComments, newComment]
      localStorage.setItem('analysis-comments', JSON.stringify(updatedComments))

      // Effet visuel de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsSaved(true)
      
      // Notifier le parent
      setTimeout(() => {
        onSave(comment)
      }, 500)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div 
      className={cn(
        "p-2 w-64 bg-background/95 backdrop-blur-sm",
        "shadow-lg rounded-lg border border-border/50",
        "transition-all duration-200"
      )} 
      onClick={e => e.stopPropagation()}
    >
      <Textarea
        value={comment}
        onChange={(e) => {
          setComment(e.target.value)
          setIsSaved(false)
        }}
        className={cn(
          "min-h-[80px] resize-none",
          "bg-transparent border-none",
          "focus-visible:ring-0",
          "placeholder:text-muted-foreground/50",
          "text-sm"
        )}
        placeholder="Add a comment..."
        onClick={e => e.stopPropagation()}
      />
      <div className="flex justify-end items-center gap-2 mt-2">
        {isSaved && (
          <span className="text-xs text-green-500 mr-auto">
            Saved
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving || !comment.trim()}
          className={cn(
            "h-7 px-2",
            isSaved && "text-green-500"
          )}
        >
          {isSaving ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}