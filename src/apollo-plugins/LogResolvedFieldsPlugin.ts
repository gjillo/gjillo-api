export const LogResolvedFieldsPlugin = () => ({
  async requestDidStart() {
    return {
      async executionDidStart() {
        return {
          willResolveField({ info }) {
            console.info('Resolving', info.operation.operation, info.fieldName);
          },
        };
      },
    };
  },
});