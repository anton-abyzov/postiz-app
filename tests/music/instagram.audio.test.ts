import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InstagramDto } from '../../libraries/nestjs-libraries/src/dtos/posts/providers-settings/instagram.dto';
import { InstagramProvider } from '../../libraries/nestjs-libraries/src/integrations/social/instagram.provider';
import { InstagramStandaloneProvider } from '../../libraries/nestjs-libraries/src/integrations/social/instagram.standalone.provider';
import { normalizeInstagramAudio } from '../../libraries/nestjs-libraries/src/integrations/social/instagram.audio';

jest.mock('@gitroom/helpers/utils/timer', () => ({
  timer: jest.fn().mockResolvedValue(undefined),
}));

const metadata = (eligible: boolean | null = true) => ({
  audio_id: '111',
  audio_type: 'music',
  title: 'Chosen track',
  display_artist: 'Artist',
  is_ads_eligible: eligible,
  on_platform_audio_preview_link: 'https://www.instagram.com/reels/audio/111/',
});
const integration = {
  internalId: '222',
  providerIdentifier: 'instagram',
} as any;
const selectedPost = (audio: any = { id: '111', audioType: 'music' }) =>
  [
    {
      id: 'post-one',
      message: 'A caption',
      settings: { post_type: 'post', audio },
      media: [{ path: 'https://media.example/clip.MP4?v=1' }],
    },
  ] as any;
const jsonResponse = (body: any) => ({ json: async () => body } as any);

function mockPublishing(
  provider: InstagramProvider,
  audioMetadata = metadata()
) {
  return jest
    .spyOn(provider, 'fetch')
    .mockImplementation(async (url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/v25.0/111') return jsonResponse(audioMetadata);
      if (parsed.pathname === '/v25.0/222/media')
        return jsonResponse({ id: 'container' });
      if (parsed.pathname === '/v25.0/container')
        return jsonResponse({ status_code: 'FINISHED' });
      if (parsed.pathname === '/v25.0/222/media_publish')
        return jsonResponse({ id: 'published' });
      if (parsed.pathname === '/v25.0/published')
        return jsonResponse({
          permalink: 'https://www.instagram.com/reel/mock/',
        });
      throw new Error('Unexpected mocked URL');
    });
}

beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterAll(() => jest.restoreAllMocks());

describe('Instagram audio validation', () => {
  test.each(['', '0', '1.5', '1e8', ' 111', 111, undefined])(
    'DTO rejects malformed ID %s',
    async (id) => {
      const dto = plainToInstance(InstagramDto, {
        post_type: 'post',
        audio: { id },
      });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    }
  );
  test.each([0.5, '', '0', null, -1, 101, Infinity, NaN])(
    'DTO rejects invalid volume %s',
    async (audio_volume) => {
      const dto = plainToInstance(InstagramDto, {
        post_type: 'post',
        audio: { id: '111', audio_volume },
      });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    }
  );
  test('DTO accepts an exact ID and zero volumes', async () => {
    const dto = plainToInstance(InstagramDto, {
      post_type: 'post',
      audio: {
        id: '111',
        audio_volume: 0,
        video_volume: 0,
        use_for_ads: false,
      },
    });
    expect(await validate(dto)).toEqual([]);
  });
  test.each([
    {},
    [],
    '111',
    false,
    { id: '111', audio_volume: 0.5 },
    { id: '111', use_for_ads: 'yes' },
  ])(
    'runtime rejects malformed audio before any network call: %j',
    async (audio) => {
      const provider = new InstagramProvider();
      const fetch = jest.spyOn(provider, 'fetch');
      await expect(
        provider.post('222', 'PAGE___USER', selectedPost(audio), integration)
      ).rejects.toThrow();
      expect(fetch).not.toHaveBeenCalled();
    }
  );
  test.each([
    { post_type: 'story', media: [{ path: 'https://m.example/clip.mp4' }] },
    { post_type: 'post', media: [{ path: 'https://m.example/photo.jpg' }] },
    { post_type: 'post', media: [{ path: 'https://m.example/clip.mp4.jpg' }] },
    {
      post_type: 'post',
      media: [
        { path: 'https://m.example/clip.mp4' },
        { path: 'https://m.example/second.mp4' },
      ],
    },
  ])(
    'audio cannot be used for unsupported content %j',
    async ({ post_type, media }) => {
      const provider = new InstagramProvider();
      expect(
        await provider.checkValidity([media], {
          post_type,
          audio: { id: '111' },
        })
      ).not.toBe(true);
      const post = selectedPost();
      post[0].settings.post_type = post_type;
      post[0].media = media;
      const fetch = jest.spyOn(provider, 'fetch');
      await expect(
        provider.post('222', 'PAGE___USER', post, integration)
      ).rejects.toThrow();
      expect(fetch).not.toHaveBeenCalled();
    }
  );
  test('standalone validation and direct publication reject selected audio', async () => {
    const provider = new InstagramStandaloneProvider();
    expect(
      await provider.checkValidity(
        [selectedPost()[0].media],
        selectedPost()[0].settings
      )
    ).toMatch(/Facebook Login/);
    await expect(
      provider.post('222', 'USER', selectedPost(), {
        ...integration,
        providerIdentifier: 'instagram-standalone',
      })
    ).rejects.toThrow(/Facebook Login/);
  });
  test('an MP4 with uppercase extension and query is accepted', async () => {
    const provider = new InstagramProvider();
    expect(
      await provider.checkValidity(
        [selectedPost()[0].media],
        selectedPost()[0].settings
      )
    ).toBe(true);
  });
});

describe('Current account music at publication', () => {
  test('rereads live metadata then sends only audio configuration, preserving zeros and using User token', async () => {
    const provider = new InstagramProvider();
    const fetch = mockPublishing(provider);
    await provider.post(
      '222',
      'PAGE___USER',
      selectedPost({
        id: '111',
        audioType: 'music',
        audio_volume: 0,
        video_volume: 0,
        use_for_ads: true,
        isAdsEligible: false,
      }),
      integration
    );
    const urls = fetch.mock.calls.map((args) => new URL(args[0]));
    expect(urls[0].pathname).toBe('/v25.0/111');
    expect(urls[0].searchParams.get('user_id')).toBe('222');
    expect(
      urls.every((url) => url.searchParams.get('access_token') === 'USER')
    ).toBe(true);
    const container = urls.find((url) => url.pathname === '/v25.0/222/media')!;
    expect(
      JSON.parse(container.searchParams.get('audio_configuration')!)
    ).toEqual({ audio_id: '111', audio_volume: 0, video_volume: 0 });
  });
  test.each([false, null, undefined])(
    'paid use fails closed on live eligibility %s despite a client claim',
    async (eligible) => {
      const provider = new InstagramProvider();
      const response = metadata();
      response.is_ads_eligible = eligible as any;
      const fetch = mockPublishing(provider, response);
      await expect(
        provider.post(
          '222',
          'PAGE___USER',
          selectedPost({ id: '111', use_for_ads: true, isAdsEligible: true }),
          integration
        )
      ).rejects.toThrow(/eligible for ads/);
      expect(fetch.mock.calls).toHaveLength(1);
      expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/v25.0/111');
    }
  );
  test('unknown ads eligibility still allows an organic selection', async () => {
    const provider = new InstagramProvider();
    const fetch = mockPublishing(provider, metadata(null));
    await provider.post(
      '222',
      'PAGE___USER',
      selectedPost({ id: '111', use_for_ads: false }),
      integration
    );
    expect(
      fetch.mock.calls.some((call) =>
        new URL(call[0]).pathname.endsWith('/media')
      )
    ).toBe(true);
  });
  test.each([
    { internalId: '333', providerIdentifier: 'instagram' },
    { internalId: '222', providerIdentifier: 'instagram-standalone' },
  ])(
    'rejects mismatched integration %j before metadata or publication',
    async (account) => {
      const provider = new InstagramProvider();
      const fetch = jest.spyOn(provider, 'fetch');
      await expect(
        provider.post('222', 'PAGE___USER', selectedPost(), account as any)
      ).rejects.toThrow(/selected Instagram account/);
      expect(fetch).not.toHaveBeenCalled();
    }
  );
  test('provider methods cannot expose the stored token through legacy function dispatch', () => {
    expect((new InstagramProvider() as any).audioUserToken).toBeUndefined();
  });
  test('a valid plain User token is authoritatively checked, without requiring a separator', async () => {
    const provider = new InstagramProvider();
    const fetch = mockPublishing(provider);
    await provider.post('222', 'PLAIN_USER', selectedPost(), integration);
    expect(
      fetch.mock.calls.every(
        (call) =>
          new URL(call[0]).searchParams.get('access_token') === 'PLAIN_USER'
      )
    ).toBe(true);
  });
  test('a token rejected by Meta cannot create a container', async () => {
    const provider = new InstagramProvider();
    const fetch = mockPublishing(provider, {
      error: { message: 'User token required' },
    } as any);
    await expect(
      provider.post('222', 'PAGE', selectedPost(), integration)
    ).rejects.toThrow(/refused/);
    expect(fetch.mock.calls).toHaveLength(1);
  });
  test.each([
    { ...metadata(), audio_id: '444' },
    { ...metadata(), audio_type: 'original_sound' },
    { error: { message: 'Provider rejected catalog' } },
    {},
  ])(
    'changed or unavailable metadata creates no container: %j',
    async (response) => {
      const provider = new InstagramProvider();
      const fetch = mockPublishing(provider, response as any);
      await expect(
        provider.post('222', 'PAGE___USER', selectedPost(), integration)
      ).rejects.toThrow();
      expect(fetch.mock.calls).toHaveLength(1);
    }
  );
  test('audio-free posts still use the Page token and skip the audio API', async () => {
    const provider = new InstagramProvider();
    const fetch = mockPublishing(provider);
    await provider.post('222', 'PAGE___USER', selectedPost(null), integration);
    expect(
      fetch.mock.calls.map((call) =>
        new URL(call[0]).searchParams.get('access_token')
      )
    ).toEqual(['PAGE', 'PAGE', 'PAGE', 'PAGE']);
    expect(
      fetch.mock.calls.some(
        (call) => new URL(call[0]).pathname === '/v25.0/111'
      )
    ).toBe(false);
  });
});

describe('Catalog search', () => {
  test('uses current account/User token and preserves nullable eligibility and platform link', async () => {
    const provider = new InstagramProvider();
    const fetch = jest
      .spyOn(provider, 'fetch')
      .mockResolvedValue(jsonResponse({ audio: [metadata(null)] }));
    const result = await provider.audioSearch(
      'PAGE___USER',
      { q: 'Artist & song', type: 'music' },
      '222'
    );
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/v25.0/ig_audio');
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({
      audio_type: 'music',
      user_id: '222',
      access_token: 'USER',
      search_query: 'Artist & song',
    });
    expect(result[0]).toMatchObject({
      id: '111',
      audioType: 'music',
      isAdsEligible: null,
      onPlatformPreviewLink: metadata().on_platform_audio_preview_link,
    });
  });
  test('an explicitly empty audio list is a valid catalog result', async () => {
    const provider = new InstagramProvider();
    jest
      .spyOn(provider, 'fetch')
      .mockResolvedValue(jsonResponse({ audio: [] }));
    expect(await provider.audioSearch('PAGE___USER', {}, '222')).toEqual([]);
  });
  test.each([
    { error: { message: 'No permission' } },
    {},
    { audio: {} },
    { audio: [{ title: 'No ID' }] },
  ])(
    'errors are never passed off as an empty catalog: %j',
    async (response) => {
      const provider = new InstagramProvider();
      jest.spyOn(provider, 'fetch').mockResolvedValue(jsonResponse(response));
      await expect(
        provider.audioSearch('PAGE___USER', {}, '222')
      ).rejects.toThrow();
    }
  );
  test('network failure is explicit', async () => {
    const provider = new InstagramProvider();
    jest.spyOn(provider, 'fetch').mockRejectedValue(new Error('failed'));
    await expect(
      provider.audioSearch('PAGE___USER', {}, '222')
    ).rejects.toThrow(/unavailable/);
  });
  test('normalization never promotes missing ads eligibility to true', () => {
    expect(
      normalizeInstagramAudio({ audio_id: '111', audio_type: 'original_sound' })
        .isAdsEligible
    ).toBeNull();
  });
});
