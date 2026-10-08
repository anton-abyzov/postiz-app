'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '@gitroom/frontend/components/launches/helpers/use.values';
import { useCustomProviderFunction } from '@gitroom/frontend/components/launches/helpers/use.custom.provider.function';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface AudioResult {
  id: string;
  title: string;
  artist: string;
  image: string;
  duration: number;
  previewUrl: string;
  audioType?: 'music' | 'original_sound';
  isAdsEligible?: boolean | null;
  onPlatformPreviewLink?: string;
}

interface SelectedAudio {
  id: string;
  title?: string;
  artist?: string;
  image?: string;
  audioType?: 'music' | 'original_sound';
  audio_volume?: number;
  video_volume?: number;
  use_for_ads?: boolean;
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export const InstagramAudioSelector: FC<{
  name: string;
  label: string;
  disabled?: boolean;
  onChange: (event: {
    target: { value: SelectedAudio | undefined; name: string };
  }) => void;
}> = ({ name, label, disabled, onChange }) => {
  const t = useT();
  const { getValues } = useSettings();
  const { get } = useCustomProviderFunction();
  const [value, setValue] = useState<SelectedAudio | undefined>(
    () => getValues()[name]
  );
  const [open, setOpen] = useState(false);
  const [audioType, setAudioType] = useState<'music' | 'original_sound'>(
    'music'
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AudioResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingId, setPlayingId] = useState('');
  const [forAds, setForAds] = useState(() => !!getValues()[name]?.use_for_ads);
  const [retry, setRetry] = useState(0);
  const player = useRef<HTMLAudioElement | undefined>(undefined);
  const selector = useRef<HTMLDivElement | null>(null);
  const control =
    'min-h-[44px] max-w-full shrink-0 px-[12px] bg-newBgColorInner border-newTableBorder border rounded-[8px] text-[14px]';
  const stopPreview = useCallback(() => {
    player.current?.pause();
    player.current = undefined;
    setPlayingId('');
  }, []);
  useEffect(() => stopPreview, [stopPreview]);
  useEffect(() => {
    if (!selector.current) return;
    const element = selector.current;
    const observer = new ResizeObserver(() => {
      if (!element.getClientRects().length) stopPreview();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [stopPreview, disabled]);

  const emit = useCallback(
    (next: SelectedAudio | undefined) => {
      setValue(next);
      onChange({ target: { value: next, name } });
    },
    [name, onChange]
  );

  useEffect(() => {
    if (!open || disabled) return;
    let cancelled = false;
    stopPreview();
    setLoading(true);
    setError('');
    setResults([]);
    const timer = setTimeout(async () => {
      try {
        const list = await get('audioSearch', {
          q: query.trim(),
          type: audioType,
        });
        if (!Array.isArray(list)) throw new Error('Catalog request failed');
        if (!cancelled) setResults(list);
      } catch {
        if (!cancelled)
          setError(
            t(
              'instagram_audio_catalog_error',
              'Music catalog unavailable. Check this account’s Facebook connection and permissions, then retry.'
            )
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, audioType, open, disabled, get, retry, stopPreview, t]);

  const togglePreview = useCallback(
    async (track: AudioResult) => {
      if (playingId === track.id) {
        stopPreview();
        return;
      }
      stopPreview();
      if (!track.previewUrl) return;
      const next = new Audio(track.previewUrl);
      player.current = next;
      next.onended = () => {
        if (player.current === next) stopPreview();
      };
      next.onerror = () => {
        if (player.current === next) {
          stopPreview();
          setError(
            t(
              'instagram_audio_preview_error',
              'Preview unavailable or expired. Search again to refresh it.'
            )
          );
        }
      };
      try {
        await next.play();
        if (player.current === next) setPlayingId(track.id);
      } catch {
        if (player.current === next) {
          stopPreview();
          setError(
            t(
              'instagram_audio_preview_error',
              'Preview unavailable or expired. Search again to refresh it.'
            )
          );
        }
      }
    },
    [playingId, stopPreview, t]
  );

  const select = (track: AudioResult) => {
    if (forAds && track.isAdsEligible !== true) return;
    stopPreview();
    setOpen(false);
    setError('');
    emit({
      id: track.id,
      title: track.title,
      artist: track.artist,
      image: track.image,
      audioType: track.audioType || audioType,
      audio_volume: 20,
      video_volume: 100,
      use_for_ads: forAds,
    });
  };

  if (disabled)
    return (
      <div className="flex flex-col gap-[6px]">
        <div className="text-[14px]">{label}</div>
        <p className="text-[12px] opacity-70">
          {t(
            'instagram_audio_facebook_login_only',
            'Connect Instagram through Facebook Login to select music. This connection cannot attach catalog tracks.'
          )}
        </p>
      </div>
    );

  return (
    <div
      className="flex flex-col min-w-0 w-full gap-[10px]"
      ref={selector}
      data-testid="instagram-audio-selector"
    >
      <div className="text-[14px]">{label}</div>
      <p className="text-[12px] opacity-70">
        {t(
          'instagram_audio_catalog_note',
          'Trending tracks are account-specific. Meta rechecks availability before publishing. Keep a clean video master for other platforms.'
        )}
      </p>
      {value?.id && (
        <div className="flex flex-col gap-[12px] bg-newBgColorInner border-newTableBorder border rounded-[8px] p-[12px]">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-[12px]">
            {!!value.image && (
              <img
                src={value.image}
                alt=""
                className="w-[42px] h-[42px] shrink-0 rounded-[8px] object-cover"
              />
            )}
            <div className="flex-1 min-w-[140px] sm:min-w-0">
              <div className="text-[14px] break-words">
                {value.title || value.id}
              </div>
              <div className="text-[12px] opacity-70 break-words">
                {value.artist}
              </div>
            </div>
            <button
              type="button"
              className={control}
              aria-label={t('instagram_remove_audio', 'Remove audio')}
              onClick={() => {
                stopPreview();
                emit(undefined);
              }}
            >
              {t('remove', 'Remove')}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-[18px]">
            {(['audio_volume', 'video_volume'] as const).map((key) => (
              <label
                key={key}
                className="flex-1 flex flex-col gap-[6px] text-[12px]"
              >
                {key === 'audio_volume'
                  ? t('instagram_audio_volume', 'Music volume')
                  : t('instagram_video_volume', 'Original video volume')}{' '}
                ({value[key] ?? 100})
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value[key] ?? 100}
                  onChange={(event) =>
                    emit({ ...value, [key]: +event.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-[8px] text-[12px] min-h-[44px]">
            <input
              type="checkbox"
              checked={!!value.use_for_ads}
              onChange={(event) => {
                setForAds(event.target.checked);
                emit({ ...value, use_for_ads: event.target.checked });
              }}
            />
            {t(
              'instagram_audio_use_for_ads',
              'This Reel will be boosted or used in an ad (Meta must confirm music eligibility)'
            )}
          </label>
          <button
            type="button"
            className={control}
            onClick={() => setOpen(true)}
          >
            {t('instagram_change_audio', 'Change track')}
          </button>
        </div>
      )}
      {!open ? (
        !value?.id && (
          <button
            type="button"
            className={`${control} self-start`}
            onClick={() => setOpen(true)}
          >
            {t('instagram_add_audio', 'Add music')}
          </button>
        )
      ) : (
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-wrap gap-[6px]">
            <select
              className={control}
              aria-label={t('instagram_audio_type', 'Audio type')}
              value={audioType}
              onChange={(event) =>
                setAudioType(event.target.value as 'music' | 'original_sound')
              }
            >
              <option value="music">{t('instagram_music', 'Music')}</option>
              <option value="original_sound">
                {t('instagram_original_sound', 'Original sound')}
              </option>
            </select>
            <input
              className={`${control} flex-1 min-w-[160px] max-w-full w-full bg-transparent outline-none`}
              aria-label={t('instagram_search_audio', 'Search artist or track')}
              placeholder={t(
                'instagram_search_audio_hint',
                'Search artist or track; leave blank for trending'
              )}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className={control}
              onClick={() => {
                stopPreview();
                setOpen(false);
                setError('');
              }}
            >
              {t('cancel', 'Cancel')}
            </button>
          </div>
          <label className="flex items-center gap-[8px] text-[12px] min-h-[44px]">
            <input
              type="checkbox"
              checked={forAds}
              onChange={(event) => setForAds(event.target.checked)}
            />
            {t(
              'instagram_audio_only_ads',
              'Show only tracks Meta marks eligible for ads'
            )}
          </label>
          <div
            className="max-h-[280px] overflow-y-auto flex flex-col bg-newBgColorInner border-newTableBorder border rounded-[8px]"
            aria-live="polite"
          >
            {loading ? (
              <p className="p-[12px] text-[14px]">
                {t('loading', 'Loading...')}
              </p>
            ) : error ? (
              <div role="alert" className="p-[12px] text-[14px]">
                <p>{error}</p>
                <button
                  type="button"
                  className={`${control} mt-[8px]`}
                  onClick={() => setRetry((n) => n + 1)}
                >
                  {t('retry', 'Retry')}
                </button>
              </div>
            ) : !results.filter(
                (track) => !forAds || track.isAdsEligible === true
              ).length ? (
              <p className="p-[12px] text-[14px] opacity-70">
                {t(
                  'instagram_no_audio_found',
                  'No available tracks for this search and account.'
                )}
              </p>
            ) : (
              results
                .filter((track) => !forAds || track.isAdsEligible === true)
                .map((track) => (
                  <div
                    key={track.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-[8px] p-[8px] border-b border-newTableBorder last:border-b-0"
                  >
                    {!!track.image && (
                      <img
                        src={track.image}
                        alt=""
                        className="w-[36px] h-[36px] shrink-0 rounded-[8px] object-cover"
                      />
                    )}
                    <button
                      type="button"
                      className="flex-1 min-w-[140px] sm:min-w-0 text-left min-h-[44px]"
                      onClick={() => select(track)}
                    >
                      <div className="text-[14px] break-words">
                        {track.title}
                      </div>
                      <div className="text-[12px] opacity-70 break-words">
                        {[track.artist, formatDuration(track.duration)]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                      <div className="text-[11px] opacity-70">
                        {track.isAdsEligible === true
                          ? t(
                              'instagram_audio_ads_eligible',
                              'Meta: ads eligible'
                            )
                          : track.isAdsEligible === false
                          ? t(
                              'instagram_audio_organic_only',
                              'Meta: not eligible for ads'
                            )
                          : t(
                              'instagram_audio_ads_unknown',
                              'Ads eligibility unknown'
                            )}
                      </div>
                    </button>
                    {!!track.previewUrl && (
                      <button
                        type="button"
                        className={control}
                        aria-label={`${
                          playingId === track.id ? 'Stop' : 'Preview'
                        } ${track.title}`}
                        onClick={() => void togglePreview(track)}
                      >
                        {playingId === track.id
                          ? t('stop', 'Stop')
                          : t('preview', 'Preview')}
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      <p className="text-[12px] opacity-70">
        {t(
          'instagram_audio_preview_note',
          'Audio previews are separate from your video. Meta does not provide a preview of the final mix; volumes apply when it publishes. Catalog music cannot be reused on other platforms without separate rights.'
        )}
      </p>
    </div>
  );
};
