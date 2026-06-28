'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Upload, FileVideo, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
import { formatDuration } from '@/lib/utils';

// Mux Uploader là web component, dynamic import để tránh SSR issues
const MuxUploader = dynamic(() => import('@mux/mux-uploader-react'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface Props {
  lessonId: string;
  initialStatus: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERRORED' | 'CANCELLED';
  initialPlaybackId?: string | null;
  initialDuration?: number;
  onUploadComplete?: () => void;
}

/**
 * VideoUploader cho instructor
 *
 * 4 states UI:
 * 1. PENDING: hiển thị nút "Tải video lên" → click để get upload URL
 * 2. UPLOADING: hiện MuxUploader với progress bar
 * 3. PROCESSING: video đã upload, Mux đang transcode
 * 4. READY: hiển thị thumbnail + nút "Đổi video"
 *
 * Workflow:
 * 1. User click "Tải video" → POST /api/instructor/lessons/[id]/upload
 * 2. Server tạo Mux Direct Upload, trả về uploadUrl
 * 3. Render MuxUploader với endpoint = uploadUrl
 * 4. Mux Uploader xử lý chunked upload với progress
 * 5. Upload xong → Mux gửi webhook → server update status
 * 6. Component poll status mỗi 3s đến khi READY
 */
export function VideoUploader({
  lessonId,
  initialStatus,
  initialPlaybackId,
  initialDuration,
  onUploadComplete,
}: Props) {
  const { call, loading } = useApi();
  const [status, setStatus] = useState(initialStatus);
  const [playbackId, setPlaybackId] = useState(initialPlaybackId);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  // Poll status khi đang UPLOADING/PROCESSING
  useEffect(() => {
    if (status !== 'UPLOADING' && status !== 'PROCESSING') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/instructor/lessons/${lessonId}`);
        if (!res.ok) return;
        const { lesson } = await res.json();

        if (lesson.muxStatus !== status) {
          setStatus(lesson.muxStatus);
          if (lesson.muxStatus === 'READY') {
            setPlaybackId(lesson.muxPlaybackId);
            setDuration(lesson.duration);
            toast.success('Video đã sẵn sàng!');
            onUploadComplete?.();
          } else if (lesson.muxStatus === 'ERRORED') {
            toast.error('Có lỗi khi xử lý video');
          }
        }
      } catch {
        // Silent fail - sẽ retry ở interval tiếp
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, lessonId, onUploadComplete]);

  const handleStartUpload = async () => {
    try {
      const result = await call(
        `/api/instructor/lessons/${lessonId}/upload`,
        { method: 'POST' }
      );
      setUploadUrl(result.uploadUrl);
      setStatus('UPLOADING');
    } catch {
      // Toast đã handled
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa video này khỏi bài học?')) return;
    await call(
      `/api/instructor/lessons/${lessonId}/upload`,
      { method: 'DELETE' },
      { successMessage: 'Đã xóa video' }
    );
    setStatus('PENDING');
    setPlaybackId(null);
    setDuration(0);
    setUploadUrl(null);
  };

  /* ============ RENDER STATES ============ */

  // READY: hiển thị video preview
  if (status === 'READY' && playbackId) {
    return (
      <div className="border-2 border-green-200 bg-green-50 dark:bg-green-950/30 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm text-green-900">Video đã sẵn sàng</p>
            <p className="text-xs text-green-700">
              Thời lượng: {formatDuration(duration)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </Button>
        </div>

        {/* Thumbnail preview */}
        <img
          src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=640`}
          alt="Video thumbnail"
          className="w-full aspect-video object-cover rounded-xl"
        />
      </div>
    );
  }

  // PROCESSING: video đã upload, Mux đang transcode
  if (status === 'PROCESSING') {
    return (
      <div className="border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-4">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin flex-shrink-0" />
          <div>
            <p className="font-bold">Đang xử lý video...</p>
            <p className="text-sm text-muted-foreground">
              Mux đang transcode video sang nhiều chất lượng (HLS adaptive). Việc này thường mất 1-5 phút tùy độ dài video.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-card rounded-lg p-3">
          ✨ Bạn có thể tiếp tục làm việc khác. Trang sẽ tự cập nhật khi xong.
        </div>
      </div>
    );
  }

  // UPLOADING: hiện MuxUploader
  if (status === 'UPLOADING' && uploadUrl) {
    return (
      <div className="border-2 border-yellow-400 rounded-2xl p-6 bg-yellow-50 dark:bg-yellow-950/30">
        <p className="text-sm font-bold mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Đang tải video lên Mux
        </p>
        <MuxUploader
          endpoint={uploadUrl}
          onSuccess={() => {
            toast.success('Upload xong! Đang xử lý video...');
            setStatus('PROCESSING');
            setUploadUrl(null);
          }}
          onUploadError={(detail: any) => {
            toast.error(`Lỗi upload: ${detail?.detail?.message ?? 'Unknown'}`);
            setStatus('PENDING');
          }}
          style={{
            // Customize MuxUploader appearance
            // @ts-expect-error - CSS custom properties
            '--button-border-radius': '9999px',
            '--button-background-color': '#000',
            '--button-hover-background': '#262626',
            width: '100%',
          }}
        />
        <p className="text-xs text-muted-foreground mt-3">
          💡 Đừng đóng tab trong khi đang upload. Mux hỗ trợ resumable upload nên nếu lỗi mạng có thể tiếp tục.
        </p>
      </div>
    );
  }

  // ERRORED
  if (status === 'ERRORED') {
    return (
      <div className="border-2 border-red-300 bg-red-50 dark:bg-red-950/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-red-900">Lỗi xử lý video</p>
            <p className="text-sm text-red-700">
              Video không thể xử lý được. File có thể bị corrupt hoặc format không support.
            </p>
          </div>
        </div>
        <Button onClick={handleStartUpload} disabled={loading}>
          Thử upload lại
        </Button>
      </div>
    );
  }

  // PENDING (default): hiện nút bắt đầu upload
  return (
    <button
      onClick={handleStartUpload}
      disabled={loading}
      className="w-full border-2 border-dashed border-border rounded-2xl p-12 hover:border-foreground hover:bg-muted/40 transition-colors flex flex-col items-center justify-center"
    >
      {loading ? (
        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-3" />
      ) : (
        <Upload className="w-12 h-12 text-muted-foreground mb-3" />
      )}
      <p className="font-bold mb-1">Tải video lên</p>
      <p className="text-xs text-muted-foreground">
        MP4, MOV, WebM • Tối đa 5GB • Mux sẽ tự transcode
      </p>
    </button>
  );
}
