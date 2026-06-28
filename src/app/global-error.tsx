'use client';

import { useEffect } from 'react';

/**
 * Global error boundary — bắt lỗi xảy ra ngay trong root layout.
 * Bắt buộc tự render <html>/<body> vì layout gốc đã bị thay thế.
 */
export default function GlobalError({
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
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            textAlign: 'center',
            background: '#fff',
            color: '#171717',
          }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Có lỗi nghiêm trọng xảy ra
          </h1>
          <p style={{ color: '#737373', marginBottom: '2rem', maxWidth: '24rem' }}>
            Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#000',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Tải lại
          </button>
        </div>
      </body>
    </html>
  );
}
