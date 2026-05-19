export type MediaInput = {
  type: 'image' | 'video';
  url: string;
  startSec?: number;
  durationSec?: number;
};

export const FPS = 30;
export const HOOK_SEC = 2;
export const COUNTDOWN_SEC = 3;
export const INFO_SEC = 2;
export const CTA_SEC = 2;
export const BEFORE_SLOT_SEC = 4;
export const AFTER_SLOT_SEC = 6;

export const BGM_BASE_VOLUME = 0.45;
export const BGM_FADE_OUT_SEC = 0.5;
export const BGM_FADE_IN_SEC = 0.3;

export const resolveSceneSeconds = (
  media: MediaInput,
  slotSec: number
): number => {
  if (media.type === 'image') return slotSec;
  if (typeof media.durationSec === 'number' && media.durationSec > 0) {
    return Math.min(media.durationSec, slotSec);
  }
  return slotSec;
};

export const computeTotalFrames = (
  beforeMedia: MediaInput,
  afterMedia: MediaInput
): number => {
  const beforeSec = resolveSceneSeconds(beforeMedia, BEFORE_SLOT_SEC);
  const afterSec = resolveSceneSeconds(afterMedia, AFTER_SLOT_SEC);
  const totalSec =
    HOOK_SEC + beforeSec + COUNTDOWN_SEC + afterSec + INFO_SEC + CTA_SEC;
  return Math.round(totalSec * FPS);
};
