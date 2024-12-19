"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { RawDataTable } from "./raw-data-table"
import { OverviewTable } from "./overview-table"
import { RevenueAnalysis } from "./revenue-analysis"
import { ClipboardEdit, MessageSquare, Bot } from "lucide-react"
import { AnalysisPanel } from "./analysis-panel"
import { Button } from "@/components/ui/button"
import { AnalysisToolsMenu } from "./analysis-tools-menu"
import { AnalysisSidebar } from "./analysis-sidebar"
import { ChatAnalytics } from "./chat-analytics"

interface StatisticsPanelProps {
  testData: {
    analysisData: any;
    currency: string;
  }
  currency: string;
  filters: {
    device_category: string[]
    item_category2: string[]
  }
  results: any
  isCollapsed: boolean
  onToolSelect: (tool: "comment" | "highlight" | "screenshot", data: { content: string }) => void
  onChatToggle: (isOpen: boolean) => void
}

export function StatisticsPanel({
  testData,
  currency,
  filters,
  results,
  isCollapsed,
  onToolSelect,
  onChatToggle
}: StatisticsPanelProps) {
  const [overviewData, setOverviewData] = React.useState<any>(null)
  const [isLoadingOverview, setIsLoadingOverview] = React.useState(false)
  const [analysisTable, setAnalysisTable] = React.useState<any>(null)
  const [isAnalysisMode, setIsAnalysisMode] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [notes, setNotes] = React.useState<any[]>([])
  const [activeTab, setActiveTab] = React.useState("overview")
  const [isChatOpen, setIsChatOpen] = React.useState(false)

  const revenueAnalysis = React.useMemo(() => (
    <RevenueAnalysis 
      data={testData} 
      isLoading={isLoadingOverview}
    />
  ), [testData, isLoadingOverview])

  // Mémorisation des contenus des tabs
  const tabContents = React.useMemo(() => ({
    overview: (
      <div className="h-full overflow-auto relative">
        <OverviewTable 
          data={overviewData} 
          isLoading={isLoadingOverview}
        />
      </div>
    ),
    engagement: <div>Engagement content</div>,
    funnel: <div>Funnel content</div>,
    revenue: (
      <div className="h-full overflow-auto">
        {revenueAnalysis}
      </div>
    ),
    raw: (
      <RawDataTable 
        data={testData} 
        currency={testData.currency || currency}
      />
    )
  }), [overviewData, isLoadingOverview, testData, currency, revenueAnalysis])

  const fetchOverviewData = React.useCallback(async () => {
    try {
      setIsLoadingOverview(true)
      const dataToSend = {
        overall: testData?.analysisData?.raw_data?.overall || [],
        transaction: testData?.analysisData?.raw_data?.transaction || []
      }
      
      const response = await fetch('http://localhost:8000/calculate-overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch overview data')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error('Invalid response format')
      }

      setOverviewData(result)
    } catch (error) {
      // Silent error
    } finally {
      setIsLoadingOverview(false)
    }
  }, [testData])

  React.useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  React.useEffect(() => {
    const loadNotes = () => {
      try {
        const savedNotes = localStorage.getItem("analysis-comments")
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes)
          setNotes(parsedNotes)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des notes:", error)
        setNotes([])
      }
    }

    loadNotes()
    window.addEventListener('storage', loadNotes)
    return () => window.removeEventListener('storage', loadNotes)
  }, [isAnalysisMode])

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen)
    onChatToggle(!isChatOpen)
  }

  const handleAnalysisModeToggle = () => {
    const newMode = !isAnalysisMode
    setIsAnalysisMode(newMode)
    if (!newMode) {
      setIsChatOpen(false)
      onChatToggle(false)
    }
  }

  return (
    <div className="h-full relative">
      <AnalysisToolsMenu onSelectTool={onToolSelect} isAnalysisMode={isAnalysisMode} activeTab={activeTab} filters={filters}>
        <Card 
          className={cn(
            "h-full w-full",
            "transition-all duration-300",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            isAnalysisMode && [
              "relative",
              "ring-1 ring-primary/50",
              "before:absolute before:inset-0 before:rounded-lg before:bg-primary/5"
            ]
          )}
        >
          {isAnalysisMode && (
            <div className="absolute -top-5 right-4 z-10 bg-primary/10 text-primary px-3 py-1 rounded-t-lg text-xs font-medium border border-primary/20">
              Analysis Mode
            </div>
          )}

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className={cn(
              "h-full flex flex-col",
              "relative",
              "overflow-hidden"
            )}
          >
            <div className={cn(
              "flex items-center justify-between border-b px-6 py-4 shrink-0",
              "sticky top-0 bg-background z-10",
              isAnalysisMode && "bg-primary/5"
            )}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="funnel">Funnel</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {isAnalysisMode && (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="relative"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground w-4 h-4 flex items-center justify-center rounded-full">
                          {notes.length}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleChatToggle}
                        className={cn(
                          "relative",
                          isChatOpen && "bg-primary/10 hover:bg-primary/20"
                        )}
                      >
                        <Bot className={cn(
                          "h-4 w-4",
                          isChatOpen && "text-primary"
                        )} />
                      </Button>
                    </div>

                    <div className="w-px h-4 bg-border mx-2" />
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAnalysisModeToggle}
                  className={cn(
                    "relative",
                    isAnalysisMode && [
                      "bg-primary/10 hover:bg-primary/20"
                    ]
                  )}
                >
                  <ClipboardEdit className={cn(
                    "h-4 w-4",
                    isAnalysisMode && "text-primary"
                  )} />
                </Button>
              </div>
            </div>

            <div className="flex-1 relative overflow-auto content-area">
              <TabsContent value="overview" className="p-6 absolute inset-0">
                {tabContents.overview}
              </TabsContent>

              <TabsContent value="engagement" className="p-6 absolute inset-0">
                {tabContents.engagement}
              </TabsContent>

              <TabsContent value="funnel" className="p-6 absolute inset-0">
                {tabContents.funnel}
              </TabsContent>

              <TabsContent value="revenue" className="p-6 absolute inset-0">
                {tabContents.revenue}
              </TabsContent>

              <TabsContent 
                value="raw" 
                className="absolute inset-0 overflow-hidden"
              >
                {tabContents.raw}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </AnalysisToolsMenu>

      <AnalysisSidebar 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </div>
  )
}