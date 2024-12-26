export interface Range {
  min: number;
  max: number;
}

export interface Transaction {
  transaction_id: string;
  variation: string;
  device_category: string;
  revenue: number;
  quantity: number;
  item_categories: Set<string>;
  item_name_simple: Set<string>;
}

export interface DistributionStats {
  median: number;
  mean: number;
  p25: number;
  p75: number;
  sampleSize: number;
}

export interface DistributionData {
  range: number;
  rangeEnd: number;
  [key: string]: number | { value: number; stats: DistributionStats } | undefined;
}

export interface TooltipDetails {
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