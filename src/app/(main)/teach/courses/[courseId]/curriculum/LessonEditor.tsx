'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VideoUploader } from '@/components/video/VideoUploader';
import { toast } from 'sonner';
import type { MuxStatus } from '@/types/lesson';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  order?: number;
  isPreview: boolean;
  muxStatus: MuxStatus;
  muxPlaybackId: string | null;
}

interface Props {
  lesson: Lesson;
  onSave: (lesson: Lesson) => Promise<void>;
  onClose: () => void;
}

/**
 * Lesson Editor Modal (v4 - Mux integration)
 *
 * Khác biệt so với v2/v3:
 * - Bỏ hoàn toàn upload mock (S3 presigned URL)
 * - Dùng VideoUploader tích hợp Mux:
 *   - Direct upload từ browser → Mux (không qua server)
 *   - Auto transcode multi-bitrate (HLS)
 *   - Status được webhook tự cập nhật
 *
 * Status flow: PENDING → UPLOADING → PROCESSING → READY
 */
export function LessonEditor({ lesson: initialLesson, onSave, onClose }: Props) {
  const [lesson, setLesson] = useState(initialLesson);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Lesson>(key: K, value: Lesson[K]) => {
    setLesson((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (lesson.title.length < 3) {
      toast.error('Tiêu đề ít nhất 3 ký tự');
      return;
    }
    setSaving(true);
    try {
      // Note: ta KHÔNG save muxStatus/muxPlaybackId từ client.
      // Webhook tự update qua DB.
      await onSave({
        ...lesson,
        // Giữ nguyên các Mux fields, chỉ update title/description/isPreview
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 overflow-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl w-full max-w-2xl my-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-black font-display">Chỉnh sửa bài học</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-bold mb-2 block">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <Input
              value={lesson.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ví dụ: Giới thiệu về React Hooks"
              maxLength={150}
            />
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">Mô tả</label>
            <textarea
              value={lesson.description ?? ''}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 border-2 border-border rounded-xl outline-none focus:border-foreground resize-none"
              placeholder="Mô tả ngắn gọn nội dung bài học..."
            />
          </div>

          {/* Video uploader - tích hợp Mux */}
          <div>
            <label className="text-sm font-bold mb-2 block">Video bài học</label>
            <VideoUploader
              lessonId={lesson.id}
              currentStatus={lesson.muxStatus}
              duration={lesson.duration}
            />
          </div>

          {/* Preview toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
            <div>
              <p className="font-bold text-sm">Cho phép xem trước miễn phí</p>
              <p className="text-xs text-muted-foreground mt-1">
                Học viên chưa mua khóa học có thể xem bài này
              </p>
            </div>
            <button
              role="switch"
              aria-checked={lesson.isPreview}
              onClick={() => update('isPreview', !lesson.isPreview)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                lesson.isPreview ? 'bg-yellow-400' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-card rounded-full transition-transform shadow ${
                  lesson.isPreview ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu bài học'}
          </Button>
        </div>
      </div>
    </div>
  );
}
