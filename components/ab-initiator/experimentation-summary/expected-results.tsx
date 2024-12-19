import { cn } from "@/lib/utils";

interface KPI {
  name: string;
  improvement: string;
  type: 'tech' | 'data' | 'ai';
}

const KPIS: KPI[] = [
  { name: "Add To Cart", improvement: "+ 3%", type: 'tech' },
  { name: "Transaction", improvement: "+ 1%", type: 'data' },
  { name: "Revenue", improvement: "+ 1%", type: 'ai' },
];

const getTypeColor = (type: KPI['type']) => {
  switch (type) {
    case 'tech':
      return 'bg-tech-background text-tech-foreground';
    case 'data':
      return 'bg-data-background text-data-foreground';
    case 'ai':
      return 'bg-ai-background text-ai-foreground';
    default:
      return 'bg-primary/10';
  }
};

export function ExpectedResults() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Expected Results</label>
        </div>
      </div>

      <div style={{ paddingLeft: '0px' }} className="rounded-lg p-4">
        <div className="space-y-3">
          {KPIS.map((kpi, index) => (
            <div 
              key={kpi.name}
              className={cn(
                "flex items-center justify-between",
                index !== KPIS.length - 1 && "border-b border-border/40 pb-3"
              )}
            >
              <span className="text-sm text-muted-foreground">
                {kpi.name}
              </span>
              <div className={cn(
                "rounded-r-full",
                getTypeColor(kpi.type),
                "pl-4 pr-5 py-1"
              )}>
                <span className="text-[11px] font-medium">
                  {kpi.improvement}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 