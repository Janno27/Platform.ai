"use client"

import { TestSummary } from "./test-summary"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface ABAnalyzerProps {
  onAnalysisStart: (data: any) => void
  onProcessStepChange: (step: 'initial' | 'processing' | 'analyzed') => void
  showAnalysis: boolean
  currency: string
  onCurrencyChange: (currency: string) => void
  filters: {
    device_category: string[]
    item_category2: string[]
  }
  onFilterChange: (filterType: keyof Filter, value: string) => void
  onCollapse: (collapsed: boolean) => void
}

export function ABAnalyzer({ 
  onAnalysisStart,
  onProcessStepChange,
  showAnalysis,
  currency,
  onCurrencyChange,
  filters,
  onFilterChange,
  onCollapse
}: ABAnalyzerProps) {
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('summaryCollapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem('summaryCollapsed', JSON.stringify(isSummaryCollapsed))
    onCollapse(isSummaryCollapsed)
  }, [isSummaryCollapsed, onCollapse])

  return (
    <div className={cn(
      "flex flex-col h-full",
      "overflow-hidden"
    )}>
      <div className="p-6 flex-none">
        <h1 className="text-3xl font-bold tracking-tight">A/B Test Analyzer</h1>
      </div>

      <div className={cn(
        "flex-1",
        "min-h-0",
        "px-6 pb-6",
        "overflow-hidden"
      )}>
        <TestSummary 
          onCollapse={onCollapse} 
          onAnalysisStart={onAnalysisStart}
          onProcessStepChange={onProcessStepChange}
          showAnalysis={showAnalysis}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
          filters={filters}
          onFilterChange={onFilterChange}
        />
      </div>
    </div>
  )
}