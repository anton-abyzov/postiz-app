import { useIntegration } from '@gitroom/frontend/components/launches/helpers/use.integration';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
export const useCustomProviderFunction = () => {
  const { integration } = useIntegration();
  const fetch = useFetch();
  const get = useCallback(
    async (funcName: string, customData?: any) => {
      const load = await fetch('/integrations/function', {
        method: 'POST',
        body: JSON.stringify({
          name: funcName,
          id: integration?.id!,
          data: customData,
        }),
      });
      if (!load.ok) {
        throw new Error('Failed to fetch');
      }
      return load.json();
    },
    [integration, fetch]
  );
  return {
    get,
  };
};
