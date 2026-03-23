import { Icon } from '@iconify/react';

interface HydratingOverlayProps {
  message?: string;
}

export function HydratingOverlay({ message = 'Loading data...' }: HydratingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-[#0B1120]/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="relative">
          {/* Animated loading rings */}
          <div className="w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30"></div>
            <div className="absolute inset-2 rounded-full border-2 border-secondary/50 animate-spin border-t-transparent"></div>
            <div className="absolute inset-4 rounded-full border-2 border-primary animate-ping border-t-transparent opacity-75"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-white text-sm font-medium">{message}</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-1 h-1 bg-secondary rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 5, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1E2A45] rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#1E2A45] rounded w-3/4"></div>
            <div className="h-3 bg-[#121C35] rounded w-1/2"></div>
          </div>
          <div className="w-16 h-6 bg-[#1E2A45] rounded"></div>
        </div>
      ))}
    </div>
  );
}