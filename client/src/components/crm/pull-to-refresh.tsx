import { useState, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  threshold?: number;
}

export default function PullToRefresh({ 
  children, 
  onRefresh, 
  isRefreshing = false,
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start pull-to-refresh if at the top of the scroll
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    const dampedDistance = Math.min(distance * 0.4, threshold * 1.5);
    
    setPullDistance(dampedDistance);
    setCanRefresh(dampedDistance >= threshold);

    // Prevent default scroll when pulling
    if (distance > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);
    
    if (canRefresh && !isRefreshing) {
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      
      setPullDistance(threshold);
      await onRefresh();
    }
    
    // Reset state
    setTimeout(() => {
      setPullDistance(0);
      setCanRefresh(false);
    }, 300);
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10",
          isPulling || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: `${Math.min(pullDistance, threshold)}px`,
          transform: `translateY(-${threshold - Math.min(pullDistance, threshold)}px)`
        }}
      >
        <div className="flex flex-col items-center text-gray-500">
          <RefreshCw 
            className={cn(
              "w-6 h-6 transition-all duration-200",
              canRefresh || isRefreshing ? "text-blue-500" : "text-gray-400",
              isRefreshing ? "animate-spin" : ""
            )}
            style={{
              transform: `rotate(${pullDistance * 2}deg)`
            }}
          />
          <span className="text-xs mt-1 font-medium">
            {isRefreshing 
              ? "Actualisation..." 
              : canRefresh 
                ? "Relâchez pour actualiser" 
                : "Tirez pour actualiser"
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${isPulling || isRefreshing ? Math.min(pullDistance, threshold) : 0}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
}