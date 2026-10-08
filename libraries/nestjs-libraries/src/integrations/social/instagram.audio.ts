import { InstagramAudio } from '../../dtos/posts/providers-settings/instagram.dto';

export type InstagramAudioType = 'music' | 'original_sound';

export interface InstagramAudioResult {
  id: string;
  title: string;
  artist: string;
  image: string;
  duration: number;
  previewUrl: string;
  audioType: InstagramAudioType;
  isAdsEligible: boolean | null;
  onPlatformPreviewLink: string | null;
}

// Plain stored tokens may already be User tokens; Meta verifies them against user_id.
// Keep token extraction outside the provider: legacy function dispatch can call class methods.
export function instagramAudioUserToken(token: string): string {
  const [storedToken, userToken] = token?.split('___') || [];
  return userToken || storedToken || '';
}

export const isInstagramAudioId = (value: unknown): value is string =>
  typeof value === 'string' && /^[1-9]\d*$/.test(value);

export const isInstagramAudioVideo = (path: unknown): boolean => {
  if (typeof path !== 'string') return false;
  return /\.mp4$/i.test(path.split(/[?#]/, 1)[0]);
};

export function validateInstagramAudio(
  audio: unknown,
  postType: unknown,
  media: Array<{ path?: string }> | undefined,
  facebookLogin: boolean
): string | true {
  if (audio === undefined || audio === null) return true;
  if (!facebookLogin)
    return 'Instagram audio requires a channel connected with Facebook Login';
  if (typeof audio !== 'object' || Array.isArray(audio))
    return 'Invalid Instagram audio selection';
  const selected = audio as InstagramAudio;
  if (!isInstagramAudioId(selected.id))
    return 'Instagram audio ID must be a non-empty integer ID';
  if (
    selected.audioType !== undefined &&
    !['music', 'original_sound'].includes(selected.audioType)
  ) {
    return 'Invalid Instagram audio type';
  }
  for (const key of ['audio_volume', 'video_volume'] as const) {
    const volume = selected[key];
    if (
      volume !== undefined &&
      (!Number.isInteger(volume) || volume < 0 || volume > 100)
    ) {
      return 'Instagram audio volumes must be integers between 0 and 100';
    }
  }
  if (
    selected.use_for_ads !== undefined &&
    typeof selected.use_for_ads !== 'boolean'
  ) {
    return 'Instagram audio paid-use selection must be a boolean';
  }
  if (postType !== 'post')
    return 'Audio can only be added to Reels, not to Stories';
  if (media?.length !== 1 || !isInstagramAudioVideo(media[0]?.path)) {
    return 'Audio can only be added to a single MP4 video Reel';
  }
  return true;
}

export function instagramAudioConfiguration(audio: InstagramAudio) {
  return {
    audio_id: audio.id,
    ...(audio.audio_volume !== undefined
      ? { audio_volume: audio.audio_volume }
      : {}),
    ...(audio.video_volume !== undefined
      ? { video_volume: audio.video_volume }
      : {}),
  };
}

export function normalizeInstagramAudio(
  raw: any,
  fallbackType?: InstagramAudioType
): InstagramAudioResult {
  if (!raw || !isInstagramAudioId(raw.audio_id))
    throw new Error('Instagram returned an invalid audio ID');
  const audioType = raw.audio_type || fallbackType;
  if (audioType !== 'music' && audioType !== 'original_sound') {
    throw new Error('Instagram returned an unsupported audio type');
  }
  return {
    id: raw.audio_id,
    title: typeof raw.title === 'string' ? raw.title : '',
    artist: raw.display_artist || raw.ig_username || '',
    image:
      raw.cover_artwork_thumbnail_uri ||
      raw.cover_artwork_thumbnail_url ||
      raw.profile_picture_url ||
      '',
    duration:
      typeof raw.duration_in_ms === 'number' &&
      Number.isFinite(raw.duration_in_ms)
        ? raw.duration_in_ms
        : 0,
    previewUrl: typeof raw.download_url === 'string' ? raw.download_url : '',
    audioType,
    isAdsEligible:
      typeof raw.is_ads_eligible === 'boolean' ? raw.is_ads_eligible : null,
    onPlatformPreviewLink:
      typeof raw.on_platform_audio_preview_link === 'string'
        ? raw.on_platform_audio_preview_link
        : null,
  };
}
