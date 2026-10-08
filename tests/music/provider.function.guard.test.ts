import 'reflect-metadata';
import { IntegrationsController } from '../../apps/backend/src/api/routes/integrations.controller';
import { PublicIntegrationsController } from '../../apps/backend/src/public-api/routes/v1/public.integrations.controller';
import { socialIntegrationList } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { InstagramProvider } from '../../libraries/nestjs-libraries/src/integrations/social/instagram.provider';
import { getProviderFunction } from '../../libraries/nestjs-libraries/src/integrations/provider.function.guard';

// Controllers are real. Their services are isolated to prevent external writes,
// Redis connections and dependency boot while exercising the route dispatch.
jest.mock('@gitroom/nestjs-libraries/integrations/integration.manager', () => ({
  IntegrationManager: class {},
  socialIntegrationList: [],
}));
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service',
  () => ({ IntegrationService: class {} })
);
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/posts/posts.service',
  () => ({ PostsService: class {} })
);
jest.mock(
  '@gitroom/nestjs-libraries/integrations/refresh.integration.service',
  () => ({ RefreshIntegrationService: class {} })
);
jest.mock('@gitroom/nestjs-libraries/redis/redis.service', () => ({
  ioRedis: {},
}));
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/media/media.service',
  () => ({ MediaService: class {} })
);
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service',
  () => ({ NotificationService: class {} })
);
jest.mock('@gitroom/nestjs-libraries/upload/upload.factory', () => ({
  UploadFactory: { createStorage: jest.fn(() => ({})) },
}));
jest.mock('@gitroom/nestjs-libraries/upload/custom.upload.validation', () => ({
  CustomFileValidationPipe: class {
    transform(value: unknown) {
      return value;
    }
  },
}));
jest.mock(
  '@gitroom/nestjs-libraries/integrations/social/telegram.provider',
  () => ({ TelegramProvider: class {} })
);
jest.mock(
  '@gitroom/nestjs-libraries/integrations/social/moltbook.provider',
  () => ({ MoltbookProvider: class {} })
);
jest.mock('@gitroom/helpers/utils/timer', () => ({
  timer: jest.fn().mockResolvedValue(undefined),
}));
jest.mock(
  '@gitroom/nestjs-libraries/dtos/webhooks/ssrf.safe.dispatcher',
  () => ({ ssrfSafeDispatcher: jest.fn() })
);
jest.mock('@sentry/nestjs', () => ({ metrics: { count: jest.fn() } }));
jest.mock('file-type', () => ({ fromBuffer: jest.fn() }));

const org = { id: 'organization' } as any;
const integration = {
  id: 'integration',
  providerIdentifier: 'instagram',
  internalId: '222',
  token: 'PAGE_SECRET___USER_SECRET',
} as any;
const audioResult = [
  {
    id: '111',
    title: 'Fixture track',
    artist: 'Artist',
    audioType: 'music',
    isAdsEligible: null,
  },
];
let provider: InstagramProvider;
let service: any, manager: any, refresh: any;
let privateController: IntegrationsController,
  publicController: PublicIntegrationsController;

beforeEach(() => {
  provider = new InstagramProvider();
  socialIntegrationList.splice(0, socialIntegrationList.length, provider);
  service = {
    getIntegrationById: jest.fn().mockResolvedValue(integration),
    saveProviderPage: jest.fn().mockResolvedValue({ success: true }),
  };
  manager = {
    getSocialIntegration: jest.fn(() => provider),
    getAllTools: jest.fn(() => ({
      instagram: [{ methodName: 'audioSearch' }],
    })),
  };
  refresh = { refresh: jest.fn() };
  privateController = new IntegrationsController(
    manager,
    service,
    {} as any,
    refresh
  );
  publicController = new PublicIntegrationsController(
    service,
    {} as any,
    {} as any,
    {} as any,
    manager,
    refresh
  );
});
afterEach(() => jest.restoreAllMocks());

const blocked = [
  'fetchPageInformation',
  'authenticate',
  'refreshToken',
  'reConnect',
  'generateAuthUrl',
  'constructor',
  '__proto__',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
  '__defineGetter__',
  'post',
  'comment',
  'fetch',
  'runInConcurrent',
];

describe.each(['private', 'public'] as const)(
  '%s generic provider dispatch',
  (route) => {
    const call = (name: unknown, data: unknown = {}) =>
      route === 'private'
        ? privateController.functionIntegration(org, {
            id: 'integration',
            name,
            data,
          } as any)
        : publicController.triggerIntegrationTool(org, 'integration', {
            methodName: name,
            data,
          } as any);

    test.each(blocked)(
      'cannot invoke or return credentials from %s',
      async (name) => {
        const credentials = jest.fn().mockResolvedValue({
          access_token: integration.token,
          refresh_token: 'USER_SECRET',
        });
        Object.defineProperty(provider, name, {
          value: credentials,
          configurable: true,
        });
        // Even a mistakenly declared connection tool must not bypass the deny guard.
        manager.getAllTools.mockReturnValue({
          instagram: [{ methodName: name }],
        });
        await expect(
          call(name, { pageId: '333', id: '222' })
        ).rejects.toMatchObject({ status: 404 });
        expect(credentials).not.toHaveBeenCalled();
        expect(refresh.refresh).not.toHaveBeenCalled();
      }
    );

    test.each(['audioMetadata', 'unknownMethod', 'maxLength'])(
      'undeclared internal methods cannot be invoked: %s',
      async (name) => {
        const method = jest.fn().mockResolvedValue({ token: 'USER_SECRET' });
        Object.defineProperty(provider, name, {
          value: method,
          configurable: true,
        });
        await expect(call(name)).rejects.toMatchObject({ status: 404 });
        expect(method).not.toHaveBeenCalled();
      }
    );

    test.each([null, [], {}, 1])(
      'malformed method names never reach provider code',
      async (name) => {
        const fetchPage = jest.spyOn(provider, 'fetchPageInformation');
        await expect(call(name)).rejects.toMatchObject({ status: 404 });
        expect(fetchPage).not.toHaveBeenCalled();
      }
    );

    test('legitimate declared audioSearch receives only the scoped integration', async () => {
      const search = jest
        .spyOn(provider, 'audioSearch')
        .mockResolvedValue(audioResult as any);
      const data = { q: 'Artist', type: 'music' };
      const result = await call('audioSearch', data);
      expect(result).toEqual(
        route === 'private' ? audioResult : { output: audioResult }
      );
      expect(search).toHaveBeenCalledWith(
        integration.token,
        data,
        '222',
        integration
      );
      expect(service.getIntegrationById).toHaveBeenCalledWith(
        'organization',
        'integration'
      );
    });

    test('provider errors remain failures instead of false success responses', async () => {
      const failure = new Error('Fixture account discovery failed');
      jest.spyOn(provider, 'audioSearch').mockRejectedValue(failure);
      await expect(call('audioSearch')).rejects.toMatchObject({ status: 500 });
    });

    test('safe tool responses cannot return nested credential fields', async () => {
      jest.spyOn(provider, 'audioSearch').mockResolvedValue([
        {
          ...audioResult[0],
          accessToken: 'USER_SECRET',
          nested: { refresh_token: 'USER_SECRET', artist: 'Artist' },
        },
      ] as any);
      const result = await call('audioSearch');
      expect(JSON.stringify(result)).not.toMatch(
        /SECRET|accessToken|refresh_token/
      );
      expect(JSON.stringify(result)).toContain('Artist');
    });
  }
);

test('private composer keeps Instagram Page list without exposing selection credentials', async () => {
  const pages = jest.spyOn(provider, 'pages').mockResolvedValue([
    {
      id: '222',
      pageId: '333',
      name: 'Account',
      picture: { data: { url: '' } },
    },
  ]);
  expect(
    await privateController.functionIntegration(org, {
      id: 'integration',
      name: 'pages',
      data: {},
    })
  ).toEqual([
    {
      id: '222',
      pageId: '333',
      name: 'Account',
      picture: { data: { url: '' } },
    },
  ]);
  expect(pages).toHaveBeenCalledWith(integration.token, {}, '222', integration);
});

test('private Facebook Page list preserves selection metadata and strips Page credentials', async () => {
  const facebook = {
    identifier: 'facebook',
    pages: jest.fn().mockResolvedValue([
      {
        id: '333',
        name: 'Page',
        access_token: 'PAGE_SECRET',
        picture: { data: { url: '' }, authorization: 'USER_SECRET' },
      },
    ]),
  };
  manager.getSocialIntegration.mockReturnValue(facebook);
  manager.getAllTools.mockReturnValue({ facebook: [] });
  expect(
    await privateController.functionIntegration(org, {
      id: 'integration',
      name: 'pages',
      data: {},
    })
  ).toEqual([{ id: '333', name: 'Page', picture: { data: { url: '' } } }]);
  expect(facebook.pages).toHaveBeenCalledTimes(1);
});

test('public trigger exposes declared tools only, not composer connection selectors', async () => {
  const pages = jest.spyOn(provider, 'pages');
  await expect(
    publicController.triggerIntegrationTool(org, 'integration', {
      methodName: 'pages',
      data: {},
    })
  ).rejects.toMatchObject({ status: 404 });
  expect(pages).not.toHaveBeenCalled();
});

test('controlled saveProviderPage route still delegates exact authorized account selection', async () => {
  const selection = { id: '222', pageId: '333' };
  expect(
    await privateController.saveProviderPage(org, 'integration', selection)
  ).toEqual({ success: true });
  expect(service.saveProviderPage).toHaveBeenCalledWith(
    'organization',
    'integration',
    selection
  );
});

test('composer exceptions remain scoped to their own provider', () => {
  const companies = jest.fn();
  expect(
    getProviderFunction(
      { identifier: 'instagram', companies } as any,
      'companies',
      [],
      true
    )
  ).toBeUndefined();
  const linkedin = { identifier: 'linkedin-page', companies };
  const method = getProviderFunction(linkedin, 'companies', [], true)!;
  method('TOKEN', {}, 'id', integration);
  expect(companies).toHaveBeenCalledTimes(1);
});

test('dispatch does not evaluate a provider accessor or Object prototype method', () => {
  const getter = jest.fn();
  Object.defineProperty(provider, 'audioSearch', { get: getter });
  expect(
    getProviderFunction(provider, 'audioSearch', [
      { methodName: 'audioSearch' },
    ])
  ).toBeUndefined();
  expect(getter).not.toHaveBeenCalled();
});
