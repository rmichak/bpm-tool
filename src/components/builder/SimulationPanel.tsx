'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  RotateCcw,
  Gamepad2,
  Minus,
  X,
  Plus,
  Zap,
  Flame,
  GripHorizontal,
} from 'lucide-react';

interface SimulationPanelProps {
  isRunning: boolean;
  speed: number;
  totalActive: number;
  totalOverdue: number;
  totalProcessed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onInjectItem: () => void;
  onAddRandomItems: (count: number) => void;
  onTriggerBottleneck: () => void;
  onAgeAllItems: (hours: number) => void;
  className?: string;
}

export function SimulationPanel({
  isRunning,
  speed,
  totalActive,
  totalOverdue,
  totalProcessed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onInjectItem,
  onAddRandomItems,
  onTriggerBottleneck,
  onAgeAllItems,
  className,
}: SimulationPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'p-3 rounded-xl',
          'bg-card border border-border shadow-xl',
          'hover:bg-muted transition-colors',
          className
        )}
        title="Open Simulation Panel"
      >
        <Gamepad2 className="h-5 w-5 text-primary" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-80 rounded-xl',
        'bg-card/95 backdrop-blur-sm border border-border shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Simulation</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Minimize"
          >
            <Minus className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              className="gap-2 flex-1"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onPlay}
              className="gap-2 flex-1"
            >
              <Play className="h-4 w-4" />
              Play
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Speed control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Speed</span>
            <span className="font-medium">{speed}x</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={([value]) => onSpeedChange(value)}
            min={0.5}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0.5x</span>
            <span>5x</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onInjectItem}
            className="w-full justify-start gap-2 text-sm"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            Inject Item at Begin
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddRandomItems(5)}
            className="w-full justify-start gap-2 text-sm"
          >
            <Plus className="h-4 w-4 text-blue-400" />
            Add 5 Random Items
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTriggerBottleneck}
            className="w-full justify-start gap-2 text-sm"
          >
            <Zap className="h-4 w-4 text-amber-400" />
            Trigger Bottleneck
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAgeAllItems(1)}
            className="w-full justify-start gap-2 text-sm"
          >
            <Flame className="h-4 w-4 text-red-400" />
            Age All Items +1 hour
          </Button>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-2xl font-bold text-foreground">
                  {totalActive}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    totalOverdue > 0 ? 'bg-red-500 animate-pulse' : 'bg-red-500/30'
                  )}
                />
                <span
                  className={cn(
                    'text-2xl font-bold',
                    totalOverdue > 0 ? 'text-red-400' : 'text-foreground'
                  )}
                >
                  {totalOverdue}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-sm text-muted-foreground">
              Total Processed:{' '}
            </span>
            <span className="font-semibold text-foreground">
              {totalProcessed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
