import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  tooltip?: string;
}

export function ToolButton({ icon, isActive, onClick, tooltip }: ToolButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={tooltip}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-md transition-colors',
        isActive
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text'
      )}
    >
      {icon}
    </motion.button>
  );
}
