"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Link, ArrowUpCircle, FileIcon, X, ArrowLeft, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, ChevronDown, Plus, RefreshCw } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DataPreviewTable } from "./data-preview-table"
import { CurrencySelector } from "./currency-selector"

interface TestData {
  id: string
  title: string
  hypothesis: string
  context: string
  visualUrl?: string
}

const analyzingTests = [
  {
    id: "test-1",
    title: "Homepage Redesign Test",
    status: "analyzing",
    icon: ArrowUpCircle,
  },
  {
    id: "test-2",
    title: "Checkout Flow Optimization",
    status: "analyzing",
    icon: ArrowUpCircle,
  },
]

interface FileWithPreview extends File {
  preview?: string
}

interface NewTest extends TestData {
  imageA?: string
  imageB?: string
}

export interface TestSummaryProps {
  onCollapse: (collapsed: boolean) => void
  onAnalysisStart: (data: any) => void
  onProcessStepChange: (step: 'initial' | 'processing' | 'analyzed') => void
  showAnalysis: boolean
  currency: string
  onCurrencyChange: (currency: string) => void
  filters: {
    device_category: string[]
    item_category2: string[]
  }
  onFilterChange: (filterType: string, value: string) => void
}

export function TestSummary({ onCollapse, onAnalysisStart, onProcessStepChange, showAnalysis, currency, onCurrencyChange, filters, onFilterChange }: TestSummaryProps) {
  const [selectedTest, setSelectedTest] = React.useState<TestData | null>(null)
  const [open, setOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<FileWithPreview[]>([])
  const [newTest, setNewTest] = React.useState<Partial<NewTest>>({})
  const [isCreatingNew, setIsCreatingNew] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [analysisData, setAnalysisData] = React.useState<any>(null)
  const [isFileZoneOpen, setIsFileZoneOpen] = React.useState(true)
  const [processStep, setProcessStep] = React.useState<'initial' | 'processing' | 'analyzed'>('initial')
  const [isPreparationComplete, setIsPreparationComplete] = useState(false)
  const [isAggregated, setIsAggregated] = useState(false)
  const [aggregatedData, setAggregatedData] = useState<any>(null)
  const [randomSamples, setRandomSamples] = useState<any[]>([])
  const [showSamples, setShowSamples] = useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const imageAInputRef = React.useRef<HTMLInputElement>(null)
  const imageBInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const jsonFiles = files.filter(file => file.type === "application/json")
    if (jsonFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...jsonFiles])
    }
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const jsonFiles = files.filter(file => file.type === "application/json")
    setSelectedFiles(prev => [...prev, ...jsonFiles])
  }

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(files => files.filter(file => file !== fileToRemove))
  }

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleNewTest = () => {
    setIsCreatingNew(true)
    setIsUploading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, version: 'A' | 'B') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      // Vous pourriez ajouter une notification d'erreur ici
      console.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setNewTest(prev => ({
        ...prev,
        [version === 'A' ? 'imageA' : 'imageB']: imageUrl
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleImageClick = (version: 'A' | 'B') => {
    if (version === 'A') {
      imageAInputRef.current?.click()
    } else {
      imageBInputRef.current?.click()
    }
  }

  const removeImage = (version: 'A' | 'B') => {
    setNewTest(prev => ({
      ...prev,
      [version === 'A' ? 'imageA' : 'imageB']: undefined
    }))
  }

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    onCollapse(!isCollapsed)
  }

  const handleFileUpload = async (files: File[]) => {
    try {
      setIsAnalyzing(true)
      setProcessStep('processing')
      onProcessStepChange('processing')
      setProgress(0)
      
      // Simuler une progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const jsonFiles = await Promise.all(
        files.map(async (file) => {
          const text = await file.text()
          try {
            return JSON.parse(text)
          } catch (e) {
            throw new Error(`Le fichier ${file.name} n'est pas un JSON valide`)
          }
        })
      )

      // Préparer les données pour l'API
      const requestData = {
        overall_data: jsonFiles[0],
        transaction_data: jsonFiles[1] || [],
        currency: currency,
        filters: {
          device_category: [],
          item_category2: []
        }
      }

      // Réinitialiser l'état d'agrégation
      setIsAggregated(false)
      setAggregatedData(null)
      const apiUrl = process.env.REACT_APP_API_URL;

      const response = await fetch(`${apiUrl}/analyze`, {  // Utiliser des backticks pour l'interpolation
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json()
      clearInterval(progressInterval)
      setProgress(100)
      setAnalysisData(data)
      setIsFileZoneOpen(false)
      setProcessStep('analyzed')
      onProcessStepChange('analyzed')
      
      toast({
        title: "Data Loaded",
        description: "Your data has been loaded successfully. You can now aggregate it.",
        duration: 3000,
      })

      return data

    } catch (error) {
      setProcessStep('initial')
      console.error('Erreur lors de l\'upload:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAggregateData = async () => {
    try {
      if (!analysisData?.raw_data?.transaction) {
        throw new Error("Aucune donnée de transaction à agréger")
      }

      const response = await fetch(`${apiUrl}/aggregate-transactions`, {  // Utiliser des backticks ici
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData.raw_data.transaction)
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json()
      
      if (result.success) {
        setAggregatedData({
          ...analysisData,
          raw_data: {
            ...analysisData.raw_data,
            transaction: result.data
          }
        })
        setIsAggregated(true)
        
        toast({
          title: "Data Aggregated",
          description: "Your data has been aggregated successfully",
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'agrégation",
      })
    }
  }

  const generateRandomSamples = () => {
    const data = isAggregated 
      ? aggregatedData?.raw_data?.transaction 
      : analysisData?.raw_data?.transaction

    if (!data || data.length === 0) return

    // Sélectionner un seul index aléatoire
    const randomIndex = Math.floor(Math.random() * data.length)
    
    // Récupérer l'échantillon
    setRandomSamples([data[randomIndex]])
    setShowSamples(true)
  }

  return (
    <Card className={cn(
      "h-full bg-muted/10 transition-all duration-300",
      "w-full",
      "flex flex-col",
      "overflow-hidden",
      "animate-in slide-in-from-left duration-300"
    )}>
      <Input 
        ref={fileInputRef}
        type="file" 
        accept=".json,application/json" 
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <CardHeader className="relative flex-none">
       {(selectedTest || isCreatingNew || showAnalysis) && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full p-0",
              "bg-background shadow-sm border border-border",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors"
            )}
            onClick={handleCollapse}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}

        {isCollapsed ? (
          <div className="flex flex-col gap-4">
            <CardTitle className="text-sm font-semibold">
              {selectedTest ? selectedTest.title : isCreatingNew ? "New Test" : "Test Summary"}
            </CardTitle>
            {selectedTest && (
              <div className="rounded-lg overflow-hidden border bg-muted/30">
                {newTest.imageB ? (
                  <img 
                    src={newTest.imageB} 
                    alt="Variant B" 
                    className="w-full h-auto object-cover"
                  />
                ) : selectedTest.visualUrl ? (
                  <img 
                    src={selectedTest.visualUrl} 
                    alt="Test visual" 
                    className="w-full h-auto object-cover"
                  />
                ) : null}
              </div>
            )}
            {isCreatingNew && newTest.imageB && (
              <div className="rounded-lg overflow-hidden border bg-muted/30">
                <img 
                  src={newTest.imageB} 
                  alt="Variant B" 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {(selectedTest || isCreatingNew) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (processStep === 'analyzed') {
                    setProcessStep('initial')
                    onProcessStepChange('initial')
                  } else {
                    setSelectedTest(null)
                    setIsCreatingNew(false)
                    setNewTest({})
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to test selection</span>
              </Button>
            )}
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                {selectedTest ? selectedTest.title : isCreatingNew ? "New Test" : "Test Summary"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedTest 
                  ? "Review your test details and add supplementary data files if needed."
                  : isCreatingNew
                  ? "Create a new test by filling in the details and uploading your test data."
                  : "Select a test from your ongoing analyses in the Overview section or upload your own test data in JSON format."}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={cn(
        "flex-1",
        "min-h-0",
        "overflow-y-auto",
        "space-y-6",
        isCollapsed && "hidden"
      )}>
        {showAnalysis ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Test Info Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Test Information</h2>
                  <div className="grid gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Hypothesis</h3>
                      <p className="text-sm text-muted-foreground">
                        {newTest.hypothesis || "No hypothesis provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Variations Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Variations</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Control</h3>
                      {newTest.imageA ? (
                        <div className="rounded-lg overflow-hidden border">
                          <img 
                            src={newTest.imageA} 
                            alt="Control Version" 
                            className="w-full h-auto"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                          No control image provided
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Variant</h3>
                      {newTest.imageB ? (
                        <div className="rounded-lg overflow-hidden border">
                          <img 
                            src={newTest.imageB} 
                            alt="Variant Version" 
                            className="w-full h-auto"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                          No variant image provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Metrics Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Key Metrics</h2>
                  {analysisData ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium">Conversion Rate</div>
                        <div className="text-2xl font-bold">+12.5%</div>
                        <div className="text-xs text-muted-foreground">vs Control</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium">Revenue Impact</div>
                        <div className="text-2xl font-bold">+€5,234</div>
                        <div className="text-xs text-muted-foreground">Projected Monthly</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No analysis data available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {!selectedTest && !isCreatingNew ? (
              <div className="flex flex-col gap-4">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-center">
                      <Link className="mr-2 h-4 w-4" />
                      Select from Overview
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput placeholder="Search tests..." />
                      <CommandList>
                        <CommandEmpty>No analyzing tests found.</CommandEmpty>
                        <CommandGroup heading="Analyzing Tests">
                          {analyzingTests.map((test) => (
                            <CommandItem
                              key={test.id}
                              value={test.title}
                              onSelect={() => {
                                setSelectedTest({
                                  id: test.id,
                                  title: test.title,
                                  hypothesis: "Test hypothesis...",
                                  context: "Test context...",
                                })
                                setOpen(false)
                              }}
                            >
                              <test.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{test.title}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full justify-center"
                  onClick={handleNewTest}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Test Data
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={cn(
                  "space-y-4 transition-all duration-300",
                  processStep === 'analyzed' 
                    ? "opacity-100" 
                    : "opacity-0 hidden"
                )}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Data Overview</h3>
                    <CurrencySelector 
                      value={currency}
                      onValueChange={onCurrencyChange}
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                          {processStep === 'analyzed' && !isAggregated && (
                            <Button 
                              onClick={handleAggregateData}
                              variant="outline"
                            >
                              Aggregate Data
                            </Button>
                          )}
                          {processStep === 'analyzed' && (
                            <Button
                              onClick={generateRandomSamples}
                              variant="outline"
                              size="sm"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Check Samples
                            </Button>
                          )}
                        </div>
                      </div>

                      {showSamples && randomSamples.length > 0 && (
                        <div className="mb-6 space-y-2">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="text-sm font-medium">Random Sample</h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSamples(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {randomSamples.map((sample, index) => (
                              <div 
                                key={index}
                                className="p-4 rounded-md bg-muted/50 space-y-3"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-xs text-muted-foreground">Transaction ID</span>
                                    <div className="font-mono text-sm">{sample.transaction_id}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Variation</span>
                                    <div className="text-sm">{sample.variation}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Revenue</span>
                                    <div className="text-sm font-medium">{sample.revenue} {currency}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Quantity</span>
                                    <div className="text-sm">{sample.quantity}</div>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">Category</span>
                                  <div 
                                    className="text-sm max-w-[150px] truncate" 
                                    title={sample.item_category2}
                                  >
                                    {sample.item_category2}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <DataPreviewTable 
                        data={isAggregated ? aggregatedData?.raw_data?.transaction : analysisData?.raw_data?.transaction || []} 
                        isLoading={isAnalyzing}
                        currency={currency}
                        type="transaction"
                      />
                    </div>
                    <div>
                      <DataPreviewTable 
                        data={analysisData?.raw_data?.overall || []} 
                        isLoading={isAnalyzing}
                        currency={currency}
                        type="overall"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPreparationComplete(false)
                        setProcessStep('initial')
                        onProcessStepChange('initial')
                        setAnalysisData(null)
                        setSelectedFiles([])
                        setNewTest({})
                        setIsCreatingNew(true)
                        setIsAggregated(false)
                        setAggregatedData(null)
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        setIsPreparationComplete(true)
                        onAnalysisStart({
                          title: newTest.title,
                          hypothesis: newTest.hypothesis,
                          imageA: newTest.imageA,
                          imageB: newTest.imageB,
                          analysisData: isAggregated ? aggregatedData : analysisData,
                          currency: currency
                        })
                      }}
                      disabled={!isAggregated || !currency}
                      title={
                        !currency 
                          ? "Please select a currency before running the analysis" 
                          : !isAggregated 
                            ? "Please aggregate your data before running the analysis" 
                            : ""
                      }
                    >
                      Run Analysis
                    </Button>
                  </div>
                </div>

                <Collapsible 
                  open={processStep !== 'analyzed'}
                  onOpenChange={(open) => {
                    if (!open && processStep === 'initial') {
                      handleFileUpload(Array.from(selectedFiles))
                    }
                  }}
                >
                  <CollapsibleContent 
                    className={cn(
                      "space-y-6 transition-all duration-300",
                      processStep === 'analyzed' ? "hidden" : "opacity-100"
                    )}
                  >
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Test Name</Label>
                          <Input
                            id="title"
                            value={newTest.title || ''}
                            onChange={(e) => setNewTest(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter test name..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="hypothesis">Hypothesis</Label>
                          <Textarea
                            id="hypothesis"
                            value={newTest.hypothesis || ''}
                            onChange={(e) => setNewTest(prev => ({ ...prev, hypothesis: e.target.value }))}
                            placeholder="Enter your test hypothesis..."
                            className="min-h-[100px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="context">Context</Label>
                          <Textarea
                            id="context"
                            value={newTest.context || ''}
                            onChange={(e) => setNewTest(prev => ({ ...prev, context: e.target.value }))}
                            placeholder="Describe the test context..."
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Version A (Control)</Label>
                            <div 
                              className="mt-2 border-2 border-dashed border-muted rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative group"
                              onClick={() => handleImageClick('A')}
                            >
                              <Input 
                                ref={imageAInputRef}
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'A')}
                              />
                              {newTest.imageA ? (
                                <div className="relative">
                                  <img 
                                    src={newTest.imageA} 
                                    alt="Version A" 
                                    className="max-h-[200px] mx-auto"
                                  />
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeImage('A')
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="py-8">
                                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground mt-2 block">
                                    Upload Version A
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Version B (Variant)</Label>
                            <div 
                              className="mt-2 border-2 border-dashed border-muted rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative group"
                              onClick={() => handleImageClick('B')}
                            >
                              <Input 
                                ref={imageBInputRef}
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'B')}
                              />
                              {newTest.imageB ? (
                                <div className="relative">
                                  <img 
                                    src={newTest.imageB} 
                                    alt="Version B" 
                                    className="max-h-[200px] mx-auto"
                                  />
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeImage('B')
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="py-8">
                                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground mt-2 block">
                                    Upload Version B
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          and
                        </span>
                      </div>
                    </div>

                    {!analysisData ? (
                      <div 
                        onClick={handleZoneClick}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className={cn(
                          "border-2 border-dashed border-muted rounded-lg flex flex-col gap-2 p-6 items-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors",
                          isUploading && "opacity-50 cursor-wait"
                        )}
                      >
                        <FileIcon className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {isUploading ? "Uploading..." : "Click or drag and drop to add files"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Accepts multiple JSON files
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleZoneClick}
                      >
                        <Plus className="h-4 w-4" />
                        Add Files
                      </Button>
                    )}

                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">Selected Files</Label>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <FileIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({Math.round(file.size / 1024)}KB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreatingNew(false)
                          setNewTest({})
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={selectedFiles.length === 0}
                        onClick={async () => {
                          if (selectedFiles.length > 0) {
                            setIsUploading(true)
                            try {
                              await handleFileUpload(Array.from(selectedFiles))
                            } finally {
                              setIsUploading(false)
                            }
                          }
                        }}
                      >
                        {processStep === 'processing' ? "Processing..." : "Process Data"}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 