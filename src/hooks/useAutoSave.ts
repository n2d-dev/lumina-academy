'use client';

import { useEffect, useRef, useState } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Options<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

/**
 * Auto-save hook với debounce
 * Trigger save khi data thay đổi và đứng yên một khoảng thời gian
 *
 * Trả về status để hiển thị "Đang lưu..." / "Đã lưu" cho user
 */
export function useAutoSave<T>({ data, onSave, delay = 1500, enabled = true }: Options<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);
  const lastSavedDataRef = useRef<string>(JSON.stringify(data));

  useEffect(() => {
    if (!enabled) return;

    // Skip lần đầu (data mới load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentDataStr = JSON.stringify(data);
    if (currentDataStr === lastSavedDataRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await onSave(data);
        lastSavedDataRef.current = currentDataStr;
        setStatus('saved');
        // Reset về idle sau 2s
        setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled]);

  return { status };
}
