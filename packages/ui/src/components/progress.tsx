'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../utils/cn';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showValue?: boolean;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'error';
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, showValue, variant = 'default', ...props }, ref) => {
    const indicatorStyles = {
      default: 'bg-violet-500',
      gradient: 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500',
    };

    return (
      <div className="relative">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            'relative h-3 w-full overflow-hidden rounded-full bg-white/10',
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full w-full flex-1 transition-all duration-500 ease-out',
              indicatorStyles[variant]
            )}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
          />
        </ProgressPrimitive.Root>
        {showValue && (
          <span className="absolute right-0 top-full mt-1 text-xs text-white/60">
            {value}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular progress component
interface CircularProgressProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  variant?: 'default' | 'gradient' | 'success';
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 'md',
  strokeWidth = 4,
  showValue = true,
  variant = 'default',
  className,
}) => {
  const sizes = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 120,
  };

  const diameter = sizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const strokeColors = {
    default: 'stroke-violet-500',
    gradient: 'stroke-[url(#gradient)]',
    success: 'stroke-green-500',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={diameter} height={diameter} className="-rotate-90">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-white/10"
        />
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('fill-none transition-all duration-500', strokeColors[variant])}
          style={variant === 'gradient' ? { stroke: 'url(#gradient)' } : undefined}
        />
      </svg>
      {showValue && (
        <span
          className={cn(
            'absolute font-semibold text-white',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-xl'
          )}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

export { Progress, CircularProgress };
