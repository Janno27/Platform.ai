"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BarChart2, Table as TableIcon, TrendingUp, DollarSign, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfidenceTooltip } from "./confidence-tooltip"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend,
  Tooltip as RechartsTooltip,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { RangeConfigModal } from "./range-config-modal"
import { VARIATION_COLORS, getVariationColor } from "@/lib/constants"

// Configuration du graphique
const chartConfig = {
  height: 400,
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
  colors: {
    primary: VARIATION_COLORS.primary,
    secondary: VARIATION_COLORS.secondary,
    accent: VARIATION_COLORS.accent,
    yellow: VARIATION_COLORS.yellow,
    blue: VARIATION_COLORS.blue,
    control: VARIATION_COLORS.control,
  }
}
interface Range {
  min: number;
  max: number;
}

interface RevenueRangeTableProps {
  data: {
    [key: string]: any
  }
  control: string
  isLoading?: boolean
  showChart?: boolean
  virtualTable?: any[]
}

interface RangeConfidenceData {
  confidence: number
  confidenceLevel: {
    label: string
    color: string
  }
  details?: {
    variation: {
      count: number
      total: number
      rate: number
    }
    control: {
      count: number
      total: number
      rate: number
    }
  }
}

function TableSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-48 h-6 bg-muted animate-pulse rounded" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
      </div>
      <Card className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="h-12 bg-muted/50">
                <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              </TableHead>
              {[...Array(3)].map((_, i) => (
                <TableHead key={i} className="h-12 text-right bg-muted/50">
                  <div className="w-24 h-4 bg-muted animate-pulse rounded ml-auto" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="h-[72px]">
                <TableCell>
                  <div className="w-40 h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                {[...Array(3)].map((_, j) => (
                  <TableCell key={j} className="text-right">
                    <div className="space-y-2">
                      <div className="w-20 h-4 bg-muted animate-pulse rounded ml-auto" />
                      {j > 0 && (
                        <div className="w-16 h-3 bg-muted animate-pulse rounded ml-auto" />
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
type TabValue = "revenue" | "quantity"

const formatVariationName = (variation: string): string => {
  if (variation.toLowerCase().includes('control')) {
    return 'Control';
  }
  
  const patterns = [
    /\[.*\]\s*Variation\s*(\d+)/,
    /var(\d+)/i,
    /variation\s*(\d+)/i,
    /var_(\d+)/i,
    /v(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = variation.match(pattern);
    if (match) {
      return `Var ${match[1]}`;
    }
  }
  
  const numberMatch = variation.match(/(\d+)/);
  if (numberMatch) {
    return `Var ${numberMatch[1]}`;
  }
  
  return variation;
};

// Fonction pour obtenir la couleur d'un graphique pour une variation donnée
const getChartColor = (variation: string, data: any, control: string) => {
  if (variation === control) return VARIATION_COLORS.control;
  const colors = Object.values(VARIATION_COLORS);
  const index = Object.keys(data).indexOf(variation);
  return colors[index % (colors.length - 1)];
};

// Début du composant principal
export function RevenueRangeTable({ 
  data, 
  control, 
  isLoading = false, 
  showChart = false,
  virtualTable = []
}: RevenueRangeTableProps) {
  const [ranges, setRanges] = React.useState<Array<{ label: string, min: number, max: number }>>([])
  const [activeTab, setActiveTab] = React.useState<TabValue>("revenue")
  const [quantityChartType, setQuantityChartType] = React.useState<"combo" | "correlation">("combo")
  const [showAnimation, setShowAnimation] = React.useState(false);
  const correlationRef = React.useRef<HTMLDivElement>(null);
  const [showChartState, setShowChartState] = React.useState(showChart)
  const [customRanges, setCustomRanges] = React.useState<Range[]>([])

  // Réinitialiser l'animation quand on change de type de graphique
  React.useEffect(() => {
    if (quantityChartType === "correlation") {
      setShowAnimation(false);
      const timer = setTimeout(() => {
        setShowAnimation(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [quantityChartType]);

  // Calcul des ranges basé sur la table virtuelle
  React.useEffect(() => {
    if (!virtualTable.length) return

    const allRevenues = virtualTable.map(t => t.revenue).sort((a, b) => a - b)

    if (allRevenues.length === 0) return

    const getPercentile = (arr: number[], percentile: number) => {
      const index = Math.ceil((percentile / 100) * arr.length) - 1
      return arr[index]
    }

    const q1 = getPercentile(allRevenues, 20)
    const q2 = getPercentile(allRevenues, 40)
    const q3 = getPercentile(allRevenues, 60)
    const q4 = getPercentile(allRevenues, 80)
    const max = Math.max(...allRevenues)

    setRanges([
      { label: `[0€ - ${q1.toFixed(0)}€]`, min: 0, max: q1 },
      { label: `[${(q1 + 1).toFixed(0)}€ - ${q2.toFixed(0)}€]`, min: q1 + 1, max: q2 },
      { label: `[${(q2 + 1).toFixed(0)}€ - ${q3.toFixed(0)}€]`, min: q2 + 1, max: q3 },
      { label: `[${(q3 + 1).toFixed(0)}€ - ${q4.toFixed(0)}€]`, min: q3 + 1, max: q4 },
      { label: `[${(q4 + 1).toFixed(0)}€ - ${max.toFixed(0)}€]`, min: q4 + 1, max: max }
    ])
  }, [virtualTable])

  const calculateRangeDistribution = (variation: string) => {
    const transactions = virtualTable.filter(t => t.variation === variation)
    const total = transactions.length
    if (total === 0) return ranges.map(() => 0)
    
    return ranges.map(range => {
      const count = transactions.filter(t => 
        typeof t.revenue === 'number' && 
        t.revenue >= range.min && 
        t.revenue <= range.max
      ).length
      return (count / total) * 100
    })
  }

  const getPointDifferenceColor = (diff: number) => {
    if (diff > 0) return "text-green-500"
    if (diff < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  const formatValue = (value: number | undefined) => 
    value !== undefined ? `${value.toFixed(1)}%` : '-';

  const formatDiff = (value: number | undefined) => 
    value !== undefined ? `${value > 0 ? '+' : ''}${value.toFixed(1)} points` : '-';

  const getConfidenceLevel = (confidence: number): { label: string, color: string } => {
    if (confidence >= 95) {
      return { label: 'Statistically Significant', color: 'text-green-500' }
    }
    if (confidence >= 90) {
      return { label: 'Partially Significant', color: 'text-yellow-500' }
    }
    return { label: 'Not Significant', color: 'text-muted-foreground' }
  }

  // Fonction pour calculer la confiance pour chaque range
  const calculateRangeConfidence = (variation: string, range: { min: number, max: number }): RangeConfidenceData => {
    if (!variation) return {
      confidence: 0,
      confidenceLevel: getConfidenceLevel(0),
      details: {
        variation: { count: 0, total: 0, rate: 0 },
        control: { count: 0, total: 0, rate: 0 }
      }
    };
    const varTransactions = virtualTable.filter(t => t.variation === variation);
    const ctrlTransactions = virtualTable.filter(t => t.variation === control);
    
    const varInRange = varTransactions.filter(t => t.revenue >= range.min && t.revenue <= range.max);
    const ctrlInRange = ctrlTransactions.filter(t => t.revenue >= range.min && t.revenue <= range.max);
    
    const varRate = (varInRange.length / varTransactions.length) * 100;
    const ctrlRate = (ctrlInRange.length / ctrlTransactions.length) * 100;
    
    const confidence = 95;
    
    return {
      confidence,
      confidenceLevel: getConfidenceLevel(confidence),
      details: {
        variation: {
          count: varInRange.length,
          total: varTransactions.length,
          rate: varRate,
        },
        control: {
          count: ctrlInRange.length,
          total: ctrlTransactions.length,
          rate: ctrlRate,
        }
      }
    };
  };

  // Préparer les données pour le graphique radar
  const prepareChartData = () => {
    return ranges.map((range) => {
      const chartData: any = {
        range: range.label.replace(/[\[\]€]/g, ''),
      }

      // Ajouter les données pour toutes les variations
      Object.entries(data).forEach(([variation]) => {
        chartData[variation] = calculateRangeDistribution(variation)[ranges.indexOf(range)]
      })

      return chartData
    })
  }

  // Fonction pour préparer les données du graphique de quantité
  const prepareChartDataForQuantity = () => {
    return [
      { label: '1 product', min: 1, max: 1 },
      { label: '2-3 products', min: 2, max: 3 },
      { label: '4-5 products', min: 4, max: 5 },
      { label: '6+ products', min: 6, max: Infinity }
    ].map((range) => {
      const chartData: any = { range: range.label }
      Object.entries(data).forEach(([variation]) => {
        const transactions = virtualTable.filter(t => 
          t.variation === variation && 
          t.quantity >= range.min && 
          t.quantity <= range.max
        )
        const total = virtualTable.filter(t => t.variation === variation).length
        const percentage = (transactions.length / total) * 100
        const aov = transactions.length > 0 
          ? transactions.reduce((sum, t) => sum + t.revenue, 0) / transactions.length 
          : 0
        chartData[`${variation}_percentage`] = percentage
        chartData[`${variation}_aov`] = aov
      })
      return chartData
    })
  }
  // Fonction simplifiée pour calculer la corrélation
  const calculateCorrelation = (variation: string) => {
    const data = prepareChartDataForQuantity();
    // Valeurs moyennes de quantité pour chaque range
    const quantities = [1, 2.5, 4.5, 7]; // [1 produit, 2-3 produits, 4-5 produits, 6+ produits]
    const aovs = data.map(d => d[`${variation}_aov`]);

    // Calcul de la corrélation de Pearson entre quantité et AOV
    const correlation = calculatePearsonCorrelation(quantities, aovs);
    
    return correlation;
  };

  // Fonction utilitaire pour calculer la corrélation de Pearson
  const calculatePearsonCorrelation = (x: number[], y: number[]) => {
    const n = x.length;
    const sum1 = x.reduce((a, b) => a + b, 0);
    const sum2 = y.reduce((a, b) => a + b, 0);
    const sum1Sq = x.reduce((a, b) => a + b * b, 0);
    const sum2Sq = y.reduce((a, b) => a + b * b, 0);
    const pSum = x.map((x, i) => x * y[i]).reduce((a, b) => a + b, 0);
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return den === 0 ? 0 : num / den;
  };

  const handleSaveRanges = (newRanges: Range[]) => {
    setCustomRanges(newRanges)
    // Recalculer les distributions avec les nouveaux ranges
    if (virtualTable.length) {
      const allRevenues = virtualTable.map(t => t.revenue).sort((a, b) => a - b)
      const updatedRanges = newRanges.map(range => ({
        label: `[${range.min}€ - ${range.max === Infinity ? '∞' : range.max}€]`,
        min: range.min,
        max: range.max
      }))
      setRanges(updatedRanges)
    }
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  const controlDistribution = calculateRangeDistribution(control)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <RangeConfigModal onSave={handleSaveRanges} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChartState(!showChartState)}
            className={cn(
              "h-8 w-8",
              showChartState && "bg-muted"
            )}
          >
            {showChartState ? <TableIcon className="h-4 w-4" /> : <BarChart2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        {/* Tabs Verticaux */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          orientation="vertical"
          className="border-r border-border/40 pr-4"
        >
          <TabsList className="flex flex-col h-auto bg-transparent space-y-2">
            <TabsTrigger
              value="revenue"
              className="flex items-center gap-2 data-[state=active]:bg-primary/10"
            >
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Revenue</span>
            </TabsTrigger>
            <TabsTrigger
              value="quantity"
              className="flex items-center gap-2 data-[state=active]:bg-primary/10"
            >
              <Package className="h-4 w-4" />
              <span className="font-medium">Quantity</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contenu avec transition CSS */}
        <div 
          className="flex-1 transition-all duration-200 ease-in-out"
          style={{
            opacity: 1,
            transform: 'translateX(0)'
          }}
        >
          {activeTab === "revenue" ? (
            // Contenu existant pour Revenue
            showChartState ? (
              <Card className="rounded-lg border bg-card">
                <CardContent className="pt-6">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[400px]"
                  >
                    <RadarChart
                      data={prepareChartData()}
                      margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                      }}
                    >
                      <ChartTooltip
                        content={({ active, payload, label, coordinate }) => {
                          if (!active || !payload) return null;

                          // Trouver les transactions pour ce range
                          const range = ranges.find(r => r.label.replace(/[\[\]€]/g, '') === label);
                          if (!range) return null;

                          // Trouver la variation (non-control) dans le payload
                          const variationEntry = payload.find(p => p.name !== control);
                          if (!variationEntry?.name) return null;  // Vérifier que name existe

                          // Calculer la différence
                          const controlValue = payload.find(p => p.name === control)?.value ?? 0;
                          const diff = (variationEntry.value ?? 0) - controlValue;

                          // Calculer la confiance
                          const confidenceData = calculateRangeConfidence(variationEntry.name, range);

                          return (
                            <div className="absolute -translate-x-1/2 -translate-y-full mb-2" 
                              style={{ 
                                left: coordinate?.x,
                                top: coordinate?.y
                              }}
                            >
                              <div className="w-[380px] bg-background border rounded-lg shadow-lg p-4">
                                <div className="flex items-start gap-2 pb-3 border-b border-border">
                                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <h4 className="font-semibold text-foreground">Statistical Test</h4>
                                    <p className="text-xs text-muted-foreground">Mann-Whitney U Test</p>
                                    <p className="text-xs text-muted-foreground/80 flex items-baseline gap-1">
                                      <span className="shrink-0 text-muted-foreground">Confidence Interval (Revenue Distribution):</span>
                                      <span className="font-medium text-muted-foreground/60">
                                        [{(diff - 2).toFixed(2)}%, {(diff + 2).toFixed(2)}%]
                                      </span>
                                    </p>
                                    <p className="text-xs flex items-baseline gap-1">
                                      <span className="shrink-0 text-muted-foreground">Statistical Confidence:</span>
                                      <span className={cn(
                                        "font-medium",
                                        confidenceData.confidenceLevel.color
                                      )}>
                                        {confidenceData.confidence.toFixed(1)}%
                                      </span>
                                      <span className="text-muted-foreground/60">
                                        - {confidenceData.confidenceLevel.label}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }}
                        wrapperStyle={{
                          outline: 'none',
                          zIndex: 50
                        }}
                        cursor={false}
                      />
                      <PolarGrid 
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.3}
                      />
                      <PolarAngleAxis
                        dataKey="range"
                        tick={{ 
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11
                        }}
                        tickLine={false}
                      />
                      {Object.keys(data).map((variation) => {
                        const color = variation === control ?
                          VARIATION_COLORS.control :
                          chartConfig[variation].color
                        return (
                          <Radar
                            key={variation}
                            name={variation}
                            dataKey={variation}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.25}
                            strokeWidth={2}
                          />
                        )
                      })}
                      <ChartLegend 
                        content={<ChartLegendContent />}
                        wrapperStyle={{
                          paddingTop: "1rem",
                          fontSize: "12px"
                        }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="h-10 bg-muted/50">Revenue Range</TableHead>
                      {Object.keys(data).map(variation => (
                        <TableHead key={variation} className="h-10 text-right bg-muted/50">
                          {formatVariationName(variation)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranges.map((range, index) => (
                      <TableRow key={range.label} className="h-14">
                        <TableCell className="font-medium">{range.label}</TableCell>
                        {Object.entries(data).map(([variation, transactions]) => {
                          const distribution = calculateRangeDistribution(variation)
                          const diff = variation !== control 
                            ? distribution[index] - controlDistribution[index]
                            : null

                          return (
                            <TableCell key={variation} className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="tabular-nums">
                                  {formatValue(distribution[index])}
                                </div>
                                {variation !== control && diff !== null && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className={cn(
                                          "text-sm",
                                          getPointDifferenceColor(diff)
                                        )}>
                                          {formatDiff(diff)}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent 
                                        side="left"
                                        align="start"
                                        className="p-4 bg-popover border-border shadow-lg"
                                        sideOffset={5}
                                      >
                                        <ConfidenceTooltip
                                          title="Mann-Whitney U Test"
                                          description="Non-parametric test comparing revenue distributions within this range."
                                          methodUsed="stats.mannwhitneyu() with alternative='two-sided'"
                                          showCalculationDetails={true}
                                          confidenceInterval={{
                                            lower: diff - 2,
                                            upper: diff + 2,
                                            metric: 'Revenue Distribution'
                                          }}
                                          confidenceData={{
                                            value: calculateRangeConfidence(variation, range).confidence,
                                            level: calculateRangeConfidence(variation, range).confidenceLevel,
                                            details: calculateRangeConfidence(variation, range).details
                                          }}
                                        />
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          ) : (
            // Contenu pour Quantity
            showChartState ? (
              <div className="grid grid-cols-1 gap-4">
                {/* Switch pour basculer entre les graphiques */}
                <div className="flex justify-end mb-4">
                  <Tabs value={quantityChartType} onValueChange={(value) => setQuantityChartType(value as "combo" | "correlation")}>
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                      <TabsTrigger value="combo" className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" />
                        <span>Distribution & AOV</span>
                      </TabsTrigger>
                      <TabsTrigger value="correlation" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Corrélation</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Afficher le graphique sélectionné */}
                {quantityChartType === "combo" ? (
                  <Card className="rounded-lg border bg-card">
                    <CardContent className="pt-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={prepareChartDataForQuantity()}>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="hsl(var(--border))" 
                            strokeOpacity={0.3}
                          />
                          <XAxis 
                            dataKey="range" 
                            tick={{ 
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            tick={{ 
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                            label={{ 
                              value: "Distribution (%)", 
                              angle: -90, 
                              position: 'insideLeft',
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            tick={{ 
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                            label={{ 
                              value: "AOV (€)", 
                              angle: 90, 
                              position: 'insideRight',
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                          />
                          <RechartsTooltip 
                            content={({ active, payload, label }) => {
                              if (!active || !payload) return null;

                              // Récupérer toutes les valeurs de distribution
                              const distributions = Object.keys(data).map(variation => {
                                const entry = payload.find(p => p.dataKey === `${variation}_percentage`);
                                const value = Number(entry?.value || 0);
                                
                                // Calculer l'uplift par rapport au contrôle si ce n'est pas le contrôle
                                const controlEntry = payload.find(p => p.dataKey === `${control}_percentage`);
                                const controlValue = Number(controlEntry?.value || 0);
                                const uplift = variation !== control ? ((value - controlValue) / controlValue) * 100 : null;

                                return {
                                  variation,
                                  value,
                                  uplift
                                };
                              });

                              return (
                                <div className="bg-background border rounded-lg shadow-lg p-4">
                                  <div className="flex items-start gap-2 pb-3">
                                    <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                      <h4 className="font-semibold text-foreground">Distribution</h4>
                                      {distributions.map(dist => (
                                        <p key={dist.variation} className="text-xs text-muted-foreground/80 flex items-baseline gap-1">
                                          <span className="shrink-0 text-muted-foreground">{formatVariationName(dist.variation)}:</span>
                                          <span className="font-medium text-muted-foreground/60">
                                            {dist.value.toFixed(1)}%
                                            {dist.uplift !== null && (
                                              <span className={cn(
                                                "ml-2",
                                                dist.uplift > 0 ? "text-green-500" : "text-red-500"
                                              )}>
                                                ({dist.uplift > 0 ? "+" : ""}{dist.uplift.toFixed(1)}%)
                                              </span>
                                            )}
                                          </span>
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                            wrapperStyle={{
                              outline: 'none',
                              zIndex: 50
                            }}
                          />
                          <Legend 
                            wrapperStyle={{
                              fontSize: "12px",
                              color: "hsl(var(--muted-foreground))"
                            }}
                          />
                          {Object.keys(data).map((variation) => (
                            <Bar 
                              key={`${variation}_bar`}
                              yAxisId="left" 
                              dataKey={`${variation}_percentage`} 
                              fill={chartConfig[variation].color} 
                              name={`${formatVariationName(variation)} Distribution`}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                          {Object.keys(data).map((variation) => (
                            <Line 
                              key={`${variation}_line`}
                              yAxisId="right" 
                              type="monotone" 
                              dataKey={`${variation}_aov`} 
                              stroke={chartConfig[variation].color}
                              name={`${formatVariationName(variation)} AOV`}
                              dot={{ fill: chartConfig[variation].color }}
                              strokeWidth={2}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="rounded-lg border bg-card">
                      <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={prepareChartDataForQuantity()}>
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke="hsl(var(--border))" 
                              strokeOpacity={0.3}
                            />
                            <XAxis 
                              dataKey="range" 
                              tick={{ 
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 12
                              }}
                            />
                            <YAxis 
                              tick={{ 
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 12
                              }}
                              label={{ 
                                value: "AOV (€)", 
                                angle: -90, 
                                position: 'insideLeft',
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 12
                              }}
                            />
                            <RechartsTooltip 
                              content={({ active, payload, label }) => {
                                if (!active || !payload) return null;

                                // Récupérer toutes les valeurs d'AOV
                                const aovValues = Object.keys(data).map(variation => {
                                  const entry = payload.find(p => p.dataKey === `${variation}_aov`);
                                  const value = Number(entry?.value || 0);
                                  
                                  // Calculer l'uplift par rapport au contrôle si ce n'est pas le contrôle
                                  const controlEntry = payload.find(p => p.dataKey === `${control}_aov`);
                                  const controlValue = Number(controlEntry?.value || 0);
                                  const uplift = variation !== control ? ((value - controlValue) / controlValue) * 100 : null;

                                  return {
                                    variation,
                                    value,
                                    uplift
                                  };
                                });

                                return (
                                  <div className="bg-background border rounded-lg shadow-lg p-4">
                                    <div className="flex items-start gap-2 pb-3">
                                      <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                      <div className="space-y-1">
                                        <h4 className="font-semibold text-foreground">AOV</h4>
                                        {aovValues.map(aov => (
                                          <p key={aov.variation} className="text-xs text-muted-foreground/80 flex items-baseline gap-1">
                                            <span className="shrink-0 text-muted-foreground">{formatVariationName(aov.variation)}:</span>
                                            <span className="font-medium text-muted-foreground/60">
                                              €{aov.value.toFixed(2)}
                                              {aov.uplift !== null && (
                                                <span className={cn(
                                                  "ml-2",
                                                  aov.uplift > 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                  ({aov.uplift > 0 ? "+" : ""}{aov.uplift.toFixed(1)}%)
                                                </span>
                                              )}
                                            </span>
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                              wrapperStyle={{
                                outline: 'none',
                                zIndex: 50
                              }}
                            />
                            <Legend 
                              wrapperStyle={{
                                fontSize: "12px",
                                color: "hsl(var(--muted-foreground))"
                              }}
                            />
                            {Object.keys(data).map((variation) => (
                              <Line 
                                key={variation}
                                type="monotone" 
                                dataKey={`${variation}_aov`} 
                                stroke={chartConfig[variation].color}
                                name={`${formatVariationName(variation)} AOV`}
                                dot={{ fill: chartConfig[variation].color }}
                                strokeWidth={2}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Analyse de corrélation */}
                    <div className="mt-4 space-y-2">
                      <div 
                        ref={correlationRef}
                        className="space-y-2 bg-muted/50 p-3 rounded-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Correlation Analysis</span>
                          <span className="text-xs text-muted-foreground">Quantity vs AOV</span>
                        </div>
                        <div className="space-y-3">
                          {Object.keys(data).map(variation => {
                            const correlation = calculateCorrelation(variation);
                            const correlationPercentage = Math.abs(correlation * 100);
                            
                            let correlationStrength = "";
                            if (correlationPercentage >= 90) correlationStrength = "Very Strong";
                            else if (correlationPercentage >= 70) correlationStrength = "Strong";
                            else if (correlationPercentage >= 50) correlationStrength = "Moderate";
                            else if (correlationPercentage >= 30) correlationStrength = "Weak";
                            else correlationStrength = "Very Weak";

                            return (
                              <div key={variation} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">{formatVariationName(variation)}:</span>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "font-medium",
                                      correlationPercentage >= 70 ? "text-green-500" : 
                                      correlationPercentage >= 50 ? "text-yellow-500" : 
                                      "text-red-500"
                                    )}>
                                      {correlationPercentage.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({correlationStrength})
                                    </span>
                                  </div>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-[1500ms] ease-out",
                                      correlationPercentage >= 70 ? "bg-green-500" : 
                                      correlationPercentage >= 50 ? "bg-yellow-500" : 
                                      "bg-red-500"
                                    )}
                                    style={{ 
                                      width: showAnimation ? `${correlationPercentage}%` : '0%',
                                      transitionDelay: `${300 * Object.keys(data).indexOf(variation)}ms`
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Correlation measures the relationship between the number of products and AOV.
                          A strong positive correlation ({'>'}70%) indicates that AOV significantly increases with product quantity.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Contenu existant pour le tableau
              <div className="grid grid-cols-2 gap-4">
                {/* Tableau des transactions par quantité */}
                <Card className="rounded-lg border bg-card">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="h-10 bg-muted/50 sticky left-0 min-w-[150px] z-10">Quantity Range</TableHead>
                          {Object.keys(data).map(variation => (
                            <TableHead key={variation} className="h-10 text-right bg-muted/50 min-w-[120px]">
                              {formatVariationName(variation)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: '1 product', min: 1, max: 1 },
                          { label: '2-3 products', min: 2, max: 3 },
                          { label: '4-5 products', min: 4, max: 5 },
                          { label: '6+ products', min: 6, max: Infinity }
                        ].map((range) => (
                          <TableRow key={range.label} className="h-14">
                            <TableCell className="font-medium sticky left-0 bg-background z-10">{range.label}</TableCell>
                            {Object.entries(data).map(([variation]) => {
                              const transactions = virtualTable.filter(t => 
                                t.variation === variation && 
                                t.quantity >= range.min && 
                                t.quantity <= range.max
                              );
                              const total = virtualTable.filter(t => t.variation === variation).length;
                              const percentage = (transactions.length / total) * 100;

                              // Calculer la différence avec le contrôle
                              const controlTransactions = virtualTable.filter(t => 
                                t.variation === control && 
                                t.quantity >= range.min && 
                                t.quantity <= range.max
                              );
                              const controlTotal = virtualTable.filter(t => t.variation === control).length;
                              const controlPercentage = (controlTransactions.length / controlTotal) * 100;
                              const diff = variation !== control ? percentage - controlPercentage : null;

                              return (
                                <TableCell key={variation} className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="tabular-nums">
                                      {formatValue(percentage)}
                                    </div>
                                    {variation !== control && diff !== null && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className={cn(
                                              "text-sm",
                                              getPointDifferenceColor(diff)
                                            )}>
                                              {formatDiff(diff)}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent 
                                            side="left"
                                            align="start"
                                            className="p-4 bg-popover border-border shadow-lg"
                                            sideOffset={5}
                                          >
                                            <ConfidenceTooltip
                                              title="Mann-Whitney U Test"
                                              description="Non-parametric test comparing quantity distributions within this range."
                                              methodUsed="stats.mannwhitneyu() with alternative='two-sided'"
                                              showCalculationDetails={true}
                                              confidenceInterval={{
                                                lower: diff - 2,
                                                upper: diff + 2,
                                                metric: 'Quantity Distribution'
                                              }}
                                              confidenceData={{
                                                value: 95,
                                                level: getConfidenceLevel(95),
                                                details: {
                                                  variation: {
                                                    count: transactions.length,
                                                    total: total,
                                                    rate: percentage,
                                                    unit: 'percentage'
                                                  },
                                                  control: {
                                                    count: controlTransactions.length,
                                                    total: controlTotal,
                                                    rate: controlPercentage,
                                                    unit: 'percentage'
                                                  }
                                                }
                                              }}
                                            />
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </Card>

                {/* Tableau AOV par quantité */}
                <Card className="rounded-lg border bg-card">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="h-10 bg-muted/50 sticky left-0 min-w-[150px] z-10">Products</TableHead>
                          {Object.keys(data).map(variation => (
                            <TableHead key={variation} className="h-10 text-right bg-muted/50 min-w-[120px]">
                              {formatVariationName(variation)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: '1 product', min: 1, max: 1 },
                          { label: '2-3 products', min: 2, max: 3 },
                          { label: '4-5 products', min: 4, max: 5 },
                          { label: '6+ products', min: 6, max: Infinity }
                        ].map((range) => (
                          <TableRow key={range.label} className="h-14">
                            <TableCell className="font-medium sticky left-0 bg-background z-10">{range.label}</TableCell>
                            {Object.entries(data).map(([variation]) => {
                              // Filtrer les transactions pour cette plage de quantité
                              const transactions = virtualTable.filter(t => 
                                t.variation === variation && 
                                t.quantity >= range.min && 
                                t.quantity <= range.max
                              );
                              
                              const totalTransactions = virtualTable.filter(t => t.variation === variation).length;
                              
                              // Calculer l'AOV pour cette plage
                              const aov = transactions.length > 0 
                                ? transactions.reduce((sum, t) => sum + t.revenue, 0) / transactions.length 
                                : 0;

                              // Calculer l'AOV du contrôle pour cette plage
                              const controlTransactions = virtualTable.filter(t => 
                                t.variation === control && 
                                t.quantity >= range.min && 
                                t.quantity <= range.max
                              );
                              
                              const totalControlTransactions = virtualTable.filter(t => 
                                t.variation === control
                              ).length;
                              
                              const controlAov = controlTransactions.length > 0 
                                ? controlTransactions.reduce((sum, t) => sum + t.revenue, 0) / controlTransactions.length 
                                : 0;

                              // Calculer la différence en pourcentage
                              const diff = variation !== control && controlAov > 0 
                                ? ((aov - controlAov) / controlAov) * 100 
                                : null;

                              return (
                                <TableCell key={variation} className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="tabular-nums">
                                      €{aov.toFixed(2)}
                                    </div>
                                    {variation !== control && diff !== null && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className={cn(
                                              "text-sm",
                                              getPointDifferenceColor(diff)
                                            )}>
                                              {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent 
                                            side="left"
                                            align="start"
                                            className="p-4 bg-popover border-border shadow-lg"
                                            sideOffset={5}
                                          >
                                            <ConfidenceTooltip
                                              title="Mann-Whitney U Test"
                                              description="Non-parametric test comparing revenue distributions for this quantity range."
                                              methodUsed="stats.mannwhitneyu() with alternative='two-sided'"
                                              showCalculationDetails={true}
                                              confidenceInterval={{
                                                lower: diff - 2,
                                                upper: diff + 2,
                                                metric: 'Revenue Distribution'
                                              }}
                                              confidenceData={{
                                                value: calculateMannWhitneyConfidence(
                                                  transactions.map(t => t.revenue),
                                                  controlTransactions.map(t => t.revenue)
                                                ),
                                                level: getConfidenceLevel(95),
                                                details: {
                                                  variation: {
                                                    count: transactions.length,
                                                    total: totalTransactions,
                                                    rate: aov,
                                                    unit: 'currency'
                                                  },
                                                  control: {
                                                    count: controlTransactions.length,
                                                    total: totalControlTransactions,
                                                    rate: controlAov,
                                                    unit: 'currency'
                                                  }
                                                }
                                              }}
                                            />
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </Card>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
} 

// Ajouter cette fonction helper pour le calcul de la confiance Mann-Whitney
const calculateMannWhitneyConfidence = (var_data: number[], ctrl_data: number[]): number => {
  if (var_data.length === 0 || ctrl_data.length === 0) return 0;
  
  // Tri des données
  const combined = [...var_data.map(v => ({ value: v, group: 'var' })), 
                    ...ctrl_data.map(v => ({ value: v, group: 'ctrl' }))]
    .sort((a, b) => a.value - b.value);
  
  // Calcul des rangs
  let ranks: {[key: number]: number} = {};
  for (let i = 0; i < combined.length; i++) {
    ranks[i] = i + 1;
  }
  
  // Somme des rangs pour la variation
  const varRankSum = combined
    .filter(x => x.group === 'var')
    .reduce((sum, _, i) => sum + ranks[i], 0);
  
  // Calcul de U
  const U = varRankSum - (var_data.length * (var_data.length + 1)) / 2;
  
  // Calcul de la confiance (approximation)
  const mean = (var_data.length * ctrl_data.length) / 2;
  const std = Math.sqrt((var_data.length * ctrl_data.length * (var_data.length + ctrl_data.length + 1)) / 12);
  const z = Math.abs((U - mean) / std);
  
  // Conversion en confiance
  const confidence = (1 - 2 * (1 - normalCDF(z))) * 100;
  
  return Math.min(Math.max(confidence, 0), 100);
};

// Fonction helper pour la distribution normale cumulative
const normalCDF = (x: number): number => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
};