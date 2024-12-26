"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ColumnEditorProps {
  initialName?: string
  onSave: (name: string) => Promise<void>
  onCancel: () => void
}

export function ColumnEditor({ initialName = "", onSave, onCancel }: ColumnEditorProps) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSave(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter column name..."
        className="h-8"
      />
      <Button type="submit" size="sm" className="h-8">
        Save
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  )
} 