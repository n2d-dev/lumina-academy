export type MuxStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'ERRORED'
  | 'CANCELLED';

export interface LessonWithMux {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  isPreview: boolean;
  muxStatus: MuxStatus;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
  muxUploadId: string | null;
  muxAspectRatio: string | null;
  muxMaxResolution: string | null;
}
