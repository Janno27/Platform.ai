"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown, ListCollapse } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RawDataTableProps {
  data: any
  currency: string
}

export function RawDataTable({ data }: RawDataTableProps) {
  const [activeDataset, setActiveDataset] = React.useState<'overall' | 'transaction'>('overall')
  const [collapsedColumns, setCollapsedColumns] = React.useState<{ [key: string]: boolean }>({})
  const [isAggregating, setIsAggregating] = React.useState(false)
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const [aggregatedData, setAggregatedData] = React.useState<any[] | null>(null)
  const [isAggregated, setIsAggregated] = React.useState(false)

  const AGGREGATED_COLUMNS = [
    'transaction_id',
    'variation',
    'device_category',
    'item_category2',
    'item_name_simple',
    'quantity',
    'revenue'
  ]

  const handleDatasetChange = (checked: boolean) => {
    const newDataset = checked ? 'transaction' : 'overall'
    
    setIsTransitioning(true)
    
    setAggregatedData(null)
    setIsAggregated(false)
    
    setTimeout(() => {
      setActiveDataset(newDataset)
      setIsTransitioning(false)
    }, 300)
  }

  const handleAggregate = async () => {
    if (activeDataset !== 'transaction') return
    
    if (isAggregated) {
      setIsTransitioning(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setAggregatedData(null)
      setIsAggregated(false)
      setIsTransitioning(false)
      return
    }
    
    try {
      setIsAggregating(true)
      console.log('Data being sent:', data?.analysisData?.raw_data?.transaction)
      
      const response = await fetch('http://localhost:8000/aggregate-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data?.analysisData?.raw_data?.transaction || []),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to aggregate data')
      }
      
      const result = await response.json()
      console.log('Received result:', result)
      
      if (result.success && Array.isArray(result.data)) {
        setAggregatedData(result.data)
        setIsAggregated(true)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error aggregating data:', error)
    } finally {
      setIsAggregating(false)
    }
  }

  const handleExport = () => {
    const currentData = data?.analysisData?.raw_data?.[activeDataset]
    if (!currentData) return
    const csv = convertToCSV(currentData)
    downloadCSV(csv, `${activeDataset}_data.csv`)
  }

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'string') return value.length > 30 ? `${value.slice(0, 30)}...` : value
    if (typeof value === 'number') return value.toLocaleString()
    return String(value)
  }

  const toggleColumn = (column: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const currentData = React.useMemo(() => {
    if (!data?.analysisData?.raw_data) return []
    
    if (activeDataset === 'transaction' && isAggregated && aggregatedData) {
      return aggregatedData
    }
    
    return data.analysisData.raw_data[activeDataset] || []
  }, [data, activeDataset, isAggregated, aggregatedData])

  const columns = currentData[0] 
    ? isAggregated 
      ? AGGREGATED_COLUMNS.filter(col => Object.keys(currentData[0]).includes(col))
      : Object.keys(currentData[0])
    : []

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      <div className="h-8 flex items-center space-x-4 mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton 
              key={j} 
              className={cn(
                "h-6",
                j === 0 ? "w-28" : "w-24"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b p-4 bg-background z-30 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="dataset-switch"
                checked={activeDataset === 'transaction'}
                onCheckedChange={handleDatasetChange}
                disabled={!data?.analysisData?.raw_data || isTransitioning}
              />
              <Label htmlFor="dataset-switch">
                {activeDataset === 'transaction' ? 'Transaction Data' : 'Overall Data'}
              </Label>
            </div>
            {activeDataset === 'transaction' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAggregate}
                disabled={isAggregating || isTransitioning}
                className="ml-4"
              >
                <ListCollapse className="mr-2 h-4 w-4" />
                {isAggregating || isTransitioning 
                  ? 'Loading...' 
                  : isAggregated 
                    ? 'Show Raw' 
                    : 'Aggregate Data'
                }
              </Button>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={isTransitioning || isAggregating}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {isTransitioning ? (
            renderSkeleton()
          ) : (
            <div className="absolute inset-0 overflow-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="relative">
                  {(isAggregating || isTransitioning) ? (
                    renderSkeleton()
                  ) : (
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="sticky top-0 z-20 bg-background">
                          {columns.map((column) => (
                            <TableHead 
                              key={column} 
                              className={cn(
                                "whitespace-nowrap bg-background border-b text-center",
                                collapsedColumns[column] && "w-12 !p-0"
                              )}
                              style={{ position: 'sticky', top: 0 }}
                            >
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-8 p-1 hover:bg-muted",
                                    collapsedColumns[column] && "w-full h-full rounded-none"
                                  )}
                                  onClick={() => toggleColumn(column)}
                                >
                                  <ChevronDown 
                                    className={cn(
                                      "h-4 w-4 shrink-0 transition-transform",
                                      collapsedColumns[column] && "-rotate-90"
                                    )}
                                  />
                                  {!collapsedColumns[column] && (
                                    <span className="ml-2">
                                      {column.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                      ).join(' ')}
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.map((row: any, index: number) => (
                          <TableRow key={index}>
                            {columns.map((column) => (
                              <TableCell 
                                key={column}
                                className={cn(
                                  "transition-all text-center px-4 py-2",
                                  collapsedColumns[column] && "w-12 !p-2"
                                )}
                              >
                                <div className={cn(
                                  "transition-all",
                                  collapsedColumns[column] ? "opacity-0" : "opacity-100"
                                )}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help inline-block px-2 py-1 hover:bg-muted/50 rounded">
                                        {formatCellValue(row[column])}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top" 
                                      align="center"
                                      className="max-w-[300px] break-words bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
                                    >
                                      {row[column]?.toString()}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Fonctions utilitaires pour l'export CSV
function convertToCSV(data: any[]): string {
  if (!data || !data.length) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}