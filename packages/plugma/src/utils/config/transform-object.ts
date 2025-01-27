import type { ManifestFile, PluginOptions } from '#core/types';

/**
 * Transforms network access configuration in the manifest
 * @param input - The manifest file to transform, can be undefined
 * @param options - Plugin configuration options
 * @returns Transformed manifest file
 */

export function transformObject(
  input: ManifestFile | undefined,
  options: PluginOptions,
): ManifestFile {
  if (!input) {
    throw new Error('No manifest found in manifest.json or package.json');
  }

  const transformed = JSON.parse(JSON.stringify(input));

  if (transformed?.networkAccess?.devAllowedDomains) {
    transformed.networkAccess.devAllowedDomains =
      transformed.networkAccess.devAllowedDomains.map((domain: string) => {
        if (
          domain === 'http://localhost:*' ||
          domain === 'https://localhost:*'
        ) {
          return domain.replace('*', options.port.toString());
        }
        return domain;
      });
  }

  return transformed;
}
