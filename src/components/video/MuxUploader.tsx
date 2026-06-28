'use client';

import { useState, useRef } from 'react';
import { Upload, FileVideo, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  lessonId: string;
  currentStatus?: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERRORED' | 'CANCELLED';
  currentPlaybackId?: string | null;
  onUploadComplete?: () => void;
  onRemove?: () => void;
}

/**
 * MuxUploader - Direct upload component
 *
 * Workflow:
 * 1. User chọn file
 * 2. Component request upload URL từ /api/mux/upload
 * 3. PUT file lên Mux URL với XMLHttpRequest (để track progress)
 * 4. Mux nhận xong → trigger webhook → DB update
 * 5. Component poll status mỗi 3s đến khi READY
 *
 * Tại sao XMLHttpRequest mà không phải fetch:
 * - fetch() không có progress event
 * - XMLHttpRequest có upload.onprogress để show % real-time
 */
export function MuxUploader({
  lessonId,
  currentStatus = 'PENDING',
  currentPlaybackId,
  onUploadComplete,
  onRemove,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'uploading' | 'processing' | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Chỉ chấp nhận file video (MP4, MOV, WebM)');
      return;
    }

    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error('File quá lớn (tối đa 5GB)');
      return;
    }

    setUploading(true);
    setStage('uploading');
    setProgress(0);

    try {
      // 1. Request upload URL
      const presignRes = await fetch('/api/mux/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.message ?? 'Không thể tạo upload session');
      }

      const { uploadUrl } = await presignRes.json();

      // 2. Upload file với XMLHttpRequest để track progress
      await uploadWithProgress(file, uploadUrl, (pct) => setProgress(pct));

      // 3. Switch sang stage processing
      setStage('processing');
      setProgress(0);

      // 4. Poll status đến khi READY
      await pollLessonStatus(lessonId);

      toast.success('Video đã sẵn sàng phát!');
      onUploadComplete?.();
    } catch (err: any) {
      toast.error(err.message ?? 'Upload thất bại');
    } finally {
      setUploading(false);
      setStage(null);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    xhrRef.current?.abort();
    setUploading(false);
    setStage(null);
    setProgress(0);
  };

  const uploadWithProgress = (
    file: File,
    url: string,
    onProgress: (pct: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed với status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.onabort = () => reject(new Error('Upload bị hủy'));

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  /**
   * Poll status của lesson cho đến khi muxStatus = READY hoặc ERRORED
   * Webhook từ Mux thường mất vài giây đến 1 phút tùy độ dài video
   */
  const pollLessonStatus = async (id: string, maxAttempts = 60): Promise<void> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000)); // 3s

      const res = await fetch(`/api/instructor/lessons/${id}/status`);
      if (res.ok) {
        const data = await res.json();

        // Tính progress giả lập cho UI (Mux không trả % thật cho processing)
        setProgress(Math.min(95, (i / maxAttempts) * 100));

        if (data.muxStatus === 'READY') return;
        if (data.muxStatus === 'ERRORED') {
          throw new Error('Mux không thể xử lý video này. Hãy thử file khác.');
        }
      }
    }
    throw new Error('Timeout: video xử lý quá lâu. Vui lòng kiểm tra lại sau.');
  };

  /* =============== RENDER =============== */

  // Có video sẵn sàng
  if (currentStatus === 'READY' && currentPlaybackId && !uploading) {
    return (
      <div className="border-2 border-green-200 bg-green-50 dark:bg-green-950/30 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
        <div className="flex-1">
          <p className="font-bold text-sm text-green-900">Video đã sẵn sàng</p>
          <p className="text-xs text-green-700 mt-0.5">
            Mux Playback ID: {currentPlaybackId.slice(0, 16)}...
          </p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:bg-red-950/30 rounded-lg"
          >
            Đổi video
          </button>
        )}
      </div>
    );
  }

  // Errored
  if (currentStatus === 'ERRORED' && !uploading) {
    return (
      <div className="border-2 border-red-200 bg-red-50 dark:bg-red-950/30 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <div className="flex-1">
          <p className="font-bold text-sm text-red-900">Video xử lý thất bại</p>
          <p className="text-xs text-red-700 mt-0.5">Vui lòng upload lại</p>
        </div>
        <FileInput onSelect={handleFileSelect} />
      </div>
    );
  }

  // Đang upload
  if (uploading) {
    return (
      <div className="border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {stage === 'uploading' ? 'Đang upload video...' : 'Mux đang xử lý...'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stage === 'uploading'
                ? 'Vui lòng không tắt tab'
                : 'Mux đang encode nhiều chất lượng. Có thể mất 1-5 phút.'}
            </p>
          </div>
          {stage === 'uploading' && (
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-muted rounded-lg"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-2 bg-yellow-100 dark:bg-yellow-950/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">{progress}%</p>
      </div>
    );
  }

  // Processing (mất kết nối khi upload xong)
  if (currentStatus === 'PROCESSING' || currentStatus === 'UPLOADING') {
    return (
      <div className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <div className="flex-1">
          <p className="font-bold text-sm text-blue-900">Đang xử lý...</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Reload trang sau vài phút để xem trạng thái mới
          </p>
        </div>
      </div>
    );
  }

  // Default: chưa có video
  return (
    <label
      className={`block border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors border-border hover:border-foreground hover:bg-muted/40`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <Upload className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="font-bold text-sm mb-1">Tải video lên Mux</p>
        <p className="text-xs text-muted-foreground">
          MP4, MOV, WebM • Tối đa 5GB • Tự động encode adaptive
        </p>
      </div>
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
    </label>
  );
}

function FileInput({ onSelect }: { onSelect: (file: File) => void }) {
  return (
    <label className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg cursor-pointer hover:border-foreground">
      Upload lại
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
    </label>
  );
}
