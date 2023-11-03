import * as fs from "fs/promises"
import * as path from "path"

export const BootstrapSchema = async(absoluteRootDir: string) => {
  let finalSchema = "";

  const files = await fs.readdir(absoluteRootDir, {recursive: true, withFileTypes: true});

  const schemas = files
    .filter(dirent => dirent.isFile() && dirent.name.endsWith(".graphql"))

  for(const schema of schemas) {
    const content = (await fs.readFile(path.join(schema.path, schema.name))).toString()
    finalSchema += content;

    if(!content.endsWith('\n')) {
      finalSchema += '\n';
    }

    finalSchema += '\n';
  }

  if(finalSchema.length === 0) {
    throw new Error(`Directory '${absoluteRootDir}' does not contain any *.graphql files`);
  }

  return finalSchema;
}
