'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Loader2, AlertCircle, Play } from 'lucide-react';

interface Props {
  lessonId: string;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  // Optional: previous progress để resume
  startTime?: number;
}

interface PlaybackData {
  playbackId: string;
  videoToken: string;
  thumbnailToken: string;
}

/**
 * Video Player với Mux Player React
 *
 * Tính năng:
 * - HLS adaptive bitrate streaming (auto chọn quality)
 * - Signed playback với JWT (anti-hotlinking)
 * - Auto track watch progress qua onTimeUpdate
 * - Track completion (xem >= 90% lesson)
 * - Resume từ vị trí trước
 * - Captions/CC support (nếu Mux đã transcribe)
 *
 * Auth flow:
 * 1. Component mount → fetch /api/mux/playback → nhận token
 * 2. Token tự refresh sau khi gần hết hạn
 * 3. Mux Player handle hết phần streaming + UI
 */
export function VideoPlayer({
  lessonId,
  onComplete,
  onTimeUpdate,
  startTime = 0,
}: Props) {
  const [data, setData] = useState<PlaybackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch playback token khi mount + refresh khi cần
  useEffect(() => {
    let cancelled = false;
    let refreshTimer: NodeJS.Timeout;

    async function fetchToken() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/mux/playback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        if (cancelled) return;
        setData(json);
        setLoading(false);

        // Refresh token sau 5h30m (token sống 6h, refresh sớm để không bị ngắt)
        refreshTimer = setTimeout(fetchToken, 5.5 * 60 * 60 * 1000);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      }
    }

    fetchToken();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [lessonId]);

  /* ============ RENDER STATES ============ */

  if (loading) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Đang tải video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white px-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="font-bold mb-1">Không thể tải video</p>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Play className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Video chưa sẵn sàng</p>
        </div>
      </div>
    );
  }

  return (
    <MuxPlayer
      playbackId={data.playbackId}
      tokens={{
        playback: data.videoToken,
        thumbnail: data.thumbnailToken,
      }}
      // Mux Player UI customization
      accentColor="#facc15"
      style={{ aspectRatio: '16/9' }}
      // Resume từ vị trí trước
      startTime={startTime}
      // Track time update để lưu progress
      onTimeUpdate={(e: any) => {
        const video = e.target;
        if (onTimeUpdate && video) {
          onTimeUpdate(video.currentTime, video.duration);
        }
        // Đánh dấu hoàn thành khi xem >= 90%
        if (
          onComplete &&
          video.duration > 0 &&
          video.currentTime / video.duration > 0.9
        ) {
          onComplete();
        }
      }}
      // Mux analytics - track engagement
      metadata={{
        video_id: lessonId,
        // Có thể thêm video_title, viewer_user_id... cho analytics
      }}
      // Streaming type (Mux auto detect, nhưng explicit cho clarity)
      streamType="on-demand"
    />
  );
}
