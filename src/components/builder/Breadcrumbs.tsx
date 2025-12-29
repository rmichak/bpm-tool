'use client';

import { cn } from '@/lib/utils';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  id: string;
  name: string;
  workflowId: string;
}

interface BreadcrumbsProps {
  path: BreadcrumbItem[];
  onNavigate: (workflowId: string) => void;
  className?: string;
}

export function Breadcrumbs({ path, onNavigate, className }: BreadcrumbsProps) {
  if (path.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center gap-1 px-4 py-2 bg-muted/50 border-b border-border text-sm',
        className
      )}
      aria-label="Workflow navigation"
    >
      {/* Home icon - always visible, returns to root */}
      <button
        onClick={() => onNavigate(path[0].workflowId)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title="Return to main flow"
      >
        <Home className="h-4 w-4" />
      </button>

      {path.map((item, index) => {
        const isLast = index === path.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.id} className="flex items-center">
            {/* Separator */}
            {!isFirst && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
            )}

            {/* Breadcrumb item */}
            {isLast ? (
              // Current level - bold, not clickable
              <span className="px-2 py-1 font-semibold text-foreground">
                {item.name}
              </span>
            ) : (
              // Previous levels - clickable
              <button
                onClick={() => onNavigate(item.workflowId)}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
