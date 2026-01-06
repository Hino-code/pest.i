import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title = "No results found",
  description = "No data matches your current filter criteria. Try adjusting your search or filters.",
  actionLabel = "Clear Filters",
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={`flex flex-col items-center justify-center p-8 text-center border-dashed border-2 bg-muted/10 ${className}`}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mb-4 mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
