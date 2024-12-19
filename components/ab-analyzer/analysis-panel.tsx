"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface AnalysisPanelProps {
  isOpen: boolean
}

export function AnalysisPanel({ isOpen }: AnalysisPanelProps) {
  const [notes, setNotes] = React.useState<string>("")
  const [tags, setTags] = React.useState<string[]>([])

  // Charger les notes depuis localStorage
  React.useEffect(() => {
    const savedNotes = localStorage.getItem("analysis-notes")
    if (savedNotes) {
      setNotes(savedNotes)
    }
  }, [])

  // Sauvegarder les notes dans localStorage
  const handleNotesChange = (value: string) => {
    setNotes(value)
    localStorage.setItem("analysis-notes", value)
  }

  if (!isOpen) return null

  return (
    <Card className="w-[30%] h-full p-4 border-l">
      <div className="flex flex-col h-full gap-4">
        <h3 className="text-lg font-semibold">Mode Analyse</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <Input 
            placeholder="Ajouter des tags..."
            onChange={(e) => setTags([...tags, e.target.value])}
          />
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            className="h-[calc(100%-2rem)] mt-2"
            placeholder="Prenez vos notes ici..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
          />
        </div>
      </div>
    </Card>
  )
} 