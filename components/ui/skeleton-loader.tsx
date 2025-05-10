import React from 'react';
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'rectangle' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonLoader({
  shape = 'rectangle',
  width = '100%',
  height = '1rem', // Default height for text-like skeletons
  className,
  style,
  ...props
}: SkeletonLoaderProps) {
  const dimensionsStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-800",
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{ ...dimensionsStyle, ...style }}
      {...props}
      aria-hidden="true" // Hide from screen readers
    />
  );
}

// Optional: Pre-defined variants for common use cases

export function SkeletonText({ className, width = '80%', height = '0.75rem', ...props }: SkeletonLoaderProps) {
  return <SkeletonLoader shape="rectangle" width={width} height={height} className={cn("mb-2", className)} {...props} />;
}

export function SkeletonAvatar({ size = 40, className, ...props }: SkeletonLoaderProps & { size?: number }) {
  return <SkeletonLoader shape="circle" width={size} height={size} className={className} {...props} />;
}

export function SkeletonCard({ className, ...props }: SkeletonLoaderProps) {
  return (
    <div className={cn("p-4 border rounded-lg shadow-sm", className)} {...props}>
      <SkeletonLoader height="1.5rem" width="40%" className="mb-3" />
      <SkeletonText width="90%" />
      <SkeletonText width="70%" />
      <SkeletonText width="80%" />
    </div>
  );
} 