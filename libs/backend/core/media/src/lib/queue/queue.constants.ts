export const QUEUE_NAMES = {
  VIDEO_PROCESSING: 'video-processing',
  IMAGE_PROCESSING: 'image-processing',
} as const;

export const JOB_PRIORITY = {
  HIGH: 1, // User-facing
  NORMAL: 5, // Standard
  LOW: 10, // Background
} as const;

export const JOB_TYPES = {
  RESIZE: 'resize',
  MERGE: 'merge',
} as const;
