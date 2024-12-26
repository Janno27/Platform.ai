// components/ab-initiator/experimentation-summary/expected-results.tsx
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { useExperimentation } from '@/providers/experimentation-provider'
import type { ExpectedResult } from '@/types/ab-test'

export function ExpectedResults() {
  const { formData, updateExpectedResults } = useExperimentation()
  const [newKpi, setNewKpi] = useState<string>('')
  const [newImprovement, setNewImprovement] = useState<string>('')

  const handleAddResult = () => {
    if (!newKpi || !newImprovement) return

    const newResult: ExpectedResult = {
      kpi_name: newKpi,
      improvement_percentage: parseFloat(newImprovement)
    }

    updateExpectedResults([
      ...(formData.expected_results || []),
      newResult
    ])

    // Reset form
    setNewKpi('')
    setNewImprovement('')
  }

  const handleRemoveResult = (index: number) => {
    const updatedResults = (formData.expected_results || []).filter((_, i) => i !== index)
    updateExpectedResults(updatedResults)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Expected Results</h3>

      {/* Liste des KPIs existants */}
      <div className="space-y-2">
        {formData.expected_results?.map((result, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{result.kpi_name}</span>
              <span className="text-sm text-blue-500">+{result.improvement_percentage}%</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveResult(index)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder="KPI Name"
            value={newKpi}
            onChange={(e) => setNewKpi(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="w-24">
          <Input
            placeholder="% Improvement"
            type="number"
            value={newImprovement}
            onChange={(e) => setNewImprovement(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddResult}
          disabled={!newKpi || !newImprovement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}