import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => void;
  loading?: boolean;
  lastUpdate?: Date;
  className?: string;
}

export function RefreshButton({ onRefresh, loading, lastUpdate, className }: RefreshButtonProps) {
  const getLastUpdateText = () => {
    if (!lastUpdate) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}min atrás`;
    } else {
      return `${seconds}s atrás`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          {getLastUpdateText()}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className={cn("h-8 w-8 p-0", className)}
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      </Button>
    </div>
  );
}