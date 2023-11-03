import fs from 'fs/promises';
import path from 'path';
import os from "os";
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
    const modulePath = path.join(
      os.platform() === "win32" ? "file://" : "", resolver.path, resolver.name);
    const content = await import(modulePath);

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
