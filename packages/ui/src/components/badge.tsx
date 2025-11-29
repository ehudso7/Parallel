'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        secondary: 'bg-white/10 text-white/80 border border-white/20',
        success: 'bg-green-500/20 text-green-300 border border-green-500/30',
        warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        destructive: 'bg-red-500/20 text-red-300 border border-red-500/30',
        premium: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30',
        outline: 'text-white/70 border border-white/20',
        glow: 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-sm shadow-violet-500/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
