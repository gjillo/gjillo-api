import * as fs from 'fs/promises';
import * as path from 'path';
import { mergeResolvers } from '@graphql-tools/merge';

export const BootstrapResolvers = async (absoluteRootDir: string) => {
  const resolversArray = [];

  const files = await fs.readdir(absoluteRootDir, {
    recursive: true,
    withFileTypes: true,
  });

  const resolvers = files.filter(
    (dirent) => dirent.isFile() && dirent.name.endsWith('.resolver.js')
  );

  for (const resolver of resolvers) {
    const content = await import(path.join(resolver.path, resolver.name));

    if (!content) {
      continue;
    }

    if (content.resolver) {
      resolversArray.push(content.resolver);
    }
    if (content.mutation) {
      resolversArray.push(content.mutation);
    }
    if (content.subscription) {
      resolversArray.push({ Subscription: content.subscription });
    }
  }

  if(resolversArray.length === 0) {
    throw new Error(`Directory '${absoluteRootDir}' does not contain any *.resolver.ts files`);
  }

  return mergeResolvers(resolversArray);
};
