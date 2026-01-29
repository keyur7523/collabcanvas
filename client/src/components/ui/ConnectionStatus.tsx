import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isConnected: boolean;
  isSynced: boolean;
}

export function ConnectionStatus({ isConnected, isSynced }: Props) {
  if (!isConnected) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', 'text-error')}>
        <WifiOff size={14} />
        <span>Disconnected</span>
      </div>
    );
  }

  if (!isSynced) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', 'text-warning')}>
        <Loader2 size={14} className="animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm', 'text-success')}>
      <Wifi size={14} />
      <span>Connected</span>
    </div>
  );
}
