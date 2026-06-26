'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  successMessage?: string;
}

/**
 * Custom hook để gọi API với loading state và error handling
 *
 * Usage:
 *   const { call, loading } = useApi();
 *   const result = await call('/api/instructor/courses', { method: 'POST', body: ... });
 */
export function useApi() {
  const [loading, setLoading] = useState(false);

  async function call(
    url: string,
    init?: Omit<RequestInit, 'body'> & { body?: any },
    options?: ApiOptions
  ) {
    setLoading(true);
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
        body: init?.body ? JSON.stringify(init.body) : undefined,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? 'Lỗi không xác định');
      }

      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
      return data;
    } catch (err: any) {
      toast.error(err.message);
      options?.onError?.(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { call, loading };
}
