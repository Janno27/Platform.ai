"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from "lucide-react";
import { ConfidenceTooltip } from "./confidence-tooltip";
import { RevenueRangeTable } from "./revenue-range-table";
import { Button } from "@/components/ui/button";
import { BarChart2, TableIcon } from "lucide-react";
import { Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { RevenueStatistics } from "./revenue-statistics";
import { VARIATION_COLORS, getVariationColor } from "@/lib/constants";

interface RevenueAnalysisProps {
  data: any;
  isLoading?: boolean;
}

const TOOLTIPS = {
  uplift: {
    title: "Statistical Test",
    description: "Relative difference between variation and control",
    confidenceLevels: [
      {
        level: "≥ 95%",
        label: "Statistically Significant",
        color: "text-green-500",
      },
      {
        level: "≥ 90%",
        label: "Partially Significant",
        color: "text-yellow-500",
      },
      {
        level: "< 90%",
        label: "Not Significant",
        color: "text-muted-foreground",
      },
    ],
  },
};

const STATISTICAL_METHODOLOGY = {
  users: {
    test: "Student's t-test",
    description:
      "Compares the mean number of users between variations. Assumes normal distribution due to large sample size (Central Limit Theorem).",
    implementation: "stats.ttest_ind() with equal_var=False (Welch's t-test)",
  },
  transaction_rate: {
    test: "Fisher's Exact Test",
    description:
      "Compares conversion rates between variations. Ideal for binary outcomes (converted vs not converted). Provides exact p-values even for small sample sizes.",
    implementation: "stats.fisher_exact()",
    details: `
      - Utilise une table de contingence 2x2
      - Compare les proportions d'utilisateurs convertis vs non convertis
      - Calcule la probabilité exacte de la différence observée
      - Intervalle de confiance basé sur la méthode Wilson
    `,
  },
  aov: {
    test: "Mann-Whitney U Test",
    description:
      "Non-parametric test comparing AOV distributions. Robust against non-normal distributions and outliers, which is typical for revenue data.",
    implementation: "stats.mannwhitneyu(alternative='two-sided')",
    details: `
      - Ne suppose pas une distribution normale
      - Compare les distributions complètes, pas juste les moyennes
      - Bootstrap pour l'intervalle de confiance (1000 itérations)
      - Particulièrement adapté aux données de revenus souvent asymétriques
    `,
  },
  avg_products: {
    test: "Mann-Whitney U Test",
    description:
      "Non-parametric test for comparing product quantity distributions. Handles discrete, non-normal data.",
    implementation: "stats.mannwhitneyu(alternative='two-sided')",
    details: `
      - Adapté aux données discrètes (nombres entiers de produits)
      - Compare les distributions de quantités
      - Bootstrap pour l'intervalle de confiance
      - Robuste aux valeurs extrêmes
    `,
  },
  total_revenue: {
    test: "Mann-Whitney U Test",
    description:
      "Non-parametric test for comparing revenue distributions. Robust against typical revenue data skewness.",
    implementation: "stats.mannwhitneyu() with alternative='two-sided'",
  },
  arpu: {
    test: "Mann-Whitney U Test",
    description:
      "Non-parametric test comparing revenue distributions per user. Robust against non-normal distributions and outliers.",
    implementation: "stats.mannwhitneyu(alternative='two-sided') with bootstrap CI",
    details: `
      - Ne suppose pas une distribution normale
      - Compare les distributions de revenus par utilisateur
      - Bootstrap pour l'intervalle de confiance
      - Robuste aux valeurs extrêmes
    `,
  },
};

const metrics = [
  { key: "users", label: "Users", type: "number", showStats: false },
  { key: "transaction_rate", label: "Transaction Rate", type: "rate", showStats: true },
  { key: "aov", label: "AOV", type: "currency", showStats: true },
  { key: "avg_products", label: "Avg Products", type: "quantity", showStats: true },
] as const;

const secondaryMetrics = [
  { key: "total_revenue", label: "Total Revenue", type: "currency", showStats: true },
  { key: "arpu", label: "ARPU", type: "currency", showStats: true },
] as const;

type MetricKey = typeof metrics[number]["key"] | typeof secondaryMetrics[number]["key"];

// Fonction pour déterminer l'unité selon la métrique
const getUnit = (metric: MetricKey): "currency" | "percentage" | "quantity" | undefined => {
  switch (metric) {
    case "transaction_rate":
      return "percentage";
    case "aov":
    case "total_revenue":
    case "arpu":
      return "currency";
    case "avg_products":
      return "quantity";
    default:
      return undefined;
  }
};

// Mise à jour des types pour inclure l'unité
interface MetricDetails {
  count: number;
  total: number;
  rate: number;
  unit?: string;
}

interface ConfidenceData {
  value: number;
  level: { label: string; color: string };
  details?: {
    variation: MetricDetails;
    control: MetricDetails;
  };
}

interface RangeConfidenceData {
  confidence: number;
  confidenceLevel: { label: string; color: string };
  details?: {
    variation: MetricDetails;
    control: MetricDetails;
  };
}

const renderConfidenceTooltip = (metric: MetricKey, metricsData: any) => {
  // Déterminer la méthode et les calculs selon la métrique
  const getConfidenceDetails = (metric: MetricKey) => {
    switch (metric) {
      case "transaction_rate":
        return {
          test: "Fisher's Exact Test",
          description: "Compares conversion rates between variations",
          implementation: "stats.fisher_exact()",
          confidenceInterval: {
            lower: metricsData.confidence_interval?.lower || 0,
            upper: metricsData.confidence_interval?.upper || 0,
            metric: "Transaction Rate",
          },
        };

      case "aov":
        return {
          test: "Mann-Whitney U Test",
          description: "Non-parametric test for comparing AOV distributions",
          implementation: "stats.mannwhitneyu(alternative='two-sided')",
          confidenceInterval: {
            lower: metricsData.confidence_interval?.lower || 0,
            upper: metricsData.confidence_interval?.upper || 0,
            metric: "Average Order Value",
          },
        };

      case "avg_products":
        return {
          test: "Mann-Whitney U Test",
          description: "Non-parametric test for comparing product quantity distributions",
          implementation: "stats.mannwhitneyu(alternative='two-sided')",
          confidenceInterval: {
            lower: metricsData.confidence_interval?.lower || 0,
            upper: metricsData.confidence_interval?.upper || 0,
            metric: "Average Products",
          },
        };

      case "total_revenue":
        return {
          test: "Mann-Whitney U Test",
          description:
            "Non-parametric test comparing revenue distributions. Robust against typical revenue data skewness.",
          implementation: "stats.mannwhitneyu() with alternative='two-sided'",
          confidenceInterval: {
            lower: metricsData.confidence_interval?.lower || 0,
            upper: metricsData.confidence_interval?.upper || 0,
            metric: "Total Revenue",
          },
        };

      case "arpu":
        return {
          test: "Mann-Whitney U Test",
          description:
            "Non-parametric test comparing revenue distributions per user. Robust against non-normal distributions and outliers.",
          implementation: "stats.mannwhitneyu(alternative='two-sided') with bootstrap CI",
          confidenceInterval: {
            lower: metricsData.confidence_interval?.lower || 0,
            upper: metricsData.confidence_interval?.upper || 0,
            metric: "Revenue per User",
          },
        };

      default:
        return {
          test: "Student's t-test",
          description: "Parametric test for comparing means",
          implementation: "stats.ttest_ind(equal_var=False)",
          confidenceInterval: {
            lower: metricsData.confidence_interval?.lower || 0,
            upper: metricsData.confidence_interval?.upper || 0,
            metric: metric,
          },
        };
    }
  };

  const confidenceDetails = getConfidenceDetails(metric);

  return (
    <ConfidenceTooltip
      title={confidenceDetails.test}
      description={confidenceDetails.description}
      methodUsed={confidenceDetails.implementation}
      showCalculationDetails={true}
      confidenceInterval={confidenceDetails.confidenceInterval}
      confidenceData={{
        value: metricsData.confidence || 0,
        level: getConfidenceLevel(metricsData.confidence || 0),
        details: {
          variation: {
            count: metricsData.details?.variation?.count || 0,
            total: metricsData.details?.variation?.total || 0,
            rate: metricsData.details?.variation?.rate || 0,
            unit: getUnit(metric),
          },
          control: {
            count: metricsData.details?.control?.count || 0,
            total: metricsData.details?.control?.total || 0,
            rate: metricsData.details?.control?.rate || 0,
            unit: getUnit(metric),
          },
        },
      }}
    />
  );
};

function TableSkeleton({ rows = 3, showSecondaryMetrics = false }) {
  return (
    <div className="space-y-6">
      {/* Filtres skeleton */}
      <div className="flex justify-end gap-2">
        <div className="w-[200px] h-10 bg-muted animate-pulse rounded-md" />
        <div className="w-[200px] h-10 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Tableau principal skeleton */}
      <Card className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="h-12 bg-muted/50">
                <div className="w-24 h-4 bg-muted animate-pulse rounded" />
              </TableHead>
              {[...Array(4)].map((_, i) => (
                <TableHead key={i} className="h-12 text-right bg-muted/50">
                  <div className="w-20 h-4 bg-muted animate-pulse rounded ml-auto" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(rows)].map((_, i) => (
              <TableRow key={i} className="h-[72px]">
                <TableCell>
                  <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                {[...Array(4)].map((_, j) => (
                  <TableCell key={j} className="text-right">
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-muted animate-pulse rounded ml-auto" />
                      {i > 0 && (
                        <div className="space-y-1">
                          <div className="w-16 h-3 bg-muted animate-pulse rounded ml-auto" />
                          <div className="w-12 h-3 bg-muted animate-pulse rounded ml-auto" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Tableaux secondaires skeleton */}
      {showSecondaryMetrics && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="h-12 bg-muted/50">
                      <div className="w-24 h-4 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead className="h-12 text-right bg-muted/50">
                      <div className="w-20 h-4 bg-muted animate-pulse rounded ml-auto" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(rows)].map((_, j) => (
                    <TableRow key={j} className="h-[72px]">
                      <TableCell>
                        <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-2">
                          <div className="w-24 h-4 bg-muted animate-pulse rounded ml-auto" />
                          {j > 0 && (
                            <div className="space-y-1">
                              <div className="w-16 h-3 bg-muted animate-pulse rounded ml-auto" />
                              <div className="w-12 h-3 bg-muted animate-pulse rounded ml-auto" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const getConfidenceLevel = (confidence: number): { label: string; color: string } => {
  if (confidence >= 95) {
    return { label: "Statistically Significant", color: "text-green-500" };
  }
  if (confidence >= 90) {
    return { label: "Partially Significant", color: "text-yellow-500" };
  }
  return { label: "Not Significant", color: "text-muted-foreground" };
};

// Fonction utilitaire pour grouper les transactions
const groupTransactionsByID = (transactions: any[]) => {
  // Log pour debug
  console.log("Données avant agrégation:", transactions.slice(0, 2));

  return transactions.reduce((acc, transaction) => {
    const id = transaction.transaction_id;
    if (!acc[id]) {
      acc[id] = {
        transaction_id: id,
        variation: transaction.variation,
        device_category: transaction.device_category || transaction.device, // Ajout du fallback
        revenue: 0,
        quantity: 0,
        item_categories: new Set(),
        item_name_simple: new Set(),
      };
    }

    // Ajouter les valeurs avec vérification des types
    const revenue = typeof transaction.revenue === "string" ? parseFloat(transaction.revenue) : transaction.revenue;
    const quantity = typeof transaction.quantity === "string" ? parseFloat(transaction.quantity) : transaction.quantity;

    acc[id].revenue += revenue || 0;
    acc[id].quantity += quantity || 0;
    if (transaction.item_category2) acc[id].item_categories.add(transaction.item_category2);
    if (transaction.item_name_simple) acc[id].item_name_simple.add(transaction.item_name_simple);

    return acc;
  }, {});
};

interface Transaction {
  transaction_id: string;
  variation: string;
  device_category: string;
  revenue: number;
  quantity: number;
  item_categories: string;
  item_name_simple: string;
}

export function RevenueAnalysis({ data, isLoading = false }: RevenueAnalysisProps) {
  const [deviceFilter, setDeviceFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [categories, setCategories] = React.useState<string[]>([]);
  const [devices, setDevices] = React.useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
  const [revenueData, setRevenueData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(true);
  const [showChart, setShowChart] = React.useState<boolean>(false);

  // Références pour les mesures de position
  const tableRef = React.useRef<HTMLDivElement>(null);
  const aovColumnRef = React.useRef<HTMLTableCellElement>(null);

  // États pour les positions
  const [positions, setPositions] = React.useState({
    aovColPosition: 0,
    tableHeight: 0,
    leftTablePosition: 0,
    rightTablePosition: 0,
  });

  // Ajout d'un état pour les données agrégées
  const [aggregatedTransactions, setAggregatedTransactions] = React.useState<Transaction[]>([]);

  // Fonction pour calculer les positions
  const calculatePositions = React.useCallback(() => {
    if (tableRef.current && aovColumnRef.current) {
      const tableRect = tableRef.current.getBoundingClientRect();
      const aovRect = aovColumnRef.current.getBoundingClientRect();

      // Calculer les positions relatives au conteneur parent
      const aovColPosition = aovRect.left - tableRect.left + aovRect.width / 2;
      const tableHeight = tableRect.height;
      const containerWidth = tableRect.width;

      setPositions({
        aovColPosition,
        tableHeight,
        leftTablePosition: containerWidth * 0.25,
        rightTablePosition: containerWidth * 0.75,
      });
    }
  }, []);

  // Observer les changements de taille
  React.useEffect(() => {
    const observer = new ResizeObserver(calculatePositions);

    if (tableRef.current) {
      observer.observe(tableRef.current);
    }

    return () => observer.disconnect();
  }, [calculatePositions]);

  // Recalculer les positions quand les données changent
  React.useEffect(() => {
    calculatePositions();
  }, [revenueData, calculatePositions]);

  // Extraire les catégories uniques des données
  React.useEffect(() => {
    if (data?.analysisData?.raw_data?.transaction) {
      const allCategories = data.analysisData.raw_data.transaction
        .flatMap((t: any) =>
          t.item_category2?.split("|").map((cat: string) => {
            const cleanName = cat.trim().split("(")[0].trim();
            return cleanName;
          })
        )
        .filter(Boolean);

      const uniqueCategories = Array.from(new Set(allCategories))
        .filter((cat) => !cat.includes("+"))
        .sort();

      setCategories(uniqueCategories);
      setIsLoadingCategories(false);
    }
  }, [data]);

  // Extraire les devices uniques
  React.useEffect(() => {
    if (data?.analysisData?.raw_data?.transaction) {
      const uniqueDevices = Array.from(
        new Set(
          data.analysisData.raw_data.transaction
            .map((t: any) => t.device_category)
            .filter(Boolean)
        )
      ).sort();
      setDevices(uniqueDevices);
    }
  }, [data]);

  // Modifier la fonction fetchRevenueData
  const fetchRevenueData = React.useCallback(async () => {
    try {
      setIsCalculating(true);
      setError(null);

      // Filtrer les transactions
      const filteredTransactions =
        data?.analysisData?.raw_data?.transaction.filter((t: any) => {
          const matchesDevice = deviceFilter === "all" || t.device_category === deviceFilter;

          if (categoryFilter.includes("all")) {
            return matchesDevice;
          }

          const transactionCategories = t.item_category2?.split("|")
            .map((cat: string) => cat.trim())
            .filter(Boolean) || [];

          const allSelectedCategoriesPresent = categoryFilter.every((selectedCat) =>
            transactionCategories.some((cat) => cat.toLowerCase().includes(selectedCat.toLowerCase()))
          );

          return matchesDevice && allSelectedCategoriesPresent;
        }) || [];

      // Vérifier s'il y a des transactions après filtrage
      if (filteredTransactions.length === 0) {
        setError("No transactions found with the selected filters");
        setRevenueData(null);
        setAggregatedTransactions([]);
        return;
      }

      const requestData = {
        raw_data: {
          transaction: filteredTransactions,
          overall: data?.analysisData?.raw_data?.overall,
        },
      };
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/calculate-revenue`, {  // Utilisation des backticks pour interpoler la variable
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch revenue data");
      }

      const result = await response.json();
      setRevenueData(result);
      setAggregatedTransactions(result.virtual_table || []);
    } catch (error) {
      console.error("Revenue calculation error:", error);
      setError("Error calculating revenue metrics");
    } finally {
      setIsCalculating(false);
    }
  }, [data, deviceFilter, categoryFilter]);

  // Mettre à jour les données quand les filtres changent
  React.useEffect(() => {
    if (data?.analysisData?.raw_data) {
      fetchRevenueData();
    }
  }, [data, deviceFilter, categoryFilter]);

  const formatValue = (value: number | undefined, type: string) => {
    if (value === undefined || value === null) return "-";

    if (type === "uplift") {
      return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
    }
    if (type === "rate" || type === "confidence") {
      return `${value.toFixed(2)}%`;
    }
    if (type === "currency") {
      return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  };

  const getUpliftColor = (uplift: number) => {
    return uplift > 0 ? "text-green-500" : "text-red-500";
  };

  // Fonction pour déterminer la valeur la plus élevée
  const getHighestValue = (metric: string) => {
    if (!revenueData?.data) return 0;
    return Math.max(...Object.values(revenueData.data).map((m: any) => m[metric].value));
  };

  // Fonction pour vérifier si une valeur est la plus élevée
  const isHighestValue = (metricKey: string, value: number | undefined, allVariations: Record<string, any>): boolean => {
    if (value === undefined || !allVariations) return false;

    const values = Object.values(allVariations)
      .map((variation) => variation?.[metricKey]?.value)
      .filter((v): v is number => v !== undefined);

    return values.length > 0 ? Math.max(...values) === value : false;
  };

  const [filteredVirtualTable, setFilteredVirtualTable] = React.useState<any[]>([]);

  // Mettre à jour la table virtuelle filtrée quand les filtres changent
  React.useEffect(() => {
    if (revenueData?.virtual_table) {
      const filtered = revenueData.virtual_table.filter((t: any) => {
        const matchesDevice = deviceFilter === "all" || t.device_category === deviceFilter;
        const matchesCategory =
          categoryFilter.includes("all") ||
          categoryFilter.some((cat) => t.item_category2?.toLowerCase().includes(cat.toLowerCase()));
        return matchesDevice && matchesCategory;
      });
      setFilteredVirtualTable(filtered);
    }
  }, [revenueData?.virtual_table, deviceFilter, categoryFilter]);

  if (isLoading || isCalculating) {
    return <TableSkeleton rows={3} showSecondaryMetrics={true} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-center">
          <p className="font-semibold text-red-500">{error}</p>
          {error.includes("No transactions found") && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or selecting "All Categories" to see more results.
            </p>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              if (value === "all") {
                setCategoryFilter(["all"]);
              } else {
                const newValue = categoryFilter
                  .filter((v) => v !== "all")
                  .includes(value)
                  ? categoryFilter.filter((v) => v !== value)
                  : [...categoryFilter.filter((v) => v !== "all"), value];

                setCategoryFilter(newValue.length ? newValue : ["all"]);
              }
            }}
            disabled={isLoadingCategories}
          >
            <SelectTrigger className="w-[280px]">
              {isLoadingCategories ? (
                <div className="w-full h-4 bg-muted animate-pulse rounded" />
              ) : (
                <SelectValue>
                  {categoryFilter.includes("all") ? "All Categories" : `${categoryFilter.length} selected`}
                </SelectValue>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-4 w-4 border rounded flex items-center justify-center",
                        categoryFilter.includes(category) && "bg-primary border-primary"
                      )}
                    >
                      {categoryFilter.includes(category) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span>{category}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (!revenueData?.success || !revenueData?.data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex justify-end gap-2">
        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            if (value === "all") {
              setCategoryFilter(["all"]);
            } else {
              const newValue = categoryFilter
                .filter((v) => v !== "all")
                .includes(value)
                ? categoryFilter.filter((v) => v !== value)
                : [...categoryFilter.filter((v) => v !== "all"), value];

              setCategoryFilter(newValue.length ? newValue : ["all"]);
            }
          }}
          disabled={isLoadingCategories}
        >
          <SelectTrigger className="w-[280px]">
            {isLoadingCategories ? (
              <div className="w-full h-4 bg-muted animate-pulse rounded" />
            ) : (
              <SelectValue>
                {categoryFilter.includes("all") ? "All Categories" : `${categoryFilter.length} selected`}
              </SelectValue>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-4 w-4 border rounded flex items-center justify-center",
                      categoryFilter.includes(category) && "bg-primary border-primary"
                    )}
                  >
                    {categoryFilter.includes(category) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span>{category}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Première section : Métriques principales et secondaires */}
      <div className="space-y-8 pb-8 border-b border-border/40">
        {/* Premier tableau */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground/70">Primary Metrics</h3>
          <Card className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="h-12 bg-muted/50">Variation</TableHead>
                  {metrics.map((metric) => (
                    <TableHead
                      key={metric.key}
                      className="h-12 text-right bg-muted/50"
                      ref={metric.key === "aov" ? aovColumnRef : undefined}
                    >
                      {metric.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(revenueData.data).map(([variation, metrics_data]: [string, any], index) => (
                  <TableRow
                    key={variation}
                    className={cn(
                      "h-[72px] hover:bg-muted/50 transition-colors",
                      variation === revenueData.control && "bg-muted/30"
                    )}
                  >
                    <TableCell className="font-medium">{variation}</TableCell>
                    {metrics.map((metric) => (
                      <TableCell key={metric.key} className="text-right p-4">
                        <div className="space-y-1.5">
                          <div
                            className={cn(
                              "tabular-nums",
                              metrics_data?.[metric.key]?.value !== undefined &&
                                isHighestValue(metric.key, metrics_data[metric.key].value, revenueData.data) &&
                                "font-semibold"
                            )}
                          >
                            {formatValue(metrics_data?.[metric.key]?.value, metric.type)}
                          </div>
                          {variation !== revenueData.control && metric.showStats && metrics_data?.[metric.key] && (
                            <div className="space-y-1.5">
                              <div
                                className={cn(
                                  "text-sm flex items-center justify-end gap-1 cursor-help",
                                  getUpliftColor(metrics_data[metric.key].uplift)
                                )}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1">
                                      {metrics_data[metric.key].uplift > 0 ? (
                                        <ArrowUpIcon className="h-4 w-4" />
                                      ) : (
                                        <ArrowDownIcon className="h-4 w-4" />
                                      )}
                                      {formatValue(metrics_data[metric.key].uplift, "uplift")}
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="left"
                                      align="start"
                                      className="p-4 bg-popover border-border shadow-lg"
                                      sideOffset={5}
                                    >
                                      {renderConfidenceTooltip(metric.key, metrics_data[metric.key])}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="text-xs text-muted-foreground cursor-help">
                                Stats : {formatValue(metrics_data[metric.key].confidence, "confidence")}
                              </div>
                            </div>
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

        {/* Tableaux secondaires */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground/70">Secondary Metrics</h3>
          <div className="grid grid-cols-2 gap-4 relative">
            {secondaryMetrics.map((metric, index) => (
              <Card key={metric.key} className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="h-12 bg-muted/50">Variation</TableHead>
                      <TableHead className="h-12 text-right bg-muted/50">
                        {metric.label}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(revenueData.data).map(([variation, metrics_data]: [string, any]) => (
                      <TableRow
                        key={variation}
                        className={cn(
                          "h-[72px] hover:bg-muted/50 transition-colors",
                          variation === revenueData.control && "bg-muted/30"
                        )}
                      >
                        <TableCell className="font-medium">{variation}</TableCell>
                        <TableCell className="text-right p-4">
                          <div className="space-y-1.5">
                            <div className="tabular-nums">
                              {formatValue(metrics_data[metric.key].value, metric.type)}
                            </div>
                            {variation !== revenueData.control && metric.showStats && metrics_data?.[metric.key] && (
                              <div className="space-y-1.5">
                                <div
                                  className={cn(
                                    "text-sm flex items-center justify-end gap-1 cursor-help",
                                    getUpliftColor(metrics_data[metric.key].uplift)
                                  )}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="flex items-center gap-1">
                                        {metrics_data[metric.key].uplift > 0 ? (
                                          <ArrowUpIcon className="h-4 w-4" />
                                        ) : (
                                          <ArrowDownIcon className="h-4 w-4" />
                                        )}
                                        {formatValue(metrics_data[metric.key].uplift, "uplift")}
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="left"
                                        align="start"
                                        className="p-4 bg-popover border-border shadow-lg"
                                        sideOffset={5}
                                      >
                                        {renderConfidenceTooltip(metric.key, metrics_data[metric.key])}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="text-xs text-muted-foreground cursor-help">
                                  Stats : {formatValue(metrics_data[metric.key].confidence, "confidence")}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Range Distribution */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground/70">Revenue Distribution</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChart(!showChart)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showChart ? <TableIcon className="h-4 w-4" /> : <BarChart2 className="h-4 w-4" />}
          </Button>
        </div>
        {revenueData && (
          <RevenueRangeTable
            data={revenueData.data}
            control={revenueData.control}
            isLoading={isLoading || isCalculating}
            showChart={showChart}
            virtualTable={filteredVirtualTable}
          />
        )}
      </div>

      {/* Revenue Statistics */}
      <div className="space-y-2 mt-8 border-t pt-8">
        <h3 className="text-sm font-medium text-muted-foreground/70">Revenue Statistics</h3>
        {revenueData && (
          <RevenueStatistics
            virtualTable={filteredVirtualTable}
            filters={{
              device: deviceFilter,
              categories: categoryFilter,
            }}
            control={revenueData.control}
            data={revenueData.data}
          />
        )}
      </div>

      {/* Tableau récapitulatif */}
      <div className="space-y-2 mt-8 border-t pt-8">
        <h3 className="text-sm font-medium text-muted-foreground/70">Transaction Details</h3>
        <Card className="rounded-lg border bg-card">
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="h-10 bg-muted/50 sticky left-0 min-w-[200px] z-10">Variation</TableHead>
                  <TableHead className="h-10 bg-muted/50 min-w-[150px]">Transaction ID</TableHead>
                  <TableHead className="h-10 bg-muted/50 min-w-[400px]">Product</TableHead>
                  <TableHead className="h-10 bg-muted/50 min-w-[300px]">Category</TableHead>
                  <TableHead className="h-10 bg-muted/50 min-w-[100px] text-right">Quantity</TableHead>
                  <TableHead className="h-10 bg-muted/50 min-w-[150px] text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData?.virtual_table
                  ?.slice(0, 10)
                  .map((transaction) => (
                    <TableRow key={transaction.transaction_id} className="h-14">
                      <TableCell className="font-medium sticky left-0 bg-background min-w-[200px] z-10">
                        {transaction.variation}
                      </TableCell>
                      <TableCell className="min-w-[150px]">{transaction.transaction_id}</TableCell>
                      <TableCell className="min-w-[400px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="text-left w-full truncate block">
                              {transaction.item_name}
                            </TooltipTrigger>
                            <TooltipContent>{transaction.item_name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="min-w-[300px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="text-left w-full truncate block">
                              {transaction.item_category2}
                            </TooltipTrigger>
                            <TooltipContent>{transaction.item_category2}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">{transaction.quantity}</TableCell>
                      <TableCell className="text-right min-w-[150px]">€{transaction.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}