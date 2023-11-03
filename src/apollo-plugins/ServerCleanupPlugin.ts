import { Disposable } from 'graphql-ws';

export const ServerCleanupPlugin = (disposable: Disposable) => ({
  async serverWillStart() {
    return {
      async drainServer() {
        await disposable.dispose();
      },
    };
  },
});