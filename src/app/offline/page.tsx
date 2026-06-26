export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-5xl">📡</span>
      </div>
      <h1 className="text-3xl font-black mb-3">Không có kết nối mạng</h1>
      <p className="text-neutral-600 mb-8 max-w-sm leading-relaxed">
        Lumina cần kết nối internet để hoạt động. Kiểm tra mạng của bạn và thử lại.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-4 bg-black text-white font-bold rounded-full active:scale-95 transition-all touch-manipulation"
      >
        Thử lại
      </button>
    </div>
  );
}
