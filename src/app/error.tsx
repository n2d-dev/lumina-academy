'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <div className="text-8xl sm:text-9xl font-black text-muted select-none leading-none">
          Oops
        </div>
        <div className="relative -mt-6">
          <div className="w-16 h-16 bg-red-400 rounded-2xl rotate-12 mx-auto flex items-center justify-center shadow-lg">
            <span className="text-2xl -rotate-12">⚠️</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black mb-3">Có lỗi xảy ra</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc quay về trang chủ.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-colors"
        >
          Thử lại
        </button>
        <a
          href="/"
          className="px-6 py-3 border-2 border-border font-bold rounded-full hover:border-foreground transition-colors"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
