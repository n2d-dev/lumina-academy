import { Check, Loader2, AlertCircle } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  const config = {
    saving: { icon: Loader2, text: 'Đang lưu...', className: 'text-muted-foreground animate-spin' },
    saved: { icon: Check, text: 'Đã lưu', className: 'text-green-600' },
    error: { icon: AlertCircle, text: 'Lỗi khi lưu', className: 'text-red-600' },
  }[status];

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`w-3.5 h-3.5 ${config.className}`} />
      <span className={config.className}>{config.text}</span>
    </div>
  );
}
