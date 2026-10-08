import 'reflect-metadata';
import { InstagramProvider } from '../../libraries/nestjs-libraries/src/integrations/social/instagram.provider';
import { InstagramStandaloneProvider } from '../../libraries/nestjs-libraries/src/integrations/social/instagram.standalone.provider';

const account = {
  id: '222',
  username: 'fixture_account',
  name: 'Fixture account',
  profile_picture_url: 'https://images.example/profile.jpg',
};
const page = {
  id: '333',
  access_token: 'NEW_PAGE',
  instagram_business_account: { id: '222' },
};
const selection = { pageId: '333', id: '222' };
const response = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });
const parsed = (mock: jest.SpyInstance) =>
  mock.mock.calls.map(([url]) => new URL(url));

afterEach(() => jest.restoreAllMocks());

describe('Facebook Login account selection', () => {
  test.each(['USER', 'OLD_PAGE___USER'])(
    'persists the current Page and original User token from %s',
    async (token) => {
      const fetch = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(response(page))
        .mockResolvedValueOnce(response(account));
      const result = await new InstagramProvider().fetchPageInformation(
        token,
        selection
      );
      expect(result).toEqual({
        id: '222',
        name: 'Fixture account',
        picture: account.profile_picture_url,
        username: 'fixture_account',
        access_token: 'NEW_PAGE___USER',
      });
      const urls = parsed(fetch);
      expect(urls.map((url) => url.pathname)).toEqual([
        '/v25.0/333',
        '/v25.0/222',
      ]);
      expect(
        urls.every((url) => url.searchParams.get('access_token') === 'USER')
      ).toBe(true);
      expect(urls[0].searchParams.get('fields')).toContain(
        'instagram_business_account'
      );
    }
  );

  test.each([
    { ...page, access_token: undefined },
    { ...page, access_token: null },
    { ...page, access_token: '' },
    { ...page, access_token: ' ' },
    { ...page, id: '444' },
    { ...page, instagram_business_account: undefined },
    { ...page, instagram_business_account: { id: '999' } },
    { error: { message: 'fixture-secret-never-echo', code: 190 } },
  ])('failed Page selection cannot return credentials: %j', async (body) => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response(body));
    await expect(
      new InstagramProvider().fetchPageInformation('USER', selection)
    ).rejects.toThrow(/accessible Facebook Page/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test.each([
    { ...account, id: '444' },
    { ...account, username: undefined },
    { ...account, username: '' },
    { ...account, username: ' ' },
    { error: { message: 'fixture-secret-never-echo' } },
  ])(
    'failed account confirmation cannot return credentials: %j',
    async (body) => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(response(page))
        .mockResolvedValueOnce(response(body));
      await expect(
        new InstagramProvider().fetchPageInformation('USER', selection)
      ).rejects.toThrow(/did not confirm the selected account/);
    }
  );

  test.each([
    ['', selection],
    ['PAGE___', selection],
    ['PAGE___ ', selection],
    [' ', selection],
    ['USER', { ...selection, pageId: undefined }],
    ['USER', { ...selection, id: '0' }],
    ['USER', { ...selection, id: '222.0' }],
    ['USER', null],
  ])(
    'invalid selection is rejected before any request',
    async (token, data) => {
      const fetch = jest.spyOn(global, 'fetch');
      await expect(
        new InstagramProvider().fetchPageInformation(
          token as string,
          data as any
        )
      ).rejects.toThrow(/Select a valid/);
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  test('reconnection retains the current User and new Page credentials', async () => {
    const provider = new InstagramProvider();
    jest.spyOn(provider, 'pages').mockResolvedValue([
      {
        pageId: '333',
        id: '222',
        name: account.name,
        picture: { data: { url: account.profile_picture_url } },
      },
    ]);
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response(page))
      .mockResolvedValueOnce(response(account));
    expect(
      await provider.reConnect('root-user-id', '222', 'OLD_PAGE___USER')
    ).toEqual({
      id: '222',
      name: account.name,
      picture: account.profile_picture_url,
      username: account.username,
      accessToken: 'NEW_PAGE___USER',
    });
    expect(
      parsed(fetch).every(
        (url) => url.searchParams.get('access_token') === 'USER'
      )
    ).toBe(true);
  });

  test('reconnection cannot request or save an undefined Page', async () => {
    const provider = new InstagramProvider();
    jest.spyOn(provider, 'pages').mockResolvedValue([]);
    const fetch = jest.spyOn(global, 'fetch');
    await expect(
      provider.reConnect('root-user-id', '222', 'USER')
    ).rejects.toThrow(/accessible Facebook Page/);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('selection failures never echo provider error bodies or tokens', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        response({ error: { message: 'fixture-secret-never-echo' } })
      );
    try {
      await new InstagramProvider().fetchPageInformation(
        'USER_SECRET',
        selection
      );
      throw new Error('Expected selection to reject');
    } catch (error) {
      expect(String(error)).not.toContain('fixture-secret-never-echo');
      expect(String(error)).not.toContain('USER_SECRET');
    }
  });
});

describe.each([
  { stored: 'PAGE/&+___USER/&+', page: 'PAGE/&+', user: 'USER/&+' },
  { stored: 'LEGACY/&+', page: 'LEGACY/&+', user: 'LEGACY/&+' },
])('Token routing for $stored', ({ stored, page: pageToken, user }) => {
  test('Page/account discovery uses only the User credential', async () => {
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        response({
          data: [{ id: '333', instagram_business_account: { id: '222' } }],
        })
      )
      .mockResolvedValueOnce(response({ data: [] }))
      .mockResolvedValueOnce(response(account));
    const result = await new InstagramProvider().pages(stored);
    expect(result).toHaveLength(1);
    expect(result[0].pageId).toBe('333');
    const urls = parsed(fetch);
    expect(urls).toHaveLength(3);
    expect(
      urls.every((url) => url.searchParams.get('access_token') === user)
    ).toBe(true);
    expect(urls.every((url) => !url.toString().includes('___'))).toBe(true);
  });

  test('comments and permalink use only the Page credential', async () => {
    const provider = new InstagramProvider();
    const fetch = jest
      .spyOn(provider, 'fetch')
      .mockResolvedValueOnce(response({ id: 'comment' }))
      .mockResolvedValueOnce(
        response({ permalink: 'https://instagram.example/reel' })
      );
    await provider.comment(
      '222',
      'post',
      undefined,
      stored,
      [
        {
          id: 'comment-post',
          message: 'Comment',
          settings: { post_type: 'post' },
        },
      ] as any,
      {} as any
    );
    expect(
      parsed(fetch).map((url) => url.searchParams.get('access_token'))
    ).toEqual([pageToken, pageToken]);
  });

  test('account insights use only the Page credential', async () => {
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => response({ data: [] }));
    expect(await new InstagramProvider().analytics('222', stored, 7)).toEqual(
      []
    );
    expect(
      parsed(fetch).map((url) => url.searchParams.get('access_token'))
    ).toEqual([pageToken, pageToken]);
  });

  test('post insights use only the Page credential', async () => {
    const provider = new InstagramProvider();
    const fetch = jest
      .spyOn(provider, 'fetch')
      .mockResolvedValue(
        response({ data: [{ name: 'likes', values: [{ value: 3 }] }] })
      );
    const result = await provider.postAnalytics(
      'integration',
      stored,
      'post',
      7
    );
    expect(result[0].data[0].total).toBe('3');
    expect(parsed(fetch)[0].searchParams.get('access_token')).toBe(pageToken);
  });

  test('legacy music search uses only the User credential', async () => {
    const provider = new InstagramProvider();
    const fetch = jest
      .spyOn(provider, 'fetch')
      .mockResolvedValue(response({ data: [] }));
    await provider.music(stored, { q: 'Artist & track' });
    const url = parsed(fetch)[0];
    expect(url.pathname).toBe('/v25.0/music/search');
    expect(url.searchParams.get('q')).toBe('Artist & track');
    expect(url.searchParams.get('access_token')).toBe(user);
  });
});

test('Standalone delegated consumers continue using the plain Instagram token', async () => {
  const fetch = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async () => response({ data: [] }));
  expect(
    await new InstagramStandaloneProvider().analytics('222', 'STANDALONE', 7)
  ).toEqual([]);
  const urls = parsed(fetch);
  expect(urls.every((url) => url.hostname === 'graph.instagram.com')).toBe(
    true
  );
  expect(
    urls.every((url) => url.searchParams.get('access_token') === 'STANDALONE')
  ).toBe(true);
});

test('no credential extraction method is reachable through provider function dispatch', () => {
  const provider = new InstagramProvider() as any;
  for (const name of [
    'instagramPageToken',
    'instagramAudioUserToken',
    'pageToken',
    'userToken',
  ])
    expect(provider[name]).toBeUndefined();
});
