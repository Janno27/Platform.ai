import { Skeleton } from "@/components/ui/skeleton";

export function ExperimentationSummarySkeleton() {
  return (
    <div style={{backgroundColor: 'hsl(var(--background) / 0.8)'}} className="h-full">
      <div className="space-y-8 pb-8 px-8">
        {/* En-tête Skeleton */}
        <div className="grid grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="w-[180px] h-9 rounded-full" />
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>
            <Skeleton className="w-72 h-8" />
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Corps Skeleton */}
        <div className="grid grid-cols-2 gap-1">
          {/* Colonne gauche */}
          <div className="space-y-8 pr-4">
            <div className="space-y-3">
              <Skeleton className="w-24 h-5" />
              <Skeleton className="w-full h-24" />
            </div>
            <div className="space-y-3">
              <Skeleton className="w-24 h-5" />
              <Skeleton className="w-full h-24" />
            </div>
            <div className="space-y-3">
              <Skeleton className="w-24 h-5" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="w-full h-16" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="w-24 h-5" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-full h-12" />
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-8">
            <div className="space-y-6">
              <Skeleton className="w-32 h-5" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="w-full h-48" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="w-24 h-5" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="w-full h-24" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 