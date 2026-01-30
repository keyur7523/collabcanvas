import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToContent: () => void;
  minScale: number;
  maxScale: number;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToContent,
  minScale,
  maxScale,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);
  const canZoomIn = scale < maxScale;
  const canZoomOut = scale > minScale;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 select-none">
      <div className="flex items-center gap-1 bg-surface border border-border rounded-lg shadow-lg p-1">
        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          disabled={!canZoomOut}
          className={cn(
            'p-2 rounded-md transition-colors',
            canZoomOut
              ? 'hover:bg-surface-hover text-text'
              : 'text-text-muted cursor-not-allowed'
          )}
          title="Zoom out (Ctrl+-)"
        >
          <ZoomOut size={18} />
        </button>

        {/* Zoom Percentage */}
        <button
          onClick={onZoomReset}
          className="min-w-[60px] px-2 py-1.5 text-sm font-medium text-text hover:bg-surface-hover rounded-md transition-colors"
          title="Reset to 100% (Ctrl+0)"
        >
          {percentage}%
        </button>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          disabled={!canZoomIn}
          className={cn(
            'p-2 rounded-md transition-colors',
            canZoomIn
              ? 'hover:bg-surface-hover text-text'
              : 'text-text-muted cursor-not-allowed'
          )}
          title="Zoom in (Ctrl++)"
        >
          <ZoomIn size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Fit to Content */}
        <button
          onClick={onFitToContent}
          className="p-2 rounded-md hover:bg-surface-hover text-text transition-colors"
          title="Fit to content (Ctrl+1)"
        >
          <Maximize2 size={18} />
        </button>

        {/* Reset View */}
        <button
          onClick={onZoomReset}
          className="p-2 rounded-md hover:bg-surface-hover text-text transition-colors"
          title="Reset view (Ctrl+0)"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
