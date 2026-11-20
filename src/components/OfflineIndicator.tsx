import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 left-4 z-50 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      <span>Đang ngoại tuyến — Dữ liệu kho & thực đơn vẫn hoạt động bình thường</span>
    </div>
  );
};
