"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area
} from "recharts"
import { TrendingUp, BarChart2, ListFilter } from "lucide-react"
import { ConfidenceTooltip } from "./confidence-tooltip"
import { VARIATION_COLORS, getVariationColor } from "@/lib/constants"
import { calculateBootstrapDistribution } from "@/lib/statistics";
import { Slider } from "@/components/ui/slider"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface Transaction {
  transaction_id: string
  variation: string
  revenue: number
  item_category2: string
  device_category: string
}

type ChartType = "distribution" | "uplift" | "category"
type TabValue = "revenue" | "quantity"

interface RevenueStatsProps {
  virtualTable: any[]
  filters: {
    device_category: string[]
    item_category2: string[]
  }
  control: string
  data: {
    [key: string]: any
  }
}

// Nouvelles interfaces pour les statistiques
interface DistributionStats {
  median: number;
  mean: number;
  p25: number;
  p75: number;
  sampleSize: number;
}

interface DistributionData {
  range: number;
  rangeEnd: number;
  [key: string]: number | { value: number; stats: DistributionStats } | undefined;
}

// Ajouter la fonction formatVariationName
const formatVariationName = (variation: string): string => {
  // Si c'est le contrôle, retourner "Control"
  if (variation.toLowerCase().includes('control')) {
    return 'Control';
  }
  
  // Chercher différents patterns pour les variations
  const patterns = [
    /\[.*\]\s*Variation\s*(\d+)/,  // [1630345] Variation 1
    /var(\d+)/i,                   // var1
    /variation\s*(\d+)/i,          // variation1
    /v(\d+)/i                      // v1
  ];

  for (const pattern of patterns) {
    const match = variation.match(pattern);
    if (match) {
      return `Var ${match[1]}`;
    }
  }
  
  return variation;
};

// Corriger le typage du tooltip
interface TooltipDetails {
  variation: {
    count: number;
    total: number;
    rate: number;
    unit?: 'currency' | 'percentage' | 'quantity';
  };
  control: {
    count: number;
    total: number;
    rate: number;
    unit?: 'currency' | 'percentage' | 'quantity';
  };
}

// Ajouter la constante confidenceInterval
const CONFIDENCE_INTERVAL = 0.95;

// Ajouter cette fonction utilitaire
const calculateUpliftData = (
  virtualTable: Transaction[], 
  control: string,
  bootstrapIterations = 1000,
  confidenceInterval = CONFIDENCE_INTERVAL
) => {
  // Séparer les données contrôle et variation
  const controlData = virtualTable.filter(t => t.variation === control).map(t => t.revenue);
  const variationData = virtualTable.filter(t => t.variation !== control).map(t => t.revenue);

  // Calculer la différence moyenne observée
  const controlMean = controlData.reduce((a, b) => a + b, 0) / controlData.length;
  const variationMean = variationData.reduce((a, b) => a + b, 0) / variationData.length;
  const observedDiff = ((variationMean - controlMean) / controlMean) * 100;

  // Générer la distribution bootstrap
  const bootstrapDiffs = Array.from({ length: bootstrapIterations }, () => {
    // Échantillonnage avec remplacement
    const bootControl = Array.from({ length: controlData.length }, () => 
      controlData[Math.floor(Math.random() * controlData.length)]
    );
    const bootVariation = Array.from({ length: variationData.length }, () => 
      variationData[Math.floor(Math.random() * variationData.length)]
    );

    // Calculer la différence pour cet échantillon
    const bootControlMean = bootControl.reduce((a, b) => a + b, 0) / bootControl.length;
    const bootVariationMean = bootVariation.reduce((a, b) => a + b, 0) / bootVariation.length;
    return ((bootVariationMean - bootControlMean) / bootControlMean) * 100;
  }).sort((a, b) => a - b);

  // Calculer les intervalles de confiance
  const alpha = (1 - confidenceInterval) / 2;
  const ciLower = bootstrapDiffs[Math.floor(alpha * bootstrapIterations)];
  const ciUpper = bootstrapDiffs[Math.floor((1 - alpha) * bootstrapIterations)];

  // Créer les données pour l'histogramme
  const bucketSize = (ciUpper - ciLower) / 30;
  const distribution = bootstrapDiffs.reduce((acc, diff) => {
    const bucket = Math.floor((diff - ciLower) / bucketSize);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    distribution: Object.entries(distribution).map(([bucket, count]) => ({
      uplift: ciLower + Number(bucket) * bucketSize,
      frequency: count / bootstrapIterations * 100
    })),
    observedDiff,
    ciLower,
    ciUpper,
    pValue: bootstrapDiffs.filter(d => d <= 0).length / bootstrapIterations
  };
};

export function RevenueStatistics({ virtualTable, filters, control, data }: RevenueStatsProps) {
  const [activeTab, setActiveTab] = React.useState<ChartType>("distribution")
  const [confidenceLevel, setConfidenceLevel] = React.useState(95)
  const [selectedMetric, setSelectedMetric] = React.useState<string>("distribution")

  // Log des props reçues
  React.useEffect(() => {
    console.group('RevenueStatistics Props');
    console.log('Virtual Table Length:', virtualTable?.length);
    console.log('Virtual Table Sample:', virtualTable?.slice(0, 2));
    console.log('Control:', control);
    console.log('Data:', data);
    console.log('Filters:', filters);
    console.groupEnd();
  }, [virtualTable, control, data, filters]);

  // Ajouter la fonction localement
  const getConfidenceLevel = (confidence: number): { label: string, color: string } => {
    if (confidence >= 95) {
      return { label: 'Statistically Significant', color: 'text-green-500' }
    }
    if (confidence >= 90) {
      return { label: 'Partially Significant', color: 'text-yellow-500' }
    }
    return { label: 'Not Significant', color: 'text-muted-foreground' }
  }

  const calculateStatistics = (transactions: Transaction[]) => {
    const revenues = transactions.map(t => t.revenue).sort((a, b) => a - b);
    const len = revenues.length;
    
    return {
      median: revenues[Math.floor(len / 2)],
      mean: revenues.reduce((a, b) => a + b, 0) / len,
      q1: revenues[Math.floor(len / 4)],
      q3: revenues[Math.floor(3 * len / 4)],
      total: revenues.reduce((a, b) => a + b, 0),
      count: len
    };
  };

  const prepareDistributionData = () => {
    // Définir des buckets fixes avec des intervalles plus logiques
    const buckets = [
      0, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000
    ];

    return buckets.map((value, index) => {
      const nextValue = buckets[index + 1] || value * 1.5;
      const result: any = {
        range: value,
        rangeEnd: nextValue,
        label: `€${value} - €${nextValue}`
      };

      // Calculer les statistiques pour chaque variation
      Object.keys(data).forEach(variation => {
        const transactions = virtualTable.filter(t => 
          t.variation === variation &&
          t.revenue >= value &&
          t.revenue < nextValue
        );

        const allTransactions = virtualTable.filter(t => t.variation === variation);
        const density = (transactions.length / allTransactions.length) * 100;

        result[`${variation}_density`] = density;
        result[`${variation}_stats`] = {
          count: transactions.length,
          total: allTransactions.length,
          mean: transactions.length > 0 
            ? transactions.reduce((sum, t) => sum + t.revenue, 0) / transactions.length 
            : 0
        };
      });

      return result;
    }).filter(bucket => {
      // Ne garder que les buckets qui ont des données
      return Object.keys(data).some(variation => bucket[`${variation}_density`] > 0);
    });
  };

  // Log à chaque changement de graphique
  React.useEffect(() => {
    console.log('Active chart changed to:', activeTab);
  }, [activeTab]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Switch pour basculer entre les graphiques */}
      <div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartType)}>
          <TabsList className="h-9 w-fit bg-muted p-1 rounded-lg">
            <TabsTrigger 
              value="distribution" 
              className="h-7 px-3 rounded data-[state=active]:bg-background"
            >
              Distribution
            </TabsTrigger>
            <TabsTrigger 
              value="uplift" 
              className="h-7 px-3 rounded data-[state=active]:bg-background"
            >
              Uplift
            </TabsTrigger>
            <TabsTrigger 
              value="category" 
              className="h-7 px-3 rounded data-[state=active]:bg-background"
            >
              Category
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Contrôle du niveau de confiance */}
      {activeTab === "uplift" && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Confidence Level: {confidenceLevel}%
            </label>
            <p className="text-xs text-muted-foreground">
              Adjust the statistical confidence level for the analysis
            </p>
          </div>
          <div className="flex-1 px-4">
            <Slider
              value={[confidenceLevel]}
              onValueChange={([value]) => setConfidenceLevel(value)}
              min={80}
              max={99}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Contenu du graphique */}
      <Card className="rounded-lg border bg-card">
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            {(() => {
              switch (activeTab) {
                case "distribution":
                  return (
                    <LineChart 
                      data={prepareDistributionData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                      
                      <XAxis 
                        dataKey="label"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      
                      <YAxis 
                        domain={[0, 'auto']}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        label={{ 
                          value: "Distribution (%)", 
                          angle: -90, 
                          position: 'insideLeft',
                          fill: "hsl(var(--muted-foreground))"
                        }}
                      />

                      {/* Zones de densité avec les couleurs de revenue-analysis */}
                      {Object.keys(data).map((variation, index) => (
                        <Area
                          key={`${variation}-area`}
                          type="basis"
                          dataKey={`${variation}_density`}
                          stroke="none"
                          fill={getVariationColor(variation, control, index)}
                          fillOpacity={0.1}
                        />
                      ))}

                      {/* Lignes de distribution avec les mêmes couleurs */}
                      {Object.keys(data).map((variation, index) => (
                        <Line
                          key={variation}
                          type="monotone"
                          dataKey={`${variation}_density`}
                          stroke={getVariationColor(variation, control, index)}
                          strokeWidth={2}
                          dot={(props) => {
                            const value = props.payload[`${variation}_density`];
                            if (value > 5) {
                              return (
                                <circle
                                  cx={props.cx}
                                  cy={props.cy}
                                  r={4}
                                  fill={getVariationColor(variation, control, index)}
                                  stroke="white"
                                  strokeWidth={2}
                                />
                              );
                            }
                            return null;
                          }}
                          activeDot={{
                            r: 6,
                            stroke: "white",
                            strokeWidth: 2,
                            fill: getVariationColor(variation, control, index)
                          }}
                        />
                      ))}

                      {/* Lignes de référence pour les médianes avec les mêmes couleurs */}
                      {Object.keys(data).map((variation, index) => {
                        const stats = calculateStatistics(virtualTable.filter(t => t.variation === variation));
                        return (
                          <ReferenceLine
                            key={`median-${variation}`}
                            x={stats.median}
                            stroke={getVariationColor(variation, control, index)}
                            strokeDasharray="3 3"
                            label={{
                              value: `Median ${formatVariationName(variation)}`,
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 10
                            }}
                          />
                        );
                      })}

                      {/* Tooltip avec les mêmes couleurs */}
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.[0]) return null;

                          const currentRange = payload[0].payload;
                          const variations = Object.keys(data);
                          const variationKey = variations.find(k => k !== control);
                          const controlStats = currentRange[`${control}_stats`];
                          const variationStats = currentRange[`${variationKey}_stats`];

                          return (
                            <div className="w-[380px] bg-white border rounded-lg shadow-lg p-4">
                              <ConfidenceTooltip
                                title="Statistical Test"
                                description="Revenue Distribution Analysis"
                                methodUsed="Mann-Whitney U Test"
                                showCalculationDetails={true}
                                confidenceInterval={{
                                  lower: currentRange.range,
                                  upper: currentRange.rangeEnd,
                                  metric: 'Revenue'
                                }}
                                confidenceData={{
                                  value: 95,
                                  level: getConfidenceLevel(95),
                                  details: {
                                    control: {
                                      count: controlStats.count,
                                      total: controlStats.total,
                                      rate: controlStats.mean,
                                      unit: 'currency'
                                    },
                                    variation: {
                                      count: variationStats.count,
                                      total: variationStats.total,
                                      rate: variationStats.mean,
                                      unit: 'currency'
                                    }
                                  }
                                }}
                              >
                                <div className="mt-4 pt-4 border-t border-border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Distribution:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        {currentRange[`${control}_density`].toFixed(1)}% vs {currentRange[`${variationKey}_density`].toFixed(1)}%
                                      </span>
                                      <span className={cn(
                                        "text-sm font-medium",
                                        variationStats.mean > controlStats.mean ? "text-green-500" : "text-red-500"
                                      )}>
                                        ({variationStats.mean > controlStats.mean ? "+" : ""}{((variationStats.mean - controlStats.mean) / controlStats.mean * 100).toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </ConfidenceTooltip>
                            </div>
                          );
                        }}
                        wrapperStyle={{ 
                          zIndex: 1000,
                          outline: 'none'
                        }}
                        cursor={{ strokeDasharray: '3 3' }}
                        allowEscapeViewBox={{ x: false, y: true }}
                        position={{ x: 'auto', y: 'auto' }}
                      />
                    </LineChart>
                  );
                case "uplift":
                  const upliftData = calculateUpliftData(virtualTable, control, 1000, confidenceLevel / 100);
                  return (
                    <BarChart 
                      data={upliftData.distribution}
                      margin={{ top: 20, right: 30, bottom: 30, left: 40 }}
                    >
                      <defs>
                        <linearGradient id="upliftGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      
                      <XAxis
                        dataKey="uplift"
                        type="number"
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        label={{ 
                          value: "Revenue Uplift (%)", 
                          position: "bottom",
                          offset: 20,
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12
                        }}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      
                      <YAxis
                        label={{ 
                          value: "Frequency (%)", 
                          angle: -90, 
                          position: "left",
                          offset: 10,
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12
                        }}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />

                      <Bar
                        dataKey="frequency"
                        fill="url(#upliftGradient)"
                        radius={[4, 4, 0, 0]}
                      >
                        {/* Ajout d'étiquettes pour les barres significatives */}
                        {upliftData.distribution.map((entry, index) => (
                          entry.frequency > 5 && (
                            <text
                              key={`label-${index}`}
                              x={0}
                              y={0}
                              dy={-6}
                              fill="hsl(var(--muted-foreground))"
                              fontSize={10}
                              textAnchor="middle"
                            >
                              {entry.frequency.toFixed(1)}%
                            </text>
                          )
                        ))}
                      </Bar>

                      {/* Ligne observée */}
                      <ReferenceLine
                        x={upliftData.observedDiff}
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        label={{
                          value: "Observed",
                          position: "top",
                          fill: "hsl(var(--destructive))",
                          fontSize: 11
                        }}
                      />

                      {/* Intervalles de confiance */}
                      <ReferenceLine
                        x={upliftData.ciLower}
                        stroke="hsl(var(--muted))"
                        strokeDasharray="5 5"
                        label={{
                          value: `${confidenceLevel}% CI`,
                          position: "top",
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11
                        }}
                      />
                      
                      <ReferenceLine
                        x={upliftData.ciUpper}
                        stroke="hsl(var(--muted))"
                        strokeDasharray="5 5"
                      />

                      {/* Tooltip amélioré */}
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null;
                          const data = payload[0].payload;

                          return (
                            <div className="w-[380px] bg-white border rounded-lg shadow-lg p-4">
                              <ConfidenceTooltip
                                title="Uplift Distribution"
                                description={`Bootstrap Analysis (${confidenceLevel}% CI)`}
                                methodUsed="Bootstrap Resampling"
                                showCalculationDetails={true}
                                confidenceInterval={{
                                  lower: Number(upliftData.ciLower),
                                  upper: Number(upliftData.ciUpper),
                                  metric: 'Revenue Uplift'
                                }}
                                confidenceData={{
                                  value: Number((1 - upliftData.pValue) * 100),
                                  level: getConfidenceLevel(Number((1 - upliftData.pValue) * 100)),
                                  details: {
                                    variation: {
                                      count: Math.round(Number(data.frequency)),
                                      total: 1000,
                                      rate: Number(data.uplift),
                                      unit: 'percentage'
                                    },
                                    control: {
                                      count: Math.round(Number(upliftData.observedDiff) * 100) / 100,
                                      total: 100,
                                      rate: 0,
                                      unit: 'percentage'
                                    }
                                  }
                                }}
                              >
                                <div className="mt-4 space-y-3 border-t pt-4 border-border">
                                  {/* Statistiques principales */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Observed Uplift:</span>
                                      <span className={cn(
                                        "text-sm font-medium",
                                        upliftData.observedDiff > 0 ? "text-green-500" : "text-red-500"
                                      )}>
                                        {upliftData.observedDiff > 0 ? "+" : ""}{upliftData.observedDiff.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Confidence Interval:</span>
                                      <span className="text-sm">
                                        [{upliftData.ciLower.toFixed(2)}%, {upliftData.ciUpper.toFixed(2)}%]
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">P-value:</span>
                                      <span className="text-sm font-medium">
                                        {upliftData.pValue.toFixed(3)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Distribution actuelle */}
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Current Distribution Point</p>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Uplift Value:</span>
                                      <span className="text-sm">
                                        {typeof data.uplift === 'number' ? `${data.uplift.toFixed(2)}%` : '-'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Frequency:</span>
                                      <span className="text-sm">
                                        {typeof data.frequency === 'number' ? `${data.frequency.toFixed(2)}%` : '-'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Significativité statistique */}
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "h-2 w-2 rounded-full",
                                      upliftData.pValue < (1 - confidenceLevel / 100) ? "bg-green-500" : "bg-yellow-500"
                                    )} />
                                    <span className={cn(
                                      "text-sm font-medium",
                                      upliftData.pValue < (1 - confidenceLevel / 100) ? "text-green-500" : "text-yellow-500"
                                    )}>
                                      {upliftData.pValue < (1 - confidenceLevel / 100) 
                                        ? "Statistically Significant" 
                                        : "Not Significant"
                                      }
                                    </span>
                                  </div>
                                </div>
                              </ConfidenceTooltip>
                            </div>
                          );
                        }}
                        wrapperStyle={{ 
                          zIndex: 1000,
                          outline: 'none'
                        }}
                        cursor={false}
                      />
                    </BarChart>
                  );
                case "category":
                  return (
                    <BarChart data={[]}>
                      <XAxis />
                      <YAxis />
                    </BarChart>
                  );
                default:
                  return null;
              }
            })()}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
} 