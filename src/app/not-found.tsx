import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <div className="text-8xl sm:text-9xl font-black text-neutral-100 select-none leading-none">
          404
        </div>
        <div className="relative -mt-6">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl rotate-12 mx-auto flex items-center justify-center shadow-lg">
            <span className="text-2xl -rotate-12">🔍</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black mb-3">Trang không tồn tại</h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        Trang bạn tìm kiếm đã bị xóa, đổi tên hoặc chưa từng tồn tại.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors"
        >
          Về trang chủ
        </Link>
        <Link
          href="/courses"
          className="px-6 py-3 border-2 border-neutral-200 font-bold rounded-full hover:border-black transition-colors"
        >
          Khám phá khóa học
        </Link>
      </div>
    </div>
  );
}
