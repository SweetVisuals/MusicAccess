'use client'

import { useTotalListeners } from '@/hooks/useTotalListeners';
import { Users } from 'lucide-react';

export function RealtimeListenerCount() {
  const { totalListeners, loading } = useTotalListeners();

  if (loading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm mr-4 ${totalListeners > 0 ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`}>
      <Users className="h-4 w-4" />
      <span>
        {totalListeners} {totalListeners === 1 ? 'person' : 'people'} listening now
      </span>
    </div>
  );
}