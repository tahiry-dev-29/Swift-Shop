export const SOCIAL_MEDIA_QUEUE = 'social-media-queue';

export const SOCIAL_MEDIA_JOBS = {
  PUBLISH_POST: 'publish-post',
  SYNC_CATALOG: 'sync-catalog',
} as const;

export const SOCIAL_MEDIA_PRIORITY = {
  HIGH: 1, // Immediate user action
  NORMAL: 5, // Standard scheduled post
  LOW: 10, // Background sync
} as const;
