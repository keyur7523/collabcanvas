import { useState, useRef, useEffect } from 'react';
import { Download, Image, FileCode, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Konva from 'konva';
import { exportToPNG, exportToSVG } from '@/utils/export';
import { cn } from '@/lib/utils';
import type { Shape } from '@/types/shapes';

interface ExportMenuProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  shapes: Shape[];
  boardName?: string;
}

export function ExportMenu({ stageRef, shapes, boardName = 'canvas' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExportPNG = () => {
    if (!stageRef.current) {
      toast.error('Canvas not ready');
      return;
    }

    try {
      exportToPNG(stageRef.current, {
        filename: sanitizeFilename(boardName),
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      toast.success('PNG exported successfully');
    } catch (error) {
      console.error('Export PNG failed:', error);
      toast.error('Failed to export PNG');
    }

    setIsOpen(false);
  };

  const handleExportSVG = () => {
    if (shapes.length === 0) {
      toast.error('No shapes to export');
      return;
    }

    try {
      // Cast shapes to the expected type for exportToSVG
      const shapesForExport = shapes as unknown as Parameters<typeof exportToSVG>[0];
      exportToSVG(shapesForExport, {
        filename: sanitizeFilename(boardName),
        backgroundColor: '#ffffff',
      });
      toast.success('SVG exported successfully');
    } catch (error) {
      console.error('Export SVG failed:', error);
      toast.error('Failed to export SVG');
    }

    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          'text-text-secondary hover:text-text hover:bg-surface-hover',
          isOpen && 'bg-surface-hover text-text'
        )}
      >
        <Download size={16} />
        Export
        <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
          <button
            onClick={handleExportPNG}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-hover transition-colors"
          >
            <Image size={16} className="text-text-secondary" />
            Export as PNG
          </button>
          <button
            onClick={handleExportSVG}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-hover transition-colors"
          >
            <FileCode size={16} className="text-text-secondary" />
            Export as SVG
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Sanitize filename by removing/replacing invalid characters
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-_]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50) || 'canvas-export';
}
