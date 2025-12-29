'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react';

function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Background glow when selected */}
      {selected && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: 'hsl(var(--primary))',
            strokeWidth: 8,
            strokeOpacity: 0.15,
            filter: 'blur(4px)',
          }}
        />
      )}

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)',
          strokeWidth: selected ? 2.5 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s',
          ...style,
        }}
      />

      {/* Animated flow indicator */}
      <circle r="3" fill="hsl(var(--primary))">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>

      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-1 rounded-md text-xs font-medium bg-card border border-border shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(AnimatedEdge);
