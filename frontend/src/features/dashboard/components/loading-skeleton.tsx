import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <Card key={idx} className="p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-10 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </Card>
    </div>
  );
}

