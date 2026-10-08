import 'reflect-metadata';
import { UsersController } from '../../apps/backend/src/api/routes/users.controller';
import { IntegrationRepository } from '../../libraries/nestjs-libraries/src/database/prisma/integrations/integration.repository';

// Invoke the actual controller/repository with inert services. Importing the
// regression must not initialize database, payment, tracking or upload clients.
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service',
  () => ({ SubscriptionService: class {} })
);
jest.mock('@gitroom/nestjs-libraries/services/stripe.service', () => ({
  StripeService: class {},
}));
jest.mock('@gitroom/backend/services/auth/auth.service', () => ({
  AuthService: class {},
}));
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service',
  () => ({ OrganizationService: class {} })
);
jest.mock(
  '@gitroom/nestjs-libraries/database/prisma/users/users.service',
  () => ({ UsersService: class {} })
);
jest.mock('@gitroom/nestjs-libraries/track/track.service', () => ({
  TrackService: class {},
}));
jest.mock('@gitroom/nestjs-libraries/database/prisma/prisma.service', () => ({
  PrismaRepository: class {},
}));
jest.mock('@gitroom/nestjs-libraries/upload/upload.factory', () => ({
  UploadFactory: { createStorage: jest.fn(() => ({})) },
}));

describe('Organization response credential boundary', () => {
  test.each(['USER', 'ADMIN', 'SUPERADMIN'])(
    '%s receives only enabled organization selector fields',
    async (role) => {
      const subscription = {
        subscriptionTier: 'PRO',
        totalChannels: 5,
        isLifetime: false,
        createdAt: new Date('2026-10-01T00:00:00Z'),
      };
      const organization = {
        id: 'fixture-organization',
        name: 'Fixture workspace',
        users: [{ disabled: false, role }],
        subscription,
        apiKey: 'fixture-private-api-key',
        paymentId: 'fixture-payment-id',
        allowTrial: false,
        internalOnlyScalar: 'fixture-future-private-field',
      };
      const disabledOrganization = {
        ...organization,
        id: 'fixture-disabled-organization',
        users: [{ disabled: true, role }],
      };
      const service = {
        getOrgsByUserId: jest
          .fn()
          .mockResolvedValue([organization, disabledOrganization]),
      };
      const controller = new UsersController(
        {} as any,
        {} as any,
        {} as any,
        service as any,
        {} as any,
        {} as any
      );

      const response = await controller.getOrgs({ id: 'fixture-user' } as any);

      expect(service.getOrgsByUserId).toHaveBeenCalledWith('fixture-user');
      expect(response).toEqual([
        {
          id: organization.id,
          name: organization.name,
          users: organization.users,
          subscription,
        },
      ]);
      expect(Object.keys(response[0]).sort()).toEqual([
        'id',
        'name',
        'subscription',
        'users',
      ]);
      expect(JSON.stringify(response)).not.toMatch(
        /fixture-private|fixture-payment|fixture-future/
      );
      // Restrict the HTTP response, preserving repository data used by auth.
      expect(organization.apiKey).toBe('fixture-private-api-key');
    }
  );

  test('preserves an enabled workspace with no subscription', async () => {
    const controller = new UsersController(
      {} as any,
      {} as any,
      {} as any,
      {
        getOrgsByUserId: jest.fn().mockResolvedValue([
          {
            id: 'fixture-free-organization',
            name: 'Free workspace',
            users: [{ disabled: false, role: 'USER' }],
            subscription: null,
            apiKey: 'fixture-private-api-key',
          },
        ]),
      } as any,
      {} as any,
      {} as any
    );

    await expect(
      controller.getOrgs({ id: 'fixture-user' } as any)
    ).resolves.toEqual([
      {
        id: 'fixture-free-organization',
        name: 'Free workspace',
        users: [{ disabled: false, role: 'USER' }],
        subscription: null,
      },
    ]);
  });
});

describe('Deleted integration response credential boundary', () => {
  test('scopes the soft delete to the organization and selects only its ID', async () => {
    const integration = {
      id: 'fixture-integration',
      organizationId: 'fixture-organization',
      token: 'fixture-page-token___fixture-user-token',
      refreshToken: 'fixture-refresh-token',
      providerIdentifier: 'instagram',
      deletedAt: null,
    };
    const update = jest.fn(async (args) => {
      if (
        args.where.id !== integration.id ||
        args.where.organizationId !== integration.organizationId
      ) {
        throw new Error('Fixture integration is outside the organization');
      }
      const record = { ...integration, ...args.data };
      // Model Prisma's response selection instead of always returning a safe
      // fixture, so the original unselected update exposes credentials here.
      return args.select
        ? Object.fromEntries(
            Object.keys(args.select)
              .filter((key) => args.select[key] === true)
              .map((key) => [key, record[key]])
          )
        : record;
    });
    const repository = new IntegrationRepository(
      { model: { integration: { update } } } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    const response = await repository.deleteChannel(
      'fixture-organization',
      'fixture-integration'
    );

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        id: 'fixture-integration',
        organizationId: 'fixture-organization',
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(response).toEqual({ id: 'fixture-integration' });
    expect(response).not.toHaveProperty('token');
    expect(response).not.toHaveProperty('refreshToken');

    await expect(
      repository.deleteChannel(
        'fixture-other-organization',
        'fixture-integration'
      )
    ).rejects.toThrow('Fixture integration is outside the organization');
  });
});
