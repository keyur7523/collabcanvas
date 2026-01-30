import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlignmentToolbarProps {
  position: { x: number; y: number };
  onAlignLeft: () => void;
  onAlignCenterH: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignCenterV: () => void;
  onAlignBottom: () => void;
  onDistributeH: () => void;
  onDistributeV: () => void;
  canAlign: boolean;
  canDistribute: boolean;
}

interface ToolButton {
  icon: React.ElementType;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}

export function AlignmentToolbar({
  position,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onDistributeH,
  onDistributeV,
  canAlign,
  canDistribute,
}: AlignmentToolbarProps) {
  const alignButtons: ToolButton[] = [
    { icon: AlignStartVertical, onClick: onAlignLeft, title: 'Align left' },
    { icon: AlignCenterVertical, onClick: onAlignCenterH, title: 'Align center horizontally' },
    { icon: AlignEndVertical, onClick: onAlignRight, title: 'Align right' },
    { icon: AlignStartHorizontal, onClick: onAlignTop, title: 'Align top' },
    { icon: AlignCenterHorizontal, onClick: onAlignCenterV, title: 'Align center vertically' },
    { icon: AlignEndHorizontal, onClick: onAlignBottom, title: 'Align bottom' },
  ];

  const distributeButtons: ToolButton[] = [
    {
      icon: AlignHorizontalSpaceBetween,
      onClick: onDistributeH,
      title: 'Distribute horizontally (3+ shapes)',
      disabled: !canDistribute,
    },
    {
      icon: AlignVerticalSpaceBetween,
      onClick: onDistributeV,
      title: 'Distribute vertically (3+ shapes)',
      disabled: !canDistribute,
    },
  ];

  if (!canAlign) return null;

  return (
    <div
      className="absolute z-40 flex items-center gap-1 bg-surface border border-border rounded-lg shadow-lg p-1 select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-12px)',
      }}
    >
      {/* Align buttons */}
      {alignButtons.map((btn, index) => (
        <button
          key={index}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            btn.disabled
              ? 'text-text-muted cursor-not-allowed'
              : 'text-text hover:bg-surface-hover'
          )}
          title={btn.title}
        >
          <btn.icon size={18} />
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-0.5" />

      {/* Distribute buttons */}
      {distributeButtons.map((btn, index) => (
        <button
          key={index}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            btn.disabled
              ? 'text-text-muted cursor-not-allowed'
              : 'text-text hover:bg-surface-hover'
          )}
          title={btn.title}
        >
          <btn.icon size={18} />
        </button>
      ))}
    </div>
  );
}
