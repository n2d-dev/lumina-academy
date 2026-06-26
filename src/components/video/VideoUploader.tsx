'use client';

import { useState } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { Upload, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface Props {
  lessonId: string;
  // Status hiện tại của video (từ DB)
  currentStatus?: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERRORED' | 'CANCELLED';
  duration?: number;
  // Callback khi upload thành công
  onUploadStarted?: () => void;
  onUploadCompleted?: () => void;
}

/**
 * Video Uploader cho instructor
 *
 * Workflow:
 * 1. User click → request /api/mux/upload → nhận uploadUrl
 * 2. Mux Uploader component upload trực tiếp lên Mux qua tus protocol
 *    (resumable, chunked upload - reliable cho file lớn 5GB+)
 * 3. Upload xong → Mux trigger webhook → DB update status PROCESSING
 * 4. Sau 1-3 phút → Mux trigger asset.ready → DB update status READY
 *
 * Cấu trúc UI dựa trên status:
 * - PENDING/CANCELLED: hiển thị button upload
 * - UPLOADING: progress bar (Mux Uploader handle)
 * - PROCESSING: "Đang xử lý..." spinner
 * - READY: thumbnail preview + button replace
 * - ERRORED: error message + button retry
 */
export function VideoUploader({
  lessonId,
  currentStatus = 'PENDING',
  duration = 0,
  onUploadStarted,
  onUploadCompleted,
}: Props) {
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  /**
   * Request upload URL từ server
   */
  const handleStartUpload = async () => {
    setRequesting(true);
    try {
      const res = await fetch('/api/mux/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUploadUrl(data.uploadUrl);
      setStatus('UPLOADING');
      onUploadStarted?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRequesting(false);
    }
  };

  /* ============ RENDER STATES ============ */

  // READY - hiển thị success state với option replace
  if (status === 'READY') {
    return (
      <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-green-900">Video sẵn sàng phát</p>
            <p className="text-xs text-green-700 mt-1">
              Đã transcode multi-bitrate, học viên có thể xem
              {duration > 0 && ` (${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')})`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStatus('PENDING')}
          className="text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Đổi video khác
        </Button>
      </div>
    );
  }

  // PROCESSING - đang transcode
  if (status === 'PROCESSING') {
    return (
      <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-blue-900">Đang xử lý video</p>
            <p className="text-xs text-blue-700 mt-1">
              Mux đang transcode video sang nhiều resolution. Quá trình này thường mất 1-3 phút.
              Bạn có thể tiếp tục công việc khác, hệ thống sẽ tự cập nhật khi xong.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              💡 Refresh trang sau vài phút để xem trạng thái mới nhất.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ERRORED
  if (status === 'ERRORED') {
    return (
      <div className="border-2 border-red-200 bg-red-50 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-900">Lỗi xử lý video</p>
            <p className="text-xs text-red-700 mt-1">
              Có lỗi khi Mux xử lý video. Vui lòng thử upload lại.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setStatus('PENDING')}>
          <RotateCcw className="w-3.5 h-3.5" />
          Thử lại
        </Button>
      </div>
    );
  }

  // UPLOADING - đã có uploadUrl, hiển thị Mux Uploader
  if (status === 'UPLOADING' && uploadUrl) {
    return (
      <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl p-5">
        <p className="font-bold text-sm mb-3">Đang upload lên Mux...</p>

        {/* Mux Uploader component handle UI upload */}
        <MuxUploader
          endpoint={uploadUrl}
          onSuccess={() => {
            toast.success('Upload thành công! Mux đang xử lý video...');
            setStatus('PROCESSING');
            setUploadUrl(null);
            onUploadCompleted?.();
          }}
          onUploadError={(e: any) => {
            toast.error(`Lỗi upload: ${e.detail?.message ?? 'Unknown error'}`);
            setStatus('ERRORED');
            setUploadUrl(null);
          }}
        />

        <p className="text-xs text-neutral-600 mt-3">
          ⏱ File lớn có thể mất vài phút. Đừng đóng tab này.
        </p>
      </div>
    );
  }

  // PENDING / CANCELLED - hiển thị button upload
  return (
    <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 hover:border-black transition-colors">
      <div className="text-center">
        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
        <p className="font-bold text-sm mb-1">Upload video bài học</p>
        <p className="text-xs text-neutral-500 mb-4">
          MP4, MOV, WebM • Tối đa 5GB • Tự động transcode multi-bitrate
        </p>
        <Button onClick={handleStartUpload} disabled={requesting}>
          {requesting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang chuẩn bị...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Chọn video để upload
            </>
          )}
        </Button>

        <p className="text-xs text-neutral-400 mt-4">
          Powered by{' '}
          <a
            href="https://mux.com"
            target="_blank"
            rel="noopener"
            className="underline hover:text-black"
          >
            Mux
          </a>
        </p>
      </div>
    </div>
  );
}
