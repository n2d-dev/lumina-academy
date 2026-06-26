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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <div className="text-8xl sm:text-9xl font-black text-neutral-100 select-none leading-none">
          Oops
        </div>
        <div className="relative -mt-6">
          <div className="w-16 h-16 bg-red-400 rounded-2xl rotate-12 mx-auto flex items-center justify-center shadow-lg">
            <span className="text-2xl -rotate-12">⚠️</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black mb-3">Có lỗi xảy ra</h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc quay về trang chủ.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors"
        >
          Thử lại
        </button>
        <a
          href="/"
          className="px-6 py-3 border-2 border-neutral-200 font-bold rounded-full hover:border-black transition-colors"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
